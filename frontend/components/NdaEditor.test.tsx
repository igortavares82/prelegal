import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { MutualNdaTemplates } from "@/lib/loadTemplates";
import NdaEditor from "./NdaEditor";

// NdaEditor wires NdaForm's state to NdaPreview's markdown prop via
// buildMutualNdaDocument — this is the one place that integration is
// exercised outside of a full E2E run. @react-pdf/renderer isn't relevant
// here (no download interaction in these tests) but importing NdaPreview
// pulls in lib/mutualNdaPdf.tsx, which calls StyleSheet.create() at module
// scope, so the real module needs to load — no mocking required, just
// letting it load normally.

const TEMPLATES_DIR = path.join(import.meta.dirname, "..", "..", "templates");
const templates: MutualNdaTemplates = {
  coverPage: readFileSync(path.join(TEMPLATES_DIR, "Mutual-NDA-coverpage.md"), "utf-8"),
  standardTerms: readFileSync(path.join(TEMPLATES_DIR, "Mutual-NDA.md"), "utf-8"),
};

describe("NdaEditor", () => {
  it("renders both the form and the live preview from the given templates", () => {
    render(<NdaEditor templates={templates} />);
    expect(screen.getByRole("heading", { name: "Agreement details" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Preview" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Mutual Non-Disclosure Agreement" }),
    ).toBeInTheDocument();
  });

  it("reflects a typed Purpose in the live preview", async () => {
    const user = userEvent.setup();
    render(<NdaEditor templates={templates} />);

    await user.type(
      screen.getByLabelText("Purpose"),
      "Evaluating a joint marketing campaign",
    );

    // Scoped to the preview panel: the same text is also still visible
    // verbatim in the form's <textarea>, which would otherwise match too.
    const previewSection = screen.getByRole("heading", { name: "Preview" })
      .parentElement!.parentElement as HTMLElement;
    expect(
      await within(previewSection).findByText(/Evaluating a joint marketing campaign/),
    ).toBeInTheDocument();
  });

  it("reflects the MNDA Term radio selection in the live preview", async () => {
    const user = userEvent.setup();
    render(<NdaEditor templates={templates} />);

    const continuesRadio = screen.getByRole("radio", {
      name: "Continues until terminated in accordance with the terms of the MNDA",
    });
    await user.click(continuesRadio);

    const previewHeading = screen.getByRole("heading", { name: "MNDA Term" });
    const previewList = previewHeading.nextElementSibling as HTMLElement;
    expect(previewList).toHaveTextContent(
      "Continues until terminated in accordance with the terms of the MNDA",
    );
  });

  it("reflects Party 1's name in the live preview's signature table", async () => {
    const user = userEvent.setup();
    render(<NdaEditor templates={templates} />);

    const party1Section = screen
      .getByRole("heading", { name: "Party 1" })
      .closest("div")!;
    await user.type(within(party1Section).getByLabelText("Print Name"), "Jane Smith");

    const table = screen.getByRole("table");
    expect(table).toHaveTextContent("Jane Smith");
  });

  it("shows an error message in the preview instead of crashing if document assembly throws", () => {
    // buildMutualNdaDocument throws when an expected anchor is missing (see
    // fillCoverPage.test.ts); NdaEditor's useMemo catches that internally
    // and renders a fallback message rather than letting it crash the page.
    const brokenTemplates: MutualNdaTemplates = {
      coverPage: templates.coverPage.replace("[Today’s date]", "corrupted"),
      standardTerms: templates.standardTerms,
    };
    render(<NdaEditor templates={brokenTemplates} />);
    expect(screen.getByText(/Unable to render document/)).toBeInTheDocument();
  });
});
