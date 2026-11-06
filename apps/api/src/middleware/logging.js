import morgan from "morgan";

export const requestLogger = morgan("tiny", {
  stream: {
    write(line) {
      process.stdout.write(line);
    }
  }
});
