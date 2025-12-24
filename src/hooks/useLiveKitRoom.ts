/**
 * useLiveKitRoom Hook
 * 封装 LiveKit 房间连接逻辑，供面试页面使用
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
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
import { getInterviewMessages, type ChatMessage } from "@/action/interview";

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

  // 加载历史消息
  useEffect(() => {
    if (!interviewId) return;

    let mounted = true;

    const loadHistory = async () => {
      try {
        const { success, messages, error } =
          await getInterviewMessages(interviewId);

        if (success && messages && mounted) {
          const history: TranscriptItem[] = [];

          // 处理用户消息
          if (Array.isArray(messages.user_messages)) {
            messages.user_messages.forEach((msg: any) => {
              history.push({
                id: msg.id || `hist-user-${Date.now()}-${Math.random()}`,
                role: "user",
                text: msg.content,
                timestamp: new Date(msg.timestamp).getTime(),
                isFinal: true,
              });
            });
          }

          // 处理 AI 消息
          if (Array.isArray(messages.ai_messages)) {
            messages.ai_messages.forEach((msg: any) => {
              history.push({
                id: msg.id || `hist-ai-${Date.now()}-${Math.random()}`,
                role: "agent",
                text: msg.content,
                timestamp: new Date(msg.timestamp).getTime(),
                isFinal: true,
              });
            });
          }

          // 按时间排序
          history.sort((a, b) => a.timestamp - b.timestamp);

          setState((prev) => ({
            ...prev,
            transcript: history,
          }));
        } else if (error) {
          console.error("[useLiveKitRoom] Failed to load history:", error);
        }
      } catch (e) {
        console.error("[useLiveKitRoom] Error loading history:", e);
      }
    };

    loadHistory();

    return () => {
      mounted = false;
    };
  }, [interviewId]);

  const locale = useLocale();

  /**
   * 获取 LiveKit token
   */
  const fetchToken = useCallback(async () => {
    const response = await fetch("/api/livekit/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ interviewId, locale }),
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

      const startAudio = (room as Room & { startAudio?: () => Promise<void> })
        .startAudio;
      if (startAudio) {
        try {
          await startAudio.call(room);
        } catch (error) {
          console.warn("[useLiveKitRoom] Failed to start audio:", error);
        }
      }

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
   * 用于处理房间连接状态变化、参与者连接和断开等事件
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
          if (participant.identity === primaryAgentRef.current) {
            primaryAgentRef.current = null;
          }
        },
      );

      const attachAndPlayAudio = (audioTrack: Track) => {
        const audioElement = audioTrack.attach() as HTMLMediaElement;
        audioElement.autoplay = true;

        audioElement.muted = false;
        audioElement.style.display = "none";
        document.body.appendChild(audioElement);
        const playPromise = audioElement.play?.();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch((error) => {
            console.warn("[useLiveKitRoom] Audio play blocked:", error);
          });
        }
      };

      // 音轨订阅
      room.on(
        RoomEvent.TrackSubscribed,
        (
          track: Track,
          publication: RemoteTrackPublication,
          participant: RemoteParticipant,
        ) => {
          const isAgent = participant.identity.startsWith("agent");
          if (
            primaryAgentRef.current &&
            !room.remoteParticipants.has(primaryAgentRef.current)
          ) {
            primaryAgentRef.current = null;
          }

          if (track.kind === Track.Kind.Audio) {
            // For agent audio, only attach the first agent (to handle hot-reload duplicates)
            if (isAgent) {
              if (!primaryAgentRef.current) {
                primaryAgentRef.current = participant.identity;
                console.log(
                  `[useLiveKitRoom] Primary agent set: ${participant.identity}`,
                );
                attachAndPlayAudio(track);
              } else if (primaryAgentRef.current === participant.identity) {
                attachAndPlayAudio(track);
              } else {
                console.warn(
                  `[useLiveKitRoom] Skipping secondary agent audio: ${participant.identity} (primary: ${primaryAgentRef.current})`,
                );
              }
            } else {
              // Non-agent audio - always attach
              attachAndPlayAudio(track);
            }
          }
        },
      );

      // 音轨取消订阅
      room.on(RoomEvent.TrackUnsubscribed, (track: Track) => {
        const elements = track.detach();
        elements.forEach((element) => {
          element.remove();
        });
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
      // 这是 Agent 端 STT 产生的实时转录，用于显示正在说话的文字
      // 注意：用户消息的 final 状态由后端 ConversationItemAdded 决定，不是 STT final
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
              const existingIndex = prev.transcript.findIndex(
                (item) => item.id === segment.id,
              );

              // 只有当最后一条消息是同角色的非 final 消息时才更新它
              const canUpdateLast =
                lastMsg && lastMsg.role === role && !lastMsg.isFinal;

              // 对于用户消息：强制按角色合并实时转录到同一个气泡
              // 忽略 segment.id，始终更新最后一条非 final 的用户消息
              // 真正的 final 状态由后端 ConversationItemAdded 事件决定
              if (role === "user") {
                // 查找最后一条非 final 的用户消息
                const lastUserNonFinalIndex = prev.transcript.findLastIndex(
                  (t) => t.role === "user" && !t.isFinal,
                );

                if (lastUserNonFinalIndex >= 0) {
                  // 更新现有的非 final 用户消息，而不是创建新气泡
                  const updated = [...prev.transcript];
                  updated[lastUserNonFinalIndex] = {
                    ...updated[lastUserNonFinalIndex],
                    text: segment.text,
                    timestamp: now,
                    isFinal: false, // 保持非 final
                  };
                  return { ...prev, transcript: updated };
                }

                return {
                  ...prev,
                  transcript: [
                    ...prev.transcript,
                    {
                      id: `user-interim-${now}`,
                      role: "user",
                      text: segment.text,
                      timestamp: now,
                      isFinal: false,
                    },
                  ],
                };
              }

              // Agent 消息正常处理
              if (!segment.final) {
                if (existingIndex >= 0) {
                  const updated = [...prev.transcript];
                  updated[existingIndex] = {
                    ...updated[existingIndex],
                    text: segment.text,
                    timestamp: now,
                    isFinal: false,
                  };
                  return { ...prev, transcript: updated };
                }

                if (canUpdateLast) {
                  const updated = [...prev.transcript];
                  updated[lastIndex] = {
                    ...lastMsg,
                    text: segment.text,
                    timestamp: now,
                  };
                  return { ...prev, transcript: updated };
                }

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
                // Agent 的 final 消息
                if (existingIndex >= 0) {
                  const updated = [...prev.transcript];
                  updated[existingIndex] = {
                    ...updated[existingIndex],
                    text: segment.text,
                    timestamp: now,
                    isFinal: true,
                  };
                  return { ...prev, transcript: updated };
                }

                if (canUpdateLast) {
                  const updated = [...prev.transcript];
                  updated[lastIndex] = {
                    ...lastMsg,
                    text: segment.text,
                    isFinal: true,
                    timestamp: now,
                  };
                  return { ...prev, transcript: updated };
                }

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
      // 处理后端 ConversationItemAdded 发送的用户最终消息
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

            // 处理后端 ConversationItemAdded 发送的用户最终消息
            // 这是轮次结束后的完整用户消息，不是实时转录
            if (message.type === "transcript" && message.role === "user") {
              setState((prev) => {
                // 检查是否与最后一条用户消息重复
                const lastUserMsg = [...prev.transcript]
                  .reverse()
                  .find((t) => t.role === "user");
                if (lastUserMsg && lastUserMsg.text === message.text) {
                  return prev; // 跳过重复
                }

                // 查找并替换最后的非 final 用户消息（实时转录状态）
                const lastNonFinalIndex = prev.transcript.findLastIndex(
                  (t) => t.role === "user" && !t.isFinal,
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

                // 追加新消息
                return {
                  ...prev,
                  transcript: [
                    ...prev.transcript,
                    {
                      id: `user-final-${Date.now()}`,
                      role: "user" as const,
                      text: message.text,
                      timestamp: Date.now(),
                      isFinal: true,
                    },
                  ],
                };
              });
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
        primaryAgentRef.current = null;
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
