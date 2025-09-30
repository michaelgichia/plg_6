import React from 'react'
import { APIError } from '@/lib/result'
import { get } from '@/utils'

export default function ErrorBox({ error }: { error: APIError }) {
  console.log({ error })
  const parsedDetails = get(error, 'details.detail', null)
  return (
    <div role='alert' className='rounded-md border p-4 bg-red-50'>
      <strong className='block text-sm'>Error: {error.message}</strong>
      {error.status && <div className='text-xs'>Status: {error.status}</div>}
      {error.code && <div className='text-xs'>Code: {error.code}</div>}
      {error.details && (
        <pre className='text-xs mt-2 break-words'>
          {typeof error.details === 'string' ? error.details : parsedDetails ? parsedDetails : JSON.stringify(error.details, null, 2)}
        </pre>
      )}
    </div>
  )
}
