import { Injectable } from '@nestjs/common';
import { ModelName } from 'generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/prisma/prisma.service';
import { getPrismaDelegate } from '../utils/prisma-delegate.util';

interface CreateParams {
  model: ModelName;
  data: Record<string, any>;
}

@Injectable()
export class CreateService {
  constructor(private readonly prismaService: PrismaService) {}

  async create<T>(params: CreateParams) {
    const { model, data } = params;
    const delegate = getPrismaDelegate<{
      create: (args: Record<string, any>) => Promise<T>;
    }>(this.prismaService, model);
    return await delegate.create({
      data,
    });
  }
}
