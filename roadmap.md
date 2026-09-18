# TengaNow roadmap

## Done — Phase 1 storefront (this build)
- Central brand configuration (name, tagline, wordmark, favicon, contacts, socials, colours) — rename in one file
- Design system: 60/30/10 tokens (Fresh Canvas, Botanical Green, Deep Slate, Action Coral) + semantic colours, Manrope/Inter
- Independent-service disclaimer on store selection, checkout, footer and its own page
- Home storefront: address selector, delivery estimate, search, stores, categories, promotions, Buy Again, quick actions, WhatsApp button
- Store selection (TM Pick n Pay, Liquor Supplies, Shop for Me) — text cards, no logos or ratings
- Catalogue: 12 categories, ~60 demo products with estimated USD prices, ZiG display, stock statuses, weighted items
- Search with Zimbabwean synonyms, filters, sorting, empty states
- Persistent basket (survives refresh/reconnect), grouped by store, substitution per item, refresh + price warnings
- Stepped checkout: address, slot, substitutions, instructions, handover, recipient mode, payment, review
- Payment methods with proof-of-payment upload; not paid until approved
- Order tracking timeline with delivery PIN, order history, digital receipt
- Shopping-list submission (typed or photographed), saved lists, favourites
- Address book with landmarks, serviceability by zone, waiting list for other cities
- Liquor 18+ gate with ID and unattended-delivery rules
- Help, terms, privacy, disclaimer, refund/problem centre
- Premium mobile storefront release: safe-area navigation, compact location header, category rails, equal-height product/store cards, quick basket, sticky purchase actions, refined checkout/search/tracking, offline status

## Accounts and database — done
- [x] Cloud backend enabled: accounts, database, private payment-proof storage
- [x] Schema: profiles, roles, addresses, favourites, lists, orders, order items,
      order status history, payments, payment proofs, shopping list requests
- [x] Real sign in / register (email + Google), guest checkout kept, local data
      migrated to the account on first sign-in
- [x] Orders, payments and proofs saved and reloaded on any device
- [x] Payment confirmation page with proof upload
- [ ] Server-side payment approval, price changes, refunds with audit trail (Phase 2)

## Phase 2 — operations
- [x] Admin dashboard (orders, payments, assignments, staff, shopping lists, stats)
- [x] Shopper picking interface (shelf prices, weights, not-available, ready for collection)
- [x] Rider dashboard (assignments, store collection address, PIN, proof of delivery, failed attempts)
- [ ] Digital receipts with final amounts, refund and problem centre

## Phase 3 — growth
- [ ] Loyalty (built but disabled), scheduled repeat orders, AI list extraction, live retailer inventory
