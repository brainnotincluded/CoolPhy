import apiClient from './client';
import type {
  User,
  Achievement,
  Lecture,
  Task,
  Topic,
  Note,
  ChatMessage,
  Notification,
  SolutionAttempt,
  UserStats,
  LeaderboardEntry,
  LectureFilters,
  TaskFilters,
  TopicFilters,
  VideoAsset,
} from '@/types';

// Auth endpoints
export const authApi = {
  login: (email: string, password: string) => apiClient.login(email, password),
  register: (data: { email: string; name: string; password: string; subjects: string[] }) =>
    apiClient.register(data),
  logout: () => apiClient.logout(),
  getProfile: () => apiClient.get<User>('/profile'),
  updateProfile: (data: Partial<User>) => apiClient.put<User>('/profile', data),
  changePassword: (data: { current_password: string; new_password: string }) =>
    apiClient.post('/password/change', data),
  resetPassword: (email: string) => apiClient.post('/password/reset', { email }),
};

// Lecture endpoints
export const lectureApi = {
  list: (filters?: LectureFilters) => apiClient.get<Lecture[]>('/lectures', filters),
  get: (id: number) => apiClient.get<Lecture>(`/lectures/${id}`),
  complete: (id: number) => apiClient.post(`/lectures/${id}/complete`),
  getNotes: (id: number) => apiClient.get<Note[]>(`/lectures/${id}/notes`),
  createNote: (id: number, content: string) =>
    apiClient.post<Note>(`/lectures/${id}/notes`, { content }),
};

// Task endpoints
export const taskApi = {
  list: (filters?: TaskFilters) => apiClient.get<Task[]>('/tasks', filters),
  get: (id: number) => apiClient.get<Task>(`/tasks/${id}`),
  solve: (id: number, answer: string) =>
    apiClient.post<SolutionAttempt>(`/tasks/${id}/solve`, { answer }),
  getSolutions: (id: number) => apiClient.get<SolutionAttempt[]>(`/tasks/${id}/solutions`),
  updateStatus: (id: number, status: string) =>
    apiClient.put(`/tasks/${id}/status`, { status }),
};

// Topic endpoints
export const topicApi = {
  list: (filters?: TopicFilters) => apiClient.get<Topic[]>('/topics', filters),
  get: (id: number) => apiClient.get<Topic>(`/topics/${id}`),
  getTree: () => apiClient.get<Topic[]>('/topics/tree'),
};

// Professor Chat endpoints
export const chatApi = {
  send: (message: string) => apiClient.post<ChatMessage>('/professor-chat', { message }),
  sendWithContext: (message: string, contextType: string, contextId: number) =>
    apiClient.post<ChatMessage>('/professor-chat', {
      message,
      context_type: contextType,
      context_id: contextId,
    }),
  getHistory: () => apiClient.get<ChatMessage[]>('/professor-chat/history'),
  get: (id: number) => apiClient.get<ChatMessage>(`/professor-chat/${id}`),
};

// Notification endpoints
export const notificationApi = {
  list: () => apiClient.get<Notification[]>('/notifications'),
  markAsRead: (id: number) => apiClient.put(`/notifications/${id}/read`),
};

// Achievement endpoints
export const achievementApi = {
  // Backend returns an object: { achievements: Achievement[] (jsonb), points: number }
  list: () => apiClient.get<{ achievements?: Achievement[]; points?: number }>('/achievements'),
};

// History endpoints
export const historyApi = {
  tasks: () => apiClient.get<SolutionAttempt[]>('/history/tasks'),
  lectures: () => apiClient.get('/history/lectures'),
  profile: () => apiClient.get('/history/profile'),
};

// Stats endpoints
export const statsApi = {
  profile: () => apiClient.get<UserStats>('/profile/stats'),
  leaderboard: () => apiClient.get<LeaderboardEntry[]>('/leaderboard'),
};

// Admin endpoints
export const adminApi = {
  // Dashboard
  getDashboard: () => apiClient.get('/admin'),
  getLogs: () => apiClient.get('/admin/logs'),
  
  // Lectures
  listLectures: () => apiClient.get<Lecture[]>('/admin/lectures'),
  createLecture: (data: any) => apiClient.post<Lecture>('/admin/lectures', data),
  updateLecture: (id: number, data: any) => apiClient.put<Lecture>(`/admin/lectures/${id}`, data),
  deleteLecture: (id: number) => apiClient.delete(`/admin/lectures/${id}`),
  
  // Tasks
  listTasks: () => apiClient.get<Task[]>('/admin/tasks'),
  createTask: (data: any) => apiClient.post<Task>('/admin/tasks', data),
  updateTask: (id: number, data: any) => apiClient.put<Task>(`/admin/tasks/${id}`, data),
  deleteTask: (id: number) => apiClient.delete(`/admin/tasks/${id}`),
  
  // Topics
  listTopics: () => apiClient.get<Topic[]>('/admin/topics'),
  createTopic: (data: any) => apiClient.post<Topic>('/admin/topics', data),
  updateTopic: (id: number, data: any) => apiClient.put<Topic>(`/admin/topics/${id}`, data),
  deleteTopic: (id: number) => apiClient.delete(`/admin/topics/${id}`),
  
  // Users
  listUsers: () => apiClient.get<User[]>('/admin/users'),
  getUser: (id: number) => apiClient.get<User>(`/admin/users/${id}`),
  updateUser: (id: number, data: any) => apiClient.put<User>(`/admin/users/${id}`, data),
  deleteUser: (id: number) => apiClient.delete(`/admin/users/${id}`),
  
  // Videos
  uploadVideo: (file: File) => {
    const formData = new FormData();
    formData.append('video', file);
    return apiClient.upload<VideoAsset>('/admin/videos', formData);
  },
  
  // AI Settings
  getSettings: () => apiClient.get<any>('/admin/settings'),
  updateSettings: (data: {
    openrouter_api_key?: string;
    system_prompt?: string;
    primary_model?: string;
    fallback_model?: string;
  }) => apiClient.put<any>('/admin/settings', data),
};

// Solution endpoints
export const solutionApi = {
  list: () => apiClient.get<SolutionAttempt[]>('/solutions'),
  get: (id: number) => apiClient.get<SolutionAttempt>(`/solutions/${id}`),
  update: (id: number, data: any) => apiClient.put<SolutionAttempt>(`/solutions/${id}`, data),
  delete: (id: number) => apiClient.delete(`/solutions/${id}`),
};

