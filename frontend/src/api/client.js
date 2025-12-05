import axios from "axios";

const defaultBase = (import.meta.env.VITE_API_BASE_URL || "/api/v1").trim();
const shopifyBase = (
  import.meta.env.VITE_SHOPIFY_API_BASE_URL || defaultBase
).trim();
const SHOP_DOMAIN_KEY = "shopDomain";

const normalize = (value) =>
  value.startsWith("http")
    ? value
    : value.startsWith("/")
    ? value
    : `/${value}`;

const isShopifyHost =
  typeof window !== "undefined" &&
  /\.myshopify\.com$/.test(window.location.hostname);

const baseURL = normalize(isShopifyHost ? shopifyBase : defaultBase);

const decodeHostParam = (value) => {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    const [host] = decoded.split("/");
    return host && host.endsWith(".myshopify.com") ? host : null;
  } catch (err) {
    console.warn("Unable to decode Shopify host", err);
    return null;
  }
};

const readStoredShopDomain = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SHOP_DOMAIN_KEY);
  } catch {
    return null;
  }
};

const persistShopDomain = (value) => {
  if (typeof window === "undefined" || !value) return;
  try {
    window.localStorage.setItem(SHOP_DOMAIN_KEY, value);
  } catch {
    /* ignore storage errors */
  }
};

const resolveShopDomain = () => {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const shopParam = url.searchParams.get("shop");
  if (shopParam) return shopParam;

  const hostParam = url.searchParams.get("host");
  if (hostParam) {
    const decoded = decodeHostParam(hostParam);
    if (decoded) return decoded;
  }

  return readStoredShopDomain();
};

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const shopDomain = resolveShopDomain();

  if (shopDomain) {
    config.headers["x-shop-domain"] = shopDomain;
    persistShopDomain(shopDomain);
  }

  return config;
});

export default api;
