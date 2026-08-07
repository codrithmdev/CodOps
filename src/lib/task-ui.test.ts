import { describe, expect, it } from "vitest";

import { dueInfo, initials, PRIORITY_LABEL, PRIORITY_STYLES } from "./task-ui";

describe("initials", () => {
  it("builds up-to-two uppercase initials", () => {
    expect(initials("Amara Dey")).toBe("AD");
    expect(initials("Leo Marsh III")).toBe("LM");
    expect(initials(null)).toBe("?");
    expect(initials(null, "–")).toBe("–");
  });
});

describe("PRIORITY_LABEL / PRIORITY_STYLES", () => {
  it("labels every priority", () => {
    expect(PRIORITY_LABEL).toMatchObject({
      low: "Low",
      medium: "Medium",
      high: "High",
      critical: "Critical",
    });
  });

  it("styles every priority", () => {
    const keys = Object.keys(PRIORITY_STYLES) as (keyof typeof PRIORITY_STYLES)[];
    for (const key of keys) {
      expect(PRIORITY_STYLES[key]).toBeTruthy();
    }
  });
});

describe("dueInfo", () => {
  it("flags overdue for an unfinished task past its due date", () => {
    const info = dueInfo("2020-01-01", "in_progress");
    expect(info?.overdue).toBe(true);
  });

  it("returns due label for completed tasks without overdue flag", () => {
    const info = dueInfo("2020-01-01", "completed");
    expect(info?.overdue).toBe(false);
  });

  it("returns null when there is no due date", () => {
    expect(dueInfo(null, "backlog")).toBeNull();
  });
});
