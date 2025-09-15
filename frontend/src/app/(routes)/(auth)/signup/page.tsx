'use client'

import {useState} from 'react'
import {useForm} from 'react-hook-form'
import {useRouter} from 'next/navigation'
import {zodResolver} from '@hookform/resolvers/zod'
import Link from 'next/link'

import {IAuthState} from '@/types/auth'
import {register} from '@/actions/auth'
import AuthBackground from '@/components/ui/auth/AuthBackground'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  PasswordFormInput,
} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {signUpSchema, SignUpSchema} from '@/types/form'

export default function SignUpPage() {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [state, setState] = useState<IAuthState>({
    message: null,
    success: false,
  })

  const form = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur',
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  })

  async function onSubmit(data: SignUpSchema) {
    try {
      setIsPending(true)
      const response = await register(data)
      setState(response)
      if (response?.success) {
        router.push('/login')
      }
    } catch {
      // Do nothing
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className='flex min-h-screen'>
      <div className='w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24'>
        <div className='max-w-md mx-auto w-full'>
          <h1 className='text-3xl font-bold mb-10'>Get Started Now</h1>

          {/* ✅ Form with action-based submit */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              {/* Full name */}
              <FormField
                control={form.control}
                name='full_name'
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder='Enter your name'
                        className='w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name='email'
                render={({field}) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type='email'
                        placeholder='Enter your email'
                        className='w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='password'
                render={({field}) => (
                  <PasswordFormInput label='Password' {...field} />
                )}
              />

              <FormField
                control={form.control}
                name='confirm_password'
                render={({field}) => (
                  <PasswordFormInput label='Confirm Password' {...field} />
                )}
              />

              {/* Terms */}
              <FormField
                control={form.control}
                name='terms'
                render={({field}) => (
                  <FormItem>
                    <div className='flex items-center'>
                      <FormControl>
                        <input
                          type='checkbox'
                          checked={field.value ?? false}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className='h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-zinc-300 rounded'
                        />
                      </FormControl>
                      <FormLabel className='ml-2 text-sm text-zinc-700'>
                        I agree to the terms & policy
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Server error */}
              {state && !state.success && (
                <div className='text-red-500 text-sm'>{state.message}</div>
              )}

              {/* Submit Button */}
              <button
                type='submit'
                className='w-full py-3 px-4 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors duration-200'
                disabled={isPending}
              >
                {isPending ? 'Creating account...' : 'Sign up'}
              </button>
            </form>
          </Form>

          <div className='my-6 text-center text-sm text-zinc-500'>
            <span>Or</span>
          </div>

          <div className='text-center'>
            <p className='text-sm text-zinc-600'>
              Have an account?{' '}
              <Link
                href='/login'
                className='text-cyan-600 hover:text-cyan-500 hover:underline font-medium'
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Background */}
      <AuthBackground />
    </div>
  )
}
