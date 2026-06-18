import { afterEach, describe, expect, it } from "vitest";

import { readApiAuthToken } from "./cognito-auth";

const AUTH_SESSION_KEY = "stockbrief_auth_session_v1";

describe("readApiAuthToken", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("uses the id token when Cognito returns one", () => {
    window.sessionStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify({
        accessToken: "access-token",
        idToken: "id-token",
        expiresAt: Date.now() + 60_000,
      }),
    );

    expect(readApiAuthToken()).toBe("id-token");
  });

  it("falls back to the access token for legacy sessions", () => {
    window.sessionStorage.setItem(
      AUTH_SESSION_KEY,
      JSON.stringify({
        accessToken: "access-token",
        expiresAt: Date.now() + 60_000,
      }),
    );

    expect(readApiAuthToken()).toBe("access-token");
  });
});
