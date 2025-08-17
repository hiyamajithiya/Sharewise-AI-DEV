import api from './api';

export interface EmailConfiguration {
  id?: number;
  provider: 'GMAIL' | 'OUTLOOK' | 'SENDGRID' | 'MAILGUN' | 'AWS_SES' | 'CUSTOM';
  auth_method: 'PASSWORD' | 'OAUTH2' | 'API_KEY';
  is_active: boolean;
  smtp_host: string;
  smtp_port: number;
  use_tls: boolean;
  use_ssl: boolean;
  email_address: string;
  email_password?: string;
  oauth2_client_id?: string;
  oauth2_client_secret?: string;
  oauth2_refresh_token?: string;
  api_key?: string;
  from_name: string;
  test_email?: string;
  has_password?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmailTestRequest {
  test_email: string;
  test_message?: string;
}

export interface EmailTestResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface SystemConfiguration {
  id?: number;
  site_name: string;
  site_url: string;
  enable_user_registration: boolean;
  require_email_verification: boolean;
  maintenance_mode: boolean;
  maintenance_message: string;
  created_at?: string;
  updated_at?: string;
}

class EmailConfigService {
  async getEmailConfiguration(): Promise<EmailConfiguration> {
    return await api.get<EmailConfiguration>('/system/email-configuration/');
  }

  async updateEmailConfiguration(config: Partial<EmailConfiguration>): Promise<EmailConfiguration> {
    const response = await api.put<{data: EmailConfiguration}>('/system/email-configuration/', config);
    return response.data;
  }

  async createEmailConfiguration(config: EmailConfiguration): Promise<EmailConfiguration> {
    const response = await api.post<{data: EmailConfiguration}>('/system/email-configuration/', config);
    return response.data;
  }

  async testEmailConfiguration(testData: EmailTestRequest): Promise<EmailTestResponse> {
    return await api.post<EmailTestResponse>('/system/test-email/', testData);
  }

  async getSystemConfiguration(): Promise<SystemConfiguration> {
    return await api.get<SystemConfiguration>('/system/system-configuration/');
  }

  async updateSystemConfiguration(config: Partial<SystemConfiguration>): Promise<SystemConfiguration> {
    const response = await api.put<{data: SystemConfiguration}>('/system/system-configuration/', config);
    return response.data;
  }

  // Email provider presets
  getProviderPresets(provider: EmailConfiguration['provider']) {
    switch (provider) {
      case 'GMAIL':
        return {
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
          use_tls: true,
          use_ssl: false,
        };
      case 'OUTLOOK':
        return {
          smtp_host: 'smtp-mail.outlook.com',
          smtp_port: 587,
          use_tls: true,
          use_ssl: false,
        };
      case 'SENDGRID':
        return {
          smtp_host: 'smtp.sendgrid.net',
          smtp_port: 587,
          use_tls: true,
          use_ssl: false,
        };
      case 'MAILGUN':
        return {
          smtp_host: 'smtp.mailgun.org',
          smtp_port: 587,
          use_tls: true,
          use_ssl: false,
        };
      case 'AWS_SES':
        return {
          smtp_host: 'email-smtp.us-east-1.amazonaws.com',
          smtp_port: 587,
          use_tls: true,
          use_ssl: false,
        };
      default:
        return {
          smtp_host: '',
          smtp_port: 587,
          use_tls: true,
          use_ssl: false,
        };
    }
  }
}

export const emailConfigService = new EmailConfigService();
export default emailConfigService;