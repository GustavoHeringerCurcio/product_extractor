import { prisma } from "./prisma";

const KEY = "SERPAPI_USAGE";
export const SERPAPI_FREE_LIMIT = 250;

export type SerpapiUsage = {
  month: string;
  used: number;
  limit: number;
  remaining: number;
};

function currentMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

function buildUsage(month: string, used: number): SerpapiUsage {
  return {
    month,
    used,
    limit: SERPAPI_FREE_LIMIT,
    remaining: Math.max(0, SERPAPI_FREE_LIMIT - used),
  };
}

async function getStored(): Promise<{ month: string; used: number }> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: KEY } });
    if (!row) return { month: currentMonth(), used: 0 };
    const parsed = JSON.parse(row.value) as { month: string; used: number };
    if (typeof parsed.month !== "string" || typeof parsed.used !== "number") {
      return { month: currentMonth(), used: 0 };
    }
    return parsed;
  } catch {
    return { month: currentMonth(), used: 0 };
  }
}

export async function getSerpapiUsage(): Promise<SerpapiUsage> {
  const stored = await getStored();
  const month = currentMonth();
  if (stored.month !== month) return buildUsage(month, 0);
  return buildUsage(month, stored.used);
}

export async function recordSerpapiUsage(): Promise<SerpapiUsage> {
  const stored = await getStored();
  const month = currentMonth();
  const used = stored.month === month ? stored.used + 1 : 1;
  try {
    await prisma.setting.upsert({
      where: { key: KEY },
      update: { value: JSON.stringify({ month, used }) },
      create: { key: KEY, value: JSON.stringify({ month, used }) },
    });
  } catch {
    // DB unavailable: keep counting in memory for this request only.
  }
  return buildUsage(month, used);
}
