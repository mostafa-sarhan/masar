// Set when the process starts shutting down; /health reports 503 from then on.
let shuttingDown = false;
export const setShuttingDown = () => {
  shuttingDown = true;
};
export const isShuttingDown = () => shuttingDown;
