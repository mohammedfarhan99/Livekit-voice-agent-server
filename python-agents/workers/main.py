"""
Main LiveKit Agent Worker using Python (Production Ready)
"""

import asyncio
import os
import json
from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    WorkerOptions,
    cli,
)
from livekit.plugins import openai, deepgram, elevenlabs, silero
import logging

# Load environment variables
load_dotenv()

# Import our custom modules
from personalities import get_personality
from tools import get_tools_for_agent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def entrypoint(ctx: JobContext):
    """Main entry point for agent worker."""
    try:
        # Connect to the room
        await ctx.connect()
        logger.info(f"Connected to room: {ctx.room.name}")
        
        # Get agent configuration from room metadata
        room_metadata = {}
        if ctx.room.metadata:
            try:
                room_metadata = json.loads(ctx.room.metadata)
            except json.JSONDecodeError:
                logger.warning("Invalid JSON in room metadata, using defaults")
        
        # Extract agent configuration
        agent_type = room_metadata.get("type", "assistant")
        custom_instructions = room_metadata.get("customInstructions")
        voice_settings = room_metadata.get("voiceSettings", {})
        
        # Get personality configuration
        personality = get_personality(agent_type)
        logger.info(f"Starting {personality.name} agent")
        
        # Get tools for this agent type
        tools = get_tools_for_agent(agent_type)
        
        # Create the agent with personality
        instructions = custom_instructions if custom_instructions else personality.instructions
        agent = Agent(
            instructions=instructions,
            tools=tools
        )
        
        # Configure voice settings
        voice_name = voice_settings.get("voice", personality.voice)
        if voice_name in ["professional", "enthusiastic", "neutral", "calm", "educational", "confident", "helpful"]:
            # Map personality voices to actual ElevenLabs voices
            voice_mapping = {
                "professional": "Rachel",
                "enthusiastic": "Josh", 
                "neutral": "Aria",
                "calm": "Sarah",
                "educational": "Chris",
                "confident": "Antoni",
                "helpful": "Nicole"
            }
            voice_name = voice_mapping.get(voice_name, "Rachel")
            
        # Create agent session with AI providers
        session = AgentSession(
            # Voice Activity Detection
            vad=silero.VAD.load(),
            
            # Speech-to-Text
            stt=deepgram.STT(
                model="nova-2",
                language="en-US",
                smart_format=True,
                punctuate=True
            ),
            
            # Large Language Model  
            llm=openai.LLM(
                model=personality.model,
                temperature=personality.temperature,
            ),
            
            # Text-to-Speech
            tts=elevenlabs.TTS(
                voice=voice_name,
                model="eleven_turbo_v2_5",
                stability=voice_settings.get("stability", 0.8),
                similarity_boost=voice_settings.get("similarity", 0.9)
            )
        )
        
        # Start the agent session
        await session.start(agent=agent, room=ctx.room)
        logger.info(f"Agent session started for {agent_type}")
        
        # Generate personalized greeting
        greetings = {
            "debt-collector": "Hello, this is Alex from the collections department. I'm calling regarding your account. May I confirm I'm speaking with the account holder?",
            "cheerleader": "Hey there! I'm Casey, your personal cheerleader and motivation coach! I'm absolutely thrilled to meet you and help brighten your day. How are you feeling right now?",
            "assistant": "Hello! I'm Jamie, your AI assistant. I'm here to help you with whatever you need today. What can I assist you with?",
            "customer-service": "Good day! This is Morgan from customer service. I'm here to help resolve any questions or concerns you might have. How can I assist you today?",
            "therapist": "Hello, I'm Taylor. Thank you for taking this time for yourself. I'm here to provide a safe, supportive space where you can share whatever is on your mind. How are you doing today?",
            "teacher": "Hello and welcome! I'm Riley, your learning companion. I'm excited to explore new ideas and help you understand anything you're curious about. What would you like to learn about today?",
            "sales-rep": "Hi there! I'm Jordan, and I'm genuinely excited to help you find the perfect solution for your needs. I believe in taking the time to understand what you're looking for. What brings you here today?",
            "technical-support": "Hello! I'm Sam from technical support. I understand technical issues can be frustrating, but I'm here to help get everything working smoothly for you. What technical challenge are you experiencing?"
        }
        
        greeting = greetings.get(agent_type, greetings["assistant"])
        await session.generate_reply(instructions=greeting)
        
        logger.info(f"Agent {agent_type} fully initialized and ready")
        
    except Exception as e:
        logger.error(f"Error in agent entrypoint: {e}", exc_info=True)
        raise

async def prewarm(ctx: JobContext):
    """Prewarm function to prepare agent before job starts."""
    logger.info("Prewarming agent worker...")
    # You can preload models or perform other initialization here
    pass

# Worker configuration
if __name__ == "__main__":
    # Run the agent worker
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        )
    )
