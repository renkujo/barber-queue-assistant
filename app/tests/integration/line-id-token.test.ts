import { describe, expect, it, vi } from "vitest";
import { verifyLineIdToken } from "@/lib/line/line-id-token";

const liffId = "1234567890-test-liff";
const validResponse = {
  aud: "1234567890",
  exp: Math.floor(Date.now() / 1000) + 600,
  iss: "https://access.line.me",
  sub: "U-verified-line-user",
};

describe("LINE ID token verification", () => {
  it("derives the LINE user ID only from a successful LINE verification response", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      void _input;
      void _init;
      return new Response(JSON.stringify(validResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    const fetchImpl = fetchMock as typeof fetch;

    await expect(verifyLineIdToken("signed-line-id-token", { fetchImpl, liffId })).resolves.toBe(validResponse.sub);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("https://api.line.me/oauth2/v2.1/verify");
    expect(init?.method).toBe("POST");
    expect(String(init?.body)).toContain("id_token=signed-line-id-token");
    expect(String(init?.body)).toContain("client_id=1234567890");
  });

  it.each([
    ["rejected response", new Response("{}", { status: 401 })],
    ["wrong audience", new Response(JSON.stringify({ ...validResponse, aud: "999" }), { status: 200 })],
    ["expired token", new Response(JSON.stringify({ ...validResponse, exp: Math.floor(Date.now() / 1000) - 1 }), { status: 200 })],
    ["missing subject", new Response(JSON.stringify({ ...validResponse, sub: "" }), { status: 200 })],
  ])("rejects %s", async (_label, response) => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      void _input;
      void _init;
      return response;
    }) as typeof fetch;

    await expect(verifyLineIdToken("signed-line-id-token", { fetchImpl, liffId })).rejects.toThrow();
  });
});
