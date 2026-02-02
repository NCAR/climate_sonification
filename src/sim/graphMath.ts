// src/sim/graphMath.ts
import { calcLargestVal, type AvgArr } from "./dataMath";

export type GraphDimsInput = {
  pageBottom: number;
  pageRight: number;
  GRAPHVERTDIV: number;
  MAPDIV: number;
};

export type GraphDims = {
  step: number;
  avg: number;
  co2_median: number;
  co2_range: number;
  co2_avg: number;
};

/*** return calculations based on page size for graph ***/
export const calcGraphDims = ({
  pageBottom,
  pageRight,
  GRAPHVERTDIV,
  MAPDIV,
}: GraphDimsInput): GraphDims => {
  const graphBottom = Math.floor(pageBottom * GRAPHVERTDIV);
  const modelWidth = Math.floor(pageRight * MAPDIV);

  const bottom = graphBottom - 1;
  const right = modelWidth - 1;

  const step = right / 180;
  const avg = bottom / 2;

  const co2_median = 300;
  const co2_range = 700;
  const co2_avg = Math.floor(avg * 1.6);

  return { step, avg, co2_median, co2_range, co2_avg };
};

export type PrecipGraphVars = {
  precip_median: number;
  precip_range: number;
};

/*** variables to determine graph drawing ***/
export const calcPrecipGraphVars = (data: AvgArr): PrecipGraphVars => {
  const precip_median = 100;
  const precip_max = calcLargestVal(data, 0) + 40;
  const precip_range = precip_max - precip_median;
  return { precip_median, precip_range };
};

export type TempGraphVars = {
  temp_median: number;
  temp_range: number;
  temp_avg: number;
};

export const calcTempGraphVars = (data: AvgArr, avg: number): TempGraphVars => {
  const temp_median = 0;
  const temp_max = calcLargestVal(data, 0) + 3;
  const temp_range = temp_max;
  const temp_avg = Math.floor(avg * 1.5);
  return { temp_median, temp_range, temp_avg };
};
