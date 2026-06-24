This is a large scope. I'll deliver it in one coordinated pass, keeping the existing cream design and Albanian copy. Plan below.

## 1. Database (one migration)

New / updated tables in `public`:

- `profiles` (id=auth.users.id, name, avatar_url, city, bio, rating_avg, rating_count, created_at) + trigger to auto-create on signup
- Migrate `listings` → keep table, add columns: `description_search` (tsvector), `condition`, `color`, `city`, `gender`, `status` ('active'|'sold'|'deleted'). Keep existing `image_paths`, `brand`, `size`, `price`, `category`.
- `conversations` (id, listing_id, buyer_id, seller_id, last_message_at) UNIQUE(listing_id, buyer_id)
- `messages` (id, conversation_id, sender_id, content, created_at)
- `offers` (id, listing_id, buyer_id, seller_id, amount, status 'pending'|'accepted'|'declined', created_at)
- `notifications` (id, user_id, type, read, data jsonb, created_at)
- Keep existing `listing_likes`, `listing_saves`, `ratings`.

RLS + GRANTs for each. Realtime publication for `messages`, `conversations`, `notifications`, `offers`, `listings`. Triggers: notify seller on new offer/message/save; bump `conversations.last_message_at`.

## 2. Frontend changes

**Home (`/`)**: wire category tabs to filter Supabase query; product cards link to `/product/$id`; "See all" links → `/search?section=new` or `?section=trending`. Replace mock data with live `listings` query.

**Product page (`/product/$id`)**: refactor to load from Supabase. Add:
- `MakeOfferDialog` (amount input → inserts into `offers`)
- "Send message" → creates/opens conversation, navigates `/messages?thread={id}`
- "View profile" → `/user/$id`
- "Similar items" → live query by category, excluding current
- New route `src/routes/user.$id.tsx` (public seller profile: avatar, name, rating, active listings grid)

**Sell (`/sell`)**: replace single dialog with 3-step wizard (`PhotoStep`, `DetailsStep`, `ReviewStep`). Upload to `photos` storage bucket, support reorder/remove, all new fields (condition, color, city, gender). On publish → insert listing, redirect to `/product/$id`.

**Search (`/search`)**: full-text query via `ilike` on title+description+brand. Filter sheet: category, size, condition, price min/max, city, gender. Result count + empty state. Support `?section=new|trending` presets.

**Messages (`/messages`)**: list conversations from Supabase joined with other-user profile + listing. Thread view loads messages, subscribes via realtime, send inserts new row. Replace mock threads entirely.

**Profile (`/_authenticated/profile`)**: keep current Tise-style header, replace tabs with: Mine annonser (active/sold sub-toggle), Lagret, Tilbud (sent/mottatt), Innstillinger. Settings: edit name/bio/city/avatar (upload to `photos`), logout. Owner cards get Edit + Mark sold actions (Edit opens dialog with same details form).

**Notifications (`/notifications`)**: live list from `notifications` table, click marks read. Header bell shows unread badge (subscribe via realtime in `__root.tsx`).

## 3. Shared components

- `ListingCard` (Supabase-backed version of ProductCard)
- `MakeOfferDialog`, `EditListingDialog`
- `ListingForm` (used by sell-step-2 and edit)
- `useUnreadNotifications` hook

## 4. Out of scope / assumptions

- Keep Albanian copy; new strings translated (e.g. "Bëj ofertë", "Dërgo mesazh", "Profili", "Njoftimet").
- Rating writes already exist via `RatingsDialog`; I'll add `rating_avg`/`rating_count` columns + trigger to keep them denormalized for fast profile reads.
- Real-time price negotiation flows (accept/decline offer) included on profile "Offers" tab.
- No payments / checkout — out of scope.
- Existing mock `src/data/products.ts` no longer used after this; left in place but unreferenced.

## Technical notes
- All Supabase reads in components use `supabase` browser client (RLS as user).
- Realtime channels created inside `useEffect` with cleanup.
- Storage bucket `photos` already exists; reuse for listing images and avatars (path prefix `avatars/`).
- Migration creates `profiles` rows for existing users via backfill `INSERT ... SELECT FROM auth.users ON CONFLICT DO NOTHING`.

Confirm and I'll implement.