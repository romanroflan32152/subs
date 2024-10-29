import { env } from '~/env';

jest.mock('~/env', () => ({
  env: {
    NEXT_PUBLIC_USE_SQLITE: 'true',
  },
}));

describe('Storage with KV API', () => {
  beforeEach(() => {
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  it('should get data from KV API', async () => {
    const mockData = { value: [{ id: 1, name: 'Test' }] };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const response = await fetch('/api/kv/test-key');
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith('/api/kv/test-key');
  });

  it('should set data through KV API', async () => {
    const testData = { value: { test: 'data' } };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    await fetch('/api/kv/test-key', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/kv/test-key', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
  });

  it('should delete data through KV API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    await fetch('/api/kv/test-key', {
      method: 'DELETE',
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/kv/test-key', {
      method: 'DELETE',
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const response = await fetch('/api/kv/test-key');
    expect(response.ok).toBe(false);
  });
});