export interface ServerToClientEvents {
  "ai-response": (data: { text: string; interviewId: string }) => void;
  "ai-speech": (data: { speech: string; interviewId: string }) => void;
  "interview-started": (data: {
    interviewId: string;
    initialQuestion: string;
  }) => void;
  error: (data: { message: string; interviewId: string }) => void;
}

export interface ClientToServerEvents {
  "user-speech": (data: {
    transcript: string;
    interviewId: string;
    userId: string;
  }) => void;
  "join-interview": (data: { interviewId: string }) => void;
  "start-interview": (data: { interviewId: string; userId: string }) => void;
  "stop-tts": (data: { interviewId: string }) => void;
}
