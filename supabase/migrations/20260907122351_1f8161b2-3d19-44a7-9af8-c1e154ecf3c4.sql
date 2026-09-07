-- 1) Email queue helper functions: remove execute rights from public roles
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.email_queue_dispatch() TO service_role;

-- 2) Rotate the internal webhook token and store it in Vault (never in SQL source)
DO $$
DECLARE
  v_token text;
  v_id uuid;
BEGIN
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  SELECT id INTO v_id FROM vault.secrets WHERE name = 'report_webhook_token';
  IF v_id IS NULL THEN
    PERFORM vault.create_secret(v_token, 'report_webhook_token', 'Shared secret for internal notification webhook routes');
  ELSE
    PERFORM vault.update_secret(v_id, v_token, 'report_webhook_token');
  END IF;
END $$;

-- 3) Triggers read the token from Vault at call time
CREATE OR REPLACE FUNCTION public.notify_new_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_token text;
BEGIN
  SELECT decrypted_secret INTO v_token FROM vault.decrypted_secrets WHERE name = 'report_webhook_token';
  IF v_token IS NULL THEN
    RAISE WARNING 'notify_new_report: report_webhook_token missing from vault';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://rroba-style-discover.lovable.app/api/public/notify-new-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-token', v_token
    ),
    body := jsonb_build_object('report_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_new_report webhook enqueue failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_pending_promotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_token text;
BEGIN
  IF NEW.status = 'pending_payment' THEN
    SELECT decrypted_secret INTO v_token FROM vault.decrypted_secrets WHERE name = 'report_webhook_token';
    IF v_token IS NULL THEN
      RAISE WARNING 'notify_pending_promotion: report_webhook_token missing from vault';
      RETURN NEW;
    END IF;

    PERFORM net.http_post(
      url := 'https://rroba-style-discover.lovable.app/api/public/notify-pending-promotion',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-token', v_token
      ),
      body := jsonb_build_object('promotion_id', NEW.id)
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_pending_promotion webhook enqueue failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;