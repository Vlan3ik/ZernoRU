import { BellOutlined, ClockCircleOutlined, FireOutlined, HistoryOutlined, TrophyOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Drawer, Flex, InputNumber, List, Space, Statistic, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { AuctionBid as AuctionBidModel, AuctionSummary } from '../../types/domain';
import { portalApi, type AuctionSummaryDto } from '../../services/portalApi';

interface Props {
  lotId: string;
  basePrice: number;
  sellerName: string;
  lotTitle: string;
  auction?: AuctionSummary | null;
}

function formatCountdown(targetIso: string) {
  const diff = Math.max(0, dayjs(targetIso).diff(dayjs(), 'second'));
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  return { diff, label: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` };
}

function formatAmount(value: number) {
  return value.toLocaleString('ru-RU');
}

function resolveStep(basePrice: number, auction?: AuctionSummary | null) {
  return auction?.minimumStep ?? Math.max(100, Math.round(basePrice * 0.005));
}

function normalizeSummary(summary?: AuctionSummary | AuctionSummaryDto | null): AuctionSummary | null {
  if (!summary) {
    return null;
  }

  return {
    ...summary,
    leadingUserId: summary.leadingUserId ?? undefined,
    leadingUserName: summary.leadingUserName ?? undefined,
    winningUserId: summary.winningUserId ?? undefined,
    winningUserName: summary.winningUserName ?? undefined,
    winningBidId: summary.winningBidId ?? undefined,
    lastBidAtUtc: summary.lastBidAtUtc ?? undefined,
  };
}

export function AuctionBidPanel({ lotId, basePrice, sellerName, lotTitle, auction }: Props) {
  const currentUserId = useAppStore((s) => s.currentUserId);
  const navigate = useNavigate();
  const [summary, setSummary] = useState<AuctionSummary | null>(auction ?? null);
  const [bids, setBids] = useState<AuctionBidModel[]>([]);
  const [bidAmount, setBidAmount] = useState<number>(auction?.currentHighestBid ?? basePrice);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [, forceTick] = useState(0);
  const [loaded, setLoaded] = useState(Boolean(auction));

  useEffect(() => {
    setSummary(normalizeSummary(auction));
    setBidAmount(auction?.currentHighestBid ?? basePrice);
    setLoaded(Boolean(auction));
  }, [auction, basePrice, lotId]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [auctionSummary, auctionBids] = await Promise.all([
          portalApi.getAuction(lotId),
          portalApi.getAuctionBids(lotId),
        ]);

        if (!mounted) return;
        setSummary(normalizeSummary(auctionSummary ?? auction));
        setBids(auctionBids);
        const normalized = normalizeSummary(auctionSummary ?? auction);
        setBidAmount((normalized?.currentHighestBid ?? basePrice) + resolveStep(basePrice, normalized));
      } catch {
        if (!mounted) return;
        setBids([]);
      } finally {
        if (mounted) {
          setLoaded(true);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [auction, basePrice, lotId]);

  useEffect(() => {
    const timer = window.setInterval(() => forceTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const activeSummary = summary ?? auction ?? null;
  const step = resolveStep(basePrice, activeSummary);
  const currentHighest = Math.max(basePrice, activeSummary?.currentHighestBid ?? 0);
  const minNextBid = currentHighest + step;
  const countdown = activeSummary ? formatCountdown(activeSummary.endsAtUtc) : { diff: 0, label: '00:00:00' };
  const ended = loaded && Boolean(activeSummary?.isEnded || countdown.diff <= 0 || activeSummary?.status?.toLowerCase() === 'ended');
  const winnerUserId = activeSummary?.winningUserId ?? activeSummary?.leadingUserId;
  const isWinner = ended && Boolean(winnerUserId && winnerUserId === currentUserId);
  const lastBid = bids[0];
  const previewBids = useMemo(() => bids.slice(0, 5), [bids]);

  const submitBid = async () => {
    if (ended) {
      message.info('Аукцион уже завершен.');
      return;
    }

    if (!Number.isFinite(bidAmount) || bidAmount < minNextBid) {
      message.warning(`Минимальная следующая ставка: ${formatAmount(minNextBid)} ₽/т`);
      return;
    }

    try {
      setLoading(true);
      const nextSummary = await portalApi.placeAuctionBid(lotId, bidAmount);
      const nextBids = await portalApi.getAuctionBids(lotId);
      setSummary(normalizeSummary(nextSummary));
      setBids(nextBids);
      setBidAmount(nextSummary.currentHighestBid + step);
      message.success('Ставка принята');
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Не удалось принять ставку';
      message.error(reason);
    } finally {
      setLoading(false);
    }
  };

  const timeLabel = ended
    ? 'Торги завершены'
    : countdown.label;

  return (
    <Card className="auction-panel" size="small">
      <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <Flex justify="space-between" align="center" gap={12} wrap="wrap">
          <Space size={10}>
            <Tag color={ended ? 'default' : 'purple'} icon={<FireOutlined />}>
              {ended ? 'Аукцион завершен' : 'Аукцион онлайн'}
            </Tag>
            <Typography.Text type="secondary">Шаг {formatAmount(step)} ₽/т</Typography.Text>
          </Space>
          <Typography.Text type={ended ? 'secondary' : 'danger'} strong>
            <ClockCircleOutlined /> {timeLabel}
          </Typography.Text>
        </Flex>

        <div className="auction-panel__hero">
          <div>
            <Typography.Title level={3} className="auction-panel__title">
              {lotTitle}
            </Typography.Title>
            <Typography.Paragraph className="auction-panel__subtitle">
              {ended
                ? isWinner
                  ? 'Вы выиграли этот аукцион. Свяжитесь с продавцом для совершения сделки.'
                  : `Аукцион завершен. Победитель: ${activeSummary?.winningUserName ?? activeSummary?.leadingUserName ?? sellerName}.`
                : 'Ставка обновляет серверное состояние, а таймер показывает оставшееся время до закрытия торгов.'}
            </Typography.Paragraph>
          </div>
          <Button icon={<TrophyOutlined />} onClick={() => setDrawerOpen(true)}>
            Просмотр ставок
          </Button>
        </div>

        {ended && isWinner && (
          <Alert
            type="success"
            showIcon
            message="Вы выиграли этот аукцион"
            description="Свяжитесь с продавцом для завершения сделки и согласуйте документы."
          />
        )}

        <div className="auction-panel__stats">
          <Statistic title="Текущая ставка" value={currentHighest} precision={0} suffix="₽/т" />
          <Statistic title="Ставок" value={activeSummary?.bidsCount ?? bids.length} />
          <Statistic title="Осталось" value={timeLabel} />
        </div>

        <Space.Compact style={{ width: '100%' }}>
          <InputNumber
            min={minNextBid}
            step={step}
            style={{ width: '100%' }}
            value={bidAmount}
            controls={false}
            disabled={ended}
            onChange={(value) => setBidAmount(Number(value ?? minNextBid))}
          />
          <Button type="primary" onClick={submitBid} loading={loading} disabled={ended}>
            Сделать ставку
          </Button>
        </Space.Compact>

        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
          <Typography.Text type="secondary">Мин. ставка: {formatAmount(minNextBid)} ₽/т</Typography.Text>
          <Typography.Text type="secondary">Последняя активность: {lastBid ? dayjs(lastBid.createdAtUtc).format('DD.MM.YYYY HH:mm') : 'нет ставок'}</Typography.Text>
        </Flex>

        <Card size="small" className="auction-panel__history-card">
          <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
            <Typography.Text strong>
              <HistoryOutlined /> Последние ставки
            </Typography.Text>
            <Typography.Link onClick={() => setDrawerOpen(true)}>Открыть весь журнал</Typography.Link>
          </Flex>
          <List
            size="small"
            dataSource={previewBids}
            locale={{ emptyText: 'Ставок пока нет' }}
            renderItem={(item) => (
              <List.Item>
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{item.userName}</Typography.Text>
                  <Typography.Text type="secondary">
                    {formatAmount(item.amount)} ₽/т · {dayjs(item.createdAtUtc).format('DD.MM.YYYY HH:mm')}
                  </Typography.Text>
                </Space>
                {item.isWinning && <Tag color="green">Лидирует</Tag>}
              </List.Item>
            )}
          />
        </Card>

        <Typography.Text type="secondary">
          <BellOutlined /> Ставки подтверждаются сервером и доступны из других сессий браузера.
        </Typography.Text>
        <Typography.Link className="auction-panel__info-link" onClick={() => navigate('/auction-info')}>
          Что такое аукцион
        </Typography.Link>
      </Space>

      <Drawer
        title={`Журнал ставок · ${lotTitle}`}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
      >
        <List
          dataSource={bids}
          locale={{ emptyText: 'История ставок пока пуста' }}
          renderItem={(item) => (
            <List.Item>
              <Space direction="vertical" size={0}>
                <Typography.Text strong>{item.userName}</Typography.Text>
                <Typography.Text type="secondary">
                  {formatAmount(item.amount)} ₽/т · {dayjs(item.createdAtUtc).format('DD.MM.YYYY HH:mm:ss')}
                </Typography.Text>
              </Space>
              {item.isWinning ? <Tag color="green">Победная</Tag> : null}
            </List.Item>
          )}
        />
      </Drawer>
    </Card>
  );
}
