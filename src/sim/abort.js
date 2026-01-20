// src/sim/abort.js
export const abortAndRenew = (controller) => {
  if (controller != null) controller.abort();
  return new AbortController();
};
