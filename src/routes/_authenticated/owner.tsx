import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/owner")({
  head: () => ({ meta: [{ title: "Owner dashboard — FoodieX" }, { name: "description", content: "Manage your restaurant." }, { property: "og:title", content: "Owner dashboard — FoodieX" }, { property: "og:description", content: "Manage your restaurant." }] }),
  component: () => <div className="mx-auto max-w-5xl px-4 py-16"><h1 className="text-3xl font-extrabold">Owner dashboard</h1><p className="mt-2 text-muted-foreground">Coming in the next step.</p></div>,
});
