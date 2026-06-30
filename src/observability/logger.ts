export function logMetric(name: string, fields: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      namespace: "IiwakeColosseum",
      metric: name,
      timestamp: new Date().toISOString(),
      ...fields
    })
  );
}

export async function withTiming<T>(name: string, fields: Record<string, unknown>, work: () => Promise<T>): Promise<T> {
  const startedAt = Date.now();
  try {
    const result = await work();
    logMetric(name, {
      ...fields,
      status: "success",
      latencyMs: Date.now() - startedAt
    });
    return result;
  } catch (error) {
    logMetric(name, {
      ...fields,
      status: "failure",
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
