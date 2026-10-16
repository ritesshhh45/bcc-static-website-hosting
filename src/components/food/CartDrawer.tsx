import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { calculateBill, inr } from "@/lib/bill";
import { Button } from "@/components/ui/button";
import { AddButton, VegIcon } from "./bits";

export function CartDrawer() {
  const cart = useCart();
  const bill = calculateBill(cart.subtotal);
  return (
    <AnimatePresence>
      {cart.open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => cart.setOpen(false)}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background shadow-2xl"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
          >
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="text-lg font-bold">Your cart</h3>
                {cart.restaurant_name && <p className="text-sm text-muted-foreground">from {cart.restaurant_name}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => cart.setOpen(false)} aria-label="Close cart"><X /></Button>
            </div>
            {cart.items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="grid size-20 place-items-center rounded-full bg-secondary">
                  <ShoppingBag className="size-9 text-primary" />
                </motion.div>
                <p className="font-semibold">Your cart is empty</p>
                <p className="text-sm text-muted-foreground">Good food is always cooking. Go ahead, order some yummy items.</p>
                <Button asChild onClick={() => cart.setOpen(false)}><Link to="/restaurants">Browse restaurants</Link></Button>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-3 overflow-y-auto p-4">
                  <AnimatePresence initial={false}>
                    {cart.items.map((i) => (
                      <motion.li key={i.menu_item_id} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30, height: 0 }}
                        className="flex items-center gap-3 rounded-2xl border bg-card p-3">
                        {i.image_url && <img src={i.image_url} alt={i.name} className="size-14 rounded-xl object-cover" loading="lazy" />}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5"><VegIcon veg={i.is_veg} /><p className="truncate text-sm font-semibold">{i.name}</p></div>
                          <p className="text-sm text-muted-foreground">{inr(i.price * i.quantity)}</p>
                        </div>
                        <AddButton qty={i.quantity} onAdd={() => {}} onChange={(n) => cart.setQty(i.menu_item_id, n)} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <div className="space-y-2 border-t p-4 text-sm">
                  <Row label="Subtotal" v={inr(bill.subtotal)} />
                  <Row label="GST (5%)" v={inr(bill.gst)} />
                  <Row label="Delivery fee" v={bill.delivery_fee ? inr(bill.delivery_fee) : "FREE"} />
                  <div className="flex justify-between pt-2 text-base font-bold"><span>To pay</span><span>{inr(bill.total)}</span></div>
                  <p className="text-xs text-muted-foreground">Apply coupons at checkout.</p>
                  <Button asChild variant="hero" size="lg" className="w-full" onClick={() => cart.setOpen(false)}>
                    <Link to="/checkout">Proceed to checkout</Link>
                  </Button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

const Row = ({ label, v }: { label: string; v: string }) => (
  <div className="flex justify-between text-muted-foreground"><span>{label}</span><span className="text-foreground">{v}</span></div>
);
