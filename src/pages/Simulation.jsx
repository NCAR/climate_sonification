import React from "react";
import * as Tone from "tone";
import { Page } from "./Page.jsx";
import { playUrl, loading, dbUrl } from "../const/url.js";
import Axios from "axios";
import { SCALES, getScale } from "../const/scales.js";
import { timer } from "../sim/timer";
import { abortAndRenew } from "../sim/abort";

import {
  calcValByIndex,
  calcLargestVal,
  calcValByCoord,
  calcDBCoords,
  calcDBIndex,
} from "../sim/dataMath";

import {
  calcGraphDims,
  calcPrecipGraphVars,
  calcTempGraphVars,
} from "../sim/graphMath";

import { createNote } from "../sim/noteMapping";
import { createSynth } from "../sim/synthFactory";
import { getPlayButtonSrc } from "../sim/uiSelectors";

/*** Shared class for EachAlone and AllTogether class ***/
export class Simulation extends Page {
  constructor(props) {
    super(props);
    this.state.pageBottom = window.innerHeight - this.state.PADDING;
    this.state.pageRight = window.innerWidth - this.state.PADDING;
    this.state.index = 0;
    this.state.play = 0;
    this.state.waiting = 0;
    this.state.notePlaying = 0;
    this.state.timerLen = 800;
    this.state.playButton = playUrl;
    this.state.token = "";
    this.state.latitude = 0;
    this.state.longitude = 0;
    this.state.CONTROLDIV = 2 / 10;
    this.state.CONTROLVERTDIV = 1;
    this.state.SKINNYDIV = 1 / 20;
    this.state.DATAVERTDIV = 1 / 20;
    this.state.MAPDIV = 3 / 4;
    this.state.MAPVERTDIV = 3 / 4;
    this.state.GRAPHVERTDIV = 2 / 10;
    this.state.SLIDERVERTDIV = 1 / 20;
    this.state.CONTROLSPLIT = 1;
    this.state.useArray = 0;
    this.state.audioAvailable = false;
    this.state.precipNotes = [];
    this.state.tempNotes = [];
    this.state.iceNotes = [];
    this.state.precipNotes1 = [];
    this.state.tempNotes1 = [];
    this.state.iceNotes1 = [];
    this.state.precipNotes2 = [];
    this.state.tempNotes2 = [];
    this.state.iceNotes2 = [];
    this.state.pianoNotes = [];
    this.state.closestCity = "";
    // I'm pretty sure I need to bind the index incrementer
    this.incrementIndex = this.incrementIndex.bind(this);
  }

  // inside class
  _abortAndRenew(controller) {
    if (controller) controller.abort();
    return new AbortController();
  }

  /*** check if waiting ***/
  getPlayButton = () => {
    return getPlayButtonSrc({
      waiting: this.state.waiting,
      playButton: this.state.playButton,
      loadingSrc: loading,
    });
  };

  /*** return calculations based on page size for graph ***/
  getGraphDims = () => {
    return calcGraphDims({
      pageBottom: this.state.pageBottom,
      pageRight: this.state.pageRight,
      GRAPHVERTDIV: this.state.GRAPHVERTDIV,
      MAPDIV: this.state.MAPDIV,
    });
  };

  /*** variables te determine graph drawing ***/
  getPrecipGraphVars = (data) => {
    return calcPrecipGraphVars(data);
  };

  getTempGraphVars = (data, avg) => {
    return calcTempGraphVars(data, avg);
  };

  /*** read data value for a certain index (year-1920) ***/
  getValByIndex = (arr, ind) => {
    return calcValByIndex(arr, ind);
  };

  /*** get largest val over simulation years ***/
  getLargestVal = (arr, start) => {
    return calcLargestVal(arr, start);
  };

  /*** read data value for coordinate ***/
  getValByCoord = (arr, coord) => {
    return calcValByCoord(arr, coord);
  };

  /* create and send DB request for CO2 data */
  co2Api = () => {
    var request = dbUrl.concat("co2/all.txt");
    Axios.get(request).then((res) => {
      const all_co2_data = res.data.data;
      this.setState({ co2data: [...all_co2_data] });
      this.setPianoNotes(all_co2_data);
    });
  };

  /*** set co2 notes ***/
  setPianoNotes = (data) => {
    if (data.length === 0) {
      //console.log("co2 data failed to load");
      return -1;
    }
    var pianoNoteArr = [];
    var co2_val;
    var note;

    for (var i = 0; i < 181; i++) {
      co2_val = data[i].co2_val;
      note = this.getNote(3, co2_val, getScale(i));
      pianoNoteArr.push(note);
    }

    this.setState({
      pianoNotes: [...pianoNoteArr],
    });
  };

  /*** set precip notes ***/
  setPrecipNotes = (data) => {
    var precipNoteArr = [];
    var precip_val;
    var note;

    for (var i = 0; i < 181; i++) {
      precip_val = this.getValByIndex(data, i);
      note = this.getNote(0, precip_val, getScale(i));
      precipNoteArr.push(note);
    }

    this.setState({
      precipNotes: [...precipNoteArr],
    });
  };

  /*** set precip backup notes ***/
  setPrecipNotes1 = (data) => {
    var precipNoteArr = [];
    var precip_val;
    var note;

    for (var i = 0; i < 181; i++) {
      precip_val = this.getValByIndex(data, i);
      note = this.getNote(0, precip_val, getScale(i));
      precipNoteArr.push(note);
    }

    this.setState({
      precipNotes1: [...precipNoteArr],
    });
  };

  setPrecipNotes2 = (data) => {
    var precipNoteArr = [];
    var precip_val;
    var note;

    for (var i = 0; i < 181; i++) {
      precip_val = this.getValByIndex(data, i);
      note = this.getNote(0, precip_val, getScale(i));
      precipNoteArr.push(note);
    }

    this.setState({
      precipNotes2: [...precipNoteArr],
    });
  };

  setTempNotes = (data) => {
    var tempNoteArr = [];
    var temp_val;
    var note;

    for (var i = 0; i < 181; i++) {
      temp_val = this.getValByIndex(data, i);
      note = this.getNote(1, temp_val, getScale(i));
      tempNoteArr.push(note);
    }

    this.setState({
      tempNotes: [...tempNoteArr],
    });
  };

  setTempNotes1 = (data) => {
    var tempNoteArr = [];
    var temp_val;
    var note;

    for (var i = 0; i < 181; i++) {
      temp_val = this.getValByIndex(data, i);
      note = this.getNote(1, temp_val, getScale(i));
      tempNoteArr.push(note);
    }

    this.setState({
      tempNotes1: [...tempNoteArr],
    });
  };

  setTempNotes2 = (data) => {
    var tempNoteArr = [];
    var temp_val;
    var note;

    for (var i = 0; i < 181; i++) {
      temp_val = this.getValByIndex(data, i);
      note = this.getNote(1, temp_val, getScale(i));
      tempNoteArr.push(note);
    }

    this.setState({
      tempNotes2: [...tempNoteArr],
    });
  };

  setIceNotes = (data) => {
    var iceNoteArr = [];
    var ice_val;
    var note;

    for (var i = 0; i < 181; i++) {
      ice_val = this.getValByIndex(data, i);
      note = this.getNote(2, ice_val, getScale(i));
      iceNoteArr.push(note);
    }

    this.setState({
      iceNotes: [...iceNoteArr],
    });
  };

  setIceNotes1 = (data) => {
    var iceNoteArr = [];
    var ice_val;
    var note;

    for (var i = 0; i < 181; i++) {
      ice_val = this.getValByIndex(data, i);
      note = this.getNote(2, ice_val, getScale(i));
      iceNoteArr.push(note);
    }

    this.setState({
      iceNotes1: [...iceNoteArr],
    });
  };

  setIceNotes2 = (data) => {
    var iceNoteArr = [];
    var ice_val;
    var note;

    for (var i = 0; i < 181; i++) {
      ice_val = this.getValByIndex(data, i);
      note = this.getNote(2, ice_val, getScale(i));
      iceNoteArr.push(note);
    }

    this.setState({
      iceNotes2: [...iceNoteArr],
    });
  };

  // return the note to be played
  getNote = (type, value, scale = "maj") => {
    return createNote(type, value, scale);
  };

  getPianoNotes = (index) => {
    if (this.state.pianoNotes.length === 0) {
      return ["C5", "D5", "F5", "G5"];
    } else {
      if (index >= this.state.pianoNotes.length) {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.pianoNotes.slice(index);
    }
  };

  getPrecipNotes = (index) => {
    if (this.state.precipNotes.length === 0) {
      return ["C5", "D5", "F5", "G5"];
    } else {
      if (index >= this.state.precipNotes.length) {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.precipNotes.slice(index);
    }
  };

  getPrecipNotes1 = (index) => {
    if (this.state.precipNotes1.length === 0) {
      return ["C5", "D5", "F5", "G5"];
    } else {
      if (index >= this.state.precipNotes1.length) {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.precipNotes1.slice(index);
    }
  };

  getPrecipNotes2 = (index) => {
    if (this.state.precipNotes2.length === 0) {
      return ["C5", "D5", "F5", "G5"];
    } else {
      if (index >= this.state.precipNotes2.length) {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.precipNotes2.slice(index);
    }
  };

  getTempNotes = (index) => {
    if (this.state.tempNotes.length === 0) {
      return ["C5", "D5", "F5", "G5"];
    } else {
      if (index >= this.state.tempNotes.length) {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.tempNotes.slice(index);
    }
  };

  getTempNotes1 = (index) => {
    if (this.state.tempNotes1.length === 0) {
      return ["C5", "D5", "F5", "G5"];
    } else {
      if (index >= this.state.tempNotes1.length) {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.tempNotes1.slice(index);
    }
  };

  getTempNotes2 = (index) => {
    if (this.state.tempNotes2.length === 0) {
      return ["C5", "D5", "F5", "G5"];
    } else {
      if (index >= this.state.tempNotes2.length) {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.tempNotes2.slice(index);
    }
  };

  getIceNotes = (index) => {
    if (this.state.iceNotes.length === 0) {
      return ["C5", "D5", "F5", "G5"];
    } else {
      if (index >= this.state.iceNotes.length) {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.iceNotes.slice(index);
    }
  };

  getIceNotes1 = (index) => {
    if (this.state.iceNotes1.length === 0) {
      return ["C5", "D5", "F5", "G5"];
    } else {
      if (index >= this.state.iceNotes1.length) {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.iceNotes1.slice(index);
    }
  };

  getIceNotes2 = (index) => {
    if (this.state.iceNotes2.length === 0) {
      return ["C5", "D5", "F5", "G5"];
    } else {
      if (index >= this.state.iceNotes2.length) {
        return ["C5", "D5", "F5", "G5"];
      }
      return this.state.iceNotes2.slice(index);
    }
  };

  /*** different variations to trigger note, used for model coord change, textbox / city ***/
  triggerNoteByVal = (type, val) => {
    Tone.Transport.start();
    const delay = Math.random() / 100;
    const plus = "+";
    const plusDelay = plus.concat(delay);
    const synth = this.getSynth(type);
    const note = this.getNote(type, val, getScale(this.state.index));
    this.setState({ notePlaying: 1 });
    Tone.Transport.scheduleOnce((time) => {
      synth.triggerAttackRelease(note, "8n", plusDelay);
    }, "+0");
    Tone.Transport.scheduleOnce((time) => {
      this.setState({ notePlaying: 0 });
      synth.dispose();
      Tone.Transport.cancel();
      Tone.Transport.stop();
    }, "+2n");
  };

  playNoteByVal = (type, val, index, data) => {
    const synth = this.getSynth(type);
    const delay = Math.random() / 100;
    const plus = "+";
    const plusDelay = plus.concat(delay);
    const note = this.getNote(type, val, getScale(this.state.index));
    //console.log('note: ' + note);

    this.setState({ notePlaying: 1 }, function () {
      //console.log('note 1: ' + this.state.notePlaying);
      //console.log('play state ' + this.state.play);
      Tone.Transport.scheduleOnce((time) => {
        //console.log('pre trigger attack release')
        synth.triggerAttackRelease(note, "8n", plusDelay);
        //console.log('trigger attack release');
      }, "+0");
      Tone.Transport.scheduleOnce((time) => {
        //console.log('pre setting note to 0')
        this.setState({ notePlaying: 0 }, function () {
          //console.log('note 0: '+this.state.notePlaying);
          synth.dispose();
        });
      }, "+2n");
    });
  };

  playNoteByValKey = (type, val, index, data) => {
    const synth = this.getSynth(type);
    const delay = Math.random() / 100;
    const plus = "+";
    const plusDelay = plus.concat(delay);
    const note = this.getNote(type, val, getScale(this.state.index));
    this.setState({ notePlaying: 1 });
    Tone.Transport.scheduleOnce((time) => {
      synth.triggerAttackRelease(note, "8n", plusDelay);
    }, "+0");
    Tone.Transport.scheduleOnce((time) => {
      this.setState({ notePlaying: 0 });
      synth.dispose();
    }, "+2n");
  };

  /*** start tranport to play the map ***/
  setupMapTransport = (e) => {
    //console.log('setup map transport***');
    ////console.log(Tone.Transport.state);
    Tone.Transport.start("+0");
    this.setModerato();
    this.onMouseDown(e);
  };

  /*** stop tranport to play the map ***/
  killMapTransport = (e) => {
    Tone.Transport.scheduleOnce((time) => {
      //console.log('killmaptransport');
      this.setState({ notePlaying: 0 });
      Tone.Transport.cancel("+0");
      Tone.Transport.stop("+0");
      Tone.Transport.cancel();
    }, "+2n");
  };

  killTransport = (e) => {
    Tone.Transport.scheduleOnce((time) => {
      this.setState({ notePlaying: 0 });
      Tone.Transport.cancel("+0");
      Tone.Transport.stop("+0");
      Tone.Transport.cancel();
    }, "+2n");
  };

  /*** returns synth to be played
    TODO: set synths 1 time on componentDidMount, then return them with this function
    this wil fix playing the map sound issue, which is caused by spawining and disposing synths ***/
  getSynth = (type) =>
  {
    return createSynth(type);
  };

  /*** Another increment method to work with tone ***/
  incrementIndex = () => {
    const { index } = this.state;
    if (index < 180) {
      this.setState({ index: index + 1 });
    } else {
      this.stopMusic(0);
    }
  };

  /*** convert db coords from 2d to 1d ***/
  getDBIndex = (dbX, dbY) => {
    return calcDBIndex(dbX, dbY);
  };

  /*** return db coords from lat and lon in states ***/
  getDBCoords = () => {
    return calcDBCoords(this.state.latitude, this.state.longitude);
  };

  /*** onPress for 'moderato' ***/
  setModerato = () => {
    this.setState({
      timerLen: 800,
    });
    Tone.Transport.bpm.value = 200;
  };

  /*** onPress for 'allegro' ***/
  setAllegro = () => {
    this.setState({
      timerLen: 400,
    });
    Tone.Transport.bpm.value = 240;
  };

  /*** onPress for 'presto' ***/
  setPresto = () => {
    this.setState({
      timerLen: 200,
    });
    Tone.Transport.bpm.value = 320;
  };

  /*** handle year changes from the slider ***/
  handleYear = (event) => {
    if (this.state.play === 0) {
      this.setState({
        index: parseInt(event.target.value, 10),
        useArray: 3,
      });
    }
  };

  /*** navigate home ***/
  callHome = () => {
    const { navigation } = this.props;
    if (this.state.play === 1) {
      this.stopMusic(1);
    }
    navigation.navigate("Home");
  };

  /*** clears and redraws rectangle around the graph area ***/
  setupGraph() {
    const ctx = this.graphRef.current.getContext("2d");
    var graphBottom = Math.floor(
      this.state.pageBottom * this.state.GRAPHVERTDIV,
    );
    var modelWidth = Math.floor(this.state.pageRight * this.state.MAPDIV);
    var bottom = graphBottom - 1;
    var right = modelWidth - 1;

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
  rotateDimensions = async () => {
    await timer(1000);
    window.scrollTo(0, 0);
    window.resizeTo(this.state.pageBottom, this.state.pageRight);
    window.focus();
    this.updateDimensions();
  };

  /*** Huge section of common styling, relies on the page size and what the DIVs are set at ***/
  getCommonStyles() {
    var modelWidth = Math.floor(this.state.pageRight * this.state.MAPDIV);
    var modelHeight = Math.floor(this.state.pageBottom * this.state.MAPVERTDIV);

    var controlWidth = this.state.pageRight * this.state.CONTROLDIV;
    var controlHeight = this.state.pageBottom * this.state.CONTROLVERTDIV;

    var skinnyWidth = Math.floor(this.state.pageRight * this.state.SKINNYDIV);

    var smallFontSize = Math.floor(
      this.state.pageRight / 200 + this.state.pageBottom / 120,
    );
    var microFontSize = smallFontSize - 2;
    var largeFontSize = Math.floor(
      this.state.pageRight / 160 + this.state.pageBottom / 80,
    );

    var buttonPadding = Math.floor(
      this.state.pageRight / 300 + this.state.pageBottom / 500,
    );

    const pageDiv = {
      height: this.state.pageBottom,
      width: this.state.pageRight,
      padding: this.state.PADDING / 2,
    };

    /*** style for model images and div ***/
    const modelStyle = {
      width: modelWidth,
      height: modelHeight,
    };

    const containerStyle = {
      height: this.state.pageBottom,
      width: this.state.pageRight,
      overflow: "hidden",
    };

    const controlContainerStyle = {
      height: Math.floor(controlHeight / 2),
      width: Math.floor(
        this.state.pageRight * this.state.CONTROLDIV * this.state.CONTROLSPLIT,
      ),
      float: "left",
    };

    const graphStyle = {
      height: this.state.pageBottom * this.state.GRAPHVERTDIV,
      width: modelWidth,
    };

    const sliderDivStyle = {
      height: Math.floor(this.state.pageBottom * this.state.SLIDERVERTDIV),
      width: modelWidth,
    };

    const sliderStyle = {
      height:
        Math.floor((this.state.pageBottom * this.state.SLIDERVERTDIV) / 2) -
        this.state.PADDING,
      width: "99%",
    };

    const timelineStyle = {
      height:
        Math.floor((this.state.pageBottom * this.state.SLIDERVERTDIV) / 2) -
        this.state.PADDING * 2,
      width: modelWidth,
      objectFit: "fill",
    };

    const controlDivStyle = {
      height: controlHeight,
      width: controlWidth,
      overflow: "hidden",
      float: "left",
    };

    var playSplitDivStyle = {
      height: Math.floor(controlHeight / 10),
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3),
      overflow: "hidden",
      float: "left",
      border: "none",
    };

    var controlBlockStyle = {
      height: Math.floor(controlHeight / 10),
      width: controlWidth * this.state.CONTROLSPLIT,
      overflow: "hidden",
      float: "left",
    };

    const dataThirdStyle = {
      width: Math.floor(modelWidth / 3),
      height: Math.floor(this.state.pageBottom * this.state.DATAVERTDIV),
      overflow: "hidden",
      float: "left",
    };

    const imageKeyStyle = {
      width: Math.floor(modelWidth / 3),
      height: Math.floor(this.state.pageBottom * this.state.DATAVERTDIV),
      overflow: "hidden",
      float: "left",
      objectFit: "fill",
    };

    var dataBlockStyle = {
      height: (3 * controlHeight) / 40,
      width: Math.floor(controlWidth * this.state.CONTROLSPLIT),
      overflow: "hidden",
      float: "left",
      textAlign: "center",
      border: "none",
    };

    var keyContainer = {
      width: Math.floor(
        this.state.pageRight * this.state.CONTROLDIV * this.state.CONTROLSPLIT,
      ),
      height: Math.floor(
        (this.state.pageBottom * this.state.CONTROLVERTDIV * 3) / 20,
      ),
      float: "left",
      overflow: "hidden",
    };

    var thirdControlStyle = {
      height: Math.floor(controlHeight / 20),
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3),
      float: "left",
      border: "none",
    };

    var dropdownControlStyle = {
      height: Math.floor(controlHeight / 20) - 1,
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT * 2) / 3),
      float: "left",
      fontFamily: "Verdana, sans-serif",
      fontSize: smallFontSize,
    };

    var inputControlStyle = {
      height: Math.floor(controlHeight / 20),
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 5),
      float: "left",
      fontFamily: "Verdana, sans-serif",
      fontSize: smallFontSize,
    };

    var labelControlStyle = {
      height: Math.floor(controlHeight / 20),
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 6) - 1,
      float: "left",
      fontFamily: "Verdana, sans-serif",
      fontSize: smallFontSize,
      textAlign: "right",
      paddingTop: 5,
    };

    var active = "#44CC44";
    var inactive = "#DDDDDD";
    var moderato = active;
    var allegro = inactive;
    var presto = inactive;

    if (this.state.timerLen === 1200) {
      moderato = inactive;
      allegro = inactive;
      presto = inactive;
    } else if (this.state.timerLen === 800) {
      moderato = active;
      allegro = inactive;
      presto = inactive;
    } else if (this.state.timerLen === 400) {
      moderato = inactive;
      allegro = active;
      presto = inactive;
    } else if (this.state.timerLen === 200) {
      moderato = inactive;
      allegro = inactive;
      presto = active;
    }
    var moderatoHighlight = {
      backgroundColor: moderato,
      fontSize: microFontSize,
      fontFamily: "Verdana, sans-serif",
      padding: buttonPadding,
      borderRadius: buttonPadding,
      display: "inline-block",
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3) - 20,
    };
    var allegroHighlight = {
      backgroundColor: allegro,
      fontSize: microFontSize,
      fontFamily: "Verdana, sans-serif",
      padding: buttonPadding,
      borderRadius: buttonPadding,
      display: "inline-block",
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3) - 20,
    };
    var prestoHighlight = {
      backgroundColor: presto,
      fontSize: microFontSize,
      fontFamily: "Verdana, sans-serif",
      padding: buttonPadding,
      borderRadius: buttonPadding,
      display: "inline-block",
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3) - 20,
    };

    var aboutButton = {
      backgroundColor: inactive,
      fontSize: microFontSize,
      fontFamily: "Verdana, sans-serif",
      padding: buttonPadding,
      borderRadius: buttonPadding,
      display: "inline-block",
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3) - 20,
    };

    if (this.state.CONTROLVERTDIV !== 1) {
      playSplitDivStyle = {
        height: Math.floor(
          controlHeight / (10 * (1 - this.state.CONTROLVERTDIV)),
        ),
        width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3),
        overflow: "hidden",
        float: "left",
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
        padding: "1px",
        borderRadius: "1px",
        display: "inline-block",
        width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3) - 5,
      };
      allegroHighlight = {
        backgroundColor: allegro,
        fontSize: microFontSize,
        fontFamily: "Verdana, sans-serif",
        padding: "1px",
        borderRadius: "1px",
        display: "inline-block",
        width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3) - 5,
      };
      prestoHighlight = {
        backgroundColor: presto,
        fontSize: microFontSize,
        fontFamily: "Verdana, sans-serif",
        padding: "1px",
        borderRadius: "1px",
        display: "inline-block",
        width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3) - 5,
      };
      aboutButton = {
        backgroundColor: inactive,
        fontSize: microFontSize,
        fontFamily: "Verdana, sans-serif",
        padding: "1px",
        borderRadius: "1px",
        display: "inline-block",
        width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3) - 20,
      };
    }

    const graphBufferStyle = {
      width: Math.floor(modelWidth),
      height: Math.floor(this.state.pageBottom * this.state.DATAVERTDIV),
      float: "left",
      overflow: "hidden",
    };

    const instructionTextStyle = {
      fontFamily: "Verdana, sans-serif",
      fontSize: largeFontSize,
      display: "inline",
    };

    const paragraphTextStyle = {
      fontFamily: "Verdana, sans-serif",
      fontSize: smallFontSize,
    };

    const smallLabelTextStyle = {
      fontFamily: "Verdana, sans-serif",
      fontSize: smallFontSize,
    };

    const quarterControlStyle = {
      height: Math.floor(controlHeight / 20),
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3),
      float: "left",
      textAlign: "center",
      border: "none",
    };

    const halfControlStyle = {
      height: Math.floor(controlHeight / 20),
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 2),
      float: "left",
      textAlign: "center",
    };

    const bigLabelControlStyle = {
      height: Math.floor(controlHeight / 20),
      width: Math.floor((controlWidth * this.state.CONTROLSPLIT) / 3) - 1,
      float: "left",
      fontFamily: "Verdana, sans-serif",
      fontSize: smallFontSize,
      textAlign: "right",
      paddingTop: 5,
    };

    const skinnyDivStyle = {
      height: this.state.pageBottom * this.state.MAPVERTDIV,
      width: skinnyWidth,
      overflow: "hidden",
      float: "left",
    };

    const largeDivStyle = {
      height: this.state.pageBottom,
      width: modelWidth,
      overflow: "hidden",
      float: "left",
    };

    const skinnyImgStyle = {
      height: (this.state.pageBottom * this.state.MAPVERTDIV) / 2,
      width: skinnyWidth,
      overflow: "hidden",
    };

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
  componentDidMount = () => {
    //console.log("class fail");
  };

  componentWillUnmount = () => {
    //console.log("class fail");
  };

  render() {
    return <p>Class Failed to load Properly</p>;
  }
}
