// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { signIn, replace, refresh } = vi.hoisted(() => ({
  signIn: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("better-auth/react", () => ({ createAuthClient: () => ({ signIn: { email: signIn } }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));

import { LoginForm } from "../components/login-form";

afterEach(() => {
  cleanup();
  signIn.mockReset();
  replace.mockReset();
  refresh.mockReset();
});

describe("LoginForm", () => {
  it("signs in and returns to the workbench", async () => {
    signIn.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText("E-Mail"), "operator@example.com");
    await user.type(screen.getByLabelText("Passwort"), "correct horse battery staple");
    await user.click(screen.getByRole("button", { name: "Anmelden" }));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
    expect(refresh).toHaveBeenCalledOnce();
    expect(signIn).toHaveBeenCalledWith({ email: "operator@example.com", password: "correct horse battery staple", callbackURL: "/" });
  });

  it("shows a generic error when credentials are rejected", async () => {
    signIn.mockResolvedValue({ error: { message: "sensitive backend detail" } });
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText("E-Mail"), "wrong@example.com");
    await user.type(screen.getByLabelText("Passwort"), "wrong password");
    await user.click(screen.getByRole("button", { name: "Anmelden" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Anmeldung fehlgeschlagen. Prüfe deine Zugangsdaten.");
    expect(screen.queryByText("sensitive backend detail")).not.toBeInTheDocument();
  });

  it("recovers from a request failure and allows another attempt", async () => {
    signIn.mockRejectedValueOnce(new Error("network failure"));
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText("E-Mail"), "operator@example.com");
    await user.type(screen.getByLabelText("Passwort"), "password");
    await user.click(screen.getByRole("button", { name: "Anmelden" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Anmeldung fehlgeschlagen. Prüfe deine Zugangsdaten.");
    expect(screen.getByRole("button", { name: "Anmelden" })).toBeEnabled();
  });
});
