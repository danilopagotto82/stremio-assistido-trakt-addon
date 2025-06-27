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
    console.warn('UID não fornecido');
    return { streams: [] };
  }

  const token = await buscarToken(uid);
  if (!token) {
    console.warn(`Nenhum token encontrado para UID: ${uid}`);
    return { streams: [] };
  }

  try {
    const response = await fetch('https://api.trakt.tv/sync/history/movies?limit=1', {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'trakt-api-version': '2',
        'trakt-api-key': 'b7f40da45b05de1f3c72c8ab4a7b485feb1365a202fe362560e7dfaf53bf99e6'
      }
    });

    if (!response.ok) throw new Error('Erro ao acessar a API do Trakt');

    const data = await response.json();

    const streams = [
      {
        title: 'Último filme assistido (Trakt)',
        name: 'Trakt',
        url: 'https://trakt.tv/', // opcionalmente, você pode gerar um link mais específico depois
      },
    ];

    return { streams };
  } catch (err) {
    console.error('Erro ao buscar dados do Trakt:', err);
    return { streams: [] };
  }
});

export default builder.getInterface();
