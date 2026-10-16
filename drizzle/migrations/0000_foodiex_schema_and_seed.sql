CREATE TYPE public.app_role AS ENUM ('customer','owner','admin');
CREATE TYPE public.order_status AS ENUM ('placed','accepted','preparing','out_for_delivery','delivered','rejected','cancelled');
CREATE TYPE public.payment_method AS ENUM ('cod','upi','card');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text CHECK (phone IS NULL OR phone ~ '^[0-9+ ]{10,15}$'),
  email text,
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  line1 text NOT NULL,
  city text NOT NULL DEFAULT 'Chhatrapati Sambhajinagar',
  pincode text NOT NULL CHECK (pincode ~ '^[0-9]{6}$'),
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_addresses_user ON public.addresses(user_id);
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  image_url text,
  sort_order int NOT NULL DEFAULT 0
);
CREATE TABLE public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL UNIQUE,
  cuisine text NOT NULL,
  description text,
  image_url text,
  address text NOT NULL,
  eta_minutes int NOT NULL DEFAULT 30 CHECK (eta_minutes > 0),
  cost_for_two numeric(10,2) NOT NULL DEFAULT 300 CHECK (cost_for_two >= 0),
  offer_text text,
  avg_rating numeric(2,1) NOT NULL DEFAULT 4.2 CHECK (avg_rating BETWEEN 0 AND 5),
  rating_count int NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  is_approved boolean NOT NULL DEFAULT false,
  is_blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_restaurants_owner ON public.restaurants(owner_id);
CREATE INDEX idx_restaurants_cuisine ON public.restaurants(cuisine);
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  is_veg boolean NOT NULL DEFAULT true,
  rating numeric(2,1) NOT NULL DEFAULT 4.0 CHECK (rating BETWEEN 0 AND 5),
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, name)
);
CREATE INDEX idx_menu_items_restaurant ON public.menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category ON public.menu_items(category_id);
CREATE TABLE public.cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id uuid REFERENCES public.restaurants(id) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.cart(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  quantity int NOT NULL CHECK (quantity > 0),
  UNIQUE (cart_id, menu_item_id)
);
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_percent int NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  max_discount numeric(10,2) NOT NULL CHECK (max_discount >= 0),
  min_order numeric(10,2) NOT NULL DEFAULT 0 CHECK (min_order >= 0),
  is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE public.delivery_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL UNIQUE,
  vehicle_no text NOT NULL,
  is_available boolean NOT NULL DEFAULT true
);
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no bigserial UNIQUE,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE RESTRICT,
  address_id uuid REFERENCES public.addresses(id) ON DELETE SET NULL,
  delivery_address text NOT NULL,
  coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL,
  delivery_partner_id uuid REFERENCES public.delivery_partners(id) ON DELETE SET NULL,
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  gst numeric(10,2) NOT NULL CHECK (gst >= 0),
  delivery_fee numeric(10,2) NOT NULL CHECK (delivery_fee >= 0),
  discount numeric(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  status public.order_status NOT NULL DEFAULT 'placed',
  created_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz
);
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_restaurant ON public.orders(restaurant_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created ON public.orders(created_at);
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
  quantity int NOT NULL CHECK (quantity > 0)
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  method public.payment_method NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  transaction_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_reviews_restaurant ON public.reviews(restaurant_id);
CREATE TABLE public.favorites (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  restaurant_id uuid NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, restaurant_id)
);
CREATE TABLE public.order_status_log (
  id bigserial PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  old_status public.order_status,
  new_status public.order_status NOT NULL,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_status_log_order ON public.order_status_log(order_id);

GRANT SELECT ON public.categories, public.restaurants, public.menu_items, public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.profiles, public.addresses, public.categories, public.restaurants, public.menu_items,
  public.cart, public.cart_items, public.coupons, public.delivery_partners, public.orders,
  public.order_items, public.payments, public.reviews, public.favorites TO authenticated;
GRANT SELECT ON public.user_roles, public.order_status_log TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.owns_restaurant(_rid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurants WHERE id = _rid AND owner_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NULLIF(NEW.raw_user_meta_data->>'phone',''), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  IF (SELECT count(*) FROM public.user_roles WHERE role = 'admin') = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile self read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "owner reads customers of own orders" ON public.profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.customer_id = profiles.id AND public.owns_restaurant(o.restaurant_id)));
CREATE POLICY "profile self update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles self read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "addresses own" ON public.addresses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "restaurants public read" ON public.restaurants FOR SELECT TO anon, authenticated USING ((is_approved AND NOT is_blocked) OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "restaurants owner update" ON public.restaurants FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "restaurants admin insert" ON public.restaurants FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "restaurants admin delete" ON public.restaurants FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "menu public read" ON public.menu_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "menu owner write" ON public.menu_items FOR ALL TO authenticated USING (public.owns_restaurant(restaurant_id) OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.owns_restaurant(restaurant_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "cart own" ON public.cart FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "cart items own" ON public.cart_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.cart c WHERE c.id = cart_id AND c.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.cart c WHERE c.id = cart_id AND c.user_id = auth.uid()));
CREATE POLICY "coupons read active" ON public.coupons FOR SELECT TO authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "coupons admin write" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "partners read" ON public.delivery_partners FOR SELECT TO authenticated USING (true);
CREATE POLICY "partners admin write" ON public.delivery_partners FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders read" ON public.orders FOR SELECT TO authenticated USING (customer_id = auth.uid() OR public.owns_restaurant(restaurant_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders staff update" ON public.orders FOR UPDATE TO authenticated USING (public.owns_restaurant(restaurant_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "order items read" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.customer_id = auth.uid() OR public.owns_restaurant(o.restaurant_id) OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "payments read" ON public.payments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.customer_id = auth.uid() OR public.owns_restaurant(o.restaurant_id) OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "status log read" ON public.order_status_log FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.customer_id = auth.uid() OR public.owns_restaurant(o.restaurant_id) OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "reviews own insert" ON public.reviews FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid() AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid() AND o.status = 'delivered' AND o.restaurant_id = reviews.restaurant_id));
CREATE POLICY "favorites own" ON public.favorites FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.calculate_order_total(_subtotal numeric, _coupon_code text DEFAULT NULL)
RETURNS TABLE (subtotal numeric, gst numeric, delivery_fee numeric, discount numeric, total numeric, coupon_id uuid)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.coupons; d numeric := 0; fee numeric; g numeric;
BEGIN
  IF _coupon_code IS NOT NULL AND _coupon_code <> '' THEN
    SELECT * INTO c FROM public.coupons cc WHERE upper(cc.code) = upper(_coupon_code) AND cc.is_active;
    IF c.id IS NOT NULL AND _subtotal >= c.min_order THEN
      d := LEAST(round(_subtotal * c.discount_percent / 100.0, 2), c.max_discount);
    END IF;
  END IF;
  fee := CASE WHEN _subtotal >= 499 THEN 0 ELSE 40 END;
  g := round(_subtotal * 0.05, 2);
  RETURN QUERY SELECT _subtotal, g, fee::numeric, d, GREATEST(_subtotal + g + fee - d, 0), CASE WHEN d > 0 THEN c.id ELSE NULL END;
END $$;

CREATE OR REPLACE FUNCTION public.place_order(_restaurant_id uuid, _address_id uuid, _payment_method public.payment_method, _coupon_code text, _items jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); addr public.addresses; sub numeric := 0; bill record; oid uuid; it jsonb; mi public.menu_items;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO addr FROM public.addresses WHERE id = _address_id AND user_id = uid;
  IF addr.id IS NULL THEN RAISE EXCEPTION 'Please choose a delivery address'; END IF;
  IF jsonb_array_length(_items) = 0 THEN RAISE EXCEPTION 'Cart is empty'; END IF;
  FOR it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    SELECT * INTO mi FROM public.menu_items WHERE id = (it->>'menu_item_id')::uuid AND restaurant_id = _restaurant_id AND is_available;
    IF mi.id IS NULL THEN RAISE EXCEPTION 'An item is no longer available'; END IF;
    IF (it->>'quantity')::int <= 0 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    sub := sub + mi.price * (it->>'quantity')::int;
  END LOOP;
  SELECT * INTO bill FROM public.calculate_order_total(sub, _coupon_code);
  INSERT INTO public.orders (customer_id, restaurant_id, address_id, delivery_address, coupon_id, subtotal, gst, delivery_fee, discount, total)
  VALUES (uid, _restaurant_id, addr.id, addr.line1 || ', ' || addr.city || ' - ' || addr.pincode, bill.coupon_id, bill.subtotal, bill.gst, bill.delivery_fee, bill.discount, bill.total)
  RETURNING id INTO oid;
  FOR it IN SELECT * FROM jsonb_array_elements(_items) LOOP
    SELECT * INTO mi FROM public.menu_items WHERE id = (it->>'menu_item_id')::uuid;
    INSERT INTO public.order_items (order_id, menu_item_id, item_name, unit_price, quantity)
    VALUES (oid, mi.id, mi.name, mi.price, (it->>'quantity')::int);
  END LOOP;
  INSERT INTO public.payments (order_id, method, amount, status, transaction_ref)
  VALUES (oid, _payment_method, bill.total, CASE WHEN _payment_method = 'cod' THEN 'pending' ELSE 'paid' END,
          CASE WHEN _payment_method = 'cod' THEN NULL ELSE 'SIM' || upper(substr(md5(oid::text),1,10)) END);
  RETURN oid;
END $$;
REVOKE EXECUTE ON FUNCTION public.place_order(uuid, uuid, public.payment_method, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(uuid, uuid, public.payment_method, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_order_total(numeric, text) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.log_order_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_log (order_id, old_status, new_status, changed_by) VALUES (NEW.id, NULL, NEW.status, auth.uid());
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_log (order_id, old_status, new_status, changed_by) VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    IF NEW.status = 'delivered' THEN
      NEW.delivered_at := now();
      UPDATE public.payments SET status = 'paid' WHERE order_id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_order_status_ins AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.log_order_status();
CREATE TRIGGER trg_order_status_upd BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.log_order_status();

CREATE OR REPLACE FUNCTION public.refresh_restaurant_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.restaurants r SET
    avg_rating = (SELECT round(avg(rating)::numeric, 1) FROM public.reviews WHERE restaurant_id = NEW.restaurant_id),
    rating_count = (SELECT count(*) FROM public.reviews WHERE restaurant_id = NEW.restaurant_id)
  WHERE r.id = NEW.restaurant_id;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_review_rating AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.refresh_restaurant_rating();

CREATE VIEW public.restaurant_avg_rating WITH (security_invoker = true) AS
  SELECT r.id AS restaurant_id, r.name, COALESCE(round(avg(v.rating)::numeric,1), r.avg_rating) AS avg_rating, count(v.id) AS review_count
  FROM public.restaurants r LEFT JOIN public.reviews v ON v.restaurant_id = r.id GROUP BY r.id;
CREATE VIEW public.order_summary WITH (security_invoker = true) AS
  SELECT o.id, o.order_no, o.created_at, o.status, o.total, p.full_name AS customer_name, r.name AS restaurant_name,
         (SELECT sum(quantity) FROM public.order_items oi WHERE oi.order_id = o.id) AS item_count
  FROM public.orders o JOIN public.profiles p ON p.id = o.customer_id JOIN public.restaurants r ON r.id = o.restaurant_id;
CREATE VIEW public.daily_sales WITH (security_invoker = true) AS
  SELECT o.restaurant_id, date_trunc('day', o.created_at)::date AS day, count(*) AS orders, sum(o.total) AS revenue
  FROM public.orders o WHERE o.status NOT IN ('rejected','cancelled') GROUP BY 1, 2;
GRANT SELECT ON public.restaurant_avg_rating TO anon, authenticated;
GRANT SELECT ON public.order_summary, public.daily_sales TO authenticated;

ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

INSERT INTO public.coupons (code, description, discount_percent, max_discount, min_order) VALUES
('WELCOME50','50% off up to ₹100 on orders above ₹149', 50, 100, 149),
('FOODIE20','20% off up to ₹80 on orders above ₹199', 20, 80, 199),
('SAMBHAJINAGAR100','25% off up to ₹100 on orders above ₹399', 25, 100, 399),
('BIRYANI15','15% off up to ₹60 on orders above ₹249', 15, 60, 249),
('MEGA30','30% off up to ₹150 on orders above ₹599', 30, 150, 599);
INSERT INTO public.delivery_partners (name, phone, vehicle_no) VALUES
('Rahul Jadhav','9876500001','MH12 AB 1234'),
('Sneha Kulkarni','9876500002','MH12 CD 5678'),
('Amit Shinde','9876500003','MH14 EF 9012'),
('Pooja Patil','9876500004','MH12 GH 3456'),
('Vikas More','9876500005','MH14 IJ 7890');

INSERT INTO public.categories (name, sort_order, image_url) VALUES
('Burger', 1, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80'),
('Pizza', 2, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80'),
('Biryani & Rice', 3, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80'),
('Maharashtrian', 4, 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80'),
('South Indian', 5, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80'),
('Chinese', 6, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80'),
('North Indian', 7, 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80'),
('Desserts & Drinks', 8, 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80');

INSERT INTO public.restaurants (name, cuisine, description, image_url, address, eta_minutes, cost_for_two, offer_text, avg_rating, is_approved) VALUES
('Burger Barn', 'Burger', 'Juicy smash burgers & loaded fries', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', 'Koregaon Park, Chhatrapati Sambhajinagar', 25, 350, '50% OFF up to ₹100', 4.4, true),
('Mumbai Street Bites', 'Burger', 'Desi-style burgers and street snacks', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80', 'Shivaji Nagar, Chhatrapati Sambhajinagar', 20, 250, 'Free delivery', 4.2, true),
('Pizza Piazza', 'Pizza', 'Wood-fired Neapolitan pizzas', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80', 'Baner, Chhatrapati Sambhajinagar', 35, 600, 'Buy 1 Get 1', 4.6, true),
('La Forno Express', 'Pizza', 'Thin-crust pizzas, fast', 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=800&q=80', 'Kothrud, Chhatrapati Sambhajinagar', 30, 450, '20% OFF', 4.1, true),
('Biryani Darbar', 'Biryani & Rice', 'Dum-cooked Hyderabadi biryani', 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&q=80', 'Camp, Chhatrapati Sambhajinagar', 40, 500, '₹125 OFF above ₹499', 4.7, true),
('Aai''s Kitchen', 'Maharashtrian', 'Homestyle Maharashtrian thali & snacks', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80', 'Sadashiv Peth, Chhatrapati Sambhajinagar', 25, 300, '10% OFF', 4.5, true),
('Lokseva', 'Maharashtrian', 'Misal, vada pav & sambhajinagar's classics', 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80', 'Deccan, Chhatrapati Sambhajinagar', 20, 200, 'Free delivery', 4.8, true),
('Udupi Swaad', 'South Indian', 'Crispy dosas & fluffy idlis', 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&q=80', 'FC Road, Chhatrapati Sambhajinagar', 25, 250, '15% OFF', 4.5, true),
('Wok This Way', 'Chinese', 'Indo-Chinese wok tossed favourites', 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&q=80', 'Viman Nagar, Chhatrapati Sambhajinagar', 30, 400, '₹75 OFF', 4.3, true),
('Punjab Da Dhaba', 'North Indian', 'Butter-rich Punjabi curries & naan', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80', 'Hinjewadi, Chhatrapati Sambhajinagar', 35, 550, '20% OFF up to ₹120', 4.6, true),
('Sweet Tooth Café', 'Desserts & Drinks', 'Cakes, brownies & sundaes', 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&q=80', 'Aundh, Chhatrapati Sambhajinagar', 20, 300, 'Buy 2 Get 1', 4.7, true),
('Chai & Shakes Co.', 'Desserts & Drinks', 'Chai, cold coffee & thick shakes', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80', 'Wakad, Chhatrapati Sambhajinagar', 15, 200, 'Free delivery', 4.4, true);

INSERT INTO public.menu_items (restaurant_id, category_id, name, price, is_veg, rating, description, image_url)
SELECT r.id, c.id, v.name, v.price, v.veg, v.rating, v.descr, 'https://images.unsplash.com/photo-' || v.img || '?w=800&q=80'
FROM (VALUES
(1,'Classic Smash Burger',199,false,4.5,'Double smashed  patty, cheddar, house sauce','1568901346375-23c9450c58cd'),
(1,'Aloo Tikki Burger',99,true,4.2,'Crispy spiced potato patty with tangy mint mayo','1550547660-d9450f859349'),
(1,'Paneer Makhani Burger',179,true,4.4,'Grilled paneer slab in makhani glaze, onions','1553979459-d2229ba7433b'),
(1,'Crispy Zinger',219,false,4.6,'Fiery fried  fillet, lettuce, chipotle','1571091718767-18b5b1457add'),
(1,'Cheese Lava Veg Burger',159,true,4.3,'Molten cheese core veg patty, jalapeños','1568901346375-23c9450c58cd'),
(1,'BBQ  Beast',299,false,4.7,'Smoky grilled , BBQ sauce, onion rings','1550547660-d9450f859349'),
(2,'Vada Pav Burger',89,true,4.4,'Bombay vada in a brioche bun with garlic chutney','1553979459-d2229ba7433b'),
(2,'Masala Egg Burger',119,false,4.1,'Spiced egg omelette patty with green chutney','1571091718767-18b5b1457add'),
(2,'Tandoori  Burger',189,false,4.5,'Tandoori-marinated , onion, mint mayo','1568901346375-23c9450c58cd'),
(2,'Schezwan Veg Burger',129,true,4.2,'Crunchy veg patty tossed in Schezwan sauce','1550547660-d9450f859349'),
(3,'Margherita Classica',299,true,4.6,'San Marzano tomato, fresh mozzarella, basil','1565299624946-b28f40a0ae38'),
(3,'Farmhouse Supreme',379,true,4.4,'Capsicum, onion, mushroom, sweet corn, olives','1513104890138-7c749659a591'),
(3,'Pepperoni Overload',449,false,4.7,'Double  pepperoni with mozzarella','1574071318508-1cdbab80d002'),
(3,'Paneer Tikka Pizza',399,true,4.5,'Tandoori paneer, onion, capsicum, mint drizzle','1594007654729-407eedc4be65'),
(3,'BBQ  Pizza',429,false,4.5,'Smoky BBQ , red onion, cilantro','1565299624946-b28f40a0ae38'),
(3,'Four Cheese Bianca',459,true,4.6,'Mozzarella, cheddar, parmesan, gouda – no sauce','1513104890138-7c749659a591'),
(4,'Veggie Delight Thin Crust',249,true,4.2,'Thin crust loaded with garden veggies','1574071318508-1cdbab80d002'),
(4,' Tikka Thin Crust',329,false,4.4,'Spicy  tikka, onion, jalapeño','1594007654729-407eedc4be65'),
(4,'Corn & Cheese Pizza',219,true,4.1,'Sweet corn and gooey mozzarella','1565299624946-b28f40a0ae38'),
(4,'Mexican Green Wave',289,true,4.3,'Peppers, onion, jalapeño, Mexican herbs','1513104890138-7c749659a591'),
(5,'Hyderabadi  Dum Biryani',329,false,4.7,'Long-grain basmati slow-cooked with chicken and saffron','1563379091339-03b21ab4a4f8'),
(5,'Mutton Dum Biryani',429,false,4.8,'Tender mutton layered with fragrant rice','1589302168068-964664d93dc0'),
(5,'Veg Dum Biryani',249,true,4.3,'Seasonal veggies, mint and fried onions','1631515243349-e0cb75fb8d3a'),
(5,'Paneer Tikka Biryani',289,true,4.4,'Smoky paneer tikka over saffron rice','1563379091339-03b21ab4a4f8'),
(5,'Egg Biryani',229,false,4.3,'Boiled eggs in spiced masala and basmati','1589302168068-964664d93dc0'),
(5,'Jeera Rice with Dal Tadka',179,true,4.2,'Cumin rice with tempered yellow dal','1631515243349-e0cb75fb8d3a'),
(5,'Prawns Biryani',459,false,4.6,'Coastal prawns with Malabar spices','1563379091339-03b21ab4a4f8'),
(5,'Chicken 65 Fried Rice',249,false,4.3,'Wok-fried rice with crispy chicken 65','1589302168068-964664d93dc0'),
(6,'Puran Poli',129,true,4.7,'Sweet lentil-jaggery stuffed flatbread with ghee','1606491956689-2ea866880c84'),
(6,'Thalipeeth',109,true,4.5,'Multigrain spiced flatbread with white butter','1601050690597-df0568f70950'),
(6,'Kothimbir Vadi',99,true,4.4,'Crispy coriander gram-flour fritters','1567188040759-fb8a883dc6d8'),
(6,'Sabudana Khichdi',99,true,4.5,'Tapioca pearls with peanuts and green chilli','1606755962773-d324e0a13086'),
(6,'Bharli Vangi with Bhakri',169,true,4.6,'Stuffed brinjal curry with jowar bhakri','1606491956689-2ea866880c84'),
(7,'Chhatrapati Sambhajinagar Misal Pav',119,true,4.8,'Fiery sprouted moth curry, farsan, pav','1601050690597-df0568f70950'),
(7,'Vada Pav',39,true,4.7,'Spiced potato vada, garlic chutney, soft pav','1567188040759-fb8a883dc6d8'),
(7,'Pav Bhaji',139,true,4.7,'Buttery mashed veggie bhaji with toasted pav','1606755962773-d324e0a13086'),
(7,'Kolhapuri Chicken Rassa',249,false,4.6,'Spicy Kolhapuri chicken in tambda rassa','1606491956689-2ea866880c84'),
(7,'Sabudana Vada',89,true,4.4,'Crispy sago patties with peanut curd chutney','1601050690597-df0568f70950'),
(8,'Masala Dosa',99,true,4.6,'Crispy rice crepe with spiced potato filling','1589301760014-d929f3979dbc'),
(8,'Mysore Masala Dosa',119,true,4.6,'Red chutney smeared dosa with potato masala','1630383249896-424e482df921'),
(8,'Idli Sambar (3 pcs)',79,true,4.5,'Steamed rice cakes with sambar and chutneys','1668236543090-82eba5ee5976'),
(8,'Medu Vada (2 pcs)',79,true,4.4,'Crispy lentil donuts with coconut chutney','1589301760014-d929f3979dbc'),
(8,'Rava Onion Uttapam',109,true,4.3,'Semolina pancake topped with onions','1630383249896-424e482df921'),
(8,'Ghee Roast Dosa',139,true,4.7,'Paper thin dosa roasted in pure ghee','1668236543090-82eba5ee5976'),
(8,'Chicken Chettinad with Appam',249,false,4.5,'Peppery Chettinad chicken with soft appams','1589301760014-d929f3979dbc'),
(8,'Filter Coffee',49,true,4.8,'Strong South Indian decoction with milk','1630383249896-424e482df921'),
(9,'Veg Hakka Noodles',169,true,4.3,'Wok-tossed noodles with crunchy veggies','1585032226651-759b368d7246'),
(9,'Chicken Schezwan Noodles',209,false,4.5,'Spicy Schezwan noodles with chicken','1563245372-f21724e3856d'),
(9,'Veg Manchurian Gravy',179,true,4.4,'Veg balls in garlic-soy gravy','1525755662778-989d0524087e'),
(9,'Chilli Chicken Dry',229,false,4.6,'Crispy chicken tossed with peppers and chilli','1585032226651-759b368d7246'),
(9,'Paneer Chilli',209,true,4.4,'Paneer cubes in sweet-spicy chilli sauce','1563245372-f21724e3856d'),
(9,'Chicken Fried Rice',199,false,4.3,'Egg and chicken wok-fried rice','1525755662778-989d0524087e'),
(9,'Veg Spring Rolls',149,true,4.2,'Crispy rolls stuffed with cabbage and carrot','1585032226651-759b368d7246'),
(9,'Chicken Momos (8 pcs)',159,false,4.5,'Steamed dumplings with spicy red chutney','1563245372-f21724e3856d'),
(10,'Butter Chicken',319,false,4.8,'Tandoori chicken in creamy tomato makhani','1585937421612-70a008356fbe'),
(10,'Paneer Butter Masala',269,true,4.6,'Soft paneer in rich buttery gravy','1603894584373-5ac82b2ae398'),
(10,'Dal Makhani',219,true,4.7,'Black lentils slow-cooked overnight with butter','1565557623262-b51c2513a641'),
(10,'Chole Bhature',169,true,4.6,'Spicy chickpeas with fluffy fried bread','1585937421612-70a008356fbe'),
(10,'Amritsari Kulcha',149,true,4.5,'Stuffed tandoor kulcha with chole','1603894584373-5ac82b2ae398'),
(10,'Mutton Rogan Josh',399,false,4.6,'Kashmiri style aromatic mutton curry','1565557623262-b51c2513a641'),
(10,'Garlic Butter Naan',59,true,4.5,'Tandoor naan brushed with garlic butter','1585937421612-70a008356fbe'),
(10,'Tandoori Chicken (Half)',279,false,4.7,'Charred yoghurt-marinated chicken','1603894584373-5ac82b2ae398'),
(11,'Gulab Jamun (2 pcs)',69,true,4.7,'Warm khoya dumplings in rose syrup','1563805042-7684c019e1cb'),
(11,'Sizzling Brownie',189,true,4.8,'Hot brownie with vanilla ice cream and fudge','1551024506-0bccd828d307'),
(11,'Rasmalai (2 pcs)',99,true,4.6,'Soft chenna discs in saffron milk','1572490122747-3968b75cc699'),
(11,'Belgian Chocolate Pastry',139,true,4.5,'Layers of rich Belgian chocolate','1488477181946-6428a0291777'),
(11,'Gajar Halwa',119,true,4.6,'Slow-cooked carrot pudding with nuts','1563805042-7684c019e1cb'),
(11,'Death by Chocolate Sundae',229,true,4.7,'Brownie, chocolate ice cream, hot fudge','1551024506-0bccd828d307'),
(12,'Masala Chai',39,true,4.7,'Ginger-cardamom kadak chai','1572490122747-3968b75cc699'),
(12,'Cold Coffee with Ice Cream',129,true,4.6,'Thick blended coffee with a scoop of ice cream','1488477181946-6428a0291777'),
(12,'Mango Lassi',99,true,4.7,'Alphonso mango blended with creamy curd','1563805042-7684c019e1cb'),
(12,'Oreo Thick Shake',149,true,4.5,'Crushed Oreo cookies blended thick','1551024506-0bccd828d307')
) AS v(ridx, name, price, veg, rating, descr, img)
JOIN (VALUES (1,'Burger Barn'),(2,'Mumbai Street Bites'),(3,'Pizza Piazza'),(4,'La Forno Express'),(5,'Biryani Darbar'),(6,'Aai''s Kitchen'),(7,'Lokseva'),(8,'Udupi Swaad'),(9,'Wok This Way'),(10,'Punjab Da Dhaba'),(11,'Sweet Tooth Café'),(12,'Chai & Shakes Co.')) AS m(ridx, rname) ON m.ridx = v.ridx
JOIN public.restaurants r ON r.name = m.rname
JOIN public.categories c ON c.name = r.cuisine;