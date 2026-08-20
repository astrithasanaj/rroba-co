DROP POLICY "Users insert own ratings" ON public.ratings;
CREATE POLICY "Users insert own ratings" ON public.ratings
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = rater_id
  AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE (c.buyer_id = ratings.rater_id AND c.seller_id = ratings.seller_id)
       OR (c.seller_id = ratings.rater_id AND c.buyer_id = ratings.seller_id)
  )
);