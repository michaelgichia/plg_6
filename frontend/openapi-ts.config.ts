// import { defineConfig } from "@hey-api/openapi-ts"

// export default defineConfig({
//   input: "./openapi.json",
//   output: "./src/client",
//   plugins: [
//     "legacy/axios",
//     {
//       name: "@hey-api/sdk",
//       // NOTE: this doesn't allow tree-shaking
//       asClass: true,
//       operationId: true,
//       classNameBuilder: "{{name}}Service",
//     },
//     {
//       name: "@hey-api/schemas",
//       type: "json",
//     },
//   ],
// })

// import { defineConfig } from "@hey-api/openapi-ts"

// export default defineConfig({
//   input: "./openapi.json",
//   output: "./src/client",

//   plugins: [
//     "legacy/axios",
//     {
//       name: "@hey-api/sdk",
//       // NOTE: this doesn't allow tree-shaking
//       asClass: true,
//       operationId: true,
//       classNameBuilder: "{{name}}Service",
//       methodNameBuilder: (operation) => {
//         // @ts-expect-error
//         let name: string = operation.name
//         // @ts-expect-error
//         const service: string = operation.service

//         if (service && name.toLowerCase().startsWith(service.toLowerCase())) {
//           name = name.slice(service.length)
//         }

//         return name.charAt(0).toLowerCase() + name.slice(1)
//       },
//     },
//     {
//       name: "@hey-api/schemas",
//       type: "json",
//     },
//   ],
// })

// const config = {
//   input: "./openapi.json",
//   output: "./src/client",

//   plugins: [
//     '@hey-api/client-next',
//     {
//        name: "@hey-api/sdk",
//       asClass: true,
//       operationId: true,
//       classNameBuilder: "{{name}}Service"
//     }
//   ],
// };

// export default config;

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
      name: '@hey-api/client-next',
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
