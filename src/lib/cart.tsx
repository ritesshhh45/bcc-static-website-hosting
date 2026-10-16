import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

export type CartItem = {
  menu_item_id: string;
  name: string;
  price: number;
  is_veg: boolean;
  image_url: string | null;
  quantity: number;
};
export type CartState = { restaurant_id: string | null; restaurant_name: string | null; items: CartItem[] };

type Ctx = CartState & {
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (r: { id: string; name: string }, item: Omit<CartItem, "quantity">) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  qtyOf: (id: string) => number;
  couponCode: string | null;
  setCouponCode: (c: string | null) => void;
};

const KEY = "foodiex-cart";
const empty: CartState = { restaurant_id: null, restaurant_name: null, items: [] };
const CartCtx = createContext<Ctx | null>(null);

/** Cart lives in the browser until checkout; prices are re-validated by the database on order. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(empty);
  const [open, setOpen] = useState(false);
  const [couponCode, setCouponCode] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const add: Ctx["add"] = useCallback((r, item) => {
    setState((s) => {
      if (s.restaurant_id && s.restaurant_id !== r.id && s.items.length) {
        toast.info(`Started a new cart from ${r.name}`);
        return { restaurant_id: r.id, restaurant_name: r.name, items: [{ ...item, quantity: 1 }] };
      }
      const ex = s.items.find((i) => i.menu_item_id === item.menu_item_id);
      const items = ex
        ? s.items.map((i) => (i.menu_item_id === item.menu_item_id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...s.items, { ...item, quantity: 1 }];
      return { restaurant_id: r.id, restaurant_name: r.name, items };
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setState((s) => {
      const items = qty <= 0 ? s.items.filter((i) => i.menu_item_id !== id) : s.items.map((i) => (i.menu_item_id === id ? { ...i, quantity: qty } : i));
      return items.length ? { ...s, items } : empty;
    });
  }, []);

  const value = useMemo<Ctx>(() => {
    const count = state.items.reduce((a, i) => a + i.quantity, 0);
    const subtotal = state.items.reduce((a, i) => a + i.quantity * i.price, 0);
    return {
      ...state,
      open,
      setOpen,
      add,
      setQty,
      clear: () => {
        setState(empty);
        setCouponCode(null);
      },
      count,
      subtotal,
      qtyOf: (id) => state.items.find((i) => i.menu_item_id === id)?.quantity ?? 0,
      couponCode,
      setCouponCode,
    };
  }, [state, open, add, setQty, couponCode]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
};
