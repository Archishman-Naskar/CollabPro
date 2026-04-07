"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Copy, Check, X, RefreshCw, Loader2 } from "lucide-react";

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (code: string, name: string) => Promise<void>;
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 20 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

export default function CreateRoomModal({
  onClose,
  onCreate,
}: CreateRoomModalProps) {
  const router = useRouter();
  const [code, setCode] = useState(() => generateRoomCode());
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      await onCreate(code, name || "Untitled Room");
      toast.success("Room created!");
      router.push(`/room/${code}`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create room.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Create Room</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Room Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Workspace"
            maxLength={100}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* Room Code */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Room Code
          </label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg">
              <span className="text-blue-400 font-mono text-sm tracking-wider flex-1">
                {code}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
              title="Copy code"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setCode(generateRoomCode())}
              className="px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
              title="Generate new code"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            Share this code with others to invite them.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create & Enter
          </button>
        </div>
      </div>
    </div>
  );
}