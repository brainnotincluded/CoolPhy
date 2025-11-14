// User types
export interface User {
  id: number;
  email: string;
  name: string;
  points: number;
  subjects: string[];
  role: 'user' | 'admin';
  achievements: Record<string, any>;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Lecture types
export interface VideoAsset {
  id: number;
  filename: string;
  path: string;
  url: string;
  mime_type: string;
  size: number;
  uploaded_by: number;
  created_at: string;
}

export interface Lecture {
  id: number;
  title: string;
  subject: 'math' | 'physics' | 'cs';
  content_latex: string;
  summary: string;
  tags: string[];
  level: 'basic' | 'advanced' | 'olympiad';
  video_url?: string;
  video_asset_id?: number;
  video_asset?: VideoAsset;
  author_id: number;
  view_count: number;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
}

// Task types
export interface Task {
  id: number;
  title: string;
  description_latex: string;
  subject: 'math' | 'physics' | 'cs';
  tags: string[];
  level: string;
  type: 'ege' | 'olympiad' | 'practice';
  solution_latex: string;
  hint_latex: string;
  points: number;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
}

// Solution Attempt types
export interface SolutionAttempt {
  id: number;
  user_id: number;
  task_id: number;
  answer: string;
  is_correct: boolean;
  score: number;
  feedback: string;
  time_spent: number;
  created_at: string;
}

// Topic types
export interface Topic {
  id: number;
  name: string;
  subject: 'math' | 'physics' | 'cs';
  description: string;
  parent_id?: number;
  order_index: number;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  children?: Topic[];
}

// Note types
export interface Note {
  id: number;
  user_id: number;
  lecture_id?: number;
  task_id?: number;
  content: string;
  created_at: string;
  updated_at: string;
}

// Chat Message types
export interface ChatMessage {
  id: number;
  user_id: number;
  user_message: string;
  ai_reply: string;
  response?: string; // Alias for ai_reply
  context_type?: string;
  context_id?: number;
  timestamp: string;
  created_at?: string;
}

// Notification types
export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  subjects: string[];
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Form types
export interface LectureFormData {
  title: string;
  subject: string;
  content_latex: string;
  summary: string;
  tags: string[];
  level: string;
  video_url?: string;
  video_asset_id?: number;
  status: string;
}

export interface TaskFormData {
  title: string;
  subject: string;
  description_latex: string;
  solution_latex: string;
  hint_latex: string;
  tags: string[];
  level: string;
  type: string;
  points: number;
  status: string;
}

export interface ProfileFormData {
  name: string;
  email: string;
  subjects: string[];
}

export interface PasswordChangeFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// Statistics types
export interface UserStats {
  total_tasks_solved: number;
  total_lectures_viewed: number;
  total_points: number;
  tasks_by_subject: Record<string, number>;
  lectures_by_subject: Record<string, number>;
  weekly_activity: Array<{ date: string; count: number }>;
  level: string;
  streak: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: User;
  points: number;
  tasks_solved: number;
}

// Filter types
export interface LectureFilters {
  subject?: string;
  level?: string;
  tags?: string[];
  search?: string;
  status?: string;
}

export interface TaskFilters {
  subject?: string;
  level?: string;
  type?: string;
  tags?: string[];
  search?: string;
  status?: string;
  solved?: boolean;
}

export interface TopicFilters {
  subject?: string;
  parent_id?: number;
  search?: string;
}

// Achievement types
export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  max_progress?: number;
  category: string;
}
