import bakery from "@/assets/cat-bakery.jpg";
import baby from "@/assets/cat-baby.jpg";
import dairy from "@/assets/cat-dairy.jpg";
import frozen from "@/assets/cat-frozen.jpg";
import household from "@/assets/cat-household.jpg";
import liquor from "@/assets/cat-liquor.jpg";
import meat from "@/assets/cat-meat.jpg";
import pantry from "@/assets/cat-pantry.jpg";
import personal from "@/assets/cat-personal.jpg";
import produce from "@/assets/cat-fresh-produce.jpg";
import snacks from "@/assets/cat-snacks.jpg";

/** Neutral demo imagery — one photograph per category. */
export const categoryImages: Record<string, string> = {
  "fresh-produce": produce,
  "meat-butchery": meat,
  bakery,
  "dairy-eggs": dairy,
  pantry,
  "snacks-drinks": snacks,
  "frozen-foods": frozen,
  "household-cleaning": household,
  "personal-care": personal,
  "baby-products": baby,
  liquor,
  promotions: produce,
};

export const imageFor = (categorySlug: string) => categoryImages[categorySlug] ?? produce;
