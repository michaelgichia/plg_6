import dynamic from 'next/dynamic'

import {getCourse} from '@/actions/courses'
import ErrorBox from '@/components/ui/ErrorBox'
import {Tabs, TabsContent, TabsList, StyledTabList} from '@/components/ui/tabs'
import PageLoader from '@/components/ui/page-loader'

const QuizComponent = dynamic(() => import('@/components/quiz'), {
  ssr: true,
  loading: () => <PageLoader />,
})

const QAComponent = dynamic(() => import('@/components/q-and-a'), {
  ssr: true,
  loading: () => <PageLoader />,
})

export default async function Page(props: {params: Promise<{id: string}>}) {
  const params = await props.params
  const id = params.id

  const result = await getCourse(id)

  if (!result.ok) {
    return <ErrorBox error={result.error} />
  }
  const course = result.data

  return (
    <>
      <Tabs
        defaultValue='quiz'
        className='w-full h-full border-r-[1px] border-slate-700 overflow-y-hidden'
      >
        <TabsList className='w-full justify-start bg-transparent border-b border-slate-700 rounded-none h-12 p-0'>
          <StyledTabList name='quiz' />
          <StyledTabList name='qa' />
          <StyledTabList name='flashcard' />
          <StyledTabList name='podcast' />
        </TabsList>
        <TabsContent value='quiz' className='p-6'>
          <QuizComponent course={course} />
        </TabsContent>

        <TabsContent value='qa' className='p-6'>
          <QAComponent course={course} />
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
      </Tabs>
    </>
  )
}
