
'use client';

import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from 'react';

export interface RadioStation {
  id: string;
  name: string;
  description: string;
  streamUrl: string;
  category: 'music' | 'news' | 'specialized' | 'regional';
  region?: string;
  website?: string;
}

interface RadioContextType {
  isPlaying: boolean;
  currentStation: RadioStation | null;
  volume: number;
  selectStation: (station: RadioStation) => void;
  togglePlayPause: () => void;
  setVolume: (volume: number) => void;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export const useRadio = () => {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
};

interface RadioProviderProps {
    children: ReactNode;
}

export const RadioProvider = ({ children }: RadioProviderProps) => {
    const [isPlaying, setIsPlaying] = useState(false); // User's intent to play
    const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
    const [volume, setVolumeState] = useState(0.8);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Function to clear any scheduled reconnection attempts
    const clearRetryTimeout = () => {
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
    };

    // Main effect for handling audio playback and events
    useEffect(() => {
        // Initialize audio element once
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.crossOrigin = "anonymous";
        }
        const audio = audioRef.current;

        const attemptReconnect = () => {
            // Only reconnect if user wants to play and no retry is already scheduled
            if (!isPlaying || retryTimeoutRef.current) return;

            console.log("Conexão da rádio perdida. Tentando reconectar em 3 segundos...");
            audio.pause(); // Ensure it's paused before trying again

            retryTimeoutRef.current = setTimeout(() => {
                console.log("Reconectando...");
                if (audioRef.current) { // Check if component is still mounted
                    audioRef.current.load();
                    audioRef.current.play().catch(e => console.error("Falha ao reconectar:", e));
                }
                // Clear the timeout ref after execution
                retryTimeoutRef.current = null;
            }, 3000);
        };

        const handleCanPlay = () => {
            // If the audio is ready and we want to play, clear any retry timers
            if (isPlaying) {
                clearRetryTimeout();
            }
        };

        // Add event listeners
        audio.addEventListener('error', attemptReconnect);
        audio.addEventListener('stalled', attemptReconnect);
        audio.addEventListener('ended', attemptReconnect); // Handles stream drops
        audio.addEventListener('canplay', handleCanPlay);

        // Cleanup listeners on re-render or unmount
        return () => {
            audio.removeEventListener('error', attemptReconnect);
            audio.removeEventListener('stalled', attemptReconnect);
            audio.removeEventListener('ended', attemptReconnect);
            audio.removeEventListener('canplay', handleCanPlay);
            clearRetryTimeout(); // Clear any pending timeout on cleanup
        };
    }, [isPlaying]); // Rerun this effect if the user's playing intent changes

    // Effect to control the audio source and play/pause state
    useEffect(() => {
        if (!audioRef.current) return;
        const audio = audioRef.current;

        if (isPlaying && currentStation) {
            if (audio.src !== currentStation.streamUrl) {
                clearRetryTimeout(); // New station, clear old retries
                audio.src = currentStation.streamUrl;
                audio.load();
            }
            audio.play().catch(e => {
                console.error("Erro ao tentar tocar:", e);
                setIsPlaying(false); // Revert state if play fails immediately
            });
        } else {
            audio.pause();
            clearRetryTimeout(); // User paused, so clear retries
        }
    }, [isPlaying, currentStation]);
    
    // Effect for volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);


    const setVolume = useCallback((newVolume: number) => {
        setVolumeState(Math.max(0, Math.min(1, newVolume)));
    }, []);

    const selectStation = useCallback((station: RadioStation) => {
        setCurrentStation(station);
        setIsPlaying(true); // Always play when a new station is selected
    }, []);

    const togglePlayPause = useCallback(() => {
        if (!currentStation) return;
        setIsPlaying(prev => !prev);
    }, [currentStation]);

    const value = {
        isPlaying,
        currentStation,
        volume,
        selectStation,
        togglePlayPause,
        setVolume,
    };

    return (
        <RadioContext.Provider value={value}>
            {children}
        </RadioContext.Provider>
    );
};
