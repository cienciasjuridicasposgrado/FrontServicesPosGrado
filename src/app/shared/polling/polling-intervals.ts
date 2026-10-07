export type PollingResource =
  | 'sealNumbers'
  | 'letterNumbers'
  | 'items'
  | 'entries'
  | 'outputs'
  | 'dashboard'
  | 'users'
  | 'roles'
  | 'departamentos';

export const POLLING_INTERVALS = {
  sealNumbers: 3_000,
  letterNumbers: 3_000,
  items: 5_000,
  entries: 5_000,
  outputs: 5_000,
  dashboard: 10_000,
  users: 15_000,
  roles: 15_000,
  departamentos: 15_000
} as const satisfies Record<PollingResource, number>;
