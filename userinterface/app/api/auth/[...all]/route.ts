import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/lib/auth";

type AuthMethod = "GET" | "POST";

export function handleAuthRequest(method: AuthMethod, request: Request): Promise<Response> {
  return toNextJsHandler(getAuth())[method](request);
}

export const GET = (request: Request) => handleAuthRequest("GET", request);
export const POST = (request: Request) => handleAuthRequest("POST", request);
