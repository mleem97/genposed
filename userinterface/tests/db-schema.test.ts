import { describe, expect, it } from "vitest";
import { getTableName } from "drizzle-orm";
import { createTableRelationsHelpers, extractTablesRelationalConfig } from "drizzle-orm/relations";
import { getTableConfig } from "drizzle-orm/pg-core";
import * as schema from "../lib/db/schema";
import { account, customerMemberships, customers, projects, session, user } from "../lib/db/schema";

describe("PostgreSQL ownership schema", () => {
  it("stores operator and customer ownership on each project with a database check", () => {
    const project = getTableConfig(projects);
    expect(project.columns.map((column) => column.name)).toContain("customer_id");
    expect(project.checks.map((constraint) => constraint.name)).toContain("projects_scope_customer_consistency");
    expect(project.foreignKeys.map((foreignKey) => getTableName(foreignKey.reference().foreignTable))).toEqual(["customers", "user"]);
    expect(project.indexes.map((index) => index.config.name)).toContain("projects_operator_name_unique");
    expect(project.indexes.map((index) => index.config.name)).toContain("projects_customer_name_unique");
  });

  it("keeps customer UI access disabled until the operator enables it", () => {
    const access = getTableConfig(customers).columns.find((column) => column.name === "access_enabled");
    expect(access?.notNull).toBe(true);
    expect(access?.default).toBe(false);
  });

  it("binds each customer membership to one user and customer", () => {
    const membership = getTableConfig(customerMemberships);
    expect(membership.primaryKeys.map((key) => key.name)).toContain("customer_memberships_pk");
    expect(membership.foreignKeys.map((foreignKey) => getTableName(foreignKey.reference().foreignTable))).toEqual(["customers", "user"]);
  });

  it("uses unique session tokens and links sessions to authenticated users", () => {
    const sessionConfig = getTableConfig(session);
    expect(sessionConfig.columns.find((column) => column.name === "token")?.isUnique).toBe(true);
    expect(getTableName(sessionConfig.foreignKeys[0].reference().foreignTable)).toBe("user");
    expect(getTableConfig(user).columns.map((column) => column.name)).toContain("role");
  });

  it("links provider accounts to their owning user", () => {
    const accountConfig = getTableConfig(account);
    expect(getTableName(accountConfig.foreignKeys[0].reference().foreignTable)).toBe("user");
    expect(accountConfig.columns.find((column) => column.name === "provider_id")?.notNull).toBe(true);
  });

  it("builds all declared relational links", () => {
    const relational = extractTablesRelationalConfig(schema, (table) => createTableRelationsHelpers(table));
    expect(Object.keys(relational.tables)).toEqual(expect.arrayContaining(["user", "session", "account", "verification", "customers", "customerMemberships", "projects"]));
  });
});
