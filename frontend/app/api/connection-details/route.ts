import { NextResponse } from 'next/server';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';
import { RoomConfiguration } from '@livekit/protocol';

// NOTE: you are expected to define the following environment variables in `.env.local`:
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const BACKEND_TO_LIVEKIT = process.env.BACKEND_TO_LIVEKIT;

interface RoomDetailsForApi {
  agentType: string;
  roomName: string;
  userIdentity: string;
  customInstructions: string;
  voiceSettings?: {
    voice: string;
    stability: number;
    similarity: number;
  };
}

interface CreateRoomResponse {
  roomName: string;
  token: string;
  connectUrl: string;
}

// don't cache the results
export const revalidate = 0;

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

export async function POST(req: Request) {
  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error('LIVEKIT_URL is not defined');
    }
    if (API_KEY === undefined) {
      throw new Error('LIVEKIT_API_KEY is not defined');
    }
    if (API_SECRET === undefined) {
      throw new Error('LIVEKIT_API_SECRET is not defined');
    }

    // Parse agent configuration from request body
    // const body = await req.json();
    // const agentName: string = body?.room_config?.agents?.[0]?.agent_name;

    // Generate participant token
    // const participantName = 'user';
    const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
    const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;

    // const participantToken = await createParticipantToken(
    //   { identity: participantIdentity, name: participantName },
    //   roomName,
    //   agentName
    // );
    const createdRoom: CreateRoomResponse = await createRoomFromApi({
      agentType: 'debt-collector',
      roomName,
      userIdentity: participantIdentity,
      customInstructions: `You are a debt collector who won't stop until you get date of payment.`,
      voiceSettings: {
        voice: 'alloy',
        stability: 0.3,
        similarity: 0.7,
      },
    });

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName: createdRoom.roomName,
      participantToken: createdRoom.token /*participantToken, // use the token from created room*/,
      participantName: 'Professional Debt Collector',
    };
    const headers = new Headers({
      'Cache-Control': 'no-store',
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

/**
 * Makes a reqquest to the backend to create a room with the given configuration.
 * which is optimal for nextjs route handlers. written in async/await style.
 * @param roomDetails The details of the room to be created.
 * @returns The name of the created room.
 */
function createRoomFromApi(roomDetails: RoomDetailsForApi): Promise<CreateRoomResponse> {
  if (BACKEND_TO_LIVEKIT === undefined) {
    throw new Error('BACKEND_TO_LIVEKIT is not defined');
  }
  /**Refactor in async/await */
  return fetch(`${BACKEND_TO_LIVEKIT}/api/agents/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(roomDetails),
  })
    .then((res) => {
      // if (!res.success) {
      //   throw new Error(`Failed to create room: ${res.statusText}`);
      // }
      return res.json();
      return res.json() as Promise<CreateRoomResponse>;
    })
    .then((data) => {
      return data.data as CreateRoomResponse;
    })
    .catch((error) => {
      throw new Error(`Failed to create room: ${error.message}`);
    });
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  agentName?: string
): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: '15m',
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);

  if (agentName) {
    at.roomConfig = new RoomConfiguration({
      agents: [{ agentName }],
    });
  }

  return at.toJwt();
}
