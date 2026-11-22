import { AsyncLocalStorage } from 'async_hooks';
import { DEFAULT_TZ, isValidTimezone, setTimezoneProvider } from './timezone';

// Server only (uses Node's AsyncLocalStorage). Import this from the webhook and crons, never from client code.
const store = new AsyncLocalStorage<string>();
setTimezoneProvider(() => store.getStore());

/** Use this user's zone for the rest of the current request/loop iteration. */
export function useUserTimezone(tz: string | null | undefined): void {
  store.enterWith(tz && isValidTimezone(tz) ? tz : DEFAULT_TZ);
}
