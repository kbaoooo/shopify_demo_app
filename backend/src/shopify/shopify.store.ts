export const shopTokens = new Map<string, string>();

export function saveShopToken(shop: string, token: string) {
  shopTokens.set(shop, token);
}

export function getShopToken(shop: string): string | undefined {
  return shopTokens.get(shop);
}
