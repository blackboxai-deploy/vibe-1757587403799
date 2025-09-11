import { ProcessingStatus, ProcessingProgress } from '@/types/audio';

// Mock progress data - in production, this would come from a queue system or database
const progressData = new Map<string, ProcessingProgress>();

export function createProgressFromStatus(fileId: string, status: ProcessingStatus): ProcessingProgress {
  switch (status) {
    case ProcessingStatus.UPLOADING:
      return {
        fileId,
        status,
        progress: 5,
        currentStep: 'Uploading file...',
        estimatedTimeRemaining: 30
      };
    
    case ProcessingStatus.QUEUED:
      return {
        fileId,
        status,
        progress: 10,
        currentStep: 'Waiting in queue...',
        estimatedTimeRemaining: 120
      };
    
    case ProcessingStatus.PROCESSING:
      return {
        fileId,
        status,
        progress: 20,
        currentStep: 'Starting audio separation...',
        estimatedTimeRemaining: 180
      };
    
    case ProcessingStatus.COMPLETED:
      return {
        fileId,
        status,
        progress: 100,
        currentStep: 'Processing completed successfully!',
        estimatedTimeRemaining: 0
      };
    
    case ProcessingStatus.FAILED:
      return {
        fileId,
        status,
        progress: 0,
        currentStep: 'Processing failed',
        error: 'An error occurred during processing. Please try again.'
      };
    
    case ProcessingStatus.CANCELLED:
      return {
        fileId,
        status,
        progress: 0,
        currentStep: 'Processing cancelled',
      };
    
    default:
      return {
        fileId,
        status,
        progress: 0,
        currentStep: 'Unknown status'
      };
  }
}

export function updateProcessingProgress(_fileId: string, currentProgress: ProcessingProgress): ProcessingProgress {
  const stages = [
    { threshold: 20, step: 'Analyzing audio file...', eta: 160 },
    { threshold: 35, step: 'Converting to processing format...', eta: 140 },
    { threshold: 50, step: 'Applying AI separation models...', eta: 100 },
    { threshold: 70, step: 'Separating vocal tracks...', eta: 60 },
    { threshold: 85, step: 'Separating instrumental tracks...', eta: 30 },
    { threshold: 95, step: 'Finalizing output files...', eta: 10 },
    { threshold: 100, step: 'Processing completed!', eta: 0 }
  ];

  // Simulate gradual progress
  let newProgress = currentProgress.progress + Math.random() * 3;
  
  // Find current stage
  const currentStage = stages.find(stage => newProgress <= stage.threshold) || stages[stages.length - 1];
  
  // Ensure we don't exceed 100%
  if (newProgress > 100) newProgress = 100;

  return {
    ...currentProgress,
    progress: Math.round(newProgress),
    currentStep: currentStage.step,
    estimatedTimeRemaining: currentStage.eta
  };
}

export function getProgress(fileId: string): ProcessingProgress | undefined {
  return progressData.get(fileId);
}

export function setProgress(fileId: string, progress: ProcessingProgress): void {
  progressData.set(fileId, progress);
}

export function updateProgress(fileId: string, progress: Partial<ProcessingProgress>): void {
  const existing = progressData.get(fileId);
  if (existing) {
    progressData.set(fileId, { ...existing, ...progress });
  }
}

// Cleanup old progress data
export function cleanupOldProgress(): void {
  const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
  
  for (const [, progress] of progressData.entries()) {
    if (
      [ProcessingStatus.COMPLETED, ProcessingStatus.FAILED, ProcessingStatus.CANCELLED].includes(progress.status) &&
      Date.now() - cutoff > 0
    ) {
      progressData.delete(progress.fileId);
    }
  }
}