import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatError } from "@/lib/chat";
import GenericChat from "./GenericChat";

const sendGenericChatTurn = vi.fn();
vi.mock("@/lib/genericChat", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/genericChat")>();
  return {
    ...actual,
    sendGenericChatTurn: (...args: Parameters<typeof actual.sendGenericChatTurn>) =>
      sendGenericChatTurn(...args),
  };
});

const fieldKeys = ["Customer", "Effective Date"];

describe("GenericChat", () => {
  afterEach(() => {
    sendGenericChatTurn.mockReset();
  });

  it("shows a greeting mentioning the document name before any messages are sent", () => {
    render(
      <GenericChat
        documentSlug="csa"
        documentName="Cloud Service Agreement"
        fieldKeys={fieldKeys}
        fields={{}}
        onFieldsChange={vi.fn()}
      />,
    );
    expect(screen.getByText(/Cloud Service Agreement/)).toBeInTheDocument();
  });

  it("sends the field keys, history, and current fields, then appends the reply and updates fields", async () => {
    const onFieldsChange = vi.fn();
    sendGenericChatTurn.mockResolvedValue({
      reply: "Got it. What's the effective date?",
      fields: { Customer: "Acme Corp", "Effective Date": "" },
      is_complete: false,
    });
    const u = userEvent.setup();

    render(
      <GenericChat
        documentSlug="csa"
        documentName="Cloud Service Agreement"
        fieldKeys={fieldKeys}
        fields={{}}
        onFieldsChange={onFieldsChange}
      />,
    );
    await u.type(screen.getByLabelText("Message"), "Acme Corp is the customer");
    await u.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(sendGenericChatTurn).toHaveBeenCalledWith(
        "csa",
        fieldKeys,
        [
          expect.objectContaining({ role: "assistant" }),
          { role: "user", content: "Acme Corp is the customer" },
        ],
        {},
      ),
    );
    expect(await screen.findByText("Got it. What's the effective date?")).toBeInTheDocument();
    expect(onFieldsChange).toHaveBeenCalledWith({ Customer: "Acme Corp", "Effective Date": "" });
  });

  it("returns focus to the message input once a turn resolves", async () => {
    sendGenericChatTurn.mockResolvedValue({
      reply: "Thanks!",
      fields: {},
      is_complete: false,
    });
    const u = userEvent.setup();

    render(
      <GenericChat
        documentSlug="csa"
        documentName="Cloud Service Agreement"
        fieldKeys={fieldKeys}
        fields={{}}
        onFieldsChange={vi.fn()}
      />,
    );
    const input = screen.getByLabelText("Message");
    await u.type(input, "Hello");
    await u.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(input).toHaveFocus());
  });

  it("shows an error with a retry option when the request fails", async () => {
    sendGenericChatTurn.mockRejectedValue(
      new ChatError("The AI assistant is temporarily unavailable. Please try again."),
    );
    const u = userEvent.setup();

    render(
      <GenericChat
        documentSlug="csa"
        documentName="Cloud Service Agreement"
        fieldKeys={fieldKeys}
        fields={{}}
        onFieldsChange={vi.fn()}
      />,
    );
    await u.type(screen.getByLabelText("Message"), "hi");
    await u.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The AI assistant is temporarily unavailable. Please try again.",
    );

    sendGenericChatTurn.mockResolvedValue({ reply: "Got it.", fields: {}, is_complete: false });
    await u.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Got it.")).toBeInTheDocument();
  });
});
