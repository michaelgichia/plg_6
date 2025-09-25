import PageLoader from '@/components/ui/page-loader'
import dynamic from 'next/dynamic'

const ProjectSettings = dynamic(() => import('@/components/project-settings'), {
  ssr: true,
  loading: () => <PageLoader />,
})

export default async function CourseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full">
      <div className="grid grid-cols-10 h-full">
        <div className="col-span-7">{children}</div>
        <div className="col-span-3">
          <ProjectSettings />
        </div>
      </div>
    </div>
  )
}
