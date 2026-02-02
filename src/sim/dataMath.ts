// src/sim/dataMath.js

export type AvgRow = Record<string, number>;
export type AvgArr = [AvgRow, ...AvgRow[]];

export type CoordRow = Record<string, number>;
export type CoordArr = CoordRow[];

/*** read data value for a certain index (year-1920) ***/
export const calcValByIndex = (arr: AvgArr, ind: number): number => {
  const avgKeys = Object.keys(arr[0]);
  const key = avgKeys[ind + 2];
  if (key === undefined) return 0; // or throw new Error(...)
  const v = arr[0][key];
  return v ?? 0;
};

/*** get largest val over simulation years ***/
export const calcLargestVal = (arr: AvgArr, start: number): number => {
  const avgKeys = Object.keys(arr[0]);
  let largestVal = start;

  for (let i = 0; i <= 180; i++) {
    const key = avgKeys[i + 2];
    if (key === undefined) continue; // or break, depending on expected data
    const v = arr[0][key];
    if (v != null && v > largestVal) largestVal = v;
  }

  return largestVal;
};

/*** read data value for coordinate ***/
export const calcValByCoord = (arr: CoordArr, coord: number): number => {
  const row = arr[coord];
  if (!row) return 0;

  const firstKey = Object.keys(row)[0];
  if (firstKey === undefined) return 0; 

  const v = row[firstKey];
  return v ?? 0;
};

/*** convert db coords from 2d to 1d ***/
export const calcDBIndex = (dbX: number, dbY: number): number => {
  return (dbY - 1) * 360 + (dbX - 1);
};

/*** return db coords from lat and lon in states ***/
export const calcDBCoords = (
  latitude: number,
  longitude: number,
): { dbX: number; dbY: number } => {
  let lat = latitude;
  let lon = longitude;

  if (lat === -90) lat = -89;

  if (lon >= 0) lon -= 179;
  else lon += 180;

  const dbY = Math.floor(91 - lat);
  const dbX = Math.floor(180 + lon);

  return { dbX, dbY };
};
