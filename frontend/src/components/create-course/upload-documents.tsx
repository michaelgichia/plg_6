import {Button} from '@/components/ui/button'
import {Label} from '@/components/ui/label'

import {Cloud} from 'react-feather'
import {useDropzone} from 'react-dropzone'

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    '.docx',
  ],
}

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

export default function UploadDocuments() {
  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    onDrop: (acceptedFiles) => {
      console.log({acceptedFiles})
    },
  })

  return (
    <div className='space-y-2'>
      <Label>Upload Documents</Label>
      <div
        {...getRootProps()}
        className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }
              `}
      >
        <input {...getInputProps()} />
        <Cloud className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
        <div className='space-y-2'>
          <p className='text-lg font-medium'>
            {isDragActive ? 'Drop files here' : 'Drag and drop files here'}
          </p>
          <p className='text-sm text-muted-foreground'>
            PDFs, DOCs (max. 25MB)
          </p>
          <div className='flex items-center justify-center gap-2 my-3'>
            <div className='h-px bg-border flex-1' />
            <span className='text-sm text-muted-foreground'>or</span>
            <div className='h-px bg-border flex-1' />
          </div>
          <Button type='button' variant='secondary' size='sm'>
            Browse Files
          </Button>
        </div>
      </div>
      {/* {files.length > 0 && (
              <div className="mt-3 space-y-1">
                {files.map((file, index) => (
                  <p key={index} className="text-sm text-muted-foreground">
                    {file.name} ({Math.round(file.size / 1024)}KB)
                  </p>
                ))}
              </div>
            )} */}
    </div>
  )
}
