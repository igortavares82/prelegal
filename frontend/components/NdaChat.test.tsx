import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatError } from "@/lib/chat";
import { createEmptyFormData } from "@/lib/types";
import NdaChat from "./NdaChat";

const sendChatTurn = vi.fn();
vi.mock("@/lib/chat", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/chat")>();
  return {
    ...actual,
    sendChatTurn: (...args: Parameters<typeof actual.sendChatTurn>) =>
      sendChatTurn(...args),
  };
});

describe("NdaChat", () => {
  afterEach(() => {
    sendChatTurn.mockReset();
  });

  it("shows a seeded greeting before any messages are sent", () => {
    render(<NdaChat fields={createEmptyFormData()} onFieldsChange={vi.fn()} />);
    expect(screen.getByText(/I'll help you put together your Mutual NDA/)).toBeInTheDocument();
  });

  it("sends the full history and current fields, then appends the reply and updates fields", async () => {
    const onFieldsChange = vi.fn();
    const fields = createEmptyFormData();
    sendChatTurn.mockResolvedValue({
      reply: "Got it. What's the effective date?",
      fields: { ...fields, purpose: "Evaluating a partnership" },
      is_complete: false,
    });
    const u = userEvent.setup();

    render(<NdaChat fields={fields} onFieldsChange={onFieldsChange} />);
    await u.type(screen.getByLabelText("Message"), "Evaluating a partnership");
    await u.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(sendChatTurn).toHaveBeenCalledWith(
        [
          expect.objectContaining({ role: "assistant" }),
          { role: "user", content: "Evaluating a partnership" },
        ],
        fields,
      ),
    );
    expect(await screen.findByText("Got it. What's the effective date?")).toBeInTheDocument();
    expect(onFieldsChange).toHaveBeenCalledWith({
      ...fields,
      purpose: "Evaluating a partnership",
    });
  });

  it("clears the input after sending", async () => {
    sendChatTurn.mockResolvedValue({
      reply: "Thanks!",
      fields: createEmptyFormData(),
      is_complete: false,
    });
    const u = userEvent.setup();

    render(<NdaChat fields={createEmptyFormData()} onFieldsChange={vi.fn()} />);
    const input = screen.getByLabelText("Message");
    await u.type(input, "Hello");
    await u.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("shows an error with a retry option when the request fails, without losing the user's message", async () => {
    sendChatTurn.mockRejectedValue(new ChatError("The AI assistant is temporarily unavailable. Please try again."));
    const u = userEvent.setup();

    render(<NdaChat fields={createEmptyFormData()} onFieldsChange={vi.fn()} />);
    await u.type(screen.getByLabelText("Message"), "Evaluating a partnership");
    await u.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The AI assistant is temporarily unavailable. Please try again.",
    );
    expect(screen.getByText("Evaluating a partnership")).toBeInTheDocument();

    sendChatTurn.mockResolvedValue({
      reply: "Got it.",
      fields: createEmptyFormData(),
      is_complete: false,
    });
    await u.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Got it.")).toBeInTheDocument();
    expect(sendChatTurn).toHaveBeenCalledTimes(2);
  });

  it("returns focus to the message input once a turn resolves", async () => {
    sendChatTurn.mockResolvedValue({
      reply: "Thanks!",
      fields: createEmptyFormData(),
      is_complete: false,
    });
    const u = userEvent.setup();

    render(<NdaChat fields={createEmptyFormData()} onFieldsChange={vi.fn()} />);
    const input = screen.getByLabelText("Message");
    await u.type(input, "Hello");
    await u.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(input).toHaveFocus());
  });

  it("disables the send button while a request is pending", async () => {
    let resolveTurn: (value: unknown) => void = () => {};
    sendChatTurn.mockReturnValue(
      new Promise((resolve) => {
        resolveTurn = resolve;
      }),
    );
    const u = userEvent.setup();

    render(<NdaChat fields={createEmptyFormData()} onFieldsChange={vi.fn()} />);
    const input = screen.getByLabelText("Message");
    await u.type(input, "Hi");
    await u.click(screen.getByRole("button", { name: "Send" }));

    expect(input).toBeDisabled();
    resolveTurn({ reply: "ok", fields: createEmptyFormData(), is_complete: false });
    await waitFor(() => expect(input).toBeEnabled());
  });
});
