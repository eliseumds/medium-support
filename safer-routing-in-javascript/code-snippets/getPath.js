export function getPath<T>(
  pathFn: (params: T) => string,
  params: T
): string {
  return pathFn(params);
}