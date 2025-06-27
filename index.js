import express from 'express';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { salvarToken } from './tokenStore.js';

const app = express();

// Servir arquivos estáticos da pasta /public
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// Variáveis de ambiente
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://stremio-assistido-trakt-addon.vercel.app/auth/callback';

// Rota inicial redireciona para configuração
app.get('/', (req, res) => {
  res.redirect('/configure');
});

// Página de login com o Trakt
app.get('/configure', (req, res) => {
  const authUrl = `https://trakt.tv/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.send(`
    <html>
      <head><title>Configurar Assistido Trakt</title></head>
      <body style="font-family: sans-serif; text-align: center;">
        <h1>Assistido Trakt - Configuração</h1>
        <p>Clique no botão abaixo para entrar com sua conta Trakt:</p>
        <a href="${authUrl}">
          <button style="font-size:20px;padding:10px 20px;">🔗 Entrar com o Trakt</button>
        </a>
      </body>
    </html>
  `);
});

// Callback OAuth → troca código por token e salva com UID
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
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      return res.status(500).send(`Erro ao obter token: ${errorBody}`);
    }

    const tokenData = await tokenResponse.json();
    const uid = uuidv4();
    await salvarToken(uid, tokenData);

    res.send(`
      <html>
        <head><title>Conectado!</title></head>
        <body style="font-family: sans-serif; text-align: center;">
          <h2>✅ Conexão bem-sucedida com o Trakt!</h2>
          <p>Seu UID é:</p>
          <input type="text" readonly style="font-size: 1.2em; padding: 5px;" value="${uid}" onclick="this.select()" />
          <p>Use esse UID na configuração do complemento Stremio.</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Erro na autenticação:', err);
    res.status(500).send('Erro interno ao processar autenticação.');
  }
});

// Rota para retornar token salvo no Redis via UID
app.get('/stremio', async (req, res) => {
  const uid = req.query.uid;
  if (!uid) return res.status(400).send('UID não fornecido.');

  try {
    const { buscarToken } = await import('./tokenStore.js');
    const token = await buscarToken(uid);

    if (!token) return res.status(404).send('Token não encontrado para este UID.');
    res.json(token);
  } catch (err) {
    console.error('Erro ao buscar token:', err);
    res.status(500).send('Erro interno ao buscar token.');
  }
});

// 🔧 Corrigida: rota para servir o addon.js ao Stremio
app.get('/addon.js', async (req, res) => {
  try {
    const { default: getInterface } = await import('./addon.js');
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(getInterface)); // <-- sem executar aqui!
  } catch (err) {
    console.error('Erro ao carregar addon.js:', err.message);
    res.status(500).send('Erro ao carregar o addon.');
  }
});

export default app;
