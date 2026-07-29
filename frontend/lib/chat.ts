import { getApiBaseUrl } from "./apiBase";
import type { NdaFormData } from "./types";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatTurnResult {
  reply: string;
  fields: NdaFormData;
  is_complete: boolean;
}

export class ChatError extends Error {}

export async function sendChatTurn(
  messages: ChatMessage[],
  fields: NdaFormData,
): Promise<ChatTurnResult> {
  const response = await fetch(`${getApiBaseUrl()}/api/chat/mutual-nda`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, fields }),
  });

  if (!response.ok) {
    throw new ChatError(
      "The AI assistant is temporarily unavailable. Please try again.",
    );
  }

  return response.json();
}
