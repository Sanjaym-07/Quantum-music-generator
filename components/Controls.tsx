
import React from 'react';
import { Settings, InstrumentType } from '../types';
import { SCALES, INSTRUMENTS, VIBES } from '../constants';
import { GenerateIcon } from './icons/GenerateIcon';

interface ControlsProps {
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
    onGenerate: () => void;
    isLoading: boolean;
}

const Slider: React.FC<{ label: string; value: number; min: number; max: number; step?: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ label, value, min, max, step = 1, onChange }) => (
    <div className="space-y-2">
        <label className="flex justify-between items-center text-sm font-medium text-gray-300">
            <span>{label}</span>
            <span className="text-quantum-light font-mono bg-quantum-dark py-1 px-2 rounded">{value}</span>
        </label>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-quantum-dark rounded-lg appearance-none cursor-pointer accent-quantum-accent"
        />
    </div>
);


export const Controls: React.FC<ControlsProps> = ({ settings, setSettings, onGenerate, isLoading }) => {
    
    const toggleInstrument = (inst: InstrumentType) => {
        setSettings(prev => {
            const exists = prev.instruments.includes(inst);
            let newInstruments;
            if (exists) {
                // Don't allow empty selection, keep at least one
                if (prev.instruments.length === 1) return prev;
                newInstruments = prev.instruments.filter(i => i !== inst);
            } else {
                newInstruments = [...prev.instruments, inst];
            }
            return { ...prev, instruments: newInstruments };
        });
    };

    const randomizeInstruments = () => {
        const count = Math.floor(Math.random() * 3) + 2; // Select 2 to 4 instruments
        const shuffled = [...INSTRUMENTS].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, count).map(i => i.value);
        setSettings(s => ({ ...s, instruments: selected }));
    };

    return (
        <div className="flex flex-col space-y-6">
            <h2 className="text-xl font-bold text-quantum-light border-b border-quantum-accent/20 pb-2">Parameters</h2>
            
            <Slider
                label="Number of Qubits"
                value={settings.qubits}
                min={2}
                max={8}
                onChange={(e) => setSettings(s => ({ ...s, qubits: parseInt(e.target.value) }))}
            />

            <Slider
                label="Melody Length (Notes)"
                value={settings.melodyLength}
                min={8}
                max={64}
                onChange={(e) => setSettings(s => ({ ...s, melodyLength: parseInt(e.target.value) }))}
            />

            <Slider
                label="Tempo (BPM)"
                value={settings.tempo}
                min={60}
                max={180}
                onChange={(e) => setSettings(s => ({ ...s, tempo: parseInt(e.target.value) }))}
            />

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-300">Instruments Layering</label>
                    <button 
                        onClick={randomizeInstruments}
                        className="text-xs text-quantum-accent hover:text-white underline"
                    >
                        Randomize Mix
                    </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {INSTRUMENTS.map(inst => {
                        const isSelected = settings.instruments.includes(inst.value);
                        return (
                            <button
                                key={inst.value}
                                onClick={() => toggleInstrument(inst.value)}
                                className={`text-xs py-2 px-2 rounded border transition-all duration-200 ${
                                    isSelected 
                                    ? 'bg-quantum-accent border-quantum-light text-white shadow-glow' 
                                    : 'bg-quantum-dark border-white/10 text-gray-400 hover:bg-white/5'
                                }`}
                            >
                                {inst.label}
                            </button>
                        );
                    })}
                </div>
                <p className="text-xs text-gray-500 text-right">{settings.instruments.length} active</p>
            </div>

            <div className="space-y-2">
                <label htmlFor="scale-select" className="text-sm font-medium text-gray-300">Musical Scale</label>
                <select
                    id="scale-select"
                    value={Object.keys(SCALES).find(key => SCALES[key as keyof typeof SCALES].join(',') === settings.scale.join(','))}
                    onChange={(e) => setSettings(s => ({ ...s, scale: SCALES[e.target.value as keyof typeof SCALES] }))}
                    className="w-full bg-quantum-dark border border-quantum-accent/50 text-white rounded-lg focus:ring-quantum-accent focus:border-quantum-accent p-2.5"
                >
                    {Object.keys(SCALES).map(scaleName => (
                        <option key={scaleName} value={scaleName}>{scaleName}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label htmlFor="vibe-select" className="text-sm font-medium text-gray-300">Atmosphere / Vibe</label>
                <select
                    id="vibe-select"
                    value={settings.vibe}
                    onChange={(e) => setSettings(s => ({ ...s, vibe: e.target.value }))}
                    className="w-full bg-quantum-dark border border-quantum-accent/50 text-white rounded-lg focus:ring-quantum-accent focus:border-quantum-accent p-2.5"
                >
                    {VIBES.map(v => (
                        <option key={v} value={v}>{v}</option>
                    ))}
                </select>
            </div>
            
            <button
                onClick={onGenerate}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-quantum-accent hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-quantum-accent focus:ring-offset-quantum-dark disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-glow"
            >
                <GenerateIcon />
                <span className="ml-2">{isLoading ? 'Generating...' : 'Generate Music'}</span>
            </button>
        </div>
    );
};
