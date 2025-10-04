import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom styling for markdown elements
          h1: (props: any) => <h1 className="text-xl font-bold mb-3 text-card-foreground" {...props} />,
          h2: (props: any) => <h2 className="text-lg font-bold mb-2 text-card-foreground" {...props} />,
          h3: (props: any) => <h3 className="text-base font-bold mb-2 text-card-foreground" {...props} />,
          p: (props: any) => <p className="mb-2 text-card-foreground leading-relaxed" {...props} />,
          ul: (props: any) => <ul className="list-disc pl-4 mb-2 text-card-foreground" {...props} />,
          ol: (props: any) => <ol className="list-decimal pl-4 mb-2 text-card-foreground" {...props} />,
          li: (props: any) => <li className="mb-1 text-card-foreground" {...props} />,
          code: ({ inline, ...props }: any) => 
            inline 
              ? <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono text-muted-foreground" {...props} />
              : <code className="block bg-muted p-3 rounded text-sm font-mono text-muted-foreground mb-2 overflow-x-auto" {...props} />,
          pre: (props: any) => <pre className="bg-muted p-3 rounded mb-2 overflow-x-auto" {...props} />,
          blockquote: (props: any) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-2" {...props} />,
          strong: (props: any) => <strong className="font-bold text-card-foreground" {...props} />,
          em: (props: any) => <em className="italic text-card-foreground" {...props} />,
          table: (props: any) => <table className="w-full border-collapse border border-border mb-2" {...props} />,
          th: (props: any) => <th className="border border-border px-3 py-2 bg-muted text-card-foreground font-bold" {...props} />,
          td: (props: any) => <td className="border border-border px-3 py-2 text-card-foreground" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}