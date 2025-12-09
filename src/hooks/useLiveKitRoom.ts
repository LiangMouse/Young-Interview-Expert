/**
 * useLiveKitRoom Hook
 *
 * 封装 LiveKit 房间连接逻辑，供面试页面使用
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Room,
  RoomEvent,
  ConnectionState,
  Track,
  RemoteParticipant,
  RemoteTrackPublication,
  LocalParticipant,
  Participant,
  DataPacket_Kind,
  TranscriptionSegment,
} from "livekit-client";

export interface LiveKitRoomState {
  /** 房间连接状态 */
  connectionState: ConnectionState;
  /** 是否已连接 */
  isConnected: boolean;
  /** 是否正在连接 */
  isConnecting: boolean;
  /** 本地麦克风是否启用 */
  isMicEnabled: boolean;
  /** Agent 是否正在说话 */
  isAgentSpeaking: boolean;
  /** 用户是否正在说话 */
  isUserSpeaking: boolean;
  /** 最新的转写文本 */
  transcript: TranscriptItem[];
  /** 错误信息 */
  error: string | null;
}

export interface TranscriptItem {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export interface UseLiveKitRoomOptions {
  /** 面试 ID */
  interviewId: string;
  /** 连接成功回调 */
  onConnected?: () => void;
  /** 断开连接回调 */
  onDisconnected?: () => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

export function useLiveKitRoom(options: UseLiveKitRoomOptions) {
  const { interviewId, onConnected, onDisconnected, onError } = options;

  const roomRef = useRef<Room | null>(null);
  const [state, setState] = useState<LiveKitRoomState>({
    connectionState: ConnectionState.Disconnected,
    isConnected: false,
    isConnecting: false,
    isMicEnabled: true,
    isAgentSpeaking: false,
    isUserSpeaking: false,
    transcript: [],
    error: null,
  });

  /**
   * 获取 LiveKit token
   */
  const fetchToken = useCallback(async () => {
    const response = await fetch("/api/livekit/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interviewId }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "获取 token 失败");
    }

    return response.json();
  }, [interviewId]);

  /**
   * 连接到 LiveKit 房间
   */
  const connect = useCallback(async () => {
    if (roomRef.current?.state === ConnectionState.Connected) {
      console.log("[useLiveKitRoom] Already connected");
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // 获取 token
      const { token, url } = await fetchToken();

      // 创建房间实例
      const room = new Room({
        // 自动管理订阅的媒体轨道
        adaptiveStream: true,
        // 启用断线重连
        reconnectPolicy: {
          maxRetries: 5,
          retryDelays: [1000, 2000, 4000, 8000, 16000],
        },
      });

      roomRef.current = room;

      // 监听房间事件
      setupRoomEventListeners(room);

      // 连接到房间
      await room.connect(url, token);

      // 启用麦克风
      await room.localParticipant.setMicrophoneEnabled(true);

      setState((prev) => ({
        ...prev,
        connectionState: ConnectionState.Connected,
        isConnected: true,
        isConnecting: false,
        isMicEnabled: true,
      }));

      onConnected?.();
    } catch (error) {
      console.error("[useLiveKitRoom] Connection failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "连接失败，请重试";
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  }, [fetchToken, onConnected, onError]);

  /**
   * 断开连接
   */
  const disconnect = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      connectionState: ConnectionState.Disconnected,
      isConnected: false,
      isConnecting: false,
    }));

    onDisconnected?.();
  }, [onDisconnected]);

  /**
   * 切换麦克风状态
   */
  const toggleMicrophone = useCallback(async () => {
    if (!roomRef.current?.localParticipant) return;

    const newState = !state.isMicEnabled;
    await roomRef.current.localParticipant.setMicrophoneEnabled(newState);
    setState((prev) => ({ ...prev, isMicEnabled: newState }));
  }, [state.isMicEnabled]);

  /**
   * 发送 RPC 消息（如 start_interview）
   */
  const sendRpc = useCallback(
    async (name: string, data: Record<string, unknown> = {}) => {
      if (!roomRef.current?.localParticipant) {
        throw new Error("未连接到房间");
      }

      const payload = JSON.stringify({ name, data });
      const encoder = new TextEncoder();
      await roomRef.current.localParticipant.publishData(
        encoder.encode(payload),
        { reliable: true },
      );
    },
    [],
  );

  /**
   * 发送文本消息给 Agent
   * 用于键盘输入模式
   */
  const sendTextMessage = useCallback(async (text: string) => {
    if (!roomRef.current?.localParticipant) {
      throw new Error("未连接到房间");
    }

    if (!text.trim()) return;

    // 发送文本消息给 Agent
    const payload = JSON.stringify({
      type: "user_text",
      text: text.trim(),
      timestamp: Date.now(),
    });
    const encoder = new TextEncoder();
    await roomRef.current.localParticipant.publishData(
      encoder.encode(payload),
      { reliable: true },
    );

    // 立即添加到本地转录
    setState((prev) => ({
      ...prev,
      transcript: [
        ...prev.transcript,
        {
          id: `user-${Date.now()}`,
          role: "user" as const,
          text: text.trim(),
          timestamp: Date.now(),
          isFinal: true,
        },
      ],
    }));
  }, []);

  /**
   * 设置房间事件监听器
   */
  const setupRoomEventListeners = useCallback(
    (room: Room) => {
      // 连接状态变化
      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        setState((prev) => ({
          ...prev,
          connectionState: state,
          isConnected: state === ConnectionState.Connected,
        }));

        if (state === ConnectionState.Disconnected) {
          onDisconnected?.();
        }
      });

      // 参与者连接
      room.on(
        RoomEvent.ParticipantConnected,
        (participant: RemoteParticipant) => {
          console.log(
            "[useLiveKitRoom] Participant connected:",
            participant.identity,
          );
        },
      );

      // 参与者断开
      room.on(
        RoomEvent.ParticipantDisconnected,
        (participant: RemoteParticipant) => {
          console.log(
            "[useLiveKitRoom] Participant disconnected:",
            participant.identity,
          );
        },
      );

      // 音轨订阅
      room.on(
        RoomEvent.TrackSubscribed,
        (
          track: Track,
          publication: RemoteTrackPublication,
          participant: RemoteParticipant,
        ) => {
          if (track.kind === Track.Kind.Audio) {
            // 自动播放 Agent 的音频
            const audioElement = track.attach();
            document.body.appendChild(audioElement);
          }
        },
      );

      // 音轨取消订阅
      room.on(RoomEvent.TrackUnsubscribed, (track: Track) => {
        track.detach();
      });

      // 说话状态变化（用于检测 Agent 是否在说话）
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        const agentSpeaking = speakers.some(
          (p) => p instanceof RemoteParticipant,
        );
        const userSpeaking = speakers.some(
          (p) => p instanceof LocalParticipant,
        );

        setState((prev) => ({
          ...prev,
          isAgentSpeaking: agentSpeaking,
          isUserSpeaking: userSpeaking,
        }));
      });

      // 接收 LiveKit Agents 转录事件
      // 这是 Agent 端 STT 产生的实时转录
      room.on(
        RoomEvent.TranscriptionReceived,
        (segments: TranscriptionSegment[], participant?: Participant) => {
          console.log("[useLiveKitRoom] Transcription received:", segments);

          // 判断是 Agent 还是用户的转录
          const isAgent = participant instanceof RemoteParticipant;
          const role = isAgent ? "agent" : "user";

          segments.forEach((segment) => {
            setState((prev) => {
              // 查找是否已有该 segment（用于更新临时转录）
              const existingIndex = prev.transcript.findIndex(
                (t) => t.id === segment.id,
              );

              if (existingIndex >= 0) {
                // 更新已有的转录
                const updated = [...prev.transcript];
                updated[existingIndex] = {
                  ...updated[existingIndex],
                  text: segment.text,
                  isFinal: segment.final,
                };
                return { ...prev, transcript: updated };
              }

              // 添加新的转录
              return {
                ...prev,
                transcript: [
                  ...prev.transcript,
                  {
                    id: segment.id,
                    role,
                    text: segment.text,
                    timestamp: Date.now(),
                    isFinal: segment.final,
                  },
                ],
              };
            });
          });
        },
      );

      // 接收数据消息（用于自定义消息，如 RPC 响应）
      room.on(
        RoomEvent.DataReceived,
        (
          payload: Uint8Array,
          participant?: RemoteParticipant,
          kind?: DataPacket_Kind,
        ) => {
          try {
            const decoder = new TextDecoder();
            const message = JSON.parse(decoder.decode(payload));

            // 处理自定义转写消息（兼容旧格式）
            if (message.type === "transcript") {
              setState((prev) => ({
                ...prev,
                transcript: [
                  ...prev.transcript,
                  {
                    id: `${Date.now()}-${Math.random()}`,
                    role: message.role || "agent",
                    text: message.text,
                    timestamp: Date.now(),
                    isFinal: message.isFinal ?? true,
                  },
                ],
              }));
            }

            // 处理 Agent 说话消息
            if (message.type === "agent_speech") {
              setState((prev) => ({
                ...prev,
                transcript: [
                  ...prev.transcript,
                  {
                    id: `agent-${Date.now()}`,
                    role: "agent",
                    text: message.text,
                    timestamp: Date.now(),
                    isFinal: true,
                  },
                ],
              }));
            }
          } catch (e) {
            // 忽略非 JSON 消息
          }
        },
      );

      // 断开连接
      room.on(RoomEvent.Disconnected, () => {
        setState((prev) => ({
          ...prev,
          connectionState: ConnectionState.Disconnected,
          isConnected: false,
        }));
        onDisconnected?.();
      });
    },
    [onDisconnected],
  );

  // 组件卸载时断开连接
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    toggleMicrophone,
    sendRpc,
    sendTextMessage,
    room: roomRef.current,
  };
}
