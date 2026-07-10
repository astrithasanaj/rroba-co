import { createFileRoute, useParams } from "@tanstack/react-router";
import { FollowListPage } from "@/components/marketplace/FollowListPage";

export const Route = createFileRoute("/user/$id_/following")({
  component: FollowingRoute,
});

function FollowingRoute() {
  const { id } = useParams({ from: "/user/$id_/following" });
  return <FollowListPage userId={id} mode="following" />;
}
