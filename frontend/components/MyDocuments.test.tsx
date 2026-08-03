import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentsError, type SavedDocumentSummary } from "@/lib/documents";
import { renderWithAuth, testAuthSession } from "@/test/authTestUtils";
import MyDocuments from "./MyDocuments";

const listDocuments = vi.fn();
vi.mock("@/lib/documents", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/documents")>();
  return {
    ...actual,
    listDocuments: (...args: Parameters<typeof actual.listDocuments>) =>
      listDocuments(...args),
  };
});

const documentNames = { "mutual-nda": "Mutual Non-Disclosure Agreement", csa: "Cloud Service Agreement" };

const summaries: SavedDocumentSummary[] = [
  { id: 2, document_slug: "csa", title: "Acme CSA", created_at: "2026-08-01T12:00:00" },
  { id: 1, document_slug: "mutual-nda", title: "Acme NDA", created_at: "2026-07-30T09:00:00" },
];

describe("MyDocuments", () => {
  afterEach(() => {
    listDocuments.mockReset();
  });

  it("shows a loading state, then the fetched documents", async () => {
    listDocuments.mockResolvedValue(summaries);

    renderWithAuth(<MyDocuments documentNames={documentNames} onOpen={vi.fn()} />);
    expect(screen.getByText("Loading your documents…")).toBeInTheDocument();

    expect(await screen.findByText("Acme CSA")).toBeInTheDocument();
    expect(screen.getByText("Acme NDA")).toBeInTheDocument();
    expect(screen.getByText(/Cloud Service Agreement/)).toBeInTheDocument();
    expect(listDocuments).toHaveBeenCalledWith(testAuthSession.token);
  });

  it("shows an empty state when there are no saved documents", async () => {
    listDocuments.mockResolvedValue([]);

    renderWithAuth(<MyDocuments documentNames={documentNames} onOpen={vi.fn()} />);

    expect(await screen.findByText(/haven't saved any documents yet/)).toBeInTheDocument();
  });

  it("shows an error message if listing fails", async () => {
    listDocuments.mockRejectedValue(new DocumentsError("Couldn't load your documents."));

    renderWithAuth(<MyDocuments documentNames={documentNames} onOpen={vi.fn()} />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load your documents.");
  });

  it("calls onOpen with the clicked document's summary", async () => {
    listDocuments.mockResolvedValue(summaries);
    const onOpen = vi.fn();
    const u = userEvent.setup();

    renderWithAuth(<MyDocuments documentNames={documentNames} onOpen={onOpen} />);
    await u.click(await screen.findByText("Acme CSA"));

    await waitFor(() => expect(onOpen).toHaveBeenCalledWith(summaries[0]));
  });
});
