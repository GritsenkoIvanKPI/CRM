import {
  HomeIcon,
  TableIcon,
  BoardIcon,
  ChartIcon,
  SettingsIcon,
} from "@/components/icons";

export const NAV_ITEMS = [
  { href: "/", label: "Дашборд", icon: HomeIcon },
  { href: "/leads", label: "Ліди", icon: TableIcon },
  { href: "/leads/board", label: "Дошка", icon: BoardIcon },
  { href: "/analytics", label: "Аналітика", icon: ChartIcon },
  { href: "/settings", label: "Налаштування", icon: SettingsIcon },
] as const;
