"use client";

import { useRouter } from "next/navigation";

export function AdminRefreshButton() {
  const router = useRouter();

  return (
    <button className="secondary" type="button" onClick={() => router.refresh()}>
      Refresh
    </button>
  );
}
