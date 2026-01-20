// src/sim/dataMath.js
/*
export const getValByIndex = (arr, ind) => {
  if (arr.length <= 0) return 0;
  ind = Math.min(ind, arr.length - 1);
  return arr[ind][Object.keys(arr[0])[1]];
};

export const getLargestVal = (arr, start) => {
  let ret = 0;
  for (let i = start; i < arr.length; i++) {
    ret = Math.max(ret, arr[i][Object.keys(arr[0])[1]]);
  }
  return ret;
};

export const getValByCoord = (arr, coordIndex) => {
  if (arr.length <= 0) return 0;
  coordIndex = Math.min(coordIndex, arr.length - 1);
  return arr[coordIndex][Object.keys(arr[0])[4]];
};

export const getDBCoords = (latitude, longitude) => {
  let useLat = latitude;
  let useLon = longitude;

  if (useLat === -90) useLat = -89;
  if (useLon >= 0) useLon -= 179;
  else useLon += 180;

  const dbX = Math.floor(((useLon + 180) / 360) * 180);
  const dbY = Math.floor(((useLat + 90) / 180) * 90);

  return { dbX, dbY };
};

export const getDBIndex = (dbX, dbY) => dbY * 180 + dbX;
*/
/*** read data value for a certain index (year-1920) ***/
export const calcValByIndex = (arr, ind) => {
  var avgKeys = Object.keys(arr[0]);
  var useAvgKey = avgKeys[ind + 2];
  var val = arr[0][useAvgKey];
  return val;
};
/*** get largest val over simulation years ***/
export const calcLargestVal = (arr, start) => {
  var avgKeys = Object.keys(arr[0]);
  var useAvgKey, val;
  var largestVal = start;
  for (var i = 0; i <= 180; i++) {
    useAvgKey = avgKeys[i + 2];
    val = arr[0][useAvgKey];
    if (val > largestVal) {
      largestVal = val;
    }
  }
  return largestVal;
};
/*** read data value for coordinate ***/

export const calcValByCoord = (arr, coord) => {
  var avgKeys0 = Object.keys(arr[coord]);
  var useAvgKey0 = avgKeys0[0];
  var val = arr[coord][useAvgKey0];
  return val;
};

/*** convert db coords from 2d to 1d ***/
export const calcDBIndex = (dbX, dbY) => {
  var coord_index = (dbY - 1) * 360 + (dbX - 1);
  return coord_index;
};
/*** return db coords from lat and lon in states ***/
export const calcDBCoords = (latitude, longitude) => {
  var dbX = 1;
  var dbY = 1;
  if (latitude === -90) {
    latitude = -89;
  }
  if (longitude >= 0) {
    longitude -= 179;
  } else {
    longitude += 180;
  }
  dbY = Math.floor(91 - latitude);
  dbX = Math.floor(180 + longitude);
  return { dbX, dbY };
};
