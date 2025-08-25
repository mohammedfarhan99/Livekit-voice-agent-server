# LiveKit Voice Agent Server

A robust Node.js backend server for building and managing LiveKit voice agents with different personalities. This server provides HTTP/RPC endpoints for fast prototyping of conversational AI agents.

## 🚀 Features

- **Multiple Agent Personalities**: Debt collector, cheerleader, assistant, customer service, therapist, teacher, sales rep, technical support
- **HTTP/RPC API**: RESTful endpoints for creating and managing voice agents
- **LiveKit Integration**: Full integration with LiveKit's voice agent framework
- **Customizable Agents**: Custom instructions, voice settings, and tools per agent type
- **Production Ready**: Comprehensive error handling, logging, and graceful shutdown
- **TypeScript**: Fully typed for better development experience

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend App  │ ←→ │  HTTP Server    │ ←→ │ LiveKit Worker  │
│   (Web/Mobile)  │    │  (Express.js)   │    │  (Voice Agent)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ↕
                       ┌─────────────────┐
                       │ LiveKit Server  │
                       │   (Cloud/Self)  │
                       └─────────────────┘
```

## 📦 Installation

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd livekit-voice-agent-server
npm install
```

2. **Environment setup:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Required environment variables:**
```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
OPENAI_API_KEY=your_openai_key
DEEPGRAM_API_KEY=your_deepgram_key  # Optional
ELEVENLABS_API_KEY=your_elevenlabs_key  # Optional
```

## 🚀 Quick Start

1. **Start the HTTP server:**
```bash
npm run dev
```

2. **In another terminal, start the agent worker:**
```bash
npm run agent:dev
```

3. **Create a voice agent:**
```bash
curl -X POST http://localhost:3000/api/agents/create \
  -H "Content-Type: application/json" \
  -d '{
    "agentType": "cheerleader",
    "userIdentity": "user123"
  }'
```

## 🎭 Available Agent Types

| Agent Type | Description | Use Case |
|------------|-------------|----------|
| `debt-collector` | Professional debt collection agent | Financial services, collections |
| `cheerleader` | Enthusiastic motivational coach | Wellness apps, motivation |
| `assistant` | General purpose AI assistant | General chatbots, help systems |
| `customer-service` | Customer service representative | Support systems, helpdesks |
| `therapist` | Therapeutic listener and counselor | Mental health, emotional support |
| `teacher` | Educational instructor and tutor | Learning platforms, education |
| `sales-rep` | Consultative sales professional | Sales automation, lead conversion |
| `technical-support` | Technical support specialist | IT support, troubleshooting |

## 🔌 API Endpoints

### Create Agent
```http
POST /api/agents/create
Content-Type: application/json

{
  "agentType": "cheerleader",
  "roomName": "optional-room-name",
  "userIdentity": "user123",
  "customInstructions": "Be extra enthusiastic today!",
  "voiceSettings": {
    "voice": "Rachel",
    "stability": 0.8,
    "similarity": 0.9
  }
}
```

### List Agent Types
```http
GET /api/agents/types
```

### Get Active Rooms
```http
GET /api/agents/rooms
```

### Get Room Info
```http
GET /api/agents/rooms/{roomName}
```

### End Room
```http
DELETE /api/agents/rooms/{roomName}
```

## 🛠️ Development

**Start development server with hot reload:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
npm start
```

**Run tests:**
```bash
npm test
```

## 🔧 Customization

### Adding New Agent Personalities

1. **Add to types:**
```typescript
// src/types/agent.types.ts
export type AgentType = 
  | 'debt-collector'
  | 'your-new-agent'  // Add here
  | ...
```

2. **Define personality:**
```typescript
// src/agents/personalities.ts
export const agentPersonalities: Record<AgentType, AgentConfig> = {
  'your-new-agent': {
    type: 'your-new-agent',
    instructions: 'Your agent instructions here...',
    voice: 'preferred-voice',
    temperature: 0.6,
    tools: ['tool1', 'tool2']
  },
  // ...
};
```

3. **Add tools (optional):**
```typescript
// src/agents/worker.ts
const yourAgentTools = [
  functionTool({
    name: 'your_tool',
    description: 'What your tool does',
    parameters: { /* parameters */ },
    handler: async (context, params) => {
      // Tool implementation
    }
  })
];
```

### Custom Voice Settings

Each agent can have custom voice settings:

```typescript
voiceSettings: {
  voice: 'Rachel',      // ElevenLabs voice name
  stability: 0.8,       // 0.0 - 1.0
  similarity: 0.9       // 0.0 - 1.0
}
```

## 📊 Monitoring & Logging

The server includes comprehensive logging:

- **Request/Response logging**
- **Error tracking with stack traces**
- **Agent lifecycle events**
- **Performance metrics**

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console output (development)

## 🚦 Health Checks

- **Server health:** `GET /health`
- **LiveKit connectivity:** `GET /health/livekit`

## 🔒 Security Features

- **Helmet.js** for security headers
- **CORS** configuration
- **Request validation** with Zod
- **Rate limiting** (can be added)
- **JWT token validation** through LiveKit
