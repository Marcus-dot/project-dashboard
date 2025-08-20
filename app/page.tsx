import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
          Project Scale Dashboard
        </h1>
        <p className="text-gray-600 mb-8 text-center">
          Strategically visualize and manage all internal projects
        </p>

        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="block w-full py-3 px-4 bg-indigo-600 text-white text-center rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Go to Dashboard
          </Link>

          <Link
            href="/auth/login"
            className="block w-full py-3 px-4 bg-gray-100 text-gray-700 text-center rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Sign In
          </Link>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          Built with Next.js and Supabase
        </p>
      </div>
    </div>
  )
}