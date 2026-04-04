import {
  AlertTriangle,
  Coins,
  Cpu,
  FlaskConical,
  Flame,
  Gamepad2,
  Globe,
  HeartPulse,
  Landmark,
  Lightbulb,
  Megaphone,
  Rocket,
  Scale,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

const ICON_MAP: Record<string, typeof Flame> = {
  flame: Flame,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  rocket: Rocket,
  "alert-triangle": AlertTriangle,
  lightbulb: Lightbulb,
  shield: Shield,
  globe: Globe,
  cpu: Cpu,
  zap: Zap,
  megaphone: Megaphone,
  scale: Scale,
  landmark: Landmark,
  "heart-pulse": HeartPulse,
  "flask-conical": FlaskConical,
  "gamepad-2": Gamepad2,
  coins: Coins,
};

export function getDigestIcon(key: string | undefined | null) {
  if (!key) return null;
  return ICON_MAP[key] ?? null;
}

/** Strip leading emoji characters from a title (for backward compat with old data). */
export function stripEmoji(text: string): string {
  return text
    .replace(
      /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u200d\ufe0f]+\s*/u,
      "",
    )
    .trim();
}
