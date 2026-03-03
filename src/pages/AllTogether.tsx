import { prefetchImage } from "../utils/prefetchImage.js";
import { useNavigationShim } from "../routing/useNavigationShim";
import Axios, { type AxiosResponse } from "axios";
import PubSub from "pubsub-js";
import { isBrowser } from "react-device-detect";
import { Simulation } from "./Simulation";
import type { SimulationProps } from "./Simulation";
import * as Tone from "tone";
import { getClosestCity, getInfo } from "../const/cities";
import { RED, YELLOW, GREEN, BLUE } from "../const/color";
import { AvgArr } from "../sim/dataMath.js";
import { abortAndRenew } from "../sim/abort";

import {
  combinedImgs,
  dbUrl,
  urlPre,
  precipKey,
  tempKey,
  iceKey,
  homeButton,
  graphKey,
  topSkinnyImg,
  bottomSkinnyImg,
  timelineImg,
  togetherArtifactImgs,
  pauseUrl,
  playUrl
} from "../const/url.js";

function isNumeric(value: string): boolean {
  return /^-?\d+$/.test(value);
}

type ApiResponse<T> = { data: T };

type CoordArrayNum = 0 | 1 | 2;
type ToneTransport = ReturnType<typeof Tone.getTransport>;
type YearArrayNum = 0 | 1 | 2 | 3 | 4 | 5;
type YearStateKey = "precipAvg" | "tempAvg" | "iceAvg" | "precip1" | "temp1" | "ice1";
type NotesSetter = (arr: AvgArr) => void;

const transport = (): ToneTransport => Tone.getTransport();
function isCanceledAxiosError(error: unknown): boolean
{
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: unknown; name?: unknown };
  return e.code === "ERR_CANCELED" || e.name === "CanceledError";
}

/*** Page class ***/
class AllTogether extends Simulation {
  constructor(props:SimulationProps) {
    super(props);
    this.state = {
      ...this.state,
      modelStr: "/combined/combined_ens",
      precipAvg: [] as unknown as AvgArr,
      tempAvg: [] as unknown as AvgArr,
      iceAvg: [] as unknown as AvgArr,
      precip1: [] as unknown as AvgArr,
      temp1: [] as unknown as AvgArr,
      ice1: [] as unknown as AvgArr,
      precipAvgAllCoords: [] as unknown as AvgArr,
      tempAvgAllCoords: [] as unknown as AvgArr,
      iceAvgAllCoords: [] as unknown as AvgArr,
    };
  }
  yearPrecipController: AbortController | null = null;
  yearTempController: AbortController | null = null;
  yearIceController: AbortController | null = null;

  coordPrecipAvgController: AbortController | null = null;
  coordTempAvgController: AbortController | null = null;
  coordIceAvgController: AbortController | null = null;

  coordPrecip1Controller: AbortController | null = null;
  coordTemp1Controller: AbortController | null = null;
  coordIce1Controller: AbortController | null = null;

  _isYearSeriesReady = (arr: unknown): arr is AvgArr =>
  {
    return Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "object";
  };

  _isCo2Ready = (): boolean =>
  {
    const item = this.state.co2data[this.state.index]; 
    const v = item?.co2_val;
    const n = typeof v === "string" ? Number(v) : v;
    return Number.isFinite(n);
  };

  /* Test precip model key */
  testPrecipMusic = (e: React.PointerEvent | React.MouseEvent):void => {
    if (
      this.state.notePlaying === 0 &&
      e.buttons === 1 &&
      this.state.play === 0
    ) {
      let keyLeft = Math.floor(this.state.pageRight / 4);
      let keyRight = Math.floor(this.state.pageRight / 2);
      if (this.state.CONTROLVERTDIV !== 1) {
        keyLeft = Math.floor(this.state.pageRight / 20);
        keyRight = Math.floor(
          this.state.pageRight / 20 + (this.state.pageRight * 19) / 20 / 3,
        );
      }
      const x = e.pageX - keyLeft;
      const rangeX = keyRight - keyLeft;
      const percX = x / rangeX;
      const playVal = (percX - 0.175) * 500 + 100;
      this.playNoteByValKey(0, playVal);
    }
  };

  /* Test temp model key */
  testTempMusic = (e: React.PointerEvent | React.MouseEvent):void => {
    if (
      this.state.notePlaying === 0 &&
      e.buttons === 1 &&
      this.state.play === 0
    ) {
      let keyLeft = Math.floor(this.state.pageRight / 2);
      let keyRight = Math.floor((this.state.pageRight * 3) / 4);
      if (this.state.CONTROLVERTDIV !== 1) {
        keyLeft = Math.floor(
          this.state.pageRight / 20 + (this.state.pageRight * 19) / 20 / 3,
        );
        keyRight = Math.floor(
          this.state.pageRight / 20 + (2 * this.state.pageRight * 19) / 20 / 3,
        );
      }
      const x = e.pageX - keyLeft;
      const rangeX = keyRight - keyLeft;
      const percX = x / rangeX;
      const playVal = (percX - 0.14) * 23;
      this.playNoteByValKey(1, playVal);
    }
  };

  /* Test sea ice model key */
  testIceMusic = (e: React.PointerEvent | React.MouseEvent):void => {
    if (
      this.state.notePlaying === 0 &&
      e.buttons === 1 &&
      this.state.play === 0
    ) {
      let keyLeft = Math.floor((this.state.pageRight * 3) / 4);
      let keyRight = Math.floor(this.state.pageRight);
      if (this.state.CONTROLVERTDIV !== 1) {
        keyLeft = Math.floor(
          this.state.pageRight / 20 + (2 * this.state.pageRight * 19) / 20 / 3,
        );
        keyRight = Math.floor(this.state.pageRight);
      }
      const x = e.pageX - keyLeft;
      const rangeX = keyRight - keyLeft;
      const percX = x / rangeX;
      const playVal = percX;
      this.playNoteByValKey(2, playVal);
    }
  };

  /*** When map coord is selected, do db query ***/
  onPointerUp = ():void => {
    this.killTransport();
    if (this.state.play === 0) {
      //console.log('state ply is 0 on pointerup');
      this.doCoordHits(this.state.latitude, this.state.longitude);
    }
  };

  /*** Used to calculate coords on model for onMouseDown and onMouseMove ***/
  onMouseDown = (e: React.MouseEvent | React.PointerEvent): void => {
    if (e.buttons !== 1) {
      return;
    }
    if (this.state.play === 1) {
      this.stopMusic(false);
    }
    if (this.state.notePlaying !== 0) {
      return;
    }
    const modelSplit = Math.floor(
      (this.state.pageBottom * this.state.MAPVERTDIV) / 2,
    );
    const modelLeft =
      Math.floor(this.state.pageRight * (1 - this.state.MAPDIV)) +
      this.state.PADDING / 2;
    const modelDiv = Math.floor((this.state.pageRight * this.state.MAPDIV) / 3);
    let modelTop = this.state.PADDING / 2;
    if (this.state.pageBottom > this.state.pageRight) {
      modelTop =
        this.state.pageBottom * this.state.CONTROLVERTDIV +
        this.state.PADDING / 2;
    }
    const x = Math.floor(e.pageX - modelLeft);
    const y = Math.floor(e.pageY - modelTop);
    let latSave = 0;
    let lonSave = 0;
    let centerX = 0;
    let centerY = 0;
    let boxType = 0;

    if (x <= modelDiv && y <= modelSplit) {
      centerX = modelDiv / 2;
      centerY = modelSplit / 2;
      boxType = 1;
    } else if (x <= modelDiv * 2 && y <= modelSplit) {
      centerX = modelDiv + modelDiv / 2;
      centerY = modelSplit / 2;
      boxType = 1;
    } else if (x <= modelDiv * 3 && y <= modelSplit) {
      centerX = 2 * modelDiv + modelDiv / 2;
      centerY = modelSplit / 2;
      boxType = 2;
    } else if (x <= modelDiv && y <= modelSplit * 2) {
      centerX = modelDiv / 2;
      centerY = modelSplit + modelSplit / 2;
      boxType = 1;
    } else if (x <= modelDiv * 2 && y <= modelSplit * 2) {
      centerX = modelDiv + modelDiv / 2;
      centerY = modelSplit + modelSplit / 2;
      boxType = 1;
    } else if (x <= modelDiv * 3 && y <= modelSplit * 2) {
      centerX = 2 * modelDiv + modelDiv / 2;
      centerY = modelSplit + modelSplit / 2;
      boxType = 2;
    }

    //rectangular coords
    if (boxType === 1) {
      lonSave = ((x - centerX) * 360) / modelDiv;
      latSave = ((centerY - y) * 180) / modelSplit;
    }
    //polar coords
    else if (boxType === 2) {
      let dx = x - centerX;
      dx *= modelSplit / ((modelDiv * 3) / 4);
      const dy = centerY - y;
      const r = Math.sqrt(dx ** 2 + dy ** 2);
      let theta = Math.atan(dy / dx);
      theta += Math.PI / 2;
      if (dx > 0) {
        theta += Math.PI;
      }
      theta /= Math.PI;
      theta /= 2;
      const newlon = Math.floor(theta * 360 - 180);
      let newlat = r / modelSplit;
      newlat *= 56;
      lonSave = newlon;
      latSave = 90 - newlat;
    }
    latSave = Math.max(latSave, -89);
    latSave = Math.min(latSave, 90);
    lonSave = Math.max(lonSave, -180);
    lonSave = Math.min(lonSave, 180);
    this.setState({
      latitude: Math.floor(latSave),
      longitude: Math.floor(lonSave),
      useArray: 0,
    });

    //diplay data and play notes
    const { dbX, dbY } = this.getDBCoords();
    const coord_index = this.getDBIndex(dbX, dbY);
    if (
      this.state.precipAvgAllCoords.length >= coord_index &&
      this.state.tempAvgAllCoords.length >= coord_index &&
      this.state.iceAvgAllCoords.length >= coord_index
    ) {
      const val1 = this.getValByCoord(this.state.precipAvgAllCoords, coord_index);
      const val2 = this.getValByCoord(this.state.tempAvgAllCoords, coord_index);
      const val3 = this.getValByCoord(this.state.iceAvgAllCoords, coord_index);
      const item = this.state.co2data[this.state.index];
      if (item)
      {
        const val4 = item.co2_val;
        this.playTogetherMapNotes(
          val1,
          val2,
          val3,
          val4
        );
      }
      
    }
  };

  /*** stops music ***/
  stopMusic = (terminate?: boolean):void => {
    this.setState({ play: 0, playButton: playUrl });
    transport().stop();
    transport().cancel(0);
    if (terminate === false) {
      this.doYearHits(this.state.index + 1920);
    }
  };

  /*** runs on initial render ***/
  componentDidMount = ():void => {
    this.co2Api();

    this.updateDimensions();

    togetherArtifactImgs.forEach((picture) => {
      prefetchImage(picture).catch((error:unknown) => {
        console.error("Image prefetch failed for", picture, error);
      });
    });

    combinedImgs.forEach((picture) => {
      prefetchImage(picture).catch((error: unknown) => {
        console.error("Image prefetch failed for", picture, error);
      });
    });

    if (isBrowser) {
      window.addEventListener("resize", this.updateDimensions);
    }
    window.addEventListener("orientationchange", this.rotateDimensions);
    this.doCoordHits(0, 0);
    this.doYearHits(this.state.index + 1920);
    this.setAllegro();
  };
  componentDidUpdate(
    prevProps: Readonly<this["props"]>,
    prevState: Readonly<typeof this.state>,
  ): void
  {
    // Only redraw when inputs to the graph change
    const graphInputsChanged =
      prevState.index !== this.state.index ||
      prevState.precipAvg !== this.state.precipAvg ||
      prevState.precip1 !== this.state.precip1 ||
      prevState.tempAvg !== this.state.tempAvg ||
      prevState.temp1 !== this.state.temp1 ||
      prevState.iceAvg !== this.state.iceAvg ||
      prevState.ice1 !== this.state.ice1 ||
      prevState.co2data !== this.state.co2data ||
      prevState.pageBottom !== this.state.pageBottom ||
      prevState.pageRight !== this.state.pageRight ||
      prevState.GRAPHVERTDIV !== this.state.GRAPHVERTDIV ||
      prevState.MAPDIV !== this.state.MAPDIV;

    if (graphInputsChanged) {
      this.setupGraph();
      this.updateGraph();
    }
  }

  /*** Write to graph ***/
  updateGraph():void {

    // must have a valid index range
    if (!(this.state.index >= 0 && this.state.index <= 180)) return;

    // data guards: CO2 and main year-series must be ready
    if (!this._isCo2Ready()) return;

    // For AllTogether, you draw 6 series across years
    if (
      !this._isYearSeriesReady(this.state.precipAvg) ||
      !this._isYearSeriesReady(this.state.precip1) ||
      !this._isYearSeriesReady(this.state.tempAvg) ||
      !this._isYearSeriesReady(this.state.temp1) ||
      !this._isYearSeriesReady(this.state.iceAvg) ||
      !this._isYearSeriesReady(this.state.ice1)
    ) {
      return;
    }

    // canvas must exist
    const canvas = this.graphRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { step, avg, co2_median, co2_range, co2_avg } = this.getGraphDims();

    const { precip_median, precip_range } = this.getPrecipGraphVars(
      this.state.precipAvg,
    );
    const { temp_median, temp_range, temp_avg } = this.getTempGraphVars(
      this.state.tempAvg,
      avg,
    );

    let prev_val = 0;
    let coord_val = 0;

    // ===== precip avg (thick) =====
    ctx.beginPath();
    for (let precipInd = 0; precipInd <= this.state.index; precipInd++) {
      prev_val =
        precipInd === 0
          ? this.getValByIndex(this.state.precipAvg, 0)
          : this.getValByIndex(this.state.precipAvg, precipInd - 1);
      coord_val = this.getValByIndex(this.state.precipAvg, precipInd);

      ctx.moveTo(
        1 + step * (precipInd - 1),
        avg + avg * ((precip_median - prev_val) / precip_range),
      );
      ctx.lineTo(
        1 + step * precipInd,
        avg + avg * ((precip_median - coord_val) / precip_range),
      );
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 2;
    }
    ctx.stroke();

    // ===== precip 001 (thin) =====
    ctx.beginPath();
    for (let precipInd = 0; precipInd <= this.state.index; precipInd++) {
      prev_val =
        precipInd === 0
          ? this.getValByIndex(this.state.precip1, 0)
          : this.getValByIndex(this.state.precip1, precipInd - 1);
      coord_val = this.getValByIndex(this.state.precip1, precipInd);

      ctx.moveTo(
        1 + step * (precipInd - 1),
        avg + avg * ((precip_median - prev_val) / precip_range),
      );
      ctx.lineTo(
        1 + step * precipInd,
        avg + avg * ((precip_median - coord_val) / precip_range),
      );
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 1;
    }
    ctx.stroke();

    // ===== temp avg (thick) =====
    ctx.beginPath();
    for (let tempInd = 0; tempInd <= this.state.index; tempInd++) {
      prev_val =
        tempInd === 0
          ? this.getValByIndex(this.state.tempAvg, 0)
          : this.getValByIndex(this.state.tempAvg, tempInd - 1);
      coord_val = this.getValByIndex(this.state.tempAvg, tempInd);

      ctx.moveTo(
        1 + step * (tempInd - 1),
        temp_avg + temp_avg * ((temp_median - prev_val) / temp_range),
      );
      ctx.lineTo(
        1 + step * tempInd,
        temp_avg + temp_avg * ((temp_median - coord_val) / temp_range),
      );
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2;
    }
    ctx.stroke();

    // ===== temp 001 (thin) =====
    ctx.beginPath();
    for (let tempInd = 0; tempInd <= this.state.index; tempInd++) {
      prev_val =
        tempInd === 0
          ? this.getValByIndex(this.state.temp1, 0)
          : this.getValByIndex(this.state.temp1, tempInd - 1);
      coord_val = this.getValByIndex(this.state.temp1, tempInd);

      ctx.moveTo(
        1 + step * (tempInd - 1),
        temp_avg + temp_avg * ((temp_median - prev_val) / temp_range),
      );
      ctx.lineTo(
        1 + step * tempInd,
        temp_avg + temp_avg * ((temp_median - coord_val) / temp_range),
      );
      ctx.strokeStyle = RED;
      ctx.lineWidth = 1;
    }
    ctx.stroke();

    // ===== sea ice =====
    const ice_max = 1;
    const ice_avg = Math.floor(avg * 0.5);

    ctx.beginPath();
    for (let iceInd = 0; iceInd <= this.state.index; iceInd++) {
      prev_val =
        iceInd === 0
          ? this.getValByIndex(this.state.iceAvg, 0)
          : this.getValByIndex(this.state.iceAvg, iceInd - 1);
      coord_val = this.getValByIndex(this.state.iceAvg, iceInd);

      ctx.moveTo(
        1 + step * (iceInd - 1),
        ice_avg + 3 * ice_avg * (ice_max - prev_val),
      );
      ctx.lineTo(
        1 + step * iceInd,
        ice_avg + 3 * ice_avg * (ice_max - coord_val),
      );
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 2;
    }
    ctx.stroke();

    ctx.beginPath();
    for (let iceInd = 0; iceInd <= this.state.index; iceInd++) {
      prev_val =
        iceInd === 0
          ? this.getValByIndex(this.state.ice1, 0)
          : this.getValByIndex(this.state.ice1, iceInd - 1);
      coord_val = this.getValByIndex(this.state.ice1, iceInd);

      ctx.moveTo(
        1 + step * (iceInd - 1),
        ice_avg + 3 * ice_avg * (ice_max - prev_val),
      );
      ctx.lineTo(
        1 + step * iceInd,
        ice_avg + 3 * ice_avg * (ice_max - coord_val),
      );
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 1;
    }
    ctx.stroke();

    // ===== CO2 =====
    ctx.beginPath();
    for (let co2Ind = 1; co2Ind <= this.state.index; co2Ind++)
    {
      const prevItem = this.state.co2data[co2Ind - 1];
      const currItem = this.state.co2data[co2Ind];
      if (prevItem && currItem)
      {
        const prev = prevItem.co2_val;
        const curr = currItem.co2_val;

        if (!Number.isFinite(prev) || !Number.isFinite(curr)) continue;

        ctx.moveTo(
          1 + step * (co2Ind - 1),
          co2_avg - (co2_avg * (prev - co2_median)) / co2_range,
        );
        ctx.lineTo(
          1 + step * co2Ind,
          co2_avg - (co2_avg * (curr - co2_median)) / co2_range,
        );
        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 3;
      }      
    }
    ctx.stroke();
  }

  /*** called when the window is resized
   *** see EachAlone for let descriptions***/
  updateDimensions = ():void => {
    const newheight = window.innerHeight;
    const newwidth = window.innerWidth;

    //landscape
    if (window.innerHeight < window.innerWidth) {
      this.setState({
        pageBottom: newheight - this.state.PADDING - 1,
        pageRight: newwidth - this.state.PADDING - 1,
        CONTROLDIV: 2 / 10,
        SKINNYDIV: 1 / 20,
        MAPDIV: 3 / 4,
        MAPVERTDIV: 6 / 10,
        DATAVERTDIV: 1 / 20,
        GRAPHVERTDIV: 3 / 20,
        SLIDERVERTDIV: 1 / 10,
        CONTROLVERTDIV: 1,
        CONTROLSPLIT: 1,
        PADDING: 40,
      });
    }
    //portrait
    else {
      this.setState({
        pageBottom: newheight - this.state.PADDING - 1,
        pageRight: newwidth - this.state.PADDING - 1,
        CONTROLDIV: 1,
        SKINNYDIV: 1 / 20,
        MAPDIV: 19 / 20,
        MAPVERTDIV: 6 / 20,
        DATAVERTDIV: 1 / 20,
        GRAPHVERTDIV: 3 / 20,
        SLIDERVERTDIV: 1 / 10,
        CONTROLVERTDIV: 7 / 20,
        CONTROLSPLIT: 1 / 2,
        PADDING: 20,
      });
    }
    this.setupGraph();
  };

  /*** get all avg precip values for a specific year ***/
  precipYearApi = (request:string):void => {
    const controller = (this.yearPrecipController = abortAndRenew(this.yearPrecipController));
    Axios.get<ApiResponse<AvgArr>>(request, { signal: controller.signal })
      .then((res) => { this.setAvgAllCoords(res, 0) })
      .catch((error:unknown) => {
        if (isCanceledAxiosError(error)) return;
        console.error("year precip failed", error);
      });
  };

  /*** get all avg temp values for a specific year ***/
  tempYearApi = (request:string):void =>
  {
    const controller = (this.yearTempController = abortAndRenew(this.yearTempController));
    Axios.get<ApiResponse<AvgArr>>(request, { signal: controller.signal })
      .then((res) => { this.setAvgAllCoords(res, 1) })
      .catch((error: unknown) =>
      {
        if (isCanceledAxiosError(error)) return;
        console.error("year temp failed", error);
      });
  };

  /*** get all avg sea ice values for a specific year ***/
  iceYearApi = (request: string): void =>
  {
    const controller = (this.yearIceController = abortAndRenew(this.yearIceController));
    Axios.get<ApiResponse<AvgArr>>(request, { signal: controller.signal })
      .then((res) => { this.setAvgAllCoords(res, 2) })
      .catch((error: unknown) =>
      {
        if (isCanceledAxiosError(error)) return;
        console.error("year ice failed", error);
      });
  };

  /*** save response for specific year ***/
  setAvgAllCoords = (res: AxiosResponse<ApiResponse<AvgArr>>,
    arrayNum: CoordArrayNum,):void => {
    const data: AvgArr = res.data.data;
    if (arrayNum === 0) {
      this.setState({ precipAvgAllCoords: [...data] });
    } else if (arrayNum === 1) {
      this.setState({ tempAvgAllCoords: [...data] });
    } else
    {
      //if (arrayNum === 2){
      this.setState({ iceAvgAllCoords: [...data] });
    }
    if (this.state.play === 0) {
      this.setState({ useArray: this.state.useArray + 1 });
    }
    ////console.log(arrayNum, data);
  };

  /*** query db for all coords at a specific year ***/
  doYearHits(year: number): void
  {
    if (year >= 1920 && year <= 2100) {
      const intermediate0 = dbUrl.concat("precipavg/year/");
      const request0 = intermediate0.concat(year.toString(10));
      this.precipYearApi(request0.concat(".txt"));

      const intermediate1 = dbUrl.concat("tempavg/year/");
      const request1 = intermediate1.concat(year.toString(10));
      this.tempYearApi(request1.concat(".txt"));

      const intermediate2 = dbUrl.concat("seaiceavg/year/");
      const request2 = intermediate2.concat(year.toString(10));
      this.iceYearApi(request2.concat(".txt"));
    }
  }

  /*** change lat text from input ***/
  onChangeLat = (event: React.ChangeEvent<HTMLInputElement>): void =>
  {
    const newval = event.target.value;
    if (isNumeric(newval)) {
      const parsedval = parseInt(newval);
      if (parsedval >= -90 && parsedval <= 90) {
        this.doCoordHits(parsedval, this.state.longitude);
        this.setState({
          latitude: parsedval,
          useArray: 0,
        });
        this.setupGraph();
        this.triggerNotes();
        if (this.state.play === 1) {
          this.stopMusic(false);
        }
      }
    }
  };

  /*** change lon text from input ***/
  onChangeLon = (event: React.ChangeEvent<HTMLInputElement>): void =>
  {
    const newval = event.target.value;
    if (isNumeric(newval)) {
      const parsedval = parseInt(newval);
      if (parsedval >= -180 && parsedval <= 180) {
        this.doCoordHits(this.state.latitude, parsedval);
        this.setState({
          longitude: parsedval,
          useArray: 0,
        });
        this.setupGraph();
        this.triggerNotes();
        if (this.state.play === 1) {
          this.stopMusic(false);
        }
      }
    }
  };

  /*** runs when new lat / lon typed or city selected ***/
  triggerNotes = ():void => {
    let precip_val, temp_val, ice_val;
    const { dbX, dbY } = this.getDBCoords();
    const coord_index = this.getDBIndex(dbX, dbY);
    if (this.state.precipAvgAllCoords.length > coord_index) {
      precip_val = this.getValByCoord(
        this.state.precipAvgAllCoords,
        coord_index,
      );

      this.triggerNoteByVal(0, precip_val);
    }
    if (this.state.tempAvgAllCoords.length > coord_index) {
      temp_val = this.getValByCoord(this.state.tempAvgAllCoords, coord_index);
      this.triggerNoteByVal(1, temp_val);
    }
    if (this.state.iceAvgAllCoords.length > coord_index) {
      ice_val = this.getValByCoord(this.state.iceAvgAllCoords, coord_index);
      this.triggerNoteByVal(2, ice_val);
    }

    const item = this.state.co2data[this.state.index];
    if (item)
    {
      const co2_val = item.co2_val;
      this.triggerNoteByVal(3, co2_val);
    }

  };

  /*** request avg precip data ***/
  precipCoordApi = (request:string):void =>
  {
    const controller = (this.coordPrecipAvgController = abortAndRenew(this.coordPrecipAvgController));
    Axios.get<ApiResponse<AvgArr>>(request, { signal: controller.signal })
      .then((res) => { this.setAvgAllYears(res, 0) })
      .catch((error: unknown) =>
      {
        if (isCanceledAxiosError(error)) return;
        console.error("coord precip failed", error);
      });
  };

  /*** request 001 precip data ***/
  precipCoordApi1 = (request: string): void =>
  {
    const controller = (this.coordPrecip1Controller = abortAndRenew(this.coordPrecip1Controller));
    Axios.get<ApiResponse<AvgArr>>(request, { signal: controller.signal })
      .then((res) => { this.setAvgAllYears(res, 3) })
      .catch((error: unknown) =>
      {
        if (isCanceledAxiosError(error)) return;
        console.error("coord precip1 failed", error);
      });
  };

  /*** request avg temp data ***/
  tempCoordApi = (request: string): void =>
  {
    const controller = (this.coordTempAvgController = abortAndRenew(this.coordTempAvgController));
    Axios.get<ApiResponse<AvgArr>>(request, { signal: controller.signal })
      .then((res) => { this.setAvgAllYears(res, 1) })
      .catch((error: unknown) =>
      {
        if (isCanceledAxiosError(error)) return;
        console.error("coord temp failed", error);
      });
  };

  /*** request 001 temp data ***/
  tempCoordApi1 = (request: string): void =>
  {
    const controller = (this.coordTemp1Controller = abortAndRenew(this.coordTemp1Controller));
    Axios.get<ApiResponse<AvgArr>>(request, { signal: controller.signal })
      .then((res) => { this.setAvgAllYears(res, 4) })
      .catch((error: unknown) =>
      {
        if (isCanceledAxiosError(error)) return;
        console.error("coord temp 1 failed", error);
      });
  };

  /*** request avg sea ice data ***/
  iceCoordApi = (request: string): void =>
  {
    const controller = (this.coordIceAvgController = abortAndRenew(this.coordIceAvgController));
    Axios.get<ApiResponse<AvgArr>>(request, { signal: controller.signal })
      .then((res) => { this.setAvgAllYears(res, 2) })
      .catch((error: unknown) =>
      {
        if (isCanceledAxiosError(error)) return;
        console.error("coord ice failed", error);
      });
  };

  /*** request 001 sea ice data ***/
  iceCoordApi1 = (request: string): void =>
  {
    const controller = (this.coordIce1Controller = abortAndRenew(this.coordIce1Controller));
    Axios.get<ApiResponse<AvgArr>>(request, { signal: controller.signal })
      .then((res) => { this.setAvgAllYears(res, 5) })
      .catch((error: unknown) =>
      {
        if (isCanceledAxiosError(error)) return;
        console.error("coord ice1 failed", error);
      });
  };

  /*** save data used for music ***/
  setAvgAllYears = (
    res: AxiosResponse<ApiResponse<AvgArr>>,
    arrayNum: YearArrayNum,
  ): void => {
    const data: AvgArr = res.data.data;

    // Choose which state key to update and which notes setter to call
    let stateKey: YearStateKey;
    let notesSetter: NotesSetter;

    if (arrayNum === 0) {
      stateKey = "precipAvg";
      notesSetter = this.setPrecipNotes;
    } else if (arrayNum === 1) {
      stateKey = "tempAvg";
      notesSetter = this.setTempNotes;
    } else if (arrayNum === 2) {
      stateKey = "iceAvg";
      notesSetter = this.setIceNotes;
    } else if (arrayNum === 3) {
      stateKey = "precip1";
      notesSetter = this.setPrecipNotes1;
    } else if (arrayNum === 4) {
      stateKey = "temp1";
      notesSetter = this.setTempNotes1;
    } else
    {
      //if (arrayNum === 5){
      stateKey = "ice1";
      notesSetter = this.setIceNotes1;
    }/* else {
      console.warn("setAvgAllYears called with unexpected arrayNum:", arrayNum);
      return;
    }*/

    // 1) Update the dataset + decrement waiting safely
    this.setState(
      (prev) =>
        ({
          [stateKey]: data, // data is AvgArr, no Array.isArray, no [0], no spread needed
          waiting: Math.max(0, prev.waiting - 1), // remove ?? 0
        }) as Pick<typeof this.state, typeof stateKey | "waiting">,
      () =>
      {
        notesSetter(data);
      },
    );
  };

  /*** query db for all years of a specific coord ***/
  doCoordHits(lat: number, lon: number): void
  {
    const closestcity = getClosestCity(lat, lon);
    const { dbX, dbY } = this.getDBCoords();
    this.setState({
      latitude: Math.floor(lat),
      longitude: Math.floor(lon),
      closestCity: closestcity,
      waiting: 6,
    });
    let request;

    /* Filter and do db hit here */
    if (dbX <= 360 && dbX >= 1 && dbY <= 180 && dbY >= 1) {
      request = dbUrl
        .concat("precipavg/coord/")
        .concat(dbX.toString(10))
        .concat(",")
        .concat(dbY.toString(10))
        .concat(".txt");
      this.precipCoordApi(request);
      request = dbUrl
        .concat("tempavg/coord/")
        .concat(dbX.toString(10))
        .concat(",")
        .concat(dbY.toString(10))
        .concat(".txt");
      this.tempCoordApi(request);
      request = dbUrl
        .concat("seaiceavg/coord/")
        .concat(dbX.toString(10))
        .concat(",")
        .concat(dbY.toString(10))
        .concat(".txt");
      this.iceCoordApi(request);
      request = dbUrl
        .concat("precip001/coord/")
        .concat(dbX.toString(10))
        .concat(",")
        .concat(dbY.toString(10))
        .concat(".txt");
      this.precipCoordApi1(request);
      request = dbUrl
        .concat("temp001/coord/")
        .concat(dbX.toString(10))
        .concat(",")
        .concat(dbY.toString(10))
        .concat(".txt");
      this.tempCoordApi1(request);
      request = dbUrl
        .concat("seaice001/coord/")
        .concat(dbX.toString(10))
        .concat(",")
        .concat(dbY.toString(10))
        .concat(".txt");
      this.iceCoordApi1(request);
    }
  }

  /*** Run this when play button is pressed ***/
  playMusic = ():void => {
    if (this.state.waiting > 0) {
      //console.log('waiting');
      return;
    }
    let newind = this.state.index;
    if (newind === 180) {
      newind = 0;
    }
    const precipsynth = this.getSynth(0);
    const tempsynth = this.getSynth(1);
    const icesynth = this.getSynth(2);
    const precipsynth1 = this.getSynth(0);
    precipsynth1.volume.value = -12;
    const tempsynth1 = this.getSynth(1);
    tempsynth1.volume.value = -12;
    const icesynth1 = this.getSynth(2);
    icesynth1.volume.value = -12;
    const piano = this.getSynth(3);

    const precipNotes = this.getPrecipNotes(newind);
    const precipNotes1 = this.getPrecipNotes1(newind);
    const tempNotes = this.getTempNotes(newind);
    const tempNotes1 = this.getTempNotes1(newind);
    const iceNotes = this.getIceNotes(newind);
    const iceNotes1 = this.getIceNotes1(newind);
    const pianoNotes = this.getPianoNotes(newind);

    this.setState({
      play: 1,
      playButton: pauseUrl,
      useArray: 3,
      index: newind,
    });
    const precipPattern = new Tone.Pattern((time, note) => {
      precipsynth.triggerAttackRelease(note, "16n", time);
      // bind incrementing
      Tone.getDraw().schedule(() => {
        this.incrementIndex();
      }, time);
    }, precipNotes);
    precipPattern.humanize = true;

    const precipPattern1 = new Tone.Pattern((time, note) => {
      precipsynth1.triggerAttackRelease(note, "16n", time);
    }, precipNotes1);
    precipPattern1.humanize = true;

    const tempPattern = new Tone.Pattern((time, note) => {
      tempsynth.triggerAttackRelease(note, "16n", time);
    }, tempNotes);
    tempPattern.humanize = true;

    const tempPattern1 = new Tone.Pattern((time, note) => {
      tempsynth1.triggerAttackRelease(note, "16n", time);
    }, tempNotes1);
    tempPattern1.humanize = true;

    const icePattern = new Tone.Pattern((time, note) => {
      icesynth.triggerAttackRelease(note, "16n", time);
    }, iceNotes);
    icePattern.humanize = true;

    const icePattern1 = new Tone.Pattern((time, note) => {
      icesynth1.triggerAttackRelease(note, "16n", time);
    }, iceNotes1);
    icePattern1.humanize = true;

    const pianoPattern = new Tone.Pattern((time, note) => {
      piano.triggerAttackRelease(note, "16n", time);
    }, pianoNotes);
    pianoPattern.humanize = true;

    // catches most errors
    if (this.state.audioAvailable) {
      precipPattern.start(0);
      precipPattern1.start(0);
      tempPattern.start(0);
      tempPattern1.start(0);
      pianoPattern.start(0);
      if (this.getValByIndex(this.state.iceAvg, 0) !== 0) {
        icePattern.start(0);
        icePattern1.start(0);
      }
      transport().start("+0");
    } else {
      Tone.start()
        .then(() => {
          this.setState({ audioAvailable: true });
          precipPattern.start(0.001);
          precipPattern1.start(0.001);
          tempPattern.start(0.001);
          tempPattern1.start(0.001);
          pianoPattern.start(0.001);
          if (this.getValByIndex(this.state.iceAvg, 0) !== 0) {
            icePattern.start(0.001);
            icePattern1.start(0.001);
          }
          transport().start("+0");
        })
        .catch((error: unknown) =>
        { console.error(error) });
    }
  };

  /*** play notes ***/
  playTogetherMapNotes = (
    val1:number,
    val2: number,
    val3: number,
    val4: number
  ):void => {
    const synth0 = this.getSynth(0);
    const synth1 = this.getSynth(1);
    const synth2 = this.getSynth(2);
    const piano = this.getSynth(3);
    const note0 = this.getNote(0, val1);
    const note1 = this.getNote(1, val2);
    const note2 = this.getNote(2, val3);
    const pianoNote = this.getNote(3, val4);
    this.setState({ notePlaying: 1 });
    transport().scheduleOnce(() => {
      synth0.triggerAttackRelease(note0, "16n");
      synth1.triggerAttackRelease(note1, "16n");
      synth2.triggerAttackRelease(note2, "16n");
      piano.triggerAttackRelease(pianoNote, "16n");
    }, "+0");
    transport().scheduleOnce(() => {
      this.setState({ notePlaying: 0 });
      synth0.dispose();
      synth1.dispose();
      synth2.dispose();
      piano.dispose();
    }, "+4n");
  };

  /*** get styles only for this page ***/
  getTogetherStyles = (mw: number, ch: number, cw: number):
    {
      largeControlBlockStyle: React.CSSProperties;
      graphHeight: number;
      graphWidth: number;
    } => {
    const modelWidth = mw;
    const controlHeight = ch;
    const controlWidth = cw;
    let newh = (controlHeight * 4) / 20;
    if (this.state.CONTROLVERTDIV !== 1) {
      newh /= 1 - this.state.CONTROLVERTDIV;
    }

    const largeControlBlockStyle: React.CSSProperties = {
      height: Math.floor(newh),
      width: Math.floor(controlWidth * this.state.CONTROLSPLIT),
      overflow: "hidden",
      float: "left",
    };

    let graphHeight = this.state.pageBottom * this.state.GRAPHVERTDIV;
    if (isNaN(graphHeight)) {
      graphHeight = 0;
    }

    let graphWidth = modelWidth;
    if (isNaN(graphWidth)) {
      graphWidth = 0;
    }
    return { largeControlBlockStyle, graphHeight, graphWidth };
  }

  /*** for year slider ***/
  updateYearVals = ():void => {
    if (this.state.play === 0) {
      this.doYearHits(this.state.index + 1920);
    }
  };

  /*** for chaning city ***/
  changeToCity = (event: React.ChangeEvent<HTMLSelectElement>): void =>
  {
    if (this.state.play === 1)
    {
      this.stopMusic(false);
    }
    transport().start("+0");
    
    const city = event.target.value;
    const cityinfo = getInfo(city);
    const lat = cityinfo.latitude;
    const lon = cityinfo.longitude;


    this.doCoordHits(lat, lon);
    this.setState({
      latitude: lat,
      longitude: lon,
      useArray: 0,
    });
    this.setupGraph();
    this.triggerNotes();
    
  };

  /*** runs on page close ***/
  componentWillUnmount = ():void => {
    try {
      // stop scheduled events + reset timeline
      transport().stop();
      transport().cancel(0);

      // stop any playing sources you created, if you have references
      // (see Fix 2 below)
    } catch (e) {
      // don't crash unmount
      console.warn("Tone cleanup failed", e);
    }

    this.yearPrecipController?.abort();
    this.yearTempController?.abort();
    this.yearIceController?.abort();

    this.coordPrecipAvgController?.abort();
    this.coordTempAvgController?.abort();
    this.coordIceAvgController?.abort();

    this.coordPrecip1Controller?.abort();
    this.coordTemp1Controller?.abort();
    this.coordIce1Controller?.abort();

    PubSub.unsubscribe(this.state.token);
    if (isBrowser) {
      window.removeEventListener("resize", this.updateDimensions);
    }
    window.removeEventListener("orientationchange", this.rotateDimensions);
  };

  /*** for playing model keys ***/
  setupPrecipTransport = (e: React.PointerEvent<HTMLDivElement>):void => {
    transport().start("+0");
    this.testPrecipMusic(e);
  };

  setupTempTransport = (e: React.PointerEvent<HTMLDivElement>):void => {
    transport().start("+0");
    this.testTempMusic(e);
  };

  setupIceTransport = (e: React.PointerEvent<HTMLDivElement>):void => {
    transport().start("+0");
    this.testIceMusic(e);
  };

  /*** get locations for crosshair ***/
  getLocations = ():
    {
      location1: React.CSSProperties;
      location2: React.CSSProperties;
      location3: React.CSSProperties;
      location4: React.CSSProperties;
      location5: React.CSSProperties;
      location6: React.CSSProperties;
    } => {
    /* A bunch of variables used to calculate crosshair position */
    const fsize = 12;
    const modelSplit = Math.floor(
      (this.state.pageBottom * this.state.MAPVERTDIV) / 2,
    );
    const modelLeft =
      Math.floor(this.state.pageRight * (1 - this.state.MAPDIV)) +
      this.state.PADDING / 2;
    const modelDiv = Math.floor((this.state.pageRight * this.state.MAPDIV) / 3);
    let modelTop = this.state.PADDING / 2;
    if (this.state.pageBottom > this.state.pageRight) {
      modelTop =
        this.state.pageBottom * this.state.CONTROLVERTDIV +
        this.state.PADDING / 2;
    }

    let centerX = 0;
    let centerY = 0;

    let xAdj = (this.state.longitude * modelDiv) / 360 - fsize / 4;
    let yAdj = 0 - (this.state.latitude * modelSplit) / 180 - fsize / 2;

    centerX = modelLeft + modelDiv / 2;
    centerY = modelTop + modelSplit / 2;
    const location1:React.CSSProperties = {
      position: "absolute",
      left: centerX + xAdj,
      top: centerY + yAdj,
      color: "red",
      fontSize: fsize,
      border: "1px solid red",
      backgroundColor: "white",
      lineHeight: 1,
      WebkitTouchCallout: "none",
      WebkitUserSelect: "none",
      KhtmlUserSelect: "none",
      MozUserSelect: "none",
      msUserSelect: "none",
      userSelect: "none",
    };

    centerX = modelLeft + modelDiv + modelDiv / 2;
    centerY = modelTop + modelSplit / 2;
    const location2:React.CSSProperties = {
      position: "absolute",
      left: centerX + xAdj,
      top: centerY + yAdj,
      color: "red",
      fontSize: fsize,
      border: "1px solid red",
      backgroundColor: "white",
      lineHeight: 1,
      WebkitTouchCallout: "none",
      WebkitUserSelect: "none",
      KhtmlUserSelect: "none",
      MozUserSelect: "none",
      msUserSelect: "none",
      userSelect: "none",
    };

    centerX = modelLeft + modelDiv / 2;
    centerY = modelTop + modelSplit + modelSplit / 2;
    const location4:React.CSSProperties = {
      position: "absolute",
      left: centerX + xAdj,
      top: centerY + yAdj,
      color: "red",
      fontSize: fsize,
      border: "1px solid red",
      backgroundColor: "white",
      lineHeight: 1,
      WebkitTouchCallout: "none",
      WebkitUserSelect: "none",
      KhtmlUserSelect: "none",
      MozUserSelect: "none",
      msUserSelect: "none",
      userSelect: "none",
    };

    centerX = modelLeft + modelDiv + modelDiv / 2;
    centerY = modelTop + modelSplit + modelSplit / 2;
    const location5:React.CSSProperties = {
      position: "absolute",
      left: centerX + xAdj,
      top: centerY + yAdj,
      color: "red",
      fontSize: fsize,
      border: "1px solid red",
      backgroundColor: "white",
      lineHeight: 1,
      WebkitTouchCallout: "none",
      WebkitUserSelect: "none",
      KhtmlUserSelect: "none",
      MozUserSelect: "none",
      msUserSelect: "none",
      userSelect: "none",
    };

    /* adjusdments for polar coords, not very accurate */
    const rX = (90 - this.state.latitude) * (modelDiv / 40);
    const rY = (90 - this.state.latitude) * (modelSplit / 45);

    const theta = ((this.state.longitude / 180) * Math.PI) / 2;

    let multX = Math.sin(theta);
    if (this.state.longitude < -90) {
      multX = (Math.PI * 41) / 128 + multX;
      multX = 0 - multX;
      multX *= 3.5;
    }
    multX /= 1.5;

    if (this.state.longitude > 90) {
      multX -= (Math.PI * 20) / 128;
      multX = 0 - multX;
      multX *= 1;
      multX += Math.PI / 8;
    }

    let multY = 0.5 - Math.cos(theta);
    multY *= 2;

    let ybase = 0;
    if (
      this.state.latitude < 75 &&
      this.state.longitude > -150 &&
      this.state.longitude < 150
    ) {
      ybase = 0 - modelSplit / 5;
    } else if (this.state.longitude < -90) {
      ybase = 0 - modelSplit / 10;
    }

    xAdj = 0 + multX * rX - fsize / 2;
    yAdj = ybase - multY * rY - fsize / 2;

    centerX = modelLeft + 2 * modelDiv + modelDiv / 2;
    centerY = modelTop + modelSplit / 2;
    const location3:React.CSSProperties = {
      position: "absolute",
      left: centerX + xAdj,
      top: centerY + yAdj,
      color: "red",
      fontSize: fsize,
      border: "1px solid red",
      backgroundColor: "white",
      lineHeight: 1,
      WebkitTouchCallout: "none",
      WebkitUserSelect: "none",
      KhtmlUserSelect: "none",
      MozUserSelect: "none",
      msUserSelect: "none",
      userSelect: "none",
    };

    centerX = modelLeft + 2 * modelDiv + modelDiv / 2;
    centerY = modelTop + modelSplit + modelSplit / 2;
    const location6:React.CSSProperties = {
      position: "absolute",
      left: centerX + xAdj,
      top: centerY + yAdj,
      color: "red",
      fontSize: 12,
      border: "1px solid red",
      backgroundColor: "white",
      lineHeight: 1,
      WebkitTouchCallout: "none",
      WebkitUserSelect: "none",
      KhtmlUserSelect: "none",
      MozUserSelect: "none",
      msUserSelect: "none",
      userSelect: "none",
    };

    if (this.state.latitude < 62) {
      location3.display = "none";
      location6.display = "none";
    }

    return { location1, location2, location3, location4, location5, location6 };
  };

  /*** navigate to about page ***/
  openAbout = ():void => {
    const { navigation } = this.props;
    if (this.state.play === 1) {
      this.stopMusic(false);
    }
    navigation.navigate("About");
  };

  /*** runs on state update ***/
  render(): React.JSX.Element {
    const { location1, location2, location3, location4, location5, location6 } =
      this.getLocations();

    const playButton = this.getPlayButton();

    const { dbX, dbY } = this.getDBCoords();

    const co2_obj = this.state.co2data[this.state.index];
    const co2val = co2_obj !== undefined && typeof co2_obj.co2_val === 'number' && Number.isFinite(co2_obj.co2_val)
      ? Math.round(co2_obj.co2_val)
      : "--";

    /*** setup model URL ***/
    const urlAdd = urlPre.concat(this.state.modelStr);
    const ind = this.state.index.toString();
    const suffix = ind.concat(".jpg");
    const fullUrl = urlAdd.concat(suffix);

    let precip_val = 0;
    let temp_val = 0;
    let ice_val = 0;

    /*** Set avg db values ***/
    if (this.state.useArray === 3) {
      precip_val = this.getValByIndex(this.state.precipAvg, this.state.index);
      temp_val = this.getValByIndex(this.state.tempAvg, this.state.index);
      ice_val = this.getValByIndex(this.state.iceAvg, this.state.index);
    } else {
      const coord_index = this.getDBIndex(dbX, dbY);
      if (this.state.precipAvgAllCoords.length > coord_index) {
        precip_val = this.getValByCoord(
          this.state.precipAvgAllCoords,
          coord_index,
        );
      }
      if (this.state.tempAvgAllCoords.length > coord_index) {
        temp_val = this.getValByCoord(this.state.tempAvgAllCoords, coord_index);
      }
      if (this.state.iceAvgAllCoords.length > coord_index) {
        ice_val = this.getValByCoord(this.state.iceAvgAllCoords, coord_index);
      }
    }

    let temp_pre = "Temperature: +";
    if (Number.isFinite(temp_val) && temp_val >= 0) temp_pre = "Temperature: +";

    /*ice_val *= 100;
    ice_val = Math.round(ice_val * 100) / 100;
    temp_val = Math.round(temp_val * 100) / 100;
    precip_val = Math.round(precip_val * 100) / 100;*/
    const precipNum = Number.isFinite(precip_val)
      ? Math.round(precip_val * 100) / 100
      : "--";
    const tempNum = Number.isFinite(temp_val)
      ? Math.round(temp_val * 100) / 100
      : "--";
    const icePct = Number.isFinite(ice_val)
      ? Math.round(ice_val * 100 * 100) / 100
      : "--"; // ice fraction -> %

    const {
      pageDiv,
      modelWidth,
      modelStyle,
      controlHeight,
      controlWidth,
      containerStyle,
      controlContainerStyle,
      graphStyle,
      sliderDivStyle,
      sliderStyle,
      timelineStyle,
      controlDivStyle,
      playSplitDivStyle,
      controlBlockStyle,
      dataBlockStyle,
      graphBufferStyle,
      instructionTextStyle,
      paragraphTextStyle,
      smallLabelTextStyle,
      quarterControlStyle,
      halfControlStyle,
      inputControlStyle,
      bigLabelControlStyle,
      labelControlStyle,
      dropdownControlStyle,
      skinnyDivStyle,
      largeDivStyle,
      skinnyImgStyle,
      moderatoHighlight,
      allegroHighlight,
      prestoHighlight,
      keyContainer,
      dataThirdStyle,
      imageKeyStyle,
      aboutButton,
    } = this.getCommonStyles();

    const { largeControlBlockStyle, graphHeight, graphWidth } =
      this.getTogetherStyles(modelWidth, controlHeight, controlWidth);

    /*** Return the page ***/

    return (
      <div style={pageDiv}>
        <div style={containerStyle}>
          <div style={controlDivStyle}>
            <div style={controlContainerStyle}>
              <div style={largeControlBlockStyle}>
                <p style={instructionTextStyle}>Instructions</p>
                <p style={paragraphTextStyle}>
                  1. Touch the map to select a location
                  <br />
                  2. Touch the timeline to select a starting year
                  <br />
                  3. Select a tempo
                  <br />
                  4. Press the play button.
                </p>
              </div>

              <div style={controlBlockStyle}>
                {/* This originally used this.handleClick().  I may still need to use the game
				handler here.  But I might be able to just use the inhereted play method.  I think
				I will need to use some methods in this file too.  I'm just not sure which ones yet */}
                <button
                  style={playSplitDivStyle}
                  onClick={
                    this.state.play
                      ? (): void => { this.stopMusic(false) }
                      : (): void => { this.playMusic() }
                  }
                >
                  <img
                    style={playSplitDivStyle}
                    alt="play button"
                    src={playButton}
                  />
                </button>

                <div style={quarterControlStyle}>
                  <span style={paragraphTextStyle}>Tempo:</span>
                </div>
                <button style={quarterControlStyle} onClick={this.setModerato}>
                  <span style={moderatoHighlight}>moderato</span>
                </button>
                <button style={quarterControlStyle} onClick={this.setAllegro}>
                  <span style={allegroHighlight}>allegro</span>
                </button>
                <button style={quarterControlStyle} onClick={this.setPresto}>
                  <span style={prestoHighlight}>presto</span>
                </button>
              </div>

              <form>
                <div style={dataBlockStyle}>
                  <label htmlFor="lat" style={labelControlStyle}>
                    {" "}
                    Lat:
                  </label>
                  <input
                    type="text"
                    style={inputControlStyle}
                    id="lat"
                    value={this.state.latitude}
                    onChange={this.onChangeLat}
                  />
                  <label htmlFor="lon" style={labelControlStyle}>
                    {" "}
                    Lon:
                  </label>
                  <input
                    type="text"
                    style={inputControlStyle}
                    id="lon"
                    value={this.state.longitude}
                    onChange={this.onChangeLon}
                  />
                </div>

                <div style={dataBlockStyle}>
                  <label htmlFor="city" style={bigLabelControlStyle}>
                    {" "}
                    Nearest City:
                  </label>
                  <select
                    name="city"
                    id="city"
                    style={dropdownControlStyle}
                    value={this.state.closestCity}
                    onChange={this.changeToCity}
                  >
                    <optgroup label="Africa">
                      <option value="Antananarivo">Antananarivo</option>
                      <option value="Cairo">Cairo</option>
                      <option value="Cape Town">Cape Town</option>
                      <option value="Dakar">Dakar</option>
                      <option value="Kinshasa">Kinshasa</option>
                      <option value="Lagos">Lagos</option>
                      <option value="Marrakesh">Marrakesh</option>
                      <option value="Nairobi">Nairobi</option>
                      <option value="Tunis">Tunis</option>
                    </optgroup>

                    <optgroup label="Asia">
                      <option value="Bangkok">Bangkok</option>
                      <option value="Beijing">Beijing</option>
                      <option value="Bengaluru">Bengaluru</option>
                      <option value="Hanoi">Hanoi</option>
                      <option value="Hong Kong">Hong Kong</option>
                      <option value="New Delhi">New Delhi</option>
                      <option value="Nur-Sultan">Nur-Sultan</option>
                      <option value="Seoul">Seoul</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Tokyo">Tokyo</option>
                    </optgroup>

                    <optgroup label="Europe">
                      <option value="Amsterdam">Amsterdam</option>
                      <option value="Berlin">Berlin</option>
                      <option value="Budapest">Budapest</option>
                      <option value="Istanbul">Istanbul</option>
                      <option value="Kyiv">Kyiv</option>
                      <option value="London">London</option>
                      <option value="Madrid">Madrid</option>
                      <option value="Moscow">Moscow</option>
                      <option value="Paris">Paris</option>
                      <option value="Reykjavik">Reykjavik</option>
                      <option value="Riyadh">Riyadh</option>
                      <option value="Rome">Rome</option>
                      <option value="Stockholm">Stockholm</option>
                      <option value="Tehran">Tehran</option>
                      <option value="Vienna">Vienna</option>
                      <option value="Warsaw">Warsaw</option>
                    </optgroup>

                    <optgroup label="North America">
                      <option value="Anchorage">Anchorage</option>
                      <option value="Austin">Austin</option>
                      <option value="Calgary">Calgary</option>
                      <option value="Denver">Denver</option>
                      <option value="Havana">Havana</option>
                      <option value="Honolulu">Honolulu</option>
                      <option value="Los Angeles">Los Angeles</option>
                      <option value="Mexico City">Mexico City</option>
                      <option value="New York">New York</option>
                      <option value="Orlando">Orlando</option>
                      <option value="Panama City">Panama City</option>
                      <option value="San Francisco">San Francisco</option>
                      <option value="Vancouver">Vancouver</option>
                      <option value="Winnipeg">Winnipeg</option>
                    </optgroup>

                    <optgroup label="Oceanea">
                      <option value="Auckland">Auckland</option>
                      <option value="Jakarta">Jakarta</option>
                      <option value="Perth">Perth</option>
                      <option value="Port Moresby">Port Morseby</option>
                      <option value="Sydney">Syney</option>
                    </optgroup>

                    <optgroup label="South America">
                      <option value="Asuncion">Asuncion</option>
                      <option value="Bogota">Bogota</option>
                      <option value="Buenos Aires">Buenos Aires</option>
                      <option value="Caracas">Caracas</option>
                      <option value="Lima">Lima</option>
                      <option value="La Paz">La Paz</option>
                      <option value="Sao Paulo">Sao Paulo</option>
                      <option value="Santiago">Santiago</option>
                      <option value="Punta Arenas">Punta Arenas</option>
                      <option value="Quito">Quito</option>
                    </optgroup>
                  </select>
                </div>
              </form>

              <div style={dataBlockStyle}>
                <div style={halfControlStyle}>
                  <p style={smallLabelTextStyle}>
                    Year: {this.state.index + 1920}
                  </p>
                </div>
                <div style={halfControlStyle}>
                  <p style={smallLabelTextStyle}>
                    CO<sub>2</sub>: {co2val} ppm
                  </p>
                </div>
              </div>
            </div>

            <div style={controlContainerStyle}>
              <div style={dataBlockStyle} />
              <div style={dataBlockStyle}>
                <div style={quarterControlStyle} />
                <button
                  style={quarterControlStyle}
                  onClick={this.openAbout}
                >
                  <span style={aboutButton}>FAQ</span>
                </button>
                <div style={quarterControlStyle} />
              </div>

              <div style={keyContainer}>
                <img style={keyContainer} alt="graph key" src={graphKey} />
              </div>

              <button style={dataBlockStyle} onClick={this.callHome}>
                <img
                  style={dataBlockStyle}
                  alt="home button"
                  src={homeButton}
                />
              </button>
            </div>
          </div>

          <div style={skinnyDivStyle}>
            <img
              style={skinnyImgStyle}
              alt="human influence on climate"
              src={topSkinnyImg}
              draggable="false"
            />
            <img
              style={skinnyImgStyle}
              alt="human and natural influence on climate"
              src={bottomSkinnyImg}
              draggable="false"
            />
          </div>

          <div style={largeDivStyle}>
            <div
              style={modelStyle}
              onPointerDown={this.setupMapTransport}
              onPointerMove={this.onMouseDown}
              onPointerUp={this.onPointerUp}
            >
              <img
                src={fullUrl}
                alt="climate model"
                style={modelStyle}
                draggable="false"
              />
            </div>

            <div style={graphBufferStyle}>
              <div style={dataThirdStyle}>
                <p style={smallLabelTextStyle}>
                  Precipitation: {precipNum} % of Annual Avg
                </p>
              </div>
              <div style={dataThirdStyle}>
                <p style={smallLabelTextStyle}>
                  {temp_pre}
                  {tempNum} Celsius (vs 1920-1950)
                </p>
              </div>
              <div style={dataThirdStyle}>
                <p style={smallLabelTextStyle}>Sea Ice Fraction: {icePct} %</p>
              </div>
            </div>

            <div style={graphBufferStyle}>
              <div
                style={dataThirdStyle}
                onPointerDown={this.setupPrecipTransport}
                onPointerMove={this.testPrecipMusic}
                onPointerUp={this.killTransport}
              >
                <img
                  style={imageKeyStyle}
                  alt="precipitation key"
                  src={precipKey}
                  draggable="false"
                />
              </div>

              <div
                style={dataThirdStyle}
                onPointerDown={this.setupTempTransport}
                onPointerMove={this.testTempMusic}
                onPointerUp={this.killTransport}
              >
                <img
                  style={imageKeyStyle}
                  alt="temperature key"
                  src={tempKey}
                  draggable="false"
                />
              </div>

              <div
                style={dataThirdStyle}
                onPointerDown={this.setupIceTransport}
                onPointerMove={this.testIceMusic}
                onPointerUp={this.killTransport}
              >
                <img
                  style={imageKeyStyle}
                  alt="sea ice key"
                  src={iceKey}
                  draggable="false"
                />
              </div>
            </div>

            <div style={graphStyle}>
              <canvas
                ref={this.graphRef}
                height={graphHeight}
                width={graphWidth}
              />
            </div>

            <div style={graphBufferStyle} />
            <div style={graphBufferStyle} />

            <div style={sliderDivStyle} onPointerUp={this.updateYearVals}>
              <input
                style={sliderStyle}
                type="range"
                min="0"
                max="180"
                value={this.state.index}
                step="1"
                onChange={this.handleYear}
              />
              <img style={timelineStyle} alt="timeline" src={timelineImg} />
            </div>
          </div>
          <div
            style={location1}
            onPointerDown={this.setupMapTransport}
            onPointerMove={this.onMouseDown}
            onPointerUp={this.onPointerUp}
          >
            o
          </div>
          <div
            style={location2}
            onPointerDown={this.setupMapTransport}
            onPointerMove={this.onMouseDown}
            onPointerUp={this.onPointerUp}
          >
            o
          </div>
          <div
            style={location3}
            onPointerDown={this.setupMapTransport}
            onPointerMove={this.onMouseDown}
            onPointerUp={this.onPointerUp}
          >
            o
          </div>
          <div
            style={location4}
            onPointerDown={this.setupMapTransport}
            onPointerMove={this.onMouseDown}
            onPointerUp={this.onPointerUp}
          >
            o
          </div>
          <div
            style={location5}
            onPointerDown={this.setupMapTransport}
            onPointerMove={this.onMouseDown}
            onPointerUp={this.onPointerUp}
          >
            o
          </div>
          <div
            style={location6}
            onPointerDown={this.setupMapTransport}
            onPointerMove={this.onMouseDown}
            onPointerUp={this.onPointerUp}
          >
            o
          </div>
        </div>
      </div>
    );
  }
}

/*** class wrapper for naviagion functionality ***/
type AllTogetherWrapperProps = Record<string, unknown>;
export default function AllTogetherWrapper(props: AllTogetherWrapperProps): React.JSX.Element  {
  const { navigation, route } = useNavigationShim();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#efefef" }}>
      <AllTogether {...props} navigation={navigation} route={route} />
    </div>
  );
}
