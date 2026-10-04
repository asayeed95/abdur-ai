import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="max-w-md mx-auto px-6 pt-32">
      <p className="eyebrow mb-4">abdur.ai /// admin</p>
      <h1 className="font-display text-3xl mb-6">Sign in</h1>
      {error && (
        <p role="alert" className="mb-4 font-mono text-xs text-clay">
          Sign-in failed. Request a new link.
        </p>
      )}
      <LoginForm />
    </main>
  );
}
