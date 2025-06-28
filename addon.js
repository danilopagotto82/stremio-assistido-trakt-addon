import { addonBuilder, serveHTTP } from 'stremio-addon-sdk';

const builder = new addonBuilder({
  id: 'org.trakt.assistido',
  version: '1.0.0',
  name: 'Assistido Trakt',
  description: 'Mostra streams com base no histórico do Trakt',
  resources: ['stream'],
  types: ['movie'],
  idPrefixes: ['tt'],
});

builder.defineStreamHandler(() => {
  return Promise.resolve({
    streams: [
      {
        title: 'Exemplo de Stream',
        name: 'Assistido Trakt',
        url: 'https://trakt.tv/',
      },
    ],
  });
});

// Serve via HTTP (para Vercel)
serveHTTP(builder.getInterface(), { port: process.env.PORT || 7000 });

// Exporta o manifesto (para Vercel usar como função)
export default () => builder.getInterface();
