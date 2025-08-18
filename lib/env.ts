// lib/env.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_VAPI_WEB_TOKEN',
  'NEXT_PUBLIC_VAPI_WORKFLOW_ID',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
] as const;

export function checkEnvVars() {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}