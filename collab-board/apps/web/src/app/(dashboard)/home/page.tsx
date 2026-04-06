import { auth } from "@/lib/auth";
import { signOut } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400">
          Welcome, <span className="text-blue-400">{session?.user?.name ?? session?.user?.email}</span>
        </p>
        <p className="text-gray-600 text-sm mt-1">
          Phase 1 complete. Room management coming in Phase 2.
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          className="px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
        >
          Sign Out
        </button>
      </form>
    </div>
  );
}