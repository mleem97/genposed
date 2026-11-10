import { expect, it } from "vitest";
import { initialCompose } from "../lib/sample-compose";

it("provides a readable Compose reference with platform examples", () => {
  expect(initialCompose).toContain("services:");
  expect(initialCompose).toContain("traefik.http.routers");
  expect(initialCompose).toContain("caddy.reverse_proxy");
});
