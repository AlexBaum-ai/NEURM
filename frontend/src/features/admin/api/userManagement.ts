import { apiClient } from '@/lib/api';
import type {
  AdminUser,
  UserDetailInfo,
  UserActivity,
  UserContent,
  UserReport,
  UserFilters,
  UserListResponse,
  SuspendUserPayload,
  BanUserPayload,
  UpdateUserRolePayload,
  SendMessagePayload,
  ExportUsersPayload,
  AdminStats,
} from '../types';

// Get all users with filters and pagination
export const getUsers = async (
  filters: UserFilters = {},
  page: number = 1,
  limit: number = 50
): Promise<UserListResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
    ),
  });

  const response = await apiClient.get<UserListResponse>(`/admin/users?${params}`);
  return response;
};

// Get user detail by ID
export const getUserDetail = async (userId: string): Promise<UserDetailInfo> => {
  const response = await apiClient.get<UserDetailInfo>(`/admin/users/${userId}`);
  return response;
};

// Get user activity history
export const getUserActivity = async (
  userId: string,
  limit: number = 50
): Promise<UserActivity[]> => {
  const response = await apiClient.get<UserActivity[]>(
    `/admin/users/${userId}/activity?limit=${limit}`
  );
  return response;
};

// Get user content (articles, topics, replies, applications)
export const getUserContent = async (userId: string): Promise<UserContent> => {
  const response = await apiClient.get<UserContent>(`/admin/users/${userId}/content`);
  return response;
};

// Get reports against a user
export const getUserReports = async (userId: string): Promise<UserReport[]> => {
  const response = await apiClient.get<UserReport[]>(`/admin/users/${userId}/reports`);
  return response;
};

// Update user role
export const updateUserRole = async (payload: UpdateUserRolePayload): Promise<AdminUser> => {
  const response = await apiClient.patch<AdminUser>(
    `/admin/users/${payload.userId}/role`,
    { role: payload.role }
  );
  return response;
};

// Verify user email manually
export const verifyUserEmail = async (userId: string): Promise<void> => {
  await apiClient.post(`/admin/users/${userId}/verify-email`);
};

// Suspend user
export const suspendUser = async (payload: SuspendUserPayload): Promise<AdminUser> => {
  const response = await apiClient.post<AdminUser>(
    `/admin/users/${payload.userId}/suspend`,
    {
      reason: payload.reason,
      duration: payload.duration,
      notifyUser: payload.notifyUser,
    }
  );
  return response;
};

// Remove suspension
export const unsuspendUser = async (userId: string): Promise<AdminUser> => {
  const response = await apiClient.delete<AdminUser>(`/admin/users/${userId}/suspend`);
  return response;
};

// Ban user
export const banUser = async (payload: BanUserPayload): Promise<AdminUser> => {
  const response = await apiClient.post<AdminUser>(
    `/admin/users/${payload.userId}/ban`,
    {
      reason: payload.reason,
      notifyUser: payload.notifyUser,
    }
  );
  return response;
};

// Remove ban
export const unbanUser = async (userId: string): Promise<AdminUser> => {
  const response = await apiClient.delete<AdminUser>(`/admin/users/${userId}/ban`);
  return response;
};

// Delete user account
export const deleteUser = async (userId: string): Promise<void> => {
  await apiClient.delete(`/admin/users/${userId}`);
};

// Send message to user
export const sendMessageToUser = async (payload: SendMessagePayload): Promise<void> => {
  await apiClient.post(`/admin/users/${payload.userId}/message`, {
    subject: payload.subject,
    message: payload.message,
  });
};

// Export users
export const exportUsers = async (payload: ExportUsersPayload): Promise<Blob> => {
  const params = new URLSearchParams({
    format: payload.format,
    ...Object.fromEntries(
      Object.entries(payload.filters || {}).filter(([_, value]) => value !== undefined && value !== '')
    ),
  });

  if (payload.selectedUserIds && payload.selectedUserIds.length > 0) {
    payload.selectedUserIds.forEach(id => params.append('userIds[]', id));
  }

  const response = await apiClient.get<Blob>(`/admin/users/export?${params}`, {
    responseType: 'blob',
  });
  return response;
};

// Get admin stats
export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await apiClient.get<AdminStats>('/admin/stats');
  return response;
};
