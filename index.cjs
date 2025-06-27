const express = require('express');
const fetch = require('node-fetch'); // Versão 2.x, importante!

const app = express();

const CLIENT_ID = process.env.CLIENT_ID || 'seu_client_id_aqui';
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'seu_client_secret_aqui';
const REDIRECT_URI = 'https://seu-dominio.vercel.app/auth/callback';

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
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return res.status(500).send(`Erro ao obter token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();

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
