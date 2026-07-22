import type { pdf as PdfFn } from "@react-pdf/renderer";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import NdaPreview from "./NdaPreview";

// NdaPreview's job is to orchestrate PDF generation (loading state, error
// handling, triggering the download) — the PDF's actual byte-level content
// is already covered by lib/mutualNdaPdf.test.tsx. Mocking @react-pdf/renderer
// here keeps this test focused on NdaPreview's own logic and avoids running
// the full PDF pipeline (which needs Node, not jsdom) inside a component test.
const toBlob = vi.fn();
// Stub every member of pdf()'s return shape (not just toBlob, which is all
// NdaPreview actually calls) so this satisfies ReturnType<typeof pdf> for
// tsc, without resorting to `any`.
const pdfInstance: ReturnType<typeof PdfFn> = {
  container: null,
  isDirty: () => false,
  toString: () => "",
  toBlob,
  toBuffer: vi.fn(),
  on: vi.fn(),
  updateContainer: vi.fn(),
  removeListener: vi.fn(),
};
vi.mock(import("@react-pdf/renderer"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    pdf: vi.fn(() => pdfInstance),
  };
});

describe("NdaPreview", () => {
  let clickSpy: ReturnType<typeof vi.spyOn>;

  afterEach(() => {
    // vi.spyOn on an already-spied method reuses the existing spy instead
    // of creating a fresh one, so call counts would otherwise accumulate
    // across tests in this file.
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    toBlob.mockReset();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:mock-url"),
      revokeObjectURL: vi.fn(),
    });
    // jsdom doesn't implement navigation, so an unmocked <a href="blob:...">
    // click() logs a noisy "Not implemented" warning. The component only
    // uses the click to trigger a browser download, which isn't meaningful
    // in jsdom anyway — stub it out and assert it was called instead.
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
  });

  it("renders the assembled markdown document", () => {
    render(<NdaPreview document={"# Mutual NDA\n\nSome body text."} />);
    expect(screen.getByRole("heading", { name: "Mutual NDA" })).toBeInTheDocument();
    expect(screen.getByText("Some body text.")).toBeInTheDocument();
  });

  it('shows "Generating…" while the PDF is being built, then restores the button', async () => {
    const user = userEvent.setup();
    let resolveBlob!: (blob: Blob) => void;
    toBlob.mockReturnValue(
      new Promise<Blob>((resolve) => {
        resolveBlob = resolve;
      }),
    );

    render(<NdaPreview document="# Doc" />);
    const button = screen.getByRole("button", { name: "Download .pdf" });
    await user.click(button);

    expect(await screen.findByRole("button", { name: "Generating…" })).toBeDisabled();

    resolveBlob(new Blob(["fake-pdf"], { type: "application/pdf" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Download .pdf" })).toBeEnabled(),
    );
  });

  it("triggers a download of Mutual-NDA.pdf when generation succeeds", async () => {
    const user = userEvent.setup();
    toBlob.mockResolvedValue(new Blob(["fake-pdf"], { type: "application/pdf" }));

    render(<NdaPreview document="# Doc" />);
    await user.click(screen.getByRole("button", { name: "Download .pdf" }));

    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("shows an error message and re-enables the button when PDF generation fails", async () => {
    const user = userEvent.setup();
    toBlob.mockRejectedValue(new Error("Font loading failed"));

    render(<NdaPreview document="# Doc" />);
    await user.click(screen.getByRole("button", { name: "Download .pdf" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Font loading failed");
    expect(screen.getByRole("button", { name: "Download .pdf" })).toBeEnabled();
  });

  it("clears a previous error on a subsequent successful attempt", async () => {
    const user = userEvent.setup();
    toBlob.mockRejectedValueOnce(new Error("Font loading failed"));

    render(<NdaPreview document="# Doc" />);
    const button = screen.getByRole("button", { name: "Download .pdf" });

    await user.click(button);
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    toBlob.mockResolvedValueOnce(new Blob(["fake-pdf"], { type: "application/pdf" }));
    await user.click(button);

    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });
});
