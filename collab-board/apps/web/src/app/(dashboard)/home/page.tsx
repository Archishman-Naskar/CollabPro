"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  PlusCircle,
  LogIn,
  LogOut,
  Pencil,
  Loader2,
  FolderOpen,
  Search,
} from "lucide-react";
import { useRooms } from "@/features/rooms/hooks/useRooms";
import CreateRoomModal from "@/features/rooms/components/CreateRoomModal";
import JoinRoomModal from "@/features/rooms/components/JoinRoomModal";
import RoomCard from "@/features/rooms/components/RoomCard";

export default function HomePage() {
  const { data: session } = useSession();
  const { rooms, isLoading, createRoom, joinRoom, renameRoom, deleteRoom } =
    useRooms();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [search, setSearch] = useState("");

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Pencil className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">CollabBoard</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:block">
              {session?.user?.name ?? session?.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-1">
            Welcome back,{" "}
            <span className="text-blue-400">
              {session?.user?.name?.split(" ")[0] ?? "there"}
            </span>
          </h1>
          <p className="text-gray-400">
            Create a room or join an existing one to start collaborating.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-600/20"
          >
            <PlusCircle className="w-5 h-5" />
            Create New Room
          </button>
          <button
            onClick={() => setShowJoin(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl border border-gray-700 transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Join with Code
          </button>
        </div>

        {/* My Rooms */}
        <div>
          <div className="flex items-center justify-between mb-4 gap-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-400" />
              My Rooms
              {rooms.length > 0 && (
                <span className="text-sm font-normal text-gray-500">
                  ({rooms.length})
                </span>
              )}
            </h2>

            {rooms.length > 3 && (
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search rooms..."
                  className="pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                />
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="border border-dashed border-gray-800 rounded-xl py-16 text-center">
              <FolderOpen className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No rooms yet</p>
              <p className="text-gray-600 text-sm mt-1">
                Create your first room or join one with a code.
              </p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No rooms match your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onRename={renameRoom}
                  onDelete={deleteRoom}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreate={createRoom}
        />
      )}
      {showJoin && (
        <JoinRoomModal onClose={() => setShowJoin(false)} onJoin={joinRoom} />
      )}
    </div>
  );
}