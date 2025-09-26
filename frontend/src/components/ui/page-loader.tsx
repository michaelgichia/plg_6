"use client"

export default function PageLoader() {
  return (
    <div className="flex h-dvh w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <p className="text-sm text-muted-foreground">loading...</p>
      </div>
    </div>
  )
}
