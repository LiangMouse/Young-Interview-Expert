import {
  type JobContext,
  WorkerOptions,
  cli,
  defineAgent,
  initializeLogger,
} from "@livekit/agents";
import { Room } from "@livekit/rtc-node";
import { AccessToken } from "livekit-server-sdk";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { LiveKitBridge } from "./src/bridge/livekit-impl";

// Global Error Handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  // Optional: exit process if in production to let orchestrator restart
  // process.exit(1);
});

// 加载环境变量
dotenv.config({ path: ".env.local" });

// 尝试规避 "logger not initialized"
try {
  initializeLogger({ pretty: true, level: "info" });
} catch (e) {
  console.log("Logger init skipped", e);
}

const DEV_ROOM_NAME = process.env.DEV_ROOM_NAME;

// 1. 直连模式 (Dev Direct)
if (DEV_ROOM_NAME) {
  console.warn(
    `\n!!! RUNNING IN DEV MODE - CONNECTING TO ROOM: ${DEV_ROOM_NAME} !!!\n`,
  );

  (async () => {
    const room = new Room();
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: "agent-dev-" + Math.floor(Math.random() * 1000),
        name: "Agent Dev",
      },
    );
    at.addGrant({
      roomJoin: true,
      room: DEV_ROOM_NAME,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });
    const token = await at.toJwt();

    // 初始化桥接
    // @ts-ignore
    const bridge = new LiveKitBridge(room);
    bridge.start();

    // 连接
    await room.connect(
      process.env.LIVEKIT_WS_URL || process.env.LIVEKIT_URL || "",
      token,
    );
    console.log(`Directly connected to ${DEV_ROOM_NAME}`);
  })();
} else {
  // 2. Worker 模式 (Prod / Webhook)
}

export default defineAgent({
  entry: async (ctx: JobContext) => {
    console.log("=== INTERVIEWER AGENT V3 (Refactored) ===");

    const bridge = new LiveKitBridge(ctx.room as unknown as Room);
    await bridge.start();

    await ctx.connect();
    console.log("Agent V3 Ready (Worker Mode)");
  },
});

// 只有在直接运行时才启动 CLI
if (!DEV_ROOM_NAME) {
  cli.runApp(
    new WorkerOptions({
      agent: fileURLToPath(import.meta.url),
    }),
  );
}
