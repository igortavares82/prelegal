import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// @testing-library/react doesn't auto-register cleanup for Vitest (that
// requires either `test.globals: true` or this explicit hook) — without it,
// each render() call in a test file accumulates in the jsdom document
// instead of replacing the previous one, causing "multiple elements found"
// errors in later tests within the same file.
afterEach(() => {
  cleanup();
});
