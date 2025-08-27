# Agent Starter for React


### Features:

- Real-time voice interaction with LiveKit Agents
- Camera video streaming support
- Screen sharing capabilities
- Audio visualization and level monitoring
- Virtual avatar integration
- Light/dark theme switching with system preference detection
- Customizable branding, colors, and UI text via configuration


### Project structure

```
frontend/
├── app/
│   ├── (app)/
│   ├── api/
│   ├── components/
│   ├── fonts/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── livekit/
│   ├── ui/
│   ├── app.tsx
│   ├── session-view.tsx
│   └── welcome.tsx
├── hooks/
├── lib/
├── public/
└── package.json
```

## Getting started



Then run the app with:

```bash
npm install
npm run dev
```

And open http://localhost:3000 in your browser.


## Configuration

This is a simple frontend to demonstrate the capabilities of the livekit server which provides configuration to livekit

#### Example: App configuration (`app-config.ts`)

```ts
export const APP_CONFIG_DEFAULTS = {
  companyName: 'LiveKit',
  pageTitle: 'LiveKit Voice Agent',
  pageDescription: 'A voice agent built with LiveKit',
  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: true,
  logo: '/lk-logo.svg',
  accent: '#002cf2',
  logoDark: '/lk-logo-dark.svg',
  accentDark: '#1fd5f9',
  startButtonText: 'Start call',
};
```

You can update these values in [`app-config.ts`](./app-config.ts) to customize branding, features, and UI text for your deployment.

#### Environment Variables

You'll also need to configure your LiveKit credentials in `.env.local` (copy `.env.example` if you don't have one):

```env
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=https://localhost:7880
LIVEKIT_BACKENND_URL=http://localhost:3000
```

