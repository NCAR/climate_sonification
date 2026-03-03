import * as React from "react";
import * as Tone from "tone";
import { playUrl, dbUrl, loading } from "../const/url.js";
import Axios from "axios";
import { getScale } from "../const/scales.js";
import { timer } from "../sim/timer";
import type { Navigation, Route } from "../routing/useNavigationShim";
import
  {
    calcValByIndex,
    calcLargestVal,
    calcValByCoord,
    calcDBCoords,
    calcDBIndex,
    AvgArr,
    AvgRow
  } from "../sim/dataMath";

import
  {
    calcGraphDims,
    calcPrecipGraphVars,
    calcTempGraphVars,
  } from "../sim/graphMath";

import { createNote, NoteType } from "../sim/noteMapping";
import { createSynth } from "../sim/synthFactory";

type CommonStyles = {
  pageDiv: React.CSSProperties;
  modelWidth: number;
  modelStyle: React.CSSProperties;
  controlHeight: number;
  controlWidth: number;
  containerStyle: React.CSSProperties;
  controlDivStyle: React.CSSProperties;
  controlContainerStyle: React.CSSProperties;
  instructionTextStyle: React.CSSProperties;
  paragraphTextStyle: React.CSSProperties;
  dataBlockStyle: React.CSSProperties;
  thirdControlStyle:React.CSSProperties;
  controlBlockStyle:React.CSSProperties;
  playSplitDivStyle:React.CSSProperties;
  quarterControlStyle:React.CSSProperties;
  prestoHighlight: React.CSSProperties;
  moderatoHighlight:React.CSSProperties;
  allegroHighlight: React.CSSProperties;
  inputControlStyle:React.CSSProperties;
  labelControlStyle: React.CSSProperties;
  bigLabelControlStyle:React.CSSProperties;
  smallLabelTextStyle:React.CSSProperties;
  dropdownControlStyle:React.CSSProperties;
  halfControlStyle:React.CSSProperties;
  aboutButton:React.CSSProperties;
  keyContainer:React.CSSProperties;
  skinnyImgStyle:React.CSSProperties;
  skinnyDivStyle: React.CSSProperties;
  largeDivStyle:React.CSSProperties;
  graphBufferStyle:React.CSSProperties;
  dataThirdStyle: React.CSSProperties;
  imageKeyStyle:React.CSSProperties;
  graphStyle: React.CSSProperties;
  sliderStyle:React.CSSProperties;
  sliderDivStyle: React.CSSProperties;
  timelineStyle:React.CSSProperties;
};

type SynthType = Parameters<typeof createSynth>[0];
type ScaleMode = "maj" | "harm" | "pdor" | "pdom" | "dharm";

type ToneTransport = ReturnType<typeof Tone.getTransport>;
const transport = (): ToneTransport => Tone.getTransport();

export type SimulationProps = {
  navigation: Navigation;
  route: Route;
};

type Co2Row = { co2_val: number };

type SimulationState = {

  pageBottom: number;
  pageRight: number;
  pageBottomMax: number;
  pageRightMax: number;
  co2data: Co2Row[];
  PADDING: number;

  index: number;
  play: number;
  waiting: number;
  notePlaying: number;
  timerLen: number;
  loadingSrc: string;
  playButton: string;
  token: string;

  latitude: number;
  longitude: number;

  CONTROLDIV: number;
  CONTROLVERTDIV: number;
  SKINNYDIV: number;
  DATAVERTDIV: number;
  MAPDIV: number;
  MAPVERTDIV: number;
  GRAPHVERTDIV: number;
  SLIDERVERTDIV: number;
  CONTROLSPLIT: number;
  useArray: number;

  audioAvailable: boolean;

  precipNotes: string[];
  tempNotes: string[];
  iceNotes: string[];
  precipNotes1: string[];
  tempNotes1: string[];
  iceNotes1: string[];
  precipNotes2: string[];
  tempNotes2: string[];
  iceNotes2: string[];

  pianoNotes: string[];
  closestCity: string;

  yearData: AvgArr;
  coordData: AvgArr;
  coordData1: AvgArr;
  coordData2: AvgArr;
  state: NoteType;  
  modelStr: string;

  precipAvg: AvgArr;
  tempAvg: AvgArr;
  iceAvg: AvgArr;
  precip1: AvgArr;
  temp1: AvgArr;
  ice1: AvgArr;
  precipAvgAllCoords: AvgArr;
  tempAvgAllCoords: AvgArr;
  iceAvgAllCoords: AvgArr;

  iceBool?: boolean;
  tempBool?: boolean;
  precipBool?: boolean;

  precipSrc?: string;
  tempSrc?: string;
  iceSrc?: string;
  keySrc?: string;
};

/*** Shared class for EachAlone and AllTogether class ***/
export abstract class Simulation extends React.Component<SimulationProps, SimulationState>
{
  graphRef: React.RefObject<HTMLCanvasElement | null>;
  constructor(props:SimulationProps)
  {
    super(props);
    const PADDING = 40;   // came from Page

    this.graphRef = React.createRef<HTMLCanvasElement>();

    this.state = {
      // ---- from Page.jsx ----
      pageBottom: window.innerHeight - PADDING,
      pageRight: window.innerWidth - PADDING,
      pageBottomMax: window.innerHeight,
      pageRightMax: window.innerWidth,
      co2data: [],
      PADDING,
      loadingSrc:loading,
      index: 0,
      play: 0,
      waiting: 0,
      notePlaying: 0,
      timerLen: 800,
      playButton: playUrl,
      token: "",
      latitude: 0,
      longitude: 0,
      CONTROLDIV: 2 / 10,
      CONTROLVERTDIV: 1,
      SKINNYDIV: 1 / 20,
      DATAVERTDIV: 1 / 20,
      MAPDIV: 3 / 4,
      MAPVERTDIV: 3 / 4,
      GRAPHVERTDIV: 2 / 10,
      SLIDERVERTDIV: 1 / 20,
      CONTROLSPLIT: 1,
      useArray: 0,
      audioAvailable: false,
      precipNotes: [],
      tempNotes: [],
      iceNotes: [],
      precipNotes1: [],
      tempNotes1: [],
      iceNotes1: [],
      precipNotes2: [],
      tempNotes2: [],
      iceNotes2: [],
      pianoNotes: [],
      precipAvg: [{} as AvgRow],
      tempAvg: [{} as AvgRow],
      iceAvg: [{} as AvgRow],
      precip1: [{} as AvgRow],
      temp1: [{} as AvgRow],
      ice1: [{} as AvgRow],
      precipAvgAllCoords: [{} as AvgRow],
      tempAvgAllCoords: [{} as AvgRow],
      iceAvgAllCoords: [{} as AvgRow],
      yearData: [{} as AvgRow],
      coordData: [{} as AvgRow],
      coordData1: [{} as AvgRow],
      coordData2: [{} as AvgRow],
      closestCity: "",
      modelStr:"",
      state:0
    };

    //this.incrementIndex = this.incrementIndex.bind(this);
  }

  abstract onMouseDown(e: React.MouseEvent | React.PointerEvent): void;
  abstract stopMusic(terminate?: boolean): void;
  abstract updateDimensions(): void;

  /*** check if waiting ***/
  getPlayButton = (): string =>
  {
    const { waiting, playButton, loadingSrc } = this.state;
    if (waiting !== 0) {
      return loadingSrc;
    }

    return playButton;
  };

  /*** return calculations based on page size for graph ***/
  getGraphDims = (): ReturnType<typeof calcGraphDims> => {
  const { pageBottom, pageRight, GRAPHVERTDIV, MAPDIV } = this.state;

  return calcGraphDims({
    pageBottom,
    pageRight,
    GRAPHVERTDIV,
    MAPDIV,
  });
};

  /*** variables te determine graph drawing ***/
  getPrecipGraphVars = (data: AvgArr): ReturnType<typeof calcPrecipGraphVars> => {
  return calcPrecipGraphVars(data);
  };
  
  getTempGraphVars = (data: AvgArr, avg: number): ReturnType<typeof calcTempGraphVars> => {
    return calcTempGraphVars(data, avg);
  };

  /*** read data value for a certain index (year-1920) ***/
  getValByIndex = (data: AvgArr, index: number): ReturnType<typeof calcValByIndex> => {
    return calcValByIndex(data, index);
  };


  /*** get largest val over simulation years ***/
  getLargestVal = (data: AvgArr, start: number): ReturnType<typeof calcLargestVal> => {
    return calcLargestVal(data, start);
  };

  /*** read data value for coordinate ***/
  getValByCoord = (data: AvgArr, coord: number): ReturnType<typeof calcValByCoord> => {
    return calcValByCoord(data, coord);
  };

  /* create and send DB request for CO2 data */
  co2Api = (): void =>
  {
    const request = dbUrl.concat("co2/all.txt");
    void Axios.get<{ data: Co2Row[] }>(request).then((res) =>
    {
      const all_co2_data = res.data.data;
      this.setState({ co2data: [...all_co2_data] });
      this.setPianoNotes(all_co2_data);
    }) .catch((err: unknown) =>
    {
        console.error("Failed to load CO2 data", err);
    });
  };

  /*** set co2 notes ***/
  setPianoNotes = (data: Co2Row[]): void =>
  {
    if (data.length === 0)
    {
      console.log("co2 data failed to load");
      return;
    }
    const pianoNoteArr = [];
    let co2_val;
    let note;

    for (let i = 0; i < 181; i++)
    {
      const item = data[i];
      if (!item) continue;
      co2_val = item.co2_val;
      note = this.getNote(3, co2_val, getScale(i));
      pianoNoteArr.push(note)
    }

    this.setState({
      pianoNotes: [...pianoNoteArr]
    });
  };

  /*** set precip notes ***/
  setPrecipNotes = (data:AvgArr): void =>
  {
    const precipNoteArr = [];
    let precip_val:number;
    let note: string;

    for (let i = 0; i < 181; i++)
    {
      precip_val = this.getValByIndex(data, i);
      note = this.getNote(0, precip_val, getScale(i));
      precipNoteArr.push(note);
    }

    this.setState({
      precipNotes: [...precipNoteArr],
    });
  };

  /*** set precip backup notes ***/
  setPrecipNotes1 = (data:AvgArr): void =>
  {
    const precipNoteArr = [];
    let precip_val:number;
    let note: string;

    for (let i = 0; i < 181; i++)
    {
      precip_val = this.getValByIndex(data, i);
      note = this.getNote(0, precip_val, getScale(i));
      precipNoteArr.push(note);
    }

    this.setState({
      precipNotes1: [...precipNoteArr],
    });
  };

  setPrecipNotes2 = (data:AvgArr): void =>
  {
    const precipNoteArr = [];
    let precip_val:number;
    let note: string;

    for (let i = 0; i < 181; i++)
    {
      precip_val = this.getValByIndex(data, i);
      note = this.getNote(0, precip_val, getScale(i));
      precipNoteArr.push(note);
    }

    this.setState({
      precipNotes2: [...precipNoteArr],
    });
  };

  setTempNotes = (data:AvgArr): void =>
  {
    const tempNoteArr = [];
    let temp_val:number;
    let note: string;

    for (let i = 0; i < 181; i++)
    {
      temp_val = this.getValByIndex(data, i);
      note = this.getNote(1, temp_val, getScale(i));
      tempNoteArr.push(note);
    }

    this.setState({
      tempNotes: [...tempNoteArr],
    });
  };

  setTempNotes1 = (data:AvgArr): void =>
  {
    const tempNoteArr = [];
    let temp_val:number;
    let note: string;

    for (let i = 0; i < 181; i++)
    {
      temp_val = this.getValByIndex(data, i);
      note = this.getNote(1, temp_val, getScale(i));
      tempNoteArr.push(note);
    }

    this.setState({
      tempNotes1: [...tempNoteArr],
    });
  };

  setTempNotes2 = (data:AvgArr): void =>
  {
    const tempNoteArr = [];
    let temp_val:number;
    let note: string;

    for (let i = 0; i < 181; i++)
    {
      temp_val = this.getValByIndex(data, i);
      note = this.getNote(1, temp_val, getScale(i));
      tempNoteArr.push(note);
    }

    this.setState({
      tempNotes2: [...tempNoteArr],
    });
  };

  setIceNotes = (data:AvgArr): void =>
  {
    const iceNoteArr = [];
    let ice_val:number;
    let note: string;

    for (let i = 0; i < 181; i++)
    {
      ice_val = this.getValByIndex(data, i);
      note = this.getNote(2, ice_val, getScale(i));
      iceNoteArr.push(note);
    }

    this.setState({
      iceNotes: [...iceNoteArr],
    });
  };

  setIceNotes1 = (data:AvgArr): void =>
  {
    const iceNoteArr = [];
    let ice_val:number;
    let note: string;

    for (let i = 0; i < 181; i++)
    {
      ice_val = this.getValByIndex(data, i);
      note = this.getNote(2, ice_val, getScale(i));
      iceNoteArr.push(note);
    }

    this.setState({
      iceNotes1: [...iceNoteArr],
    });
  };

  setIceNotes2 = (data:AvgArr): void =>
  {
    const iceNoteArr = [];
    let ice_val:number;
    let note: string;

    for (let i = 0; i < 181; i++)
    {
      ice_val = this.getValByIndex(data, i);
      note = this.getNote(2, ice_val, getScale(i));
      iceNoteArr.push(note);
    }

    this.setState({
      iceNotes2: [...iceNoteArr],
    });
  };

  // return the note to be played
  getNote = (type: NoteType, value: number, scale: ScaleMode = "maj"): string =>
  {
    return createNote(type, value, scale);
  };

  getPianoNotes = (index: number = this.state.index): string[] =>
  {
    if (this.state.pianoNotes.length === 0)
    {
      return ["C5", "D5", "F5", "G5"];
    } else
    {
      if (index >= this.state.pianoNotes.length)
      {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.pianoNotes.slice(index);
    }
  };

  getPrecipNotes = (index: number = this.state.index): string[] =>
  {
    if (this.state.precipNotes.length === 0)
    {
      return ["C5", "D5", "F5", "G5"];
    } else
    {
      if (index >= this.state.precipNotes.length)
      {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.precipNotes.slice(index);
    }
  };

  getPrecipNotes1 = (index: number = this.state.index): string[] =>
  {
    if (this.state.precipNotes1.length === 0)
    {
      return ["C5", "D5", "F5", "G5"];
    } else
    {
      if (index >= this.state.precipNotes1.length)
      {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.precipNotes1.slice(index);
    }
  };

  getPrecipNotes2 = (index: number = this.state.index): string[] =>
  {
    if (this.state.precipNotes2.length === 0)
    {
      return ["C5", "D5", "F5", "G5"];
    } else
    {
      if (index >= this.state.precipNotes2.length)
      {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.precipNotes2.slice(index);
    }
  };

  getTempNotes = (index: number = this.state.index): string[] =>
  {
    if (this.state.tempNotes.length === 0)
    {
      return ["C5", "D5", "F5", "G5"];
    } else
    {
      if (index >= this.state.tempNotes.length)
      {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.tempNotes.slice(index);
    }
  };

  getTempNotes1 = (index: number = this.state.index): string[] =>
  {
    if (this.state.tempNotes1.length === 0)
    {
      return ["C5", "D5", "F5", "G5"];
    } else
    {
      if (index >= this.state.tempNotes1.length)
      {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.tempNotes1.slice(index);
    }
  };

  getTempNotes2 = (index: number = this.state.index): string[] =>
  {
    if (this.state.tempNotes2.length === 0)
    {
      return ["C5", "D5", "F5", "G5"];
    } else
    {
      if (index >= this.state.tempNotes2.length)
      {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.tempNotes2.slice(index);
    }
  };

  getIceNotes = (index: number = this.state.index): string[] =>
  {
    if (this.state.iceNotes.length === 0)
    {
      return ["C5", "D5", "F5", "G5"];
    } else
    {
      if (index >= this.state.iceNotes.length)
      {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.iceNotes.slice(index);
    }
  };

  getIceNotes1 = (index: number = this.state.index): string[] =>
  {
    if (this.state.iceNotes1.length === 0)
    {
      return ["C5", "D5", "F5", "G5"];
    } else
    {
      if (index >= this.state.iceNotes1.length)
      {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.iceNotes1.slice(index);
    }
  };

  getIceNotes2 = (index: number = this.state.index): string[] =>
  {
    if (this.state.iceNotes2.length === 0)
    {
      return ["C5", "D5", "F5", "G5"];
    } else
    {
      if (index >= this.state.iceNotes2.length)
      {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.iceNotes2.slice(index);
    }
  };

  /*** different variations to trigger note, used for model coord change, textbox / city ***/
  triggerNoteByVal = (type: NoteType, val: number): void =>
  {
    transport().start();
    const delay = Math.random() / 100;
    const plusDelay = `+${String(delay)}`;
    const synth = this.getSynth(type);
    const note = this.getNote(type, val, getScale(this.state.index));
    this.setState({ notePlaying: 1 });
    transport().scheduleOnce(() =>
    {
      synth.triggerAttackRelease(note, "8n", plusDelay);
    }, "+0");
    transport().scheduleOnce(() =>
    {
      this.setState({ notePlaying: 0 });
      synth.dispose();
      transport().cancel();
      transport().stop();
    }, "+2n");
  };

  playNoteByVal = (type: NoteType, val: number): void =>
  {
    const synth = this.getSynth(type);
    const delay = Math.random() / 100;
    const plusDelay = `+${String(delay)}`;
    const note = this.getNote(type, val, getScale(this.state.index));
    //console.log('note: ' + note);

    this.setState({ notePlaying: 1 }, () =>
    {
      //console.log('note 1: ' + this.state.notePlaying);
      //console.log('play state ' + this.state.play);
      transport().scheduleOnce(() =>
      {
        //console.log('pre trigger attack release')
        synth.triggerAttackRelease(note, "8n", plusDelay);
        //console.log('trigger attack release');
      }, "+0");
      transport().scheduleOnce(() =>
      {
        //console.log('pre setting note to 0')
        this.setState({ notePlaying: 0 }, () =>
        {
          //console.log('note 0: '+this.state.notePlaying);
          synth.dispose();
        });
      }, "+2n");
    });
  };

  playNoteByValKey = (type: NoteType, val: number): void =>
  {
    const synth = this.getSynth(type);
    const delay = Math.random() / 100;
    const plusDelay = `+${String(delay)}`;
    const note = this.getNote(type, val, getScale(this.state.index));
    this.setState({ notePlaying: 1 });
    transport().scheduleOnce(() =>
    {
      synth.triggerAttackRelease(note, "8n", plusDelay);
    }, "+0");
    transport().scheduleOnce(() =>
    {
      this.setState({ notePlaying: 0 });
      synth.dispose();
    }, "+2n");
  };

  /*** start tranport to play the map ***/
  setupMapTransport = (e: React.MouseEvent | React.PointerEvent): void =>
  {
    //console.log('setup map transport***');
    ////console.log(transport().state);
    transport().start("+0");
    this.setModerato();
    this.onMouseDown(e);
  };

  /*** stop tranport to play the map ***/
  killTransport = (): void =>
  {
    transport().scheduleOnce(() =>
    {
      this.setState({ notePlaying: 0 });
      transport().cancel("+0");
      transport().stop("+0");
      transport().cancel();
    }, "+2n");
  };

  /*** returns synth to be played
    TODO: set synths 1 time on componentDidMount, then return them with this function
    this wil fix playing the map sound issue, which is caused by spawining and disposing synths ***/
  getSynth = (type: SynthType): ReturnType<typeof createSynth> =>
  {
    return createSynth(type);
  };

  /*** Another increment method to work with tone ***/
  incrementIndex = (): void =>
  {
    const { index } = this.state;
    if (index < 180)
    {
      this.setState({ index: index + 1 });
    } else
    {
      this.stopMusic(false);
    }
  };

  /*** convert db coords from 2d to 1d ***/
  getDBIndex = (dbX: number, dbY: number): ReturnType<typeof calcDBIndex> =>
  {
    return calcDBIndex(dbX, dbY);
  };

  /*** return db coords from lat and lon in states ***/
  getDBCoords = (): ReturnType<typeof calcDBCoords> =>
  {
    console.log('getdbcoords');
    console.log(this.state.latitude, this.state.longitude);
    return calcDBCoords(this.state.latitude, this.state.longitude);
  };

  /*** onPress for 'moderato' ***/
  setModerato = (): void =>
  {
    this.setState({
      timerLen: 800,
    });
    transport().bpm.value = 200;
  };

  /*** onPress for 'allegro' ***/
  setAllegro = (): void =>
  {
    this.setState({
      timerLen: 400,
    });
    transport().bpm.value = 240;
  };

  /*** onPress for 'presto' ***/
  setPresto = (): void =>
  {
    this.setState({
      timerLen: 200,
    });
    transport().bpm.value = 320;
  };

  /*** handle year changes from the slider ***/
  handleYear = (event: { target: { value: string; }; }): void =>
  {
    if (this.state.play === 0)
    {
      this.setState({
        index: parseInt(event.target.value, 10),
        useArray: 3,
      });
    }
  };

  /*** navigate home ***/
  callHome = ():void =>
  {
    const { navigation } = this.props;
    if (this.state.play === 1)
    {
      this.stopMusic(true);
    }
    navigation.navigate("Home");
  };

  /*** clears and redraws rectangle around the graph area ***/
  setupGraph():void
  {
    const canvas = this.graphRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const graphBottom = Math.floor(
      this.state.pageBottom * this.state.GRAPHVERTDIV,
    );
    const modelWidth = Math.floor(this.state.pageRight * this.state.MAPDIV);
    const bottom = graphBottom - 1;
    const right = modelWidth - 1;

    ctx.clearRect(0, 0, right, bottom);

    ctx.beginPath();
    ctx.moveTo(1, 1);
    ctx.lineTo(1, bottom);
    ctx.lineTo(right, bottom);
    ctx.lineTo(right, 1);
    ctx.lineTo(1, 1);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /*** Called when the window is rotated on mobile ***/
  rotateDimensions = (): void =>
  {
    void (async (): Promise<void> =>
    {
      await timer(1000);
      window.scrollTo(0, 0);
      window.resizeTo(this.state.pageBottom, this.state.pageRight);
      window.focus();
      this.updateDimensions();
    })();
  };

  /*** Huge section of common styling, relies on the page size and what the DIVs are set at ***/
  getCommonStyles():CommonStyles
  {
    const modelWidth = Math.floor(this.state.pageRight * this.state.MAPDIV);
    const modelHeight = Math.floor(this.state.pageBottom * this.state.MAPVERTDIV);

    const controlWidth = this.state.pageRight * this.state.CONTROLDIV;
    const controlHeight = this.state.pageBottom * this.state.CONTROLVERTDIV;

    const skinnyWidth = Math.floor(this.state.pageRight * this.state.SKINNYDIV);

    const smallFontSize = Math.floor(
      this.state.pageRight / 200 + this.state.pageBottom / 120,
    );
    const microFontSize = smallFontSize - 2;
    const largeFontSize = Math.floor(
      this.state.pageRight / 160 + this.state.pageBottom / 80,
    );

    const buttonPadding = Math.floor(
      this.state.pageRight / 300 + this.state.pageBottom / 500,
    );

    const pageDiv: React.CSSProperties = {
      height: this.state.pageBottom,
      width: this.state.pageRight,
      padding: this.state.PADDING / 2,
    };

    /*** style for model images and div ***/
    const modelStyle: React.CSSProperties = {
      width: modelWidth,
      height: modelHeight,
    };

    const containerStyle: React.CSSProperties = {
      height: this.state.pageBottom,
      width: this.state.pageRight,
      overflow: "hidden",
    };

    const controlContainerStyle: React.CSSProperties = {
      height: Math.floor(controlHeight / 2),
      width: Math.floor(
        this.state.pageRight * this.state.CONTROLDIV * this.state.CONTROLSPLIT,
      ),
      float: "left",
    };

    const graphStyle: React.CSSProperties = {
      height: this.state.pageBottom * this.state.GRAPHVERTDIV,
      width: modelWidth,
    };

    const sliderDivStyle: React.CSSProperties = {
      height: Math.floor(this.state.pageBottom * this.state.SLIDERVERTDIV),
      width: modelWidth,
    };

    const sliderStyle: React.CSSProperties = {
      height:
        Math.floor((this.state.pageBottom * this.state.SLIDERVERTDIV) / 2) -
        this.state.PADDING,
      width: "99%",
    };

    const timelineStyle: React.CSSProperties = {
      height:
        Math.floor((this.state.pageBottom * this.state.SLIDERVERTDIV) / 2) -
        this.state.PADDING * 2,
      width: modelWidth,
      objectFit: "fill",
    };

    const controlDivStyle: React.CSSProperties = {
      height: controlHeight,
      width: controlWidth,
      overflow: "hidden",
      float: "left",
    };

    let playSplitDivStyle: React.CSSProperties = {
      height: Math.floor(controlHeight / 10),
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3),
      overflow: "hidden",
      float: "left",
      border: "none",
    };

    let controlBlockStyle: React.CSSProperties = {
      height: Math.floor(controlHeight / 10),
      width: controlWidth * this.state.CONTROLSPLIT,
      overflow: "hidden",
      float: "left",
    };

    const dataThirdStyle: React.CSSProperties = {
      width: Math.floor(modelWidth / 3),
      height: Math.floor(this.state.pageBottom * this.state.DATAVERTDIV),
      overflow: "hidden",
      float: "left",
    };

    const imageKeyStyle: React.CSSProperties = {
      width: Math.floor(modelWidth / 3),
      height: Math.floor(this.state.pageBottom * this.state.DATAVERTDIV),
      overflow: "hidden",
      float: "left",
      objectFit: "fill",
    };

    let dataBlockStyle: React.CSSProperties = {
      height: (3 * controlHeight) / 40,
      width: Math.floor(controlWidth * this.state.CONTROLSPLIT),
      overflow: "hidden",
      float: "left",
      textAlign: "center",
      border: "none",
    };

    let keyContainer: React.CSSProperties = {
      width: Math.floor(
        this.state.pageRight * this.state.CONTROLDIV * this.state.CONTROLSPLIT,
      ),
      height: Math.floor(
        (this.state.pageBottom * this.state.CONTROLVERTDIV * 3) / 20,
      ),
      float: "left",
      overflow: "hidden",
    };

    let thirdControlStyle: React.CSSProperties = {
      height: Math.floor(controlHeight / 20),
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3),
      float: "left",
      border: "none",
    };

    let dropdownControlStyle: React.CSSProperties = {
      height: Math.floor(controlHeight / 20) - 1,
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT * 2) / 3),
      float: "left",
      fontFamily: "Verdana, sans-serif",
      fontSize: smallFontSize,
    };

    let inputControlStyle: React.CSSProperties = {
      height: Math.floor(controlHeight / 20),
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 5),
      float: "left",
      fontFamily: "Verdana, sans-serif",
      fontSize: smallFontSize,
    };

    let labelControlStyle: React.CSSProperties = {
      height: Math.floor(controlHeight / 20),
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 6) - 1,
      float: "left",
      fontFamily: "Verdana, sans-serif",
      fontSize: smallFontSize,
      textAlign: "right",
      paddingTop: 5,
    };

    const active = "#44CC44";
    const inactive = "#DDDDDD";
    let moderato = active;
    let allegro = inactive;
    let presto = inactive;

    if (this.state.timerLen === 1200)
    {
      moderato = inactive;
      allegro = inactive;
      presto = inactive;
    } else if (this.state.timerLen === 800)
    {
      moderato = active;
      allegro = inactive;
      presto = inactive;
    } else if (this.state.timerLen === 400)
    {
      moderato = inactive;
      allegro = active;
      presto = inactive;
    } else if (this.state.timerLen === 200)
    {
      moderato = inactive;
      allegro = inactive;
      presto = active;
    }
    let moderatoHighlight = {
      backgroundColor: moderato,
      fontSize: microFontSize,
      fontFamily: "Verdana, sans-serif",
      padding: buttonPadding,
      borderRadius: buttonPadding,
      display: "inline-block",
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3) - 20,
    };
    let allegroHighlight = {
      backgroundColor: allegro,
      fontSize: microFontSize,
      fontFamily: "Verdana, sans-serif",
      padding: buttonPadding,
      borderRadius: buttonPadding,
      display: "inline-block",
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3) - 20,
    };
    let prestoHighlight = {
      backgroundColor: presto,
      fontSize: microFontSize,
      fontFamily: "Verdana, sans-serif",
      padding: buttonPadding,
      borderRadius: buttonPadding,
      display: "inline-block",
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3) - 20,
    };

    let aboutButton = {
      backgroundColor: inactive,
      fontSize: microFontSize,
      fontFamily: "Verdana, sans-serif",
      padding: buttonPadding,
      borderRadius: buttonPadding,
      display: "inline-block",
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3) - 20,
    };

    if (this.state.CONTROLVERTDIV !== 1)
    {
      playSplitDivStyle = {
        height: Math.floor(
          controlHeight / (10 * (1 - this.state.CONTROLVERTDIV)),
        ),
        width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3),
        overflow: "hidden",
        float: "left",
        border: "none",
      };

      controlBlockStyle = {
        height: Math.floor(
          controlHeight / (10 * (1 - this.state.CONTROLVERTDIV)),
        ),
        width: controlWidth * this.state.CONTROLSPLIT,
        overflow: "hidden",
        float: "left",
      };

      dataBlockStyle = {
        height: (3 * controlHeight) / (40 * (1 - this.state.CONTROLVERTDIV)),
        width: Math.floor(controlWidth * this.state.CONTROLSPLIT),
        overflow: "hidden",
        float: "left",
        textAlign: "center",
        border: "none",
      };
      keyContainer = {
        width: Math.floor(
          this.state.pageRight *
          this.state.CONTROLDIV *
          this.state.CONTROLSPLIT,
        ),
        height: Math.floor(
          (this.state.pageBottom * this.state.CONTROLVERTDIV * 1) /
          (2 * 1 - this.state.CONTROLVERTDIV),
        ),
        float: "left",
        overflow: "hidden",
      };
      thirdControlStyle = {
        height: Math.floor((3 * controlHeight) / 40),
        width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3),
        float: "left",
        border: "none",
      };

      dropdownControlStyle = {
        height: Math.floor((3 * controlHeight) / 40),
        width: Math.floor((controlWidth * this.state.CONTROLSPLIT * 2) / 3),
        float: "left",
        fontFamily: "Verdana, sans-serif",
        fontSize: smallFontSize,
      };

      inputControlStyle = {
        height: Math.floor((3 * controlHeight) / 40),
        width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 5),
        float: "left",
        fontFamily: "Verdana, sans-serif",
        fontSize: smallFontSize,
      };

      labelControlStyle = {
        height: Math.floor((3 * controlHeight) / 40),
        width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 6) - 1,
        float: "left",
        fontFamily: "Verdana, sans-serif",
        fontSize: smallFontSize,
        textAlign: "right",
        paddingTop: 5,
      };
      moderatoHighlight = {
        backgroundColor: moderato,
        fontSize: microFontSize,
        fontFamily: "Verdana, sans-serif",
        padding: 1,
        borderRadius: 1,
        display: "inline-block",
        width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3) - 5,
      };
      allegroHighlight = {
        backgroundColor: allegro,
        fontSize: microFontSize,
        fontFamily: "Verdana, sans-serif",
        padding: 1,
        borderRadius: 1,
        display: "inline-block",
        width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3) - 5,
      };
      prestoHighlight = {
        backgroundColor: presto,
        fontSize: microFontSize,
        fontFamily: "Verdana, sans-serif",
        padding: 1,
        borderRadius: 1,
        display: "inline-block",
        width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3) - 5,
      };
      aboutButton = {
        backgroundColor: inactive,
        fontSize: microFontSize,
        fontFamily: "Verdana, sans-serif",
        padding: 1,
        borderRadius: 1,
        display: "inline-block",
        width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3) - 20,
      };
    }

    const graphBufferStyle = {
      width: Math.floor(modelWidth),
      height: Math.floor(this.state.pageBottom * this.state.DATAVERTDIV),
      float: "left",
      overflow: "hidden",
    } satisfies React.CSSProperties;

    const instructionTextStyle = {
      fontFamily: "Verdana, sans-serif",
      fontSize: largeFontSize,
      display: "inline",
    } satisfies React.CSSProperties;

    const paragraphTextStyle = {
      fontFamily: "Verdana, sans-serif",
      fontSize: smallFontSize,
    } satisfies React.CSSProperties;

    const smallLabelTextStyle = {
      fontFamily: "Verdana, sans-serif",
      fontSize: smallFontSize,
    } satisfies React.CSSProperties;

    const quarterControlStyle = {
      height: Math.floor(controlHeight / 20),
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3),
      float: "left",
      textAlign: "center",
      border: "none",
    } satisfies React.CSSProperties;

    const halfControlStyle = {
      height: Math.floor(controlHeight / 20),
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 2),
      float: "left",
      textAlign: "center",
    } satisfies React.CSSProperties;

    const bigLabelControlStyle = {
      height: Math.floor(controlHeight / 20),
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3) - 1,
      float: "left",
      fontFamily: "Verdana, sans-serif",
      fontSize: smallFontSize,
      textAlign: "right",
      paddingTop: 5,
    } satisfies React.CSSProperties;

    const skinnyDivStyle = {
      height: this.state.pageBottom * this.state.MAPVERTDIV,
      width: skinnyWidth,
      overflow: "hidden",
      float: "left",
    } satisfies React.CSSProperties;

    const largeDivStyle = {
      height: this.state.pageBottom,
      width: modelWidth,
      overflow: "hidden",
      float: "left",
    } satisfies React.CSSProperties;

    const skinnyImgStyle = {
      height: (this.state.pageBottom * this.state.MAPVERTDIV) / 2,
      width: skinnyWidth,
      overflow: "hidden",
    } satisfies React.CSSProperties;

    return {
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
      thirdControlStyle,
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
    };
  }

  /*** These should never run because each class has separate functions,
   *** but these are here to keep react from complaining ***/
  componentDidMount = ():void =>
  {
    //console.log("class fail");
  };

  componentWillUnmount = ():void =>
  {
    //console.log("class fail");
  };

  render(): React.JSX.Element
  {
    return <p>Class Failed to load Properly</p>;
  }
}
