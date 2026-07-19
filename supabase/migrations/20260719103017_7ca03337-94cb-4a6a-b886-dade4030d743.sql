-- Sikkerhetsretting: fjern klient-tilgang til public.renew_membership.
-- Funksjonen aktiverer medlemskap uten betalingsverifikasjon, og skal
-- kun kunne kalles av en betrodd serverrolle (fremtidig Apple IAP-backend).

REVOKE EXECUTE ON FUNCTION public.renew_membership(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.renew_membership(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.renew_membership(text) FROM authenticated;

-- service_role beholder tilgang for fremtidig verifisert betalingsbackend.
GRANT EXECUTE ON FUNCTION public.renew_membership(text) TO service_role;