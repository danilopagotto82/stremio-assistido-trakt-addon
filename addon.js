import { addonBuilder } from 'stremio-addon-sdk';
import fetch from 'node-fetch';
import { buscarToken } from './tokenStore.js';

export default function getInterface() {
  const builder = new addonBuilder({
    id: 'org.trakt.assistido',
    version: '1.0.0',
    name: 'Assistido Trakt',
    description: 'Mostra streams baseados no histórico do Trakt',
    resources: ['stream'],
    types: ['movie'],
    idPrefixes: ['tt'],
  });

  builder.defineStreamHandler(async ({ id }, extra) => {
    const uid = extra?.uid;
    if (!uid) return { streams: [] };

    const token = await buscarToken(uid);
    if (!token) return { streams: [] };

    try {
      const response = await fetch('https://api.trakt.tv/sync/history/movies?limit=1', {
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'trakt-api-version': '2',
          'trakt-api-key': 'b7f40da45b05de1f3c72c8ab4a7b485feb1365a202fe362560e7dfaf53bf99e6',
        },
      });

      const data = await response.json();
      const title = data?.[0]?.movie?.title ?? 'Filme assistido';

      return {
        streams: [
          {
            title: `🎬 ${title}`,
            name: 'Assistido no Trakt',
            url: 'https://trakt.tv/',
          },
        ],
      };
    } catch (err) {
      console.error('Erro na API do Trakt:', err.message);
      return { streams: [] };
    }
  });

  return builder.getInterface();
}
