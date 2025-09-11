import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('fileId');
  const trackType = searchParams.get('trackType'); // 'vocals', 'music', or 'original'

  if (!fileId || !trackType) {
    return NextResponse.json({
      success: false,
      error: 'File ID and track type are required'
    }, { status: 400 });
  }

  try {
    // In a real implementation, you would:
    // 1. Validate the file exists and user has access
    // 2. Generate a secure download URL or stream the file directly
    // 3. Handle different track types (vocals, music, original)
    
    // Mock download URL generation
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const downloadUrl = `${baseUrl}/api/files/${fileId}/${trackType}`;
    
    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return NextResponse.json({
      success: true,
      downloadUrl,
      expiresAt,
      message: `Download URL generated for ${trackType} track`
    });

  } catch (error) {
    console.error('Download URL generation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate download URL'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId, trackType } = body;

    if (!fileId || !trackType) {
      return NextResponse.json({
        success: false,
        error: 'File ID and track type are required'
      }, { status: 400 });
    }

    // Generate secure download token
    const downloadToken = btoa(`${fileId}-${trackType}-${Date.now()}`);
    
    // In production, store this token with expiration in database
    const downloadUrl = `/api/files/download?token=${downloadToken}`;
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return NextResponse.json({
      success: true,
      downloadUrl,
      expiresAt,
      token: downloadToken,
      message: 'Secure download URL generated'
    });

  } catch (error) {
    console.error('Download preparation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to prepare download'
    }, { status: 500 });
  }
}