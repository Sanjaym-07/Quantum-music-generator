
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Note, InstrumentType } from '../types';
import { playMelody, stopPlayback } from '../services/musicService';
import { generateMidiDataUri } from '../services/midiService';
import { PlayIcon } from './icons/PlayIcon';
import { StopIcon } from './icons/StopIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface PlayerProps {
    melody: Note[];
    tempo: number;
    instruments: InstrumentType[];
}

export const Player: React.FC<PlayerProps> = ({ melody, tempo, instruments }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        return () => {
             if (isPlaying) {
                stopPlayback(audioContextRef.current);
                setIsPlaying(false);
            }
        };
    }, [isPlaying]);

    const handlePlay = useCallback(async () => {
        if (!audioContextRef.current) return;

        // Critical: Resume context on user gesture to unlock audio
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        if (isPlaying) {
            stopPlayback(audioContextRef.current);
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
            try {
                await playMelody(melody, tempo, instruments, audioContextRef.current, () => {
                    setIsPlaying(false);
                });
            } catch (e) {
                console.error("Playback failed", e);
                setIsPlaying(false);
            }
        }
    }, [isPlaying, melody, tempo, instruments]);

    const handleDownload = () => {
        const midiDataUri = generateMidiDataUri(melody, tempo);
        const link = document.createElement('a');
        link.href = midiDataUri;
        link.download = 'quantum-melody.mid';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-quantum-dark-2 rounded-xl p-6 shadow-lg border border-white/10 flex items-center justify-center space-x-4">
            <button
                onClick={handlePlay}
                className="flex items-center justify-center p-4 rounded-full bg-quantum-accent text-white hover:bg-opacity-90 transition-all duration-300 transform hover:scale-110 shadow-glow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-quantum-accent focus:ring-offset-quantum-dark"
                aria-label={isPlaying ? 'Stop' : 'Play'}
            >
                {isPlaying ? <StopIcon /> : <PlayIcon />}
            </button>
            <button
                onClick={handleDownload}
                className="flex items-center justify-center p-4 rounded-full bg-quantum-light text-quantum-dark hover:bg-opacity-90 transition-all duration-300 transform hover:scale-110 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-quantum-light focus:ring-offset-quantum-dark"
                aria-label="Download MIDI"
            >
                <DownloadIcon />
            </button>
        </div>
    );
};
