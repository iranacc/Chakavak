import { describe, test, expect } from "vitest";
import { APP_CONFIG } from "../../src/settings/appConfig.js";

describe("APP_CONFIG appVersion", () => {
  test("exports build-time version string", () => {
    expect(typeof APP_CONFIG.appVersion).toBe("string");
    expect(APP_CONFIG.appVersion).toBe("0.27.1");
  });
});
