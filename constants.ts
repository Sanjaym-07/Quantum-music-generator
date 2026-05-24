
import { Settings, InstrumentType } from './types';

export const SCALES = {
    'C Major': ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
    'A Minor': ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4'],
    'C Major Pentatonic': ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'],
    'E Phrygian (Exotic)': ['E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4'],
    'F Lydian (Dreamy)': ['F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4'],
    'Gypsy Minor': ['C4', 'D4', 'Eb4', 'F#4', 'G4', 'Ab4', 'B4', 'C5'],
    'Whole Tone': ['C4', 'D4', 'E4', 'F#4', 'G#4', 'A#4', 'C5'],
};

export const INSTRUMENTS: { label: string; value: InstrumentType }[] = [
    { label: 'Grand Piano', value: 'piano' },
    { label: 'Cyber Violin', value: 'violin' },
    { label: 'Deep Cello', value: 'cello' },
    { label: 'Ethereal Flute', value: 'flute' },
    { label: 'Distorted Guitar', value: 'guitar' },
    { label: 'Crystal Harp', value: 'harp' },
    { label: 'Space Choir', value: 'choir' },
    { label: 'Neon Sitar', value: 'sitar' },
    { label: 'Steel Pan', value: 'steelpan' },
    { label: 'Glass Marimba', value: 'marimba' },
    { label: 'Synth Clarinet', value: 'clarinet' },
    { label: 'Tubular Bells', value: 'bell' },
    { label: 'Plucked Synth', value: 'pluck' },
    { label: 'Sub Bass', value: 'bass' },
    { label: 'Warm Pad', value: 'pad' },
    { label: 'Quantum Drum Kit', value: 'drum' },
    { label: 'Retro 8-bit', value: '8bit' },
    { label: 'Pure Sine', value: 'sine' },
];

export const VIBES = [
    'Cosmic Void (Deep, Empty, Mysterious)',
    'Cyberpunk Neon (High-tech, Rain, Gritty)',
    'Ethereal Dreamscape (Soft, Floating, Pastel)',
    'Ancient Ruins (Mystical, Echoing, Stone)',
    'Digital Glitch (Distorted, Chaotic, Data)',
    'Underwater Bioluminescence (Glowing, Muffled, Fluid)',
    'Solar Flare (Intense, Hot, Radiant)',
    'Crystal Caverns (Sharp, Reflective, Cold)'
];

export const DEFAULT_SETTINGS: Settings = {
    qubits: 3,
    melodyLength: 16,
    tempo: 120,
    scale: SCALES['C Major'],
    instruments: ['piano'], // Changed to array
    vibe: VIBES[0],
};
