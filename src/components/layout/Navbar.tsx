import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShoppingBag, Moon, Sun, User, LogOut, Store, Shield, Receipt, Heart, UtensilsCrossed } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid size-9 place-items-center rounded-xl bg-brand text-primary-foreground shadow-lift">
        <UtensilsCrossed className="size-5" />
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight">
        Foodie<span className="text-brand">X</span>
      </span>
    </Link>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const d = localStorage.getItem("theme") === "dark";
    setDark(d);
    document.documentElement.classList.toggle("dark", d);
  }, []);
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle dark mode"
      onClick={() => {
        const d = !dark;
        setDark(d);
        localStorage.setItem("theme", d ? "dark" : "light");
        document.documentElement.classList.toggle("dark", d);
      }}
    >
      {dark ? <Sun /> : <Moon />}
    </Button>
  );
}

export function Navbar() {
  const { user, roles, signOut } = useAuth();
  const { count, setOpen } = useCart();
  const navigate = useNavigate();
  const link = "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors";
  const active = { className: "!text-primary" };

  // same links are used in the desktop bar and in the mobile row
  const links = (
    <>
      <Link to="/" className={link} activeProps={active} activeOptions={{ exact: true }}>Home</Link>
      <Link to="/restaurants" className={link} activeProps={active}>Restaurants</Link>
      <Link to="/cafes" className={link} activeProps={active}>Cafes</Link>
      {user && <Link to="/orders" className={link} activeProps={active}>Orders</Link>}
      {roles.includes("owner") && <Link to="/owner" className={link} activeProps={active}>My Restaurant</Link>}
      {roles.includes("admin") && <Link to="/admin" className={link} activeProps={active}>Admin</Link>}
    </>
  );

  return (
    <header className="glass sticky top-0 z-40 border-b border-border/60">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Logo />
        <div className="hidden items-center md:flex">{links}</div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <motion.button
            id="cart-icon"
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="relative grid size-10 place-items-center rounded-xl hover:bg-accent"
            aria-label="Open cart"
          >
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground"
              >
                {count}
              </motion.span>
            )}
          </motion.button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account"><User /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}><User /> Profile & addresses</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/orders" })}><Receipt /> My orders</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/favorites" })}><Heart /> Favourites</DropdownMenuItem>
                {roles.includes("owner") && <DropdownMenuItem onClick={() => navigate({ to: "/owner" })}><Store /> Owner dashboard</DropdownMenuItem>}
                {roles.includes("admin") && <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}><Shield /> Admin dashboard</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/" }); }}><LogOut /> Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="ml-1"><Link to="/auth">Sign in</Link></Button>
          )}
        </div>
      </nav>
      {/* mobile: scrollable links row below the top bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-t border-border/60 px-4 py-1 md:hidden">{links}</div>
    </header>
  );
}