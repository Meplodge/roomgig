// Lightweight module-level bridge to pass a cropped image result back to the
// screen that initiated cropping, without putting non-serializable callbacks
// into the navigation state.

let handler = null;

export const setCropHandler = (fn) => {
  handler = fn;
};

export const consumeCropHandler = () => {
  const current = handler;
  handler = null;
  return current;
};

export const clearCropHandler = () => {
  handler = null;
};
