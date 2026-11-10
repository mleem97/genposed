import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, getAuth, nextHandler } = vi.hoisted(() => ({
  auth: { handler: vi.fn() },
  getAuth: vi.fn(),
  nextHandler: vi.fn(),
}));
vi.mock("../lib/auth", () => ({ getAuth }));
vi.mock("better-auth/next-js", () => ({ toNextJsHandler: nextHandler }));

import { GET, POST } from "../app/api/auth/[...all]/route";

describe("Better Auth route handler", () => {
  beforeEach(() => {
    getAuth.mockReturnValue(auth);
    nextHandler.mockReturnValue({
      GET: vi.fn(async () => new Response("get")),
      POST: vi.fn(async () => new Response("post")),
    });
  });

  it("forwards GET and POST requests through the Better Auth Next adapter", async () => {
    const getResponse = await GET(new Request("https://genposed.example/api/auth/session"));
    const postResponse = await POST(new Request("https://genposed.example/api/auth/sign-in/email", { method: "POST" }));
    expect(await getResponse.text()).toBe("get");
    expect(await postResponse.text()).toBe("post");
    expect(nextHandler).toHaveBeenCalledTimes(2);
    expect(getAuth).toHaveBeenCalledTimes(2);
  });
});
