// public/api.js
const API_BASE_URL = 'https://totoapp.onrender.com/api';

// Helper function to make API calls with authorization
export async function apiCall(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('toto_token');
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      if (data.message === 'ACCOUNT_BLOCKED') {
        // Dispatch a custom event that the main script can listen for.
        document.dispatchEvent(new CustomEvent('account-blocked'));
      }
      const err = new Error(data.message || 'API Error');
      err.data = data;
      throw err;
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
