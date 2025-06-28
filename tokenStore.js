const fetch = require('node-fetch');

const redisUrl = process.env.REDIS_REST_URL;
const redisToken = process.env.REDIS_REST_TOKEN;

async function salvarToken(uid, token) {
  await fetch(`${redisUrl}/set/${uid}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${redisToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(token)
  });
}

async function buscarToken(uid) {
  const res = await fetch(`${redisUrl}/get/${uid}`, {
    headers: { Authorization: `Bearer ${redisToken}` }
  });
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : null;
}

module.exports = { salvarToken, buscarToken };
