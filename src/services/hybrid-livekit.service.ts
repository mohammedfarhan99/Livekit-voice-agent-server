import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AgentType, RoomInfo, CreateAgentRequest } from '../types/agent.types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class HybridLiveKitService {
  private roomService: RoomServiceClient;
  private activeRooms: Map<string, RoomInfo> = new Map();
  private pythonWorkerStarted: boolean = false;

  constructor() {
    this.roomService = new RoomServiceClient(
      config.LIVEKIT_URL,
      config.LIVEKIT_API_KEY,
      config.LIVEKIT_API_SECRET
    );
    
    // Start Python worker if not running
    this.ensurePythonWorker();
  }

  private async ensurePythonWorker() {
    if (this.pythonWorkerStarted) return;
      
    try {
      logger.info('Starting Python agent workers...');
      
      // Start Python workers in background
      const pythonProcess = exec(
        'cd python-agents && python workers/main.py start',
        { env: { ...process.env } }
      );
      
      pythonProcess.stdout?.on('data', (data) => {
        logger.info(`Python Worker: ${data.toString().trim()}`);
      });
      
      pythonProcess.stderr?.on('data', (data) => {
        logger.error(`Python Worker Error: ${data.toString().trim()}`);
      });
      
      this.pythonWorkerStarted = true;
      logger.info('Python agent workers started successfully');
      
    } catch (error) {
      logger.error('Failed to start Python workers:', error);
      throw new Error('Python agent workers failed to start');
    }
  }

  /**
   * Create a room with agent dispatch to Python workers
   */
  async createAgentRoom(request: CreateAgentRequest) {
    const roomName = request.roomName || `agent-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const userIdentity = request.userIdentity || 'user';
    
    try {
      // Ensure Python workers are running
      await this.ensurePythonWorker();
      
      // Create room with agent dispatch metadata
      const agentMetadata = JSON.stringify({
        type: request.agentType,
        customInstructions: request.customInstructions,
        voiceSettings: request.voiceSettings
      });
      
      const room = await this.roomService.createRoom({
        name: roomName,
        emptyTimeout: 10 * 60, // 10 minutes
        departureTimeout: 60,   // 1 minute  
        maxParticipants: 10,
        metadata: agentMetadata,
        // Agent will be automatically dispatched by Python worker
      });

      // Generate user token
      const userToken = await this.generateUserToken(roomName, userIdentity);
      
      // Store room info
      const roomInfo: RoomInfo = {
        roomName,
        token: userToken,
        agentType: request.agentType,
        status: 'created',
        createdAt: new Date()
      };
      
      this.activeRooms.set(roomName, roomInfo);
      
      logger.info(`Created room ${roomName} with ${request.agentType} agent`);
      
      return {
        roomName,
        token: userToken,
        connectUrl: `${config.LIVEKIT_URL}?token=${userToken}`,
        room: room
      };
      
    } catch (error: any) {
      logger.error('Failed to create agent room:', error);
      throw new Error(`Failed to create room: ${error.message}`);
    }
  }

  /**
   * Generate access token for user
   */
  private async generateUserToken(roomName: string, identity: string): Promise<string> {
    const at = new AccessToken(config.LIVEKIT_API_KEY, config.LIVEKIT_API_SECRET, {
      identity,
      name: identity,
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canUpdateOwnMetadata: true,
    });

    return at.toJwt();
  }

  /**
   * End a room and cleanup
   */
  async endRoom(roomName: string) {
    try {
      await this.roomService.deleteRoom(roomName);
      
      const roomInfo = this.activeRooms.get(roomName);
      if (roomInfo) {
        roomInfo.status = 'ended';
        roomInfo.endedAt = new Date();
        this.activeRooms.delete(roomName);
      }
      
      logger.info(`Ended room ${roomName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to end room ${roomName}:`, error);
      return false;
    }
  }

  /**
   * Get room information
   */
  getRoomInfo(roomName: string): RoomInfo | undefined {
    return this.activeRooms.get(roomName);
  }

  /**
   * List all active rooms
   */
  getActiveRooms(): RoomInfo[] {
    return Array.from(this.activeRooms.values());
  }

  /**
   * Get room participants
   */
  async getRoomParticipants(roomName: string) {
    try {
      const participants = await this.roomService.listParticipants(roomName);
      return participants;
    } catch (error) {
      logger.error(`Failed to get participants for room ${roomName}:`, error);
      throw error;
    }
  }

  /**
   * Health check for Python workers
   */
  async checkPythonWorkerHealth(): Promise<boolean> {
    try {
      // Check if Python process is running
      const { stdout } = await execAsync('ps aux | grep "python workers/main.py" | grep -v grep');
      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  }
}

