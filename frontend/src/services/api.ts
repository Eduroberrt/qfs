// API configuration and services for Django backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(username: string, password: string) {
    const response = await this.request('/token/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (response.access) {
      this.token = response.access;
      localStorage.setItem('token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
    }
    
    return response;
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
  }

  // API Status
  async getStatus() {
    return this.request('/status/');
  }

  // Accounts
  async getAccounts() {
    return this.request('/accounts/');
  }

  async createAccount(account: any) {
    return this.request('/accounts/', {
      method: 'POST',
      body: JSON.stringify(account),
    });
  }

  async updateAccount(id: number, account: any) {
    return this.request(`/accounts/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(account),
    });
  }

  async deleteAccount(id: number) {
    return this.request(`/accounts/${id}/`, {
      method: 'DELETE',
    });
  }

  // Transactions
  async getTransactions() {
    return this.request('/transactions/');
  }

  async createTransaction(transaction: any) {
    return this.request('/transactions/', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async getTransaction(id: number) {
    return this.request(`/transactions/${id}/`);
  }

  // Journal Entries
  async getJournalEntries() {
    return this.request('/journal-entries/');
  }

  async createJournalEntry(entry: any) {
    return this.request('/journal-entries/', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }
}

export const apiService = new ApiService();
export default apiService;