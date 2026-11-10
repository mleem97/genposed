"use client";

import { createAuthClient } from "better-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const authClient = createAuthClient();

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const result = await authClient.signIn.email({ email, password, callbackURL: "/" });
      if (result.error) {
        setError("Anmeldung fehlgeschlagen. Prüfe deine Zugangsdaten.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Anmeldung fehlgeschlagen. Prüfe deine Zugangsdaten.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <label htmlFor="login-email">E-Mail</label>
      <input id="login-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
      <label htmlFor="login-password">Passwort</label>
      <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
      {error ? <p className="login-error" role="alert">{error}</p> : null}
      <button type="submit" disabled={pending}>{pending ? "Anmeldung läuft …" : "Anmelden"}</button>
    </form>
  );
}
