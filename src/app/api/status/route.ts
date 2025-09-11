import { NextRequest, NextResponse } from 'next/server';
import { getFileById } from '@/lib/file-storage';
import { ProcessingStatus } from '@/types/audio';
import { 
  createProgressFromStatus, 
  updateProcessingProgress, 
  getProgress, 
  setProgress 
} from '@/lib/progress-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }

    const file = getFileById(fileId);
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    let progress = getProgress(fileId);
    
    if (!progress) {
      progress = createProgressFromStatus(fileId, file.status);
      setProgress(fileId, progress);
    }

    if (file.status === ProcessingStatus.PROCESSING) {
      progress = updateProcessingProgress(fileId, progress);
      setProgress(fileId, progress);
    }

    return NextResponse.json({
      success: true,
      progress
    });

  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get status' 
      },
      { status: 500 }
    );
  }
}