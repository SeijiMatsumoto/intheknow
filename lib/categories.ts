import {
  Zap,
  TrendingUp,
  Landmark,
  Gamepad2,
  Trophy,
  FlaskConical,
  Briefcase,
} from "lucide-react"

export const CATEGORIES = [
  { id: "ai-tech",  label: "AI & Tech",  icon: Zap,          color: "text-teal-400",   bg: "bg-teal-500/10",   border: "border-teal-500/30",   pill: "bg-teal-500/15 text-teal-400 border-teal-500/30" },
  { id: "finance",  label: "Finance",    icon: TrendingUp,    color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", pill: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { id: "politics", label: "Politics",   icon: Landmark,      color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30",   pill: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { id: "gaming",   label: "Gaming",     icon: Gamepad2,      color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/30", pill: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
  { id: "sports",   label: "Sports",     icon: Trophy,        color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", pill: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  { id: "science",  label: "Science",    icon: FlaskConical,  color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/30",   pill: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  { id: "business", label: "Business",   icon: Briefcase,     color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/30",  pill: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
] as const

export type CategoryId = (typeof CATEGORIES)[number]["id"]

export function getCategory(id: string | null | undefined) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[0]
}
