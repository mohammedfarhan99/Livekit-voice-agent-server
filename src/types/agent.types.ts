import { ParticipantInfo, TrackInfo } from "livekit-server-sdk";

export interface AgentConfig {
  type: AgentType;
  instructions: string;
  voice?: string;
  temperature?: number;
  tools?: string[];
  customSettings?: Record<string, any>;
}

export type AgentType = 
  | 'debt-collector'
  | 'cheerleader'
  | 'assistant'
  | 'customer-service'
  | 'therapist'
  | 'teacher'
  | 'sales-rep'
  | 'technical-support';

export interface RoomInfo {
  roomName: string;
  token: string;
  agentType: AgentType;
  status: 'created' | 'active' | 'ended' | 'error';
  createdAt: Date;
  endedAt?: Date;
}

export type AgentResponse = {
    success: boolean;
    message?: string;
    data?: any; 
    error?: string; 
};

export interface CreateAgentRequest {
  agentType: AgentType;
  roomName?: string;
  userIdentity?: string;
  customInstructions?: string;
  voiceSettings?: {
    voice?: string;
    stability?: number;
    similarity?: number;
  }
};

interface EnhancedTrackInfo extends TrackInfo {
    frameRate?: number;
}

export interface EnhancedParticipantInfo  extends ParticipantInfo {
    connectionQuality?: string;
    tracks: EnhancedTrackInfo[];
}