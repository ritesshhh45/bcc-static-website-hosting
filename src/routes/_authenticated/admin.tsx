import { createFileRoute } from "@tanstack/react-router";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin dashboard — FoodieX" }, { name: "description", content: "Platform administration." }, { property: "og:title", content: "Admin dashboard — FoodieX" }, { property: "og:description", content: "Platform administration." }] }),
  component: AdminPanel,
  pendingComponent: () => <div className="mx-auto max-w-5xl px-4 py-16 text-muted-foreground">Loading admin panel…</div>,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-bold">Admin panel error</h1>
      <p className="mt-2 break-words text-destructive">{error.message}</p>
    </div>
  ),
});