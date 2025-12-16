import {
  Room,
  RoomEvent,
  TrackKind,
  AudioStream,
  AudioSource,
  LocalAudioTrack,
  TrackPublishOptions,
} from "@livekit/rtc-node";
import { InterviewAgent } from "../core/interview-agent";
import { DeepgramSTTService } from "../services/deepgram-stt";
import { DebouncedSTTService } from "../services/debounced-stt";
import { OpenAILLMAdapter } from "../services/openai-llm";
import { MiniMaxTTSAdapter } from "../services/minimax-tts";
import {
  loadUserContext,
  buildSystemPrompt,
  loadInterviewContext,
} from "../services/context-loader";
import { BASE_SYSTEM_PROMPT } from "../constants/prompts";

export class LiveKitBridge {
  private room: Room;
  private agent!: InterviewAgent;
  private audioSource: AudioSource;
  private audioTrack?: LocalAudioTrack;
  private currentProfile: any = null;
  private currentInterview: any = null;

  constructor(room: Room) {
    this.room = room;
    this.audioSource = new AudioSource(32000, 1);
    // Delay initialization to start() to ensure Logger/Env is ready
  }

  public async start() {
    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) throw new Error("MINIMAX_API_KEY missing");

    // 1. 初始化 Services
    // 注意：这里硬编码了配置，生产环境应从 options 传入
    const sttRaw = new DeepgramSTTService(process.env.DEEPGRAM_API_KEY);
    const stt = new DebouncedSTTService(sttRaw, 3000);

    const llm = new OpenAILLMAdapter({
      apiKey: apiKey,
      model: process.env.MINIMAX_MODEL || "abab5.5s-chat",
      baseURL: "https://api.minimax.chat/v1",
      temperature: 0.7,
    });

    const tts = new MiniMaxTTSAdapter({
      apiKey: apiKey,
      // MiniMax TTS 需要配合 model 吗？ Adapter 构造函数只用了 apiKey?
      // 上下文看到的是: apiKey: apiKey
    });

    // 2. 初始化 Agent
    this.agent = new InterviewAgent(llm, tts, stt, BASE_SYSTEM_PROMPT);

    this.setupBridge();
    await this.startAgentMic();

    this.agent.start();
  }

  private setupBridge() {
    // --- Agent Output -> LiveKit ---

    this.agent.on("agent_audio_frame", (frame) => {
      this.audioSource.captureFrame(frame);
    });

    this.agent.on("agent_text_delta", (text) => {
      const payload = JSON.stringify({
        type: "agent_text",
        text,
        timestamp: Date.now(),
      });
      this.publishData(payload);
    });

    this.agent.on("user_transcript", (text) => {
      const payload = JSON.stringify({
        type: "transcript",
        role: "user",
        text,
        isFinal: true,
        timestamp: Date.now(),
      });
      this.publishData(payload);
    });

    this.agent.on("state_change", (state) => {
      console.log(`[Bridge] Agent State: ${state}`);
      // 可选：广播状态给 UI
    });

    // --- LiveKit Input -> Agent ---

    this.room.on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
      if (track.kind === TrackKind.KIND_AUDIO) {
        console.log("[Bridge] Subscribed to audio track:", track.sid);
        const stream = new AudioStream(track);
        this.pumpAudio(stream);
      }
    });

    // Handle Data messages (User Text Input & RPC)
    this.room.on(RoomEvent.DataReceived, async (payload, participant) => {
      const decoder = new TextDecoder();
      const msg = JSON.parse(decoder.decode(payload));

      if (msg.type === "user_text") {
        // Manually trigger agent (if needed)
      }

      // Handle RPC
      if (msg.name === "start_interview" && msg.data?.interviewId) {
        console.log(
          `[Bridge] Received start_interview RPC: ${msg.data.interviewId}`,
        );
        await this.handleStartInterview(
          msg.data.interviewId,
          participant?.identity,
        );
      }
    });

    // --- User Context Injection ---
    this.room.on(RoomEvent.ParticipantConnected, async (participant) => {
      console.log(`[Bridge] Participant connected: ${participant.identity}`);
      await this.injectUserContext(participant.identity);
    });

    // Also check existing participants (if we joined late)
    this.room.remoteParticipants.forEach(async (p) => {
      console.log(`[Bridge] Existing participant: ${p.identity}`);
      await this.injectUserContext(p.identity);
    });
  }

  private async handleStartInterview(interviewId: string, userId?: string) {
    // 1. Load Interview Context
    const interview = await loadInterviewContext(interviewId);
    if (interview) {
      this.currentInterview = interview;
      console.log(
        `[Bridge] Loaded interview context: ${interview.type} (${interview.duration}min)`,
      );
    }

    // 2. Ensure User Context is loaded
    // If we have cached profile, use it. Otherwise try to load if userId provided.
    if (!this.currentProfile && userId) {
      await this.injectUserContext(userId);
    }

    // 3. Update Prompt with BOTH contexts
    this.updateAgentPrompt();
  }

  private async injectUserContext(userId: string) {
    // 忽略 agent 自己的 identity
    if (userId.startsWith("agent-")) return;

    console.log(`[Bridge] Loading context for user: ${userId}`);
    const profile = await loadUserContext(userId);
    if (profile) {
      this.currentProfile = profile;
      console.log(
        `[Bridge] User profile loaded for ${profile.nickname || userId}`,
      );
      this.updateAgentPrompt();
    } else {
      console.log(`[Bridge] No profile found for user: ${userId}`);
    }
  }

  private updateAgentPrompt() {
    // Re-build full prompt with whatever context we have
    const fullPrompt = buildSystemPrompt(
      this.currentProfile,
      BASE_SYSTEM_PROMPT,
      this.currentInterview,
    );
    this.agent.updateSystemPrompt(fullPrompt);
  }

  private async startAgentMic() {
    try {
      // 等待连接建立后再发布？或者发布后等待连接？
      // rtc-node 中，需要在 room connect 后才能 publish 吗？
      // Room 对象在外部可能还没 connect。我们监听 Connected 事件？
      // 或者假设调用者会在 connect 后调用。
      // rtc-node 的 Room 实例通常使用 connectionState
      // 但最稳妥的方式是直接绑定事件，或者尝试发布（如果未连接会抛错）
      this.doPublish().catch(() => {
        this.room.on(RoomEvent.Connected, async () => {
          await this.doPublish();
        });
      });
    } catch (e) {
      console.error("Failed to publish agent mic:", e);
    }
  }

  private async doPublish() {
    if (!this.room.localParticipant) return;
    this.audioTrack = LocalAudioTrack.createAudioTrack(
      "agent_voice",
      this.audioSource,
    );
    await this.room.localParticipant.publishTrack(
      this.audioTrack,
      new TrackPublishOptions(),
    );
    console.log("[Bridge] Agent audio track published.");
  }

  private async pumpAudio(stream: AudioStream) {
    try {
      // @ts-ignore
      for await (const frame of stream) {
        this.agent.pushAudio(frame);
      }
    } catch (e) {
      console.error("[Bridge] Audio pump error:", e);
    }
  }

  private publishData(msg: string) {
    if (this.room.localParticipant) {
      const data = new TextEncoder().encode(msg);
      this.room.localParticipant.publishData(data, {
        reliable: true,
        topic: "lk-chat-topic",
      });
    }
  }
}
