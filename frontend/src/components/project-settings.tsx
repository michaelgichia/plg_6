import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "react-feather"

export function ProjectSettings() {
  return (
    <Card className="w-full h-fit">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold">Course Settings</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Settings className="h-16 w-16 text-muted-foreground mb-6" />
        <p className="text-muted-foreground text-center">Select a course to see its settings.</p>
      </CardContent>
    </Card>
  )
}
