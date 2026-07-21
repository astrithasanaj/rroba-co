# Regression test: `public_profiles` is read-only for clients

The `public_profiles` view runs with `security_invoker = false` so it can serve
cross-user profile lookups (search, seller pages) without exposing base-table
sensitive columns. Because it bypasses RLS on `profiles`, the view MUST remain
read-only for the `anon` and `authenticated` roles. Anything else re-opens a
privilege-escalation path (rating, blocking flags, membership, etc.).

## Automated DB check

```sql
SELECT
  has_table_privilege('anon',          'public.public_profiles', 'SELECT') AS anon_select,
  has_table_privilege('anon',          'public.public_profiles', 'INSERT') AS anon_insert,
  has_table_privilege('anon',          'public.public_profiles', 'UPDATE') AS anon_update,
  has_table_privilege('anon',          'public.public_profiles', 'DELETE') AS anon_delete,
  has_table_privilege('authenticated', 'public.public_profiles', 'SELECT') AS auth_select,
  has_table_privilege('authenticated', 'public.public_profiles', 'INSERT') AS auth_insert,
  has_table_privilege('authenticated', 'public.public_profiles', 'UPDATE') AS auth_update,
  has_table_privilege('authenticated', 'public.public_profiles', 'DELETE') AS auth_delete;
```

Expected: `SELECT = true` for both roles, everything else `false`.

## Manual PostgREST check (real authenticated JWT, NOT service_role)

Replace `$JWT` with a session access token from a normal signed-in user and
`$ANON` with the project's publishable key.

```bash
URL="https://<project-ref>.supabase.co/rest/v1/public_profiles"
H=(-H "apikey: $ANON" -H "Authorization: Bearer $JWT" -H "Content-Type: application/json")

# SELECT  -> 200
curl -sS -o /dev/null -w "SELECT %{http_code}\n" "${H[@]}" "$URL?select=id,username&limit=1"

# INSERT  -> 403 "permission denied for view public_profiles"
curl -sS -w "\nINSERT %{http_code}\n" -X POST "${H[@]}" "$URL" \
  -d '{"id":"00000000-0000-0000-0000-000000000001","username":"regression"}'

# UPDATE  -> 403
curl -sS -w "\nUPDATE %{http_code}\n" -X PATCH "${H[@]}" \
  "$URL?id=eq.00000000-0000-0000-0000-000000000000" -d '{"bio":"regression"}'

# DELETE  -> 403
curl -sS -w "\nDELETE %{http_code}\n" -X DELETE "${H[@]}" \
  "$URL?id=eq.00000000-0000-0000-0000-000000000000"
```

Any non-`403` result on INSERT/UPDATE/DELETE, or any HTTP `200/201/204` write
response, is a release blocker: revoke write privileges on the view immediately.

## Exposed columns (whitelist)

`id, name, display_name, username, avatar_url, bio, city, city_id, rating_avg,
rating_count, created_at, search_slug`. Adding any other column requires a
security review — sensitive fields (email, phone, preferences, is_blocked,
signup_ip, membership_tier, etc.) must stay on the base `profiles` table.

## Normal profile edits

Users still edit their own profile through the base `public.profiles` table,
gated by RLS (`auth.uid() = id`) plus the `prevent_sensitive_profile_update`
trigger. `public_profiles` is a read-only projection and is never used as a
write target.
