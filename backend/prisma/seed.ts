import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  TimerPosition,
  TimerStatus,
  TimmerType,
} from '../generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({ connectionString }) as unknown as PrismaPg;
const prisma = new PrismaClient({ adapter });

const palette = [
  { bg: '#111827', text: '#F9FAFB' },
  { bg: '#0F172A', text: '#FDE68A' },
  { bg: '#BE123C', text: '#FEF2F2' },
  { bg: '#0369A1', text: '#F0F9FF' },
  { bg: '#065F46', text: '#ECFDF5' },
];

const positions: TimerPosition[] = [
  TimerPosition.TOP_BAR,
  TimerPosition.BOTTOM_BAR,
  TimerPosition.PRODUCT_PAGE,
  TimerPosition.CART_PAGE,
];

const hoursToMs = (hours: number) => hours * 60 * 60 * 1000;

const buildFixedWindow = (index: number) => {
  const start = new Date(Date.now() + hoursToMs(index * 4));
  const end = new Date(start.getTime() + hoursToMs(3));
  return { start, end };
};

const createTimerPayload = (shopId: number, index: number) => {
  const colors = palette[index % palette.length];
  const position = positions[index % positions.length];
  const isFixed = index % 2 === 0;
  const fixedWindow = buildFixedWindow(index);

  return {
    shopId,
    name: `Demo countdown #${index + 1}`,
    message: isFixed
      ? `Deal window #${index + 1} is closing soon.`
      : `Each shopper gets ${15 + index * 2} minutes only.`,
    type: isFixed ? TimmerType.FIXED : TimmerType.EVERGREEN,
    startAt: isFixed ? fixedWindow.start : null,
    endAt: isFixed ? fixedWindow.end : null,
    evergreenMinutes: isFixed ? null : 10 + index * 3,
    position,
    bgColor: colors.bg,
    textColor: colors.text,
    status: index % 3 === 0 ? TimerStatus.INACTIVE : TimerStatus.ACTIVE,
  };
};

async function main() {
  const rawShopId = process.env.SEED_SHOP_ID;
  const targetShopId = Number(rawShopId ?? '29');

  if (!Number.isInteger(targetShopId) || targetShopId <= 0) {
    throw new Error('SEED_SHOP_ID must be a positive integer');
  }

  await prisma.countdownTimer.deleteMany({ where: { shopId: targetShopId } });

  const timers = Array.from({ length: 16 }).map((_, index) =>
    createTimerPayload(targetShopId, index),
  );

  if (timers.length) {
    await prisma.countdownTimer.createMany({ data: timers });
  }

  console.info(
    `Seeded ${timers.length} countdown timers for shopId=${targetShopId}.`,
  );
}

main()
  .catch((error) => {
    console.error('Seeding failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
