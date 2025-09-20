import {TabsContent} from '@/components/ui/tabs'
import QuizComponent from '@/components/quiz'
import Flashcard from '@/components/flashcard';
import {getCourse} from '@/lib/courses'
import {getFlashcard} from "@/lib/flashcards";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const id = params.id

  const course = await getCourse(id)

  const flashcards = await getFlashcard(id)


  if (!course) {
    return (
      <div className='text-center text-red-500 py-12'>
        Course not found.
      </div>
    )
  }

  return (
    <>
      <TabsContent value='qa' className='p-6'>
        <div className='text-center text-slate-400 py-12'>
          Q/A content will be displayed here
        </div>
      </TabsContent>

      <TabsContent value='quiz' className='p-6'>
        <QuizComponent/>
      </TabsContent>

      <TabsContent value='flashcard' className='p-6'>
        <Flashcard/>
      </TabsContent>

      <TabsContent value='podcast' className='p-6'>
        <div className='text-center text-slate-400 py-12'>
          Podcast content will be displayed here
        </div>
      </TabsContent>
    </>
  )
}
