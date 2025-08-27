import type { AppConfig } from './lib/types';

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'Riverline',
  pageTitle: 'Riverline Voice Agent',
  pageDescription: 'A debt collector voice agent built with LiveKit',

  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: true,
  isPreConnectBufferEnabled: true,

  logo: '/riverline.png',
  accent: '#002cf2',
  logoDark: '/riverline.png',
  accentDark: '#1fd5f9',
  startButtonText: 'Start call',

  agentName: undefined,
};
