import request from 'supertest';
import app from '../../app';

const VALID_KEY = 'integration-test-key';

beforeAll(() => {
  process.env.API_KEY = VALID_KEY;
});

afterAll(() => {
  delete process.env.API_KEY;
});

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('does not require an API key', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});

describe('GET /quote/random', () => {
  it('returns 401 when no API key is provided', async () => {
    const res = await request(app).get('/quote/random');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when a wrong API key is provided', async () => {
    const res = await request(app)
      .get('/quote/random')
      .set('x-api-key', 'wrong-key');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 200 with a valid quote when the correct API key is provided', async () => {
    const res = await request(app)
      .get('/quote/random')
      .set('x-api-key', VALID_KEY);
    expect(res.status).toBe(200);
    expect(typeof res.body.text).toBe('string');
    expect(typeof res.body.author).toBe('string');
    expect(['playful', 'emotional', 'poetic']).toContain(res.body.category);
  });

  it('returns different quotes on consecutive calls', async () => {
    const texts = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .get('/quote/random')
        .set('x-api-key', VALID_KEY);
      texts.add(res.body.text);
    }
    expect(texts.size).toBeGreaterThan(1);
  });
});
