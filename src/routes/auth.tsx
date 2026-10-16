import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import burger from "@/assets/hero-burger.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — FoodieX" },
      { name: "description", content: "Sign in or create your FoodieX account to order food." },
      { property: "og:title", content: "Sign in — FoodieX" },
      { property: "og:description", content: "Sign in or create your FoodieX account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    setBusy(true);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: String(f.get("name")), phone: String(f.get("phone")) },
          },
        });
        if (error) throw error;
        if (!data.session) { toast.success("Check your email to confirm your account."); return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      toast.success("Welcome to FoodieX!");
      navigate({ to: "/" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) { toast.error(String(res.error.message ?? res.error)); return; }
    if (res.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <div className="relative mx-auto grid min-h-[80vh] max-w-5xl items-center gap-10 px-4 py-10 md:grid-cols-2">
      <motion.img src={burger} alt="" initial={{ rotate: -20, opacity: 0 }} animate={{ rotate: 0, opacity: 1, y: [0, -14, 0] }} transition={{ y: { repeat: Infinity, duration: 4 } }} className="mx-auto hidden w-80 drop-shadow-2xl md:block" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border bg-card p-8 shadow-lift">
        <h1 className="text-3xl font-extrabold">{mode === "in" ? "Welcome back" : "Create account"}</h1>
        <p className="mt-1 text-muted-foreground">{mode === "in" ? "Sign in to continue ordering" : "Join FoodieX in seconds"}</p>
        <Button variant="outline" className="mt-6 w-full" onClick={google}>Continue with Google</Button>
        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "up" && (
            <>
              <div><Label htmlFor="name">Full name</Label><Input id="name" name="name" required /></div>
              <div><Label htmlFor="phone">Phone</Label><Input id="phone" name="phone" required pattern="[0-9]{10}" placeholder="10-digit mobile" /></div>
            </>
          )}
          <div><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" minLength={6} required /></div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Sign in" : "Sign up"}</Button>
        </form>
        <p className="mt-4 text-center text-sm">
          {mode === "in" ? "New here?" : "Already have an account?"}{" "}
          <button className="font-semibold text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>{mode === "in" ? "Create an account" : "Sign in"}</button>
        </p>
      </motion.div>
    </div>
  );
}
