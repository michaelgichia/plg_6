import {defineConfig} from '@hey-api/openapi-ts'

export default defineConfig({
  input: './openapi.json',
  output: {
    format: 'prettier',
    lint: 'eslint',
    path: './src/client',
  },
  plugins: [
    {
      name: '@hey-api/client-axios',
      runtimeConfigPath: '../runtime-config',
    },
    {
      name: "@hey-api/schemas",
      type: "json",
    },
    {
      name: '@hey-api/sdk',
      asClass: true,
      operationId: false,
      classNameBuilder: '{{name}}Service',
    },
  ],
})
