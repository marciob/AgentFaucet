import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AGENT_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dev-secret"
);

interface AgentTokenPayload {
  sub: string; // e.g. "github:12345678"
  username: string;
  score: number;
  tier: number;
  dailyLimitWei: string;
  agentTokenId: number | null;
  provider: string;
}

export async function signAgentToken(
  payload: AgentTokenPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .setIssuer("agentfaucet")
    .sign(JWT_SECRET);
}

export async function verifyAgentToken(
  token: string
): Promise<AgentTokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET, {
    issuer: "agentfaucet",
  });
  return payload as unknown as AgentTokenPayload;
}
