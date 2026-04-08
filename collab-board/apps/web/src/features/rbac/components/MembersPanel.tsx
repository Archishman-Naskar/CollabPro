"use client";

import { useEffect, useCallback } from "react";
import {
  X,
  Crown,
  Users,
  Loader2,
  Video,
  PenLine,
  Shield,
} from "lucide-react";
import toast from "react-hot-toast";
import { useYjs } from "@/lib/yjs/provider";
import { useMembers } from "../hooks/useMembers";
import type { Member } from "../types";

interface MembersPanelProps {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

// Increment the shared permissionVersion Y.Map so all clients know to reconnect.
function bumpPermissionVersion(
  ydoc: ReturnType<typeof useYjs>["ydoc"],
  targetUserId: string
) {
  const map = ydoc.getMap("permissionVersion");
  // Use timestamp so the value always changes even if bumped multiple times quickly
  map.set(targetUserId, Date.now());
}

function Avatar({ user }: { user: Member["user"] }) {
  const initial = (user.name ?? user.email).charAt(0).toUpperCase();
  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name ?? ""}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 text-xs font-semibold flex-shrink-0">
      {initial}
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}

function Toggle({ checked, onChange, disabled, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        checked ? "bg-blue-600" : "bg-gray-600"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[1.125rem]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function MembersPanel({
  roomId,
  isOpen,
  onClose,
  currentUserId,
}: MembersPanelProps) {
  const { ydoc } = useYjs();
  const { members, isLoading, error, fetchMembers, updateMember, bulkAction } =
    useMembers(roomId);

  // Fetch members whenever the panel opens
  useEffect(() => {
    if (isOpen) fetchMembers();
  }, [isOpen, fetchMembers]);

  const handleToggle = useCallback(
  async (member: Member, field: "canWrite" | "canVideo", value: boolean) => {
    const label = field === "canWrite" ? "Write" : "Video";
    const nameOrEmail = member.user.name ?? member.user.email;
    try {
      await updateMember(member.id, { [field]: value });
      bumpPermissionVersion(ydoc, member.userId);  // ← pass member.userId
      toast.success(
        `${label} permission ${value ? "granted to" : "revoked from"} ${nameOrEmail}`
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update permission.";
      toast.error(message);
    }
  },
  [updateMember, ydoc]
);

  const handleBulkAction = useCallback(
  async (
    action: "grant_write" | "revoke_write" | "grant_video" | "revoke_video"
  ) => {
    const labels: Record<typeof action, string> = {
      grant_write: "Write access granted to all members",
      revoke_write: "Write access revoked from all members",
      grant_video: "Video access granted to all members",
      revoke_video: "Video access revoked from all members",
    };
    try {
      await bulkAction(action); // internally calls fetchMembers to refresh state
      // Bump every non-admin member so they each individually reconnect
      members
        .filter((m) => m.role === "MEMBER")
        .forEach((m) => bumpPermissionVersion(ydoc, m.userId));  // ← per user
      toast.success(labels[action]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Bulk action failed.";
      toast.error(message);
    }
  },
  [bulkAction, ydoc, members]
);

  return (
    <>
      {/* Backdrop — click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-out panel */}
      <aside
        aria-label="Members panel"
        className={`fixed top-0 right-0 h-full w-80 bg-gray-900 border-l border-gray-800 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Panel header ─────────────────────────────────────────────── */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="font-semibold text-sm text-white">
              Room Members
            </span>
            {!isLoading && members.length > 0 && (
              <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded-full">
                {members.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Bulk actions ─────────────────────────────────────────────── */}
        <div className="p-3 border-b border-gray-800 flex-shrink-0">
          <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
            Bulk Actions
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {(
              [
                {
                  action: "grant_write" as const,
                  label: "Grant Write",
                  Icon: PenLine,
                  color: "text-blue-400",
                },
                {
                  action: "revoke_write" as const,
                  label: "Revoke Write",
                  Icon: PenLine,
                  color: "text-gray-400",
                },
                {
                  action: "grant_video" as const,
                  label: "Grant Video",
                  Icon: Video,
                  color: "text-green-400",
                },
                {
                  action: "revoke_video" as const,
                  label: "Revoke Video",
                  Icon: Video,
                  color: "text-gray-400",
                },
              ] as const
            ).map(({ action, label, Icon, color }) => (
              <button
                key={action}
                onClick={() => handleBulkAction(action)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors"
              >
                <Icon className={`w-3 h-3 ${color}`} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Member list ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-400 text-sm">{error}</div>
          ) : members.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No members found.
            </div>
          ) : (
            <ul className="divide-y divide-gray-800">
              {members.map((member) => {
                const isAdmin = member.role === "ADMIN";
                const isSelf = member.userId === currentUserId;

                return (
                  <li key={member.id} className="p-4">
                    {/* Identity row */}
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar user={member.user} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {member.user.name ?? member.user.email}
                          {isSelf && (
                            <span className="text-gray-500 text-xs ml-1.5">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {member.user.email}
                        </p>
                      </div>
                      {isAdmin ? (
                        <span className="flex items-center gap-1 text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                          <Crown className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs bg-gray-500/10 text-gray-400 border border-gray-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
                          <Shield className="w-3 h-3" />
                          Member
                        </span>
                      )}
                    </div>

                    {/* Permission toggles */}
                    <div className="space-y-2.5 ml-11">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <PenLine className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-400">
                            Can Write
                          </span>
                        </div>
                        <Toggle
                          checked={isAdmin || member.canWrite}
                          onChange={(v) =>
                            handleToggle(member, "canWrite", v)
                          }
                          disabled={isAdmin}
                          label={`Toggle write permission for ${member.user.name ?? member.user.email}`}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Video className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-400">
                            Can Video
                          </span>
                        </div>
                        <Toggle
                          checked={isAdmin || member.canVideo}
                          onChange={(v) =>
                            handleToggle(member, "canVideo", v)
                          }
                          disabled={isAdmin}
                          label={`Toggle video permission for ${member.user.name ?? member.user.email}`}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}