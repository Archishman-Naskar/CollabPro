"use client";

import { useState, useCallback } from "react";
import type { Member } from "../types";

export function useMembers(roomId: string) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${roomId}/members`);
      if (!res.ok) throw new Error("Failed to fetch members");
      const data = await res.json();
      setMembers(data.members);
    } catch {
      setError("Failed to load members.");
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  const updateMember = useCallback(
    async (
      memberId: string,
      update: { canWrite?: boolean; canVideo?: boolean }
    ) => {
      const res = await fetch(`/api/rooms/${roomId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update member");
      }
      // Optimistic local state update
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, ...update } : m))
      );
    },
    [roomId]
  );

  const bulkAction = useCallback(
    async (
      action:
        | "grant_write"
        | "revoke_write"
        | "grant_video"
        | "revoke_video"
    ) => {
      const res = await fetch(`/api/rooms/${roomId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Bulk action failed");
      }
      await fetchMembers(); // Refresh full list after bulk op
    },
    [roomId, fetchMembers]
  );

  return { members, isLoading, error, fetchMembers, updateMember, bulkAction };
}