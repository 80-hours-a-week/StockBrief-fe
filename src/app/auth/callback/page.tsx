import { AuthCallbackClient } from "@/components/AuthCallbackClient";

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; state?: string }>;
}) {
  const params = await searchParams;
  return <AuthCallbackClient code={params.code ?? null} state={params.state ?? null} />;
}
