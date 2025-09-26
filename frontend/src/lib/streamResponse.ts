import { IncomingMessage } from "http";

// Helper to read EventSource stream as text
export async function* readStreamAsText(stream: IncomingMessage): AsyncGenerator<string> {
  console.log("Reading stream as text...", [stream, typeof stream]);
  
  const nodeStream = stream as IncomingMessage;
  
  for await (const chunk of nodeStream) {
    if (chunk) {
      const text = chunk instanceof Buffer ? chunk.toString("utf-8") : chunk;
      yield text;
    }
    else {
      console.log("Received empty chunk");
    }
  }
  
}