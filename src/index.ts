import { createServer } from "node:http";
import { env } from "./config/env.js";
import app from "./app.js";
import { initSocket } from "./socket/index.js";
import { startCleanupCron } from "./cron/cleanup.js";

const server = createServer(app);
initSocket(server);
startCleanupCron();

server.listen(env.PORT, () => {
  console.log(`Sprava API running on port ${env.PORT}`);
});
