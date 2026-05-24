
import { Note } from '../types';

// Helper to convert a string to a byte array
const stringToBytes = (str: string) => str.split('').map(c => c.charCodeAt(0));

// Helper to write a variable-length quantity (for time deltas)
const writeVarLen = (value: number) => {
    let buffer = value & 0x7F;
    const bytes = [];
    while ((value >>= 7) > 0) {
        buffer <<= 8;
        buffer |= ((value & 0x7F) | 0x80);
    }
    while (true) {
        bytes.push(buffer & 0xFF);
        if (buffer & 0x80) buffer >>= 8;
        else break;
    }
    return bytes.reverse();
};

const noteToMidi = (note: string): number => {
    const pitchMap: { [key: string]: number } = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
    const octave = parseInt(note.slice(-1));
    const pitch = note.slice(0, -1);
    return 12 + (octave * 12) + pitchMap[pitch];
};

export const generateMidiDataUri = (melody: Note[], tempo: number): string => {
    const ticksPerQuarterNote = 120; // Resolution
    const msPerTick = (60 * 1000) / (tempo * ticksPerQuarterNote);
    
    const trackEvents: number[] = [];
    let lastTime = 0;
    
    melody.forEach(noteData => {
        const midiNote = noteToMidi(noteData.note);
        const velocity = noteData.velocity;
        
        let durationTicks: number;
        switch (noteData.duration) {
            case 'h': durationTicks = ticksPerQuarterNote * 2; break;
            case '8n': durationTicks = ticksPerQuarterNote / 2; break;
            case 'q':
            default: durationTicks = ticksPerQuarterNote; break;
        }

        const deltaTime = 0; // Notes play sequentially for simplicity
        
        // Note On event: delta-time, 0x90, note, velocity
        trackEvents.push(...writeVarLen(deltaTime));
        trackEvents.push(0x90, midiNote, velocity);
        
        // Note Off event: delta-time, 0x80, note, velocity
        trackEvents.push(...writeVarLen(durationTicks));
        trackEvents.push(0x80, midiNote, 0x40);
    });

    // End of Track event
    trackEvents.push(...writeVarLen(0));
    trackEvents.push(0xFF, 0x2F, 0x00);
    
    const trackChunk = [
        ...stringToBytes('MTrk'),
        0x00, 0x00, 0x00, trackEvents.length, // Track length
        ...trackEvents
    ];

    const headerChunk = [
        ...stringToBytes('MThd'),
        0x00, 0x00, 0x00, 0x06, // Header length
        0x00, 0x00,             // Format 0 (single track)
        0x00, 0x01,             // Number of tracks
        (ticksPerQuarterNote >> 8) & 0xFF, ticksPerQuarterNote & 0xFF, // Ticks per quarter note
    ];

    const midiBytes = new Uint8Array([...headerChunk, ...trackChunk]);
    const base64String = btoa(String.fromCharCode.apply(null, Array.from(midiBytes)));

    return `data:audio/midi;base64,${base64String}`;
};
