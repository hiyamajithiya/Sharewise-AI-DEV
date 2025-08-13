import { AxiosResponse } from 'axios';
import apiService from './api';

class TradingService {
  // Signals
  async getSignals(params?: {
    symbol?: string;
    signalType?: string;
    executed?: boolean;
    page?: number;
  }): Promise<AxiosResponse> {
    return apiService.get('/api/trading/signals/', { params });
  }

  async getSignal(id: string): Promise<AxiosResponse> {
    return apiService.get(`/api/trading/signals/${id}/`);
  }

  async executeSignal(id: string): Promise<AxiosResponse> {
    return apiService.post(`/api/trading/signals/${id}/execute/`);
  }

  async generateSignals(data: {
    symbols: string[];
    strategyId?: string;
  }): Promise<AxiosResponse> {
    return apiService.post('/api/trading/signals/generate/', data);
  }

  async batchExecuteSignals(signalIds: string[]): Promise<AxiosResponse> {
    return apiService.post('/api/trading/signals/batch_execute/', { signal_ids: signalIds });
  }

  // Orders
  async getOrders(params?: {
    status?: string;
    symbol?: string;
    page?: number;
  }): Promise<AxiosResponse> {
    return apiService.get('/api/trading/orders/', { params });
  }

  async getOrder(id: string): Promise<AxiosResponse> {
    return apiService.get(`/api/trading/orders/${id}/`);
  }

  async cancelOrder(id: string): Promise<AxiosResponse> {
    return apiService.post(`/api/trading/orders/${id}/cancel/`);
  }

  async modifyOrder(id: string, data: {
    quantity?: number;
    price?: number;
    triggerPrice?: number;
  }): Promise<AxiosResponse> {
    return apiService.patch(`/api/trading/orders/${id}/`, data);
  }

  // Positions
  async getPositions(): Promise<AxiosResponse> {
    return apiService.get('/api/brokers/positions/');
  }

  async closePosition(symbol: string, quantity?: number): Promise<AxiosResponse> {
    return apiService.post('/api/brokers/close-position/', { symbol, quantity });
  }

  // Dashboard and Analytics
  async getDashboard(): Promise<AxiosResponse> {
    return apiService.get('/api/trading/dashboard/');
  }

  async getPerformance(days: number = 30): Promise<AxiosResponse> {
    return apiService.get('/api/trading/performance/', { params: { days } });
  }

  async getSignalsAnalytics(days: number = 30): Promise<AxiosResponse> {
    return apiService.get('/api/trading/analytics/signals/', { params: { days } });
  }

  // Risk Management
  async performRiskCheck(data: {
    symbol: string;
    signalType: string;
    entryPrice: number;
    stopLoss?: number;
    targetPrice?: number;
    confidenceScore?: number;
    quantity?: number;
  }): Promise<AxiosResponse> {
    return apiService.post('/api/trading/risk-check/', data);
  }

  async getAutoTradeSettings(): Promise<AxiosResponse> {
    return apiService.get('/api/trading/settings/auto-trade/');
  }

  async updateAutoTradeSettings(settings: {
    autoExecuteEnabled: boolean;
    minConfidenceThreshold: number;
    maxDailyTrades: number;
    maxPositionSize: number;
    riskPerTrade: number;
    allowedSymbols: string[];
    excludedSymbols: string[];
  }): Promise<AxiosResponse> {
    return apiService.post('/api/trading/settings/auto-trade/', settings);
  }

  // Market Hours
  async getMarketHours(): Promise<AxiosResponse> {
    return apiService.get('/api/trading/market-hours/');
  }

  // Strategy Performance
  async getStrategyPerformance(strategyName?: string): Promise<AxiosResponse> {
    return apiService.get('/api/trading/strategy-performance/', {
      params: { strategy: strategyName }
    });
  }

  // Backtesting
  async runBacktest(data: {
    strategy: string;
    symbols: string[];
    startDate: string;
    endDate: string;
    parameters?: Record<string, any>;
  }): Promise<AxiosResponse> {
    return apiService.post('/api/trading/backtest/', data);
  }

  async getBacktestResults(backtestId: string): Promise<AxiosResponse> {
    return apiService.get(`/api/trading/backtest/${backtestId}/`);
  }
}

export const tradingService = new TradingService();
export default tradingService;