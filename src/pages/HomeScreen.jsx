import React, { useCallback, useEffect, useState } from "react";
import { useNavigationShim } from "../routing/useNavigationShim.js";
import { isBrowser, isMobile } from "react-device-detect";
import { eachAloneButton, allTogetherButton, qrImg } from "../const/url.js";
import "./HomeScreen.css";

function redirect() {
  if (isMobile) {
    window.location.href =
      "https://news.ucar.edu/123108/40-earths-ncars-large-ensemble-reveals-staggering-climate-variability";
  }
}

function HomeScreen({ navigation }) {
  // Mirrors the bits of Page state HomeScreen relied on
  const [pageBottom, setPageBottom] = useState(window.innerHeight);
  const [pageRight, setPageRight] = useState(window.innerWidth);
  const [pageBottomMax, setPageBottomMax] = useState(window.innerHeight);
  const [pageRightMax, setPageRightMax] = useState(window.innerWidth);

  const updateDimensions = useCallback(() => {
    const newheight = window.innerHeight;
    const newwidth = window.innerWidth;
    setPageBottom(newheight - 1);
    setPageRight(newwidth - 1);
  }, []);

  const rotateDimensions = useCallback(async () => {
    // matches your timer(1000) behavior without depending on Page.jsx
    await new Promise((res) => setTimeout(res, 1000));
    window.scrollTo(0, 0);

    // NOTE: window.resizeTo may be ignored by most browsers; kept for parity
    try {
      window.resizeTo(pageBottom, pageRight);
    } catch (_) {}

    window.focus();
    setPageBottom(window.innerHeight);
    setPageRight(window.innerWidth);
  }, [pageBottom, pageRight]);

  useEffect(() => {
    // componentDidMount equivalent
    if (isBrowser) {
      window.addEventListener("resize", updateDimensions);
    }
    window.addEventListener("orientationchange", rotateDimensions);

    setPageBottomMax(window.innerHeight);
    setPageRightMax(window.innerWidth);
    updateDimensions();

    // componentWillUnmount equivalent
    return () => {
      if (isBrowser) {
        window.removeEventListener("resize", updateDimensions);
      }
      window.removeEventListener("orientationchange", rotateDimensions);
    };
  }, [updateDimensions, rotateDimensions]);

  // (pageBottom/pageRight/pageBottomMax/pageRightMax currently unused in render;
  // keep them if you expect to use them later)

  return (
    <div className={"hp-container"}>
      <h1 className={"hp-title-container"}>Sounding Climate</h1>

      <p className={"hp-desc-container"}>
        {" "}
        What do changes in temperature, precipitation, and sea ice sound like...{" "}
      </p>

      <div className={"hp-btn-container"}>
        <button
          onClick={() => navigation.navigate("EachAlone")}
          className={"hpBtn"}
        >
          <img className={"hp-btn"} alt="each on its own" src={eachAloneButton} />
        </button>

        <button
          onClick={() => navigation.navigate("AllTogether")}
          className={"hpBtn"}
        >
          <img className={"hp-btn"} alt="all together" src={allTogetherButton} />
        </button>
      </div>

      <div className={"hp-qr-container"}>
        <a href="https://bit.ly/sounding-climate-article">
          <img
            className={"hp-qr"}
            alt="link to article"
            src={qrImg}
            onPointerDown={redirect}
          />
        </a>
      </div>
    </div>
  );
}

export default function HomeScreenWrapper(props) {
  const { navigation } = useNavigationShim();

  return (
    <div className="homeBg">
      <HomeScreen {...props} navigation={navigation} />
    </div>
  );
}
