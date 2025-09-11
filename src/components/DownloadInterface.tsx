"use client";

import { useState } from 'react';
import { DownloadInterfaceProps } from '@/types/audio';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { toast } from "sonner";

const DownloadInterface = ({ file, onDownload }: DownloadInterfaceProps) => {
  const [downloadingTracks, setDownloadingTracks] = useState<Set<string>>(new Set());

  const handleDownload = async (trackType: 'vocals' | 'music' | 'original') => {
    setDownloadingTracks(prev => new Set([...prev, trackType]));
    
    try {
      onDownload(file.id, trackType);
      
      // Simulate download progress
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`${trackType} track download started`);
    } catch (error) {
      console.error(`Failed to download ${trackType} track`);
    } finally {
      setDownloadingTracks(prev => {
        const newSet = new Set(prev);
        newSet.delete(trackType);
        return newSet;
      });
    }
  };

  const handleDownloadAll = async () => {
    const tracks = ['vocals', 'music', 'original'] as const;
    
    for (const track of tracks) {
      if (file.outputFiles?.[track]) {
        await handleDownload(track);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const getTrackInfo = (trackType: 'vocals' | 'music' | 'original') => {
    switch (trackType) {
      case 'vocals':
        return {
          title: 'Vocals Track',
          description: 'Isolated vocal parts with minimal background music',
          icon: '🎤',
          color: 'from-pink-500 to-rose-500'
        };
      case 'music':
        return {
          title: 'Music Track', 
          description: 'Instrumental track without vocals',
          icon: '🎵',
          color: 'from-blue-500 to-cyan-500'
        };
      case 'original':
        return {
          title: 'Original Track',
          description: 'Processed original file for quality comparison',
          icon: '🎬',
          color: 'from-purple-500 to-indigo-500'
        };
    }
  };

  const availableTracks = Object.entries(file.outputFiles || {}).filter(([_, url]) => url);
  const totalSize = formatFileSize(file.size * availableTracks.length); // Estimated

  return (
    <div className="space-y-6">
      {/* Download All Section */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
        <div>
          <h3 className="text-white font-semibold">Download All Tracks</h3>
          <p className="text-sm text-gray-400">
            Get all separated tracks in one download package
          </p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <span>Total: {availableTracks.length} tracks</span>
            <span>Est. Size: {totalSize}</span>
            <span>Format: MP4</span>
          </div>
        </div>
        <Button
          onClick={handleDownloadAll}
          disabled={availableTracks.length === 0}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-6"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          Download All
        </Button>
      </div>

      {/* Individual Track Downloads */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['vocals', 'music', 'original'] as const).map(trackType => {
          const trackInfo = getTrackInfo(trackType);
          const isAvailable = file.outputFiles?.[trackType];
          const isDownloading = downloadingTracks.has(trackType);

          return (
            <Card 
              key={trackType} 
              className={`relative overflow-hidden ${
                isAvailable 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 transition-colors' 
                  : 'bg-gray-500/5 border-gray-500/10'
              }`}
            >
              <CardContent className="p-4">
                {/* Track Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${trackInfo.color} flex items-center justify-center`}>
                    <span className="text-xl">{trackInfo.icon}</span>
                  </div>
                  {isAvailable ? (
                    <Badge variant="outline" className="border-green-500/30 text-green-300">
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-gray-500/30 text-gray-400">
                      Not Available
                    </Badge>
                  )}
                </div>

                {/* Track Info */}
                <div className="mb-4">
                  <h4 className={`font-semibold mb-1 ${isAvailable ? 'text-white' : 'text-gray-500'}`}>
                    {trackInfo.title}
                  </h4>
                  <p className={`text-sm ${isAvailable ? 'text-gray-400' : 'text-gray-600'}`}>
                    {trackInfo.description}
                  </p>
                </div>

                {/* Download Stats */}
                {isAvailable && (
                  <div className="space-y-2 mb-4 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>Quality</span>
                      <span className="text-green-400">High</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Format</span>
                      <span className="text-blue-400">MP4</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Size</span>
                      <span className="text-purple-400">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                )}

                {/* Download Button */}
                <Button
                  variant="outline"
                  className={`w-full ${
                    isAvailable
                      ? 'border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
                      : 'border-gray-500/20 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!isAvailable || isDownloading}
                  onClick={() => isAvailable && handleDownload(trackType)}
                >
                  {isDownloading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-purple-300 border-t-transparent rounded-full animate-spin"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download
                    </>
                  )}
                </Button>

                {/* Background Gradient */}
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${trackInfo.color} opacity-5 rounded-bl-full`}></div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Download Tips */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Download Tips
        </h4>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• Downloaded files are in high-quality MP4 format</li>
          <li>• Vocals track contains isolated voice with minimal background music</li>
          <li>• Music track is the instrumental version without vocals</li>
          <li>• Files are automatically cleaned up after 24 hours</li>
        </ul>
      </div>
    </div>
  );
};

export default DownloadInterface;