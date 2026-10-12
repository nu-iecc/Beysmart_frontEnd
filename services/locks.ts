import apiClient from '@/utils/api';
import type { AxiosResponse } from 'axios';

export interface AccessibleLock {
  id: string;
  name: string;
  device_type: string;
  role: 'owner' | 'guest' | null;
  is_locked: boolean | null;
  ble_device_id: string | null;
  home: string | number;
  room: string | number;
}

export const lockStatus = (lock: AccessibleLock) =>
  lock.is_locked === true ? 'Locked' : lock.is_locked === false ? 'Unlocked' : 'Status unknown';

export async function getAccessibleLocks(): Promise<AccessibleLock[]> {
  let next: string | null = 'home/devices/';
  const locks: AccessibleLock[] = [];
  while (next) {
    const response: AxiosResponse<AccessibleLock[] | { results: AccessibleLock[]; next: string | null }> = await apiClient.get(next);
    const data: AccessibleLock[] | { results: AccessibleLock[]; next: string | null } = response.data;
    const devices: AccessibleLock[] = Array.isArray(data) ? data : data.results;
    if (devices.some(device => device.device_type === 'bey_lock' && device.role === undefined)) {
      throw new Error('The backend returned locks without access roles. Its owner/guest API update needs to be deployed.');
    }
    locks.push(...devices.filter(device => device.device_type === 'bey_lock' &&
      (device.role === 'owner' || device.role === 'guest')));
    next = Array.isArray(data) ? null : data.next;
  }
  return locks;
}

export async function getAccessibleLock(id: string): Promise<AccessibleLock> {
  const { data } = await apiClient.get(`home/devices/${encodeURIComponent(id)}/`);
  if (data.device_type !== 'bey_lock' || !['owner', 'guest'].includes(data.role)) {
    throw new Error('You do not have access to this lock.');
  }
  return data;
}
