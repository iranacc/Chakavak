import { describe, test, expect } from "vitest";
import { APP_CONFIG } from "../../src/settings/appConfig.js";
import clientPkg from "../../package.json";

describe("APP_CONFIG appVersion", () => {
  test("exports build-time version string", () => {
    expect(typeof APP_CONFIG.appVersion).toBe("string");
    expect(APP_CONFIG.appVersion).toBe(clientPkg.version);
  });
});
