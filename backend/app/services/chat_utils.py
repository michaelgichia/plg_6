"""
Chat service utilities for token management and text processing
"""
import tiktoken
from typing import List, Dict, Any

# Token management constants
MAX_CONTEXT_TOKENS = 3500  # Leave room for response (~500 tokens)
SYSTEM_PROMPT_TOKENS = 100  # Estimate for system prompt
MAX_HISTORY_MESSAGES = 10


def count_tokens(text: str, model: str = "gpt-4") -> int:
    """Count tokens in text using tiktoken"""
    try:
        encoding = tiktoken.encoding_for_model(model)
        return len(encoding.encode(text))
    except Exception:
        # Fallback estimation: ~4 chars per token
        return len(text) // 4


def filter_chat_history(
    messages: List[Any], 
    current_question: str,
    context_str: str,
    max_tokens: int = MAX_CONTEXT_TOKENS
) -> List[Dict[str, str]]:
    """Filter and truncate chat history to fit within token limits"""
    
    # Calculate base tokens (system prompt + context + current question)
    base_tokens = (
        SYSTEM_PROMPT_TOKENS +
        count_tokens(context_str) +
        count_tokens(current_question)
    )
    
    available_tokens = max_tokens - base_tokens
    
    if available_tokens <= 0:
        return []  # No room for history
    
    conversation_history = []
    current_tokens = 0
    
    # Start with most recent messages (reverse chronological order)
    for msg in reversed(messages):
        if not msg.message:
            continue
            
        role = "assistant" if msg.is_system else "user"
        message_content = {
            "role": role,
            "content": msg.message
        }
        
        message_tokens = count_tokens(msg.message)
        
        # Check if adding this message would exceed token limit
        if current_tokens + message_tokens > available_tokens:
            break
            
        # Add to beginning to maintain chronological order
        conversation_history.insert(0, message_content)
        current_tokens += message_tokens
    
    return conversation_history


def build_system_prompt(course_name: str) -> str:
    """Build the system prompt for Athena"""
    return (
        f"You are Athena, a helpful AI tutor for the course '{course_name}'. "
        "You are friendly, encouraging, and knowledgeable. Handle social interactions gracefully:\n\n"
        "- Respond warmly to greetings: 'Hello!' → 'Hi there! How can I help you with your studies today?'\n"
        "- Acknowledge thanks: 'Thank you! (or other forms of appreciation)' → 'You're welcome! Any other questions about the course materials?'\n"
        f"- For off-topic questions (outside the context of the course materials), politely redirect: 'I'm focused on helping with your studies in {course_name}. Is there something from the course materials I can explain or help clarify?'\n"
        "- Use the provided context from course materials to answer academic questions\n"
        "- You have access to previous conversation history for better responses\n"
        "- If context doesn't contain relevant information for academic questions, say so and suggest asking about topics covered in the materials\n"
        "- For study skills questions (stress management, study tips), provide helpful advice while relating back to the course\n"
        "- Always maintain a supportive, tutoring tone\n\n"
        "FORMATTING INSTRUCTIONS:\n"
        "- Use **bold** for important terms and concepts\n"
        "- Use *italics* for emphasis\n"
        "- Use numbered lists (1. 2. 3.) for steps or sequences\n"
        "- Use bullet points (- or *) for related items\n"
        "- Use `code blocks` for technical terms, formulas, or code\n"
        "- Use > blockquotes for definitions or key quotes\n"
        "- Use ### headers for section breaks in longer responses\n"
        "- Use tables when comparing multiple items\n"
        "- Structure your responses with clear formatting for better readability"
    )


def build_continuation_prompt(course_name: str) -> str:
    """Build the system prompt for response continuation"""
    return (
        f"You are Athena, a helpful AI tutor for the course '{course_name}'. "
        "Continue your previous response from exactly where it left off. "
        "Do not repeat what you already said, just continue naturally with the "
        "same friendly, supportive tone. Maintain the same markdown formatting "
        "style as your previous response."
    )


def create_greeting_message(course_name: str) -> str:
    """Create a greeting message for new courses"""
    return (
        f"Hi! I'm Athena, your AI tutor for **{course_name}**. "
        "I'm ready to help you understand the course materials and answer any questions you have.\n\n"
        "I can help you with:\n"
        "- Explaining concepts from your course materials\n"
        "- Answering questions about specific topics\n"
        "- Creating summaries and study guides\n"
        "- Clarifying difficult content\n\n"
        "What would you like to learn about today?"
    )