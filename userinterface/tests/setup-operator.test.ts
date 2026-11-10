import { describe, expect, it, vi } from "vitest";
import { readOperatorBootstrapInput, setupOperator } from "../lib/installer/setup-operator";

const environment = {
  GENPOSED_OPERATOR_NAME: "  Genposed Owner  ",
  GENPOSED_OPERATOR_EMAIL: " owner@example.com ",
  GENPOSED_OPERATOR_PASSWORD: "a sufficiently long password",
  NODE_ENV: "test",
} as NodeJS.ProcessEnv;

describe("first operator bootstrap", () => {
  it("requires all bootstrap credentials and a strong password", () => {
    expect(readOperatorBootstrapInput(environment)).toEqual({ name: "Genposed Owner", email: "owner@example.com", password: "a sufficiently long password" });
    expect(() => readOperatorBootstrapInput({} as NodeJS.ProcessEnv)).toThrow("müssen gesetzt sein");
    expect(() => readOperatorBootstrapInput({ ...environment, GENPOSED_OPERATOR_PASSWORD: "short" })).toThrow("mindestens 12 Zeichen");
  });

  it("refuses public or repeated operator creation and permits the first configured operator", async () => {
    const createOperator = vi.fn(async () => ({ id: "operator-1", role: "operator" }));
    await expect(setupOperator(environment, { operatorExists: async () => true, createOperator })).rejects.toThrow("existiert bereits");
    expect(createOperator).not.toHaveBeenCalled();
    await expect(setupOperator(environment, { operatorExists: async () => false, createOperator })).resolves.toEqual({ id: "operator-1", role: "operator" });
  });

  it("rejects a bootstrap result that is not a confirmed operator", async () => {
    await expect(setupOperator(environment, {
      operatorExists: async () => false,
      createOperator: async () => ({ id: "customer-1", role: "customer" }),
    })).rejects.toThrow("nicht sicher bestätigen");
    await expect(setupOperator(environment, {
      operatorExists: async () => false,
      createOperator: async () => ({ id: "", role: "operator" }),
    })).rejects.toThrow("nicht sicher bestätigen");
  });
});
