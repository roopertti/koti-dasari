import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type AdminSession, adminLogin, adminLogout, getAdminSession } from '../api/admin.js';

const SESSION_KEY = ['admin', 'session'] as const;

export function useAdminSession() {
  return useQuery<AdminSession>({
    queryKey: SESSION_KEY,
    queryFn: ({ signal }) => getAdminSession(signal),
    retry: false,
    staleTime: 30_000,
  });
}

export function useAdminLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pin: string) => adminLogin(pin),
    onSuccess: (data) => {
      qc.setQueryData(SESSION_KEY, data);
    },
  });
}

export function useAdminLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => adminLogout(),
    onSuccess: (data) => {
      qc.setQueryData(SESSION_KEY, data);
    },
  });
}
