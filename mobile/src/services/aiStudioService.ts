import { AxiosResponse } from 'axios';
import apiService from './api';

class AIStudioService {
  async getModels(params?: any): Promise<AxiosResponse> {
    return apiService.get('/api/ai-studio/models/', { params });
  }

  async getModel(id: string): Promise<AxiosResponse> {
    return apiService.get(`/api/ai-studio/models/${id}/`);
  }

  async createModel(data: any): Promise<AxiosResponse> {
    return apiService.post('/api/ai-studio/models/', data);
  }

  async updateModel(id: string, data: any): Promise<AxiosResponse> {
    return apiService.patch(`/api/ai-studio/models/${id}/`, data);
  }

  async deleteModel(id: string): Promise<AxiosResponse> {
    return apiService.delete(`/api/ai-studio/models/${id}/`);
  }

  async getTrainingJobs(params?: any): Promise<AxiosResponse> {
    return apiService.get('/api/ai-studio/training-jobs/', { params });
  }

  async startTraining(modelId: string, data: any): Promise<AxiosResponse> {
    return apiService.post(`/api/ai-studio/models/${modelId}/train/`, data);
  }

  async cancelTraining(jobId: string): Promise<AxiosResponse> {
    return apiService.post(`/api/ai-studio/training-jobs/${jobId}/cancel/`);
  }

  async getMarketplace(params?: any): Promise<AxiosResponse> {
    return apiService.get('/api/ai-studio/marketplace/', { params });
  }

  async publishModel(modelId: string, data: any): Promise<AxiosResponse> {
    return apiService.post(`/api/ai-studio/models/${modelId}/publish/`, data);
  }

  async subscribeToModel(listingId: string, data: any): Promise<AxiosResponse> {
    return apiService.post(`/api/ai-studio/marketplace/${listingId}/subscribe/`, data);
  }

  async getDashboard(): Promise<AxiosResponse> {
    return apiService.get('/api/ai-studio/analytics/dashboard/');
  }

  async generatePredictions(modelId: string, data: any): Promise<AxiosResponse> {
    return apiService.post(`/api/ai-studio/models/${modelId}/predict/`, data);
  }

  async getExplanations(modelId: string, params?: any): Promise<AxiosResponse> {
    return apiService.get(`/api/ai-studio/models/${modelId}/explain/`, { params });
  }
}

export const aiStudioService = new AIStudioService();
export default aiStudioService;