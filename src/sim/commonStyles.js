// src/sim/commonStyles.js
export const computeCommonStyles = (args) => {
  var modelWidth = Math.floor(args.pageRight * args.MAPDIV);
  var modelHeight = Math.floor(args.pageBottom * args.MAPVERTDIV);

  var controlWidth = args.pageRight * args.CONTROLDIV;
  var controlHeight = args.pageBottom * args.CONTROLVERTDIV;

  var skinnyWidth = Math.floor(args.pageRight * args.SKINNYDIV);

  var smallFontSize = Math.floor(
    args.pageRight / 200 + args.pageBottom / 120,
  );
  var microFontSize = smallFontSize - 2;
  var largeFontSize = Math.floor(
    args.pageRight / 160 + args.pageBottom / 80,
  );

  var buttonPadding = Math.floor(
    args.pageRight / 300 + args.pageBottom / 500,
  );

  const pageDiv = {
    height: args.pageBottom,
    width: args.pageRight,
    padding: args.PADDING / 2,
  };

  /*** style for model images and div ***/
  const modelStyle = {
    width: modelWidth,
    height: modelHeight,
  };

  const containerStyle = {
    height: args.pageBottom,
    width: args.pageRight,
    overflow: "hidden",
  };

  const controlContainerStyle = {
    height: Math.floor(controlHeight / 2),
    width: Math.floor(
      args.pageRight * args.CONTROLDIV * args.CONTROLSPLIT,
    ),
    float: "left",
  };

  const graphStyle = {
    height: args.pageBottom * args.GRAPHVERTDIV,
    width: modelWidth,
  };

  const sliderDivStyle = {
    height: Math.floor(args.pageBottom * args.SLIDERVERTDIV),
    width: modelWidth,
  };

  const sliderStyle = {
    height:
      Math.floor((args.pageBottom * args.SLIDERVERTDIV) / 2) -
      args.PADDING,
    width: "99%",
  };

  const timelineStyle = {
    height:
      Math.floor((args.pageBottom * args.SLIDERVERTDIV) / 2) -
      args.PADDING * 2,
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
    width: Math.floor((controlWidth * args.CONTROLSPLIT) / 3),
    overflow: "hidden",
    float: "left",
    border: "none",
  };

  var controlBlockStyle = {
    height: Math.floor(controlHeight / 10),
    width: controlWidth * args.CONTROLSPLIT,
    overflow: "hidden",
    float: "left",
  };

  const dataThirdStyle = {
    width: Math.floor(modelWidth / 3),
    height: Math.floor(args.pageBottom * args.DATAVERTDIV),
    overflow: "hidden",
    float: "left",
  };

  const imageKeyStyle = {
    width: Math.floor(modelWidth / 3),
    height: Math.floor(args.pageBottom * args.DATAVERTDIV),
    overflow: "hidden",
    float: "left",
    objectFit: "fill",
  };

  var dataBlockStyle = {
    height: (3 * controlHeight) / 40,
    width: Math.floor(controlWidth * args.CONTROLSPLIT),
    overflow: "hidden",
    float: "left",
    textAlign: "center",
    border: "none",
  };

  var keyContainer = {
    width: Math.floor(
      args.pageRight * args.CONTROLDIV * args.CONTROLSPLIT,
    ),
    height: Math.floor(
      (args.pageBottom * args.CONTROLVERTDIV * 3) / 20,
    ),
    float: "left",
    overflow: "hidden",
  };

  var thirdControlStyle = {
    height: Math.floor(controlHeight / 20),
    width: Math.floor((controlWidth * args.CONTROLSPLIT) / 3),
    float: "left",
    border: "none",
  };

  var dropdownControlStyle = {
    height: Math.floor(controlHeight / 20) - 1,
    width: Math.floor((controlWidth * args.CONTROLSPLIT * 2) / 3),
    float: "left",
    fontFamily: "Verdana, sans-serif",
    fontSize: smallFontSize,
  };

  var inputControlStyle = {
    height: Math.floor(controlHeight / 20),
    width: Math.floor((controlWidth * args.CONTROLSPLIT) / 5),
    float: "left",
    fontFamily: "Verdana, sans-serif",
    fontSize: smallFontSize,
  };

  var labelControlStyle = {
    height: Math.floor(controlHeight / 20),
    width: Math.floor((controlWidth * args.CONTROLSPLIT) / 6) - 1,
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

  if (args.timerLen === 1200) {
    moderato = inactive;
    allegro = inactive;
    presto = inactive;
  } else if (args.timerLen === 800) {
    moderato = active;
    allegro = inactive;
    presto = inactive;
  } else if (args.timerLen === 400) {
    moderato = inactive;
    allegro = active;
    presto = inactive;
  } else if (args.timerLen === 200) {
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
    width: Math.floor((controlWidth * args.CONTROLSPLIT) / 3) - 20,
  };
  var allegroHighlight = {
    backgroundColor: allegro,
    fontSize: microFontSize,
    fontFamily: "Verdana, sans-serif",
    padding: buttonPadding,
    borderRadius: buttonPadding,
    display: "inline-block",
    width: Math.floor((controlWidth * args.CONTROLSPLIT) / 3) - 20,
  };
  var prestoHighlight = {
    backgroundColor: presto,
    fontSize: microFontSize,
    fontFamily: "Verdana, sans-serif",
    padding: buttonPadding,
    borderRadius: buttonPadding,
    display: "inline-block",
    width: Math.floor((controlWidth * args.CONTROLSPLIT) / 3) - 20,
  };

  var aboutButton = {
    backgroundColor: inactive,
    fontSize: microFontSize,
    fontFamily: "Verdana, sans-serif",
    padding: buttonPadding,
    borderRadius: buttonPadding,
    display: "inline-block",
    width: Math.floor((controlWidth * args.CONTROLSPLIT) / 3) - 20,
  };

  if (args.CONTROLVERTDIV !== 1) {
    playSplitDivStyle = {
      height: Math.floor(
        controlHeight / (10 * (1 - args.CONTROLVERTDIV)),
      ),
      width: Math.floor((controlWidth * args.CONTROLSPLIT) / 3),
      overflow: "hidden",
      float: "left",
    };

    controlBlockStyle = {
      height: Math.floor(
        controlHeight / (10 * (1 - args.CONTROLVERTDIV)),
      ),
      width: controlWidth * args.CONTROLSPLIT,
      overflow: "hidden",
      float: "left",
    };

    dataBlockStyle = {
      height: (3 * controlHeight) / (40 * (1 - args.CONTROLVERTDIV)),
      width: Math.floor(controlWidth * args.CONTROLSPLIT),
      overflow: "hidden",
      float: "left",
      textAlign: "center",
      border: "none",
    };
    keyContainer = {
      width: Math.floor(
        args.pageRight * args.CONTROLDIV * args.CONTROLSPLIT,
      ),
      height: Math.floor(
        (args.pageBottom * args.CONTROLVERTDIV * 1) /
          (2 * 1 - args.CONTROLVERTDIV),
      ),
      float: "left",
      overflow: "hidden",
    };
    thirdControlStyle = {
      height: Math.floor((3 * controlHeight) / 40),
      width: Math.floor((controlWidth * args.CONTROLSPLIT) / 3),
      float: "left",
    };

    dropdownControlStyle = {
      height: Math.floor((3 * controlHeight) / 40),
      width: Math.floor((controlWidth * args.CONTROLSPLIT * 2) / 3),
      float: "left",
      fontFamily: "Verdana, sans-serif",
      fontSize: smallFontSize,
    };

    inputControlStyle = {
      height: Math.floor((3 * controlHeight) / 40),
      width: Math.floor((controlWidth * args.CONTROLSPLIT) / 5),
      float: "left",
      fontFamily: "Verdana, sans-serif",
      fontSize: smallFontSize,
    };

    labelControlStyle = {
      height: Math.floor((3 * controlHeight) / 40),
      width: Math.floor((controlWidth * args.CONTROLSPLIT) / 6) - 1,
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
      width: Math.floor((controlWidth * args.CONTROLSPLIT) / 3) - 5,
    };
    allegroHighlight = {
      backgroundColor: allegro,
      fontSize: microFontSize,
      fontFamily: "Verdana, sans-serif",
      padding: "1px",
      borderRadius: "1px",
      display: "inline-block",
      width: Math.floor((controlWidth * args.CONTROLSPLIT) / 3) - 5,
    };
    prestoHighlight = {
      backgroundColor: presto,
      fontSize: microFontSize,
      fontFamily: "Verdana, sans-serif",
      padding: "1px",
      borderRadius: "1px",
      display: "inline-block",
      width: Math.floor((controlWidth * args.CONTROLSPLIT) / 3) - 5,
    };
    aboutButton = {
      backgroundColor: inactive,
      fontSize: microFontSize,
      fontFamily: "Verdana, sans-serif",
      padding: "1px",
      borderRadius: "1px",
      display: "inline-block",
      width: Math.floor((controlWidth * args.CONTROLSPLIT) / 3) - 20,
    };
  }

  const graphBufferStyle = {
    width: Math.floor(modelWidth),
    height: Math.floor(args.pageBottom * args.DATAVERTDIV),
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
    width: Math.floor((controlWidth * args.CONTROLSPLIT) / 3),
    float: "left",
    textAlign: "center",
    border: "none",
  };

  const halfControlStyle = {
    height: Math.floor(controlHeight / 20),
    width: Math.floor((controlWidth * args.CONTROLSPLIT) / 2),
    float: "left",
    textAlign: "center",
  };

  const bigLabelControlStyle = {
    height: Math.floor(controlHeight / 20),
    width: Math.floor((controlWidth * args.CONTROLSPLIT) / 3) - 1,
    float: "left",
    fontFamily: "Verdana, sans-serif",
    fontSize: smallFontSize,
    textAlign: "right",
    paddingTop: 5,
  };

  const skinnyDivStyle = {
    height: args.pageBottom * args.MAPVERTDIV,
    width: skinnyWidth,
    overflow: "hidden",
    float: "left",
  };

  const largeDivStyle = {
    height: args.pageBottom,
    width: modelWidth,
    overflow: "hidden",
    float: "left",
  };

  const skinnyImgStyle = {
    height: (args.pageBottom * args.MAPVERTDIV) / 2,
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
};
