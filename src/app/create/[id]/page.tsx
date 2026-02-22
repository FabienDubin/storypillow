"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function CreateStoryRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    // Redirect to the appropriate step based on story status
    fetch(`/api/stories/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const stepMap: Record<string, string> = {
          draft: `/create/${id}/plan`,
          plan_ready: `/create/${id}/plan`,
          text_ready: `/create/${id}/text`,
          characters_ready: `/create/${id}/characters`,
          images_ready: `/create/${id}/images`,
          complete: `/read/${id}`,
        };
        router.replace(stepMap[data.status] || `/create/${id}/plan`);
      })
      .catch(() => {
        router.replace("/");
      });
  }, [id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="spinner h-8 w-8 border-2 border-gold/30 border-t-gold rounded-full" />
    </div>
  );
}
