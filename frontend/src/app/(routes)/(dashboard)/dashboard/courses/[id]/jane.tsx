import {Tabs, TabsList, TabsTrigger} from '@radix-ui/react-tabs'

const StyledTabList = ({name}: {name: string}) => (
  <TabsTrigger
    value={name}
    className='capitalize data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 data-[state=active]:text-black rounded-none px-6 py-3 text-zinc-700'
  >
    {name}
  </TabsTrigger>
)

export default async function CourseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='min-h-screen'>
      <Tabs defaultValue='quiz' className='w-full'>
        <TabsList className='w-full justify-start bg-transparent border-b border-slate-700 rounded-none h-12 p-0'>
          <StyledTabList name='quiz' />
          <StyledTabList name='qa' />
          <StyledTabList name='flashcard' />
          <StyledTabList name='podcast' />
        </TabsList>
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
      </Tabs>
    </div>
  )
}
