-- Fix broken CHECK: array_length(x,1) is NULL for empty arrays, so the old
-- constraint accepted status='active' with image_paths='{}'. Replace with a
-- cardinality-based rule that ties the requirement to publish-visible status.
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_image_paths_check;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_image_paths_check
  CHECK (
    cardinality(image_paths) <= 10
    AND (
      status NOT IN ('active','sold')
      OR cardinality(image_paths) >= 1
    )
  ) NOT VALID;
-- NOT VALID: enforces on all future INSERT/UPDATE, but does not fail the
-- migration on the pre-existing orphan row (1e7fac66-c65d-4ad9-b575-5d520b9f6cb1).
-- Clean that row up manually (set status='pending_review' or delete) and then
-- run: ALTER TABLE public.listings VALIDATE CONSTRAINT listings_image_paths_check;