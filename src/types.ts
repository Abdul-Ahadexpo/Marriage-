export interface User {
  name: string;
  gender: string;
  kabulCount?: number;
  hasCompleted?: boolean;
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export interface Room {
  id: string;
  users: Record<string, User>;
  witnessCount: number;
  isCompleted?: boolean;
  messages?: Record<string, Message>;
}
