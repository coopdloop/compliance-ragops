from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
import logging
from openai import OpenAI

from app.api import deps
from app.core.config import get_settings
from app.models.user import User
from app.schemas.agent import AgentRequest, AgentResponse
from app.services.agent_functions import (
    AVAILABLE_FUNCTIONS,
    SecurityCheck,
    PatchRecommendation,
    ComplianceReport,
    run_security_check,
    generate_patch_recommendation,
    generate_compliance_report,
)

settings = get_settings()
logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/execute", response_model=AgentResponse)
async def execute_agent(
    request: AgentRequest,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
) -> AgentResponse:
    """Execute AI agent with function calling capabilities"""
    try:
        logger.info(f"🤖 Agent received query: {request.query}")
        logger.debug(f"Context: {request.context}")

        if not current_user.openai_key:
            raise HTTPException(
                status_code=401,
                detail="OpenAI API key not found. Please add your API key in settings.",
            )

        client = OpenAI(api_key=current_user.openai_key)
        logger.info("🔑 OpenAI client initialized")

        # Initial conversation with the model
        messages = [
            {
                "role": "system",
                "content": """You are a security and compliance assistant with access to various functions.
                Your goal is to help users by calling appropriate functions and providing insights.
                Think step by step about what functions would be most helpful to answer the user's query.
                You can call multiple functions if needed.""",
            },
            {"role": "user", "content": request.query},
        ]

        logger.info("🤔 Thinking about which functions to call...")
        # First, get the model's thoughts and function calls
        response = client.chat.completions.create(
            model="gpt-4",
            messages=messages,
            functions=list(AVAILABLE_FUNCTIONS.values()),
            function_call="auto",
            temperature=0.7,
        )

        # Initialize list to store function results
        function_results = []
        final_messages = messages.copy()

        # Handle function calling
        message = response.choices[0].message
        while message.function_call:
            # Get function call details
            function_name = message.function_call.name
            function_args = json.loads(message.function_call.arguments)

            logger.info(f"🔧 Calling function: {function_name}")
            logger.debug(f"Arguments: {json.dumps(function_args, indent=2)}")

            # Execute the function
            if function_name == "run_security_check":
                result = run_security_check(SecurityCheck(**function_args))
            elif function_name == "generate_patch_recommendation":
                result = generate_patch_recommendation(
                    PatchRecommendation(**function_args)
                )
            elif function_name == "generate_compliance_report":
                result = generate_compliance_report(ComplianceReport(**function_args))
            else:
                logger.error(f"❌ Unknown function: {function_name}")
                raise HTTPException(
                    status_code=400, detail=f"Unknown function: {function_name}"
                )

            logger.info("✅ Function executed successfully")
            logger.debug(f"Result: {json.dumps(result, indent=2)}")

            # Store the result
            function_results.append(
                {"function": function_name, "args": function_args, "result": result}
            )

            # Add function call and result to messages
            final_messages.append(
                {
                    "role": "assistant",
                    "content": None,
                    "function_call": {
                        "name": function_name,
                        "arguments": json.dumps(function_args),
                    },
                }
            )
            final_messages.append(
                {
                    "role": "function",
                    "name": function_name,
                    "content": json.dumps(result),
                }
            )

            logger.info("🤔 Analyzing function results...")
            # Get next action from model
            response = client.chat.completions.create(
                model="gpt-4",
                messages=final_messages,
                functions=list(AVAILABLE_FUNCTIONS.values()),
                function_call="auto",
                temperature=0.7,
            )
            message = response.choices[0].message

        logger.info("✨ Agent execution completed")
        # Get final response from model
        final_messages.append({"role": "assistant", "content": message.content})

        return AgentResponse(
            query=request.query,
            function_calls=function_results,
            final_answer=message.content,
        )

    except Exception as e:
        logger.error(f"❌ Agent execution error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")
