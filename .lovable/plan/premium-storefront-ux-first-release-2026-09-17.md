# Premium storefront UX — first release

## Goal
Turn the existing customer storefront into a cohesive, mobile-first grocery delivery application. Preserve every current ordering, payment, security, and independent-retailer rule while reducing visual noise and keeping the next action obvious.

## Customer application shell
- Replace hamburger-dependent mobile navigation with a safe-area-aware bottom bar: Home, Search, Orders, Favourites, Account.
- Keep a compact top bar with the editable wordmark, shortened delivery area, availability context, and a separate basket button with live quantity.
- Keep desktop navigation visible and focused on location, search, stores, orders, help, account, and basket.
- Add consistent focus states, 44px touch targets, restrained elevation, offline feedback, and single-message basket announcements.

## Shopping and discovery
- Reorder the home screen around location, honest delivery estimate, search, compact store selection, category chips, concise product rails, shopping-list access, and recently viewed content.
- Remove the large split marketing panel from the first viewport and use only a compact promotional treatment.
- Refine store cards into compact neutral choices with status, ETA, fee, minimum, and a strong Shop now action.
- Standardise product cards with equal heights, square images, two-line names, aligned estimated prices, stock states, favourite control, and stable Add/quantity controls.
- Strengthen search with recent and trending suggestions, selected-store context, useful recommendations, and a non-blank no-results path.
- Refine category and store pages with mobile category rails and clear selected-store context.

## Basket, checkout, and payment
- Add a mobile quick-basket sheet while retaining the full basket page.
- Make basket rows easier to scan and keep the estimated total and Continue to checkout action sticky on mobile.
- Consolidate checkout into six understandable sections with compact progress, persistent values, visible labels, inline validation, payment cards, and protected submission.
- Keep guest checkout and all existing recipient, liquor, delivery, substitution, and manual-payment rules.
- Refine payment and order confirmation wording so pending payment is never presented as approved.

## Product and order tracking
- Make product purchase controls sticky on mobile and preserve direct Add controls in listings.
- Simplify order tracking to customer-relevant milestones, with the current stage prominent and completed stages quieter.

## Shared states and validation
- Apply consistent loading, empty, unavailable, upload/payment error, and connection-loss states across the core shopping journey.
- Ensure each message explains what happened, whether data was kept, and the next action.
- Verify the customer journey on mobile and desktop, including 200% text resilience, keyboard focus, reduced motion, safe-area spacing, no overflow, and route metadata.

## Deferred after this release
- Account-area information architecture, saved lists, shopping-list form, and liquor entry refinements.
- Admin navigation, priority queues, summary cards, and order detail panels.
- Shopper checklist and rider journey-action redesigns.
- Broader skeleton, empty, delayed-order, and session-expiry coverage outside the core customer journey.

## Technical approach
- Reuse the existing TanStack routes, app state, Lovable Cloud data, permissions, catalogue, and business rules; this is primarily a presentation and interaction refactor.
- Build small shared pieces for mobile navigation, location summary, category rails, action bars, selection cards, skeletons, and state messages rather than duplicating markup.
- Keep semantic design tokens in the global stylesheet and use existing Manrope/Inter typography utilities.
- Use the existing local imagery and avoid new retailer branding, ratings, badges, or unsupported claims.
- Validate location, store selection, product discovery, basket, checkout, payment, and tracking with browser checks at mobile and desktop widths.
