"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
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
  // NEW: disconnect + reconnect the existing provider with a fresh token.
  // Does NOT recreate the provider — preserves the awareness object and clientID.
  reconnectWithToken: (newToken: string) => void;
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

  // Store the current token in a ref so the provider's token callback always
  // reads the latest value without needing to recreate the provider.
  const tokenRef = useRef<string>(token);
  tokenRef.current = token; // keep in sync on every render

  // Keep a ref to the live provider so reconnectWithToken can access it
  // without needing it as a useCallback dependency.
  const providerRef = useRef<HocuspocusProvider | null>(null);

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
      // Use a callback so the provider always reads tokenRef.current.
      // This means calling disconnect() + connect() on the same provider
      // instance will authenticate with whatever token is in the ref at
      // that moment — no provider teardown required.
      token: () => tokenRef.current,

      onConnect() {
        setIsConnected(true);
      },

      onDisconnect() {
        setIsConnected(false);
        setIsAuthenticated(false);
      },

      onAuthenticated() {
        setIsAuthenticated(true);
        // Set awareness on the SAME provider instance every time it
        // authenticates (including after a disconnect/reconnect cycle).
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

    providerRef.current = hocuspocusProvider;
    setProvider(hocuspocusProvider);

    return () => {
      hocuspocusProvider.destroy();
      providerRef.current = null;
      setProvider(null);
      setIsConnected(false);
      setIsAuthenticated(false);
    };
    // ⚠️  token is intentionally NOT in this dep array.
    // Changing the token updates tokenRef.current (above) and triggers a
    // disconnect/reconnect via reconnectWithToken — not a provider rebuild.
  }, [roomCode, user.id, user.name, user.image]);

  // Soft reconnect: update the token ref then cycle the WebSocket connection.
  // The same HocuspocusProvider instance is reused, which means:
  //   • same Y.Doc
  //   • same Awareness object and clientID
  //   • awareness re-broadcast fires correctly in onAuthenticated
  const reconnectWithToken = useCallback((newToken: string) => {
    tokenRef.current = newToken;
    const p = providerRef.current;
    if (!p) return;
    p.disconnect();
    // Brief pause lets the disconnect propagate to peers before the new
    // connection arrives, keeping server-side state clean.
    setTimeout(() => p.connect(), 150);
  }, []); // stable — never changes

  const contextValue = useMemo<YjsContextValue>(
    () => ({
      provider,
      ydoc: ydocRef.current,
      isConnected,
      isAuthenticated,
      awareness: provider?.awareness ?? null,
      reconnectWithToken,
    }),
    [provider, isConnected, isAuthenticated, reconnectWithToken]
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