import { WorkerOptions, cli } from "@livekit/agents";
import { fileURLToPath } from "url";

export function runWorkerMode(agentModuleUrl: string) {
  cli.runApp(
    new WorkerOptions({
      agent: fileURLToPath(agentModuleUrl),
      loadThreshold: 0.7,
      numIdleProcesses: 3,
    }),
  );
}
