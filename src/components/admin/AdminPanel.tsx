import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, BellOff, RefreshCw, MessageCircle, Phone, MapPin, Store, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { inr } from "@/lib/bill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Status = "placed" | "accepted" | "preparing" | "out_for_delivery" | "delivered" | "rejected" | "cancelled";

interface Pay { method: string; status: string }
interface Partner { id: string; name: string; phone: string; vehicle_no: string; is_available: boolean }
interface AdminOrder {
  id: string;
  order_no: number;
  status: Status;
  subtotal: number;
  gst: number;
  delivery_fee: number;
  discount: number;
  total: number;
  delivery_address: string;
  created_at: string;
  delivery_partner_id: string | null;
  restaurant: { name: string; address: string } | null;
  customer: { full_name: string; phone: string | null; email: string | null } | null;
  order_items: { item_name: string; quantity: number; unit_price: number }[];
  payments: Pay | Pay[] | null;
  partner: { id: string; name: string; phone: string } | null;
}

const ORDER_SELECT =
  "*, restaurant:restaurants(name, address), customer:profiles(full_name, phone, email), order_items(item_name, quantity, unit_price), payments(method, status), partner:delivery_partners(id, name, phone)";

const TABS = [
  { id: "new", label: "New orders", statuses: ["placed"] },
  { id: "active", label: "In progress", statuses: ["accepted", "preparing", "out_for_delivery"] },
  { id: "done", label: "Completed", statuses: ["delivered", "rejected", "cancelled"] },
] as const;

const STATUS_LABEL: Record<Status, string> = {
  placed: "New",
  accepted: "Accepted",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const STATUS_STYLE: Record<Status, string> = {
  placed: "bg-orange-100 text-orange-700",
  accepted: "bg-blue-100 text-blue-700",
  preparing: "bg-yellow-100 text-yellow-800",
  out_for_delivery: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-red-100 text-red-700",
};

function waLink(phone: string | null | undefined, text: string): string | null {
  const d = (phone ?? "").replace(/\D/g, "");
  if (d.length < 10) return null;
  const num = d.length === 10 ? "91" + d : d;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

const getPay = (o: AdminOrder): Pay | null => (Array.isArray(o.payments) ? o.payments[0] ?? null : o.payments);

export function AdminPanel() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("new");
  const [soundOn, setSoundOn] = useState(false);
  const soundRef = useRef(false);
  const audioRef = useRef<AudioContext | null>(null);

  const orders = useQuery({
    queryKey: ["admin-orders"],
    enabled: isAdmin,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(150);
      if (error) throw error;
      return data as unknown as AdminOrder[];
    },
  });

  const partners = useQuery({
    queryKey: ["admin-partners"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("delivery_partners").select("*").order("name");
      if (error) throw error;
      return data as unknown as Partner[];
    },
  });

  const beep = () => {
    const ctx = audioRef.current;
    if (!soundRef.current || !ctx) return;
    [0, 0.35].forEach((delay) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.value = 880;
      const t = ctx.currentTime + delay;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.start(t);
      o.stop(t + 0.3);
    });
  };

  const toggleSound = async () => {
    if (soundOn) {
      soundRef.current = false;
      setSoundOn(false);
      return;
    }
    audioRef.current = audioRef.current ?? new AudioContext();
    await audioRef.current.resume();
    soundRef.current = true;
    setSoundOn(true);
    beep();
  };

  // realtime: new orders and status changes appear instantly
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("admin-orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          toast.success("🔔 New order received!");
          beep();
          setTab("new");
        }
        qc.invalidateQueries({ queryKey: ["admin-orders"] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const updateOrder = async (id: string, patch: { status?: Status; delivery_partner_id?: string | null }, okMsg: string) => {
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(okMsg);
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="text-2xl font-bold">Admin access only</h1>
        <p className="mt-2 text-muted-foreground">Please sign in with the admin account.</p>
        <Button asChild className="mt-4"><Link to="/">Go home</Link></Button>
      </div>
    );
  }

  const all = orders.data ?? [];
  const current = TABS.find((t) => t.id === tab)!;
  const list = all.filter((o) => (current.statuses as readonly string[]).includes(o.status));
  const count = (id: (typeof TABS)[number]["id"]) => all.filter((o) => (TABS.find((t) => t.id === id)!.statuses as readonly string[]).includes(o.status)).length;
  const revenue = all.filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">Admin Panel</h1>
          <p className="text-muted-foreground">Accept orders, assign a delivery partner and forward the order on WhatsApp.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleSound}>
            {soundOn ? <Bell className="mr-2 size-4" /> : <BellOff className="mr-2 size-4" />}
            {soundOn ? "Sound on" : "Enable sound"}
          </Button>
          <Button variant="outline" onClick={() => { void orders.refetch(); void partners.refetch(); }}>
            <RefreshCw className="mr-2 size-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Kpi label="New orders" value={String(count("new"))} accent={count("new") > 0} />
        <Kpi label="In progress" value={String(count("active"))} />
        <Kpi label="Delivered" value={String(all.filter((o) => o.status === "delivered").length)} />
        <Kpi label="Revenue (delivered)" value={inr(revenue)} />
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition",
              tab === t.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary",
            )}
          >
            {t.label} ({count(t.id)})
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {orders.isLoading && <p className="text-muted-foreground">Loading orders…</p>}
        {orders.error && <p className="text-destructive">Could not load orders: {(orders.error as Error).message}</p>}
        {list.map((o) => (
          <OrderCard key={o.id} o={o} partners={partners.data ?? []} onUpdate={updateOrder} />
        ))}
      </div>
      {!orders.isLoading && list.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">No orders here right now.</p>
      )}

      <PartnersSection partners={partners.data ?? []} onChanged={() => partners.refetch()} />
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-4 shadow-soft", accent && "border-primary")}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("text-2xl font-extrabold", accent && "text-primary")}>{value}</p>
    </div>
  );
}

function OrderCard({
  o,
  partners,
  onUpdate,
}: {
  o: AdminOrder;
  partners: Partner[];
  onUpdate: (id: string, patch: { status?: Status; delivery_partner_id?: string | null }, okMsg: string) => Promise<void>;
}) {
  const pay = getPay(o);
  const cod = pay?.method === "cod";
  const customerName = o.customer?.full_name?.trim() || o.customer?.email || "Customer";
  const itemsText = o.order_items.map((i) => `${i.item_name} x${i.quantity}`).join(", ");
  const partner = partners.find((p) => p.id === o.delivery_partner_id) ?? o.partner;
  const canAssign = o.status === "accepted" || o.status === "preparing" || o.status === "out_for_delivery";

  const messageCustomer = () => {
    const url = waLink(
      o.customer?.phone,
      `Hi ${customerName}, your FoodieX order #${o.order_no} (${inr(Number(o.total))}) from ${o.restaurant?.name ?? "the restaurant"} is confirmed. We will deliver to ${o.delivery_address}. Thank you!`,
    );
    if (!url) { toast.error("Customer phone number is not available"); return; }
    window.open(url, "_blank");
  };

  const sendToPartner = () => {
    if (!partner) { toast.error("Select a delivery partner first"); return; }
    const text =
      `🛵 *New delivery - FoodieX*\n` +
      `Order #${o.order_no}\n\n` +
      `*Pickup:* ${o.restaurant?.name ?? ""}, ${o.restaurant?.address ?? ""}\n` +
      `*Deliver to:* ${customerName} (${o.customer?.phone ?? "no phone"})\n` +
      `*Address:* ${o.delivery_address}\n` +
      `*Items:* ${itemsText}\n` +
      (cod ? `*Collect cash:* ${inr(Number(o.total))}` : `*Payment:* Paid online (${inr(Number(o.total))})`);
    const url = waLink(partner.phone, text);
    if (!url) { toast.error("Delivery partner phone number is invalid"); return; }
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-3 rounded-3xl border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-extrabold">Order #{o.order_no}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(o.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-bold", STATUS_STYLE[o.status])}>{STATUS_LABEL[o.status]}</span>
      </div>

      <div className="space-y-1 text-sm">
        <p className="flex items-center gap-2"><Store className="size-4 text-primary" /> <b>{o.restaurant?.name ?? "—"}</b></p>
        <p className="flex items-center gap-2"><Phone className="size-4 text-primary" /> {customerName}{o.customer?.phone ? ` · ${o.customer.phone}` : ""}</p>
        <p className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" /> {o.delivery_address}</p>
      </div>

      <ul className="space-y-1 rounded-2xl bg-secondary/50 p-3 text-sm">
        {o.order_items.map((i, idx) => (
          <li key={idx} className="flex justify-between"><span>{i.item_name} × {i.quantity}</span><span>{inr(Number(i.unit_price) * i.quantity)}</span></li>
        ))}
        <li className="flex justify-between border-t pt-1 font-bold"><span>Total ({cod ? "Cash on delivery" : `Paid ${pay?.method?.toUpperCase() ?? ""}`})</span><span>{inr(Number(o.total))}</span></li>
      </ul>

      {canAssign && (
        <div className="space-y-2">
          <label className="text-sm font-semibold">Delivery partner</label>
          <select
            value={o.delivery_partner_id ?? ""}
            onChange={(e) => void onUpdate(o.id, { delivery_partner_id: e.target.value || null }, "Delivery partner updated")}
            className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
          >
            <option value="">Select partner…</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.name} · {p.phone} · {p.vehicle_no}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        {o.status === "placed" && (
          <>
            <Button onClick={() => void onUpdate(o.id, { status: "accepted" }, "Order accepted")}>Accept order</Button>
            <Button variant="outline" onClick={() => { if (confirm("Reject this order?")) void onUpdate(o.id, { status: "rejected" }, "Order rejected"); }}>Reject</Button>
          </>
        )}
        {o.status === "accepted" && (
          <Button onClick={() => void onUpdate(o.id, { status: "preparing" }, "Marked as preparing")}>Start preparing</Button>
        )}
        {o.status === "preparing" && (
          <Button
            onClick={() => {
              if (!o.delivery_partner_id) { toast.error("Select a delivery partner first"); return; }
              void onUpdate(o.id, { status: "out_for_delivery" }, "Out for delivery");
            }}
          >
            Out for delivery
          </Button>
        )}
        {o.status === "out_for_delivery" && (
          <Button onClick={() => void onUpdate(o.id, { status: "delivered" }, "Order delivered")}>Mark delivered</Button>
        )}
        {canAssign && (
          <Button variant="outline" onClick={sendToPartner}><MessageCircle className="mr-2 size-4" /> Send to delivery partner</Button>
        )}
        {o.status !== "rejected" && o.status !== "cancelled" && (
          <Button variant="ghost" onClick={messageCustomer}><MessageCircle className="mr-2 size-4" /> WhatsApp customer</Button>
        )}
      </div>
    </div>
  );
}

function PartnersSection({ partners, onChanged }: { partners: Partner[]; onChanged: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", vehicle_no: "" });
  const [saving, setSaving] = useState(false);

  const add = async () => {
    const name = form.name.trim();
    const phone = form.phone.replace(/\D/g, "");
    const vehicle_no = form.vehicle_no.trim();
    if (!name || !vehicle_no) { toast.error("Enter name and vehicle number"); return; }
    if (phone.length !== 10) { toast.error("Phone must be 10 digits"); return; }
    setSaving(true);
    const { error } = await supabase.from("delivery_partners").insert({ name, phone, vehicle_no });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Delivery partner added");
    setForm({ name: "", phone: "", vehicle_no: "" });
    onChanged();
  };

  const remove = async (p: Partner) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    const { error } = await supabase.from("delivery_partners").delete().eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Delivery partner deleted");
    onChanged();
  };

  return (
    <section className="mt-12 rounded-3xl border bg-card p-5 shadow-soft">
      <h2 className="text-xl font-bold">Delivery partners</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Phone (10 digits)" inputMode="numeric" maxLength={10} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} />
        <Input placeholder="Vehicle no (MH20 AB 1234)" value={form.vehicle_no} onChange={(e) => setForm({ ...form, vehicle_no: e.target.value })} />
        <Button disabled={saving} onClick={() => void add()}>{saving ? "Adding…" : "Add partner"}</Button>
      </div>
      <ul className="mt-4 divide-y text-sm">
        {partners.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 py-2">
            <span><b>{p.name}</b> · {p.phone} · {p.vehicle_no}</span>
            <Button variant="ghost" size="icon" aria-label={`Delete ${p.name}`} onClick={() => void remove(p)}><Trash2 className="size-4" /></Button>
          </li>
        ))}
        {partners.length === 0 && <li className="py-2 text-muted-foreground">No delivery partners yet.</li>}
      </ul>
    </section>
  );
}