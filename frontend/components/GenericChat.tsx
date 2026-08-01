"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChatError, type ChatMessage } from "@/lib/chat";
import { sendGenericChatTurn } from "@/lib/genericChat";

interface GenericChatProps {
  documentSlug: string;
  documentName: string;
  fieldKeys: string[];
  fields: Record<string, string>;
  onFieldsChange: (fields: Record<string, string>) => void;
  onPendingChange?: (pending: boolean) => void;
}

const bubbleClass =
  "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap";
const inputClass =
  "flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-[#209dd7] focus:outline-none focus:ring-1 focus:ring-[#209dd7] dark:border-zinc-700 dark:bg-zinc-900";

export default function GenericChat({
  documentSlug,
  documentName,
  fieldKeys,
  fields,
  onFieldsChange,
  onPendingChange,
}: GenericChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hi! I'll help you put together your ${documentName}. Let's get started — what would you like to tell me first?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pending) {
      inputRef.current?.focus();
    }
  }, [pending]);

  function updatePending(value: boolean) {
    setPending(value);
    onPendingChange?.(value);
  }

  async function sendTurn(history: ChatMessage[]) {
    updatePending(true);
    setError(null);
    try {
      const result = await sendGenericChatTurn(documentSlug, fieldKeys, history, fields);
      setMessages([...history, { role: "assistant", content: result.reply }]);
      onFieldsChange(result.fields);
    } catch (err) {
      setError(
        err instanceof ChatError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      updatePending(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || pending) return;

    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history);
    setInput("");
    await sendTurn(history);
  }

  function handleRetry() {
    void sendTurn(messages);
  }

  return (
    <div className="flex shrink-0 flex-col gap-4">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
        Chat with our assistant
      </h2>
      <div
        className="flex max-h-64 flex-col gap-3 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        aria-label="Chat messages"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${bubbleClass} ${
              message.role === "assistant"
                ? "self-start bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                : "self-end bg-[#209dd7] text-white"
            }`}
          >
            {message.content}
          </div>
        ))}
        {pending && (
          <p className="text-sm text-[#888888]" aria-live="polite">
            Thinking…
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3" role="alert">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="shrink-0 text-sm font-medium text-[#209dd7] hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      <form className="flex gap-2" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="generic-chat-input">
          Message
        </label>
        <input
          id="generic-chat-input"
          ref={inputRef}
          className={inputClass}
          value={input}
          disabled={pending}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your answer…"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="rounded-md bg-[#753991] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#602d78] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
