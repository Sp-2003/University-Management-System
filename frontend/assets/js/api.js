// Base API URL - set in browser console (or default)
const API_BASE = localStorage.getItem('API_BASE') || 'http://127.0.0.1:4000/api';

async function api(path, method='GET', body){
  const token = localStorage.getItem('token');
  const url = API_BASE + path;
  try {
    console.log('[api] ', method, url); // debug
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type':'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    // handle no-content
    if (res.status === 204) return null;
    const data = await res.json().catch(()=> ({}));
    if (!res.ok) {
      const msg = data?.error || data?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    // network error or JSON parse error
    console.error('[api error]', method, url, err);
    throw err;
  }
}
