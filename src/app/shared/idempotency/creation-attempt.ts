export type CreationResource = 'seal-number' | 'letter-number';
export type CreationAttemptState =
  | 'new'
  | 'sending'
  | 'uncertain'
  | 'confirmed'
  | 'conflict';

export interface CreationAttempt<TPayload extends object> {
  readonly resource: CreationResource;
  readonly key: string;
  readonly payload: Readonly<TPayload>;
  readonly actorCi: number;
  state: CreationAttemptState;
}

export function createCreationAttempt<TPayload extends object>(
  resource: CreationResource,
  key: string,
  payload: TPayload,
  actorCi: number
): CreationAttempt<TPayload> {
  return {
    resource,
    key,
    payload: Object.freeze({ ...payload }),
    actorCi,
    state: 'new'
  };
}
