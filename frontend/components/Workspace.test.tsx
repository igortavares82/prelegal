import { readFileSync } from "node:fs";
import path from "node:path";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SavedDocumentSummary } from "@/lib/documents";
import type { GenericDocument } from "@/lib/loadGenericTemplates";
import type { MutualNdaTemplates } from "@/lib/loadTemplates";
import { renderWithAuth } from "@/test/authTestUtils";
import Workspace from "./Workspace";

const sendResolveChatTurn = vi.fn();
vi.mock("@/lib/resolveChat", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/resolveChat")>();
  return {
    ...actual,
    sendResolveChatTurn: (...args: Parameters<typeof actual.sendResolveChatTurn>) =>
      sendResolveChatTurn(...args),
  };
});

const listDocuments = vi.fn();
const getDocument = vi.fn();
vi.mock("@/lib/documents", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/documents")>();
  return {
    ...actual,
    listDocuments: (...args: Parameters<typeof actual.listDocuments>) =>
      listDocuments(...args),
    getDocument: (...args: Parameters<typeof actual.getDocument>) => getDocument(...args),
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

const documentNames = { "mutual-nda": "Mutual Non-Disclosure Agreement", csa: "Cloud Service Agreement" };

function renderWorkspace() {
  return renderWithAuth(
    <Workspace
      mutualNdaTemplates={mutualNdaTemplates}
      genericDocuments={genericDocuments}
      documentNames={documentNames}
      documentCount={2}
    />,
  );
}

describe("Workspace", () => {
  afterEach(() => {
    sendResolveChatTurn.mockReset();
    listDocuments.mockReset();
    getDocument.mockReset();
  });

  it("starts on the resolver chat for a new document", () => {
    renderWorkspace();
    expect(screen.getByText(/What kind of document do you need/)).toBeInTheDocument();
  });

  it("switches to the My Documents list and back to a new document", async () => {
    listDocuments.mockResolvedValue([]);
    const u = userEvent.setup();

    renderWorkspace();
    await u.click(screen.getByRole("button", { name: "My documents" }));
    expect(await screen.findByText(/haven't saved any documents yet/)).toBeInTheDocument();

    await u.click(screen.getByRole("button", { name: "+ New document" }));
    expect(screen.getByText(/What kind of document do you need/)).toBeInTheDocument();
  });

  it("reopens a saved generic document straight into its editor, pre-filled", async () => {
    const summary: SavedDocumentSummary = {
      id: 5,
      document_slug: "csa",
      title: "Acme CSA",
      created_at: "2026-08-01T00:00:00",
    };
    listDocuments.mockResolvedValue([summary]);
    getDocument.mockResolvedValue({ ...summary, data: { Customer: "Acme Corp" } });
    const u = userEvent.setup();

    renderWorkspace();
    await u.click(screen.getByRole("button", { name: "My documents" }));
    await u.click(await screen.findByText("Acme CSA"));

    await waitFor(() => expect(screen.getByLabelText("Customer")).toHaveValue("Acme Corp"));
    expect(screen.getByText(/Cloud Service Agreement/)).toBeInTheDocument();
  });

  it("shows an error if reopening a saved document fails", async () => {
    const summary: SavedDocumentSummary = {
      id: 5,
      document_slug: "csa",
      title: "Acme CSA",
      created_at: "2026-08-01T00:00:00",
    };
    listDocuments.mockResolvedValue([summary]);
    getDocument.mockRejectedValue(new Error("network error"));
    const u = userEvent.setup();

    renderWorkspace();
    await u.click(screen.getByRole("button", { name: "My documents" }));
    await u.click(await screen.findByText("Acme CSA"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't open that document. Please try again.",
    );
  });
});
