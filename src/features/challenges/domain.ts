import type { Resource } from "@/features/records/domain";

export type Challenge = {
  id: string;
  title: string;
  description: string;
  resource: Resource;
  target: number;
  start: string;
  end: string;
  tag: string;
  icon: string;
  duration: string;
};