import { Injectable } from '@nestjs/common';
import { ModelName } from 'generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/prisma/prisma.service';
import { getPrismaDelegate } from '../utils/prisma-delegate.util';

interface DeleteParams {
  model: ModelName;
  where: Record<string, any>;
  optionals?: Record<string, any>;
}

@Injectable()
export class DeleteService {
  constructor(private readonly prismaService: PrismaService) {}

  async delete<T>(params: DeleteParams): Promise<T> {
    const { model, where, optionals } = params;
    const delegate = getPrismaDelegate<{
      delete: (args: Record<string, any>) => Promise<T>;
    }>(this.prismaService, model);

    return await delegate.delete({
      where,
      ...optionals,
    });
  }

  async deleteMany(params: DeleteParams): Promise<{ count: number }> {
    const { model, where, optionals } = params;
    const delegate = getPrismaDelegate<{
      deleteMany: (args: Record<string, any>) => Promise<{ count: number }>;
    }>(this.prismaService, model);

    return await delegate.deleteMany({
      where,
      ...optionals,
    });
  }
}
