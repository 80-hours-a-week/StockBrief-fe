const CHAT_RESUME_SESSION_KEY = "stockbrief_chat_resume_session_v1";

interface StoredChatResumeSession {
  ticker: string;
  session_id: string;
}

interface ChatResumeInput {
  ticker: string;
  sessionId: string;
}

export function storeChatResumeSession({ ticker, sessionId }: ChatResumeInput): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    CHAT_RESUME_SESSION_KEY,
    JSON.stringify({
      ticker,
      session_id: sessionId,
    }),
  );
}

export function takeChatResumeSession(ticker: string): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(CHAT_RESUME_SESSION_KEY);
  if (!raw) return null;

  window.sessionStorage.removeItem(CHAT_RESUME_SESSION_KEY);
  try {
    const parsed = JSON.parse(raw) as Partial<StoredChatResumeSession>;
    if (parsed.ticker === ticker && typeof parsed.session_id === "string" && parsed.session_id.trim()) {
      return parsed.session_id;
    }
  } catch {
    return null;
  }
  return null;
}
