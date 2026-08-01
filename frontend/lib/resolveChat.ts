import { getApiBaseUrl } from "./apiBase";
import { ChatError, type ChatMessage } from "./chat";

export interface ResolveChatResult {
  reply: string;
  matched_slug: string | null;
}

export async function sendResolveChatTurn(messages: ChatMessage[]): Promise<ResolveChatResult> {
  const response = await fetch(`${getApiBaseUrl()}/api/chat/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    throw new ChatError("The AI assistant is temporarily unavailable. Please try again.");
  }

  return response.json();
}
