import { t } from '@home-dashboard/i18n';
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

const ICONS: Record<number, LucideIcon> = {
  0: Sun,
  1: CloudSun,
  2: CloudSun,
  3: Cloud,
  45: CloudFog,
  48: CloudFog,
  51: CloudDrizzle,
  53: CloudDrizzle,
  55: CloudRain,
  61: CloudDrizzle,
  63: CloudRain,
  65: CloudRain,
  71: CloudSnow,
  73: CloudSnow,
  75: Snowflake,
  77: CloudSnow,
  80: CloudDrizzle,
  81: CloudRain,
  82: CloudLightning,
  85: CloudSnow,
  86: Snowflake,
  95: CloudLightning,
  96: CloudLightning,
  99: CloudLightning,
};

export function wmoInfo(code: number): WmoInfo {
  const known = code in ICONS;
  return {
    Icon: known ? ICONS[code] : HelpCircle,
    label: known ? t(`weather.code.${code}`) : t('weather.code.unknown'),
  };
}
