import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMyListings from "./tools/list-my-listings";
import searchListings from "./tools/search-listings";
import getUnreadMessages from "./tools/get-unread-messages";
import markListingSold from "./tools/mark-listing-sold";

// OAuth issuer MUST be the direct Supabase host, not the .lovable.cloud proxy.
// VITE_SUPABASE_PROJECT_ID is inlined by Vite at build time; the fallback keeps
// the issuer well-formed during throwaway manifest-extract evals.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "rroba-mcp",
  title: "Rroba",
  version: "0.1.0",
  instructions:
    "Tools for the Rroba marketplace (Albanian second-hand fashion). Use `search_listings` to find active items, `list_my_listings` to inspect your own listings, `get_unread_messages` to check unread chat messages, and `mark_listing_sold` to mark one of your listings as sold. All tools act as the signed-in Rroba user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listMyListings, searchListings, getUnreadMessages, markListingSold],
});
