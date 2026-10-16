import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function VegIcon({ veg, className }: { veg: boolean; className?: string }) {
  return (
    <span
      title={veg ? "Veg" : "Non-veg"}
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px]",
        veg ? "border-veg" : "border-nonveg",
        className,
      )}
    >
      <span className={cn("size-2 rounded-full", veg ? "bg-veg" : "bg-nonveg")} />
    </span>
  );
}

export function RatingPill({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-star px-1.5 py-0.5 text-xs font-bold text-success-foreground">
      {Number(value).toFixed(1)} <Star className="size-3 fill-current" />
    </span>
  );
}

/** Animated ADD → [- n +] counter */
export function AddButton({ qty, onAdd, onChange, disabled }: { qty: number; onAdd: (e: React.MouseEvent) => void; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <div className="relative h-9 w-24">
      <AnimatePresence mode="popLayout" initial={false}>
        {qty === 0 ? (
          <motion.button
            key="add"
            disabled={disabled}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={onAdd}
            className="absolute inset-0 rounded-xl border border-primary/40 bg-card text-sm font-extrabold tracking-wide text-primary shadow-soft hover:bg-secondary disabled:opacity-50"
          >
            {disabled ? "N/A" : "ADD"}
          </motion.button>
        ) : (
          <motion.div
            key="ctr"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-between rounded-xl bg-primary px-1 text-primary-foreground shadow-lift"
          >
            <button aria-label="Decrease" onClick={() => onChange(qty - 1)} className="grid size-7 place-items-center rounded-lg hover:bg-primary-foreground/15">
              <Minus className="size-4" />
            </button>
            <AnimatePresence mode="popLayout">
              <motion.span key={qty} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} className="font-bold">
                {qty}
              </motion.span>
            </AnimatePresence>
            <button aria-label="Increase" onClick={() => onChange(qty + 1)} className="grid size-7 place-items-center rounded-lg hover:bg-primary-foreground/15">
              <Plus className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Small image that flies from the click point to the cart icon. */
export function flyToCart(e: React.MouseEvent, img: string | null) {
  const target = document.getElementById("cart-icon");
  if (!target || !img) return;
  const t = target.getBoundingClientRect();
  const el = document.createElement("img");
  el.src = img;
  Object.assign(el.style, {
    position: "fixed", left: `${e.clientX - 24}px`, top: `${e.clientY - 24}px`, width: "48px", height: "48px",
    borderRadius: "9999px", objectFit: "cover", zIndex: "100", pointerEvents: "none",
    transition: "all 0.75s cubic-bezier(.5,-0.3,.7,1)",
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    Object.assign(el.style, { left: `${t.left + t.width / 2 - 8}px`, top: `${t.top + t.height / 2 - 8}px`, width: "16px", height: "16px", opacity: "0.4" });
  });
  setTimeout(() => {
    el.remove();
    target.animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 350 });
  }, 760);
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-muted", className)} />;
}
