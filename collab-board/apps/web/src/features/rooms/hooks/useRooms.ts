"use client";

import { useState, useEffect, useCallback } from "react";
import type { Room } from "../types";

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/rooms");
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const data = await res.json();
      setRooms(data.rooms);
    } catch (err) {
      setError("Failed to load your rooms.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const createRoom = async (code: string, name?: string) => {
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name: name || "Untitled Room" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create room");
    await fetchRooms();
    return data.room;
  };

  const joinRoom = async (code: string) => {
    const res = await fetch(`/api/rooms/${code}/join`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to join room");
    await fetchRooms();
    return data;
  };

  const renameRoom = async (roomId: string, name: string) => {
    const res = await fetch(`/api/rooms/${roomId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to rename room");
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, name } : r))
    );
  };

  const deleteRoom = async (roomId: string) => {
    const res = await fetch(`/api/rooms/${roomId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to delete room");
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
  };

  return {
    rooms,
    isLoading,
    error,
    fetchRooms,
    createRoom,
    joinRoom,
    renameRoom,
    deleteRoom,
  };
}