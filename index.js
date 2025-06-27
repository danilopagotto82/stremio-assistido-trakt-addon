const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;

// Seus dados da app Trakt - NÃO É A CONTA DO USUÁRIO, é da sua app registrada no Trakt
const TRAKT_CLIENT_ID = 'b7f40da45b05de1f3c72c8ab4a7b485feb1365a202fe362560e7dfaf53bf99e6';
const TRAKT_CLIENT_SECRET = 'c93bc3bfead15915193ebc789783fc99d16a587b6470dc65094b17b0facdb13e';

// Função para criar URL de callback dinâmica (conforme o domínio que estiver rodando)
const getRedirectUri = (req) => `${req.protocol}://${req.get('host')}/auth/callback`;

// Manifesto do addon (stremio usa para identificar o addon)
app.get('/manifest.json', (req, res) => {
  res.json({
    id: "br.com.danilodanilopagotto82.assistidottrakt",
    version: "1.0.0",
    name: "Assistido Trakt",
    description: "Complemento Stremio que mostra Assistido do Trakt nos Cartões informativos (Handy Cards)",
    resources: ["meta"],
    types: ["movie", "series", "episode"],
    catalogs: [],
    behaviorHints: {
      supportsAutoPlay: false,
      configurable: true
    },
    idPrefixes: ["tt", "tv"],
    contactEmail: "danilopagotto2013@gmail.com",
    icon: "https://cdn-icons-png.flaticon.com/512/190/190411.png"
  });
});

// Página de configuração com botão para o usuário iniciar login no Trakt
app.get('/configure', (req, res) => {
  const redirectUri = encodeURIComponent(getRedirectUri(req));
  const authUrl = `https://trakt.tv/oauth/authorize?response_type=code&client_id=${TRAKT_CLIENT_ID}&redirect_uri=${redirectUri}`;

  res.send(`
    <html>
      <head><title>Configurar Assistido Trakt</title></head>
      <body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
        <h1>Configurar Complemento Assistido Trakt</h1>
        <p>Clique no botão abaixo para entrar na sua conta Trakt e autorizar o complemento.</p>
        <a href="${authUrl}" style="display: inline-block; padding: 12px 24px; background: #E50914; color: white; text-decoration: none; font-weight: bold; border-radius: 6px;">
          Entrar com Trakt
        </a>
      </body>
    </html>
  `);
});

// Callback da autenticação - troca código por token e envia token para Stremio
app.get('/auth/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Código de autenticação não recebido.');

  try {
    const redirectUri = getRedirectUri(req);

    const tokenResponse = await axios.post('https://api.trakt.tv/oauth/token', {
      code: code,
      client_id: TRAKT_CLIENT_ID,
      client_secret: TRAKT_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const accessToken = tokenResponse.data.access_token;
    const refreshToken = tokenResponse.data.refresh_token;
    const expiresIn = tokenResponse.data.expires_in;

    // Envia o token para o Stremio, que vai armazenar e enviar junto nas próximas requisições
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'addon_config',
              data: {
                access_token: '${a_
