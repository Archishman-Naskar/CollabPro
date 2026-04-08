"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { YjsProvider, useYjs } from "@/lib/yjs/provider";
import RoomShell from "./RoomShell";

type Membership = { role: string; canWrite: boolean; canVideo: boolean };

// ─── PermissionWatcher ───────────────────────────────────────────────────────
// Lives inside YjsProvider so it can call useYjs().
// Watches only the per-user key in "permissionVersion".
// Uses reconnectWithToken (soft reconnect) — same provider, same awareness.

function PermissionWatcher({
  roomId,
  userId,
  onMembershipUpdate,
}: {
  roomId: string;
  userId: string;
  onMembershipUpdate: (m: Membership) => void;
}) {
  const { ydoc, isAuthenticated, reconnectWithToken } = useYjs();
  const lastValueRef = useRef<number | null>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const permMap = ydoc.getMap("permissionVersion");

    const handler = () => {
      const myValue = permMap.get(userId) as number | undefined;

      // Key hasn't been set yet — nothing to do.
      if (myValue === undefined) return;

      // First observation after (re)connect: record baseline, don't reconnect.
      if (lastValueRef.current === null) {
        lastValueRef.current = myValue;
        return;
      }

      // Another user's key changed — ignore.
      if (myValue === lastValueRef.current) return;

      lastValueRef.current = myValue;

      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      fetch(`/api/rooms/${roomId}/token`, { method: "POST" })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.token) {
            // Soft reconnect — does NOT recreate the provider.
            reconnectWithToken(data.token);
            onMembershipUpdate(data.membership);
          }
        })
        .catch(console.error)
        .finally(() => {
          isFetchingRef.current = false;
        });
    };

    permMap.observe(handler);
    return () => permMap.unobserve(handler);
  }, [ydoc, isAuthenticated, roomId, userId, reconnectWithToken, onMembershipUpdate]);

  return null;
}

// ─── RoomClient ──────────────────────────────────────────────────────────────

interface RoomClientProps {
  roomCode: string;
  roomId: string;
  roomName: string;
  token: string;
  user: { id: string; name: string | null; image: string | null };
  membership: Membership;
}

export default function RoomClient({
  roomCode,
  roomId,
  roomName,
  token,
  user,
  membership: initialMembership,
}: RoomClientProps) {
  // Only membership needs local state — token is now managed inside YjsProvider
  // via a ref. Changing it never causes a provider rebuild.
  const [membership, setMembership] = useState(initialMembership);

  const handleMembershipUpdate = useCallback((newMembership: Membership) => {
    setMembership(newMembership);
  }, []);

  return (
    // Pass the initial token once. After that, reconnectWithToken() updates
    // the token ref inside the provider without causing this tree to re-render.
    <YjsProvider roomCode={roomCode} token={token} user={user}>
      <PermissionWatcher
        roomId={roomId}
        userId={user.id}
        onMembershipUpdate={handleMembershipUpdate}
      />
      <RoomShell
        roomCode={roomCode}
        roomId={roomId}
        roomName={roomName}
        user={user}
        membership={membership}
      />
    </YjsProvider>
  );
}