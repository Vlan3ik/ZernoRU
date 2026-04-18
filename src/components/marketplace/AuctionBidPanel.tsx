import { Button, Card, Flex, InputNumber, Space, Statistic, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useAppStore } from '../../store/appStore';

interface AuctionBid {
  userId: string;
  amount: number;
  createdAt: string;
}

interface AuctionLotState {
  highestBid: number;
  bids: AuctionBid[];
}

type AuctionState = Record<string, AuctionLotState>;

const STORAGE_KEY = 'zerno_marketplace_auction_v1';

function getAuctionState(): AuctionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AuctionState;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function setAuctionState(next: AuctionState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

interface Props {
  lotId: string;
  basePrice: number;
}

export function AuctionBidPanel({ lotId, basePrice }: Props) {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const [state, setState] = useState<AuctionLotState>({ highestBid: 0, bids: [] });
  const [bidAmount, setBidAmount] = useState<number>(basePrice);

  useEffect(() => {
    const all = getAuctionState();
    setState(all[lotId] ?? { highestBid: 0, bids: [] });
  }, [lotId]);

  const step = useMemo(() => Math.max(100, Math.round(basePrice * 0.005)), [basePrice]);
  const currentHighest = Math.max(basePrice, state.highestBid || 0);
  const minNextBid = currentHighest + step;
  const lastBid = state.bids[0];

  const submitBid = () => {
    if (!Number.isFinite(bidAmount) || bidAmount < minNextBid) {
      message.warning(`Минимальная следующая ставка: ${minNextBid.toLocaleString('ru-RU')} ₽`);
      return;
    }

    const bid: AuctionBid = { userId: currentUserId, amount: bidAmount, createdAt: new Date().toISOString() };
    const all = getAuctionState();
    const lotState = all[lotId] ?? { highestBid: 0, bids: [] };
    const nextState: AuctionLotState = { highestBid: bidAmount, bids: [bid, ...lotState.bids].slice(0, 8) };
    all[lotId] = nextState;
    setAuctionState(all);
    setState(nextState);
    setBidAmount(nextState.highestBid + step);
    message.success('Ставка принята');
  };

  return (
    <Card size="small" style={{ background: '#faf5ff', borderColor: '#dbc8ff' }}>
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Flex justify="space-between" align="center" gap={8}>
          <Typography.Text strong>Аукцион по лоту</Typography.Text>
          <Typography.Text type="secondary">Шаг {step.toLocaleString('ru-RU')} ₽</Typography.Text>
        </Flex>
        <Flex gap={18} wrap="wrap">
          <Statistic title="Текущая ставка" value={currentHighest} precision={0} suffix="₽/т" />
          <Statistic title="Ставок" value={state.bids.length} />
        </Flex>

        <Space.Compact style={{ width: '100%' }}>
          <InputNumber min={minNextBid} step={step} style={{ width: '100%' }} value={bidAmount} onChange={(v) => setBidAmount(Number(v ?? minNextBid))} />
          <Button type="primary" onClick={submitBid}>Сделать ставку</Button>
        </Space.Compact>

        <Typography.Text type="secondary">Мин. ставка: {minNextBid.toLocaleString('ru-RU')} ₽/т</Typography.Text>
        {lastBid && <Typography.Text type="secondary">Последняя активность: {dayjs(lastBid.createdAt).format('DD.MM.YYYY HH:mm')}</Typography.Text>}
      </Space>
    </Card>
  );
}
