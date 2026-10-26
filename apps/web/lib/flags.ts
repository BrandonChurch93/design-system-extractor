// `next.config` derives NEXT_PUBLIC_BILLING_ENABLED from BILLING_ENABLED at build time and Next inlines it,
// so the server and the browser read one value and can never disagree (docs/specs/v2-seams.md).
export function billingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BILLING_ENABLED === 'true';
}
