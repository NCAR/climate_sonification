# Sounding Climate Web Application
This codebase is for the Sounding Climate application located at Listentoclimatechange.com.

Sounding Climate lets you explore how precipitation, temperature, and sea ice change over time through data represented in graphs, maps, and sonifications. Select a location on the map, and experience, through sight and sound, how climate varies over time.

# Getting Started

1. Clone this Repository
2. Execute `npm install --force`
3. Upload the data and image files from https://github.com/NCAR/climate_sonification_assets to a web accessible location
4. Update the assets_base_url variable in src/const/url.js to your web access assets location
5. Execute `npm start` to view app in your browser and test locally or execute `npm run build` to build the code
6. Upload the build files to a web accessible location.


# Credits and Acknowledgements

Sounding Climate began as a collaboration between climate scientist, Dr. Clara Deser (at the National Center for Atmospheric Research - NCAR) and sound designer and data artist, Marty Quinn (founder of the Design Rhythmics Sonification Research Laboratory). A version of Sounding Climate was created for the exhibits at the NCAR Mesa Lab in Boulder, Colorado, by the team at the UCAR Center for Science Education. Then, this web-based version of Sounding Climate was developed by Senior Computer Science Capstone students at the University of Colorado, Boulder.

[The sonification and visualizations in Sounding Climate](https://news.ucar.edu/123108/40-earths-ncars-large-ensemble-reveals-staggering-climate-variability) are based on data from one of the world’s most comprehensive numerical models of the Earth’s climate system, [NCAR Community Earth System Model version 1 (CESM1)](https://www.cesm.ucar.edu/projects/community-projects/LENS/). This model simulates past and future climate from 1920-2100, assuming a “business-as-usual” scenario for rising concentrations of carbon dioxide and other greenhouse gases due to the burning of fossil fuels. In addition to human influences on climate, the model also includes natural sources of climate variability in the oceans, atmosphere, land and sea ice, such as those that produce El Niño events or multi-decadal changes in the Atlantic Ocean’s overturning circulation. By repeating the model experiments many times, changing only the initial atmospheric temperature state by a miniscule amount , scientists are able to untangle human and natural influences on climate. Each experiment contains its own unique sequence of natural variability, which cannot be predicted more than a few years in advance, superimposed upon a common signal of human-caused climate change. The human influence at any given time and location is isolated by averaging all of the 40 experiments together.
