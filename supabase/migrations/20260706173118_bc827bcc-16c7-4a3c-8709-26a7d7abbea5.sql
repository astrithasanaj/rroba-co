ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE public.messages SET read = TRUE WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(conversation_id, sender_id) WHERE read = FALSE;