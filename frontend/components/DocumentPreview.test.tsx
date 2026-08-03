import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentsError } from "@/lib/documents";
import { renderWithAuth, testAuthSession } from "@/test/authTestUtils";
import DocumentPreview from "./DocumentPreview";

const saveDocument = vi.fn();
vi.mock("@/lib/documents", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/documents")>();
  return {
    ...actual,
    saveDocument: (...args: Parameters<typeof actual.saveDocument>) => saveDocument(...args),
  };
});

const defaultProps = {
  markdown: "# Doc\n\nSome body text.",
  // Tests below never click Download, so pdf() never actually receives
  // this — it just needs to satisfy the prop type.
  pdfDocument:
    <></> as unknown as NonNullable<Parameters<typeof import("@react-pdf/renderer").pdf>[0]>,
  fileName: "Doc.pdf",
  documentSlug: "csa",
  defaultTitle: "Cloud Service Agreement – 8/1/2026",
  data: { Customer: "Acme Corp" },
};

describe("DocumentPreview", () => {
  afterEach(() => {
    saveDocument.mockReset();
  });

  it("renders the markdown document and a legal disclaimer", () => {
    renderWithAuth(<DocumentPreview {...defaultProps} />);
    expect(screen.getByText("Some body text.")).toBeInTheDocument();
    expect(screen.getByText(/does not constitute legal advice/)).toBeInTheDocument();
  });

  it("pre-fills the document name with the given default title", () => {
    renderWithAuth(<DocumentPreview {...defaultProps} />);
    expect(screen.getByLabelText("Document name")).toHaveValue(defaultProps.defaultTitle);
  });

  it("saves the document with the current title, slug, and data on Save", async () => {
    saveDocument.mockResolvedValue({
      id: 1,
      document_slug: "csa",
      title: "My CSA",
      data: defaultProps.data,
      created_at: "2026-08-01T00:00:00",
    });
    const user = userEvent.setup();

    renderWithAuth(<DocumentPreview {...defaultProps} />);
    const titleInput = screen.getByLabelText("Document name");
    await user.clear(titleInput);
    await user.type(titleInput, "My CSA");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(saveDocument).toHaveBeenCalledWith(
        testAuthSession.token,
        "csa",
        "My CSA",
        defaultProps.data,
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Saved as “My CSA”");
  });

  it("refuses to save with a blank title", async () => {
    const user = userEvent.setup();

    renderWithAuth(<DocumentPreview {...defaultProps} />);
    await user.clear(screen.getByLabelText("Document name"));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Give the document a name before saving.",
    );
    expect(saveDocument).not.toHaveBeenCalled();
  });

  it("shows an error message when saving fails", async () => {
    saveDocument.mockRejectedValue(new DocumentsError("Something went wrong with your saved documents. Please try again."));
    const user = userEvent.setup();

    renderWithAuth(<DocumentPreview {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong with your saved documents. Please try again.",
    );
  });
});
