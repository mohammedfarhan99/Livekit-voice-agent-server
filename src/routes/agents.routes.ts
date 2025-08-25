import { Router } from 'express';
import { z } from 'zod';
import { HybridLiveKitService } from '../services/hybrid-livekit.service';
import { logger } from '../utils/logger';
import { AgentType, CreateAgentRequest, AgentResponse, EnhancedParticipantInfo } from '../types/agent.types';
import { ParticipantInfo } from 'livekit-server-sdk';

const router = Router();
const liveKitService = new HybridLiveKitService();

// Validation schemas
const createAgentSchema = z.object({
  agentType: z.enum([
    'debt-collector', 'cheerleader', 'assistant', 'customer-service', 
    'therapist', 'teacher', 'sales-rep', 'technical-support'
  ] as const),
  roomName: z.string().optional(),
  userIdentity: z.string().optional(),
  customInstructions: z.string().optional(),
  voiceSettings: z.object({
    voice: z.string().optional(),
    stability: z.number().min(0).max(1).optional(),
    similarity: z.number().min(0).max(1).optional()
  }).optional()
});

// Agent type definitions (simplified, matches Python personalities)
// This is used for API documentation and client information
const AGENT_TYPE_DEFINITIONS = {
  'debt-collector': {
    name: 'Professional Debt Collector',
    description: 'FDCPA-compliant debt collection agent with empathy and professionalism',
    voice: 'professional',
    temperature: 0.3,
    tools: ['payment_calculator', 'account_lookup', 'payment_schedule'],
    personality: 'Professional and empathetic, follows all regulations, offers payment plans',
    example_use_cases: ['Debt collection calls', 'Payment plan negotiations', 'Account inquiries']
  },
  'cheerleader': {
    name: 'Motivational Cheerleader',  
    description: 'Enthusiastic motivational coach that boosts confidence and mood',
    voice: 'enthusiastic',
    temperature: 0.7,
    tools: ['mood_tracker', 'goal_setter', 'affirmation_generator'],
    personality: 'Warm, energetic, genuinely caring, celebrates all achievements',
    example_use_cases: ['Mental health support', 'Motivation coaching', 'Confidence building']
  },
  'assistant': {
    name: 'AI Assistant',
    description: 'General-purpose helpful assistant with broad knowledge',
    voice: 'neutral', 
    temperature: 0.5,
    tools: ['web_search', 'calculator', 'calendar_helper'],
    personality: 'Friendly but professional, accurate, adapts to user needs',
    example_use_cases: ['General inquiries', 'Information lookup', 'Task assistance']
  },
  'customer-service': {
    name: 'Customer Service Representative',
    description: 'Expert customer service rep focused on problem resolution', 
    voice: 'professional',
    temperature: 0.4,
    tools: ['order_lookup', 'refund_processor', 'ticket_creator', 'escalation_handler'],
    personality: 'Empathetic, solution-focused, turns problems into positive experiences',
    example_use_cases: ['Customer support', 'Order assistance', 'Issue resolution']
  },
  'therapist': {
    name: 'Therapeutic Listener',
    description: 'Compassionate therapeutic listener providing emotional support',
    voice: 'calm',
    temperature: 0.4, 
    tools: ['mood_assessment', 'coping_strategies', 'resource_finder', 'crisis_support'],
    personality: 'Warm, non-judgmental, reflective, encourages professional help when needed',
    example_use_cases: ['Emotional support', 'Active listening', 'Coping strategy guidance']
  },
  'teacher': {
    name: 'Educational Instructor',
    description: 'Engaging and patient educator who makes learning fun',
    voice: 'educational',
    temperature: 0.6,
    tools: ['concept_explainer', 'quiz_generator', 'progress_tracker', 'resource_recommender'], 
    personality: 'Patient, encouraging, creative, adapts to different learning styles',
    example_use_cases: ['Tutoring', 'Concept explanation', 'Educational support']
  },
  'sales-rep': {
    name: 'Sales Professional', 
    description: 'Consultative sales professional focused on customer needs',
    voice: 'confident',
    temperature: 0.5,
    tools: ['product_catalog', 'price_calculator', 'proposal_generator', 'needs_assessor'],
    personality: 'Builds rapport, listens first, focuses on customer value over features',
    example_use_cases: ['Sales calls', 'Product demos', 'Needs assessment']
  },
  'technical-support': {
    name: 'Tech Support Specialist',
    description: 'Patient technical support specialist who solves problems efficiently',
    voice: 'helpful', 
    temperature: 0.3,
    tools: ['diagnostic_runner', 'knowledge_searcher', 'ticket_manager', 'escalation_handler'],
    personality: 'Patient with non-technical users, clear step-by-step guidance, educational',
    example_use_cases: ['Technical troubleshooting', 'IT support', 'System diagnostics']
  }
} as const;

/**
 * POST /api/agents/create
 * Create a new voice agent with specified personality
 */
router.post('/create', async (req, res) => {
  try {
    const validatedData = createAgentSchema.parse(req.body);
    
    logger.info(`Creating ${validatedData.agentType} agent`, { 
      request: validatedData,
      timestamp: new Date().toISOString()
    });
    
    // Validate that the agent type exists in our definitions
    if (!AGENT_TYPE_DEFINITIONS[validatedData.agentType]) {
      return res.status(400).json({
        success: false,
        error: `Unsupported agent type: ${validatedData.agentType}`
      });
    }
    
    const result = await liveKitService.createAgentRoom(validatedData);
    
    const response: AgentResponse = {
      success: true,
      data: {
        roomName: result.roomName,
        token: result.token,
        connectUrl: result.connectUrl
      }
    };
    
    logger.info(`Successfully created ${validatedData.agentType} agent`, {
      roomName: result.roomName,
      agentType: validatedData.agentType
    });
    
    res.status(201).json(response);
    
  } catch (error) {
    logger.error('Failed to create agent:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    
    const response: AgentResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    
    res.status(500).json(response);
  }
});

/**
 * GET /api/agents/types
 * Get all available agent types and their configurations
 */
router.get('/types', (req, res) => {
  try {
    const agentTypes = Object.entries(AGENT_TYPE_DEFINITIONS).map(([type, config]) => ({
      type: type as AgentType,
      name: config.name,
      description: config.description,
      voice: config.voice,
      temperature: config.temperature,
      tools: config.tools,
      personality: config.personality,
      example_use_cases: config.example_use_cases,
      // Additional metadata for clients
      supported_languages: ['en-US'], // Currently only English
      max_session_duration: '10 minutes', // Based on room timeout
      features: [
        'Real-time voice interaction',
        'Function calling',
        'Interruption handling', 
        'Turn detection',
        'Custom voice settings'
      ]
    }));
    
    res.json({
      success: true,
      data: agentTypes,
      metadata: {
        total_types: agentTypes.length,
        framework: 'hybrid (Node.js + Python)',
        voice_providers: ['ElevenLabs', 'OpenAI TTS'],
        llm_providers: ['OpenAI GPT-4o-mini'],
        stt_providers: ['Deepgram Nova-2']
      }
    });
  } catch (error) {
    logger.error('Failed to get agent types:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agent types'
    });
  }
});

/**
 * GET /api/agents/rooms  
 * Get all active agent rooms
 */
router.get('/rooms', (req, res) => {
  try {
    const rooms = liveKitService.getActiveRooms();
    
    // Enhance room data with agent type information
    const enhancedRooms = rooms.map(room => ({
      ...room,
      agentInfo: AGENT_TYPE_DEFINITIONS[room.agentType] ? {
        name: AGENT_TYPE_DEFINITIONS[room.agentType].name,
        description: AGENT_TYPE_DEFINITIONS[room.agentType].description,
        voice: AGENT_TYPE_DEFINITIONS[room.agentType].voice
      } : null
    }));
    
    res.json({
      success: true,
      data: enhancedRooms,
      metadata: {
        total_rooms: rooms.length,
        active_rooms: rooms.filter(r => r.status === 'active').length,
        created_rooms: rooms.filter(r => r.status === 'created').length
      }
    });
  } catch (error) {
    logger.error('Failed to get active rooms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve rooms'
    });
  }
});

/**
 * GET /api/agents/rooms/:roomName
 * Get specific room information with enhanced details
 */
router.get('/rooms/:roomName', async (req, res) => {
  try {
    const { roomName } = req.params;
    const roomInfo = liveKitService.getRoomInfo(roomName);
    
    if (!roomInfo) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    // Try to get live participant information
    let participants:ParticipantInfo[] = [];
    try {
      participants = await liveKitService.getRoomParticipants(roomName);
    } catch (participantError) {
      logger.warn(`Could not fetch participants for room ${roomName}:`, participantError);
    }
    
    // Enhance with agent type information
    const agentTypeInfo = AGENT_TYPE_DEFINITIONS[roomInfo.agentType];
    
    const enhancedRoomInfo = {
      ...roomInfo,
      agentInfo: agentTypeInfo ? {
        name: agentTypeInfo.name,
        description: agentTypeInfo.description, 
        personality: agentTypeInfo.personality,
        voice: agentTypeInfo.voice,
        temperature: agentTypeInfo.temperature,
        available_tools: agentTypeInfo.tools
      } : null,
      participants: {
        count: participants.length,
        details: participants.map(p => ({
          identity: p.identity,
          name: p.name,
          isAgent: p.identity.startsWith('agent-') || p.name?.toLowerCase().includes('agent'),
          joinedAt: p.joinedAt,
          tracks: p.tracks?.map(t => ({ 
            sid: t.sid, 
            type: t.type, 
            muted: t.muted 
          })) || []
        }))
      },
      session_stats: {
        duration_seconds: roomInfo.endedAt 
          ? Math.floor((roomInfo.endedAt.getTime() - roomInfo.createdAt.getTime()) / 1000)
          : Math.floor((new Date().getTime() - roomInfo.createdAt.getTime()) / 1000),
        is_active: roomInfo.status === 'active' && participants.length > 0
      }
    };
    
    res.json({
      success: true,
      data: enhancedRoomInfo
    });
  } catch (error) {
    logger.error('Failed to get room info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve room information'
    });
  }
});

/**
 * DELETE /api/agents/rooms/:roomName
 * End an agent room
 */
router.delete('/rooms/:roomName', async (req, res) => {
  try {
    const { roomName } = req.params;
    const roomInfo = liveKitService.getRoomInfo(roomName);
    
    if (!roomInfo) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    const success = await liveKitService.endRoom(roomName);
    
    if (success) {
      logger.info(`Room ${roomName} ended successfully`, {
        agentType: roomInfo.agentType,
        duration_seconds: Math.floor((new Date().getTime() - roomInfo.createdAt.getTime()) / 1000)
      });
      
      res.json({
        success: true,
        message: `Room ${roomName} ended successfully`,
        data: {
          roomName,
          agentType: roomInfo.agentType,
          session_duration: `${Math.floor((new Date().getTime() - roomInfo.createdAt.getTime()) / 1000)}s`
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to end room'
      });
    }
  } catch (error) {
    logger.error('Failed to end room:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end room'
    });
  }
});

/**
 * GET /api/agents/rooms/:roomName/participants
 * Get detailed room participants information
 */
router.get('/rooms/:roomName/participants', async (req, res) => {
  try {
    const { roomName } = req.params;
    
    // Check if room exists
    const roomInfo = liveKitService.getRoomInfo(roomName);
    if (!roomInfo) {
      return res.status(404).json({
        success: false,
        error: 'Room not found'
      });
    }
    
    const participants:EnhancedParticipantInfo[] = await liveKitService.getRoomParticipants(roomName);
    
    // Enhance participant data
    const enhancedParticipants = participants.map(participant => ({
      identity: participant.identity,
      name: participant.name,
      isAgent: participant.identity.startsWith('agent-') || participant.name?.toLowerCase().includes('agent'),
      joinedAt: participant.joinedAt,
      connectionQuality: participant.connectionQuality || 'unknown',
      tracks: participant.tracks?.map(track => ({
        sid: track.sid,
        type: track.type,
        source: track.source,
        muted: track.muted,
        width: track.width,
        height: track.height,
        frameRate: track.frameRate,
        layers: track.layers
      })) || [],
      metadata: participant.metadata ? JSON.parse(participant.metadata) : null
    }));
    
    const agentParticipants = enhancedParticipants.filter(p => p.isAgent);
    const userParticipants = enhancedParticipants.filter(p => !p.isAgent);
    
    res.json({
      success: true,
      data: {
        room_name: roomName,
        agent_type: roomInfo.agentType,
        total_participants: enhancedParticipants.length,
        agents: agentParticipants,
        users: userParticipants,
        all_participants: enhancedParticipants
      },
      metadata: {
        room_status: roomInfo.status,
        room_created_at: roomInfo.createdAt,
        agent_count: agentParticipants.length,
        user_count: userParticipants.length
      }
    });
  } catch (error) {
    logger.error('Failed to get room participants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve participants'
    });
  }
});

/**
 * GET /api/agents/health/python-workers
 * Check Python worker health status
 */
router.get('/health/python-workers', async (req, res) => {
  try {
    const isHealthy = await liveKitService.checkPythonWorkerHealth();
    
    if (isHealthy) {
      res.json({
        success: true,
        status: 'healthy',
        message: 'Python agent workers are running',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        status: 'unhealthy', 
        message: 'Python agent workers are not running',
        timestamp: new Date().toISOString(),
        suggestion: 'Run: cd python-agents && python workers/main.py start'
      });
    }
  } catch (error: any) {
    logger.error('Failed to check Python worker health:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Could not check Python worker status',
      error: error.message
    });
  }
});

/**
 * POST /api/agents/restart-python-workers
 * Restart Python workers (development/admin endpoint)
 */
router.post('/restart-python-workers', async (req, res) => {
  try {
    // This would restart the Python workers
    // Implementation depends on your deployment setup
    logger.info('Python worker restart requested');
    
    res.json({
      success: true,
      message: 'Python worker restart initiated',
      note: 'This feature requires implementation based on your deployment setup'
    });
  } catch (error) {
    logger.error('Failed to restart Python workers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restart Python workers'
    });
  }
});

export default router;