import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { createEmptyFormData, type NdaFormData } from "@/lib/types";
import NdaForm from "./NdaForm";

/**
 * NdaForm is a fully controlled component (state lives in the parent).
 * This harness mirrors how NdaEditor actually uses it, so interactions
 * (typing, clicking a radio) are reflected back into the rendered value —
 * exercising the real controlled-component data flow, not just event firing.
 */
function ControlledNdaForm() {
  const [data, setData] = useState<NdaFormData>(createEmptyFormData);
  return <NdaForm data={data} onChange={setData} />;
}

describe("NdaForm", () => {
  it("renders all top-level agreement fields", () => {
    render(<ControlledNdaForm />);
    expect(screen.getByLabelText("Purpose")).toBeInTheDocument();
    expect(screen.getByLabelText("Effective Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Governing Law (state)")).toBeInTheDocument();
    expect(screen.getByLabelText("Jurisdiction")).toBeInTheDocument();
    expect(screen.getByLabelText(/MNDA Modifications/)).toBeInTheDocument();
  });

  it("renders both party sections with all six fields each", () => {
    render(<ControlledNdaForm />);
    for (const title of ["Party 1", "Party 2"]) {
      const section = screen.getByRole("heading", { name: title }).closest("div")!;
      expect(within(section).getByLabelText("Signature (typed name)")).toBeInTheDocument();
      expect(within(section).getByLabelText("Print Name")).toBeInTheDocument();
      expect(within(section).getByLabelText("Title")).toBeInTheDocument();
      expect(within(section).getByLabelText("Company")).toBeInTheDocument();
      expect(within(section).getByLabelText(/Notice Address/)).toBeInTheDocument();
      expect(within(section).getByLabelText("Date")).toBeInTheDocument();
    }
  });

  it("updates purpose as the user types", async () => {
    const user = userEvent.setup();
    render(<ControlledNdaForm />);
    const purpose = screen.getByLabelText("Purpose");
    await user.type(purpose, "Evaluating a partnership.");
    expect(purpose).toHaveValue("Evaluating a partnership.");
  });

  it("updates governing law and jurisdiction independently", async () => {
    const user = userEvent.setup();
    render(<ControlledNdaForm />);
    await user.type(screen.getByLabelText("Governing Law (state)"), "Delaware");
    await user.type(
      screen.getByLabelText("Jurisdiction"),
      "courts located in New Castle, DE",
    );
    expect(screen.getByLabelText("Governing Law (state)")).toHaveValue("Delaware");
    expect(screen.getByLabelText("Jurisdiction")).toHaveValue(
      "courts located in New Castle, DE",
    );
  });

  describe("MNDA Term", () => {
    it('defaults to "Expires" checked with the years input enabled', () => {
      render(<ControlledNdaForm />);
      const fieldset = screen.getByRole("group", { name: "MNDA Term" });
      expect(within(fieldset).getByRole("radio", { name: "Expires" })).toBeChecked();
      expect(
        within(fieldset).getByRole("radio", {
          name: "Continues until terminated in accordance with the terms of the MNDA",
        }),
      ).not.toBeChecked();
    });

    it("the years input has its own accessible name, independent of the radio's label (accessibility regression)", () => {
      render(<ControlledNdaForm />);
      const fieldset = screen.getByRole("group", { name: "MNDA Term" });
      // Regression test: the years <input> was previously nested inside the
      // radio's <label>, which meant a <label> contained two labelable
      // controls — invalid HTML, and the number input had no accessible
      // name at all. getByLabelText only succeeds if the association is
      // correct via its own dedicated (sr-only) label.
      const yearsInput = within(fieldset).getByLabelText("Number of years");
      expect(yearsInput).toHaveAttribute("type", "number");
      // And it must NOT be the same element as the "Expires" radio.
      expect(within(fieldset).getByRole("radio", { name: "Expires" })).not.toBe(
        yearsInput,
      );
    });

    it("disables the years input when 'Continues' is selected, and re-enables it when 'Expires' is reselected", async () => {
      const user = userEvent.setup();
      render(<ControlledNdaForm />);
      const fieldset = screen.getByRole("group", { name: "MNDA Term" });
      const yearsInput = within(fieldset).getByLabelText("Number of years");
      const continuesRadio = within(fieldset).getByRole("radio", {
        name: "Continues until terminated in accordance with the terms of the MNDA",
      });
      const expiresRadio = within(fieldset).getByRole("radio", { name: "Expires" });

      expect(yearsInput).toBeEnabled();

      await user.click(continuesRadio);
      expect(continuesRadio).toBeChecked();
      expect(expiresRadio).not.toBeChecked();
      expect(yearsInput).toBeDisabled();

      await user.click(expiresRadio);
      expect(expiresRadio).toBeChecked();
      expect(yearsInput).toBeEnabled();
    });

    it("updates the year count as the user types", async () => {
      const user = userEvent.setup();
      render(<ControlledNdaForm />);
      const fieldset = screen.getByRole("group", { name: "MNDA Term" });
      const yearsInput = within(fieldset).getByLabelText("Number of years");
      await user.clear(yearsInput);
      await user.type(yearsInput, "3");
      expect(yearsInput).toHaveValue(3);
    });
  });

  describe("Term of Confidentiality", () => {
    it('defaults to "Expires" checked with the years input enabled', () => {
      render(<ControlledNdaForm />);
      const fieldset = screen
        .getByRole("group", { name: "Term of Confidentiality" });
      expect(within(fieldset).getByRole("radio", { name: "Expires" })).toBeChecked();
      expect(
        within(fieldset).getByRole("radio", { name: "In perpetuity" }),
      ).not.toBeChecked();
    });

    it("disables the years input when 'In perpetuity' is selected", async () => {
      const user = userEvent.setup();
      render(<ControlledNdaForm />);
      const fieldset = screen.getByRole("group", { name: "Term of Confidentiality" });
      const yearsInput = within(fieldset).getByLabelText("Number of years");
      const perpetuityRadio = within(fieldset).getByRole("radio", {
        name: "In perpetuity",
      });

      expect(yearsInput).toBeEnabled();
      await user.click(perpetuityRadio);
      expect(perpetuityRadio).toBeChecked();
      expect(yearsInput).toBeDisabled();
    });
  });

  describe("party sections", () => {
    it("updates Party 1 fields without affecting Party 2", async () => {
      const user = userEvent.setup();
      render(<ControlledNdaForm />);
      const party1 = screen.getByRole("heading", { name: "Party 1" }).closest("div")!;
      const party2 = screen.getByRole("heading", { name: "Party 2" }).closest("div")!;

      await user.type(within(party1).getByLabelText("Print Name"), "Jane Smith");

      expect(within(party1).getByLabelText("Print Name")).toHaveValue("Jane Smith");
      expect(within(party2).getByLabelText("Print Name")).toHaveValue("");
    });

    it("updates Party 2 fields without affecting Party 1", async () => {
      const user = userEvent.setup();
      render(<ControlledNdaForm />);
      const party1 = screen.getByRole("heading", { name: "Party 1" }).closest("div")!;
      const party2 = screen.getByRole("heading", { name: "Party 2" }).closest("div")!;

      await user.type(within(party2).getByLabelText("Company"), "Beta LLC");

      expect(within(party2).getByLabelText("Company")).toHaveValue("Beta LLC");
      expect(within(party1).getByLabelText("Company")).toHaveValue("");
    });
  });
});
