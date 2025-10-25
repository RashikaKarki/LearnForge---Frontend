
export interface Mission {
  id: number;
  title: string;
  description: string;
  progress?: number; // Optional progress for ongoing missions
  tags: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  picture: string;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
}
