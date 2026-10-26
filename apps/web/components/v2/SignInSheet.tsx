'use client';
import { useState } from 'react';
import { global, v2 } from '../../copy/strings';
import { auth, type SignInResult } from '../../lib/auth/adapter';
import { Button } from '../Button';
import { Input } from '../Input';
import { Sheet } from '../Sheet';
import { useToast } from '../Toast';
import styles from './v2.module.css';

/** Email link or GitHub, both through the auth adapter; v1's mock answers with a Toast. Flagged. */
export function SignInSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [email, setEmail] = useState('');
  function answer(r: SignInResult) {
    if (!r.ok) toast.show(r.notice);
  }
  return (
    <Sheet open={open} onClose={onClose} label={v2.signIn.title} handleLabel={global.icons.close}>
      <SignInForm email={email} onEmail={setEmail} onEmailSubmit={async () => answer(await auth.signInWithEmail(email))} onGitHub={async () => answer(await auth.signInWithGitHub())} />
    </Sheet>
  );
}

/** The sheet's content, also shown flat in the catalog. */
export function SignInForm({ email, onEmail, onEmailSubmit, onGitHub }: { email: string; onEmail: (v: string) => void; onEmailSubmit: () => void; onGitHub: () => void }) {
  return (
    <div className={styles.signIn} data-testid="v2-surface">
      <h2 className={styles.signInTitle}>{v2.signIn.title}</h2>
      <form
        className={styles.signInForm}
        onSubmit={(e) => {
          e.preventDefault();
          onEmailSubmit();
        }}
      >
        <Input label={v2.signIn.email} type="email" autoComplete="email" required value={email} onChange={(e) => onEmail(e.target.value)} />
        <Button variant="primary" type="submit">
          {v2.signIn.send}
        </Button>
      </form>
      <Button variant="ghost" onClick={onGitHub}>
        {v2.signIn.github}
      </Button>
    </div>
  );
}

/** The TopNav entry when the flag is on and there is no session. */
export function SignInButton() {
  const [open, setOpen] = useState(false);
  return (
    <span data-testid="v2-surface" className={styles.navItem}>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
        {v2.signIn.title}
      </Button>
      <SignInSheet open={open} onClose={() => setOpen(false)} />
    </span>
  );
}
