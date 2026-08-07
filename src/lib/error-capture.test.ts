import { describe, expect, it } from "vitest";

import { describeError } from "./error-capture";

describe("describeError (SSR error path)", () => {
  it("keeps the message and stack of a plain error", () => {
    const err = new Error("boom");
    const out = describeError(err);
    expect(out).toContain("boom");
    expect(out).toContain("at ");
  });

  it("appends a numeric status when present", () => {
    const err = new Error("forbidden") as Error & { status?: number };
    err.status = 403;
    expect(describeError(err)).toContain("(status 403)");
  });

  it("walks the cause chain", () => {
    const root = new Error("root cause");
    const wrapper = new Error("wrapped", { cause: root });
    const out = describeError(wrapper);
    expect(out).toContain("wrapped");
    expect(out).toContain("root cause");
  });

  it("stringifies non-error values", () => {
    expect(describeError("plain string")).toBe("plain string");
  });
});
