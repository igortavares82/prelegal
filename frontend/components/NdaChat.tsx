"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChatError, sendChatTurn, type ChatMessage } from "@/lib/chat";
import type { NdaFormData } from "@/lib/types";

interface NdaChatProps {
  fields: NdaFormData;
  onFieldsChange: (fields: NdaFormData) => void;
  onPendingChange?: (pending: boolean) => void;
}

const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'll help you put together your Mutual NDA. To start, what's the purpose of sharing confidential information between the two parties?",
};

const bubbleClass =
  "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap";
const inputClass =
  "flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue dark:border-zinc-700 dark:bg-zinc-900";

export default function NdaChat({ fields, onFieldsChange, onPendingChange }: NdaChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Once a turn resolves (success or error) and the input re-enables, return
  // focus to it so the user can keep answering without an extra click.
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
      const result = await sendChatTurn(history, fields);
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
                : "self-end bg-brand-blue text-white"
            }`}
          >
            {message.content}
          </div>
        ))}
        {pending && (
          <p className="text-sm text-gray-text" aria-live="polite">
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
            className="shrink-0 text-sm font-medium text-brand-blue hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      <form className="flex gap-2" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="chat-input">
          Message
        </label>
        <input
          id="chat-input"
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
          className="rounded-md bg-brand-purple px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#602d78] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
