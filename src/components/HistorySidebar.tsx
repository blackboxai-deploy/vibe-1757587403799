"use client";

import { useState } from 'react';
import { HistorySidebarProps, ProcessingStatus } from '@/types/audio';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

const HistorySidebar = ({ 
  files, 
  onFileSelect, 
  onFileDelete, 
  onClearHistory 
}: HistorySidebarProps) => {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const handleFileClick = (file: any) => {
    setSelectedFileId(file.id);
    onFileSelect(file);
  };

  const handleDeleteFile = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    onFileDelete(fileId);
  };

  const getStatusColor = (status: ProcessingStatus) => {
    switch (status) {
      case ProcessingStatus.UPLOADING:
        return 'bg-blue-500/20 text-blue-300';
      case ProcessingStatus.QUEUED:
        return 'bg-yellow-500/20 text-yellow-300';
      case ProcessingStatus.PROCESSING:
        return 'bg-purple-500/20 text-purple-300';
      case ProcessingStatus.COMPLETED:
        return 'bg-green-500/20 text-green-300';
      case ProcessingStatus.FAILED:
        return 'bg-red-500/20 text-red-300';
      case ProcessingStatus.CANCELLED:
        return 'bg-gray-500/20 text-gray-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(mb * 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const completedFiles = files.filter(f => f.status === ProcessingStatus.COMPLETED);
  const processingFiles = files.filter(f => 
    [ProcessingStatus.UPLOADING, ProcessingStatus.QUEUED, ProcessingStatus.PROCESSING].includes(f.status)
  );
  const failedFiles = files.filter(f => f.status === ProcessingStatus.FAILED);

  if (files.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-700/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-400 text-sm">No files uploaded yet</p>
            <p className="text-gray-500 text-xs mt-1">Your processing history will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10 h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History ({files.length})
          </CardTitle>
          {files.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearHistory}
              className="text-gray-400 hover:text-red-300 hover:bg-red-500/10"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-green-500/10 rounded">
            <div className="text-green-300 font-semibold">{completedFiles.length}</div>
            <div className="text-green-400/70">Completed</div>
          </div>
          <div className="text-center p-2 bg-purple-500/10 rounded">
            <div className="text-purple-300 font-semibold">{processingFiles.length}</div>
            <div className="text-purple-400/70">Processing</div>
          </div>
          <div className="text-center p-2 bg-red-500/10 rounded">
            <div className="text-red-300 font-semibold">{failedFiles.length}</div>
            <div className="text-red-400/70">Failed</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[500px] px-4">
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => handleFileClick(file)}
                className={`
                  p-3 rounded-lg cursor-pointer transition-all duration-200 border
                  ${selectedFileId === file.id 
                    ? 'bg-purple-500/20 border-purple-500/40' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }
                `}
              >
                {/* File Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white text-sm font-medium truncate">
                      {file.originalName}
                    </h4>
                    <p className="text-gray-400 text-xs">
                      {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDeleteFile(e, file.id)}
                    className="w-6 h-6 text-gray-400 hover:text-red-300 hover:bg-red-500/20 ml-2"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor(file.status)} text-xs`}
                  >
                    {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                  </Badge>
                  
                  {/* Output Files Indicator */}
                  {file.status === ProcessingStatus.COMPLETED && file.outputFiles && (
                    <div className="flex items-center space-x-1">
                      {file.outputFiles.vocals && (
                        <div className="w-2 h-2 bg-pink-400 rounded-full" title="Vocals available"></div>
                      )}
                      {file.outputFiles.music && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full" title="Music available"></div>
                      )}
                      {file.outputFiles.original && (
                        <div className="w-2 h-2 bg-purple-400 rounded-full" title="Original available"></div>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress for processing files */}
                {[ProcessingStatus.PROCESSING, ProcessingStatus.QUEUED].includes(file.status) && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <span>
                        {file.status === ProcessingStatus.QUEUED ? 'In queue...' : 'Processing...'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Error indicator */}
                {file.status === ProcessingStatus.FAILED && (
                  <div className="mt-2 pt-2 border-t border-red-500/20">
                    <div className="flex items-center space-x-2 text-xs text-red-300">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Processing failed</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default HistorySidebar;