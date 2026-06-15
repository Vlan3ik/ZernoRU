import { AuctionLotState } from '../services/auctionState';

export function getAuctionDisplayPrice(basePrice: number, state: AuctionLotState) {
  return Math.max(basePrice, state.highestBid || 0);
}
