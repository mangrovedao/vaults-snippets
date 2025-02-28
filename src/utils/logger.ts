import pino from "pino";

// export const logger = pino({
//   transport: {
//     target: "pino-pretty",
//   },
// });
export const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug,
  trace: console.trace,
};
