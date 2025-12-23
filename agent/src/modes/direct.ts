import { Room } from "@livekit/rtc-node";
import { AccessToken } from "livekit-server-sdk";
import * as silero from "@livekit/agents-plugin-silero";
import { runStandaloneAgentInRoom } from "./standalone";
import {
  JobContext,
  JobProcess,
  runWithJobContextAsync,
} from "@livekit/agents";

export async function runDirectMode(roomName: string) {
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
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });
  const token = await at.toJwt();

  const vadModel = await silero.VAD.load();

  console.log(`[DirectMode] Connecting to room: ${roomName}...`);
  await room.connect(
    process.env.LIVEKIT_WS_URL || process.env.LIVEKIT_URL || "",
    token,
  );

  // Create a minimal JobContext to satisfy the SDK requirement
  const dummyProc = {
    id: "dev-process",
    userData: { vad: vadModel },
  } as unknown as JobProcess;

  const ctx = {
    room: room,
    proc: dummyProc,
  } as unknown as JobContext;

  await runWithJobContextAsync(ctx, async () => {
    await runStandaloneAgentInRoom({ room, vadModel });
  });
}
