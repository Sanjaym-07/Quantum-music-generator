import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Note, QuantumState } from '../types';

interface VisualizationProps {
    quantumStates: QuantumState[];
    melody: Note[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-quantum-dark-2 p-2 border border-quantum-accent/50 rounded">
        <p className="label text-quantum-light">{`State: ${label}`}</p>
        <p className="intro text-white">{`Probability: ${(payload[0].value * 100).toFixed(2)}%`}</p>
      </div>
    );
  }
  return null;
};


export const Visualization: React.FC<VisualizationProps> = ({ quantumStates, melody }) => {
    // Piano roll constants
    const noteToPitch: { [key: string]: number } = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
    const pitchToNote: string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    const getNoteMidi = (note: string): number => {
        const octave = parseInt(note.slice(-1));
        const pitchName = note.slice(0, -1);
        return noteToPitch[pitchName] + octave * 12;
    };

    // FIX: The type of `uniqueNotes` was being inferred as `unknown[]`, leading to type errors.
    // Explicitly casting to `string[]` resolves the issue for this line and subsequent uses.
    const uniqueNotes = ([...new Set(melody.map(n => n.note))] as string[]).sort((a, b) => getNoteMidi(a) - getNoteMidi(b));
    const noteRange = uniqueNotes.length > 0 ? getNoteMidi(uniqueNotes[uniqueNotes.length - 1]) - getNoteMidi(uniqueNotes[0]) + 1 : 12;
    const minMidi = uniqueNotes.length > 0 ? getNoteMidi(uniqueNotes[0]) : 48;
    const pianoKeys = Array.from({ length: Math.max(12, noteRange) }, (_, i) => minMidi + i);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-quantum-dark-2 rounded-xl p-6 shadow-lg border border-white/10">
                <h3 className="text-lg font-bold text-quantum-light mb-4">Quantum State Probabilities</h3>
                 <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={quantumStates} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="state" stroke="#a19de8" tick={{ fill: '#a19de8' }} />
                            <YAxis stroke="#a19de8" tick={{ fill: '#a19de8' }} tickFormatter={(tick) => `${(tick * 100).toFixed(0)}%`} />
                            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(108, 99, 255, 0.1)'}}/>
                            <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                                {quantumStates.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill="#6c63ff" />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-quantum-dark-2 rounded-xl p-6 shadow-lg border border-white/10">
                <h3 className="text-lg font-bold text-quantum-light mb-4">Generated Melody</h3>
                <div className="relative w-full h-[300px] overflow-x-auto overflow-y-hidden bg-quantum-dark rounded">
                     <div className="flex flex-col h-full">
                         {pianoKeys.reverse().map(midi => {
                             const noteName = pitchToNote[midi % 12];
                             const isBlackKey = ['C#', 'D#', 'F#', 'G#', 'A#'].includes(noteName);
                             return (
                                 <div key={midi} className={`flex-1 ${isBlackKey ? 'bg-gray-700' : 'bg-gray-800 border-b border-quantum-dark'} relative`}>
                                     <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs text-gray-400 select-none">
                                        {noteName}{Math.floor(midi / 12)}
                                     </span>
                                 </div>
                             );
                         })}
                     </div>
                     <div className="absolute top-0 left-0 h-full flex items-end" style={{ width: `${melody.length * 4}rem` }}>
                        {melody.map((note, index) => {
                            const midi = getNoteMidi(note.note);
                            const topPosition = pianoKeys.length - 1 - (midi - minMidi);
                            const noteHeight = 100 / pianoKeys.length;
                            
                            const durationToWidth: { [key: string]: string } = { 'q': '4rem', 'h': '8rem', '8n': '2rem' };

                            return (
                                <div
                                    key={index}
                                    className="absolute bg-quantum-accent rounded border-2 border-quantum-light animate-fade-in"
                                    style={{
                                        top: `${topPosition * noteHeight}%`,
                                        left: `${index * 4}rem`,
                                        width: durationToWidth[note.duration] || '4rem',
                                        height: `${noteHeight}%`,
                                        opacity: note.velocity / 127
                                    }}
                                    title={`${note.note} - Duration: ${note.duration}`}
                                ></div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};