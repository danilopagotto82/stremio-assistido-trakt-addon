const tokens = {};

export async function salvarToken(uid, token) {
  tokens[uid] = token;
}

export async function buscarToken(uid) {
  return tokens[uid];
}
