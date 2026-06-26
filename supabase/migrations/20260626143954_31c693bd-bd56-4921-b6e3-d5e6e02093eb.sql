ALTER TABLE public.conversations 
  ADD COLUMN IF NOT EXISTS archived_by_buyer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_by_seller boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_read_buyer_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_read_seller_at timestamptz;