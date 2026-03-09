import * as React from "react";
import { useMemo } from "react";
import { useNavigationShim } from "../routing/useNavigationShim";
import type { Navigation, Route } from "../routing/useNavigationShim";
import type { CSSProperties } from "react";
const PADDING = 40;

const TITLE_TEXT = "Frequently Asked Questions";
const RTN_BTN = "Close FAQ";

type AboutProps = {
  navigation: Navigation;
  route: Route;
};

function getNumberParam(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

type FAQItem = {
  q: string;
  a: string[];
};

const FAQ:FAQItem[] = [
  {
    q: "Sound issues or waiting for data?",
    a: [
      "If there are any issues, refresh the page and start over. This generally happens when points are selected too quickly.",
    ],
  },
  {
    q: "How do I use the lat/lon textboxes?",
    a: [
      "Highlight the entire number before entering value into lat/lon box",
      "Type the number, then add the minus sign in lat/lon box",
    ],
  },
  {
    q: "Why doesn't the crosshair go where I click?",
    a: [
      "The crosshair for the sea ice models is slightly inaccurate. see lat/lon boxes or precip/temp models instead.",
    ],
  },
];

const MORE_INFO: string[] = [
  "Sounding Climate is the result of a collaboration between climate scientist, Dr. Clara Deser from the National Center for Atmospheric Research (NCAR), and sound designer and data artist, Marty Quinn (founder of the Design Rhythmics Sonification Research Laboratory).  The sonification and visualizations in Sounding Climate are based on data from one of the world’s most comprehensive numerical models of the earth’s climate system, NCAR Community Earth System Model version 1 (CESM1). This model simulates past and future climate from 1920-2100, assuming a “business-as-usual” scenario for rising concentrations of carbon dioxide and other greenhouse gases due to the burning of fossil fuels. In addition to human influences on climate, the model also includes natural sources of climate variability in the oceans, atmosphere, land and sea ice, such as those that produce El Nino events or multi-decadal changes in the Atlantic Ocean’s overturning circulation. By repeating the model experiments many times, changing only the initial atmospheric temperature state by a miniscule amount (about 10 -14 K), scientists are able to untangle human and natural influences on climate. Each experiment contains its own unique sequence of natural variability, which cannot be predicted more than a few years in advance, superimposed upon a common signal of human-caused climate change. The human influence at any given time and location is isolated by averaging all of the 40 experiments together. A non-technical description of the model experiments is available via the QR code on the homepage. The data from these experiments have been used in the Assessment Reports of the United Nations Intergovernmental Panel on Climate Change.",
  "Sounding Climate visitors explore how precipitation, temperature, and sea ice change over time through interactive visual graphs and sound “maps” (called sonifications). Just like colors on a map, each data value is assigned particular pitch, and each variable is played by a different instrument (marimba for precipitation, woodwind instruments for temperature, and violins for sea ice). Carbon dioxide levels are played by a piano, and also control the musical scale of the pitches assigned to the data values. By selecting a location on the map, visitors experience through sight and sound how climate varies over time. Each map shows a different rendition of natural climate variability, superimposed upon a common human influence. By sliding their cursor over the color bar located beneath each world map, visitors can simultaneously see and hear how the data values are mapped to color and pitch. Visitors can also hear geographical patterns in the data by sliding their cursor directly over the maps. The temperature values are based on annual means and expressed in degrees Celsius change relative to a 1920- 1950 baseline; the precipitation values are also based on annual means and expressed as a percentage change relative to a 1920-1950 baseline; and the sea ice fraction values are for the month of September and expressed as the percentage of sea ice present in each grid cell.",
  "There are two ways to explore the data in Sounding Climate: 1) “Each on Its Own” and 2) “All Together”. If you select the first option, you will see 6 maps (one for each of the first 6 model experiments) for the variable you choose (precipitation, temperature, and sea ice). Each of these maps shows a different combination of natural and human influences on climate as explained above. The graph below the maps will show two thin curves and one thick curve. The thin curves show the data values for the first 2 model experiments, and the thick curve shows the data values for the average of all 40 model experiments (the human influence on climate, as explained above) for the location you chose. The yellow curve shows the global average carbon dioxide levels. The sonifications use the data from all 4 curves. Notice how the blend of musical notes changes as the climate is altered by human activity. If you select the second option, you will see a different set of maps: the top row shows the human influence on climate for each of the 3 variables, and the bottom row shows the combined human and natural influences from the first model experiment. Notice how the maps in the two rows may look very different at the beginning but become more similar as the human influence starts to dominate. The graphs below the maps show the data values at the location you chose. The thick curve shows the human influence and the thin curve shows the combined human and natural influence in the first model experiment, corresponding to the maps above it. Precipitation is in green, temperature in red, and sea ice in light blue; the The yellow curve shows the global average carbon dioxide levels. The sonifications use the data from all 4 curves.",
  "Contributors to the project: Adam S. Phillips (NCAR) for providing the model data, Timothy Scheitlin (NCAR) for providing the graphics, Sharon Clark for providing ongoing development support, Becca Hatheway for providing user testing and feedback, Marty Quinn for the original sonification development, and Clara Deser for scientific and artistic guidance. This website was developed by Nick Vomund, with the original API written by Garrett Hempy, sonification by Mattias Leino, and support by Priyanka Karki, Fahad Shaik, and Zhaoyi Xie.",
];

const outerStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  backgroundColor: "#efefef",
};

const contentStyle: CSSProperties = {
  maxWidth: "900px",
  margin: "0 auto",
  padding: PADDING / 2,
};

const headerStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 10,
  padding: "8px",
  paddingBottom: "2px",
  display: "grid",
  gridTemplateColumns: "1fr auto",
  alignItems: "center",
  gap: "12px",
  backgroundColor: "#efefef",
};


function About({ navigation, route }: AboutProps): React.JSX.Element {
  const p = route.params;
  const fallbackHeight = typeof window !== "undefined" ? window.innerHeight : 0;
  const fallbackWidth = typeof window !== "undefined" ? window.innerWidth : 0;

  const pageBottom = getNumberParam(p.pageBottom) ?? fallbackHeight;
  const pageRight = getNumberParam(p.pageRight) ?? fallbackWidth;

  
  const { titleTextStyle, questionTextStyle, answerTextStyle  } = useMemo((): {
    titleTextStyle: CSSProperties;
    questionTextStyle: CSSProperties;
    answerTextStyle: CSSProperties;
  } => {

    return {
      titleTextStyle: {
        fontSize: Math.floor(pageRight / 200 + pageBottom / 100) + 4,
        fontFamily: "Verdana, sans-serif",
        fontWeight: "bold",
        marginLeft: "20%",
        backgroundColor: "#DDDDDD",
        padding: Math.floor(pageRight / 200 + pageBottom / 100),
        borderRadius: Math.floor(pageRight / 200 + pageBottom / 100),
      },
      questionTextStyle: {
        fontSize: Math.floor(pageRight / 200 + pageBottom / 100),
        fontFamily: "Verdana, sans-serif",
        fontWeight: "bold",
      },
      answerTextStyle: {
        fontSize: Math.floor(pageRight / 200 + pageBottom / 100) - 2,
        fontFamily: "Verdana, sans-serif",
      },
    };
  }, [pageRight, pageBottom]);

  return (
    <div style={outerStyle}>
      <div style={headerStyle}>
        <p style={{ ...titleTextStyle, margin: "20px 0" }}>{TITLE_TEXT}</p>
        <button
          onClick={() => { navigation.goBack(); }}
          style={{
            fontSize: titleTextStyle.fontSize,
            padding: "6px 12px",
            cursor: "pointer",
          }}
        >
          {RTN_BTN}
        </button>
      </div>
      <div style={contentStyle}>
        

        {FAQ.map((item) => (
          <div key={item.q}>
            <p style={questionTextStyle}>{item.q}</p>
            <p style={answerTextStyle}>
              {item.a.map((line, i) => (
                <React.Fragment key={i}>
                  {i > 0 ? <br /> : null}
                  {line}
                </React.Fragment>
              ))}
            </p>
          </div>
        ))}

        <p style={questionTextStyle}>More info:</p>
        {MORE_INFO.map((para, i) => (
          <p key={i} style={answerTextStyle}>
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}

/*** wrapper for navigation functionality ***/
type AboutWrapperProps = Record<string, unknown>;
export default function AboutWrapper(props: AboutWrapperProps): React.JSX.Element {
  const { navigation, route } = useNavigationShim();
  return <About {...props} navigation={navigation} route={route} />;
}
