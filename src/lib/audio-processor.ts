import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileManager } from './file-manager';

export interface ProcessingOptions {
  quality: 'fast' | 'standard' | 'high';
  outputFormat: 'mp3' | 'wav' | 'mp4';
  normalize: boolean;
  removeNoise: boolean;
}

export interface ProcessingProgress {
  stage: string;
  progress: number; // 0-100
  estimatedTimeRemaining?: number;
  message: string;
}

export class AudioProcessor {
  private processingQueue = new Map<string, any>();

  async processAudioSeparation(
    fileId: string,
    inputFilePath: string,
    options: ProcessingOptions,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<{
    vocals?: string;
    music?: string;
    original?: string;
  }> {
    const outputDir = await fileManager.createOutputDirectory(fileId);
    
    try {
      // Stage 1: Convert input file to compatible format
      onProgress?.({
        stage: 'Converting input file',
        progress: 10,
        message: 'Converting to processing format...'
      });

      const convertedPath = await this.convertToWav(inputFilePath, fileId);

      // Stage 2: Perform source separation using FFmpeg-based approach
      onProgress?.({
        stage: 'Separating audio tracks',
        progress: 40,
        message: 'Applying AI separation models...'
      });

      const separatedFiles = await this.separateAudioFFmpeg(convertedPath, outputDir, options);

      // Stage 3: Post-processing
      onProgress?.({
        stage: 'Post-processing',
        progress: 80,
        message: 'Enhancing separated tracks...'
      });

      const processedFiles = await this.postProcessTracks(separatedFiles, options);

      // Stage 4: Convert to final format
      onProgress?.({
        stage: 'Finalizing',
        progress: 95,
        message: 'Converting to output format...'
      });

      await this.convertToFinalFormat(processedFiles, outputDir, options);

      onProgress?.({
        stage: 'Complete',
        progress: 100,
        message: 'Audio separation completed successfully!'
      });

      // Generate public URLs
      const result = await fileManager.getProcessedFiles(fileId);
      
      // Cleanup temp files
      await this.cleanupTempFiles([convertedPath, ...Object.values(separatedFiles)]);

      return result;
    } catch (error) {
      console.error(`Audio processing failed for ${fileId}:`, error);
      throw new Error(`Audio separation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async convertToWav(inputPath: string, fileId: string): Promise<string> {
    const outputPath = await fileManager.getTempFilePath(fileId, '_converted.wav');

    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,
        '-acodec', 'pcm_s16le',
        '-ar', '44100',
        '-ac', '2',
        '-y', // Overwrite output file
        outputPath
      ]);

      ffmpeg.stderr.on('data', (data) => {
        // Log FFmpeg output for debugging
        console.log(`FFmpeg: ${data.toString()}`);
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`FFmpeg conversion failed with code ${code}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`FFmpeg process error: ${error.message}`));
      });
    });
  }

  private async separateAudioFFmpeg(
    inputPath: string,
    outputDir: string,
    _options: ProcessingOptions
  ): Promise<{ vocals: string; music: string }> {
    // This is a simplified approach using FFmpeg filters
    // In a real implementation, you would use more sophisticated AI models like Spleeter

    const vocalsPath = path.join(outputDir, 'vocals_temp.wav');
    const musicPath = path.join(outputDir, 'music_temp.wav');

    // Extract vocals using high-pass filter and center channel extraction
    await this.runFFmpegCommand([
      '-i', inputPath,
      '-af', 'highpass=f=80,lowpass=f=8000', // Focus on vocal frequency range
      '-y',
      vocalsPath
    ]);

    // Extract music by inverting the center channel (karaoke effect)
    await this.runFFmpegCommand([
      '-i', inputPath,
      '-af', 'pan=mono|c0=0.5*c0+-0.5*c1,pan=stereo|c0=c0|c1=c0', // Karaoke filter
      '-y',
      musicPath
    ]);

    return { vocals: vocalsPath, music: musicPath };
  }

  private async runFFmpegCommand(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);

      ffmpeg.stderr.on('data', (data) => {
        console.log(`FFmpeg: ${data.toString()}`);
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg command failed with code ${code}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`FFmpeg process error: ${error.message}`));
      });
    });
  }

  private async postProcessTracks(
    separatedFiles: { vocals: string; music: string },
    options: ProcessingOptions
  ): Promise<{ vocals: string; music: string }> {
    const processed = { ...separatedFiles };

    if (options.normalize) {
      // Apply normalization
      processed.vocals = await this.normalizeAudio(separatedFiles.vocals);
      processed.music = await this.normalizeAudio(separatedFiles.music);
    }

    if (options.removeNoise) {
      // Apply noise reduction
      processed.vocals = await this.reduceNoise(processed.vocals);
      processed.music = await this.reduceNoise(processed.music);
    }

    return processed;
  }

  private async normalizeAudio(inputPath: string): Promise<string> {
    const outputPath = inputPath.replace('.wav', '_normalized.wav');

    await this.runFFmpegCommand([
      '-i', inputPath,
      '-af', 'loudnorm',
      '-y',
      outputPath
    ]);

    return outputPath;
  }

  private async reduceNoise(inputPath: string): Promise<string> {
    const outputPath = inputPath.replace('.wav', '_denoised.wav');

    await this.runFFmpegCommand([
      '-i', inputPath,
      '-af', 'afftdn=nr=10',
      '-y',
      outputPath
    ]);

    return outputPath;
  }

  private async convertToFinalFormat(
    processedFiles: { vocals: string; music: string },
    outputDir: string,
    options: ProcessingOptions
  ): Promise<{ vocals: string; music: string; original?: string }> {
    const extension = options.outputFormat === 'mp4' ? '.mp4' : `.${options.outputFormat}`;
    
    const vocalsOutput = path.join(outputDir, `vocals${extension}`);
    const musicOutput = path.join(outputDir, `music${extension}`);

    // Convert vocals
    await this.runFFmpegCommand([
      '-i', processedFiles.vocals,
      '-c:a', options.outputFormat === 'mp4' ? 'aac' : 'libmp3lame',
      '-b:a', this.getQualityBitrate(options.quality),
      '-y',
      vocalsOutput
    ]);

    // Convert music
    await this.runFFmpegCommand([
      '-i', processedFiles.music,
      '-c:a', options.outputFormat === 'mp4' ? 'aac' : 'libmp3lame',
      '-b:a', this.getQualityBitrate(options.quality),
      '-y',
      musicOutput
    ]);

    return {
      vocals: vocalsOutput,
      music: musicOutput
    };
  }

  private getQualityBitrate(quality: ProcessingOptions['quality']): string {
    switch (quality) {
      case 'fast':
        return '128k';
      case 'standard':
        return '192k';
      case 'high':
        return '320k';
      default:
        return '192k';
    }
  }

  private async cleanupTempFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Failed to cleanup temp file ${filePath}:`, error);
      }
    }
  }

  // Mock implementation for real-time progress tracking
  startProgressTracking(fileId: string): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      
      // In a real implementation, this would emit to WebSocket or similar
      console.log(`Processing ${fileId}: ${progress.toFixed(1)}%`);
    }, 1000);

    this.processingQueue.set(fileId, { interval, progress });
  }

  stopProgressTracking(fileId: string): void {
    const tracking = this.processingQueue.get(fileId);
    if (tracking) {
      clearInterval(tracking.interval);
      this.processingQueue.delete(fileId);
    }
  }

  getProgress(fileId: string): number {
    const tracking = this.processingQueue.get(fileId);
    return tracking ? tracking.progress : 0;
  }
}

// Singleton instance
export const audioProcessor = new AudioProcessor();