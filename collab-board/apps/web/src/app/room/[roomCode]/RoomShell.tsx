"use client";

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

interface RoomShellProps {
  roomCode: string;
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
      {user.name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function RoomShell({
  roomCode,
  roomName,
  user,
  membership,
}: RoomShellProps) {
  const { isConnected, isAuthenticated } = useYjs();
  const presenceUsers = usePresence(user.id);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Top Navbar */}
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
            <p className="text-gray-500 text-xs font-mono mt-0.5">
              {roomCode}
            </p>
          </div>

          {/* Role badge */}
          <div className="hidden sm:flex">
            {membership.role === "ADMIN" ? (
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

        {/* Right: Presence + Connection */}
        <div className="flex items-center gap-4">
          {/* Online users */}
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

      {/* Main Canvas Area — Placeholder for Phase 4 */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {/* Connection overlay */}
        {(!isConnected || !isAuthenticated) && (
          <div className="absolute inset-0 bg-gray-950/80 flex items-center justify-center z-20 backdrop-blur-sm">
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

        {/* Placeholder */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PenLine className="w-8 h-8 text-gray-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-400 mb-2">
            Canvas coming in Phase 4
          </h2>
          <p className="text-gray-600 text-sm max-w-sm">
            Real-time Yjs connection is live. Presence awareness is active.
            The whiteboard canvas will be built next.
          </p>

          {isAuthenticated && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl inline-block">
              <p className="text-green-400 text-sm font-medium">
                ✅ Yjs connection established
              </p>
              <p className="text-green-600 text-xs mt-1">
                {presenceUsers.length} user{presenceUsers.length !== 1 ? "s" : ""}{" "}
                in this room right now
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom presence bar (mobile-friendly) */}
      {presenceUsers.length > 0 && (
        <div className="h-10 border-t border-gray-800 flex items-center px-4 gap-3 flex-shrink-0 bg-gray-950/80">
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
    </div>
  );
}