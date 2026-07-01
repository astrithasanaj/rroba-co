
DO $$
DECLARE
  admin_uid uuid;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE lower(email) = 'astrithasanaj@outlook.com' LIMIT 1;
  IF admin_uid IS NULL THEN RAISE EXCEPTION 'admin user not found'; END IF;

  INSERT INTO public.admin_users (user_id) VALUES (admin_uid) ON CONFLICT DO NOTHING;

  DELETE FROM public.listing_likes WHERE listing_id IN (SELECT id FROM public.listings WHERE user_id <> admin_uid);
  DELETE FROM public.listing_saves WHERE listing_id IN (SELECT id FROM public.listings WHERE user_id <> admin_uid);
  DELETE FROM public.offers        WHERE listing_id IN (SELECT id FROM public.listings WHERE user_id <> admin_uid);
  DELETE FROM public.reports       WHERE product_id IN (SELECT id FROM public.listings WHERE user_id <> admin_uid);
  DELETE FROM public.messages      WHERE conversation_id IN (
    SELECT id FROM public.conversations WHERE listing_id IN (SELECT id FROM public.listings WHERE user_id <> admin_uid)
  );
  DELETE FROM public.conversations WHERE listing_id IN (SELECT id FROM public.listings WHERE user_id <> admin_uid);
  DELETE FROM public.listings      WHERE user_id <> admin_uid;

  DELETE FROM public.messages WHERE conversation_id IN (
    SELECT id FROM public.conversations WHERE buyer_id <> admin_uid AND seller_id <> admin_uid
  );
  DELETE FROM public.conversations WHERE buyer_id <> admin_uid AND seller_id <> admin_uid;

  DELETE FROM public.profiles WHERE id NOT IN (SELECT id FROM auth.users);
  DELETE FROM public.notifications WHERE user_id NOT IN (SELECT id FROM auth.users);
END $$;
