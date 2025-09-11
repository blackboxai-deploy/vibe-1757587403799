import { NextRequest, NextResponse } from 'next/server';
import { fileManager } from '@/lib/file-manager';
import { AudioFile, ProcessingStatus } from '@/types/audio';
import { saveFile, updateFile } from '@/lib/file-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 100MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!fileManager.isValidAudioVideoFile(file.type, file.name)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unsupported file format. Please upload MP3, MP4, WAV, M4A, AVI, or MOV files.' 
        },
        { status: 400 }
      );
    }

    // Convert File to Buffer - using Uint8Array for better compatibility
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Save file using file manager
    const fileInfo = await fileManager.saveUploadedFile(
      buffer,
      file.name,
      file.type
    );

    // Create AudioFile object
    const audioFile: AudioFile = {
      id: fileInfo.id,
      name: fileInfo.fileName,
      originalName: fileInfo.originalName,
      size: fileInfo.size,
      mimeType: fileInfo.mimeType,
      uploadedAt: fileInfo.uploadedAt,
      status: ProcessingStatus.QUEUED,
      outputFiles: undefined
    };

    // Store in memory (in production, save to database)
    saveFile(audioFile);

    // Trigger background processing
    processFileAsync(audioFile.id, fileInfo.filePath);

    return NextResponse.json({
      success: true,
      file: audioFile,
      message: 'File uploaded successfully and queued for processing'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
}

// Background processing function
async function processFileAsync(fileId: string, _filePath: string) {
  try {
    // Update status to processing
    const updatedFile = updateFile(fileId, { status: ProcessingStatus.PROCESSING });
    if (!updatedFile) return;

    // Simulate processing with delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // For demo purposes, create mock output files
    const outputFiles = {
      vocals: `/api/download/${fileId}/vocals.mp4`,
      music: `/api/download/${fileId}/music.mp4`,
      original: `/api/download/${fileId}/original.mp4`
    };

    // In a real implementation, you would:
    // 1. Import and use the audioProcessor
    // 2. Process the actual file
    // 3. Generate real separated tracks
    
    // const { audioProcessor } = await import('@/lib/audio-processor');
    // const result = await audioProcessor.processAudioSeparation(
    //   fileId,
    //   filePath,
    //   {
    //     quality: 'standard',
    //     outputFormat: 'mp4',
    //     normalize: true,
    //     removeNoise: false
    //   }
    // );

    // Update file status  
    updateFile(fileId, { 
      status: ProcessingStatus.COMPLETED,
      outputFiles: outputFiles
    });

    console.log(`Processing completed for file ${fileId}`);

  } catch (error) {
    console.error(`Processing failed for file ${fileId}:`, error);
    
    // Update status to failed
    updateFile(fileId, { status: ProcessingStatus.FAILED });
  }
}

