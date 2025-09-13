interface GetOptions {
  obj: Record<string, never>
  path: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any
}

export const get = (
  obj: GetOptions['obj'],
  path: GetOptions['path'],
  defaultValue: GetOptions['defaultValue'] = undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const travel = (regexp: RegExp): any =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (res: any, key: string) =>
          res !== null && res !== undefined ? res[key] : res,
        obj,
      )
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/)
  return result === undefined || result === obj ? defaultValue : result
}