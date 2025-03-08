export interface User {
  name: string;
  gender: string;
  hasAgreed?: boolean;
}

export interface Room {
  id: string;
  users: Record<string, User>;
}