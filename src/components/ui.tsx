import {
  ArrowUpRight,
  Droplets,
  Zap,
  Sprout,
  Leaf,
  LayoutDashboard,
  ClipboardList,
  Target,
  Flag,
  Users,
  Settings,
  Plus,
  ArrowRight,
  ShieldCheck,
  Award,
  Pencil,
  Trash2,
  X,
  Check,
  Menu,
} from "lucide-react";
export const icons = {
  drop: Droplets,
  bolt: Zap,
  sprout: Sprout,
  leaf: Leaf,
  dashboard: LayoutDashboard,
  records: ClipboardList,
  goals: Target,
  challenges: Flag,
  community: Users,
  settings: Settings,
  plus: Plus,
  arrow: ArrowRight,
  external: ArrowUpRight,
  shield: ShieldCheck,
  award: Award,
  edit: Pencil,
  delete: Trash2,
  close: X,
  check: Check,
  menu: Menu,
};
export function Icon({
  name,
  size = 20,
}: {
  name: keyof typeof icons;
  size?: number;
}) {
  const Component = icons[name];
  return <Component size={size} strokeWidth={1.7} aria-hidden="true" />;
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="empty">
      <Icon name="sprout" size={30} />
      <p>{children}</p>
    </div>
  );
}
