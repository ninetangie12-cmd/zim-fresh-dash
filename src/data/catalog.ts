/**
 * Demo catalogue, stores and delivery zones.
 *
 * Neutral, original content — no retailer-owned descriptions or artwork.
 * All prices are ESTIMATES until a shopper confirms the shelf price.
 */

import productTomatoes from "@/assets/product-tomatoes.jpg";
import productApples from "@/assets/product-apples.jpg";
import productAvocados from "@/assets/product-avocados.jpg";
import productBananas from "@/assets/product-bananas.jpg";
import productSweetPotatoes from "@/assets/product-sweet-potatoes.jpg";
import productSpinach from "@/assets/product-spinach.jpg";
import productMilk from "@/assets/product-milk.jpg";
import productSourdough from "@/assets/product-sourdough.jpg";

export type StockStatus =
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "unavailable"
  | "other_store";

export const stockLabels: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
  unavailable: "Temporarily unavailable",
  other_store: "Available at another store",
};

export type StoreStatus = "open" | "busy" | "closed";

export type StoreCategoryFilter =
  | "All"
  | "Supermarkets"
  | "Fresh Produce & Butchery"
  | "Liquor & Drinks"
  | "Health & Pharmacy"
  | "Bakeries & Treats";

export const storeFilterCategories: StoreCategoryFilter[] = [
  "All",
  "Supermarkets",
  "Fresh Produce & Butchery",
  "Liquor & Drinks",
  "Health & Pharmacy",
  "Bakeries & Treats",
];

export type Store = {
  id: string;
  name: string;
  slug: string;
  description: string;
  categories: string[];
  primaryCategories: string;
  categoryFilter: Exclude<StoreCategoryFilter, "All">;
  coverImage: string;
  logoBg: string;
  logoText: string;
  logoType?: "supermarket" | "farm" | "meat" | "liquor" | "wine" | "pharmacy" | "bakery" | "shopper";
  etaMinutes: [number, number];
  deliveryFee: number;
  minimumOrder: number;
  status: StoreStatus;
  statusText?: string;
  rating: number;
  reviewCount: number;
  distance: string;
  promoBadge?: string;
  liquor?: boolean;
  sourcing?: boolean;
  /** Where the shopper collects the order. Used by the shopper and rider screens. */
  pickup: {
    branch: string;
    address: string;
    /** Free-text map search used for the navigation link. */
    mapQuery: string;
    phone: string;
    hours: string;
    collectionPoint: string;
  };
};

export const stores: Store[] = [
  {
    id: "tm-pnp",
    slug: "tm-pick-n-pay",
    name: "TM Pick n Pay",
    description: "Groceries, fresh produce, butchery, and everyday household essentials.",
    categories: ["Fresh produce", "Butchery", "Bakery", "Pantry", "Household"],
    primaryCategories: "Groceries • Fresh Bakery • Pantry • Essentials",
    categoryFilter: "Supermarkets",
    coverImage: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=800&q=80",
    logoBg: "bg-red-600",
    logoText: "TM",
    logoType: "supermarket",
    etaMinutes: [35, 50],
    deliveryFee: 3.5,
    minimumOrder: 10,
    status: "open",
    statusText: "Open",
    rating: 4.8,
    reviewCount: 520,
    distance: "2.4 km",
    promoBadge: "10% Off First Shop",
    pickup: {
      branch: "Avondale branch",
      address: "Cnr King George Road & Josiah Tongogara Avenue, Avondale, Harare",
      mapQuery: "King George Road, Avondale, Harare",
      phone: "+263 77 000 0011",
      hours: "Monday to Sunday, 08:00 - 19:00",
      collectionPoint: "Collections desk beside till 12, at the trolley bay entrance.",
    },
  },
  {
    id: "supermarket-express",
    slug: "supermarket-express",
    name: "Supermarket Express",
    description: "Fast on-demand everyday grocery staples, dairy, snacks, and toiletries.",
    categories: ["Groceries", "Pantry", "Snacks", "Dairy", "Household"],
    primaryCategories: "Groceries • Dairy • Pantry • Snacks",
    categoryFilter: "Supermarkets",
    coverImage: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
    logoBg: "bg-emerald-600",
    logoText: "SE",
    logoType: "supermarket",
    etaMinutes: [25, 40],
    deliveryFee: 2.0,
    minimumOrder: 8,
    status: "open",
    statusText: "Open",
    rating: 4.7,
    reviewCount: 380,
    distance: "1.9 km",
    promoBadge: "Free Delivery over $25",
    pickup: {
      branch: "Harare CBD Express Hub",
      address: "Cnr First St & Nelson Mandela Ave, Harare CBD",
      mapQuery: "Nelson Mandela Ave, Harare",
      phone: "+263 77 000 0015",
      hours: "Daily 07:30 - 20:00",
      collectionPoint: "Express dispatch counter at main entrance.",
    },
  },
  {
    id: "daily-greens",
    slug: "daily-greens-farm-store",
    name: "Daily Greens Farm Store",
    description: "Crisp local vegetables, seasonal fruit and farm-picked greens delivered fresh.",
    categories: ["Fresh produce", "Organic", "Salads", "Herbs"],
    primaryCategories: "Organic Greens • Fresh Fruits • Farm Herbs",
    categoryFilter: "Fresh Produce & Butchery",
    coverImage: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80",
    logoBg: "bg-emerald-700",
    logoText: "DG",
    logoType: "farm",
    etaMinutes: [20, 35],
    deliveryFee: 0,
    minimumOrder: 6,
    status: "open",
    statusText: "Open",
    rating: 4.9,
    reviewCount: 290,
    distance: "1.5 km",
    promoBadge: "Free Delivery",
    pickup: {
      branch: "Borrowdale Farm Market",
      address: "Borrowdale Village Walk, Harare",
      mapQuery: "Borrowdale Village, Harare",
      phone: "+263 77 000 0016",
      hours: "Daily 08:00 - 18:30",
      collectionPoint: "Farm produce bay 2.",
    },
  },
  {
    id: "fresh-meat-market",
    slug: "fresh-meat-market",
    name: "Fresh Meat Market",
    description: "Grade-A Zimbabwean beef, boerewors, braai cuts, and grain-fed poultry.",
    categories: ["Beef", "Chicken", "Braai packs", "Pork", "Boerewors"],
    primaryCategories: "Prime Beef • Braai Packs • Poultry • Wors",
    categoryFilter: "Fresh Produce & Butchery",
    coverImage: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=80",
    logoBg: "bg-rose-700",
    logoText: "FM",
    logoType: "meat",
    etaMinutes: [30, 45],
    deliveryFee: 2.5,
    minimumOrder: 12,
    status: "open",
    statusText: "Open",
    rating: 4.9,
    reviewCount: 410,
    distance: "3.1 km",
    promoBadge: "Braai Packs Special",
    pickup: {
      branch: "Belgravia Butchery Center",
      address: "12 Sam Nujoma St, Belgravia, Harare",
      mapQuery: "Belgravia, Harare",
      phone: "+263 77 000 0017",
      hours: "Monday to Saturday 08:00 - 18:00, Sun 08:00 - 14:00",
      collectionPoint: "Butchery cold storage dispatch room.",
    },
  },
  {
    id: "sunset-liquors",
    slug: "sunset-liquors",
    name: "Sunset Liquors",
    description: "Ice-cold beers, imported wines, fine spirits and instant party mixes.",
    categories: ["Beer", "Wine", "Spirits", "Mixers"],
    primaryCategories: "Craft Beer • Fine Wine • Spirits • Mixers",
    categoryFilter: "Liquor & Drinks",
    coverImage: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
    logoBg: "bg-amber-700",
    logoText: "SL",
    logoType: "wine",
    etaMinutes: [25, 40],
    deliveryFee: 3.0,
    minimumOrder: 10,
    status: "open",
    statusText: "Open",
    rating: 4.8,
    reviewCount: 340,
    distance: "2.8 km",
    promoBadge: "Weekend Chilled Pack",
    liquor: true,
    pickup: {
      branch: "Milton Park Branch",
      address: "Bishop Gaul Ave, Milton Park, Harare",
      mapQuery: "Milton Park, Harare",
      phone: "+263 77 000 0018",
      hours: "Monday to Sunday 09:30 - 20:00",
      collectionPoint: "Drive-through collection hatch.",
    },
  },
  {
    id: "liquor-supplies",
    slug: "liquor-supplies",
    name: "Liquor Supplies Depot",
    description: "Beer crates, wine cases, spirits and bulk party essentials at depot prices.",
    categories: ["Beer", "Wine", "Spirits", "Mixers"],
    primaryCategories: "Beer Cases • Wine • Spirits • Mixers",
    categoryFilter: "Liquor & Drinks",
    coverImage: "https://images.unsplash.com/photo-1527061011665-3652c757a4d4?auto=format&fit=crop&w=800&q=80",
    logoBg: "bg-indigo-700",
    logoText: "LS",
    logoType: "liquor",
    etaMinutes: [40, 55],
    deliveryFee: 4.0,
    minimumOrder: 15,
    status: "closed",
    statusText: "Opens at 9 AM",
    rating: 4.6,
    reviewCount: 180,
    distance: "3.6 km",
    promoBadge: "Bulk Savings",
    liquor: true,
    pickup: {
      branch: "Milton Park depot",
      address: "18 Fife Avenue, Milton Park, Harare",
      mapQuery: "Fife Avenue, Milton Park, Harare",
      phone: "+263 77 000 0012",
      hours: "Monday to Saturday, 09:00 - 20:00. Sunday 10:00 - 17:00.",
      collectionPoint: "Rear loading gate on Fife Avenue. Ring the bell and show the order number.",
    },
  },
  {
    id: "city-pharmacy",
    slug: "city-pharmacy",
    name: "City Pharmacy & Wellness",
    description: "Prescriptions, over-the-counter medicine, vitamins, skincare, and first aid.",
    categories: ["Vitamins", "First Aid", "Skincare", "Personal Care", "Baby Care"],
    primaryCategories: "Vitamins • Prescriptions • First Aid • Skincare",
    categoryFilter: "Health & Pharmacy",
    coverImage: "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=800&q=80",
    logoBg: "bg-teal-600",
    logoText: "CP",
    logoType: "pharmacy",
    etaMinutes: [20, 30],
    deliveryFee: 1.5,
    minimumOrder: 5,
    status: "open",
    statusText: "Open",
    rating: 4.9,
    reviewCount: 160,
    distance: "1.2 km",
    promoBadge: "Express Rx",
    pickup: {
      branch: "Samora Machel Medical Centre",
      address: "84 Samora Machel Avenue, Harare CBD",
      mapQuery: "Samora Machel Ave, Harare",
      phone: "+263 77 000 0019",
      hours: "Daily 07:00 - 21:00",
      collectionPoint: "Pharmacy express drive-up hatch.",
    },
  },
  {
    id: "avondale-bakehouse",
    slug: "avondale-bakehouse",
    name: "Avondale Bakehouse & Treats",
    description: "Freshly baked artisan sourdough, burger rolls, warm croissants, cakes and pastries.",
    categories: ["Bakery", "Pastries", "Cakes", "Rolls"],
    primaryCategories: "Artisan Bread • Pastries • Cakes • Rolls",
    categoryFilter: "Bakeries & Treats",
    coverImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    logoBg: "bg-amber-600",
    logoText: "AB",
    logoType: "bakery",
    etaMinutes: [25, 35],
    deliveryFee: 2.0,
    minimumOrder: 6,
    status: "open",
    statusText: "Open",
    rating: 4.8,
    reviewCount: 275,
    distance: "1.8 km",
    promoBadge: "Freshly Baked",
    pickup: {
      branch: "Avondale Shops",
      address: "King George Rd, Avondale, Harare",
      mapQuery: "Avondale Shops, Harare",
      phone: "+263 77 000 0020",
      hours: "Daily 06:30 - 18:00",
      collectionPoint: "Bakery entrance collection counter.",
    },
  },
  {
    id: "shop-for-me",
    slug: "shop-for-me",
    name: "Shop for Me Concierge",
    description: "Personal shopper service: we'll source items from any Harare retailer for you.",
    categories: ["Anything on your list", "Best available price", "Nearest supermarket"],
    primaryCategories: "Custom Shopping • Any Harare Store • Fast Sourcing",
    categoryFilter: "Supermarkets",
    coverImage: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80",
    logoBg: "bg-purple-600",
    logoText: "SFM",
    logoType: "shopper",
    etaMinutes: [50, 75],
    deliveryFee: 4.5,
    minimumOrder: 8,
    status: "open",
    statusText: "Open",
    rating: 4.7,
    reviewCount: 95,
    distance: "Harare-wide",
    promoBadge: "Personal Shopper",
    sourcing: true,
    pickup: {
      branch: "Nearest suitable retailer",
      address: "Chosen by the shopper - confirm the branch in the order notes before leaving.",
      mapQuery: "supermarket near Harare CBD",
      phone: "+263 77 000 0000",
      hours: "Depends on the retailer chosen.",
      collectionPoint: "Tell the rider which shop you used once picking starts.",
    },
  },
];

export const storeById = (id: string) => stores.find((s) => s.id === id);

export type Category = {
  slug: string;
  name: string;
  blurb: string;
  liquor?: boolean;
};

export const categories: Category[] = [
  { slug: "fresh-produce", name: "Fresh Produce", blurb: "Vegetables and fruit picked the same day." },
  { slug: "meat-butchery", name: "Meat & Butchery", blurb: "Beef, chicken, pork and braai packs." },
  { slug: "bakery", name: "Bakery", blurb: "Bread, rolls and everyday baking." },
  { slug: "dairy-eggs", name: "Dairy & Eggs", blurb: "Milk, cheese, yoghurt and eggs." },
  { slug: "pantry", name: "Pantry", blurb: "Mealie meal, rice, oil and cooking basics." },
  { slug: "snacks-drinks", name: "Snacks & Drinks", blurb: "Cold drinks, juice, crisps and biscuits." },
  { slug: "frozen-foods", name: "Frozen Foods", blurb: "Frozen vegetables, chips and convenience meals." },
  { slug: "household-cleaning", name: "Household Cleaning", blurb: "Washing powder, soap and cleaners." },
  { slug: "personal-care", name: "Personal Care", blurb: "Bathroom, hygiene and grooming." },
  { slug: "baby-products", name: "Baby Products", blurb: "Nappies, formula and baby care." },
  { slug: "liquor", name: "Liquor", blurb: "Beer, wine and spirits. 18+ only.", liquor: true },
  { slug: "promotions", name: "Promotions", blurb: "This week's savings across the catalogue." },
];

export const categoryBySlug = (slug: string) => categories.find((c) => c.slug === slug);

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  packSize: string;
  price: number;
  /** Original price when the item is on promotion. */
  wasPrice?: number;
  promoLabel?: string;
  category: string;
  storeIds: string[];
  stock: StockStatus;
  popular?: boolean;
  weighted?: boolean;
  pricePerKg?: number;
  estimatedKg?: number;
  liquor?: boolean;
  /** Local search synonyms, including common Zimbabwean wording. */
  synonyms?: string[];
  image?: string;
  freshPick?: boolean;
};

const p = (v: Product): Product => v;

export const products: Product[] = [
  // Fresh produce
  p({
    id: "fp-01",
    slug: "roma-tomatoes",
    name: "Vine-Ripened Roma Tomatoes",
    description: "Plump, firm Roma tomatoes, ideal for rich stews, relishes, and fresh salads.",
    packSize: "1 kg pack",
    price: 1.4,
    promoLabel: "Farm Fresh",
    category: "fresh-produce",
    storeIds: ["daily-greens", "tm-pnp", "shop-for-me"],
    stock: "in_stock",
    popular: true,
    weighted: true,
    freshPick: true,
    pricePerKg: 1.4,
    estimatedKg: 1,
    image: productTomatoes,
    synonyms: ["madomasi", "tomatoes"],
  }),
  p({
    id: "fp-07",
    slug: "gala-apples",
    name: "Crisp Red Gala Apples",
    description: "Sweet, crunchy local Gala apples packed with fresh flavor.",
    packSize: "1.5 kg bag",
    price: 3.2,
    wasPrice: 4.0,
    promoLabel: "-20%",
    category: "fresh-produce",
    storeIds: ["daily-greens", "tm-pnp"],
    stock: "in_stock",
    popular: true,
    freshPick: true,
    image: productApples,
    synonyms: ["maapuro", "apples"],
  }),
  p({
    id: "fp-09",
    slug: "hass-avocados",
    name: "Fresh Hass Avocados (Pack of 3)",
    description: "Creamy, rich Hass avocados ripened to perfection from Eastern Highlands.",
    packSize: "3 pack tray",
    price: 2.2,
    wasPrice: 2.75,
    promoLabel: "-20%",
    category: "fresh-produce",
    storeIds: ["daily-greens", "tm-pnp"],
    stock: "in_stock",
    popular: true,
    freshPick: true,
    image: productAvocados,
    synonyms: ["avocado", "mapfumha"],
  }),
  p({
    id: "fp-04",
    slug: "sweet-bananas",
    name: "Sweet Golden Bananas",
    description: "Naturally sweet and energy-packed local bananas.",
    packSize: "1 kg bunch",
    price: 1.1,
    promoLabel: "Farm Fresh",
    category: "fresh-produce",
    storeIds: ["daily-greens", "tm-pnp", "shop-for-me"],
    stock: "in_stock",
    popular: true,
    weighted: true,
    freshPick: true,
    pricePerKg: 1.1,
    estimatedKg: 1,
    image: productBananas,
    synonyms: ["mabanana"],
  }),
  p({
    id: "fp-10",
    slug: "sweet-potatoes",
    name: "Orange Flesh Sweet Potatoes",
    description: "Naturally sweet, vitamin-rich orange sweet potatoes from local smallholders.",
    packSize: "2 kg pocket",
    price: 2.4,
    wasPrice: 3.0,
    promoLabel: "-20%",
    category: "fresh-produce",
    storeIds: ["daily-greens", "tm-pnp"],
    stock: "in_stock",
    popular: true,
    freshPick: true,
    image: productSweetPotatoes,
    synonyms: ["mbambaira", "potatoes"],
  }),
  p({
    id: "fp-11",
    slug: "baby-spinach",
    name: "Crisp Baby Spinach 250g",
    description: "Tender, washed baby spinach leaves harvested fresh this morning.",
    packSize: "250g tray",
    price: 1.5,
    promoLabel: "Farm Fresh",
    category: "fresh-produce",
    storeIds: ["daily-greens", "tm-pnp"],
    stock: "in_stock",
    popular: true,
    freshPick: true,
    image: productSpinach,
    synonyms: ["muriwo", "spinach"],
  }),
  p({ id: "fp-02", slug: "onions", name: "Onions", description: "Brown onions, sold loose by weight.", packSize: "per kg", price: 1.2, category: "fresh-produce", storeIds: ["tm-pnp", "daily-greens", "shop-for-me"], stock: "in_stock", weighted: true, pricePerKg: 1.2, estimatedKg: 1, synonyms: ["hanyanisi"] }),
  p({ id: "fp-03", slug: "potatoes-pocket", name: "Potatoes", description: "Washed potatoes in a pocket.", packSize: "5 kg pocket", price: 4.8, category: "fresh-produce", storeIds: ["tm-pnp", "daily-greens"], stock: "in_stock", popular: true, image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80", synonyms: ["mbatatisi"] }),
  p({ id: "fp-05", slug: "rape-bundle", name: "Rape (Covo)", description: "Fresh leafy greens, bundled.", packSize: "1 bundle", price: 0.6, category: "fresh-produce", storeIds: ["tm-pnp", "daily-greens", "shop-for-me"], stock: "in_stock", popular: true, synonyms: ["covo", "muriwo"] }),
  p({ id: "fp-06", slug: "butternut", name: "Butternut", description: "Whole butternut squash.", packSize: "each", price: 1.3, category: "fresh-produce", storeIds: ["tm-pnp", "daily-greens"], stock: "in_stock" }),
  p({ id: "fp-08", slug: "carrots", name: "Carrots", description: "Fresh carrots, sold by weight.", packSize: "per kg", price: 1.25, category: "fresh-produce", storeIds: ["tm-pnp", "daily-greens", "shop-for-me"], stock: "in_stock", weighted: true, pricePerKg: 1.25, estimatedKg: 1 }),

  // Meat & butchery
  p({ id: "mb-01", slug: "beef-stewing", name: "Beef Stewing Cuts", description: "Bone-in stewing beef from the butchery counter.", packSize: "per kg", price: 6.5, category: "meat-butchery", storeIds: ["tm-pnp", "fresh-meat-market"], stock: "in_stock", popular: true, weighted: true, pricePerKg: 6.5, estimatedKg: 1, synonyms: ["nyama yemombe"] }),
  p({ id: "mb-02", slug: "chicken-mixed-portions", name: "Chicken Mixed Portions", description: "Frozen mixed chicken portions.", packSize: "2 kg", price: 7.2, category: "meat-butchery", storeIds: ["tm-pnp", "fresh-meat-market", "shop-for-me"], stock: "in_stock", popular: true, synonyms: ["huku"] }),
  p({ id: "mb-03", slug: "boerewors", name: "Beef Boerewors", description: "Seasoned beef sausage for the braai.", packSize: "per kg", price: 5.9, category: "meat-butchery", storeIds: ["tm-pnp", "fresh-meat-market"], stock: "low_stock", weighted: true, pricePerKg: 5.9, estimatedKg: 1 }),
  p({ id: "mb-04", slug: "pork-chops", name: "Pork Chops", description: "Cut to order at the counter.", packSize: "per kg", price: 6.1, category: "meat-butchery", storeIds: ["tm-pnp", "fresh-meat-market"], stock: "in_stock", weighted: true, pricePerKg: 6.1, estimatedKg: 1 }),
  p({ id: "mb-05", slug: "russians", name: "Russian Sausages", description: "Ready to grill or fry.", packSize: "500 g", price: 3.2, category: "meat-butchery", storeIds: ["tm-pnp", "fresh-meat-market"], stock: "out_of_stock" }),

  // Bakery
  p({ id: "bk-01", slug: "white-bread", name: "White Bread Loaf", description: "Standard sliced white loaf.", packSize: "700 g", price: 1.1, category: "bakery", storeIds: ["tm-pnp", "supermarket-express", "avondale-bakehouse", "shop-for-me"], stock: "in_stock", popular: true, synonyms: ["chingwa"] }),
  p({ id: "bk-02", slug: "brown-bread", name: "Brown Bread Loaf", description: "Sliced brown loaf.", packSize: "700 g", price: 1.15, category: "bakery", storeIds: ["tm-pnp", "supermarket-express", "avondale-bakehouse"], stock: "in_stock" }),
  p({ id: "bk-03", slug: "burger-rolls", name: "Burger Rolls", description: "Soft rolls, pack of six.", packSize: "6 pack", price: 1.6, category: "bakery", storeIds: ["tm-pnp", "avondale-bakehouse"], stock: "in_stock" }),
  p({ id: "bk-04", slug: "scones", name: "Bakery Scones", description: "Freshly baked in store.", packSize: "6 pack", price: 1.9, category: "bakery", storeIds: ["tm-pnp", "avondale-bakehouse"], stock: "low_stock" }),
  p({ id: "bk-05", slug: "artisan-croissants", name: "Butter Croissants", description: "Flaky golden French-style butter croissants.", packSize: "4 pack", price: 3.2, promoLabel: "Fresh Daily", category: "bakery", storeIds: ["avondale-bakehouse"], stock: "in_stock", popular: true }),
  p({
    id: "bk-06",
    slug: "artisan-sourdough",
    name: "Artisan Sourdough Loaf",
    description: "Slow-fermented crusty sourdough bread baked fresh daily.",
    packSize: "650 g loaf",
    price: 2.8,
    wasPrice: 3.5,
    promoLabel: "-20%",
    category: "bakery",
    storeIds: ["avondale-bakehouse"],
    stock: "in_stock",
    popular: true,
    freshPick: true,
    image: productSourdough,
    synonyms: ["chingwa", "bread"],
  }),

  // Dairy & eggs
  p({
    id: "de-01",
    slug: "farm-fresh-milk",
    name: "Farm Fresh Full Cream Milk",
    description: "Cold farm-pasteurised pure full cream fresh milk.",
    packSize: "2 L bottle",
    price: 2.6,
    promoLabel: "Farm Fresh",
    category: "dairy-eggs",
    storeIds: ["tm-pnp", "supermarket-express", "daily-greens", "shop-for-me"],
    stock: "in_stock",
    popular: true,
    freshPick: true,
    image: productMilk,
    synonyms: ["mukaka", "milk"],
  }),
  p({ id: "de-02", slug: "eggs-30", name: "Eggs", description: "Large eggs, tray of thirty.", packSize: "30 tray", price: 4.5, wasPrice: 5.2, promoLabel: "Save $0.70", category: "dairy-eggs", storeIds: ["tm-pnp", "supermarket-express"], stock: "in_stock", popular: true, synonyms: ["mazai"] }),
  p({ id: "de-03", slug: "cheddar", name: "Cheddar Cheese", description: "Matured cheddar block.", packSize: "500 g", price: 5.4, category: "dairy-eggs", storeIds: ["tm-pnp", "supermarket-express"], stock: "in_stock" }),
  p({ id: "de-04", slug: "yoghurt", name: "Drinking Yoghurt", description: "Assorted flavours.", packSize: "1 L", price: 2.1, category: "dairy-eggs", storeIds: ["tm-pnp", "supermarket-express"], stock: "in_stock" }),
  p({ id: "de-05", slug: "margarine", name: "Margarine Tub", description: "Spread for bread and baking.", packSize: "500 g", price: 2.3, category: "dairy-eggs", storeIds: ["tm-pnp", "supermarket-express"], stock: "in_stock" }),

  // Pantry
  p({ id: "pa-01", slug: "mealie-meal", name: "Roller Mealie Meal", description: "Everyday staple maize meal.", packSize: "10 kg", price: 7.9, category: "pantry", storeIds: ["tm-pnp", "supermarket-express", "shop-for-me"], stock: "in_stock", popular: true, synonyms: ["upfu", "maize meal"] }),
  p({ id: "pa-02", slug: "rice", name: "Long Grain Rice", description: "Parboiled long grain rice.", packSize: "2 kg", price: 3.1, category: "pantry", storeIds: ["tm-pnp", "supermarket-express"], stock: "in_stock", synonyms: ["mupunga"] }),
  p({ id: "pa-03", slug: "cooking-oil", name: "Cooking Oil", description: "Refined vegetable cooking oil.", packSize: "2 L", price: 3.9, wasPrice: 4.5, promoLabel: "Save 13%", category: "pantry", storeIds: ["tm-pnp", "supermarket-express", "shop-for-me"], stock: "in_stock", popular: true, synonyms: ["mafuta"] }),
  p({ id: "pa-04", slug: "sugar", name: "White Sugar", description: "Granulated white sugar.", packSize: "2 kg", price: 2.4, category: "pantry", storeIds: ["tm-pnp", "supermarket-express"], stock: "in_stock", synonyms: ["shuga"] }),
  p({ id: "pa-05", slug: "salt", name: "Table Salt", description: "Iodised table salt.", packSize: "1 kg", price: 0.8, category: "pantry", storeIds: ["tm-pnp", "supermarket-express"], stock: "in_stock", synonyms: ["munyu"] }),
  p({ id: "pa-06", slug: "beans-dry", name: "Sugar Beans", description: "Dried sugar beans.", packSize: "1 kg", price: 2.2, category: "pantry", storeIds: ["tm-pnp", "supermarket-express"], stock: "low_stock", synonyms: ["nyemba"] }),
  p({ id: "pa-07", slug: "peanut-butter", name: "Peanut Butter", description: "Smooth peanut butter.", packSize: "375 g", price: 2.0, category: "pantry", storeIds: ["tm-pnp", "supermarket-express"], stock: "in_stock", synonyms: ["dovi"] }),
  p({ id: "pa-08", slug: "tea-leaves", name: "Tea Leaves", description: "Loose black tea.", packSize: "250 g", price: 1.7, category: "pantry", storeIds: ["tm-pnp", "supermarket-express"], stock: "in_stock" }),
  p({ id: "pa-09", slug: "macaroni", name: "Macaroni", description: "Dry macaroni pasta.", packSize: "500 g", price: 1.1, category: "pantry", storeIds: ["tm-pnp", "supermarket-express"], stock: "in_stock" }),

  // Snacks & drinks
  p({ id: "sd-01", slug: "cola-2l", name: "Cola Soft Drink", description: "Chilled 2 litre bottle.", packSize: "2 L", price: 1.8, category: "snacks-drinks", storeIds: ["tm-pnp", "supermarket-express", "sunset-liquors", "liquor-supplies"], stock: "in_stock", popular: true }),
  p({ id: "sd-02", slug: "orange-juice", name: "Orange Juice", description: "100% fruit juice blend.", packSize: "1 L", price: 2.2, category: "snacks-drinks", storeIds: ["tm-pnp", "supermarket-express"], stock: "in_stock" }),
  p({ id: "sd-03", slug: "crisps", name: "Potato Crisps", description: "Sharing bag, assorted flavours.", packSize: "125 g", price: 1.3, category: "snacks-drinks", storeIds: ["tm-pnp", "supermarket-express", "sunset-liquors"], stock: "in_stock" }),
  p({ id: "sd-04", slug: "biscuits", name: "Cream Biscuits", description: "Family pack biscuits.", packSize: "200 g", price: 1.4, wasPrice: 1.8, promoLabel: "Buy 2 get 1 free", category: "snacks-drinks", storeIds: ["tm-pnp", "supermarket-express"], stock: "in_stock" }),
  p({ id: "sd-05", slug: "still-water", name: "Still Water", description: "Bottled drinking water.", packSize: "5 L", price: 1.5, category: "snacks-drinks", storeIds: ["tm-pnp", "supermarket-express", "shop-for-me"], stock: "in_stock" }),
  p({ id: "sd-06", slug: "energy-drink", name: "Energy Drink", description: "Chilled can.", packSize: "500 ml", price: 1.6, category: "snacks-drinks", storeIds: ["supermarket-express", "sunset-liquors", "liquor-supplies"], stock: "in_stock" }),

  // Frozen
  p({ id: "fz-01", slug: "frozen-chips", name: "Frozen Chips", description: "Straight cut oven chips.", packSize: "2 kg", price: 3.6, category: "frozen-foods", storeIds: ["tm-pnp"], stock: "in_stock", popular: true }),
  p({ id: "fz-02", slug: "frozen-peas", name: "Frozen Peas", description: "Garden peas.", packSize: "1 kg", price: 2.4, category: "frozen-foods", storeIds: ["tm-pnp"], stock: "in_stock" }),
  p({ id: "fz-03", slug: "fish-fingers", name: "Fish Fingers", description: "Crumbed fish portions.", packSize: "400 g", price: 3.8, category: "frozen-foods", storeIds: ["tm-pnp"], stock: "low_stock" }),
  p({ id: "fz-04", slug: "ice-cream", name: "Vanilla Ice Cream", description: "Family tub.", packSize: "2 L", price: 4.2, category: "frozen-foods", storeIds: ["tm-pnp"], stock: "unavailable" }),

  // Household
  p({ id: "hh-01", slug: "washing-powder", name: "Washing Powder", description: "Hand and machine wash powder.", packSize: "2 kg", price: 4.6, category: "household-cleaning", storeIds: ["tm-pnp"], stock: "in_stock", popular: true }),
  p({ id: "hh-02", slug: "dishwashing-liquid", name: "Dishwashing Liquid", description: "Concentrated dish liquid.", packSize: "750 ml", price: 2.1, category: "household-cleaning", storeIds: ["tm-pnp"], stock: "in_stock" }),
  p({ id: "hh-03", slug: "bleach", name: "Thick Bleach", description: "Household disinfectant bleach.", packSize: "750 ml", price: 1.9, category: "household-cleaning", storeIds: ["tm-pnp"], stock: "in_stock" }),
  p({ id: "hh-04", slug: "toilet-paper", name: "Toilet Rolls", description: "Two ply, pack of nine.", packSize: "9 pack", price: 3.9, wasPrice: 4.6, promoLabel: "Save $0.70", category: "household-cleaning", storeIds: ["tm-pnp"], stock: "in_stock", popular: true }),
  p({ id: "hh-05", slug: "bin-liners", name: "Bin Liners", description: "Heavy duty refuse bags.", packSize: "20 pack", price: 2.5, category: "household-cleaning", storeIds: ["tm-pnp"], stock: "in_stock" }),

  // Personal care
  p({ id: "pc-01", slug: "bath-soap", name: "Bath Soap", description: "Moisturising bath bars.", packSize: "4 pack", price: 2.8, category: "personal-care", storeIds: ["tm-pnp"], stock: "in_stock" }),
  // Personal care & Health
  p({ id: "pc-01", slug: "bath-soap", name: "Bath Soap", description: "Moisturising bath bars.", packSize: "4 pack", price: 2.8, category: "personal-care", storeIds: ["tm-pnp", "city-pharmacy"], stock: "in_stock" }),
  p({ id: "pc-02", slug: "toothpaste", name: "Toothpaste", description: "Fluoride toothpaste.", packSize: "100 ml", price: 1.7, category: "personal-care", storeIds: ["tm-pnp", "city-pharmacy", "supermarket-express"], stock: "in_stock" }),
  p({ id: "pc-03", slug: "roll-on", name: "Roll On Deodorant", description: "48 hour protection.", packSize: "50 ml", price: 2.2, category: "personal-care", storeIds: ["tm-pnp", "city-pharmacy"], stock: "in_stock" }),
  p({ id: "pc-04", slug: "petroleum-jelly", name: "Petroleum Jelly", description: "Skin protection jelly.", packSize: "250 ml", price: 2.0, category: "personal-care", storeIds: ["tm-pnp", "city-pharmacy"], stock: "low_stock" }),
  p({ id: "cp-01", slug: "paracetamol-500mg", name: "Paracetamol 500mg Caplets", description: "Fast relief for headaches, body pains and fever.", packSize: "20 caplets", price: 1.8, promoLabel: "Everyday Essential", category: "personal-care", storeIds: ["city-pharmacy"], stock: "in_stock", popular: true }),
  p({ id: "cp-02", slug: "vitamin-c-zinc", name: "Vitamin C 1000mg + Zinc", description: "Effervescent immune booster orange tablets.", packSize: "10 tabs", price: 3.5, category: "personal-care", storeIds: ["city-pharmacy"], stock: "in_stock", popular: true }),
  p({ id: "cp-03", slug: "antiseptic-liquid", name: "Antiseptic Disinfectant Liquid", description: "First aid wound cleansing and hygiene antiseptic.", packSize: "250 ml", price: 3.2, category: "personal-care", storeIds: ["city-pharmacy"], stock: "in_stock" }),

  // Baby
  p({ id: "bb-01", slug: "nappies", name: "Baby Nappies", description: "Jumbo pack, medium size.", packSize: "44 pack", price: 12.5, category: "baby-products", storeIds: ["tm-pnp", "city-pharmacy"], stock: "in_stock", popular: true }),
  p({ id: "bb-02", slug: "baby-formula", name: "Infant Formula", description: "Stage one infant formula.", packSize: "900 g", price: 18.9, category: "baby-products", storeIds: ["tm-pnp", "city-pharmacy"], stock: "low_stock" }),
  p({ id: "bb-03", slug: "baby-wipes", name: "Baby Wipes", description: "Fragrance free wipes.", packSize: "80 pack", price: 2.4, category: "baby-products", storeIds: ["tm-pnp", "city-pharmacy"], stock: "in_stock" }),
  p({ id: "bb-04", slug: "baby-lotion", name: "Baby Lotion", description: "Gentle daily lotion.", packSize: "400 ml", price: 3.6, category: "baby-products", storeIds: ["tm-pnp", "city-pharmacy"], stock: "in_stock" }),

  // Liquor
  p({ id: "lq-01", slug: "lager-6pack", name: "Lager Beer", description: "Chilled lager, six pack.", packSize: "6 x 375 ml", price: 8.4, category: "liquor", storeIds: ["sunset-liquors", "liquor-supplies"], stock: "in_stock", liquor: true, popular: true }),
  p({ id: "lq-02", slug: "lager-crate", name: "Lager Crate", description: "Full crate for gatherings.", packSize: "24 x 375 ml", price: 30.0, wasPrice: 33.0, promoLabel: "Save $3.00", category: "liquor", storeIds: ["sunset-liquors", "liquor-supplies"], stock: "in_stock", liquor: true }),
  p({ id: "lq-03", slug: "red-wine", name: "Dry Red Wine", description: "Medium bodied dry red.", packSize: "750 ml", price: 9.5, category: "liquor", storeIds: ["sunset-liquors", "liquor-supplies"], stock: "in_stock", liquor: true }),
  p({ id: "lq-04", slug: "white-wine", name: "Crisp White Wine", description: "Chilled dry white.", packSize: "750 ml", price: 9.0, category: "liquor", storeIds: ["sunset-liquors", "liquor-supplies"], stock: "low_stock", liquor: true }),
  p({ id: "lq-05", slug: "whisky", name: "Blended Whisky", description: "Blended whisky bottle.", packSize: "750 ml", price: 22.0, category: "liquor", storeIds: ["sunset-liquors", "liquor-supplies"], stock: "in_stock", liquor: true }),
  p({ id: "lq-06", slug: "vodka", name: "Vodka", description: "Triple distilled vodka.", packSize: "750 ml", price: 16.5, category: "liquor", storeIds: ["sunset-liquors", "liquor-supplies"], stock: "in_stock", liquor: true }),
  p({ id: "lq-07", slug: "gin", name: "Dry Gin", description: "London dry style gin.", packSize: "750 ml", price: 18.0, category: "liquor", storeIds: ["sunset-liquors", "liquor-supplies"], stock: "out_of_stock", liquor: true }),
  p({ id: "lq-08", slug: "mixers", name: "Tonic Mixers", description: "Mixer cans, pack of six.", packSize: "6 x 300 ml", price: 4.8, category: "liquor", storeIds: ["sunset-liquors", "liquor-supplies"], stock: "in_stock", liquor: true }),
];

export const productById = (id: string) => products.find((x) => x.id === id);
export const productBySlug = (slug: string) => products.find((x) => x.slug === slug);

export const promotionProducts = () => products.filter((x) => x.promoLabel);
export const popularProducts = () => products.filter((x) => x.popular);
export const freshPicksProducts = () => products.filter((x) => x.freshPick);

export const isAvailable = (s: StockStatus) => s === "in_stock" || s === "low_stock";

export function searchProducts(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products.filter(
    (x) =>
      x.name.toLowerCase().includes(q) ||
      x.description.toLowerCase().includes(q) ||
      x.category.includes(q) ||
      (x.synonyms ?? []).some((s) => s.includes(q)),
  );
}

/* ---------------------------------- Zones --------------------------------- */

export type Zone = {
  id: string;
  name: string;
  city: string;
  active: boolean;
  deliveryFee: number;
  etaMinutes: [number, number];
};

export const zones: Zone[] = [
  { id: "cbd", name: "Harare CBD", city: "Harare", active: true, deliveryFee: 3.0, etaMinutes: [40, 65] },
  { id: "avondale", name: "Avondale", city: "Harare", active: true, deliveryFee: 3.5, etaMinutes: [45, 70] },
  { id: "borrowdale", name: "Borrowdale", city: "Harare", active: true, deliveryFee: 4.5, etaMinutes: [55, 85] },
  { id: "greendale", name: "Greendale", city: "Harare", active: true, deliveryFee: 4.0, etaMinutes: [50, 80] },
  { id: "highlands", name: "Highlands", city: "Harare", active: true, deliveryFee: 4.0, etaMinutes: [50, 80] },
  { id: "eastlea", name: "Eastlea", city: "Harare", active: true, deliveryFee: 3.5, etaMinutes: [45, 70] },
  { id: "belvedere", name: "Belvedere", city: "Harare", active: true, deliveryFee: 3.5, etaMinutes: [45, 75] },
  { id: "milton-park", name: "Milton Park", city: "Harare", active: true, deliveryFee: 3.5, etaMinutes: [45, 70] },
  { id: "bulawayo", name: "Bulawayo", city: "Bulawayo", active: false, deliveryFee: 0, etaMinutes: [0, 0] },
  { id: "mutare", name: "Mutare", city: "Mutare", active: false, deliveryFee: 0, etaMinutes: [0, 0] },
  { id: "gweru", name: "Gweru", city: "Gweru", active: false, deliveryFee: 0, etaMinutes: [0, 0] },
  { id: "masvingo", name: "Masvingo", city: "Masvingo", active: false, deliveryFee: 0, etaMinutes: [0, 0] },
  { id: "marondera", name: "Marondera", city: "Marondera", active: false, deliveryFee: 0, etaMinutes: [0, 0] },
];

export const activeZones = () => zones.filter((z) => z.active);
export const zoneById = (id: string) => zones.find((z) => z.id === id);

/* ------------------------------ Delivery slots ----------------------------- */

export type Slot = { id: string; label: string; day: string; capacity: "available" | "full" };

export const deliverySlots: Slot[] = [
  { id: "asap", label: "As soon as possible", day: "Today", capacity: "available" },
  { id: "t-1214", label: "12:00 – 14:00", day: "Today", capacity: "available" },
  { id: "t-1416", label: "14:00 – 16:00", day: "Today", capacity: "full" },
  { id: "t-1618", label: "16:00 – 18:00", day: "Today", capacity: "available" },
  { id: "t-1820", label: "18:00 – 20:00", day: "Today", capacity: "available" },
  { id: "m-0810", label: "08:00 – 10:00", day: "Tomorrow", capacity: "available" },
  { id: "m-1012", label: "10:00 – 12:00", day: "Tomorrow", capacity: "available" },
  { id: "m-1416", label: "14:00 – 16:00", day: "Tomorrow", capacity: "available" },
];

/* ------------------------------- Substitutions ----------------------------- */

export const substitutionOptions = [
  { id: "contact", label: "Contact me before replacing", hint: "We message you on WhatsApp first." },
  { id: "closest", label: "Replace with the closest alternative", hint: "Fastest option." },
  { id: "same_or_less", label: "Replace only if the same price or less" },
  { id: "remove", label: "Remove unavailable products" },
  { id: "none", label: "No substitutions" },
] as const;

export type SubstitutionPreference = (typeof substitutionOptions)[number]["id"];

/* --------------------------------- Payments -------------------------------- */

export const paymentMethods = [
  { id: "ecocash", name: "EcoCash", hint: "Mobile money. Upload proof after paying." },
  { id: "innbucks", name: "InnBucks", hint: "Mobile wallet. Upload proof after paying." },
  { id: "onemoney", name: "OneMoney", hint: "Mobile money. Upload proof after paying." },
  { id: "card", name: "Visa or Mastercard", hint: "Local or international card." },
  { id: "bank", name: "Bank transfer", hint: "Upload your transfer confirmation." },
  { id: "cod", name: "Cash on delivery", hint: "Have the exact amount ready." },
] as const;

export type PaymentMethodId = (typeof paymentMethods)[number]["id"];

/* ------------------------------ Order statuses ----------------------------- */

export const orderStatuses = [
  "Order received",
  "Awaiting payment",
  "Payment submitted",
  "Payment approved",
  "Store confirming stock",
  "Price approval required",
  "Substitution approval required",
  "Items being picked",
  "Ready for collection",
  "Rider assigned",
  "Collected",
  "On the way",
  "Rider approaching",
  "Delivered",
] as const;

export const SERVICE_FEE = 1.5;
