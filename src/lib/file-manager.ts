import { promises as fs } from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import * as mime from 'mime-types';

export interface FileInfo {
  id: string;
  originalName: string;
  fileName: string;
  filePath: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export class FileManager {
  private uploadsDir: string;
  private outputsDir: string;
  private tempDir: string;

  constructor(baseDir = './uploads') {
    this.uploadsDir = path.join(baseDir, 'uploads');
    this.outputsDir = path.join(baseDir, 'outputs');
    this.tempDir = path.join(baseDir, 'temp');
  }

  async initialize(): Promise<void> {
    // Create directories if they don't exist
    await Promise.all([
      this.ensureDirectory(this.uploadsDir),
      this.ensureDirectory(this.outputsDir),
      this.ensureDirectory(this.tempDir),
    ]);
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async saveUploadedFile(
    buffer: Uint8Array | Buffer,
    originalName: string,
    mimeType?: string
  ): Promise<FileInfo> {
    await this.initialize();

    const id = uuidv4();
    const extension = path.extname(originalName);
    const fileName = `${id}${extension}`;
    const filePath = path.join(this.uploadsDir, fileName);

    // Detect MIME type if not provided
    const detectedMimeType = mimeType || mime.lookup(originalName) || 'application/octet-stream';

    // Write file to disk
    await fs.writeFile(filePath, buffer);

    const stats = await fs.stat(filePath);

    return {
      id,
      originalName,
      fileName,
      filePath,
      size: stats.size,
      mimeType: detectedMimeType,
      uploadedAt: new Date(),
    };
  }

  async createOutputDirectory(fileId: string): Promise<string> {
    const outputDir = path.join(this.outputsDir, fileId);
    await this.ensureDirectory(outputDir);
    return outputDir;
  }

  async saveProcessedFile(
    fileId: string,
    trackType: 'vocals' | 'music' | 'original',
    buffer: Uint8Array | Buffer,
    extension = '.mp4'
  ): Promise<string> {
    const outputDir = await this.createOutputDirectory(fileId);
    const fileName = `${trackType}${extension}`;
    const filePath = path.join(outputDir, fileName);

    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  async getProcessedFiles(fileId: string): Promise<{
    vocals?: string;
    music?: string;
    original?: string;
  }> {
    const outputDir = path.join(this.outputsDir, fileId);
    const files: any = {};

    try {
      const dirEntries = await fs.readdir(outputDir);
      
      for (const entry of dirEntries) {
        const filePath = path.join(outputDir, entry);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          const name = path.parse(entry).name;
          if (['vocals', 'music', 'original'].includes(name)) {
            // Return public URL path
            files[name] = `/api/download/${fileId}/${entry}`;
          }
        }
      }
    } catch (error) {
      console.error(`Error reading output directory for ${fileId}:`, error);
    }

    return files;
  }

  async getFileBuffer(filePath: string): Promise<Buffer | Uint8Array> {
    return await fs.readFile(filePath);
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
    }
  }

  async deleteDirectory(dirPath: string): Promise<void> {
    try {
      await fs.rmdir(dirPath, { recursive: true });
    } catch (error) {
      console.error(`Error deleting directory ${dirPath}:`, error);
    }
  }

  async cleanupFile(fileId: string): Promise<void> {
    // Delete output directory
    const outputDir = path.join(this.outputsDir, fileId);
    
    await Promise.all([
      this.deleteDirectory(outputDir),
      // Note: We'd need glob matching for uploaded files with unknown extensions
      // For now, this is a simplified cleanup
    ]);
  }

  async getTempFilePath(fileId: string, suffix = ''): Promise<string> {
    await this.initialize();
    return path.join(this.tempDir, `${fileId}${suffix}`);
  }

  async cleanupOldFiles(maxAgeHours = 24): Promise<void> {
    const maxAge = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    const directories = [this.uploadsDir, this.outputsDir, this.tempDir];
    
    for (const dir of directories) {
      try {
        const entries = await fs.readdir(dir);
        
        for (const entry of entries) {
          const entryPath = path.join(dir, entry);
          const stats = await fs.stat(entryPath);
          
          if (stats.mtime.getTime() < maxAge) {
            if (stats.isDirectory()) {
              await this.deleteDirectory(entryPath);
            } else {
              await this.deleteFile(entryPath);
            }
          }
        }
      } catch (error) {
        console.error(`Error cleaning up directory ${dir}:`, error);
      }
    }
  }

  // Validation helpers
  isValidAudioVideoFile(mimeType: string, fileName: string): boolean {
    const validMimeTypes = [
      'audio/mpeg',        // MP3
      'audio/wav',         // WAV
      'audio/x-wav',       // WAV
      'audio/mp4',         // M4A
      'audio/aac',         // AAC
      'audio/ogg',         // OGG
      'video/mp4',         // MP4
      'video/avi',         // AVI
      'video/quicktime',   // MOV
      'video/x-msvideo',   // AVI
    ];

    const validExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.mp4', '.avi', '.mov'];
    const extension = path.extname(fileName).toLowerCase();

    return validMimeTypes.includes(mimeType) || validExtensions.includes(extension);
  }

  getFileSize(size: number): { readable: string; bytes: number } {
    const units = ['B', 'KB', 'MB', 'GB'];
    let index = 0;
    let fileSize = size;

    while (fileSize >= 1024 && index < units.length - 1) {
      fileSize /= 1024;
      index++;
    }

    return {
      readable: `${Math.round(fileSize * 100) / 100} ${units[index]}`,
      bytes: size,
    };
  }
}

// Singleton instance
export const fileManager = new FileManager();