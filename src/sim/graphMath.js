// src/sim/graphMath.js
import { calcLargestVal } from "./dataMath";
/*
export const getGraphDims = ({
  pageBottom,
  pageRight,
  GRAPHVERTDIV,
  MAPDIV,
}) => {
  const step = pageBottom / GRAPHVERTDIV / 8;
  const avg = pageRight / MAPDIV / 180;
  const co2_median = step * 7.5;
  const co2_range = step * 7;
  const co2_avg = avg * 360;
  return { step, avg, co2_median, co2_range, co2_avg };
};

export const getPrecipGraphVars = (data) => {
  const precip_avg = 0.17;
  const precip_median = precip_avg * 2.5;
  const precip_range = precip_avg * 2.25;
  return { precip_median, precip_range };
};

export const getTempGraphVars = (data, avg) => {
  const temp_avg = avg * 30;
  const temp_median = temp_avg * 1;
  const temp_range = temp_avg / 1.5;
  return { temp_median, temp_range, temp_avg };
};
*/

/*** return calculations based on page size for graph ***/
export const calcGraphDims = ({
  pageBottom,
  pageRight,
  GRAPHVERTDIV,
  MAPDIV,
}) => {
  var graphBottom = Math.floor(pageBottom * GRAPHVERTDIV);
  var modelWidth = Math.floor(pageRight * MAPDIV);

  var bottom = graphBottom - 1;
  var right = modelWidth - 1;

  var step = right / 180;
  var avg = bottom / 2;

  var co2_median = 300;
  var co2_range = 700;
  var co2_avg = Math.floor(avg * 1.6);

  return { step, avg, co2_median, co2_range, co2_avg };
};
/*** variables te determine graph drawing ***/
export const calcPrecipGraphVars = (data) => {
  var precip_median = 100;
  var precip_max = calcLargestVal(data, 0) + 40;
  var precip_range = precip_max - precip_median;
  return { precip_median, precip_range };
};
export const calcTempGraphVars = (data, avg) => {
  var temp_median = 0;
  var temp_max = calcLargestVal(data, 0) + 3;
  var temp_range = temp_max;
  var temp_avg = Math.floor(avg * 1.5);
  return { temp_median, temp_range, temp_avg };
};