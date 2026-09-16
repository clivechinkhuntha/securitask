import { app, logger } from "./app.js";

const port = Number(process.env.PORT ?? 4000);

const server = app.listen(port, () => {
  logger.info({ port }, "Securitask API listening");
});

function shutdown(signal: string) {
  logger.info({ signal }, "Shutting down Securitask API");
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
