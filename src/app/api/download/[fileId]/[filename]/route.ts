import { NextRequest, NextResponse } from 'next/server';
import { getFileById } from '@/lib/file-storage';

interface RouteContext {
  params: Promise<{ fileId: string; filename: string }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { fileId, filename } = await context.params;

    if (!fileId || !filename) {
      return NextResponse.json(
        { success: false, error: 'File ID and filename are required' },
        { status: 400 }
      );
    }

    // Validate file exists in our system
    const file = getFileById(fileId);
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    // Security: Validate filename to prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { success: false, error: 'Invalid filename' },
        { status: 400 }
      );
    }

    try {
      // For demo purposes, we'll create a mock file
      const buffer = await getMockAudioBuffer(filename);
      
      // Determine content type
      const contentType = getContentType(filename);

      // Create response with file
      const response = new NextResponse(buffer as any, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'private, max-age=3600',
        },
      });

      return response;

    } catch (fileError) {
      console.error('Error creating file:', fileError);
      return NextResponse.json(
        { success: false, error: 'File not available for download' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Download failed' 
      },
      { status: 500 }
    );
  }
}

async function getMockAudioBuffer(filename: string): Promise<Uint8Array> {
  const trackType = filename.includes('vocals') ? 'vocals' : 
                   filename.includes('music') ? 'music' : 'original';
  
  const mockContent = `Mock ${trackType} track - ${filename}\n`.repeat(1000);
  return new TextEncoder().encode(mockContent);
}

function getContentType(filename: string): string {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  switch (extension) {
    case '.mp4':
      return 'audio/mp4';
    case '.mp3':
      return 'audio/mpeg';
    case '.wav':
      return 'audio/wav';
    case '.m4a':
      return 'audio/mp4';
    default:
      return 'application/octet-stream';
  }
}

interface PostRouteContext {
  params: Promise<{ fileId: string }>;
}

export async function POST(
  _request: NextRequest,
  context: PostRouteContext
) {
  try {
    const { fileId } = await context.params;
    
    const file = getFileById(fileId);
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    const tracks = ['vocals.mp4', 'music.mp4', 'original.mp4'];
    const downloadUrls = tracks.map(track => ({
      name: track,
      url: `/api/download/${fileId}/${track}`
    }));

    return NextResponse.json({
      success: true,
      downloads: downloadUrls,
      message: 'Download links generated successfully'
    });

  } catch (error) {
    console.error('Bulk download API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bulk download failed' 
      },
      { status: 500 }
    );
  }
}