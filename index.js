const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Função para obter a URL de callback corretamente
const getRedirectUri = (req) => `${req.protocol}://${req.get('host')}/auth/callback`;

// Redirecionar "/" para "/configure"
app.get('/', (req, res) => {
  res.redirect('/configure');
});

// Rota de manifesto para Stremio
app.get('/manifest.json', (req, res) => {
  res.json({
    id: 'br.com.danilodanilopagotto82.assistidottrakt',
    name: 'Assistido Trakt',
    description: 'Complemento Stremio que mostra Assistido do Trakt nos Cartões informativos (Handy Cards)',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie', 'series'],
    idPrefixes: ['tt', 'tv'],
    icon: 'https://raw.githubusercontent.com/danilopagotto82/stremio-assistido-trakt-addon/main/icon.png',
    contactEmail: 'danilopagotto2013@gmail.com',
    catalogs: [
      {
        type: 'movie',
        id: 'assistido_trakt_movies',
        name: 'Filmes Assistidos Trakt',
        extraSupported: ['search', 'genre'],
      },
      {
        type: 'series',
        id: 'assistido_trakt_series',
        name: 'Séries Assistidas Trakt',
        extraSupported: ['search', 'genre'],
      },
    ],
    idPrefixes: ['tt', 'tv'],
    version: '1.0.0',
  });
});

// Rota de configuração para usuários autenticarem no Trakt
app.get('/configure', (req, res) => {
  res.send(`
    <html>
      <head><title>Configurar Assistido Trakt</title></head>
      <body>
        <h1>Configurar seu Trakt</h1>
        <a href="https://trakt.tv/oauth/authorize?response_type=code&client_id=b7f40da45b05de1f3c72c8ab4a7b485feb1365a202fe362560e7dfaf53bf99e6&redirect_uri=${getRedirectUri(req)}">Entrar com Trakt</a>
      </body>
    </html>
  `);
});

// Callback OAuth do Trakt
app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Código de autorização não fornecido');
  }

  try {
    const tokenResponse = await axios.post('https://api.trakt.tv/oauth/token', {
      code: code,
      client_id: 'b7f40da45b05de1f3c72c8ab4a7b485feb1365a202fe362560e7dfaf53bf99e6',
      client_secret: 'c93bc3bfead15915193ebc789783fc99d16a587b6470dc65094b17b0facdb13e',
      redirect_uri: getRedirectUri(req),
      grant_type: 'authorization_code'
    });

    const accessToken = tokenResponse.data.access_token;
    // Você pode salvar esse token em cookie, banco, sessão etc.
    res.send(`Token obtido com sucesso! Seu token: ${accessToken}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao trocar o código pelo token');
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
