
import { Note, InstrumentType } from '../types';

// --- AUDIO CONTEXT & STATE ---

let scheduledNodes: AudioNode[] = [];
let reverbBuffer: AudioBuffer | null = null;

// --- MIXING CONFIGURATION ---

// BOOSTED GAINS: Pushed near max (0.8 - 1.2) for loud playback
const MIX_PROFILE: Record<InstrumentType, { pan: number; octave: number; gain: number }> = {
    'piano': { pan: -0.1, octave: 0, gain: 1.0 },
    'violin': { pan: -0.5, octave: 0, gain: 0.9 },
    'cello': { pan: 0.4, octave: -1, gain: 1.0 },
    'flute': { pan: -0.2, octave: 1, gain: 0.8 },
    'guitar': { pan: 0.35, octave: 0, gain: 0.85 },
    'harp': { pan: -0.3, octave: 0, gain: 0.9 },
    'choir': { pan: 0, octave: 0, gain: 0.7 },
    'sitar': { pan: 0.6, octave: 0, gain: 0.8 },
    'steelpan': { pan: -0.6, octave: 0, gain: 1.0 },
    'marimba': { pan: 0.2, octave: 0, gain: 1.0 },
    'clarinet': { pan: -0.15, octave: 0, gain: 0.8 },
    'bell': { pan: 0.5, octave: 1, gain: 0.9 },
    'pluck': { pan: 0.1, octave: 0, gain: 0.9 },
    'bass': { pan: 0, octave: -2, gain: 1.1 },
    'pad': { pan: 0, octave: 0, gain: 0.7 },
    'drum': { pan: 0, octave: 0, gain: 1.5 }, // Drums need to hit HARD
    '8bit': { pan: 0.25, octave: 0, gain: 0.7 },
    'sine': { pan: 0, octave: 0, gain: 0.8 },
    'square': { pan: -0.2, octave: 0, gain: 0.5 }, 
    'sawtooth': { pan: 0.2, octave: 0, gain: 0.5 },
    'triangle': { pan: 0, octave: 0, gain: 0.9 }
};

// --- HELPER FUNCTIONS ---

const noteToMidi = (note: string): number => {
    const pitchMap: { [key: string]: number } = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
    const pitchMapFlat: { [key: string]: number } = { Db: 1, Eb: 3, Gb: 6, Ab: 8, Bb: 10 };
    
    const octave = parseInt(note.slice(-1));
    const pitch = note.slice(0, -1);
    
    const pIndex = pitchMap[pitch] !== undefined ? pitchMap[pitch] : pitchMapFlat[pitch];
    if (pIndex === undefined) return 60; 
    
    return 12 + (octave * 12) + pIndex;
};

const midiToFreq = (midi: number): number => {
    return Math.pow(2, (midi - 69) / 12) * 440;
};

// Smoother, Darker Reverb to avoid "Static" sound
const createReverbBuffer = (ctx: AudioContext): AudioBuffer => {
    const length = ctx.sampleRate * 2.5; 
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
        // Exponential decay
        const decay = Math.pow(0.001, i / length);
        left[i] = (Math.random() * 2 - 1) * decay * 0.7; // Increased reverb volume slightly
        right[i] = (Math.random() * 2 - 1) * decay * 0.7; 
    }
    return buffer;
};

// Warm Overdrive (Band-limited distortion)
const makeDistortionCurve = (amount: number) => {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; ++i) {
        const x = i * 2 / n_samples - 1;
        // Soft clipping (ArcTangent) - much smoother than hard clipping
        curve[i] = (2 / Math.PI) * Math.atan(k * x);
    }
    return curve;
};

// --- SYNTHESIS ENGINE ---

const playTone = (
    ctx: AudioContext, 
    destination: AudioNode, 
    midiOriginal: number,
    startTime: number, 
    duration: number, 
    velocity: number, 
    type: InstrumentType
) => {
    const profile = MIX_PROFILE[type];
    
    // Octave Shift
    const freq = midiToFreq(midiOriginal + (profile.octave * 12));
    
    const t = startTime;
    const dur = duration;
    
    // Updated velocity calculation for MAX LOUDNESS
    // MIDI velocity is 0-127. We normalize it and apply gain.
    const vel = (velocity / 127) * profile.gain; 
    
    const stopTime = t + dur + 2.0;

    // Stereo Panner
    const panner = ctx.createStereoPanner();
    panner.pan.value = profile.pan;
    panner.connect(destination);

    // Note Gain Envelope
    const noteGain = ctx.createGain();
    noteGain.connect(panner);
    scheduledNodes.push(noteGain, panner);

    // --- INSTRUMENT PATCHES ---

    if (type === 'piano' || type === 'marimba' || type === 'steelpan' || type === 'bell') {
        // FM Synthesis for clear, bell-like tones
        const carrier = ctx.createOscillator();
        const modulator = ctx.createOscillator();
        const modGain = ctx.createGain();

        carrier.type = 'sine';
        modulator.type = 'sine';

        const ratio = type === 'piano' ? 1 : (type === 'bell' ? 3.5 : 2);
        carrier.frequency.value = freq;
        modulator.frequency.value = freq * ratio;

        const modulationIndex = type === 'piano' ? 100 : 300;
        
        modGain.gain.setValueAtTime(modulationIndex, t);
        modGain.gain.exponentialRampToValueAtTime(1, t + dur * 0.8);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        // Amplitude Envelope
        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(vel, t + 0.02); // Fast attack
        env.gain.exponentialRampToValueAtTime(0.01, t + dur + 1.0);

        carrier.connect(env);
        env.connect(noteGain);

        carrier.start(t); modulator.start(t);
        carrier.stop(stopTime); modulator.stop(stopTime);
        scheduledNodes.push(carrier, modulator, modGain, env);

    } else if (type === 'violin' || type === 'cello' || type === 'sitar' || type === 'sawtooth') {
        // Subtractive Synthesis
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;

        const subOsc = ctx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.value = freq;

        // Vibrato LFO
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 6;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = freq * 0.015; // Stronger vibrato
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfoGain.connect(subOsc.frequency);
        lfo.start(t); lfo.stop(stopTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(type === 'cello' ? 800 : 1500, t); 

        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        const attack = type === 'sitar' ? 0.02 : 0.3; 
        env.gain.linearRampToValueAtTime(vel, t + attack);
        env.gain.linearRampToValueAtTime(0, t + dur + 0.5);

        osc.connect(filter);
        subOsc.connect(env);
        filter.connect(env);
        env.connect(noteGain);

        osc.start(t); osc.stop(stopTime);
        subOsc.start(t); subOsc.stop(stopTime);
        scheduledNodes.push(osc, subOsc, lfo, lfoGain, filter, env);

    } else if (type === 'guitar' || type === 'pluck') {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;

        const hpFilter = ctx.createBiquadFilter();
        hpFilter.type = 'highpass';
        hpFilter.frequency.value = 150;

        const shaper = ctx.createWaveShaper();
        shaper.curve = makeDistortionCurve(8); // More drive

        const lpFilter = ctx.createBiquadFilter();
        lpFilter.type = 'lowpass';
        lpFilter.frequency.value = 3000;

        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(vel, t + 0.01);
        env.gain.exponentialRampToValueAtTime(0.01, t + dur + 0.4);

        osc.connect(hpFilter);
        hpFilter.connect(shaper);
        shaper.connect(lpFilter);
        lpFilter.connect(env);
        env.connect(noteGain);

        osc.start(t); osc.stop(stopTime);
        scheduledNodes.push(osc, hpFilter, shaper, lpFilter, env);

    } else if (type === 'flute' || type === 'clarinet' || type === 'choir' || type === 'pad' || type === 'sine') {
        const osc = ctx.createOscillator();
        osc.type = type === 'clarinet' ? 'square' : 'sine';
        osc.frequency.value = freq;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = type === 'clarinet' ? 900 : 8000;

        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(vel, t + 0.1);
        env.gain.linearRampToValueAtTime(0, t + dur + 0.3);

        osc.connect(filter);
        filter.connect(env);
        env.connect(noteGain);

        osc.start(t); osc.stop(stopTime);
        scheduledNodes.push(osc, filter, env);

    } else {
        // Fallback
        const osc = ctx.createOscillator();
        osc.type = (type === '8bit' || type === 'square') ? 'square' : 'triangle';
        osc.frequency.value = freq;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = type === 'bass' ? 400 : 3000;

        const env = ctx.createGain();
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(vel, t + 0.02);
        env.gain.linearRampToValueAtTime(0, t + dur);

        osc.connect(filter);
        filter.connect(env);
        env.connect(noteGain);

        osc.start(t); osc.stop(stopTime);
        scheduledNodes.push(osc, filter, env);
    }
};

const playDrumSound = (ctx: AudioContext, type: 'kick' | 'snare' | 'hihat', t: number, velocity: number, destination: AudioNode) => {
    const vel = (velocity / 127) * MIX_PROFILE['drum'].gain; 

    if (type === 'kick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
        
        gain.gain.setValueAtTime(vel, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

        osc.connect(gain);
        gain.connect(destination);
        
        osc.start(t); osc.stop(t + 0.5);
        scheduledNodes.push(osc, gain);

    } else if (type === 'snare') {
        const noise = ctx.createBufferSource();
        const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for(let i=0; i<data.length; i++) data[i] = (Math.random()*2-1);
        noise.buffer = buf;
        
        const filt = ctx.createBiquadFilter();
        filt.type = 'highpass';
        filt.frequency.value = 1000;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vel * 0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        
        noise.connect(filt);
        filt.connect(gain);
        gain.connect(destination);
        
        noise.start(t); noise.stop(t + 0.2);
        scheduledNodes.push(noise, filt, gain);

    } else {
        const noise = ctx.createBufferSource();
        const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for(let i=0; i<data.length; i++) data[i] = (Math.random()*2-1);
        noise.buffer = buf;
        
        const filt = ctx.createBiquadFilter();
        filt.type = 'highpass';
        filt.frequency.value = 5000;
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vel * 0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        
        noise.connect(filt);
        filt.connect(gain);
        gain.connect(destination);
        
        noise.start(t); noise.stop(t + 0.05);
        scheduledNodes.push(noise, filt, gain);
    }
};

// --- MAIN PLAYBACK ---

export const stopPlayback = (audioContext: AudioContext | null) => {
    scheduledNodes.forEach(node => {
        try {
            if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
                node.stop();
            }
            node.disconnect();
        } catch (e) { }
    });
    scheduledNodes = [];
};

export const playMelody = async (melody: Note[], tempo: number, instruments: InstrumentType[], audioContext: AudioContext, onEnded: () => void) => {
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    stopPlayback(audioContext);

    const masterGain = audioContext.createGain();
    
    // DRIVE: Push gain significantly higher than 1.0 to hit the limiter
    const layerCount = Math.max(1, instruments.length);
    // 2.5x drive per layer factor. 
    masterGain.gain.value = 2.5 / Math.sqrt(layerCount); 

    // --- MAXIMIZER CHAIN ---
    // 1. Hard Limiter (Compressor with high ratio and fast attack)
    // This prevents clipping while allowing high average volume
    const limiter = audioContext.createDynamicsCompressor();
    limiter.threshold.value = -12; // Start compressing early
    limiter.knee.value = 0; // Hard knee
    limiter.ratio.value = 20; // Infinite compression (Limiting)
    limiter.attack.value = 0.002; // Very fast attack to catch peaks
    limiter.release.value = 0.1; // Fast release to keep loudness high

    // 2. Makeup Gain (Post-Limiter Boost)
    const makeupGain = audioContext.createGain();
    makeupGain.gain.value = 1.5; // Boost the limited signal to the ceiling

    // 3. Reverb Send
    if (!reverbBuffer) reverbBuffer = createReverbBuffer(audioContext);
    const reverb = audioContext.createConvolver();
    reverb.buffer = reverbBuffer;
    const reverbGain = audioContext.createGain();
    reverbGain.gain.value = 0.25; // Reverb adds to the "Size"

    // 4. Delay Send
    const delay = audioContext.createDelay();
    delay.delayTime.value = 60 / tempo * 0.5; 
    const delayFeedback = audioContext.createGain();
    delayFeedback.gain.value = 0.2;
    const delayGain = audioContext.createGain();
    delayGain.gain.value = 0.2;

    delay.connect(delayFeedback);
    delayFeedback.connect(delay);

    // Wiring: Source -> MasterGain -> Limiter -> MakeupGain -> Destination
    masterGain.connect(limiter);
    limiter.connect(makeupGain);
    makeupGain.connect(audioContext.destination);
    
    // Parallel FX
    masterGain.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(audioContext.destination); // Reverb bypasses limiter to stay airy

    masterGain.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(audioContext.destination);

    // Scheduling
    const startTime = audioContext.currentTime + 0.1;
    const beatDuration = 60 / tempo;
    let currentTime = startTime;

    melody.forEach(note => {
        const midiBase = noteToMidi(note.note);
        
        let dur = beatDuration;
        if (note.duration === 'h') dur = beatDuration * 2;
        if (note.duration === '8n') dur = beatDuration / 2;
        
        instruments.forEach(inst => {
            const humanize = Math.random() * 0.015; 
            const noteTime = currentTime + humanize;

            if (inst === 'drum') {
                const noteType = midiBase % 3; 
                if (noteType === 0) playDrumSound(audioContext, 'kick', noteTime, note.velocity, masterGain);
                else if (noteType === 1) playDrumSound(audioContext, 'snare', noteTime, note.velocity, masterGain);
                else playDrumSound(audioContext, 'hihat', noteTime, note.velocity, masterGain);
            } else {
                playTone(audioContext, masterGain, midiBase, noteTime, dur, note.velocity, inst);
            }
        });

        currentTime += dur;
    });

    const totalDuration = currentTime - startTime;
    setTimeout(() => {
        onEnded();
        stopPlayback(audioContext);
    }, totalDuration * 1000 + 3000); 
};
