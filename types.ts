
export interface Note {
  note: string; // e.g., 'C4', 'G#5'
  duration: 'q' | 'h' | '8n' | string; // quarter, half, eighth note
  velocity: number; // MIDI velocity 0-127
}

export interface QuantumState {
  state: string; // e.g., '001', '101'
  probability: number; // 0.0 to 1.0
}

export type Scale = 'MAJOR' | 'MINOR' | 'PENTATONIC';

export type InstrumentType = 
  | 'sine' 
  | 'square' 
  | 'sawtooth' 
  | 'triangle' 
  | 'pluck'
  | 'piano'
  | 'violin'
  | 'cello'
  | 'flute'
  | 'clarinet'
  | 'marimba'
  | 'bell'
  | 'bass'
  | '8bit'
  | 'harp'
  | 'pad'
  | 'steelpan'
  | 'drum'
  | 'guitar'
  | 'sitar'
  | 'choir';

export interface Settings {
    qubits: number;
    melodyLength: number;
    tempo: number;
    scale: string[];
    instruments: InstrumentType[]; // Changed from single instrument to array
    vibe: string;
}

export interface GenerationResult {
    quantumStates: QuantumState[];
    melody: Note[];
    description: string;
}
