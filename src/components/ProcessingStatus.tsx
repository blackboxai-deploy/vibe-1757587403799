"use client";

import { useState, useEffect } from 'react';
import { ProcessingStatusProps, ProcessingStatus as Status, ProcessingProgress } from '@/types/audio';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const ProcessingStatus = ({ files, onRetry, onCancel }: ProcessingStatusProps) => {
  const [progressData, setProgressData] = useState<Map<string, ProcessingProgress>>(new Map());

  // Poll for progress updates
  useEffect(() => {
    if (files.length === 0) return;

    const pollProgress = async () => {
      for (const file of files) {
        if ([Status.PROCESSING, Status.QUEUED].includes(file.status)) {
          try {
            const response = await fetch(`/api/status?fileId=${file.id}`);
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.progress) {
                setProgressData(prev => new Map(prev.set(file.id, result.progress)));
              }
            }
          } catch (error) {
            console.error(`Failed to get progress for ${file.id}:`, error);
          }
        }
      }
    };

    pollProgress();
    const interval = setInterval(pollProgress, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [files]);

  const getStatusColor = (status: Status) => {
    switch (status) {
      case Status.UPLOADING:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case Status.QUEUED:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case Status.PROCESSING:
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case Status.COMPLETED:
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case Status.FAILED:
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case Status.CANCELLED:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case Status.UPLOADING:
        return '📤';
      case Status.QUEUED:
        return '⏳';
      case Status.PROCESSING:
        return '⚙️';
      case Status.COMPLETED:
        return '✅';
      case Status.FAILED:
        return '❌';
      case Status.CANCELLED:
        return '⏹️';
      default:
        return '❓';
    }
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/30 rounded-full flex items-center justify-center">
          <span className="text-2xl">🎵</span>
        </div>
        <p>No files currently processing</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {files.map((file) => {
        const progress = progressData.get(file.id);
        
        return (
          <Card key={file.id} className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getStatusIcon(file.status)}</span>
                  <div>
                    <h4 className="text-white font-medium truncate max-w-xs">
                      {file.originalName}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {formatFileSize(file.size)} • {file.mimeType}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={getStatusColor(file.status)}>
                  {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                </Badge>
              </div>

              {/* Progress Information */}
              {progress && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{progress.currentStep}</span>
                    <div className="flex items-center space-x-4">
                      {progress.estimatedTimeRemaining && (
                        <span className="text-purple-300">
                          ETA: {formatTime(progress.estimatedTimeRemaining)}
                        </span>
                      )}
                      <span className="text-white font-medium">{progress.progress}%</span>
                    </div>
                  </div>
                  <Progress 
                    value={progress.progress} 
                    className="h-2 bg-gray-700"
                  />
                </div>
              )}

              {/* Processing Steps */}
              {file.status === Status.PROCESSING && (
                <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                  <div className={`p-2 rounded text-center ${
                    (progress?.progress || 0) > 0 ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    Upload
                  </div>
                  <div className={`p-2 rounded text-center ${
                    (progress?.progress || 0) > 25 ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    Convert
                  </div>
                  <div className={`p-2 rounded text-center ${
                    (progress?.progress || 0) > 50 ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    Separate
                  </div>
                  <div className={`p-2 rounded text-center ${
                    (progress?.progress || 0) > 90 ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    Finalize
                  </div>
                </div>
              )}

              {/* Error Message */}
              {file.status === Status.FAILED && progress?.error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-300 text-sm">{progress.error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 mt-4">
                {file.status === Status.FAILED && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRetry(file.id)}
                    className="border-green-500/30 text-green-300 hover:bg-green-500/20"
                  >
                    Retry
                  </Button>
                )}
                {[Status.QUEUED, Status.PROCESSING].includes(file.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCancel(file.id)}
                    className="border-red-500/30 text-red-300 hover:bg-red-500/20"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProcessingStatus;