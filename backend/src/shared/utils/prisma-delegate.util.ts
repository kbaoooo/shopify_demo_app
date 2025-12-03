import { ModelName } from 'generated/prisma/internal/prismaNamespace';
import { PrismaService } from 'src/prisma/prisma.service';

type DelegateKey = Extract<keyof PrismaService, string>;

const toClientKey = (model: ModelName): DelegateKey =>
  (model.charAt(0).toLowerCase() + model.slice(1)) as DelegateKey;

export const getPrismaDelegate = <T extends Record<string, any>>(
  prismaService: PrismaService,
  model: ModelName,
): T => {
  const clientKey = toClientKey(model);
  const delegate = prismaService[clientKey];

  if (!delegate || typeof delegate !== 'object') {
    throw new Error(`Unable to resolve Prisma delegate for model "${model}".`);
  }

  return delegate as unknown as T;
};
