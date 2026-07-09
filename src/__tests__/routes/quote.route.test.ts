import request from 'supertest';
import app from '../../app';

const VALID_KEY = 'integration-test-key';
const VALID_ADMIN_KEY = 'integration-test-admin-key';

beforeAll(() => {
  process.env.API_KEY = VALID_KEY;
  process.env.ADMIN_API_KEY = VALID_ADMIN_KEY;
});

afterAll(() => {
  delete process.env.API_KEY;
  delete process.env.ADMIN_API_KEY;
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

describe('POST /quotes', () => {
  it('returns 401 when no admin API key is provided', async () => {
    const res = await request(app)
      .post('/quotes')
      .send({ text: 'New quote.', author: 'Someone', category: 'playful' });
    expect(res.status).toBe(401);
  });

  it('returns 401 when the regular (read-only) API key is used instead of the admin key', async () => {
    const res = await request(app)
      .post('/quotes')
      .set('x-api-key', VALID_KEY)
      .send({ text: 'New quote.', author: 'Someone', category: 'playful' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when text is missing', async () => {
    const res = await request(app)
      .post('/quotes')
      .set('x-api-key', VALID_ADMIN_KEY)
      .send({ author: 'Someone', category: 'playful' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when author is missing', async () => {
    const res = await request(app)
      .post('/quotes')
      .set('x-api-key', VALID_ADMIN_KEY)
      .send({ text: 'New quote.', category: 'playful' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when category is invalid', async () => {
    const res = await request(app)
      .post('/quotes')
      .set('x-api-key', VALID_ADMIN_KEY)
      .send({ text: 'New quote.', author: 'Someone', category: 'sarcastic' });
    expect(res.status).toBe(400);
  });

  it('returns 201 and the created quote when valid', async () => {
    const res = await request(app)
      .post('/quotes')
      .set('x-api-key', VALID_ADMIN_KEY)
      .send({ text: 'A freshly added quote.', author: 'New Author', category: 'poetic' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ text: 'A freshly added quote.', author: 'New Author', category: 'poetic' });
  });
});

describe('DELETE /quotes', () => {
  it('returns 401 when no admin API key is provided', async () => {
    const res = await request(app)
      .delete('/quotes')
      .send({ text: 'Anything.' });
    expect(res.status).toBe(401);
  });

  it('returns 401 when the regular (read-only) API key is used instead of the admin key', async () => {
    const res = await request(app)
      .delete('/quotes')
      .set('x-api-key', VALID_KEY)
      .send({ text: 'Anything.' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when text is missing', async () => {
    const res = await request(app)
      .delete('/quotes')
      .set('x-api-key', VALID_ADMIN_KEY)
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 when no quote matches the given text', async () => {
    const res = await request(app)
      .delete('/quotes')
      .set('x-api-key', VALID_ADMIN_KEY)
      .send({ text: 'This text does not exist anywhere in the pool.' });
    expect(res.status).toBe(404);
  });

  it('returns 200 with the deleted count when the quote is removed', async () => {
    await request(app)
      .post('/quotes')
      .set('x-api-key', VALID_ADMIN_KEY)
      .send({ text: 'A quote destined for deletion.', author: 'Someone', category: 'playful' });

    const res = await request(app)
      .delete('/quotes')
      .set('x-api-key', VALID_ADMIN_KEY)
      .send({ text: 'A quote destined for deletion.' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleted: 1 });
  });
});
