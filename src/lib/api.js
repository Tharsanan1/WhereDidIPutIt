async function req(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { 'content-type': 'application/json', ...(opts.headers || {}) }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  search: (q) => req(`/api/search?q=${encodeURIComponent(q)}`),
  listContainers: (kind) => req(`/api/containers${kind ? `?kind=${kind}` : ''}`),
  getContainer: (id) => req(`/api/containers/${id}`),
  createContainer: (body) => req('/api/containers', { method: 'POST', body: JSON.stringify(body) }),
  updateContainer: (id, body) => req(`/api/containers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteContainer: (id) => req(`/api/containers/${id}`, { method: 'DELETE' }),
  createItem: (body) => req('/api/items', { method: 'POST', body: JSON.stringify(body) }),
  updateItem: (id, body) => req(`/api/items/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteItem: (id) => req(`/api/items/${id}`, { method: 'DELETE' })
};
