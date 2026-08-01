import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import GenericForm from "./GenericForm";

describe("GenericForm", () => {
  it("renders one labeled input per field key", () => {
    render(
      <GenericForm
        fieldKeys={["Customer", "Effective Date"]}
        values={{ Customer: "Acme Corp" }}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Customer")).toHaveValue("Acme Corp");
    expect(screen.getByLabelText("Effective Date")).toHaveValue("");
  });

  it("calls onChange with the updated values when a field is edited", async () => {
    const onChange = vi.fn();
    const u = userEvent.setup();
    render(<GenericForm fieldKeys={["Customer"]} values={{}} onChange={onChange} />);

    await u.type(screen.getByLabelText("Customer"), "A");

    expect(onChange).toHaveBeenLastCalledWith({ Customer: "A" });
  });

  it("disables every input when disabled", () => {
    render(
      <GenericForm fieldKeys={["Customer"]} values={{}} onChange={vi.fn()} disabled />,
    );
    expect(screen.getByLabelText("Customer")).toBeDisabled();
  });
});
