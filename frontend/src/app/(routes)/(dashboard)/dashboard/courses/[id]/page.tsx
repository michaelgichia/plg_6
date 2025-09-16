import {TabsContent} from '@/components/ui/tabs'
import QuizComponent from '@/components/quiz'

// const QuizComponent = dynamic(() => import('@/components/quiz'), {
//   loading: () => <p>Loading...</p>,
//   ssr: false,
// })

export default async function Page(props: {params: Promise<{id: string}>}) {
  const params = await props.params
  const id = params.id

  console.log('Course ID:', id)

  return (
    <>
      <TabsContent value='qa' className='p-6'>
        <div className='text-center text-slate-400 py-12'>
          Q/A content will be displayed here
        </div>
      </TabsContent>

      <TabsContent value='quiz' className='p-6'>
        <QuizComponent />
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
