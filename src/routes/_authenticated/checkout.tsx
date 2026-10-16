import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, MapPin, Smartphone, Wallet, TicketPercent, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { calculateBill, inr } from "@/lib/bill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddButton, VegIcon } from "@/components/food/bits";
import { notifyNewOrder } from "@/lib/notify.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({ meta: [{ title: "Checkout — FoodieX" }, { name: "description", content: "Review your cart and place your order." }, { property: "og:title", content: "Checkout — FoodieX" }, { property: "og:description", content: "Review your cart and place your order." }] }),
  component: Checkout,
});

const METHODS = [
  { id: "cod", label: "Cash on delivery", icon: Wallet },
  { id: "upi", label: "UPI", icon: Smartphone },
  { id: "card", label: "Card", icon: CreditCard },
] as const;

function Checkout() {
  const cart = useCart();
  const navigate = useNavigate();
  const [addressId, setAddressId] = useState<string | null>(null);
  const [method, setMethod] = useState<"cod" | "upi" | "card">("cod");
  const [code, setCode] = useState(cart.couponCode ?? "");
  const [placing, setPlacing] = useState(false);

  // address form (built into checkout)
  const [form, setForm] = useState({ label: "Home", line1: "", city: "Chhatrapati Sambhajinagar", pincode: "" });
  const [saving, setSaving] = useState(false);

  const addresses = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => (await supabase.from("addresses").select("*").order("created_at")).data ?? [],
  });
  const coupons = useQuery({
    queryKey: ["coupons"],
    queryFn: async () => (await supabase.from("coupons").select("*").eq("is_active", true)).data ?? [],
  });
  const selectedAddress = addressId ?? addresses.data?.[0]?.id ?? null;
  const coupon = coupons.data?.find((c) => c.code.toUpperCase() === (cart.couponCode ?? "").toUpperCase()) ?? null;
  const bill = calculateBill(cart.subtotal, coupon);

  const applyCoupon = (c: string) => {
    const found = coupons.data?.find((x) => x.code.toUpperCase() === c.trim().toUpperCase());
    if (!found) { toast.error("Invalid coupon"); return; }
    if (cart.subtotal < Number(found.min_order)) { toast.error(`Add ${inr(Number(found.min_order) - cart.subtotal)} more to use ${found.code}`); return; }
    cart.setCouponCode(found.code);
    setCode(found.code);
    toast.success(`${found.code} applied!`);
  };

  // Saves the address in Supabase, selects it automatically and returns its id
  const saveAddress = async (): Promise<string | null> => {
    const line1 = form.line1.trim();
    const city = form.city.trim();
    const pincode = form.pincode.trim();
    if (!line1 || !city) { toast.error("Please enter your full address and city"); return null; }
    if (!/^[0-9]{6}$/.test(pincode)) { toast.error("Pincode must be exactly 6 digits"); return null; }

    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) { setSaving(false); toast.error("Please sign in again"); return null; }

    const { data, error } = await supabase
      .from("addresses")
      .insert({ user_id: user.id, label: form.label.trim() || "Home", line1, city, pincode })
      .select("id")
      .single();
    setSaving(false);

    if (error || !data) { toast.error(error?.message ?? "Could not save address"); return null; }
    setAddressId(data.id);
    await addresses.refetch();
    setForm((f) => ({ ...f, line1: "", pincode: "" }));
    toast.success("Address saved");
    return data.id;
  };

  const place = async () => {
    if (!cart.restaurant_id) return;
    setPlacing(true);

    // use the selected address; if the form is filled but not saved yet, save it first
    let addrId = selectedAddress;
    if (!addrId && form.line1.trim()) addrId = await saveAddress();
    if (!addrId) {
      setPlacing(false);
      toast.error("Please add a delivery address");
      return;
    }

    const { data, error } = await supabase.rpc("place_order", {
      _restaurant_id: cart.restaurant_id,
      _address_id: addrId,
      _payment_method: method,
      _coupon_code: cart.couponCode ?? "",
      _items: cart.items.map((i) => ({ menu_item_id: i.menu_item_id, quantity: i.quantity })),
    });
    if (error || !data) {
      setPlacing(false);
      toast.error(error?.message ?? "Could not place order");
      return;
    }
    notifyNewOrder({ data: { orderId: data } }).catch(() => {});
    cart.clear();
    navigate({ to: "/orders/$id", params: { id: data }, search: { success: true } });
  };

  if (cart.items.length === 0)
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Button asChild className="mt-4"><Link to="/restaurants">Find something tasty</Link></Button>
      </div>
    );

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card title="Delivery address" icon={MapPin}>
          {addresses.data && addresses.data.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {addresses.data.map((a) => (
                <button key={a.id} onClick={() => setAddressId(a.id)} className={cn("relative rounded-2xl border p-4 text-left transition", selectedAddress === a.id ? "border-primary bg-secondary" : "hover:border-primary/50")}>
                  {selectedAddress === a.id && <Check className="absolute right-3 top-3 size-5 text-primary" />}
                  <p className="font-bold">{a.label}</p>
                  <p className="text-sm text-muted-foreground">{a.line1}, {a.city} – {a.pincode}</p>
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 rounded-2xl border border-dashed p-4">
            <p className="mb-3 text-sm font-semibold">Add a new address</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Label (Home / Work)" />
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
              <Input className="sm:col-span-2" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} placeholder="House no, street, area" />
              <Input value={form.pincode} inputMode="numeric" maxLength={6} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })} placeholder="Pincode (6 digits)" />
              <Button type="button" disabled={saving} onClick={() => { void saveAddress(); }}>{saving ? "Saving…" : "Save address"}</Button>
            </div>
          </div>
        </Card>

        <Card title="Payment method" icon={Wallet}>
          <div className="grid gap-3 sm:grid-cols-3">
            {METHODS.map((m) => (
              <button key={m.id} onClick={() => setMethod(m.id)} className={cn("flex items-center gap-3 rounded-2xl border p-4 font-semibold transition", method === m.id ? "border-primary bg-secondary" : "hover:border-primary/50")}>
                <m.icon className="size-5 text-primary" /> {m.label}
              </button>
            ))}
          </div>
          {method !== "cod" && <p className="mt-3 text-sm text-muted-foreground">Demo mode: online payment is simulated and marked as paid instantly.</p>}
        </Card>

        <Card title="Coupons" icon={TicketPercent}>
          <div className="flex gap-2">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter coupon code" className="uppercase" />
            <Button onClick={() => applyCoupon(code)}>Apply</Button>
            {cart.couponCode && <Button variant="ghost" onClick={() => { cart.setCouponCode(null); setCode(""); }}>Remove</Button>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {coupons.data?.map((c) => (
              <button key={c.id} onClick={() => applyCoupon(c.code)} className="rounded-xl border border-dashed border-primary px-3 py-2 text-left text-xs">
                <span className="font-bold text-primary">{c.code}</span><br />{c.description}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-fit space-y-4 rounded-3xl border bg-card p-5 shadow-soft lg:sticky lg:top-20">
        <h2 className="text-xl font-bold">{cart.restaurant_name}</h2>
        <ul className="space-y-3">
          {cart.items.map((i) => (
            <li key={i.menu_item_id} className="flex items-center gap-2">
              <VegIcon veg={i.is_veg} />
              <span className="flex-1 truncate text-sm font-medium">{i.name}</span>
              <AddButton qty={i.quantity} onAdd={() => {}} onChange={(n) => cart.setQty(i.menu_item_id, n)} />
              <span className="w-16 text-right text-sm">{inr(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1.5 border-t pt-3 text-sm">
          <Line l="Item total" v={inr(bill.subtotal)} />
          <Line l="GST (5%)" v={inr(bill.gst)} />
          <Line l="Delivery fee" v={bill.delivery_fee ? inr(bill.delivery_fee) : "FREE"} />
          {bill.discount > 0 && <Line l={`Discount (${cart.couponCode})`} v={"– " + inr(bill.discount)} accent />}
          <div className="flex justify-between border-t pt-2 text-lg font-extrabold"><span>To pay</span><span>{inr(bill.total)}</span></div>
        </div>
        <Button variant="hero" size="lg" className="w-full" disabled={placing} onClick={place}>{placing ? "Placing order…" : `Place order · ${inr(bill.total)}`}</Button>
      </motion.aside>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border bg-card p-5 shadow-soft">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Icon className="size-5 text-primary" />{title}</h2>
      {children}
    </motion.section>
  );
}
const Line = ({ l, v, accent }: { l: string; v: string; accent?: boolean }) => (
  <div className={cn("flex justify-between", accent ? "font-semibold text-success" : "text-muted-foreground")}><span>{l}</span><span className={accent ? "" : "text-foreground"}>{v}</span></div>
);