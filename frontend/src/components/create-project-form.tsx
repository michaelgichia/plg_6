'use client'

import type React from 'react'

import {useState} from 'react'
import {useDropzone} from 'react-dropzone'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {CloudUpload} from 'lucide-react'

interface CreateProjectFormProps {
  onCancel?: () => void
  onCreateProject?: (data: {
    title: string
    description: string
    files: File[]
  }) => void
}

export function CreateProjectForm({
  onCancel,
  onCreateProject,
}: CreateProjectFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
    },
    maxSize: 25 * 1024 * 1024, // 25MB
    onDrop: (acceptedFiles) => {
      setFiles((prev) => [...prev, ...acceptedFiles])
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateProject?.({title, description, files})
  }

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='text-2xl font-semibold'>
          Create a new project
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <form onSubmit={handleSubmit} className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='title'>Project Title</Label>
            <Input
              id='title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 'History of Ancient Rome'"
              className='w-full'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='A brief summary of what this project is about.'
              className='min-h-[120px] resize-none'
            />
          </div>

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
              <CloudUpload className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
              <div className='space-y-2'>
                <p className='text-lg font-medium'>
                  {isDragActive
                    ? 'Drop files here'
                    : 'Drag and drop files here'}
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
            {files.length > 0 && (
              <div className='mt-3 space-y-1'>
                {files.map((file, index) => (
                  <p key={index} className='text-sm text-muted-foreground'>
                    {file.name} ({Math.round(file.size / 1024)}KB)
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className='flex gap-3 pt-4'>
            <Button
              type='button'
              variant='secondary'
              onClick={onCancel}
              className='flex-1'
            >
              Cancel
            </Button>
            <Button type='submit' className='flex-1' disabled={!title.trim()}>
              Create Project
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
