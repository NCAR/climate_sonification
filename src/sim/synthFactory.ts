// src/sim/synthFactory.ts
import * as Tone from "tone";

export type SynthType = 0 | 1 | 2 | 3;

export const createSynth = (type: SynthType): Tone.Synth | Tone.FMSynth => {
  let retsynth: Tone.Synth | Tone.FMSynth;

  // Marimba
  if (type === 0) {
    retsynth = new Tone.FMSynth({
      harmonicity: 1,
      modulationIndex: 12.7,
      modulation: {
        type: "sine",
      },
      oscillator: {
        type: "sine",
      },
      envelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.7,
        release: 1,
      },
      volume: -4,
    }).toDestination();
  }
  // Woodwind
  else if (type === 1) {
    retsynth = new Tone.Synth({
      oscillator: {
        partials: [1, 0, 0.75, 0, 0.5, 0, 0.14, 0, 0.5, 0, 0.17, 0, 0.12],
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.9,
        release: 0.5,
      },
      volume: -4,
    }).toDestination();
  }
  // Violin
  else if (type === 2) {
    retsynth = new Tone.FMSynth({
      harmonicity: 3.01,
      modulationIndex: 14,
      oscillator: {
        type: "triangle",
      },
      envelope: {
        attack: 0.2,
        decay: 0.5,
        sustain: 0.5,
        release: 1,
      },
      modulation: {
        type: "square",
      },
      modulationEnvelope: {
        attack: 0.01,
        decay: 0.5,
        sustain: 0.2,
        release: 0.1,
      },
      volume: -4,
    }).toDestination();
  }
  // Piano
  else {
    const reverb = new Tone.Reverb(0.6);
    const fx = new Tone.EQ3(0.5, 1, -5).chain(reverb).toDestination();
    retsynth = new Tone.Synth({
      volume: -12,
      oscillator: {
        type: "fatcustom",
        partials: [0.8, 0.4, 0, 0.15, 0.075],
        spread: 12,
        count: 2,
      },
      envelope: {
        attack: 0.001,
        decay: 1.2,
        sustain: 0.9,
        release: 1.3,
      },
    }).connect(fx);
  }

  return retsynth;
};