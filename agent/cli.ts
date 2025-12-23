import * as dotenv from "dotenv";
import { initAgentsLogger } from "./src/bootstrap/logger";
import { runWorkerMode } from "./src/modes/worker";

// Load environment variables for CLI mode
dotenv.config({ path: ".env.local" });

// LiveKit Agents logger must be initialized before using plugins
initAgentsLogger();

// ====== Start mode ======
const isFixedRoomMode = process.env.FIXED_ROOM_MODE === "true";
const devRoomName = process.env.DEV_ROOM_NAME;

// Handle graceful shutdown for hot-reloads
const shutdown = () => {
  console.log("\n[Agent] Process exiting...");
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

if (isFixedRoomMode && devRoomName) {
  const args = process.argv.slice(2);
  // If the command is 'dev' or missing, we swap it for 'connect --room <name>'
  if (args.length === 0 || args[0] === "dev") {
    process.argv = [
      process.argv[0],
      process.argv[1],
      "connect",
      "--room",
      devRoomName,
    ];
    console.warn(
      `[FixedRoomMode] Overriding CLI command to 'connect --room ${devRoomName}'\n`,
    );
    console.warn(
      `[FixedRoomMode] WARNING: Ensure only ONE agent process is running to avoid duplicates!\n`,
    );
  }
}

const agentModuleUrl = new URL("./main.ts", import.meta.url).toString();

// Always use runWorkerMode which internally calls cli.runApp()
// In fixed room mode, we set numIdleProcesses to 0 to avoid orphaned processes and conflicts
runWorkerMode(agentModuleUrl, {
  numIdleProcesses: isFixedRoomMode ? 0 : 3,
});
