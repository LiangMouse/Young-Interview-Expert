import { type JobProcess, defineAgent } from "@livekit/agents";
import * as dotenv from "dotenv";
import * as silero from "@livekit/agents-plugin-silero";
import { initAgentsLogger } from "./src/bootstrap/logger";
import { agentEntry } from "./src/runtime/entry";
import { runDirectMode } from "./src/modes/direct";
import { runWorkerMode } from "./src/modes/worker";

// Global Error Handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});

// Load environment variables
dotenv.config({ path: ".env.local" });

// LiveKit Agents logger must be initialized before using plugins
initAgentsLogger();

const DEV_ROOM_NAME = process.env.DEV_ROOM_NAME;

// ====== Agent definition (Worker will load this default export) ======
export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    console.log("[Prewarm] Loading VAD model...");
    proc.userData.vad = await silero.VAD.load();
    console.log("[Prewarm] VAD model loaded successfully");
  },

  entry: agentEntry,
});

// ====== Start mode ======
if (DEV_ROOM_NAME) {
  console.warn(
    `\n!!! RUNNING IN DEV MODE - CONNECTING TO ROOM: ${DEV_ROOM_NAME} !!!\n`,
  );
  // Fire-and-forget to keep default export intact for Worker
  void runDirectMode(DEV_ROOM_NAME);
} else {
  runWorkerMode(import.meta.url);
}
