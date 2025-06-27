const express = require('express');
const fetch = require('node-fetch');
const app = express();

const CLIENT_ID = 'b7f40da45b05de1f3c72c8ab4a7b485feb1365a202fe362560e7dfaf53bf99e6';
const CLIENT_SECRET = 'c93bc3bfead15915193ebc789783fc99d16a587b6470dc65094b17b0facdb13e';

const REDIRECT_URI = 'https://stremio-assistido-trakt-addon.vercel.app/auth/callback';

app.get('/', (req, res) => {
  res.redirect('/configure');
});

app.get('/configure', (req, res) => {
  const authUrl = `https://trakt.tv/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.send(`
    <html>
      <head><title>Configurar Assistido Trakt</title></head>
      <body>
        <h1>Assistido Trakt - Configuração</h1>
        <p>Clique no botão abaixo para entrar com sua conta Trakt:</p>
        <a href="${authUrl}">
          <button style="font-size:20px;padding:10px 20px;">Entrar com Trakt</button>
        </a>
      </body>
    </html>
  `);
});

app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Código de autorização não fornecido.');
  }

  try {
    const tokenResponse = await fetch('https://api.trakt.tv/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      return res.status(500).send(`Erro ao obter token: ${errorBody}`);
    }

    const tokenData = await tokenResponse.json();

    // Aqui você pode salvar tokenData para uso futuro ou mostrar ao usuário
    res.send(`
      <html>
        <head><title>Token Obtido</title></head>
        <body>
          <h1>Token de acesso obtido com sucesso!</h1>
          <pre>${JSON.stringify(tokenData, null, 2)}</pre>
          <p>Use este token para seu complemento Stremio.</p>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send(`Erro no servidor: ${err.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
