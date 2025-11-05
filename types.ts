
export interface Mission {
  id: string;
  title: string;
  short_description: string;
  description: string;
  level: string;
  topics_to_cover: string[];
  learning_goal: string;
  byte_size_checkpoints: string[];
  skills: string[];
  creator_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  progress?: number; // Optional progress for ongoing missions
  tags?: string[]; // Keep for backward compatibility
}

export interface SessionResponse {
  session_id: string;
  user_id: string;
  status: string;
  created_at: string;
}

export interface ChatMessage {
  from: 'user' | 'agent' | 'system';
  text: string;
  timestamp?: Date;
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

export interface UserEnrolledMission {
  mission_id: string;
  mission_title: string;
  mission_short_description: string;
  mission_skills: string[];
  progress: number;
  byte_size_checkpoints: string[];
  completed_checkpoints: string[];
  session_id: string | null;
  enrolled_at: string;
  last_accessed_at: string;
  completed: boolean;
  updated_at: string;
}
