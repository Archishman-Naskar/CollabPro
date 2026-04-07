"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
  ReactNode,
} from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

interface PresenceUser {
  id: string;
  name: string;
  image: string | null;
  color: string;
}

interface YjsContextValue {
  provider: HocuspocusProvider | null;
  ydoc: Y.Doc;
  isConnected: boolean;
  isAuthenticated: boolean;
  awareness: HocuspocusProvider["awareness"] | null;
}

const YjsContext = createContext<YjsContextValue | null>(null);

interface YjsProviderProps {
  children: ReactNode;
  roomCode: string;
  token: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

function generateUserColor(userId: string): string {
  const colors = [
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#06B6D4",
    "#84CC16",
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function YjsProvider({
  children,
  roomCode,
  token,
  user,
}: YjsProviderProps) {
  const ydocRef = useRef<Y.Doc>(new Y.Doc());
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const doc = ydocRef.current;
    const userColor = generateUserColor(user.id);

    const hocuspocusProvider = new HocuspocusProvider({
      url: process.env.NEXT_PUBLIC_HOCUSPOCUS_URL!,
      name: roomCode,
      document: doc,
      token,

      onConnect() {
        console.log("[Yjs] Connected to Hocuspocus");
        setIsConnected(true);
      },

      onDisconnect() {
        console.log("[Yjs] Disconnected from Hocuspocus");
        setIsConnected(false);
        setIsAuthenticated(false);
      },

      onAuthenticated() {
        console.log("[Yjs] Authenticated");
        setIsAuthenticated(true);

        // Set our presence in the awareness protocol
        hocuspocusProvider.setAwarenessField("user", {
          id: user.id,
          name: user.name ?? "Anonymous",
          image: user.image,
          color: userColor,
        } satisfies PresenceUser);
      },

      onAuthenticationFailed({ reason }) {
        console.error("[Yjs] Authentication failed:", reason);
      },
    });

    setProvider(hocuspocusProvider);

    return () => {
      hocuspocusProvider.destroy();
      setProvider(null);
      setIsConnected(false);
      setIsAuthenticated(false);
    };
  }, [roomCode, token, user.id, user.name, user.image]);

  const contextValue = useMemo<YjsContextValue>(
    () => ({
      provider,
      ydoc: ydocRef.current,
      isConnected,
      isAuthenticated,
      awareness: provider?.awareness ?? null,
    }),
    [provider, isConnected, isAuthenticated]
  );

  return (
    <YjsContext.Provider value={contextValue}>{children}</YjsContext.Provider>
  );
}

export function useYjs(): YjsContextValue {
  const ctx = useContext(YjsContext);
  if (!ctx) {
    throw new Error("useYjs must be used inside <YjsProvider>");
  }
  return ctx;
}