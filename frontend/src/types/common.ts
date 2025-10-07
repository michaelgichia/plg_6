import { CoursePublic } from '@/client'

export type IState = {
  errors?: {
    name?: string[]
    description?: string[]
  }
  message?: string | null
  success: boolean | null
  course?: CoursePublic,
  courses?: CoursePublic[],
}

export type CamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<CamelCase<U>>}`
  : S;

export type KeysToCamelCase<T> = {
  [K in keyof T as CamelCase<string & K>]: T[K]
};


export type PathParams<Path extends string> =
  Path extends `${infer Before}[${infer Param}]${infer After}`
    ? { [K in Param]: string } & PathParams<Before> & PathParams<After>
    : {};