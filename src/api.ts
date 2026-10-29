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

export async function apiAdminLogin(username: string, password: string) {
  return request('/api/admin/login', 'POST', { username, password });
}

export async function apiGetProfile(token: string) {
  return request('/api/profile', 'GET', undefined, token);
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

export async function apiUpdateProfile(token: string, payload: { email?: string; bio?: string; languagePreference?: string }) {
  return request('/api/profile', 'PUT', payload, token);
}

export async function apiUploadProfilePicture(token: string, file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        const fileData = reader.result as string;
        const payload = {
          fileData,
          fileName: file.name
        };
        
        const data = await request('/api/profile/picture', 'POST', payload, token);
        resolve(data);
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
