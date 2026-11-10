export type ProjectPermission =
  | "project:read"
  | "project:create"
  | "project:update"
  | "project:delete"
  | "service:start"
  | "service:stop"
  | "service:restart"
  | "deployment:create"
  | "secret:read"
  | "secret:write"
  | "permission:manage";

export type ProjectScope =
  | { kind: "operator" }
  | { kind: "customer"; customerId: string };

/**
 * This actor must be assembled from the authenticated session and persisted
 * membership on the server. Never accept it from request JSON or client state.
 */
export type ProjectAccessActor =
  | { userId: string; kind: "operator" }
  | {
      userId: string;
      kind: "customer";
      customerId?: string;
      customerAccessEnabled?: boolean;
      permissions?: readonly string[];
    };

export function authorizeProjectAction(
  actor: ProjectAccessActor | null,
  scope: ProjectScope,
  permission: string,
): boolean {
  if (!actor || !actor.userId) return false;
  if (actor.kind === "operator") return true;
  if (actor.kind !== "customer" || scope.kind !== "customer") return false;
  if (!actor.customerAccessEnabled || !actor.customerId || !scope.customerId) return false;
  if (actor.customerId !== scope.customerId) return false;
  return actor.permissions?.includes(permission) ?? false;
}
