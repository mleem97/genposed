import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <p className="panel-kicker">Genposed</p>
        <h1 id="login-title">Anmelden</h1>
        <p>Der Zugang wird vom Betreiber eingerichtet.</p>
        <LoginForm />
      </section>
    </main>
  );
}
