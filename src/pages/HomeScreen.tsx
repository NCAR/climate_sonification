import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { useNavigationShim, Navigation } from "../routing/useNavigationShim";
import { isBrowser, isMobile } from "react-device-detect";
import { eachAloneButton, allTogetherButton, qrImg } from "../const/url";
import "./HomeScreen.css";

function redirect(): void
{
  if (isMobile)
  {
    window.location.href =
      "https://news.ucar.edu/123108/40-earths-ncars-large-ensemble-reveals-staggering-climate-variability";
  }
}

type HomeScreenProps = {
  navigation: Navigation;
};


function HomeScreen({ navigation }: HomeScreenProps): React.JSX.Element
{
  // Mirrors the bits of Page state HomeScreen relied on
  const [pageBottom, setPageBottom] = useState<number>(window.innerHeight);
  const [pageRight, setPageRight] = useState<number>(window.innerWidth);

  const getWindowHeight = (): number =>
    typeof window === "undefined" ? 0 : window.innerHeight;

  const getWindowWidth = (): number =>
    typeof window === "undefined" ? 0 : window.innerWidth;
  const updateDimensions = useCallback((): void =>
  {
    const newHeight = getWindowHeight();
    const newWidth = getWindowWidth();
    setPageBottom(newHeight - 1);
    setPageRight(newWidth - 1);
  }, []);


  const rotateDimensions = useCallback((): void =>
  {
    void (async (): Promise<void> =>
    {
      await new Promise<void>((res) => setTimeout(res, 1000));
      window.scrollTo(0, 0);

      // NOTE: resizeTo is ignored by many browsers; kept for parity with your old behavior
      try
      {
        window.resizeTo(pageBottom, pageRight);
      } catch
      {
        // ignore
      }

      window.focus();
      setPageBottom(getWindowHeight());
      setPageRight(getWindowWidth());
    })();
  }, [pageBottom, pageRight]);

  useEffect(() =>
  {
    if (!isBrowser) return;

    window.addEventListener("resize", updateDimensions);
    window.addEventListener("orientationchange", rotateDimensions);

    return ():void =>
    {
      window.removeEventListener("resize", updateDimensions);
      window.removeEventListener("orientationchange", rotateDimensions);
    };
  }, [updateDimensions, rotateDimensions]);

  return (
    <div className={"hp-container"}>
      <h1 className={"hp-title-container"}>Sounding Climate</h1>

      <p className={"hp-desc-container"}>
        {" "}
        What do changes in temperature, precipitation, and sea ice sound
        like...{" "}
      </p>

      <div className={"hp-btn-container"}>
        <button
          onClick={() =>
          {
            navigation.navigate("EachAlone");
          }}
          className={"hpBtn"}
        >
          <img
            className={"hp-btn"}
            alt="each on its own"
            src={eachAloneButton}
          />
        </button>

        <button
          onClick={() =>
          {
            navigation.navigate("AllTogether");
          }}
          className={"hpBtn"}
        >
          <img
            className={"hp-btn"}
            alt="all together"
            src={allTogetherButton}
          />
        </button>
      </div>

      <div className={"hp-qr-container"}>
        <a href="https://bit.ly/sounding-climate-article">
          <img
            className={"hp-qr"}
            alt="link to Climate Model article"
            src={qrImg}
            onPointerDown={redirect}
          />
        </a>
      </div>
    </div>
  );
}

export default function HomeScreenWrapper(
  props: Record<string, unknown>,
): React.JSX.Element
{
  const { navigation } = useNavigationShim();

  return (
    <div className="homeBg">
      <HomeScreen {...props} navigation={navigation} />
    </div>
  );
}