"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wifi,
  WifiOff,
  Loader2,
  Users,
  Crown,
  Eye,
  PenLine,
} from "lucide-react";
import { useYjs } from "@/lib/yjs/provider";
import { usePresence } from "@/features/canvas/hooks/usePresence";
import WhiteboardCanvas from "@/features/canvas/components/WhiteboardCanvas";
import BoardContainer from "@/features/boards/components/BoardContainer";
import MembersPanel from "@/features/rbac/components/MembersPanel";

interface RoomShellProps {
  roomCode: string;
  roomId: string;
  roomName: string;
  user: { id: string; name: string | null; image: string | null };
  membership: { role: string; canWrite: boolean; canVideo: boolean };
}

function ConnectionBadge({
  isConnected,
  isAuthenticated,
}: {
  isConnected: boolean;
  isAuthenticated: boolean;
}) {
  if (!isConnected) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-gray-500">
        <Loader2 className="w-3 h-3 animate-spin" />
        Connecting...
      </span>
    );
  }
  if (!isAuthenticated) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-yellow-500">
        <WifiOff className="w-3 h-3" />
        Authenticating...
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-green-400">
      <Wifi className="w-3 h-3" />
      Live
    </span>
  );
}

function UserAvatar({
  user,
  size = "sm",
}: {
  user: { name: string; image: string | null; color: string; isSelf: boolean };
  size?: "sm" | "md";
}) {
  const sizeClasses = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  if (user.image) {
    return (
      <div
        className={`${sizeClasses} rounded-full overflow-hidden border-2 flex-shrink-0`}
        style={{ borderColor: user.color }}
        title={user.name + (user.isSelf ? " (you)" : "")}
      >
        <img
          src={user.image}
          alt={user.name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className={`${sizeClasses} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 border-2`}
      style={{ backgroundColor: user.color, borderColor: user.color }}
      title={user.name + (user.isSelf ? " (you)" : "")}
    >
      {(user.name ?? "?").charAt(0).toUpperCase()}
    </div>
  );
}

export default function RoomShell({
  roomCode,
  roomId,
  roomName,
  user,
  membership,
}: RoomShellProps) {
  const { isConnected, isAuthenticated } = useYjs();
  const presenceUsers = usePresence(user.id);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const isAdmin = membership.role === "ADMIN";
  const canWrite = isAdmin || membership.canWrite;

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* ── Top Navbar ──────────────────────────────────────────────────── */}
      <nav className="h-14 border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0 bg-gray-950/90 backdrop-blur-sm z-30">
        {/* Left: Back + Room Info */}
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <h1 className="font-semibold text-sm leading-none">{roomName}</h1>
            <p className="text-gray-500 text-xs font-mono mt-0.5">{roomCode}</p>
          </div>

          {/* Role badge */}
          <div className="hidden sm:flex">
            {isAdmin ? (
              <span className="flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                <Crown className="w-3 h-3" />
                Admin
              </span>
            ) : membership.canWrite ? (
              <span className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                <PenLine className="w-3 h-3" />
                Writer
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs bg-gray-500/10 text-gray-400 border border-gray-500/20 px-2 py-0.5 rounded-full">
                <Eye className="w-3 h-3" />
                View Only
              </span>
            )}
          </div>
        </div>

        {/* Right: Members button + Presence + Connection */}
        <div className="flex items-center gap-3">
          {/* Members panel toggle — admin only */}
          {isAdmin && isAuthenticated && (
            <button
              onClick={() => setIsPanelOpen(true)}
              title="Manage Members"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium rounded-lg transition-colors border border-gray-700"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Members</span>
            </button>
          )}

          {/* Presence avatars */}
          {presenceUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {presenceUsers.slice(0, 5).map((u) => (
                  <UserAvatar key={u.clientId} user={u} size="sm" />
                ))}
              </div>
              {presenceUsers.length > 5 && (
                <span className="text-xs text-gray-500">
                  +{presenceUsers.length - 5}
                </span>
              )}
              <span className="text-xs text-gray-500 hidden sm:block">
                <Users className="w-3 h-3 inline mr-1" />
                {presenceUsers.length} online
              </span>
            </div>
          )}

          <ConnectionBadge
            isConnected={isConnected}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </nav>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Connection overlay — shows while not ready */}
        {(!isConnected || !isAuthenticated) && (
          <div className="absolute inset-0 bg-gray-950/80 flex items-center justify-center z-40 backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
              <p className="text-white font-medium">
                {!isConnected ? "Connecting to room..." : "Authenticating..."}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Establishing secure real-time connection
              </p>
            </div>
          </div>
        )}

        {/* Whiteboard Canvas (Phase 4) */}
        <WhiteboardCanvas user={user} membership={membership} />

        {/* Board overlay (Phase 5) */}
        {isAuthenticated && (
          <BoardContainer userId={user.id} canWrite={canWrite} />
        )}
      </div>

      {/* ── Bottom presence bar ─────────────────────────────────────────── */}
      {presenceUsers.length > 0 && (
        <div className="h-10 border-t border-gray-800 flex items-center px-4 gap-3 flex-shrink-0 bg-gray-950/80 z-30">
          <span className="text-xs text-gray-600">Online:</span>
          <div className="flex items-center gap-2 overflow-x-auto">
            {presenceUsers.map((u) => (
              <span
                key={u.clientId}
                className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: u.color }}
                />
                {u.name}
                {u.isSelf && (
                  <span className="text-gray-600">(you)</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── RBAC Members Panel (Phase 6) ────────────────────────────────── */}
      <MembersPanel
        roomId={roomId}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        currentUserId={user.id}
      />
    </div>
  );
}