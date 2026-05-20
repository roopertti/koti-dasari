import { z } from 'zod';

const PORSSISAHKO_URL = 'https://api.porssisahko.net/v1/latest-prices.json';

const PorssisahkoResponseSchema = z.object({
  prices: z.array(
    z.object({
      price: z.number(),
      startDate: z.string(),
      endDate: z.string(),
    }),
  ),
});

export interface ElectricityPriceEntry {
  hourStart: string;
  priceCentsPerKwh: number;
}

export async function fetchElectricityPrices(): Promise<ElectricityPriceEntry[]> {
  const response = await fetch(PORSSISAHKO_URL);

  if (!response.ok) {
    throw new Error(`Porssisahko API error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const parsed = PorssisahkoResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Porssisahko response validation failed: ${parsed.error.message}`);
  }

  return parsed.data.prices.map((entry) => ({
    hourStart: new Date(entry.startDate).toISOString(),
    priceCentsPerKwh: entry.price,
  }));
}
