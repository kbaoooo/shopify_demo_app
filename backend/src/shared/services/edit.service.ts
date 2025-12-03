import { Injectable } from '@nestjs/common';
import { ModelName } from 'generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/prisma/prisma.service';
import { getPrismaDelegate } from '../utils/prisma-delegate.util';

interface EditParams {
  model: ModelName;
  where: Record<string, any>;
  create?: Record<string, any>;
  update: Record<string, any>;
  optionals?: Record<string, any>;
}

@Injectable()
export class EditService {
  constructor(private readonly prismaService: PrismaService) {}

  async upsert<T>(params: EditParams) {
    const { model, where, create, update, optionals } = params;
    const delegate = getPrismaDelegate<{
      upsert: (args: Record<string, any>) => Promise<T>;
    }>(this.prismaService, model);
    return await delegate.upsert({
      where,
      create,
      update,
      ...optionals,
    });
  }

  async update<T>(params: EditParams) {
    const { model, where, update, optionals } = params;
    const delegate = getPrismaDelegate<{
      update: (args: Record<string, any>) => Promise<T>;
    }>(this.prismaService, model);
    return await delegate.update({
      where,
      data: update,
      ...optionals,
    });
  }
}
