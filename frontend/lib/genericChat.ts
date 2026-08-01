import { getApiBaseUrl } from "./apiBase";
import { ChatError, type ChatMessage } from "./chat";

export interface GenericChatTurnResult {
  reply: string;
  fields: Record<string, string>;
  is_complete: boolean;
}

export async function sendGenericChatTurn(
  documentSlug: string,
  fieldKeys: string[],
  messages: ChatMessage[],
  fields: Record<string, string>,
): Promise<GenericChatTurnResult> {
  const response = await fetch(`${getApiBaseUrl()}/api/chat/document/${documentSlug}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, field_keys: fieldKeys, fields }),
  });

  if (!response.ok) {
    throw new ChatError("The AI assistant is temporarily unavailable. Please try again.");
  }

  return response.json();
}
