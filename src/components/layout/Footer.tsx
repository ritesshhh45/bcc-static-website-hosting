import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Logo } from "./Navbar";

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mt-24 border-t bg-card"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">Hot food from Chhatrapati Sambhajinagar's favourite kitchens, delivered fast.</p>
        </div>
        <div>
          <h4 className="mb-3 font-bold">Quick links</h4>
          <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li><Link to="/restaurants" className="hover:text-primary">Restaurants</Link></li>
            <li><Link to="/orders" className="hover:text-primary">Orders</Link></li>
            <li><Link to="/checkout" className="hover:text-primary">Cart</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <h4 className="mb-3 font-bold">Developed by</h4>
          <p>Ritesh Pawar <span className="text-muted-foreground">– PRN 202456108031</span></p>
          <p>Sarvadny Dhole <span className="text-muted-foreground">– PRN 202456108042</span></p>
          <p className="mt-3 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">DBMS Mini Project</p>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} FoodieX</div>
    </motion.footer>
  );
}
