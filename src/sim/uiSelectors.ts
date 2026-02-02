type GetPlayButtonSrcArgs = {
  waiting: number;
  playButton: string;
  loadingSrc: string;
};

export const getPlayButtonSrc = ({
  waiting,
  playButton,
  loadingSrc,
}: GetPlayButtonSrcArgs): string => {
  if (waiting !== 0) return loadingSrc;
  return playButton;
};
