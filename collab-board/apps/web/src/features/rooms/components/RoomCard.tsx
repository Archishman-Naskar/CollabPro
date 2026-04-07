"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Users,
  Clock,
  Crown,
  Pencil,
  Trash2,
  ArrowRight,
  Shield,
  Eye,
} from "lucide-react";
import type { Room } from "../types";

interface RoomCardProps {
  room: Room;
  onRename: (roomId: string, name: string) => Promise<void>;
  onDelete: (roomId: string) => Promise<void>;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function RoomCard({ room, onRename, onDelete }: RoomCardProps) {
  const router = useRouter();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(room.name);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEnterRoom = () => {
    router.push(`/room/${room.code}`);
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === room.name) {
      setIsRenaming(false);
      return;
    }
    try {
      await onRename(room.id, newName.trim());
      toast.success("Room renamed.");
      setIsRenaming(false);
    } catch (err: any) {
      toast.error(err.message);
      setNewName(room.name);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${room.name}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await onDelete(room.id);
      toast.success("Room deleted.");
    } catch (err: any) {
      toast.error(err.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all group hover:shadow-lg hover:shadow-black/20">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setNewName(room.name);
                  setIsRenaming(false);
                }
              }}
              className="w-full bg-gray-800 border border-blue-500 rounded px-2 py-0.5 text-white text-sm font-semibold focus:outline-none"
              maxLength={100}
            />
          ) : (
            <h3 className="font-semibold text-white truncate">{room.name}</h3>
          )}
          <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">
            {room.code}
          </p>
        </div>

        {/* Role Badge */}
        <div className="flex-shrink-0">
          {room.role === "ADMIN" ? (
            <span className="flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">
              <Crown className="w-3 h-3" />
              Admin
            </span>
          ) : room.canWrite ? (
            <span className="flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
              <Shield className="w-3 h-3" />
              Writer
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs bg-gray-500/10 text-gray-400 border border-gray-500/20 px-2 py-0.5 rounded-full">
              <Eye className="w-3 h-3" />
              Viewer
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {room.memberCount} member{room.memberCount !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(room.lastAccessed)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleEnterRoom}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Enter Room
          <ArrowRight className="w-4 h-4" />
        </button>

        {room.role === "ADMIN" && (
          <>
            <button
              onClick={() => setIsRenaming(true)}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
              title="Rename"
            >
              <Pencil className="w-4 h-4" />
            </button>
            {room.isOwner && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                title="Delete room"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}