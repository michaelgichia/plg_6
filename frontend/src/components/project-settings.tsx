import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"

interface ProjectSettingsProps {
  selectedProject?: string | null
}

export function ProjectSettings({ selectedProject }: ProjectSettingsProps) {
  return (
    <Card className="w-full h-fit">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Project Settings</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Settings className="h-16 w-16 text-muted-foreground mb-6" />
        <p className="text-muted-foreground text-center">Select a project to see its settings.</p>
      </CardContent>
    </Card>
  )
}
