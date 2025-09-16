import {defaultPlugins, defineConfig} from '@hey-api/openapi-ts'

export default defineConfig({
  input: './openapi.json',
  output: {
    format: 'prettier',
    lint: 'eslint',
    path: './src/client',
  },
  plugins: [
    ...defaultPlugins,
    'zod',
    {
      name: '@hey-api/client-axios',
      runtimeConfigPath: '../runtime-config',
      throwOnError: true,
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
      validator: true,
    },
  ],
})
