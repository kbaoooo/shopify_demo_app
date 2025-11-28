import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const adapter = new PrismaPg({ connectionString }) as unknown as PrismaPg;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  enableShutdownHooks(app: INestApplication) {
    process.once('beforeExit', () => {
      void this.$disconnect();
      void app.close();
    });
  }
}
