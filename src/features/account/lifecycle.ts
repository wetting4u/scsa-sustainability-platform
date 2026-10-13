export type AccountLifecycleMetadata = Record<string, unknown> & {
  account_frozen?: boolean;
  account_frozen_at?: string | null;
};

export function withAccountFrozenMetadata(
  currentMetadata: Record<string, unknown> | null | undefined,
  frozen: boolean,
  now = new Date(),
): AccountLifecycleMetadata {
  return {
    ...(currentMetadata ?? {}),
    account_frozen: frozen,
    account_frozen_at: frozen ? now.toISOString() : null,
  };
}
