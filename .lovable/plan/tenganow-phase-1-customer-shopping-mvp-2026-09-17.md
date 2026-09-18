# TengaNow — Phase 1: Customer Shopping MVP

Mobile-first grocery and liquor delivery for Harare, with an original brand identity and a clear "independent service" position. This plan covers Phase 1 only; admin, shopper and rider systems follow in Phase 2 on the same data model.

## Brand setup (replaceable later)

A single brand configuration file holds name (TengaNow), tagline ("Everyday shopping, delivered."), wordmark, favicon, contact and support details, social links, and colours — so renaming later is one edit. Temporary text wordmark, no "T" monogram.

Design system: Fresh Canvas #F7F8F4 / white / mist #EDF1EC as the 60% canvas; Botanical Green #123B2A and Deep Slate #172B35 as the 30% structure; Action Coral #FF653A reserved for Add to Cart, checkout, place order and promo labels only. Semantic success/warning/error/info tokens included. Manrope headings, DM Sans body, loaded in the page head. All colours as tokens — no hardcoded values in screens.

## Customer screens (Phase 1)

- **Home (the storefront itself, not a marketing page)** — header with wordmark, delivery location, search, account, help, basket count; address selector, delivery estimate, store selection, categories, promotions, popular products, Buy Again, shopping-list shortcut, previous order, floating WhatsApp button.
- **Store selection** — text-only cards for TM Pick n Pay, Liquor Supplies, and Shop for Me, each with categories, delivery estimate, fee, minimum order, open/busy/closed status. No logos, ratings or badges. Disclaimer shown here, at checkout and in terms.
- **Store page, categories, search results** — filter by store, price, promotions, in-stock only; sort by price/popularity/newest; previously purchased; helpful empty states with suggestions.
- **Product details** — image, pack size, estimated USD price (optional ZiG display), stock status, quantity, store source, promo badge, favourite, per-item substitution preference, "price is an estimate" note.
- **Weighted products** — price per kg, estimated weight and estimated total shown up front.
- **Basket** — persists across refresh, reopen, offline and sign-in; grouped by store with an explanation when multiple stores mean separate orders and fees; totals, discounts, substitution settings, instructions, expiry/price-change warnings and a Refresh Basket action.
- **Shopping list submission** — type a list or upload a photo of a handwritten one, add instructions, pick a retailer or "best price"/"nearest supermarket", then the confirmation message about availability and final prices.
- **Saved lists and favourites** — named lists (Monthly Groceries, Braai Supplies, etc.), save basket as list, move list to basket, share, reorder.
- **Checkout** — stepped: review basket, address, delivery time, substitutions, instructions, payment, review, place order. Delivery slots with capacity and cut-off; ASAP or scheduled; realistic ranges ("45–70 minutes"). Recipient mode for ordering on someone else's behalf, with optional hidden prices.
- **Payment** — EcoCash, InnBucks, OneMoney, card, bank transfer, cash on delivery; proof-of-payment upload; order stays unpaid until an admin approves. Duplicate submission protection.
- **Order tracking and history** — full status timeline, estimated delivery, address, summary, contact support, reorder. Receipt view.
- **Addresses** — current location, map pin, typed address, landmark and notes, saved as Home/Work/Other; serviceability check against Harare zones with a waiting list for unsupported areas.
- **Liquor gate** — 18+ date-of-birth confirmation before the liquor section, responsible-drinking messaging, ID-at-delivery notice, no unattended delivery.
- **Account** — register, sign in, continue as guest, profile, substitution defaults, problem/refund centre, help, terms, privacy, disclaimer page.

## Data and security

Lovable Cloud (database, auth, storage, realtime) powers accounts, catalogue, baskets, orders, payments and uploads. Phase 1 creates the full core schema so Phase 2 adds screens, not migrations: profiles, roles, addresses, zones, stores and hours, categories, products, store products, inventory, prices, promotions, promo codes, saved lists, favourites, carts and items, orders and items, payments and proofs, shopping lists, substitutions, shoppers, riders, deliveries, slots, status history, notifications, reviews, tips, refunds, support requests, loyalty (inactive), settings and audit logs.

Access rules: customers see only their own data; roles for guest, customer, shopper, rider, store manager, admin, super admin stored in a separate roles table. Payment approval, price changes, refunds and status changes are server-side only and written to the audit log.

## Demo content

Seeded Harare zones, three stores, the full category set, realistic Zimbabwean products with estimated USD prices and varied stock statuses, promotions, demo customers, orders in different delivery states, riders and admin statistics — loaded as part of the database setup so the app is never empty.

## Performance

Compressed images with lazy loading and placeholders, loading skeletons, retry on failure, offline state, minimal animation, persistent basket — tuned for entry-level Android phones on mobile data.

## Notes

- Every nav item lands on a working screen; nothing dead or empty.
- No retailer logos, colours or copied catalogue content.
- Loyalty ships switched off.
- Photography: realistic commercial food and local delivery imagery generated for the app; no floating products or fake packaging text.

## Technical section

React + TypeScript + Tailwind + shadcn on TanStack Start. Brand config in a single typed module consumed by header, footer, meta and theme. Colour tokens defined in the stylesheet theme block; components reference semantic classes only. Server functions handle payment proof review, order placement, price/substitution approval and any privileged read, each with auth middleware and role checks. Basket persists in local storage for guests and syncs to the cart tables once signed in. Delivery zones stored as named areas with fee and minimum order; serviceability resolved server-side. Each route defines its own page title and description.
