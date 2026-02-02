// src/const/scales.ts

const CMajor = "C D E F G A B,";
const CHarmonic = "C D Eb F G Ab B,";
const CPhrygiDorian = "C Db Eb F G A Bb,";
const CPhrygiDominant = "C Db E F G Ab Bb,";
const CDoubleHarmonic = "C Db E F G Ab B,";

const toFullScale = (scaleString: string): string[] =>
  scaleString
    .repeat(6) // adds octaves
    .split(",") // splits by octave
    .map((row) => (row ? row.split(" ") : ["C"])) // adds final note
    .map((row, idx) =>
      row.map((r) => r + (idx + 2).toString()).join(" ")
    ) // adds octave numbers
    .join(" ")
    .split(" "); // flattens array

// Literal typing preserves exact keys ("maj" | "harm" | ...)
export const SCALES = {
  maj: toFullScale(CMajor),
  harm: toFullScale(CHarmonic),
  pdor: toFullScale(CPhrygiDorian),
  pdom: toFullScale(CPhrygiDominant),
  dharm: toFullScale(CDoubleHarmonic),
} as const;

export type ScaleName = keyof typeof SCALES;

/*
These indices correspond more or less to breaking up the range of CO2 values into
5 evenly spaced increments...
*/
export const getScale = (idx: number): ScaleName => {
  if (idx < 104) return "maj";
  if (idx < 130) return "harm";
  if (idx < 152) return "pdor";
  if (idx < 166) return "pdom";
  return "dharm";
};
