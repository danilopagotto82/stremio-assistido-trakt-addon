import { addonBuilder } from 'stremio-addon-sdk';
import fetch from 'node-fetch';
import { buscarToken } from './tokenStore.js';

const builder = new addonBuilder({
  id: 'org.trakt.assistido',
  version: '1.0.0',
  name: 'Assistido Trakt',
  description: 'Mostra streams com base no histórico do Trakt',
  resources: ['stream'],
  types: ['movie'],
  idPrefixes: ['tt'],
});

builder.defineStreamHandler(async ({ id }, extra) => {
  const uid = extra?.uid;
  if (!uid) {
    console.warn('UID não fornecido na chamada do Stremio.');
    return { streams: [] };
  }

  const token = await buscarToken(uid);
  if (!token) {
    console.warn(`Nenhum token encontrado no Redis para UID: ${uid}`);
    return { streams: [] };
  }

  try {
    // Exemplo de chamada à API do Trakt para validar o token (pode expandir futuramente)
    const response = await fetch('https://api.trakt.tv/sync/history/movies?limit=1', {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'trakt-api-version': '2',
        'trakt-api-key': 'b7f40da45b05de1f3c72c8ab4a7b485feb1365a202fe362560e7dfaf53bf99e6',
      },
    });

    if (!response.ok) throw new Error('Erro ao acessar histórico do Trakt');

    const data = await response.json();
    const lastWatched = data?.[0]?.movie?.title || 'Filme assistido';

    const streams = [
      {
        title: `🎬 ${lastWatched}`,
        name: 'Trakt Stream',
        url: 'https://trakt.tv/', // opcionalmente link dinâmico aqui no futuro
      },
    ];

    return { streams };
  } catch (err) {
    console.error('Erro ao consultar a API Trakt:', err.message);
    return { streams: [] };
  }
});

export default builder.getInterface();
