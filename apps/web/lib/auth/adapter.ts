import type { PlanId } from '@dse/schema';
import { global } from '../../copy/strings';

// The auth seam (docs/specs/v2-seams.md). V1 ships the mock: no session, and sign-in only says so.
// V2 adds SupabaseAuthAdapter behind the same interface; the SignInSheet never calls a provider.

export type Session = { userId: string; email: string; plan: PlanId };

/** What a sign-in attempt tells the visitor: a notice for a Toast, or that a link was sent. */
export type SignInResult = { ok: true } | { ok: false; notice: string };

export interface AuthAdapter {
  getSession(request: Request): Promise<Session | null>;
  signInWithEmail(email: string): Promise<SignInResult>;
  signInWithGitHub(): Promise<SignInResult>;
  signOut(): Promise<void>;
}

const disabled: SignInResult = { ok: false, notice: global.toasts.signInDisabled };

export class MockAuthAdapter implements AuthAdapter {
  async getSession(): Promise<Session | null> {
    return null;
  }
  async signInWithEmail(): Promise<SignInResult> {
    return disabled;
  }
  async signInWithGitHub(): Promise<SignInResult> {
    return disabled;
  }
  async signOut(): Promise<void> {}
}

export const auth: AuthAdapter = new MockAuthAdapter();
