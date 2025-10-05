export default function AuthBackground() {
  return (
    <div className='hidden lg:block lg:w-1/2 relative overflow-hidden rounded-l-3xl bg-gradient-to-br from-cyan-600 to-cyan-800'>
      <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent' />
      <div className='absolute w-full h-full flex items-center justify-center'>
        <div className='text-white text-center w-full p-8'>
          <div className='text-6xl font-bold mb-4'>Athena</div>
          <div className='relative flex items-center w-full'>
            <div className='flex-grow border-t border-white'></div>
            <span className='mx-4 flex-shrink text-lg font-medium text-white'>
              Study Companion
            </span>
            <div className='flex-grow border-t border-white'></div>
          </div>
        </div>
      </div>
      {/* Decorative elements */}
      <div className='absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl' />
      <div className='absolute bottom-20 right-20 w-40 h-40 bg-white/5 rounded-full blur-2xl' />
      <div className='absolute top-1/2 right-10 w-24 h-24 bg-white/10 rounded-full blur-lg' />
    </div>
  )
}
