import { redirect } from "next/navigation";

// Tournaments share the league data model; reuse the league detail page.
export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/leagues/${slug}`);
}
