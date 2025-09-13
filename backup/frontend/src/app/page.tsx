'use client'

import Link from "next/link";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user, isAuthenticated } = useAuthContext();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto">
          <div className="text-center">
            <div className="mx-auto h-12 w-auto mb-6 flex justify-center">
              <div className="text-2xl font-bold text-zinc-900">StudyCompanion</div>
            </div>

            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-zinc-900 mb-4">
                  Welcome, {user.full_name}!
                </h2>
                <div className="text-left space-y-2">
                  <p className="text-sm text-zinc-600">
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                  <p className="text-sm text-zinc-600">
                    <span className="font-medium">Status:</span>{" "}
                    <span className={user.is_active ? "text-green-600" : "text-red-600"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </p>
                  {user.is_superuser && (
                    <p className="text-sm text-zinc-600">
                      <span className="font-medium">Role:</span>{" "}
                      <span className="text-cyan-600">Administrator</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Link
                  href="/dashboard"
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 block text-center"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto">
        <div className="text-center">
          {/* Header Section */}
          <div className="mb-12">
            <div className="mx-auto h-20 w-20 mb-6 flex items-center justify-center rounded-full bg-cyan-100">
              <div className="text-3xl">🎓</div>
            </div>
            <h1 className="text-4xl font-bold text-zinc-900 mb-4">
              Welcome to StudyCompanion
            </h1>
            <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
              Upload your study materials and transform them into interactive learning experiences
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Ask Questions Card */}
            <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="mx-auto h-16 w-16 mb-4 flex items-center justify-center rounded-full bg-cyan-100">
                <div className="text-2xl text-cyan-600">💬</div>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Ask Questions</h3>
              <p className="text-zinc-600">
                Get instant answers about your study material
              </p>
            </div>

            {/* Generate Quizzes Card */}
            <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="mx-auto h-16 w-16 mb-4 flex items-center justify-center rounded-full bg-cyan-100">
                <div className="text-2xl text-cyan-600">🧠</div>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Generate Quizzes</h3>
              <p className="text-zinc-600">
                Test your knowledge with auto-generated quizzes
              </p>
            </div>

            {/* Study Flashcards Card */}
            <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="mx-auto h-16 w-16 mb-4 flex items-center justify-center rounded-full bg-cyan-100">
                <div className="text-2xl text-cyan-600">⚡</div>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Study Flashcards</h3>
              <p className="text-zinc-600">
                Review key concepts with smart flashcards
              </p>
            </div>
          </div>

          {/* Authentication Buttons */}
          <div className="space-y-4 max-w-md mx-auto">
            <Link
              href="/login"
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 block text-center text-lg"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="w-full bg-zinc-600 hover:bg-zinc-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 block text-center text-lg"
            >
              Create Account
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <p className="text-zinc-500 text-sm">
              Join thousands of students already using StudyCompanion to enhance their learning
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
