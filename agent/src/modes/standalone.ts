import { Room, RoomEvent, RemoteParticipant } from "@livekit/rtc-node";
import * as silero from "@livekit/agents-plugin-silero";
import { runAgentSession } from "../runtime/entry";

export interface StandaloneAgentOptions {
  room: Room;
  vadModel: silero.VAD;
}

export async function runStandaloneAgentInRoom({
  room,
  vadModel,
}: StandaloneAgentOptions) {
  console.log("[Standalone] Waiting for participant...");

  // Wait for a real participant (non-agent) to be present
  const participant = await new Promise<RemoteParticipant>((resolve) => {
    const check = () => {
      const p = Array.from(room.remoteParticipants.values()).find(
        (part) => !part.identity.startsWith("agent-"),
      );
      if (p) {
        room.off(RoomEvent.ParticipantConnected, check);
        resolve(p as RemoteParticipant);
        return true;
      }
      return false;
    };
    if (!check()) {
      room.on(RoomEvent.ParticipantConnected, check);
    }
  });

  console.log("[Standalone] Participant connected:", participant.identity);

  await runAgentSession(room, participant, vadModel);
}
