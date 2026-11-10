import { describe, expect, it } from "vitest";
import { userFacingErrorMessage } from "../lib/errors";

describe("userFacingErrorMessage", () => {
  it("returns a useful exception message or the supplied fallback", () => {
    expect(userFacingErrorMessage(new Error("storage failed"), "operation failed")).toBe("storage failed");
    expect(userFacingErrorMessage("unexpected failure", "operation failed")).toBe("operation failed");
    expect(userFacingErrorMessage(null, "operation failed")).toBe("operation failed");
  });
});
