const fetch = require('node-fetch');
const { buscarToken } = require('../tokenStore');

module.exports = async function ({ id }, extra) {
  const uid = extra?.uid;
  if (!uid) return { streams: [] };

  const token = await buscarToken(uid);
  if (!token || !token.access_token) return { streams: [] };

  try {
    const res = await fetch('https://api.trakt.tv/sync/history/movies?limit=100', {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'trakt-api-version': '2',
        'trakt-api-key': process.env.CLIENT_ID
      }
    });

    const history = await res.json();

    // Procura por correspondência do ID do IMDb
    const watched = history.find(entry => entry.movie?.ids?.imdb === id);

    if (!watched) return { streams: [] };

    return {
      streams: [
        {
          title: '🎬 Assistido no Trakt',
          name: 'Histórico Trakt',
          url: 'https://trakt.tv/'
        }
      ]
    };
  } catch (err) {
    console.error('Erro no handler Trakt:', err.message);
    return { streams: [] };
  }
};
