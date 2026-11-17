import { BASE_URL } from '@/constants/api';
import apiClient from '@/utils/api';
import type { AxiosResponse } from 'axios';

type RoleFields = { role?: string | null; access_role?: string | null; is_owner?: boolean };

/** An explicit server role takes precedence over legacy ownership hints. */
export function deviceRole(device: RoleFields): 'owner' | 'guest' | undefined {
  if (device.role !== undefined) {
    return device.role === 'owner' || device.role === 'guest' ? device.role : undefined;
  }
  if (device.access_role !== undefined) {
    return device.access_role === 'owner' || device.access_role === 'guest' ? device.access_role : undefined;
  }
  return device.is_owner === true ? 'owner' : undefined;
}

/** apiClient returns the response unchanged, so follow DRF's next links ourselves. */
export async function getAllPages<T>(endpoint: string, optionalMetadata = false): Promise<T[]> {
  const base = new URL(BASE_URL);
  let next: string | null = new URL(endpoint, base).toString();
  const visited = new Set<string>();
  const items: T[] = [];

  while (next) {
    const url: URL = new URL(next);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname) || visited.has(url.toString())) {
      throw new Error('Invalid pagination link');
    }
    visited.add(url.toString());
    const response: AxiosResponse<T[] | { results: T[]; next: string | null }> = await apiClient.get<T[] | { results: T[]; next: string | null }>(url.toString(), optionalMetadata ? {
      // The shared client treats rejected 403s as expired sessions. A guest may
      // legitimately lack access to homes or rooms without losing their session.
      validateStatus: status => (status >= 200 && status < 300) || status === 403,
    } : undefined);
    if (response.status === 403) throw new Error('Metadata access denied');
    const { data } = response;
    if (Array.isArray(data)) {
      items.push(...data);
      next = null;
    } else if (data && Array.isArray(data.results) && (data.next == null || typeof data.next === 'string')) {
      items.push(...data.results);
      next = data.next ? new URL(data.next, url).toString() : null;
    } else {
      throw new Error('Invalid paginated response');
    }
  }
  return items;
}

/** Preserve every device type for existing owner screens, deduplicating by device ID. */
export async function getAccessibleDevices<T extends { id: string | number }>(): Promise<T[]> {
  const devices = await getAllPages<T>('home/devices/');
  const unique = new Map<string, T>();
  for (const device of devices) {
    if (!unique.has(String(device.id))) unique.set(String(device.id), device);
  }
  return Array.from(unique.values());
}