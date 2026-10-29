/// <reference types="vite/client" />

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request(path: string, method = 'GET', body?: object, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((data as any).message || 'Server error');
  }

  if (method !== 'GET' && token) {
    window.dispatchEvent(new Event('one-wish-data-changed'));
  }

  return data as any;
}

export async function apiRegister(username: string, email: string, password: string) {
  return request('/api/auth/register', 'POST', { username, email, password });
}

export async function apiLogin(usernameOrEmail: string, password: string) {
  return request('/api/auth/login', 'POST', { usernameOrEmail, password });
}

export async function apiGoogleLogin(credential: string, termsAccepted = false) {
  return request('/api/auth/google', 'POST', { credential, termsAccepted });
}

export async function apiAdminLogin(username: string, password: string) {
  return request('/api/admin/login', 'POST', { username, password });
}

export interface UserProfile {
  username: string;
  email: string;
  bio: string;
  languagePreference?: string;
  profilePicture: string | null;
}

function normalizeProfile(profile: UserProfile): UserProfile {
  const picture = profile.profilePicture;
  return {
    ...profile,
    profilePicture: picture?.startsWith('/')
      ? new URL(picture, new URL(API_BASE || '/', window.location.origin)).href
      : picture || null,
  };
}

export async function apiGetProfile(token: string): Promise<UserProfile> {
  return normalizeProfile(await request('/api/profile', 'GET', undefined, token));
}

export interface UserStatistics {
  stats: {
    totalWishes: number;
    wishesMet: number;
    inProgress: number;
    pending: number;
    completionRate: number;
    averageProgress: number;
    streakDays: number;
    totalRecords: number;
    meditationMinutes: number;
    meditationSessions: number;
    accountAge: number;
    joinDate: string;
    todayActivity: number;
    weekActivity: number;
    monthActivity: number;
    activeDaysMonth: number;
  };
  activity: Record<'week' | 'month' | 'year', Array<{ date: string; label: string; activity: number }>>;
  features: Array<{ name: string; usage: number; icon: string }>;
  updatedAt: string;
}

export async function apiGetStatistics(token: string): Promise<UserStatistics> {
  return request('/api/statistics', 'GET', undefined, token);
}

export interface AppNotification {
  _id: string;
  key: string;
  kind: string;
  title: string;
  message: string;
  href: string;
  readAt: string | null;
  createdAt: string;
}

export async function apiGetNotifications(token: string): Promise<{ items: AppNotification[]; unreadCount: number }> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  return request(`/api/notifications?timeZone=${encodeURIComponent(timeZone)}`, 'GET', undefined, token);
}

export async function apiReadNotification(token: string, id?: string) {
  return request(id ? `/api/notifications/${id}/read` : '/api/notifications/read-all', 'PUT', {}, token);
}

export async function apiDismissNotification(token: string, id: string) {
  return request(`/api/notifications/${id}`, 'DELETE', undefined, token);
}

export interface CalendarEventPayload {
  title: string;
  date: string;
  deadline: string;
  notes: string;
  category: string;
  priority: string;
  completed: boolean;
}

export interface StoredCalendarEvent extends CalendarEventPayload {
  _id: string;
  clientId?: string;
}

export async function apiGetEvents(token: string): Promise<StoredCalendarEvent[]> {
  return request('/api/events', 'GET', undefined, token);
}

export async function apiSaveEvent(token: string, payload: Partial<CalendarEventPayload> & { clientId?: string }, id?: string): Promise<StoredCalendarEvent> {
  return request(id ? `/api/events/${id}` : '/api/events', id ? 'PUT' : 'POST', payload, token);
}

export async function apiDeleteEvent(token: string, id: string) {
  return request(`/api/events/${id}`, 'DELETE', undefined, token);
}

export async function apiUpdateProfile(token: string, payload: { email?: string; bio?: string; languagePreference?: string }) {
  const profile = normalizeProfile(await request('/api/profile', 'PUT', payload, token));
  window.dispatchEvent(new CustomEvent('one-wish-profile-changed', { detail: profile }));
  return profile;
}

export async function apiUploadProfilePicture(token: string, file: File) {
  return new Promise<UserProfile>((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        const fileData = reader.result as string;
        const payload = {
          fileData,
          fileName: file.name
        };
        
        const data = await request('/api/profile/picture', 'POST', payload, token);
        const profile = normalizeProfile(data);
        window.dispatchEvent(new CustomEvent('one-wish-profile-changed', { detail: profile }));
        resolve(profile);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

export async function apiRemoveProfilePicture(token: string): Promise<UserProfile> {
  const profile = normalizeProfile(await request('/api/profile/picture', 'DELETE', undefined, token));
  window.dispatchEvent(new CustomEvent('one-wish-profile-changed', { detail: profile }));
  return profile;
}

export async function apiGetWishes(token: string) {
  return request('/api/wishes', 'GET', undefined, token);
}

export async function apiCreateWish(token: string, title: string, progress = 0) {
  return request('/api/wishes', 'POST', { title, progress }, token);
}

export async function apiUpdateWish(token: string, id: string, payload: { title?: string; progress?: number }) {
  return request(`/api/wishes/${id}`, 'PUT', payload, token);
}

export async function apiDeleteWish(token: string, id: string) {
  return request(`/api/wishes/${id}`, 'DELETE', undefined, token);
}

export async function apiTranslateText(token: string, payload: { q: string; source: string; target: string }) {
  return request('/api/translate/text', 'POST', payload, token);
}

export async function apiChatAssistant(token: string, messages: Array<{ role: 'user' | 'assistant'; text?: string; content?: string }>) {
  return request('/api/assistant/chat', 'POST', { messages: messages.map((message) => ({ role: message.role, content: message.content || message.text || '' })) }, token);
}
