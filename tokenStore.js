const tokenFixo = {
  access_token: 'COLE_AQUI_SEU_TOKEN_TRATK',
  token_type: 'Bearer',
  expires_in: 7776000,
  refresh_token: 'refresh_token_aqui',
  scope: 'public',
  created_at: 999999999
};

export async function buscarToken(uid) {
  return tokenFixo;
}
