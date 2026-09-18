/**
 * Central brand configuration.
 *
 * TengaNow is a TEMPORARY working name. Change the values here and the whole
 * application follows — wordmark, page titles, footer, support links, colours.
 */

export const brand = {
  name: "TengaNow",
  /** Shown next to the wordmark and in page titles. */
  tagline: "Everyday shopping, delivered.",
  /** Plain text wordmark — intentionally no logo mark or monogram. */
  wordmark: {
    text: "TengaNow",
    /** Rendered in a lighter weight after the main word. */
    accent: "Now",
    base: "Tenga",
  },
  favicon: "/favicon.ico",
  legalEntity: "TengaNow (Private) Limited",
  city: "Harare",
  country: "Zimbabwe",
  currency: {
    primary: "USD",
    primarySymbol: "$",
    secondary: "ZiG",
    /** Indicative only — used for the optional secondary price display. */
    secondaryRate: 26.5,
    showSecondary: true,
  },
  contact: {
    phone: "+263 77 000 0000",
    whatsapp: "263770000000",
    email: "hello@tenganow.co.zw",
    supportEmail: "support@tenganow.co.zw",
    hours: "Monday to Sunday, 07:00 – 20:00 CAT",
    address: "Harare CBD, Zimbabwe",
  },
  social: {
    facebook: "https://facebook.com/tenganow",
    instagram: "https://instagram.com/tenganow",
    x: "https://x.com/tenganow",
    tiktok: "https://tiktok.com/@tenganow",
  },
  /** Mirrors the design tokens in src/styles.css. */
  colours: {
    canvas: "#F7F8F4",
    white: "#FFFFFF",
    mist: "#EDF1EC",
    border: "#DCE3DD",
    botanical: "#123B2A",
    botanicalHover: "#0D3021",
    botanicalMid: "#275B45",
    botanicalTint: "#DDEBE3",
    slate: "#172B35",
    slateSecondary: "#3E5058",
    slateMuted: "#6D7B80",
    coral: "#FF653A",
    coralHover: "#E95029",
    coralPressed: "#CE421F",
    coralTint: "#FFE3DA",
  },
  features: {
    /** Loyalty stays switched off until an administrator activates it. */
    loyalty: false,
  },
} as const;

export const DISCLAIMER = `${brand.name} is an independent shopping and delivery service. Retailers selected by customers are not affiliated with or responsible for the operation of this platform.`;

export const whatsappLink = (message = "Hello, I need help with my order.") =>
  `https://wa.me/${brand.contact.whatsapp}?text=${encodeURIComponent(message)}`;

export const formatUsd = (amount: number) =>
  `${brand.currency.primarySymbol}${amount.toFixed(2)}`;

export const formatSecondary = (amount: number) =>
  `${brand.currency.secondary} ${(amount * brand.currency.secondaryRate).toFixed(2)}`;
