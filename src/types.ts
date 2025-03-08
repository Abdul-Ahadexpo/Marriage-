export interface User {
  name: string;
  gender: string;
  kabulCount?: number;
  hasCompleted?: boolean;
}

export interface Room {
  id: string;
  users: Record<string, User>;
  witnessCount: number;
  isCompleted?: boolean;
}