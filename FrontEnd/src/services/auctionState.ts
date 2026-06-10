export interface AuctionBid {
  userId: string;
  amount: number;
  createdAt: string;
}

export interface AuctionLotState {
  highestBid: number;
  bids: AuctionBid[];
}

const auctionState: Record<string, AuctionLotState> = {};

export function getAuctionState(lotId: string): AuctionLotState {
  return auctionState[lotId] ?? { highestBid: 0, bids: [] };
}

export function setAuctionState(lotId: string, state: AuctionLotState): void {
  auctionState[lotId] = state;
}
