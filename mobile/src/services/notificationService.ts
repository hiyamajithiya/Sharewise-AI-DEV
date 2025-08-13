import { AxiosResponse } from 'axios';
import apiService from './api';

class NotificationService {
  async getNotifications(params?: any): Promise<AxiosResponse> {
    return apiService.get('/api/notifications/', { params });
  }

  async markAsRead(id: string): Promise<AxiosResponse> {
    return apiService.patch(`/api/notifications/${id}/`, { isRead: true });
  }

  async markAllAsRead(): Promise<AxiosResponse> {
    return apiService.post('/api/notifications/mark-all-read/');
  }

  async registerPushToken(token: string): Promise<AxiosResponse> {
    return apiService.post('/api/notifications/register-token/', { token });
  }

  async updateNotificationSettings(settings: any): Promise<AxiosResponse> {
    return apiService.patch('/api/users/notification-settings/', settings);
  }
}

export const notificationService = new NotificationService();
export default notificationService;