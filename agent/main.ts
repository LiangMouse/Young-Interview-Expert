import { type JobProcess, defineAgent } from "@livekit/agents";
import * as dotenv from "dotenv";
import * as silero from "@livekit/agents-plugin-silero";
import { initAgentsLogger } from "./src/bootstrap/logger";
import { agentEntry } from "./src/runtime/entry";

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

// ====== Agent definition (Worker will load this default export) ======
export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    console.log("[Prewarm] Loading VAD model...");
    proc.userData.vad = await silero.VAD.load();
    console.log("[Prewarm] VAD model loaded successfully");
  },

  entry: agentEntry,
});
