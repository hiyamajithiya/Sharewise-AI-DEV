import { AxiosResponse } from 'axios';
import apiService from './api';

class MarketService {
  async getWatchlist(): Promise<AxiosResponse> {
    return apiService.get('/api/market/watchlist/');
  }

  async addToWatchlist(symbol: string): Promise<AxiosResponse> {
    return apiService.post('/api/market/watchlist/', { symbol });
  }

  async removeFromWatchlist(symbol: string): Promise<AxiosResponse> {
    return apiService.delete(`/api/market/watchlist/${symbol}/`);
  }

  async getIndices(): Promise<AxiosResponse> {
    return apiService.get('/api/market/indices/');
  }

  async getMarketMovers(): Promise<AxiosResponse> {
    return apiService.get('/api/market/movers/');
  }

  async getNews(params?: any): Promise<AxiosResponse> {
    return apiService.get('/api/market/news/', { params });
  }

  async getSymbolData(symbol: string): Promise<AxiosResponse> {
    return apiService.get(`/api/market/symbol/${symbol}/`);
  }

  async getChartData(params: any): Promise<AxiosResponse> {
    return apiService.get('/api/market/chart/', { params });
  }

  async getMarketStatus(): Promise<AxiosResponse> {
    return apiService.get('/api/market/status/');
  }

  async searchSymbols(query: string): Promise<AxiosResponse> {
    return apiService.get('/api/market/search/', { params: { q: query } });
  }
}

export const marketService = new MarketService();
export default marketService;