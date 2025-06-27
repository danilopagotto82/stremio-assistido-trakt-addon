import express from 'express';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

const app = express();

// Variáveis de ambiente configuradas no Vercel
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://stremio-assistido-trakt-addon.vercel.app/auth/callback';

// Objeto em memória para armazenar tokens por UID
const tokens = {};

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
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      return res.status(500).send(`Erro ao obter token: ${errorBody}`);
    }

    const tokenData = await tokenResponse.json();

    // Gera UID único para esse token
    const uid = uuidv4();

    // Salva token em memória (não persiste se reiniciar)
    tokens[uid] = tokenData;

    res.send(`
      <html>
        <head><title>Token Obtido</title></head>
        <body>
          <h1>Token de acesso obtido com sucesso!</h1>
          <pre>${JSON.stringify(tokenData, null, 2)}</pre>
          <p>Seu UID: <code>${uid}</code></p>
          <p>Use esta URL no seu complemento Stremio:</p>
          <pre>https://${req.headers.host}/stremio?uid=${uid}</pre>
        </body>
      </html>
    `);

  } catch (err) {
    res.status(500).send(`Erro no servidor: ${err.message}`);
  }
});

// Exemplo simples para endpoint que retornaria token pelo uid
app.get('/stremio', (req, res) => {
  const uid = req.query.uid;
  if (!uid || !tokens[uid]) {
    return res.status(404).send('Token não encontrado para este UID.');
  }
  res.json(tokens[uid]);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
