import { createFileRoute, useParams } from "@tanstack/react-router";
import { FollowListPage } from "@/components/marketplace/FollowListPage";

export const Route = createFileRoute("/user/$id/followers")({
  component: FollowersRoute,
});

function FollowersRoute() {
  const { id } = useParams({ from: "/user/$id/followers" });
  return <FollowListPage userId={id} mode="followers" />;
}
