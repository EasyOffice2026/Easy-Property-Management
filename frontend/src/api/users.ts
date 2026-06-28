import { apiClient } from './client';
import { Role } from '../store';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  language?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface UpdateUserInput {
  name?: string;
  role?: Role;
  isActive?: boolean;
}

export async function listUsers(): Promise<User[]> {
  const { data } = await apiClient.get<{ success: boolean; data: User[] }>('/users');
  return data.data;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { data } = await apiClient.post<{ success: boolean; data: User }>('/users', input);
  return data.data;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  const { data } = await apiClient.put<{ success: boolean; data: User }>(`/users/${id}`, input);
  return data.data;
}
