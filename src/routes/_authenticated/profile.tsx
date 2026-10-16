import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AddressForm } from "@/components/food/AddressForm";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — FoodieX" }, { name: "description", content: "Your profile and saved addresses." }, { property: "og:title", content: "Profile — FoodieX" }, { property: "og:description", content: "Your profile and saved addresses." }] }),
  component: Profile,
});

function Profile() {
  const { user } = useAuth();
  const addresses = useQuery({ queryKey: ["addresses"], queryFn: async () => (await supabase.from("addresses").select("*").order("created_at")).data ?? [] });
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-3xl font-extrabold">Profile</h1>
      <p className="text-muted-foreground">{user?.email}</p>
      <h2 className="text-xl font-bold">Saved addresses</h2>
      <div className="space-y-2">
        {addresses.data?.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-2xl border bg-card p-4">
            <div><p className="font-bold">{a.label}</p><p className="text-sm text-muted-foreground">{a.line1}, {a.city} – {a.pincode}</p></div>
            <Button variant="ghost" size="sm" onClick={async () => { await supabase.from("addresses").delete().eq("id", a.id); toast.success("Removed"); addresses.refetch(); }}>Delete</Button>
          </div>
        ))}
      </div>
      <AddressForm onSaved={() => addresses.refetch()} />
    </div>
  );
}
