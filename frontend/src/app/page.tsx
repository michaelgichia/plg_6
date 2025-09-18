import Link from 'next/link';

export default function Home() {
  return (
    <div className='min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-4xl w-full mx-auto'>
        <div className='text-center'>
          {/* Header Section */}
          <div className='mb-12'>
            <h1 className='text-4xl font-bold text-zinc-900 mb-4'>
              Welcome to StudyCompanion
            </h1>
            <p className='text-xl text-zinc-600 max-w-2xl mx-auto'>
              Upload your study materials and transform them into interactive
              learning experiences
            </p>
          </div>

          {/* Feature Cards */}
          <div className='grid md:grid-cols-3 gap-8 mb-12'>
            {/* Ask Questions Card */}
            <div className='bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300'>
              <h3 className='text-lg font-semibold text-zinc-900 mb-2'>
                Ask Questions
              </h3>
              <p className='text-zinc-600'>
                Get instant answers about your study material
              </p>
            </div>

            {/* Generate Quizzes Card */}
            <div className='bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300'>
              <h3 className='text-lg font-semibold text-zinc-900 mb-2'>
                Generate Quizzes
              </h3>
              <p className='text-zinc-600'>
                Test your knowledge with auto-generated quizzes
              </p>
            </div>

            {/* Study Flashcards Card */}
            <div className='bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow duration-300'>
              <h3 className='text-lg font-semibold text-zinc-900 mb-2'>
                Study Flashcards
              </h3>
              <p className='text-zinc-600'>
                Review key concepts with smart flashcards
              </p>
            </div>
          </div>

          {/* Authentication Buttons */}
          <div className='space-y-4 max-w-md mx-auto'>
            <Link
              href='/login'
              className='w-full bg-cyan-600 hover:bg-cyan-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 block text-center text-lg'
            >
              Sign In
            </Link>
            <Link
              href='/signup'
              className='w-full bg-zinc-600 hover:bg-zinc-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 block text-center text-lg'
            >
              Create Account
            </Link>
          </div>

          {/* Additional Info */}
          <div className='mt-12 text-center'>
            <p className='text-zinc-500 text-sm'>
              Join thousands of students already using StudyCompanion to enhance
              their learning
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
