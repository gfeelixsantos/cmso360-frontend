export async function resolveAuthProxyContextFromTokens({
  authToken,
  refreshToken,
  verifyJwt,
}) {
  const bearerToken = authToken ?? refreshToken;

  if (!bearerToken) {
    return {};
  }

  const payload = await verifyJwt(bearerToken);

  if (!payload) {
    return {};
  }

  const { exp, iat, ...authUser } = payload;

  return {
    bearerToken,
    authUser,
  };
}
