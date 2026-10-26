import { headers } from 'next/headers';
import { auth, type Session } from '../auth/adapter';

/** The signed-in viewer for a server component, through the auth adapter (null in v1). */
export async function currentSession(): Promise<Session | null> {
  return auth.getSession(new Request('http://app.local/', { headers: await headers() }));
}
