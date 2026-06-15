export interface AuctionBid {
  userId: string;
  amount: number;
  createdAt: string;
}

export interface AuctionLotState {
  highestBid: number;
  bids: AuctionBid[];
}

const STORAGE_KEY = 'zerno_marketplace_auction_v2';

function readAuctionState(): Record<string, AuctionLotState> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, AuctionLotState>) : {};
  } catch {
    return {};
  }
}

function writeAuctionState(state: Record<string, AuctionLotState>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // LocalStorage is best-effort only.
  }
}

const auctionState: Record<string, AuctionLotState> = readAuctionState();

export function getAuctionState(lotId: string): AuctionLotState {
  return auctionState[lotId] ?? { highestBid: 0, bids: [] };
}

export function setAuctionState(lotId: string, state: AuctionLotState): void {
  auctionState[lotId] = state;
  writeAuctionState(auctionState);
}
