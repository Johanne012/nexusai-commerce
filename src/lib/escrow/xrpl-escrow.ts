/**
 * Real XRPL Escrow helpers
 * EscrowCreate / EscrowFinish / EscrowCancel params builders
 */

export function xrpToDrops(xrp: number): string {
  return String(Math.round(xrp * 1_000_000));
}

export function dropsToXrp(drops: string | number): number {
  return Number(drops) / 1_000_000;
}

export interface EscrowCreateParams {
  Account: string;
  Destination: string;
  Amount: string;
  FinishAfter?: number;
  CancelAfter?: number;
  Condition?: string;
  DestinationTag?: number;
  TransactionType: "EscrowCreate";
}

export interface EscrowFinishParams {
  Account: string;
  Owner: string;
  OfferSequence: number;
  Condition?: string;
  Fulfillment?: string;
  TransactionType: "EscrowFinish";
}

export interface EscrowCancelParams {
  Account: string;
  Owner: string;
  OfferSequence: number;
  TransactionType: "EscrowCancel";
}

export function finishAfterHours(hours: number): number {
  return Math.floor(Date.now() / 1000) + hours * 3600;
}

export function cancelAfterHours(hours: number): number {
  return Math.floor(Date.now() / 1000) + hours * 3600;
}

export function buildEscrowCreateParams(opts: {
  account: string;
  destination: string;
  amountXrp: number;
  finishAfterHours?: number;
  cancelAfterHours?: number;
  condition?: string;
  destinationTag?: number;
}): EscrowCreateParams {
  const params: EscrowCreateParams = {
    TransactionType: "EscrowCreate",
    Account: opts.account,
    Destination: opts.destination,
    Amount: xrpToDrops(opts.amountXrp),
  };
  if (opts.finishAfterHours != null) {
    params.FinishAfter = finishAfterHours(opts.finishAfterHours);
  }
  if (opts.cancelAfterHours != null) {
    params.CancelAfter = cancelAfterHours(opts.cancelAfterHours);
  }
  if (opts.condition) params.Condition = opts.condition;
  if (opts.destinationTag != null) params.DestinationTag = opts.destinationTag;
  return params;
}

export function buildEscrowFinishParams(opts: {
  account: string;
  owner: string;
  offerSequence: number;
  condition?: string;
  fulfillment?: string;
}): EscrowFinishParams {
  const params: EscrowFinishParams = {
    TransactionType: "EscrowFinish",
    Account: opts.account,
    Owner: opts.owner,
    OfferSequence: opts.offerSequence,
  };
  if (opts.condition) params.Condition = opts.condition;
  if (opts.fulfillment) params.Fulfillment = opts.fulfillment;
  return params;
}

export function buildEscrowCancelParams(opts: {
  account: string;
  owner: string;
  offerSequence: number;
}): EscrowCancelParams {
  return {
    TransactionType: "EscrowCancel",
    Account: opts.account,
    Owner: opts.owner,
    OfferSequence: opts.offerSequence,
  };
}

export function generateConditionPlaceholder(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return `A0${Math.abs(hash).toString(16).padStart(8, "0").toUpperCase()}`;
}
