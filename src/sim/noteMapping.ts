// src/sim/noteMapping.ts
import { SCALES } from "../const/scales";

export type NoteType = 0 | 1 | 2 | 3;

// If SCALES is declared as `const SCALES = { ... } as const`,
// this becomes a precise union of its keys.
export type ScaleName = keyof typeof SCALES;

export const createNote = (
  type: NoteType,
  value: number,
  scale: ScaleName = "maj" as ScaleName
): string => {
  let retval = 0;

  // precip
  if (type === 0) {
    if (value < 50) retval = 0;
    else if (value < 60) retval = 1;
    else if (value < 70) retval = 2;
    else if (value < 75) retval = 3;
    else if (value < 80) retval = 4;
    else if (value < 85) retval = 5;
    else if (value < 90) retval = 6;
    else if (value < 92.5) retval = 7;
    else if (value < 95) retval = 8;
    else if (value < 97.5) retval = 9;
    else if (value < 100) retval = 10;
    else if (value < 102.5) retval = 11;
    else if (value < 105) retval = 12;
    else if (value < 107.5) retval = 13;
    else if (value < 110) retval = 14;
    else if (value < 115) retval = 15;
    else if (value < 120) retval = 16;
    else if (value < 125) retval = 17;
    else if (value < 130) retval = 18;
    else if (value < 135) retval = 19;
    else if (value < 140) retval = 20;
    else if (value < 145) retval = 21;
    else if (value < 150) retval = 22;
    else if (value < 155) retval = 23;
    else if (value < 160) retval = 24;
    else if (value < 165) retval = 25;
    else if (value < 170) retval = 26;
    else if (value < 175) retval = 27;
    else if (value < 180) retval = 28;
    else if (value < 190) retval = 29;
    else if (value < 200) retval = 30;
    else if (value < 220) retval = 31;
    else if (value < 240) retval = 32;
    else if (value < 260) retval = 33;
    else if (value < 280) retval = 34;
    else retval = 35;
  }

  // temp
  else if (type === 1) {
    if (value < -0.5) retval = 0;
    else if (value < -0.25) retval = 1;
    else if (value < 0) retval = 2;
    else if (value < 0.05) retval = 3;
    else if (value < 0.1) retval = 4;
    else if (value < 0.15) retval = 5;
    else if (value < 0.2) retval = 6;
    else if (value < 0.3) retval = 7;
    else if (value < 0.4) retval = 8;
    else if (value < 0.5) retval = 9;
    else if (value < 0.6) retval = 10;
    else if (value < 0.75) retval = 11;
    else if (value < 1) retval = 12;
    else if (value < 1.25) retval = 13;
    else if (value < 1.5) retval = 14;
    else if (value < 1.75) retval = 15;
    else if (value < 2) retval = 17;
    else if (value < 2.5) retval = 18;
    else if (value < 3) retval = 19;
    else if (value < 3.5) retval = 20;
    else if (value < 4) retval = 21;
    else if (value < 4.5) retval = 22;
    else if (value < 5) retval = 23;
    else if (value < 6) retval = 24;
    else if (value < 7) retval = 25;
    else if (value < 8) retval = 26;
    else if (value < 9) retval = 27;
    else if (value < 10) retval = 28;
    else if (value < 11) retval = 29;
    else if (value < 12) retval = 30;
    else if (value < 13) retval = 31;
    else if (value < 14) retval = 32;
    else if (value < 15) retval = 33;
    else if (value < 16) retval = 34;
    else retval = 35;
  }

  // sea ice
  else if (type === 2) {
    if (value > 0.98) retval = 34;
    else if (value > 0.96) retval = 33;
    else if (value > 0.955) retval = 32;
    else if (value > 0.95) retval = 31;
    else if (value > 0.945) retval = 30;
    else if (value > 0.94) retval = 29;
    else if (value > 0.93) retval = 28;
    else if (value > 0.92) retval = 27;
    else if (value > 0.91) retval = 26;
    else if (value > 0.9) retval = 25;
    else if (value > 0.89) retval = 24;
    else if (value > 0.875) retval = 23;
    else if (value > 0.85) retval = 22;
    else if (value > 0.825) retval = 21;
    else if (value > 0.8) retval = 20;
    else if (value > 0.75) retval = 19;
    else if (value > 0.7) retval = 18;
    else if (value > 0.65) retval = 17;
    else if (value > 0.6) retval = 16;
    else if (value > 0.55) retval = 15;
    else if (value > 0.5) retval = 14;
    else if (value > 0.45) retval = 13;
    else if (value > 0.4) retval = 12;
    else if (value > 0.35) retval = 11;
    else if (value > 0.3) retval = 10;
    else if (value > 0.25) retval = 9;
    else if (value > 0.2) retval = 8;
    else if (value > 0.15) retval = 7;
    else if (value > 0.1) retval = 6;
    else if (value > 0.08) retval = 5;
    else if (value > 0.06) retval = 4;
    else if (value > 0.04) retval = 3;
    else if (value > 0.02) retval = 2;
    else if (value > 0.01) retval = 1;
    else retval = 0;
  }

  // co2
  else {
    if (value < 310) retval = 7;
    else if (value < 325) retval = 8;
    else if (value < 350) retval = 9;
    else if (value < 375) retval = 10;
    else if (value < 400) retval = 11;
    else if (value < 425) retval = 12;
    else if (value < 450) retval = 13;
    else if (value < 475) retval = 14;
    else if (value < 500) retval = 15;
    else if (value < 525) retval = 16;
    else if (value < 550) retval = 17;
    else if (value < 575) retval = 18;
    else if (value < 600) retval = 19;
    else if (value < 625) retval = 20;
    else if (value < 650) retval = 21;
    else if (value < 675) retval = 22;
    else if (value < 700) retval = 23;
    else if (value < 725) retval = 24;
    else if (value < 750) retval = 25;
    else if (value < 775) retval = 26;
    else if (value < 800) retval = 27;
    else if (value < 850) retval = 28;
    else if (value < 900) retval = 30;
    else retval = 31;
  }

  const currentScale = SCALES[scale] as readonly string[];

  // Guard in case retval is out of bounds for a given scale array
  return currentScale[retval] ?? currentScale[currentScale.length - 1] ?? "C4";
};
