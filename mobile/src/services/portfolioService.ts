import { AxiosResponse } from 'axios';
import apiService from './api';

class PortfolioService {
  async getPortfolio(): Promise<AxiosResponse> {
    return apiService.get('/api/portfolio/');
  }

  async getHoldings(): Promise<AxiosResponse> {
    return apiService.get('/api/portfolio/holdings/');
  }

  async getTransactions(params?: any): Promise<AxiosResponse> {
    return apiService.get('/api/portfolio/transactions/', { params });
  }

  async getPerformance(days: number): Promise<AxiosResponse> {
    return apiService.get('/api/portfolio/performance/', { params: { days } });
  }

  async getSectorAllocation(): Promise<AxiosResponse> {
    return apiService.get('/api/portfolio/sector-allocation/');
  }

  async getPerformanceChart(period: string): Promise<AxiosResponse> {
    return apiService.get('/api/portfolio/performance-chart/', { params: { period } });
  }

  async syncPortfolio(): Promise<AxiosResponse> {
    return apiService.post('/api/portfolio/sync/');
  }
}

export const portfolioService = new PortfolioService();
export default portfolioService;