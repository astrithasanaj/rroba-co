CREATE OR REPLACE FUNCTION public.verify_report_webhook_token(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_token text;
BEGIN
  IF p_token IS NULL OR length(p_token) < 16 THEN
    RETURN false;
  END IF;
  SELECT decrypted_secret INTO v_token FROM vault.decrypted_secrets WHERE name = 'report_webhook_token';
  IF v_token IS NULL THEN
    RETURN false;
  END IF;
  RETURN p_token = v_token;
END;
$function$;

REVOKE ALL ON FUNCTION public.verify_report_webhook_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_report_webhook_token(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_report_webhook_token(text) TO service_role;