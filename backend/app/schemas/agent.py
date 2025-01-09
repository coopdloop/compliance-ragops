from typing import Dict, List, Optional, Any
from pydantic import BaseModel


class AgentRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None


class FunctionCall(BaseModel):
    function: str
    args: Dict[str, Any]
    result: Dict[str, Any]


class AgentResponse(BaseModel):
    query: str
    function_calls: List[FunctionCall]
    final_answer: str
