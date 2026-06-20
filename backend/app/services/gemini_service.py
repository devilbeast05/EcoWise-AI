import os
import json
import re
import logging
from typing import List, Dict, Any

# Configure Gemini
import google.generativeai as genai

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def generate_coach_advice(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate personalized carbon coaching recommendations using Gemini.
    """
    default_advice = {
        "insights": [
            f"Your total emissions for the last 30 days are {context.get('total_emissions', 0.0):.1f} kg CO2e.",
            "Transportation and home energy use are typical major contributors to personal footprints.",
            "Consistently logging your daily carbon activities helps build strong eco-habits."
        ],
        "recommendations": [
            "Consider reducing solo car trips by combining errands or using public transit.",
            "Optimize home heating/cooling and switch to energy-efficient appliances.",
            "Incorporate more plant-based meals into your weekly diet to reduce food emissions."
        ],
        "high_impact_actions": [
            "Switching your home to renewable energy sources can significantly drop your energy footprint.",
            "Replacing a weekly drive with public transit or biking is one of the highest impact personal actions."
        ]
    }

    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not configured. Using default coach advice.")
        return default_advice

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
You are an expert environmental sustainability and personal carbon coach.
Based on the user's carbon footprint context over the last 30 days:
{json.dumps(context, indent=2)}

Generate personalized advice. You must return ONLY a valid JSON object (no markdown block wrapper, no other text) with the following structure:
{{
  "insights": ["3 specific insights about their current footprint/logging habits"],
  "recommendations": ["3 practical tips/recommendations to reduce footprint"],
  "high_impact_actions": ["2 high-impact changes they can make"]
}}
Ensure all values are strings.
"""
        response = model.generate_content(prompt)
        text_response = response.text.strip()
        
        # Clean markdown wrappers if present
        if text_response.startswith("```"):
            text_response = re.sub(r"^```(?:json)?\n", "", text_response)
            text_response = re.sub(r"\n```$", "", text_response)
            text_response = text_response.strip()

        data = json.loads(text_response)
        # Verify keys
        if "insights" in data and "recommendations" in data and "high_impact_actions" in data:
            return data
        return default_advice
    except Exception as e:
        logger.error(f"Failed to generate coach advice with Gemini: {e}")
        return default_advice

def generate_weekly_report(context: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a weekly sustainability report narrative and suggestions.
    """
    default_report = {
        "summary": f"This week, your tracked emissions totaled {context.get('total_emissions', 0.0):.1f} kg CO2e. Keeping your energy and transport emissions low is key to meeting your targets.",
        "top_sources": ["Transportation", "Energy"],
        "improvement_areas": ["Solo driving commutes", "Standby power consumption"],
        "positive_habits": ["Logging footprint regularly", "Eco-friendly dietary choices"],
        "suggested_actions": ["Try carpooling or using public transit", "Unplug unused devices", "Swap one meat meal for plant-based"]
    }

    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not configured. Using default weekly report.")
        return default_report

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
You are an expert sustainability auditor.
Based on the user's weekly carbon footprint context:
{json.dumps(context, indent=2)}

Generate a weekly report. You must return ONLY a valid JSON object (no markdown block wrapper, no other text) with the following structure:
{{
  "summary": "A concise paragraph summarizing their weekly emissions and performance",
  "top_sources": ["1 or 2 largest sources of emissions"],
  "improvement_areas": ["2 areas where they can improve"],
  "positive_habits": ["2 positive eco-habits observed"],
  "suggested_actions": ["3 concrete next steps to take"]
}}
Ensure all values are strings.
"""
        response = model.generate_content(prompt)
        text_response = response.text.strip()
        
        if text_response.startswith("```"):
            text_response = re.sub(r"^```(?:json)?\n", "", text_response)
            text_response = re.sub(r"\n```$", "", text_response)
            text_response = text_response.strip()

        data = json.loads(text_response)
        # Verify keys
        required_keys = ["summary", "top_sources", "improvement_areas", "positive_habits", "suggested_actions"]
        if all(k in data for k in required_keys):
            return data
        return default_report
    except Exception as e:
        logger.error(f"Failed to generate weekly report with Gemini: {e}")
        return default_report

def chat_eco_buddy(message: str, history: List[Dict[str, str]], context: Dict[str, Any]) -> str:
    """
    Chat helper for EcoBuddy chatbot assistant.
    """
    fallback_reply = "I'm your EcoBuddy assistant! I'd love to help you track your carbon emissions and suggest ways to reduce them. Let's make small changes for a big impact!"
    
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not configured. Using default EcoBuddy fallback.")
        return fallback_reply

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Build prompt history
        history_context = ""
        for h in history[-10:]:  # Keep last 10 exchanges for context
            sender_name = "User" if h.get("sender") == "user" else "Assistant"
            history_context += f"{sender_name}: {h.get('text')}\n"
            
        prompt = f"""
You are EcoBuddy, an encouraging, friendly, and knowledgeable AI assistant for personal carbon tracking.
You help users reduce their ecological footprint.

User's current 30-day emissions context:
{json.dumps(context, indent=2)}

Recent Conversation History:
{history_context}
User: {message}
EcoBuddy:"""
        
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Failed to chat with EcoBuddy: {e}")
        return fallback_reply
