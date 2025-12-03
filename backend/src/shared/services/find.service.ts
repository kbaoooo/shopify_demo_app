import { Injectable } from '@nestjs/common';
import { ModelName } from 'generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/prisma/prisma.service';
import { getPrismaDelegate } from '../utils/prisma-delegate.util';

interface FindParams {
  model: ModelName;
  where?: Record<string, any>;
  optionals?: Record<string, any>;
}

@Injectable()
export class FindService {
  constructor(private readonly prismaService: PrismaService) {}
  // allow find by multiple fields
  async findUniqueBy<T>(params: FindParams): Promise<T | null> {
    const { model, where, optionals } = params;
    const delegate = getPrismaDelegate<{
      findUnique: (args: Record<string, any>) => Promise<T | null>;
    }>(this.prismaService, model);
    return await delegate.findUnique({
      where,
      ...optionals,
    });
  }

  async findFirstBy<T>(params: FindParams): Promise<T | null> {
    const { model, where, optionals } = params;
    const delegate = getPrismaDelegate<{
      findFirst: (args: Record<string, any>) => Promise<T | null>;
    }>(this.prismaService, model);
    return await delegate.findFirst({
      where,
      ...optionals,
    });
  }

  async findManyBy<T>(params: FindParams): Promise<T[]> {
    const { model, where, optionals } = params;
    const delegate = getPrismaDelegate<{
      findMany: (args: Record<string, any>) => Promise<T[]>;
    }>(this.prismaService, model);
    return await delegate.findMany({
      where,
      ...optionals,
    });
  }

  async findAll<T>(params: FindParams): Promise<T[]> {
    const { model, optionals } = params;
    const delegate = getPrismaDelegate<{
      findMany: (args: Record<string, any>) => Promise<T[]>;
    }>(this.prismaService, model);
    return await delegate.findMany({
      ...optionals,
    });
  }
}
