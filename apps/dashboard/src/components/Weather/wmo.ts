import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  HelpCircle,
  type LucideIcon,
  Snowflake,
  Sun,
} from 'lucide-react';

export interface WmoInfo {
  label: string;
  Icon: LucideIcon;
}

const MAP: Record<number, WmoInfo> = {
  0: { label: 'Clear', Icon: Sun },
  1: { label: 'Mainly clear', Icon: CloudSun },
  2: { label: 'Partly cloudy', Icon: CloudSun },
  3: { label: 'Overcast', Icon: Cloud },
  45: { label: 'Fog', Icon: CloudFog },
  48: { label: 'Rime fog', Icon: CloudFog },
  51: { label: 'Light drizzle', Icon: CloudDrizzle },
  53: { label: 'Drizzle', Icon: CloudDrizzle },
  55: { label: 'Dense drizzle', Icon: CloudRain },
  61: { label: 'Light rain', Icon: CloudDrizzle },
  63: { label: 'Rain', Icon: CloudRain },
  65: { label: 'Heavy rain', Icon: CloudRain },
  71: { label: 'Light snow', Icon: CloudSnow },
  73: { label: 'Snow', Icon: CloudSnow },
  75: { label: 'Heavy snow', Icon: Snowflake },
  77: { label: 'Snow grains', Icon: CloudSnow },
  80: { label: 'Rain showers', Icon: CloudDrizzle },
  81: { label: 'Rain showers', Icon: CloudRain },
  82: { label: 'Violent showers', Icon: CloudLightning },
  85: { label: 'Snow showers', Icon: CloudSnow },
  86: { label: 'Heavy snow showers', Icon: Snowflake },
  95: { label: 'Thunderstorm', Icon: CloudLightning },
  96: { label: 'Thunderstorm · hail', Icon: CloudLightning },
  99: { label: 'Thunderstorm · hail', Icon: CloudLightning },
};

export function wmoInfo(code: number): WmoInfo {
  return MAP[code] ?? { label: 'Unknown', Icon: HelpCircle };
}
