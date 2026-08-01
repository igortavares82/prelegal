import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GenericDocument } from "@/lib/loadGenericTemplates";
import type { MutualNdaTemplates } from "@/lib/loadTemplates";
import DocumentChat from "./DocumentChat";

const sendResolveChatTurn = vi.fn();
vi.mock("@/lib/resolveChat", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/resolveChat")>();
  return {
    ...actual,
    sendResolveChatTurn: (...args: Parameters<typeof actual.sendResolveChatTurn>) =>
      sendResolveChatTurn(...args),
  };
});

const TEMPLATES_DIR = path.join(import.meta.dirname, "..", "..", "templates");
const mutualNdaTemplates: MutualNdaTemplates = {
  coverPage: readFileSync(path.join(TEMPLATES_DIR, "Mutual-NDA-coverpage.md"), "utf-8"),
  standardTerms: readFileSync(path.join(TEMPLATES_DIR, "Mutual-NDA.md"), "utf-8"),
};

const genericDocuments: GenericDocument[] = [
  {
    slug: "csa",
    name: "Cloud Service Agreement",
    description: "desc",
    template: `<span class="coverpage_link">Customer</span> agrees to the terms.`,
    fieldKeys: ["Customer"],
  },
];

async function resolveVia(slug: string | null, reply = "ok") {
  sendResolveChatTurn.mockResolvedValue({ reply, matched_slug: slug });
  const u = userEvent.setup();
  await u.type(screen.getByLabelText("Message"), "I need a document");
  await u.click(screen.getByRole("button", { name: "Send" }));
}

describe("DocumentChat", () => {
  afterEach(() => {
    sendResolveChatTurn.mockReset();
  });

  it("starts on the resolver chat", () => {
    render(
      <DocumentChat mutualNdaTemplates={mutualNdaTemplates} genericDocuments={genericDocuments} />,
    );
    expect(screen.getByText(/What kind of document do you need/)).toBeInTheDocument();
  });

  it("mounts the Mutual NDA editor once the resolver matches mutual-nda", async () => {
    render(
      <DocumentChat mutualNdaTemplates={mutualNdaTemplates} genericDocuments={genericDocuments} />,
    );
    await resolveVia("mutual-nda");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Agreement details" })).toBeInTheDocument(),
    );
  });

  it("mounts the generic document editor once the resolver matches a generic slug", async () => {
    render(
      <DocumentChat mutualNdaTemplates={mutualNdaTemplates} genericDocuments={genericDocuments} />,
    );
    await resolveVia("csa");

    await waitFor(() =>
      expect(screen.getByText(/Cloud Service Agreement/)).toBeInTheDocument(),
    );
    expect(screen.getByLabelText("Customer")).toBeInTheDocument();
  });

  it("keeps showing the resolver while matched_slug is still null", async () => {
    render(
      <DocumentChat mutualNdaTemplates={mutualNdaTemplates} genericDocuments={genericDocuments} />,
    );
    await resolveVia(null, "Can you tell me more about what you need?");

    expect(
      await screen.findByText("Can you tell me more about what you need?"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
  });
});
