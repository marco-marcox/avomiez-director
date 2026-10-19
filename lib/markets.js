// Shared by the API and Caption Studio. Language is intentionally independent.
const profiles = {
  Germany: {
    audience: 'Germany; use relevant German cultural references and search keywords.',
    regions: [{location:'Germany',country:'DE'}],
    searchScope: 'Germany · DE',
  },
  DACH: {
    audience: 'DACH (Germany, Austria and Switzerland); address all three countries. Avoid treating Germany-only events or slang as region-wide.',
    regions: [{location:'Germany',country:'DE'},{location:'Austria',country:'AT'},{location:'Switzerland',country:'CH'}],
    searchScope: 'DACH · Germany (DE), Austria (AT), Switzerland (CH)',
  },
  Global: {
    audience: 'Global / international audience; use broadly understandable references and internationally relevant keywords. Do not frame German or other country-specific signals as worldwide trends.',
    regions: [{}],
    searchScope: 'Global · worldwide queries, no explicit country filter; provider default region may apply',
  },
};

export function resolveMarket(value) {
  if (value === undefined || value === null || value === '') return 'Germany';
  if (typeof value !== 'string') throw new Error('Unsupported target market. Choose Germany, DACH or Global.');
  const market = Object.keys(profiles).find(key => key.toLowerCase() === value.trim().toLowerCase());
  if (!market) throw new Error('Unsupported target market. Choose Germany, DACH or Global.');
  return market;
}

export function marketProfile(value) {
  const market = resolveMarket(value);
  return {market, ...profiles[market]};
}

export function matchingTrend(trend, market) {
  return trend?.configured === true && trend.market === resolveMarket(market) ? trend : null;
}

export function trendCacheKey(market) {
  return `avomiez_trends:v2:${resolveMarket(market)}`;
}

export function readTrendCache(storage, market, now = Date.now()) {
  try {
    const cached = JSON.parse(storage.getItem(trendCacheKey(market)) || 'null');
    const age = now - cached?.savedAt;
    if (Number.isFinite(age) && age >= 0 && age < 24*60*60*1000) return matchingTrend(cached?.data, market);
  } catch {}
  return null;
}

export function writeTrendCache(storage, trend, now = Date.now()) {
  if (!trend?.market || !matchingTrend(trend, trend.market)) return;
  try { storage.setItem(trendCacheKey(trend.market), JSON.stringify({savedAt:now,data:trend})); } catch {}
}
