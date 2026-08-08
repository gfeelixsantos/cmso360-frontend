const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  
  // Se houver um token guardado no localStorage ou cookie, adicione aqui:
  // const token = localStorage.getItem('token');
  // if (token) headers.set('Authorization', `Bearer ${token}`);
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = 'Failed API call';
    try {
      const err = await response.json();
      errorMsg = err.message || errorMsg;
    } catch (e) {
      errorMsg = await response.text();
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const campaignsClient = {
  async getCampaigns() {
    return fetchWithAuth('/customer-email-campaigns');
  },
  
  async getCampaign(id: string) {
    return fetchWithAuth(`/customer-email-campaigns/${id}`);
  },

  async createDraft(payload: any) {
    return fetchWithAuth('/customer-email-campaigns', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateCampaign(id: string, payload: any) {
    return fetchWithAuth(`/customer-email-campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async publishCampaign(id: string) {
    return fetchWithAuth(`/customer-email-campaigns/${id}/publish`, {
      method: 'POST'
    });
  },

  async cancelCampaign(id: string) {
    return fetchWithAuth(`/customer-email-campaigns/${id}/cancel`, {
      method: 'POST'
    });
  },

  async deleteCampaign(id: string) {
    return fetchWithAuth(`/customer-email-campaigns/${id}`, {
      method: 'DELETE'
    });
  },

  async getCampaignProgress(id: string) {
    return fetchWithAuth(`/customer-email-campaigns/${id}/progress`);
  },

  async getCompanies() {
    return fetchWithAuth(`/soc/empresas`);
  },

  async getAppUsers() {
    return fetchWithAuth(`/users`);
  }
};
