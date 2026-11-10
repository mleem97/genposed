import { describe, expect, it } from "vitest";
import { authorizeProjectAction, type ProjectAccessActor, type ProjectScope } from "../lib/project-access";

const operatorScope: ProjectScope = { kind: "operator" };
const customerScope: ProjectScope = { kind: "customer", customerId: "customer-a" };
const operator: ProjectAccessActor = { userId: "operator-1", kind: "operator" };
const customer: ProjectAccessActor = {
  userId: "customer-user-1",
  kind: "customer",
  customerId: "customer-a",
  customerAccessEnabled: true,
  permissions: ["project:read", "service:start", "service:stop", "service:restart"],
};

describe("authorizeProjectAction", () => {
  it("lets an operator manage operator and customer projects", () => {
    expect(authorizeProjectAction(operator, operatorScope, "project:delete")).toBe(true);
    expect(authorizeProjectAction(operator, customerScope, "project:delete")).toBe(true);
  });

  it("denies anonymous and malformed principals", () => {
    expect(authorizeProjectAction(null, operatorScope, "project:read")).toBe(false);
    expect(authorizeProjectAction({ userId: "", kind: "operator" }, operatorScope, "project:read")).toBe(false);
    expect(authorizeProjectAction({ userId: "user", kind: "customer" }, customerScope, "project:read")).toBe(false);
  });

  it("limits customer users to their enabled scope and assigned permissions", () => {
    expect(authorizeProjectAction(customer, customerScope, "service:start")).toBe(true);
    expect(authorizeProjectAction(customer, customerScope, "project:delete")).toBe(false);
    expect(authorizeProjectAction(customer, operatorScope, "project:read")).toBe(false);
    expect(authorizeProjectAction({ ...customer, customerId: "customer-b" }, customerScope, "project:read")).toBe(false);
    expect(authorizeProjectAction({ ...customer, customerAccessEnabled: false }, customerScope, "project:read")).toBe(false);
    expect(authorizeProjectAction({ ...customer, permissions: undefined }, customerScope, "project:read")).toBe(false);
  });

  it("rejects unknown permission names by default", () => {
    expect(authorizeProjectAction(customer, customerScope, "project:impersonate")).toBe(false);
  });
});
