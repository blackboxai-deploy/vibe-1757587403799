// TypeScript interfaces for audio/video separation application

export interface AudioFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  duration?: number;
  uploadedAt: Date;
  status: ProcessingStatus;
  outputFiles?: OutputFiles;
}

export interface OutputFiles {
  vocals?: string;  // URL to vocals track
  music?: string;   // URL to music/instrumental track
  original?: string; // URL to original processed file
}

export enum ProcessingStatus {
  UPLOADING = 'uploading',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface ProcessingProgress {
  fileId: string;
  status: ProcessingStatus;
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining?: number; // in seconds
  error?: string;
}

export interface SeparationOptions {
  quality: 'fast' | 'standard' | 'high';
  outputFormat: 'mp3' | 'wav' | 'mp4';
  normalize: boolean;
  removeNoise: boolean;
}

export interface UploadResponse {
  success: boolean;
  file?: AudioFile;
  error?: string;
  message?: string;
}

export interface SeparationResponse {
  success: boolean;
  jobId?: string;
  error?: string;
  message?: string;
}

export interface StatusResponse {
  success: boolean;
  progress?: ProcessingProgress;
  error?: string;
}

export interface DownloadResponse {
  success: boolean;
  downloadUrl?: string;
  error?: string;
}

export interface AudioProcessorConfig {
  maxFileSize: number; // in bytes
  supportedFormats: string[];
  outputDir: string;
  tempDir: string;
  cleanupAfter: number; // hours
}

export interface QueueItem {
  id: string;
  fileId: string;
  options: SeparationOptions;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  priority: number;
}

// Frontend component props
export interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  onUploadComplete: (file: AudioFile) => void;
  onUploadError: (error: string) => void;
  maxFileSize?: number;
  acceptedFormats?: string[];
}

export interface ProcessingStatusProps {
  files: AudioFile[];
  onRetry: (fileId: string) => void;
  onCancel: (fileId: string) => void;
}

export interface AudioPlayerProps {
  src: string;
  title: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  showDownload?: boolean;
}

export interface DownloadInterfaceProps {
  file: AudioFile;
  onDownload: (fileId: string, trackType: 'vocals' | 'music' | 'original') => void;
}

export interface HistorySidebarProps {
  files: AudioFile[];
  onFileSelect: (file: AudioFile) => void;
  onFileDelete: (fileId: string) => void;
  onClearHistory: () => void;
}