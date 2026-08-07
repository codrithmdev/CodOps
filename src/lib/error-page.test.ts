import { describe, expect, it } from "vitest";

import { renderErrorPage } from "./error-page";

describe("renderErrorPage (SSR 500 smoke)", () => {
  it("returns a complete, friendly HTML document", () => {
    const html = renderErrorPage();
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("This page didn't load");
    expect(html).toContain("Something went wrong on our end");
    expect(html).toMatch(/Try again/);
    expect(html).toMatch(/Go home/);
    expect(html).toContain("</html>");
  });
});
