/** Future adapters are explicit boundaries, not credentials or live network clients.
 * A sync implementation must merge immutable attempt IDs, then recompute projections
 * and enforce an account-wide daily ceiling server-side before cross-device writes.
 */
export class SyncAdapter {
 async pushAttempts(_attempts){throw new Error('Cross-device sync is not enabled in V5.');}
 async pullSince(_cursor){throw new Error('Cross-device sync is not enabled in V5.');}
}
export class TutorAdapter {
 async reviewAlternative(_request){throw new Error('AI answer review is not enabled in V5.');}
}
