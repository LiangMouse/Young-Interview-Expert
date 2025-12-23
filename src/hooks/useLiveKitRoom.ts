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
// 注意：dedupeSegments 暂时保留，但当前使用更简单的 findLastIndex 策略
// import { dedupeSegments } from "@livekit/components-core";

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

const USER_FINAL_MERGE_WINDOW_MS = 3000;

function shouldMergeUserFinal(lastMsg: TranscriptItem | null, now: number) {
  if (!lastMsg || lastMsg.role !== "user" || !lastMsg.isFinal) {
    return false;
  }
  return now - lastMsg.timestamp <= USER_FINAL_MERGE_WINDOW_MS;
}

function mergeTranscriptText(existing: string, incoming: string): string {
  const trimmedExisting = existing.trim();
  const trimmedIncoming = incoming.trim();

  if (!trimmedIncoming) {
    return existing;
  }
  if (!trimmedExisting) {
    return trimmedIncoming;
  }
  if (trimmedIncoming === trimmedExisting) {
    return existing;
  }
  if (trimmedIncoming.startsWith(trimmedExisting)) {
    return trimmedIncoming;
  }
  if (trimmedExisting.endsWith(trimmedIncoming)) {
    return trimmedExisting;
  }
  return `${trimmedExisting} ${trimmedIncoming}`;
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
  // Track the first connected agent to filter duplicates (hot-reload issue)
  const primaryAgentRef = useRef<string | null>(null);

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
      { reliable: true, topic: "lk-chat-topic" },
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
          const isAgent = participant.identity.startsWith("agent");

          if (track.kind === Track.Kind.Audio) {
            // For agent audio, only attach the first agent (to handle hot-reload duplicates)
            if (isAgent) {
              if (!primaryAgentRef.current) {
                primaryAgentRef.current = participant.identity;
                console.log(
                  `[useLiveKitRoom] Primary agent set: ${participant.identity}`,
                );
                const audioElement = track.attach();
                document.body.appendChild(audioElement);
              } else if (primaryAgentRef.current === participant.identity) {
                const audioElement = track.attach();
                document.body.appendChild(audioElement);
              } else {
                console.warn(
                  `[useLiveKitRoom] Skipping secondary agent audio: ${participant.identity} (primary: ${primaryAgentRef.current})`,
                );
              }
            } else {
              // Non-agent audio - always attach
              const audioElement = track.attach();
              document.body.appendChild(audioElement);
            }
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

      // 接收 Data 消息（用于 Agent 文本回复）
      room.on(
        RoomEvent.DataReceived,
        (
          payload: Uint8Array,
          participant?: RemoteParticipant,
          kind?: any,
          topic?: string,
        ) => {
          if (topic !== "lk-chat-topic") return; // 过滤 topic

          try {
            const decoder = new TextDecoder();
            const str = decoder.decode(payload);
            const msg = JSON.parse(str);

            if (msg.type === "agent_text" && msg.text) {
              setState((prev) => ({
                ...prev,
                transcript: [
                  ...prev.transcript,
                  {
                    id: `agent-${Date.now()}`,
                    role: "agent",
                    text: msg.text,
                    timestamp: Date.now(),
                    isFinal: true,
                  },
                ],
              }));
            }
          } catch (e) {
            console.warn("Failed to parse data message", e);
          }
        },
      );

      // 接收 LiveKit Agents 转录事件
      // 这是 Agent 端 STT 产生的实时转录
      room.on(
        RoomEvent.TranscriptionReceived,
        (segments: TranscriptionSegment[], participant?: Participant) => {
          // 判断是 Agent 还是用户的转录
          const isAgent = participant instanceof RemoteParticipant;
          const isAgentParticipant =
            isAgent && participant?.identity?.startsWith("agent");

          // Filter out secondary agents (hot-reload duplicate prevention)
          if (isAgentParticipant && primaryAgentRef.current) {
            if (participant?.identity !== primaryAgentRef.current) {
              console.warn(
                `[useLiveKitRoom] Skipping transcription from secondary agent: ${participant?.identity} (primary: ${primaryAgentRef.current})`,
              );
              return;
            }
          }

          const role: "user" | "agent" = isAgent ? "agent" : "user";

          segments.forEach((segment) => {
            setState((prev) => {
              const now = Date.now();
              const lastIndex = prev.transcript.length - 1;
              const lastMsg =
                lastIndex >= 0 ? prev.transcript[lastIndex] : null;

              // 只有当最后一条消息是同角色的非 final 消息时才更新它
              // 这确保了：1) 新消息总在末尾 2) 不会插入到历史消息中间
              const canUpdateLast =
                lastMsg && lastMsg.role === role && !lastMsg.isFinal;
              const shouldMergeWithLastFinal =
                role === "user" && shouldMergeUserFinal(lastMsg, now);

              if (!segment.final) {
                // 这是 interim 消息
                if (canUpdateLast) {
                  // 更新最后一条消息的文本
                  const updated = [...prev.transcript];
                  updated[lastIndex] = {
                    ...lastMsg,
                    text: segment.text,
                    timestamp: now,
                  };
                  return { ...prev, transcript: updated };
                }

                // 追加新的 interim 消息到末尾
                return {
                  ...prev,
                  transcript: [
                    ...prev.transcript,
                    {
                      id: segment.id,
                      role,
                      text: segment.text,
                      timestamp: now,
                      isFinal: false,
                    },
                  ],
                };
              } else {
                // 这是 final 消息
                if (canUpdateLast) {
                  // 将最后一条 interim 消息标记为 final
                  const updated = [...prev.transcript];
                  updated[lastIndex] = {
                    ...lastMsg,
                    text: segment.text,
                    isFinal: true,
                    timestamp: now,
                  };
                  return { ...prev, transcript: updated };
                }

                if (shouldMergeWithLastFinal && lastMsg) {
                  const updated = [...prev.transcript];
                  updated[lastIndex] = {
                    ...lastMsg,
                    text: mergeTranscriptText(lastMsg.text, segment.text),
                    timestamp: now,
                  };
                  return { ...prev, transcript: updated };
                }

                // 追加新的 final 消息到末尾
                return {
                  ...prev,
                  transcript: [
                    ...prev.transcript,
                    {
                      id: segment.id,
                      role,
                      text: segment.text,
                      timestamp: now,
                      isFinal: true,
                    },
                  ],
                };
              }
            });
          });
        },
      );

      // 接收数据消息（用于自定义消息，如 RPC 响应）
      // 注意：转录消息已通过 TranscriptionReceived 事件处理
      // 此处不再处理 type: "transcript" 以避免重复
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

            // 跳过 transcript 类型消息，因为 TranscriptionReceived 事件已经处理了
            // Agent 端通过 UserInputTranscribed 事件发送的 transcript 消息会导致重复
            if (message.type === "transcript") {
              console.log(
                "[useLiveKitRoom] Skipping duplicate transcript message (handled by TranscriptionReceived)",
              );
              return;
            }

            // 处理 Agent 说话消息（通常是 final）
            if (message.type === "agent_speech") {
              setState((prev) => {
                // 检查是否与最后一条 agent 消息文本重复
                const lastAgentMsg = [...prev.transcript]
                  .reverse()
                  .find((t) => t.role === "agent");
                if (lastAgentMsg && lastAgentMsg.text === message.text) {
                  return prev; // 跳过重复
                }

                // 如果有 agent 的非 final 消息，将其标记为 final
                const lastNonFinalIndex = prev.transcript.findLastIndex(
                  (t) => t.role === "agent" && !t.isFinal,
                );
                if (lastNonFinalIndex >= 0) {
                  const updated = [...prev.transcript];
                  updated[lastNonFinalIndex] = {
                    ...updated[lastNonFinalIndex],
                    text: message.text,
                    isFinal: true,
                  };
                  return { ...prev, transcript: updated };
                }

                return {
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
                };
              });
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
