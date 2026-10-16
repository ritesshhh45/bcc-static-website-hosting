import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddressForm({ onSaved }: { onSaved: () => void }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="grid gap-3 rounded-2xl border border-dashed bg-muted/40 p-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!user) return undefined;
        const f = new FormData(e.currentTarget);
        setBusy(true);
        const { error } = await supabase.from("addresses").insert({
          user_id: user.id,
          label: String(f.get("label") || "Home"),
          line1: String(f.get("line1")),
          city: String(f.get("city") || "Chhatrapati Sambhajinagar"),
          pincode: String(f.get("pincode")),
        });
        setBusy(false);
        if (error) { toast.error(error.message.includes("pincode") ? "Pincode must be 6 digits" : error.message); return undefined; }
        toast.success("Address saved");
        e.currentTarget.reset();
        onSaved();
      }}
    >
      <Input name="label" placeholder="Label (Home, Work…)" />
      <Input name="city" placeholder="City" defaultValue="Chhatrapati Sambhajinagar" />
      <Input name="line1" placeholder="Flat, building, street, area" required className="sm:col-span-2" />
      <Input name="pincode" placeholder="Pincode" required pattern="[0-9]{6}" />
      <Button type="submit" disabled={busy}>Save address</Button>
    </form>
  );
}
