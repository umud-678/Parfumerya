export type DeliveryType = 'express' | 'standard';

export const DELIVERY_FEES: Record<DeliveryType, number> = {
  express: 5,
  standard: 2,
};

export function getDeliveryFee(type: DeliveryType): number {
  return DELIVERY_FEES[type];
}
