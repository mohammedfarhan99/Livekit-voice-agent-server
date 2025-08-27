import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  // LiveKit Configuration
  LIVEKIT_URL: z.string().url(),
  LIVEKIT_API_KEY: z.string().min(1),
  LIVEKIT_API_SECRET: z.string().min(1),
  
  // AI Provider Keys
  OPENAI_API_KEY: z.string().min(1),
  DEEPGRAM_API_KEY: z.string().min(1).optional(),
  ELEVENLABS_API_KEY: z.string().min(1).optional(),
  
  // Server Configuration
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // Agent Configuration
  DEFAULT_AGENT_TYPE: z.string().default('assistant'),
  ENABLE_TURN_DETECTION: z.string().transform(Boolean).default('true'),
});

export const config = configSchema.parse(process.env);

export type Config = typeof config;