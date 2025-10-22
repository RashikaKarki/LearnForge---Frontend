
export interface Mission {
  id: number;
  title: string;
  description: string;
  progress?: number; // Optional progress for ongoing missions
  tags: string[];
}
