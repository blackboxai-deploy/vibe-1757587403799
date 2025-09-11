"use client";

import { useCallback, useState, useRef } from 'react';
import { FileUploadProps } from '@/types/audio';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from "sonner";

const FileUpload = ({
  onFileSelect,
  onUploadComplete,
  onUploadError,
  maxFileSize = 100 * 1024 * 1024, // 100MB default
  acceptedFormats = ['.mp3', '.mp4', '.wav', '.m4a', '.avi', '.mov']
}: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit`;
    }

    // Check file format
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      return `Unsupported format. Accepted formats: ${acceptedFormats.join(', ')}`;
    }

    return null;
  }, [maxFileSize, acceptedFormats]);

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Validate files
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }
    }

    // Handle file selection
    onFileSelect(fileArray);

    // Start upload process
    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (const file of fileArray) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success && result.file) {
          onUploadComplete(result.file);
          toast.success(`${file.name} uploaded successfully`);
        } else {
          throw new Error(result.error || 'Upload failed');
        }

        setUploadProgress(100);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onFileSelect, onUploadComplete, onUploadError, validateFile]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      {/* Main Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${isDragOver 
            ? 'border-purple-400 bg-purple-500/10 scale-105' 
            : 'border-gray-600 hover:border-gray-500 bg-white/5'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleBrowseClick}
      >
        {/* Upload Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
          </div>
        </div>

        {/* Upload Text */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">
            {isDragOver ? 'Drop files here' : 'Drop files or click to browse'}
          </h3>
          <p className="text-gray-400">
            Support for MP3, MP4, WAV, M4A, AVI, MOV files up to {Math.round(maxFileSize / (1024 * 1024))}MB
          </p>
        </div>

        {/* Browse Button */}
        <div className="mt-6">
          <Button 
            variant="outline" 
            className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Browse Files'}
          </Button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFormats.join(',')}
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isUploading}
        />
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Uploading...</span>
            <span className="text-purple-300">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2 bg-gray-700" />
        </div>
      )}

      {/* Format Info */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-white/5 rounded-lg">
          <div className="text-2xl mb-1">🎵</div>
          <div className="text-xs text-gray-400">Audio Files</div>
          <div className="text-xs text-white">MP3, WAV, M4A</div>
        </div>
        <div className="p-3 bg-white/5 rounded-lg">
          <div className="text-2xl mb-1">🎬</div>
          <div className="text-xs text-gray-400">Video Files</div>
          <div className="text-xs text-white">MP4, AVI, MOV</div>
        </div>
        <div className="p-3 bg-white/5 rounded-lg col-span-2 md:col-span-1">
          <div className="text-2xl mb-1">⚡</div>
          <div className="text-xs text-gray-400">Max Size</div>
          <div className="text-xs text-white">{Math.round(maxFileSize / (1024 * 1024))}MB</div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;