// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../components/login-form", () => ({ LoginForm: () => <form>login form</form> }));

import LoginPage from "../app/login/page";

describe("LoginPage", () => {
  it("explains the operator-managed access flow", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: "Anmelden" })).toBeInTheDocument();
    expect(screen.getByText("Der Zugang wird vom Betreiber eingerichtet.")).toBeInTheDocument();
    expect(screen.getByText("login form")).toBeInTheDocument();
  });
});
