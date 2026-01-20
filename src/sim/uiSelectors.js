// src/sim/uiSelectors.js
export const getPlayButtonSrc = ({ waiting, playButton, loadingSrc }) => {
  if (waiting !== 0) return loadingSrc;
  return playButton;
};


/* orig */
/*** check if waiting ***/
  /*
  getPlayButton = () => {
    if (this.state.waiting > 0) {
      return loading;
    } else {
      return this.state.playButton;
    }
  };
  */