// src/sim/abort.ts

export const abortAndRenew = (
  controller: AbortController | null
): AbortController => {
  if (controller != null) {
    controller.abort();
  }
  return new AbortController();
};
