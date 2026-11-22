// Supabase calls do not throw on failure: they return { error }. Ignoring that return value hid failures for
// months (a period date that never saved, "deleted" accounts that were still there). Use these instead.

type Result = { error: { message: string } | null };

/** The write must succeed: throws (so the caller's catch tells the user) when it does not. */
export async function must(label: string, query: PromiseLike<Result>): Promise<void> {
  const { error } = await query;
  if (error) throw new Error(`${label}: ${error.message}`);
}

/** Best-effort write: failure is logged loudly and reported as false, never silently dropped. */
export async function logged(label: string, query: PromiseLike<Result>): Promise<boolean> {
  const { error } = await query;
  if (error) console.error(`${label} failed:`, error.message);
  return !error;
}
