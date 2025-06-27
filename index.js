// index.js
const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();

const CLIENT_ID = process.env.CLIENT_ID || 'SEU_CLIENT_ID';
const CLIENT_SECRET = process.env.CLIENT_SECRET || 'SEU_CLIENT_SECRET';
const REDIRECT_URI = 'https://stremio-assistido-trakt-addon.vercel.app/auth/callback';
const STORAGE_PATH = path.join(__dirname, 'storage.json');

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
  if (!code) return res.status(400).send('Código de autorização não fornecido.');

  try {
    const tokenResponse = await fetch('https://api.trakt.tv/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
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
    const userId = uuidv4();

    const storage = fs.existsSync(STORAGE_PATH)
      ? JSON.parse(fs.readFileSync(STORAGE_PATH))
      : {};

    storage[userId] = tokenData;
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(storage, null, 2));

    res.send(`
      <html>
        <head><title>Token Salvo</title></head>
        <body>
          <h1>Token salvo com sucesso!</h1>
          <p>Use este link para seu Stremio: <br><br>
          <code>https://stremio-assistido-trakt-addon.vercel.app/stremio?uid=${userId}</code></p>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send(`Erro no servidor: ${err.message}`);
  }
});

// Exemplo de rota que poderia ser consumida pelo Stremio
app.get('/stremio', (req, res) => {
  const uid = req.query.uid;
  if (!uid) return res.status(400).send('UID ausente');

  const storage = fs.existsSync(STORAGE_PATH)
    ? JSON.parse(fs.readFileSync(STORAGE_PATH))
    : {};

  const userToken = storage[uid];
  if (!userToken) return res.status(404).send('Usuário não encontrado');

  // Aqui você pode usar userToken.access_token para buscar dados da API do Trakt
  res.send(`Stremio personalizado para UID: ${uid}`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
