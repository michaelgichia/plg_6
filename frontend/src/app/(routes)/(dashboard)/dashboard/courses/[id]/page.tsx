import {TabsContent} from '@/components/ui/tabs'
import QuizComponent from '@/components/quiz'
import { getCourse } from '@/actions/courses'
import ErrorBox from '@/components/ui/ErrorBox'

export default async function Page(props: {params: Promise<{id: string}>}) {
  const params = await props.params
  const id = params.id

  const result = await getCourse(id)

  if (!result.ok) {
    return (<ErrorBox error={result.error} />)
  }
  const course = result.data

  return (
    <>
      <TabsContent value='qa' className='p-6'>
        <div className='text-center text-slate-400 py-12'>
          Q/A content will be displayed here
        </div>
      </TabsContent>

      <TabsContent value='quiz' className='p-6'>
        <QuizComponent course={course} />
      </TabsContent>

      <TabsContent value='flashcard' className='p-6'>
        <div className='text-center text-slate-400 py-12'>
          Flashcard content will be displayed here
        </div>
      </TabsContent>

      <TabsContent value='podcast' className='p-6'>
        <div className='text-center text-slate-400 py-12'>
          Podcast content will be displayed here
        </div>
      </TabsContent>
    </>
  )
}
