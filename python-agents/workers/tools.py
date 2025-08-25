"""
Tool definitions for different agent types.
"""

from livekit.agents import function_tool
import json
import random
from datetime import datetime, timedelta
from typing import Dict, Any

# Debt Collector Tools
@function_tool
async def payment_calculator(debt_amount: float, months: int) -> str:
    """Calculate payment options based on debt amount and duration."""
    if months <= 0 or debt_amount <= 0:
        return "Invalid parameters. Please provide positive values."
    
    monthly_payment = debt_amount / months
    interest_rate = 0.05  # 5% simple interest
    total_interest = debt_amount * interest_rate
    total_amount = debt_amount + total_interest
    
    return json.dumps({
        "monthly_payment": f"${monthly_payment:.2f}",
        "total_amount": f"${total_amount:.2f}",
        "total_interest": f"${total_interest:.2f}",
        "payment_plan": f"{months} monthly payments of ${monthly_payment:.2f}",
        "savings_vs_minimum": f"Save ${total_interest * 0.3:.2f} compared to minimum payments"
    })

@function_tool
async def account_lookup(account_number: str) -> str:
    """Look up account information."""
    # Simulated account data
    mock_accounts = {
        "12345": {"balance": 1250.00, "last_payment": "2024-10-15", "status": "Past Due", "days_past_due": 45},
        "67890": {"balance": 750.50, "last_payment": "2024-11-01", "status": "Current", "days_past_due": 0},
        "default": {"balance": 980.75, "last_payment": "2024-09-20", "status": "Past Due", "days_past_due": 65}
    }
    
    account = mock_accounts.get(account_number, mock_accounts["default"])
    return json.dumps({
        "account_number": account_number,
        "balance": f"${account['balance']:.2f}",
        "last_payment": account["last_payment"],
        "status": account["status"],
        "days_past_due": account["days_past_due"],
        "next_due_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    })

# Cheerleader Tools
@function_tool
async def affirmation_generator(mood: str, situation: str = "") -> str:
    """Generate personalized affirmations based on mood and situation."""
    affirmations = {
        "stressed": [
            "You are capable of handling whatever comes your way!",
            "This challenging moment is temporary, but your strength is permanent.",
            "You've overcome stress before, and you have the tools to do it again."
        ],
        "sad": [
            "Your feelings are valid, and it's okay to feel sad sometimes.",
            "Even in darkness, you carry an inner light that can't be extinguished.",
            "This sadness will pass, and joy will find you again."
        ],
        "anxious": [
            "You are safe in this moment. Breathe deeply and trust in your resilience.",
            "Anxiety is just a feeling, not a fact. You have the power to work through this.",
            "Your courage is stronger than your fear."
        ],
        "default": [
            "You are exactly where you need to be in your journey.",
            "Your potential is unlimited, and today holds infinite possibilities!",
            "You are worthy of love, success, and all the good things life offers."
        ]
    }
    
    mood_affirmations = affirmations.get(mood.lower(), affirmations["default"])
    selected_affirmation = random.choice(mood_affirmations)
    
    return json.dumps({
        "affirmation": selected_affirmation,
        "mood": mood,
        "situation": situation,
        "encouragement": f"I hear that you're feeling {mood}. That takes courage to share, and I want you to know that your feelings matter.",
        "action_suggestion": "Take three deep breaths and repeat this affirmation. You've got this!"
    })

# Customer Service Tools  
@function_tool
async def order_lookup(order_number: str) -> str:
    """Look up order information."""
    # Mock order data
    mock_orders = {
        "ORD123": {"status": "Shipped", "tracking": "1Z999AA1234567890", "delivery_date": "2024-12-28"},
        "ORD456": {"status": "Processing", "tracking": "", "delivery_date": "2024-12-30"},
        "default": {"status": "In Transit", "tracking": "1Z999BB9876543210", "delivery_date": "2024-12-27"}
    }
    
    order = mock_orders.get(order_number, mock_orders["default"])
    return json.dumps({
        "order_number": order_number,
        "status": order["status"], 
        "tracking_number": order["tracking"],
        "estimated_delivery": order["delivery_date"],
        "customer_service_note": "Order is processing normally. Customer will receive tracking updates via email."
    })

# Technical Support Tools
@function_tool
async def diagnostic_runner(issue_description: str, device_type: str = "computer") -> str:
    """Run basic diagnostics for technical issues."""
    common_solutions = {
        "slow": "Try restarting your device, clearing browser cache, or checking for updates.",
        "connection": "Check your internet connection, restart your router, or try connecting to a different network.",
        "crash": "Update your software, check for conflicting programs, or run in safe mode.",
        "error": "Note the exact error message, check system logs, or try reinstalling the problematic application."
    }
    
    # Simple keyword matching for demo
    solution = "Please provide more specific details about the issue for targeted assistance."
    for keyword, fix in common_solutions.items():
        if keyword in issue_description.lower():
            solution = fix
            break
            
    return json.dumps({
        "issue": issue_description,
        "device_type": device_type,
        "diagnostic_result": "Initial assessment completed",
        "recommended_solution": solution,
        "escalation_needed": len(issue_description.split()) > 20,  # Complex descriptions may need escalation
        "follow_up_time": "24 hours"
    })

# Get tools for specific agent type
def get_tools_for_agent(agent_type: str):
    """Return appropriate tools for each agent type."""
    tool_mapping = {
        "debt-collector": [payment_calculator, account_lookup],
        "cheerleader": [affirmation_generator],
        "customer-service": [order_lookup],
        "technical-support": [diagnostic_runner],
        "assistant": [],  # Can add general tools
        "therapist": [],  # Therapeutic tools would be more complex
        "teacher": [],    # Educational tools would be more complex  
        "sales-rep": []   # Sales tools would be more complex
    }
    
    return tool_mapping.get(agent_type, [])
