import { apiPost } from './api';

export function newAttemptId(){
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function awardProgress(rewardKey, attemptId, units = 1){
  const data = await apiPost('/api/reward', { rewardKey, attemptId, units });
  return data.profile || null;
}
