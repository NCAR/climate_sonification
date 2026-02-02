import { prefetchImage } from "../utils/prefetchImage.js";
import { useNavigationShim } from "../routing/useNavigationShim";
import Axios from "axios";
import PubSub from "pubsub-js";
import { isBrowser } from "react-device-detect";
import { Simulation } from "./Simulation";
import * as Tone from "tone";
import { getClosestCity, getInfo } from "../const/cities.js";
import { RED, YELLOW, GREEN, BLUE } from "../const/color.js";
import { abortAndRenew } from "../sim/abort";

import {
  precipImgs,
  tempImgs,
  iceImgs,
  dbUrl,
  urlPre,
  precipActive,
  precipInactive,
  tempActive,
  tempInactive,
  iceActive,
  iceInactive,
  precipKey,
  tempKey,
  iceKey,
  homeButton,
  graphKey,
  topSkinnyImgAlone,
  bottomSkinnyImgAlone,
  timelineImg,
  aloneArtifactImgs,
  pauseUrl,
  playUrl,
} from "../const/url.js";

function isNumeric(value) {
  return /^-?\d+$/.test(value);
}
const transport = () => Tone.getTransport();



/*** EachAlone Class, returns interactive page
 *** Many items inherited from Simulation Class ***/
class EachAlone extends Simulation {
  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      yearData: [0],
      coordData: [0],
      coordData1: [0],
      coordData2: [0],
      state: 0,
      modelStr: "/precip/precip_ens",
      precipSrc: precipActive,
      tempSrc: tempInactive,
      iceSrc: iceInactive,
      keySrc: precipKey,
      precipBool: true,
      tempBool: false,
      iceBool: false,
    };
  }
  yearController = null;
  coordControllerAvg = null;
  coordController1Avg = null;
  coordController2Avg = null;

  // Clamp waiting so it never goes negative
  _decWaiting = () => {
    this.setState((prev) => ({
      waiting: Math.max(0, (prev.waiting || 0) - 1),
    }));
  };

  // Optional: set waiting safely (helps avoid undefined)
  _setWaiting = (n) => {
    this.setState({ waiting: Math.max(0, n | 0) });
  };

  _hasCo2AtIndex = (i) => {
    const row = this.state.co2data?.[i];
    return row && typeof row === "object" && typeof row.co2_val === "number";
  };

  _getCo2Val = (i) => {
    return this._hasCo2AtIndex(i) ? this.state.co2data[i].co2_val : null;
  };

  /*** Run this when stop is pressed or when index === 180 ***/
  stopMusic = (terminate?:boolean) => {
    //console.log('stopping');

    this.setState(
      {
        play: 0,
        playButton: playUrl,
      },
      function () {
        transport().stop();
        transport().cancel(0);
        if (terminate === false) {
          this.doYearHits(this.state.state, this.state.index + 1920);
        }
      },
    );
  };

  /*** onPress for 'Precipitation' Button ***/
  setPrecip = () => {
    /* change page vars */
    this.setState({
      state: 0,
      modelStr: "/precip/precip_ens",
      precipSrc: precipActive,
      tempSrc: tempInactive,
      iceSrc: iceInactive,
      keySrc: precipKey,
    });
    /* setup graph and query db */
    this.setupGraph();
    if (this.state.play === 0) {
      this.doYearHits(0, this.state.index + 1920);
    } else {
      this.stopMusic(false);
    }
    this.doCoordHits(0, this.state.latitude, this.state.longitude);
  };

  /*** onPress for 'Temperature' Button ***/
  setTemp = () => {
    this.setState({
      state: 1,
      modelStr: "/temp/temp_ens",
      precipSrc: precipInactive,
      tempSrc: tempActive,
      iceSrc: iceInactive,
      keySrc: tempKey,
      tempBool: true,
    });
    if (this.state.tempBool === false) {
      tempImgs.forEach((picture) => {
        prefetchImage(picture).catch(() => {});
      });
    }
    this.setupGraph();
    if (this.state.play === 0) {
      this.doYearHits(1, this.state.index + 1920);
    } else {
      this.stopMusic(false);
    }
    this.doCoordHits(1, this.state.latitude, this.state.longitude);
  };

  /*** onPress for 'Sea Ice' Button ***/
  setIce = () => {
    this.setState({
      state: 2,
      modelStr: "/seaIce/ice_ens",
      precipSrc: precipInactive,
      tempSrc: tempInactive,
      iceSrc: iceActive,
      keySrc: iceKey,
      iceBool: true,
    });
    if (this.state.iceBool === false) {
      iceImgs.forEach((picture) => {
        prefetchImage(picture).catch(() => {});
      });
    }
    this.setupGraph();
    if (this.state.play === 0) {
      this.doYearHits(2, this.state.index + 1920);
    } else {
      this.stopMusic(false);
    }
    this.doCoordHits(2, this.state.latitude, this.state.longitude);
  };

  /*** Queries db upon mouse/finger release from map, only if simulation stopped ***/
  onPointerUp = () => {
    //console.log('kill map transport on pointer up');
    //console.log('play state : '+ this.state.play);
    this.killMapTransport();
    if (this.state.play === 0) {
      //console.log('do coord hits because play state was 0');
      this.doCoordHits(
        this.state.state,
        this.state.latitude,
        this.state.longitude,
      );
    }
  };

  /*** called when the window is resized ***/
  updateDimensions = () => {
    const newheight = window.innerHeight;
    const newwidth = window.innerWidth;

    if (window.innerHeight < window.innerWidth) {
      this.setState({
        pageBottom: newheight - this.state.PADDING - 1,
        pageRight: newwidth - this.state.PADDING - 1,
        CONTROLDIV: 2 / 10, //width of control panel
        SKINNYDIV: 1 / 20, //width of model label image
        MAPDIV: 3 / 4, //width of models
        MAPVERTDIV: 7 / 10, //height of models
        DATAVERTDIV: 1 / 20, //height of padding for data
        GRAPHVERTDIV: 3 / 20, //height of graph
        SLIDERVERTDIV: 1 / 10, //height of padding
        CONTROLVERTDIV: 1, //height of control panel
        CONTROLSPLIT: 1, //control panel in 1 piece
        PADDING: 40,
      });
    } else {
      this.setState({
        pageBottom: newheight - this.state.PADDING - 1,
        pageRight: newwidth - this.state.PADDING - 1,
        CONTROLDIV: 1,
        SKINNYDIV: 1 / 20,
        MAPDIV: 19 / 20,
        MAPVERTDIV: 7 / 20,
        DATAVERTDIV: 1 / 20,
        GRAPHVERTDIV: 3 / 20,
        SLIDERVERTDIV: 1 / 10,
        CONTROLVERTDIV: 7 / 20,
        CONTROLSPLIT: 1 / 2, //control panel split in halves
        PADDING: 20,
      });
    }
    this.setupGraph();
  };

  /*** Used to calculate coords pressed on the map
    *** Leave this alone unless messing with DIV sizing
    name is misnomer, its acutally used for onPointerMove***/
  onMouseDown = (e) => {
    //check if mouse is clicked
    if (e.buttons !== 1) {
      return -1;
    }
    //console.log('play state: '+this.state.play);
    if (this.state.play === 1) {
      this.stopMusic(false);
    }
    if (this.state.notePlaying !== 0) {
      //console.log('note playing !== 0');
      return;
    }
    /* A bunch of variables used to calculate mouse position */
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

    //box 1,1
    if (x <= modelDiv && y <= modelSplit) {
      centerX = modelDiv / 2;
      centerY = modelSplit / 2;
    }
    //box 2,1
    else if (x <= modelDiv * 2 && y <= modelSplit) {
      centerX = modelDiv + modelDiv / 2;
      centerY = modelSplit / 2;
    }
    //box 3,1
    else if (x <= modelDiv * 3 && y <= modelSplit) {
      centerX = 2 * modelDiv + modelDiv / 2;
      centerY = modelSplit / 2;
    }
    //box 1,2
    else if (x <= modelDiv && y <= modelSplit * 2) {
      centerX = modelDiv / 2;
      centerY = modelSplit + modelSplit / 2;
    }
    //box 2,2
    else if (x <= modelDiv * 2 && y <= modelSplit * 2) {
      centerX = modelDiv + modelDiv / 2;
      centerY = modelSplit + modelSplit / 2;
    }
    //box 3,2
    else if (x <= modelDiv * 3 && y <= modelSplit * 2) {
      centerX = 2 * modelDiv + modelDiv / 2;
      centerY = modelSplit + modelSplit / 2;
    }

    //temp and precip use rectangular coords
    if (this.state.state === 0 || this.state.state === 1) {
      lonSave = ((x - centerX) * 360) / modelDiv;
      latSave = ((centerY - y) * 180) / modelSplit;
    }

    //sea ice uses polar coords (this is quite accurate, but could be incorrect on strange display sizes)
    else if (this.state.state === 2) {
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
    this.setState(
      {
        latitude: Math.floor(latSave),
        longitude: Math.floor(lonSave),
        useArray: 0,
      },
      function () {
        //get new data values and play sound
        const { dbX, dbY } = this.getDBCoords();
        const coord_index = this.getDBIndex(dbX, dbY);

        if (this.state.yearData.length >= coord_index) {
          const val0 = this.getValByCoord(this.state.yearData, coord_index);
          //console.log('calling playnotebyval');
          //console.log('play state: '+this.state.play);

          this.playNoteByVal(
            this.state.state,
            val0
          );
          const co2_val = this._getCo2Val(this.state.index);
          if (co2_val != null) {
            this.playNoteByVal(
              3,
              co2_val
            );
          }
        }
      },
    );
  };

  /*** Writes data to the graph ***/
  updateGraph() {
    if (this.state.index > 0 && this.state.index <= 180) {
      const ctx = this.graphRef.current.getContext("2d");

      const { step, avg, co2_median, co2_range, co2_avg } = this.getGraphDims();

      let prev_val = 0;
      let coord_val = 0;

      //draw co2 line
      ctx.beginPath();
      for (let co2Ind = 1; co2Ind <= this.state.index; co2Ind++) {
        prev_val = this.state.co2data[co2Ind - 1].co2_val;
        coord_val = this.state.co2data[co2Ind].co2_val;

        ctx.moveTo(
          1 + step * (co2Ind - 1),
          co2_avg - (co2_avg * (prev_val - co2_median)) / co2_range,
        );
        ctx.lineTo(
          1 + step * co2Ind,
          co2_avg - (co2_avg * (coord_val - co2_median)) / co2_range,
        );
        ctx.strokeStyle = YELLOW;
        ctx.lineWidth = 3;
      }
      ctx.stroke();

      //draw precip lines
      if (this.state.state === 0) {
        const { precip_median, precip_range } = this.getPrecipGraphVars(
          this.state.coordData,
        );

        ctx.beginPath();
        for (let precipInd = 0; precipInd <= this.state.index; precipInd++) {
          prev_val = this.getValByIndex(this.state.coordData, precipInd - 1);
          coord_val = this.getValByIndex(this.state.coordData, precipInd);

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

        ctx.beginPath();
        for (let precipInd = 0; precipInd <= this.state.index; precipInd++) {
          prev_val = this.getValByIndex(this.state.coordData1, precipInd - 1);
          coord_val = this.getValByIndex(this.state.coordData1, precipInd);

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

        ctx.beginPath();
        for (let precipInd = 0; precipInd <= this.state.index; precipInd++) {
          prev_val = this.getValByIndex(this.state.coordData2, precipInd - 1);
          coord_val = this.getValByIndex(this.state.coordData2, precipInd);

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
      }

      //draw temp lines
      if (this.state.state === 1) {
        const { temp_median, temp_range, temp_avg } = this.getTempGraphVars(
          this.state.coordData,
          avg,
        );

        ctx.beginPath();
        for (let tempInd = 0; tempInd <= this.state.index; tempInd++) {
          prev_val = this.getValByIndex(this.state.coordData, tempInd - 1);
          coord_val = this.getValByIndex(this.state.coordData, tempInd);

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

        ctx.beginPath();
        for (let tempInd = 0; tempInd <= this.state.index; tempInd++) {
          prev_val = this.getValByIndex(this.state.coordData1, tempInd - 1);
          coord_val = this.getValByIndex(this.state.coordData1, tempInd);

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

        ctx.beginPath();
        for (let tempInd = 0; tempInd <= this.state.index; tempInd++) {
          prev_val = this.getValByIndex(this.state.coordData2, tempInd - 1);
          coord_val = this.getValByIndex(this.state.coordData2, tempInd);

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
      }

      //draw sea ice lines
      if (this.state.state === 2) {
        const ice_max = 1;
        const ice_avg = Math.floor(avg * 0.5);

        ctx.beginPath();
        for (let iceInd = 0; iceInd <= this.state.index; iceInd++) {
          prev_val = this.getValByIndex(this.state.coordData, iceInd - 1);
          coord_val = this.getValByIndex(this.state.coordData, iceInd);

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
          prev_val = this.getValByIndex(this.state.coordData1, iceInd - 1);
          coord_val = this.getValByIndex(this.state.coordData1, iceInd);

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

        ctx.beginPath();
        for (let iceInd = 0; iceInd <= this.state.index; iceInd++) {
          prev_val = this.getValByIndex(this.state.coordData2, iceInd - 1);
          coord_val = this.getValByIndex(this.state.coordData2, iceInd);

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
      }
    }
  }

  //request all data for a certain year
  yearApi = (request) => {
    this.yearController = abortAndRenew(this.yearController);

    Axios.get(request, { signal: this.yearController.signal })
      .then((res) => {
        const year_data = res.data.data;
        if (this.state.play === 0) {
          this.setState({ yearData: [...year_data], useArray: 3 });
        } else {
          this.setState({ yearData: [...year_data] });
        }
      })
      .catch((error) => {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError")
          return;
        console.error("yearApi failed:", error);
      });
  };

  /*** get the value of every coordinate at a specific state and year ***/
  doYearHits(state, year) {
    /* Filter and do db hit here */
    if (year >= 1920 && year <= 2100) {
      let intermediate = "";
      if (state === 0) {
        intermediate = dbUrl.concat("precipavg/year/");
      } else if (state === 1) {
        intermediate = dbUrl.concat("tempavg/year/");
      } else if (state === 2) {
        intermediate = dbUrl.concat("seaiceavg/year/");
      }
      const request = intermediate.concat(year.toString(10));
      this.yearApi(request.concat(".txt"));
    }
  }

  /*** changes the text of lat textbox from input
    TODO: Use submit button instead ***/
  onChangeLat = (event) => {
    const newval = event.target.value;
    if (isNumeric(newval)) {
      const parsedval = parseInt(newval);
      if (parsedval >= -90 && parsedval <= 90) {
        this.doCoordHits(this.state.state, parsedval, this.state.longitude);
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

  /*** changes the text of lon textbox from input ***/
  onChangeLon = (event) => {
    const newval = event.target.value;
    if (isNumeric(newval)) {
      const parsedval = parseInt(newval);
      if (parsedval >= -180 && parsedval <= 180) {
        this.doCoordHits(this.state.state, this.state.latitude, parsedval);
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

  /*** Triggered by closest city dropdown ***/
  changeToCity = (event) => {
    const city = event.target.value;
    const cityinfo = getInfo(city);
    const lat = cityinfo.latitude;
    const lon = cityinfo.longitude;

    this.doCoordHits(this.state.state, lat, lon);
    this.setState({
      latitude: lat,
      longitude: lon,
      useArray: 0,
    });
    this.setupGraph();
    this.triggerNotes();

    if (this.state.play === 1) {
      this.stopMusic(false);
    }
  };

  /*** request all years for a specific coordinate, using avg table
    TODO: Add more error handling ***/
  coordApi = (request) => {
    this.coordControllerAvg = abortAndRenew(this.coordControllerAvg);

    Axios.get(request, { signal: this.coordControllerAvg.signal })
      .then((res) => {
        const coord_data = res.data.data;
        this.setState({ coordData: [...coord_data] }, this._decWaiting);

        if (this.state.state === 0) this.setPrecipNotes(coord_data);
        else if (this.state.state === 1) this.setTempNotes(coord_data);
        else this.setIceNotes(coord_data);
      })
      .catch((error) => {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError")
          return;
        console.error("coordApi failed:", error);
      });
  };

  /*** request all years for a specific coordinate, using 001 table ***/
  coordApi1 = (request) => {
    this.coordController1Avg = abortAndRenew(this.coordController1Avg);

    Axios.get(request, { signal: this.coordController1Avg.signal })
      .then((res) => {
        const coord_data = res.data.data;
        this.setState({ coordData1: [...coord_data] }, this._decWaiting);

        if (this.state.state === 0) this.setPrecipNotes1(coord_data);
        else if (this.state.state === 1) this.setTempNotes1(coord_data);
        else this.setIceNotes1(coord_data);
      })
      .catch((error) => {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError")
          return;
        console.error("coordApi1 failed:", error);
      });
  };

  /*** request all years for a specific coordinate, using 002 table ***/
  coordApi2 = (request) => {
    this.coordController2Avg = abortAndRenew(this.coordController2Avg);

    Axios.get(request, { signal: this.coordController2Avg.signal })
      .then((res) => {
        const coord_data = res.data.data;
        this.setState({ coordData2: [...coord_data] }, this._decWaiting);

        if (this.state.state === 0) this.setPrecipNotes2(coord_data);
        else if (this.state.state === 1) this.setTempNotes2(coord_data);
        else this.setIceNotes2(coord_data);
      })
      .catch((error) => {
        if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError")
          return;
        console.error("coordApi2 failed:", error);
      });
  };

  /*** Get the value of every year of a coords lifespan ***/
  doCoordHits(state, lat, lon) {
    const closestcity = getClosestCity(lat, lon);
    const { dbX, dbY } = this.getDBCoords();
    this.setState({
      latitude: Math.floor(lat),
      longitude: Math.floor(lon),
      closestCity: closestcity,
    });

    /* Filter and do db hit here */
    if (dbX <= 360 && dbX >= 1 && dbY <= 180 && dbY >= 1) {
      let intermediate, intermediate1, intermediate2;
      if (state === 0) {
        intermediate = dbUrl.concat("precipavg/coord/");
        intermediate1 = dbUrl.concat("precip001/coord/");
        intermediate2 = dbUrl.concat("precip002/coord/");
      } else if (state === 1) {
        intermediate = dbUrl.concat("tempavg/coord/");
        intermediate1 = dbUrl.concat("temp001/coord/");
        intermediate2 = dbUrl.concat("temp002/coord/");
      } else if (state === 2) {
        intermediate = dbUrl.concat("seaiceavg/coord/");
        intermediate1 = dbUrl.concat("seaice001/coord/");
        intermediate2 = dbUrl.concat("seaice002/coord/");
      }

      // set waiting once for the 3 in-flight requests
      this._setWaiting(3);

      const request = intermediate
        .concat(dbX.toString(10))
        .concat(",")
        .concat(dbY.toString(10))
        .concat(".txt");
      this.coordApi(request);

      const request1 = intermediate1
        .concat(dbX.toString(10))
        .concat(",")
        .concat(dbY.toString(10))
        .concat(".txt");
      this.coordApi1(request1);

      const request2 = intermediate2
        .concat(dbX.toString(10))
        .concat(",")
        .concat(dbY.toString(10))
        .concat(".txt");
      this.coordApi2(request2);
    }
  }

  /*** Start transport when mousedown on model keys ***/
  setupTransport = async (e) => {
    //	transport().start('+0');
    //	this.testMusic(e);
    // comment out above and do below on 4-25-2025 after web errors
    try {
      await Tone.start();
      this.setState({ audioAvailable: true });
      console.log("AudioContext started");
      transport().start("+0");
      this.testMusic(e);
    } catch (error) {
      console.error("Error starting AudioContext:", error);
    }
  };

  /*** Determines what value is being pressed on model key and play note
    could be refined but unnecessary ***/
  testMusic = (e) => {
    if (
      this.state.notePlaying === 0 &&
      e.buttons === 1 &&
      this.state.play === 0
    ) {
      let keyLeft = Math.floor(this.state.pageRight / 2);
      let keyRight = Math.floor((this.state.pageRight * 3) / 4);

      //portrait view switch
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
      let playVal;
      if (this.state.state === 0) {
        playVal = (percX - 0.175) * 500 + 100;
      } else if (this.state.state === 1) {
        playVal = (percX - 0.14) * 23;
      } else if (this.state.state === 2) {
        playVal = percX;
      }
      this.playNoteByValKey(
        this.state.state,
        playVal
      );
    }
  };

  /*** Sets notes for avg data ***/
  noteHelper = (ind) => {
    let notes = [];
    if (this.state.state === 0) {
      notes = this.getPrecipNotes(ind);
    } else if (this.state.state === 1) {
      notes = this.getTempNotes(ind);
    } else {
      notes = this.getIceNotes(ind);
    }
    return notes;
  };

  /*** Sets notes for 001 data ***/
  noteHelper1 = (ind) => {
    let notes = [];
    if (this.state.state === 0) {
      notes = this.getPrecipNotes1(ind);
    } else if (this.state.state === 1) {
      notes = this.getTempNotes1(ind);
    } else {
      notes = this.getIceNotes1(ind);
    }
    return notes;
  };

  /*** Sets notes for 002 data ***/
  noteHelper2 = (ind) => {
    let notes = [];
    if (this.state.state === 0) {
      notes = this.getPrecipNotes2(ind);
    } else if (this.state.state === 1) {
      notes = this.getTempNotes2(ind);
    } else {
      notes = this.getIceNotes2(ind);
    }
    return notes;
  };

  /*** Start music ***/
  playMusic = () => {
    if (this.state.waiting > 0) {
      //console.log('waiting');
      return;
    } else {
      //console.log('play')
    }
    let newind = this.state.index;
    if (newind === 180) {
      newind = 0;
    }
    const synth = this.getSynth(this.state.state);
    const synth1 = this.getSynth(this.state.state);
    synth1.volume.value = -12;
    const synth2 = this.getSynth(this.state.state);
    synth2.volume.value = -12;
    const piano = this.getSynth(3);
    this.setState({
      play: 1,
      playButton: pauseUrl,
      useArray: 3,
      index: newind,
    });
    const notes = this.noteHelper(newind);
    const notes1 = this.noteHelper1(newind);
    const notes2 = this.noteHelper2(newind);
    const pianoNotes = this.getPianoNotes();

    const notePattern = new Tone.Pattern((time, note) => {
      synth.triggerAttackRelease(note, "16n", time);
      // bind incrementing
      Tone.Draw.schedule(() => {
        this.incrementIndex();
      }, time);
    }, notes);
    notePattern.humanize = true;

    /*** backing note patterns ***/
    const notePattern1 = new Tone.Pattern((time, note) => {
      synth1.triggerAttackRelease(note, "16n", time);
    }, notes1);
    notePattern1.humanize = true;

    const notePattern2 = new Tone.Pattern((time, note) => {
      synth2.triggerAttackRelease(note, "16n", time);
    }, notes2);
    notePattern2.humanize = true;

    const pianoPattern = new Tone.Pattern((time, note) => {
      piano.triggerAttackRelease(note, "16n", time);
    }, pianoNotes);
    pianoPattern.humanize = true;

    // catches most errors
    if (this.state.audioAvailable) {
      notePattern.start(0);
      notePattern1.start(0);
      notePattern2.start(0);
      pianoPattern.start(0);
      transport().start("+0");
    } else {
      Tone.start()
        .then(() => {
          this.setState({ audioAvailable: true }, function () {
            notePattern.start(0);
            notePattern1.start(0);
            notePattern2.start(0);
            pianoPattern.start(0);
            transport().start("+0");
          });
        })
        .catch((error) => console.error(error));
    }
  };

  /*** runs when year slider changes ***/
  updateYearVals = () => {
    if (this.state.play === 0) {
      this.doYearHits(this.state.state, this.state.index + 1920);
    }
  };

  /*** runs on initial render ***/
  componentDidMount = () => {
    this.co2Api();

    this.setState({
      pageBottomMax: window.innerHeight,
      pageRightMax: window.innerWidth,
    });

    /* preload artifacts and simulation images */
    aloneArtifactImgs.forEach((picture) => {
      prefetchImage(picture).catch(() => {});
    });
    precipImgs.forEach((picture) => {
      prefetchImage(picture).catch(() => {});
    });

    /* setup event listeners for dynamic page resizing
    	don't resize mobile so that mobile users can effectively zoom */
    if (isBrowser) {
      window.addEventListener("resize", this.updateDimensions);
    }
    window.addEventListener("orientationchange", this.rotateDimensions);

    /* fetch data and setup window size */
    this.doCoordHits(0, 0, 0);
    this.doYearHits(0, this.state.index + 1920);
    this.updateDimensions();
    this.setAllegro();
  };

  /*** triggers sound for new lat, lon, or city picked
   *** does not include model location selection ***/
  triggerNotes = () => {
    let coord_val;
    const { dbX, dbY } = this.getDBCoords();
    const coord_index = this.getDBIndex(dbX, dbY);
    if (this.state.yearData.length >= coord_index) {
      coord_val = this.getValByCoord(this.state.yearData, coord_index);
    }
    const co2_val = this._getCo2Val(this.state.index);
    this.triggerNoteByVal(this.state.state, coord_val);
    if (co2_val != null) {
      this.triggerNoteByVal(3, co2_val);
    }
    this.setupGraph();
  };

  /*** runs on page destruction ***/
  componentWillUnmount = () => {
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

    // Abort any inflight Axios
    this.yearController?.abort();
    this.coordControllerAvg?.abort();
    this.coordController1Avg?.abort();
    this.coordController2Avg?.abort();

    PubSub.unsubscribe(this.state.token);
    if (isBrowser) {
      window.removeEventListener("resize", this.updateDimensions);
    }
    window.removeEventListener("orientationchange", this.rotateDimensions);
  };

  componentDidUpdate(prevProps, prevState) {
    // If the canvas ref isn't ready, bail safely.
    if (!this.graphRef?.current) return;

    // Any change that should redraw the graph.
    const shouldRedraw =
      prevState.index !== this.state.index ||
      prevState.state !== this.state.state ||
      prevState.useArray !== this.state.useArray ||
      prevState.pageBottom !== this.state.pageBottom ||
      prevState.pageRight !== this.state.pageRight ||
      prevState.GRAPHVERTDIV !== this.state.GRAPHVERTDIV ||
      prevState.MAPDIV !== this.state.MAPDIV ||
      prevState.coordData !== this.state.coordData ||
      prevState.coordData1 !== this.state.coordData1 ||
      prevState.coordData2 !== this.state.coordData2 ||
      prevState.yearData !== this.state.yearData ||
      prevState.co2data !== this.state.co2data;

    if (!shouldRedraw) return;

    // Clear/border then draw the lines.
    // setupGraph() already uses the current canvas size derived from state.
    this.setupGraph();
    this.updateGraph();
  }

  /*** Picks where to put crosshairs ***/
  getLocations = () => {
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

    //polar coords, they work but are not great at all
    if (this.state.state === 2) {
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
    }

    centerX = modelLeft + modelDiv / 2;
    centerY = modelTop + modelSplit / 2;
    const location1: React.CSSProperties = {
      position: "absolute",
      display: "block",
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
      display: "block",
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
    centerY = modelTop + modelSplit / 2;
    const location3:React.CSSProperties = {
      position: "absolute",
      display: "block",
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
      display: "block",
      left: centerX + xAdj,
      top: centerY + yAdj,
      color: "red",
      fontSize: fsize,
      border: "1px solid red",
      backgroundColor: "white",
      lineHeight: 1,
    };

    centerX = modelLeft + modelDiv + modelDiv / 2;
    centerY = modelTop + modelSplit + modelSplit / 2;
    const location5:React.CSSProperties = {
      position: "absolute",
      display: "block",
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
      display: "block",
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

    if (this.state.state === 2 && this.state.latitude < 62) {
      location1.display = "none";
      location2.display = "none";
      location3.display = "none";
      location4.display = "none";
      location5.display = "none";
      location6.display = "none";
    }

    return { location1, location2, location3, location4, location5, location6 };
  };

  /*** Go to about page ***/
  openAbout = () => {
    const { navigation } = this.props;
    if (this.state.play === 1) {
      this.stopMusic(true);
    }
    navigation.navigate("About");
  };

  /*** runs on state update ***/
  render() {
    const { location1, location2, location3, location4, location5, location6 } =
      this.getLocations();

    const playButton = this.getPlayButton();

    const { dbX, dbY } = this.getDBCoords();

    const co2Raw = this._getCo2Val(this.state.index);
    const co2val = co2Raw == null ? "--" : Math.round(co2Raw);

    /*** setup model URL ***/
    const urlAdd = urlPre.concat(this.state.modelStr);
    const ind = this.state.index.toString();
    const suffix = ind.concat(".jpg");
    const fullUrl = urlAdd.concat(suffix);

    /*** Get db value ***/
    let coord_val = 0;
    /* if useArray == 3, use the dataset that contains all years of a coord */
    if (this.state.useArray === 3) {
      coord_val = this.getValByIndex(this.state.coordData, this.state.index);
    } else {
      /* use the dataset that contains all coords at a specific year */
      const coord_index = this.getDBIndex(dbX, dbY);
      if (this.state.yearData.length > coord_index) {
        coord_val = this.getValByCoord(this.state.yearData, coord_index);
      }
    }

    /* how to label model data */
    let data_pre = "Precipitation: ";
    let data_post = " % of Annual Avg";
    if (this.state.state === 1) {
      data_pre = "Temperature: +";
      if (coord_val < 0) {
        data_pre = "Temperature: ";
      }
      data_post = " Celsius (vs 1920-1950)";
    } else if (this.state.state === 2) {
      data_pre = "Sea Ice Fraction: ";
      data_post = " %";
      coord_val *= 100;
    }

    coord_val = Math.round(coord_val * 100) / 100;

    /* contains almost all the styling for the page */
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
    } = this.getCommonStyles();

    let newh = (controlHeight * 9) / 40;
    if (this.state.CONTROLVERTDIV !== 1) {
      newh /= 1 - this.state.CONTROLVERTDIV;
    }

    const largeControlBlockStyle: React.CSSProperties = {
      height: Math.floor(newh),
      width: Math.floor(controlWidth * this.state.CONTROLSPLIT),
      overflow: "hidden",
      float: "left",
    } satisfies React.CSSProperties;

    const h = dataBlockStyle.height ?? 0;
    const heightNum = typeof h === "number" ? h : parseFloat(h) || 0;   
    const smallDataStyle: React.CSSProperties = {
      height: Math.floor((heightNum * 9) / 10),
      width: dataBlockStyle.width,
      overflow: dataBlockStyle.overflow,
      float: dataBlockStyle.float,
      textAlign: dataBlockStyle.textAlign,
    } satisfies React.CSSProperties;

    /*** Return the page ***/
    return (
      <div style={pageDiv}>
        <div style={containerStyle}>
          <div style={controlDivStyle}>
            <div style={controlContainerStyle}>
              <div style={largeControlBlockStyle}>
                <p style={instructionTextStyle}>Instructions</p>
                <p style={paragraphTextStyle}>
                  1. Select a variable below
                  <br />
                  2. Touch the map to select a location
                  <br />
                  3. Touch the timeline to select a starting year.
                  <br />
                  4. Select a tempo
                  <br />
                  5. Press the play button.
                </p>
              </div>

              <div style={dataBlockStyle}>
                <button
                  style={thirdControlStyle}
                  onClick={() => this.setPrecip()}
                >
                  <img
                    style={thirdControlStyle}
                    alt="select precipitation"
                    src={this.state.precipSrc}
                  />
                </button>

                <button
                  style={thirdControlStyle}
                  onClick={() => this.setTemp()}
                >
                  <img
                    style={thirdControlStyle}
                    alt="select temperature"
                    src={this.state.tempSrc}
                  />
                </button>

                <button style={thirdControlStyle} onClick={() => this.setIce()}>
                  <img
                    style={thirdControlStyle}
                    alt="select sea ice"
                    src={this.state.iceSrc}
                  />
                </button>
              </div>

              <div style={controlBlockStyle}>
                <button
                  style={playSplitDivStyle}
                  onClick={
                    this.state.play
                      ? () => this.stopMusic(false)
                      : () => this.playMusic()
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
              </form>
            </div>

            <div style={controlContainerStyle}>
              <form>
                <div style={smallDataStyle}>
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

              <div style={smallDataStyle}>
                <div style={quarterControlStyle} />
                <button
                  style={quarterControlStyle}
                  onClick={() => this.openAbout()}
                >
                  <span style={aboutButton}>FAQ</span>
                </button>
                <div style={quarterControlStyle} />
              </div>

              <div style={keyContainer}>
                <img style={keyContainer} alt="graph key" src={graphKey} />
              </div>
              <button style={dataBlockStyle} onClick={() => this.callHome()}>
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
              alt=""
              src={topSkinnyImgAlone}
              draggable="false"
            />
            <img
              style={skinnyImgStyle}
              alt=""
              src={bottomSkinnyImgAlone}
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
                  {data_pre}
                  {coord_val}
                  {data_post}
                </p>
              </div>

              <div
                style={dataThirdStyle}
                onPointerDown={this.setupTransport}
                onPointerMove={this.testMusic}
                onPointerUp={this.killTransport}
              >
                <img
                  style={imageKeyStyle}
                  alt="map key"
                  src={this.state.keySrc}
                  draggable="false"
                />
              </div>
            </div>

            <div style={graphStyle}>
              <canvas
                ref={this.graphRef}
                height={this.state.pageBottom * this.state.GRAPHVERTDIV}
                width={modelWidth}
              />
            </div>

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
export default function EachAloneWrapper(props) {
  const { navigation, route } = useNavigationShim();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#efefef" }}>
      <EachAlone {...props} navigation={navigation} route={route} />
    </div>
  );
}
