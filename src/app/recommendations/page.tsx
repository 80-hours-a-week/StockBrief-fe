import { RecommendationsList } from "@/components/RecommendationsList";

export const dynamic = "force-dynamic";

type RecommendationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RecommendationsPage({ searchParams }: RecommendationsPageProps) {
  const params = await searchParams;
  return <RecommendationsList searchParams={params} />;
}
