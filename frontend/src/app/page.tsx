import Link from "next/link";
import { getMe } from "@/actions/users";
import { logout } from "@/actions/auth";

export default async function Home() {
  const result = await getMe();
  const user = result.ok ? result.data : null;
  return (
    <main className="relative min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-50 via-white to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 transition-colors duration-500">
      {/* Animated Gradient Background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[120vw] h-[60vh] bg-gradient-to-tr from-cyan-400/30 via-indigo-400/20 to-fuchsia-400/10 blur-3xl opacity-70 animate-pulse" />
      </div>

      {/* Minimal header with logo and Athena text */}
      <header className="relative z-20 w-full flex items-center px-4 sm:px-12 py-4 sm:py-6 bg-transparent justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg mr-2">
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M13 2L3 14h9l-1 8L21 10h-9l1-8z" />
            </svg>
          </span>
          <span className="font-medium text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white">
            Athena
          </span>
        </div>
        {user && (
            <button
              type="submit"
              onClick={logout}
              className="ml-4 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
            >
              Log out
            </button>
        )}
      </header>

      <section className="relative z-10 flex flex-col items-center justify-center text-center py-20 px-4 sm:px-8">
        <div className="flex items-center justify-center gap-4 mb-2">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-600 via-indigo-700 to-fuchsia-600 bg-clip-text text-transparent drop-shadow-lg m-0">
            Athena
          </h1>
        </div>
        <div className="text-xl sm:text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-6">
          Your AI Study Companion
        </div>
        <p className="text-lg sm:text-2xl text-slate-700 dark:text-slate-200 max-w-2xl mx-auto mb-10 font-medium">
          Upload your study materials and transform them into interactive,
          personalized learning experiences powered by AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          {user ? (
            <Link
              href="/dashboard"
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-200 text-lg"
            >
              Go to Dashboard
              </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-200 text-lg"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition duration-200 text-lg"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
        <span className="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Join thousands of students already using Athena to enhance their
          learning
        </span>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-5xl mx-auto w-full px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Ask Questions Card */}
          <div className="group bg-white/90 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 shadow-xl rounded-2xl p-8 flex flex-col items-center hover:scale-[1.03] hover:shadow-2xl transition-all duration-300">
            <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-cyan-100 dark:bg-cyan-900">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="#0891b2"
                  strokeWidth="2"
                  d="M12 19v-2m0-2a4 4 0 1 0-4-4"
                />
                <circle cx="12" cy="12" r="9" stroke="#0891b2" strokeWidth="2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Ask Questions
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Get instant answers about your study material.
            </p>
          </div>
          {/* Generate Quizzes Card */}
          <div className="group bg-white/90 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 shadow-xl rounded-2xl p-8 flex flex-col items-center hover:scale-[1.03] hover:shadow-2xl transition-all duration-300">
            <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                <rect
                  x="4"
                  y="4"
                  width="16"
                  height="16"
                  rx="4"
                  stroke="#6366f1"
                  strokeWidth="2"
                />
                <path
                  stroke="#6366f1"
                  strokeWidth="2"
                  d="M8 8h8M8 12h8M8 16h4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Generate Quizzes
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Test your knowledge with auto-generated quizzes.
            </p>
          </div>
          {/* Study Flashcards Card */}
          <div className="group bg-white/90 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 shadow-xl rounded-2xl p-8 flex flex-col items-center hover:scale-[1.03] hover:shadow-2xl transition-all duration-300">
            <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900">
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                <rect
                  x="4"
                  y="7"
                  width="16"
                  height="10"
                  rx="2"
                  stroke="#d946ef"
                  strokeWidth="2"
                />
                <path stroke="#d946ef" strokeWidth="2" d="M8 11h8M8 15h4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Study Flashcards
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Review key concepts with smart flashcards.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
