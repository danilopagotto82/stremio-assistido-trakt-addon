import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_REST_URL,
  token: process.env.REDIS_REST_TOKEN,
});

export async function salvarToken(uid, token) {
  try {
    await redis.set(`token:${uid}`, JSON.stringify(token));
    console.log(`Token salvo para UID: ${uid}`);
  } catch (err) {
    console.error('Erro ao salvar token no Redis:', err);
  }
}

export async function buscarToken(uid) {
  try {
    const data = await redis.get(`token:${uid}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Erro ao buscar token no Redis:', err);
    return null;
  }
}
