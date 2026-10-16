/**
 * All cafe data lives here. To use real photos later, just replace the image URLs
 * (cover / logo / item images) and ask to re-sync the cafes to the database.
 */
const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80`;

export const IMG = {
  latte: u("1509042239860-f550ce710b93"),
  coffee: u("1495474472287-4d71bcdd2085"),
  coldCoffee: u("1517701604599-bb29b565090c"),
  shake: u("1572490122747-3968b75cc699"),
  mojito: u("1551538827-9c037cb4f32a"),
  sandwich: u("1528735602780-2552fd46c7af"),
  pasta: u("1621996346565-e3dbc646d9a9"),
  pizza: u("1513104890138-7c749659a591"),
  fries: u("1573080496219-bb080dd4f877"),
  brownie: u("1606313564200-e75d5e30476c"),
  waffle: u("1562376552-0d160a2f238d"),
};

export type CafeItem = { name: string; price: number; veg: boolean; rating: number; description: string; image: string };
export type Cafe = {
  name: string; area: string; cuisine: string; description: string; rating: number; eta: number;
  costForTwo: number; offer: string; cover: string; logo: string; menu: CafeItem[];
};

export const CAFES: Cafe[] = [
  {
    name: "Linzz Cafe", area: "Cidco", cuisine: "Cafe · Continental", description: "Cosy hangout with great coffee and loaded fries",
    rating: 4.5, eta: 20, costForTwo: 450, offer: "20% OFF on coffees", cover: u("1501339847302-ac426a4a7cbb"), logo: IMG.latte,
    menu: [
      { name: "Cappuccino", price: 149, veg: true, rating: 4.6, description: "Double shot espresso with silky foam", image: IMG.latte },
      { name: "Classic Cold Coffee", price: 169, veg: true, rating: 4.7, description: "Chilled blended coffee with ice cream", image: IMG.coldCoffee },
      { name: "Oreo Shake", price: 189, veg: true, rating: 4.5, description: "Thick shake with crushed Oreos", image: IMG.shake },
      { name: "Virgin Mint Mojito", price: 149, veg: true, rating: 4.4, description: "Lime, mint and soda", image: IMG.mojito },
      { name: "Grilled Veg Sandwich", price: 159, veg: true, rating: 4.3, description: "Grilled with cheese and veggies", image: IMG.sandwich },
      { name: "Chicken Club Sandwich", price: 219, veg: false, rating: 4.5, description: "Triple decker with chicken and egg", image: IMG.sandwich },
      { name: "Peri Peri Fries", price: 139, veg: true, rating: 4.4, description: "Crispy fries with peri peri spice", image: IMG.fries },
      { name: "Walnut Brownie", price: 129, veg: true, rating: 4.6, description: "Fudgy brownie with walnuts", image: IMG.brownie },
    ],
  },
  {
    name: "Two Stories Cafe", area: "Osmanpura", cuisine: "Cafe · Italian", description: "Two floors of pasta, pizza and conversations",
    rating: 4.6, eta: 25, costForTwo: 600, offer: "Free brownie above ₹599", cover: u("1554118811-1e0d58224f24"), logo: IMG.coffee,
    menu: [
      { name: "Hazelnut Latte", price: 179, veg: true, rating: 4.6, description: "Latte with hazelnut syrup", image: IMG.latte },
      { name: "Irish Cold Coffee", price: 199, veg: true, rating: 4.5, description: "Cold coffee with Irish syrup", image: IMG.coldCoffee },
      { name: "Penne Arrabbiata", price: 249, veg: true, rating: 4.4, description: "Spicy tomato sauce penne", image: IMG.pasta },
      { name: "Chicken Alfredo Pasta", price: 299, veg: false, rating: 4.6, description: "Creamy white sauce with chicken", image: IMG.pasta },
      { name: "Margherita Pizza", price: 279, veg: true, rating: 4.5, description: "Classic tomato and mozzarella", image: IMG.pizza },
      { name: "BBQ Chicken Pizza", price: 349, veg: false, rating: 4.6, description: "Smoky BBQ chicken pizza", image: IMG.pizza },
      { name: "Belgian Waffle", price: 199, veg: true, rating: 4.7, description: "With chocolate sauce and ice cream", image: IMG.waffle },
      { name: "Blue Lagoon Mojito", price: 159, veg: true, rating: 4.3, description: "Blue curacao mocktail", image: IMG.mojito },
      { name: "Cheese Fries", price: 169, veg: true, rating: 4.4, description: "Fries with molten cheese sauce", image: IMG.fries },
    ],
  },
  {
    name: "La Casa", area: "Jalna Road", cuisine: "Cafe · Mexican", description: "Warm Mexican-themed cafe with shakes and pizzas",
    rating: 4.4, eta: 25, costForTwo: 550, offer: "15% OFF", cover: u("1445116572660-236099ec97a0"), logo: IMG.coldCoffee,
    menu: [
      { name: "Americano", price: 129, veg: true, rating: 4.3, description: "Espresso with hot water", image: IMG.coffee },
      { name: "Caramel Frappe", price: 199, veg: true, rating: 4.6, description: "Iced caramel coffee", image: IMG.coldCoffee },
      { name: "KitKat Shake", price: 199, veg: true, rating: 4.5, description: "Blended with KitKat", image: IMG.shake },
      { name: "Mexican Veg Pizza", price: 289, veg: true, rating: 4.4, description: "Jalapeño, corn, peppers", image: IMG.pizza },
      { name: "Chicken Tikka Pizza", price: 339, veg: false, rating: 4.5, description: "Tikka chicken and onions", image: IMG.pizza },
      { name: "Paneer Sandwich", price: 179, veg: true, rating: 4.3, description: "Spiced paneer grilled sandwich", image: IMG.sandwich },
      { name: "Nacho Fries", price: 159, veg: true, rating: 4.2, description: "Fries with salsa and cheese", image: IMG.fries },
      { name: "Choco Lava Brownie", price: 149, veg: true, rating: 4.6, description: "Warm brownie with molten centre", image: IMG.brownie },
    ],
  },
  {
    name: "Coffee N Cuisines Cafe", area: "Garkheda", cuisine: "Cafe · Multi-cuisine", description: "Coffee, cuisines and comfort food",
    rating: 4.3, eta: 20, costForTwo: 400, offer: "₹50 OFF above ₹399", cover: u("1559925393-8be0ec4767c8"), logo: IMG.coffee,
    menu: [
      { name: "Filter Coffee", price: 79, veg: true, rating: 4.5, description: "South Indian style", image: IMG.coffee },
      { name: "Mocha", price: 169, veg: true, rating: 4.4, description: "Coffee with chocolate", image: IMG.latte },
      { name: "Cold Brew", price: 179, veg: true, rating: 4.5, description: "18-hour steeped coffee", image: IMG.coldCoffee },
      { name: "Strawberry Shake", price: 169, veg: true, rating: 4.3, description: "Fresh strawberry shake", image: IMG.shake },
      { name: "White Sauce Pasta", price: 229, veg: true, rating: 4.3, description: "Creamy veg pasta", image: IMG.pasta },
      { name: "Egg Mayo Sandwich", price: 149, veg: false, rating: 4.2, description: "Egg and mayo on toast", image: IMG.sandwich },
      { name: "Salted Fries", price: 109, veg: true, rating: 4.2, description: "Classic salted fries", image: IMG.fries },
      { name: "Nutella Waffle", price: 219, veg: true, rating: 4.7, description: "Waffle loaded with Nutella", image: IMG.waffle },
    ],
  },
  {
    name: "Senorita Urban Bites", area: "Samarth Nagar", cuisine: "Cafe · Fast food", description: "Urban bites, mojitos and late-night munchies",
    rating: 4.4, eta: 20, costForTwo: 450, offer: "Buy 1 Get 1 on mojitos", cover: u("1461023058943-07fcbe16d735"), logo: IMG.mojito,
    menu: [
      { name: "Watermelon Mojito", price: 159, veg: true, rating: 4.5, description: "Fresh watermelon and mint", image: IMG.mojito },
      { name: "Green Apple Mojito", price: 159, veg: true, rating: 4.4, description: "Tangy green apple cooler", image: IMG.mojito },
      { name: "Vanilla Cold Coffee", price: 169, veg: true, rating: 4.4, description: "With vanilla ice cream", image: IMG.coldCoffee },
      { name: "Chicken Pizza", price: 319, veg: false, rating: 4.4, description: "Loaded chicken pizza", image: IMG.pizza },
      { name: "Farmhouse Pizza", price: 269, veg: true, rating: 4.3, description: "Veggie loaded pizza", image: IMG.pizza },
      { name: "Chicken Mayo Sandwich", price: 189, veg: false, rating: 4.4, description: "Shredded chicken with mayo", image: IMG.sandwich },
      { name: "Masala Fries", price: 129, veg: true, rating: 4.3, description: "Fries in desi masala", image: IMG.fries },
      { name: "Brownie Sundae", price: 189, veg: true, rating: 4.6, description: "Brownie, ice cream, fudge", image: IMG.brownie },
      { name: "Chocolate Shake", price: 179, veg: true, rating: 4.5, description: "Rich chocolate shake", image: IMG.shake },
    ],
  },
  {
    name: "Exotica", area: "Nirala Bazar", cuisine: "Cafe · Desserts", description: "Exotic shakes, waffles and coffee",
    rating: 4.5, eta: 25, costForTwo: 500, offer: "10% OFF", cover: u("1572442388796-11668a67e53d"), logo: IMG.waffle,
    menu: [
      { name: "Espresso", price: 99, veg: true, rating: 4.4, description: "Single origin shot", image: IMG.coffee },
      { name: "Spanish Latte", price: 189, veg: true, rating: 4.6, description: "Latte with condensed milk", image: IMG.latte },
      { name: "Hazelnut Cold Coffee", price: 189, veg: true, rating: 4.5, description: "Iced hazelnut coffee", image: IMG.coldCoffee },
      { name: "Biscoff Shake", price: 219, veg: true, rating: 4.7, description: "Lotus Biscoff thick shake", image: IMG.shake },
      { name: "Red Velvet Waffle", price: 229, veg: true, rating: 4.6, description: "With cream cheese drizzle", image: IMG.waffle },
      { name: "Pink Sauce Pasta", price: 249, veg: true, rating: 4.4, description: "Mix of red and white sauce", image: IMG.pasta },
      { name: "Cheese Corn Sandwich", price: 169, veg: true, rating: 4.3, description: "Sweet corn and cheese", image: IMG.sandwich },
      { name: "Fudge Brownie", price: 139, veg: true, rating: 4.5, description: "Dense chocolate fudge brownie", image: IMG.brownie },
    ],
  },
];
