"use client";

import { useState, useRef, useEffect } from 'react';
import { AudioPlayerProps } from '@/types/audio';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

const AudioPlayer = ({ 
  src, 
  title, 
  onPlay, 
  onPause, 
  onEnded,
  showDownload = false
}: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlayThrough = () => {
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [onEnded]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        await audio.pause();
        setIsPlaying(false);
        onPause?.();
      } else {
        await audio.play();
        setIsPlaying(true);
        onPlay?.();
      }
    } catch (error) {
      console.error('Error toggling audio playback:', error);
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    const newVolume = value[0];
    
    if (audio) {
      audio.volume = newVolume;
    }
    setVolume(newVolume);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `${title}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (time: number) => {
    if (!isFinite(time) || isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
      />

      {/* Title and Download */}
      <div className="flex items-center justify-between">
        <h4 className="text-white font-medium">{title}</h4>
        {showDownload && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="text-gray-400 hover:text-white hover:bg-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </Button>
        )}
      </div>

      {/* Main Controls */}
      <div className="flex items-center space-x-4">
        {/* Play/Pause Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={togglePlayPause}
          disabled={isLoading}
          className="w-10 h-10 rounded-full border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin"></div>
          ) : isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </Button>

        {/* Time Display */}
        <div className="text-sm text-gray-400 min-w-fit">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Progress Slider */}
        <div className="flex-1">
          <Slider
            value={[currentTime]}
            max={duration || 1}
            step={0.1}
            onValueChange={handleSeek}
            disabled={isLoading}
            className="cursor-pointer"
          />
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2 min-w-fit">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
          <div className="w-20">
            <Slider
              value={[volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Waveform Visualization Placeholder */}
      <div className="h-16 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-lg flex items-center justify-center">
        <div className="flex items-center space-x-1">
          {Array.from({ length: 40 }, (_, i) => (
            <div
              key={i}
              className={`w-1 bg-gradient-to-t from-purple-400 to-pink-400 rounded-full transition-all duration-75 ${
                isPlaying 
                  ? 'animate-pulse' 
                  : 'opacity-60'
              }`}
              style={{
                height: `${Math.random() * 40 + 8}px`,
                animationDelay: `${i * 50}ms`
              }}
            />
          ))}
        </div>
      </div>

      {/* Audio Information */}
      {!isLoading && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>Duration: {formatTime(duration)}</span>
          <span>Quality: High</span>
          <span>Format: MP4</span>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;