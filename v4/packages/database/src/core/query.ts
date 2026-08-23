export function queryData<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error('A consulta não retornou dados.');
  return result.data;
}

export function queryList<T>(result: { data: T[] | null; error: { message: string } | null }): T[] {
  if (result.error) throw new Error(result.error.message);
  return Array.isArray(result.data) ? result.data : [];
}
