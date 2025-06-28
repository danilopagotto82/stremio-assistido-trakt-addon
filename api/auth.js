const fetch = require('node-fetch');
const { salvarToken } = require('../tokenStore');
const { v4: uuidv4 } = require('uuid');

module.exports = async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Código não fornecido.');

  try {
    const response = await fetch('https://api.trakt.tv/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: 'https://stremio-assistido-trakt-addon.vercel.app/auth/callback',
        grant_type: 'authorization_code'
      })
    });

    const token = await response.json();
    const uid = uuidv4();
    await salvarToken(uid, token);

    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <html>
        <head><title>Conectado com sucesso</title></head>
        <body style="font-family: sans-serif; text-align: center;">
          <h2>✅ Conectado com sucesso!</h2>
          <p>Seu código de usuário:</p>
          <input type="text" readonly value="${uid}" onclick="this.select()" style="font-size: 1.2em; padding: 5px;" />
          <p>Use esse código no Stremio para ativar o complemento.</p>
        </body>
      </html>
    `);
  } catch (err) {
    console.error('Erro no auth callback:', err.message);
    res.status(500).send('Erro ao conectar com o Trakt.');
  }
};
