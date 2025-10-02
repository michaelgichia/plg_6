import fs from 'fs'
import path from 'path'

const clientDir = './src/client'

// Fix SDK to add streaming support
const sdkFile = path.join(clientDir, 'sdk.gen.ts')

if (fs.existsSync(sdkFile)) {
  let sdkContent = fs.readFileSync(sdkFile, 'utf-8')

  // Only add responseType if not already present
  if (!sdkContent.includes("responseType: 'stream'")) {
    sdkContent = sdkContent.replace(
      /(public static postApiV1ChatByCourseIdStream[\s\S]*?requestValidator: async \(data\) => \{[\s\S]*?\},)/,
      `$1
            responseType: 'stream',`
    )

    fs.writeFileSync(sdkFile, sdkContent)
  } else {
  }
}
