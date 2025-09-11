"use client";

import { useState, useCallback } from "react";
import { AudioFile, ProcessingStatus } from "@/types/audio";
import FileUpload from "@/components/FileUpload";
import ProcessingStatusComponent from "@/components/ProcessingStatus";
import AudioPlayer from "@/components/AudioPlayer";
import HistorySidebar from "@/components/HistorySidebar";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null);

  const handleFileSelect = useCallback((newFiles: File[]) => {
    console.log("Files selected:", newFiles);
  }, []);

  // Status polling function
  const startStatusPolling = useCallback((fileId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/status?fileId=${fileId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.progress) {
            setFiles(prev => prev.map(f => {
              if (f.id === fileId) {
                const updatedFile = { ...f };
                
                if (result.progress.status === 'completed') {
                  updatedFile.status = ProcessingStatus.COMPLETED;
                  updatedFile.outputFiles = {
                    vocals: `https://placehold.co/400x100?text=Voice+Only+Track+${fileId.substring(0,8)}`,
                    music: `https://placehold.co/400x100?text=Music+Only+Track+${fileId.substring(0,8)}`,
                    original: `https://placehold.co/400x100?text=Original+Track+${fileId.substring(0,8)}`
                  };
                  clearInterval(pollInterval);
                } else if (result.progress.status === 'failed') {
                  updatedFile.status = ProcessingStatus.FAILED;
                  clearInterval(pollInterval);
                } else {
                  updatedFile.status = ProcessingStatus.PROCESSING;
                }
                
                return updatedFile;
              }
              return f;
            }));
          }
        }
      } catch (error) {
        console.error('Status polling error:', error);
        clearInterval(pollInterval);
      }
    }, 2000);

    setTimeout(() => {
      clearInterval(pollInterval);
    }, 5 * 60 * 1000);
  }, []);

  const handleUploadComplete = useCallback(async (file: AudioFile) => {
    setFiles(prev => [...prev, file]);
    setSelectedFile(file);
    
    try {
      const response = await fetch('/api/separate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fileId: file.id, 
          qualityLevel: 'standard' 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, status: ProcessingStatus.PROCESSING }
              : f
          ));
          
          startStatusPolling(file.id);
        }
      }
    } catch (error) {
      console.error('Failed to start processing:', error);
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, status: ProcessingStatus.FAILED }
          : f
      ));
    }
  }, [startStatusPolling]);

  const handleUploadError = useCallback((error: string) => {
    console.error("Upload error:", error);
  }, []);

  const handleRetry = useCallback(async (fileId: string) => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: ProcessingStatus.PROCESSING }
          : f
      ));

      const response = await fetch('/api/separate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fileId, 
          qualityLevel: 'standard' 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          startStatusPolling(fileId);
        }
      }
    } catch (error) {
      console.error('Retry failed:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: ProcessingStatus.FAILED }
          : f
      ));
    }
  }, [startStatusPolling]);

  const handleCancel = useCallback((fileId: string) => {
    console.log("Cancelling file:", fileId);
  }, []);

  const handleDownload = useCallback(async (fileId: string, trackType: 'vocals' | 'music' | 'original') => {
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId, trackType }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.downloadUrl) {
          const link = document.createElement('a');
          link.href = result.downloadUrl;
          link.download = `${trackType}_track_${fileId.substring(0, 8)}.mp4`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log(`${trackType} track download started`);
        }
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, []);

  const handleFileDelete = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }
  }, [selectedFile]);

  const handleClearHistory = useCallback(() => {
    setFiles([]);
    setSelectedFile(null);
  }, []);

  const processingFiles = files.filter(f => [ProcessingStatus.UPLOADING, ProcessingStatus.QUEUED, ProcessingStatus.PROCESSING].includes(f.status));

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center space-x-2 bg-purple-500/10 text-purple-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          <span>AI-Powered Audio Separation Technology</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-6">
          Separate Voice & Music
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
          Upload any audio or video file and let our advanced AI technology separate vocals and instrumental tracks 
          with professional quality. Download your tracks as high-quality MP4 files instantly.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400 mb-12">
          <Badge variant="outline" className="border-purple-500/30 text-purple-300">
            MP3, MP4, WAV, M4A supported
          </Badge>
          <Badge variant="outline" className="border-blue-500/30 text-blue-300">
            High-quality AI separation
          </Badge>
          <Badge variant="outline" className="border-green-500/30 text-green-300">
            Instant download
          </Badge>
          <Badge variant="outline" className="border-pink-500/30 text-pink-300">
            No registration required
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <HistorySidebar
            files={files}
            onFileSelect={setSelectedFile}
            onFileDelete={handleFileDelete}
            onClearHistory={handleClearHistory}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="space-y-8">
            {/* Upload Section */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">1</span>
                  </div>
                  <span>Upload Your Audio or Video File</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileSelect={handleFileSelect}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  maxFileSize={100 * 1024 * 1024}
                  acceptedFormats={['.mp3', '.mp4', '.wav', '.m4a', '.avi', '.mov']}
                />
              </CardContent>
            </Card>

            {/* Processing Status */}
            {processingFiles.length > 0 && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <span>Processing Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProcessingStatusComponent
                    files={processingFiles}
                    onRetry={handleRetry}
                    onCancel={handleCancel}
                  />
                </CardContent>
              </Card>
            )}

            {/* All Uploaded Files Display */}
            {files.length > 0 && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <span>Your Files ({files.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {files.map((file) => (
                    <div key={file.id} className="border border-white/10 rounded-lg p-6 bg-black/20">
                      {/* File Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg">🎵</span>
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{file.originalName}</h3>
                            <p className="text-sm text-gray-400">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                              {file.duration && ` • ${file.duration}s`}
                              {` • Uploaded ${new Date(file.uploadedAt).toLocaleTimeString()}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {file.status === ProcessingStatus.COMPLETED && (
                            <Badge variant="outline" className="border-green-500/30 text-green-300">
                              ✅ Ready to Download
                            </Badge>
                          )}
                          {file.status === ProcessingStatus.PROCESSING && (
                            <Badge variant="outline" className="border-yellow-500/30 text-yellow-300">
                              ⏳ Processing...
                            </Badge>
                          )}
                          {file.status === ProcessingStatus.QUEUED && (
                            <Badge variant="outline" className="border-blue-500/30 text-blue-300">
                              📋 Queued
                            </Badge>
                          )}
                          {file.status === ProcessingStatus.FAILED && (
                            <Badge variant="outline" className="border-red-500/30 text-red-300">
                              ❌ Failed
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Download Buttons for Completed Files */}
                      {file.status === ProcessingStatus.COMPLETED && file.outputFiles && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Voice Only Download */}
                            {file.outputFiles.vocals && (
                              <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                                      🎤
                                    </div>
                                    <div>
                                      <h4 className="text-white font-medium">Voice Only</h4>
                                      <p className="text-sm text-pink-200">Isolated vocals track</p>
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() => handleDownload(file.id, 'vocals')}
                                    className="bg-pink-500 hover:bg-pink-600 text-white px-6"
                                  >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download Voice
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Music Only Download */}
                            {file.outputFiles.music && (
                              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                      🎵
                                    </div>
                                    <div>
                                      <h4 className="text-white font-medium">Music Only</h4>
                                      <p className="text-sm text-blue-200">Instrumental track</p>
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() => handleDownload(file.id, 'music')}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6"
                                  >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Download Music
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Audio Preview Players */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                            {file.outputFiles.original && (
                              <div>
                                <h5 className="text-gray-300 text-sm mb-2">Original</h5>
                                <AudioPlayer
                                  src={file.outputFiles.original}
                                  title="Original"
                                  showDownload={false}
                                />
                              </div>
                            )}
                            {file.outputFiles.vocals && (
                              <div>
                                <h5 className="text-pink-300 text-sm mb-2">Voice Only</h5>
                                <AudioPlayer
                                  src={file.outputFiles.vocals}
                                  title="Vocals"
                                  showDownload={false}
                                />
                              </div>
                            )}
                            {file.outputFiles.music && (
                              <div>
                                <h5 className="text-blue-300 text-sm mb-2">Music Only</h5>
                                <AudioPlayer
                                  src={file.outputFiles.music}
                                  title="Music"
                                  showDownload={false}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Processing Status */}
                      {file.status === ProcessingStatus.PROCESSING && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                            <div>
                              <p className="text-yellow-300 font-medium">Processing your file...</p>
                              <p className="text-sm text-yellow-200">AI is separating voice and music tracks. This usually takes 1-3 minutes.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Queued Status */}
                      {file.status === ProcessingStatus.QUEUED && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm">📋</span>
                            </div>
                            <div>
                              <p className="text-blue-300 font-medium">File queued for processing</p>
                              <p className="text-sm text-blue-200">Your file will be processed shortly. Processing will start automatically.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Failed Status */}
                      {file.status === ProcessingStatus.FAILED && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm">❌</span>
                              </div>
                              <div>
                                <p className="text-red-300 font-medium">Processing failed</p>
                                <p className="text-sm text-red-200">There was an error processing this file.</p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              className="border-red-500/30 text-red-300 hover:bg-red-500/20"
                              onClick={() => handleRetry(file.id)}
                            >
                              Try Again
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Features Overview */}
            {files.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-xl">AI</span>
                    </div>
                    <h3 className="text-white font-semibold mb-2">Advanced AI Technology</h3>
                    <p className="text-gray-400 text-sm">
                      Our state-of-the-art AI models provide superior separation quality with minimal artifacts.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 backdrop-blur-sm text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-xl">⚡</span>
                    </div>
                    <h3 className="text-white font-semibold mb-2">Lightning Fast</h3>
                    <p className="text-gray-400 text-sm">
                      Process your files quickly with optimized algorithms and powerful cloud infrastructure.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10 backdrop-blur-sm text-center">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-xl">🎵</span>
                    </div>
                    <h3 className="text-white font-semibold mb-2">Multiple Formats</h3>
                    <p className="text-gray-400 text-sm">
                      Support for MP3, MP4, WAV, M4A and many other popular audio and video formats.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}