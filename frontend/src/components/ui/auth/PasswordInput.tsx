import React, {useState} from 'react'
import {Eye, EyeOff} from 'react-feather'

// Define the props for the PasswordInput component
interface PasswordInputProps {
  className?: string
  error?: string | null
}

const PasswordInput: React.FC<
  PasswordInputProps & React.InputHTMLAttributes<HTMLInputElement>
> = ({className, error, ...props}) => {
  // State to manage the visibility of the password
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <label
        htmlFor='password'
        className='block text-sm font-medium text-gray-700 mb-2'
      >
        Password
      </label>
      <input
        {...props}
        id='password'
        name='password'
        type={showPassword ? 'text' : 'password'}
        placeholder='••••••••••'
        required
        className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
          error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-zinc-300 focus:ring-cyan-500 focus:border-cyan-500'
        }`}
      />
      <button
        type='button'
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        className='absolute right-3 top-9 text-gray-500 hover:text-gray-700 p-1.5'
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? (
          <Eye height={20} width={20} className='text-cyan-500' />
        ) : (
          <EyeOff height={20} width={20} className='text-gray-500' />
        )}
        <span className='sr-only'>
          {showPassword ? 'Hide password' : 'Show password'}
        </span>
      </button>
      {error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
    </div>
  )
}

export default PasswordInput
