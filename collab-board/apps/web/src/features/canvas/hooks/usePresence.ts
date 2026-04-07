"use client";

import { useEffect, useState } from "react";
import { useYjs } from "@/lib/yjs/provider";

export interface PresenceUser {
  clientId: number;
  id: string;
  name: string;
  image: string | null;
  color: string;
  isSelf: boolean;
}

export function usePresence(selfId: string): PresenceUser[] {
  const { awareness, isAuthenticated } = useYjs();
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!awareness) return;

    const updateUsers = () => {
      const states = Array.from(awareness.getStates().entries());
      const presenceUsers: PresenceUser[] = states
        .filter(([, state]) => state?.user?.id)
        .map(([clientId, state]) => ({
          clientId: clientId as number,
          id: state.user.id,
          name: state.user.name,
          image: state.user.image ?? null,
          color: state.user.color,
          isSelf: state.user.id === selfId,
        }));

      // Sort: self first, then others alphabetically
      presenceUsers.sort((a, b) => {
        if (a.isSelf) return -1;
        if (b.isSelf) return 1;
        return a.name.localeCompare(b.name);
      });

      setUsers(presenceUsers);
    };

    awareness.on("change", updateUsers);
    updateUsers(); // initial state

    return () => {
      awareness.off("change", updateUsers);
    };
  }, [awareness, selfId, isAuthenticated]);

  return users;
}