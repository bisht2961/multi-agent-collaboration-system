
import json
import re
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ParseResult:
    """Result of parsing agent output"""
    success: bool
    data: Dict[str, Any]
    raw_content: str
    confidence: float  # 0-1, how confident we are in parse
    error: Optional[str] = None

class OutputParser:
    """Parse structured output from agents"""
    
    @staticmethod
    def extract_json(content: str) -> ParseResult:
        """
        Extract JSON from agent response
        Tries multiple strategies
        """
        
        # Strategy 1: Direct parsing (agent returns pure JSON)
        try:
            data = json.loads(content)
            return ParseResult(
                success=True,
                data=data,
                raw_content=content,
                confidence=1.0
            )
        except json.JSONDecodeError:
            pass
        
        # Strategy 2: Find JSON block in text
        json_pattern = r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}'
        matches = re.findall(json_pattern, content, re.DOTALL)
        
        for match in matches:
            try:
                data = json.loads(match)
                return ParseResult(
                    success=True,
                    data=data,
                    raw_content=content,
                    confidence=0.9
                )
            except json.JSONDecodeError:
                continue
        
        # Strategy 3: Markdown code block
        markdown_pattern = r'```(?:json)?\s*\n(.*?)\n```'
        match = re.search(markdown_pattern, content, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1))
                return ParseResult(
                    success=True,
                    data=data,
                    raw_content=content,
                    confidence=0.85
                )
            except json.JSONDecodeError:
                pass
        
        # Fallback: Return raw content
        return ParseResult(
            success=False,
            data={"raw_content": content},
            raw_content=content,
            confidence=0.0,
            error="Could not parse JSON"
        )
    
    @staticmethod
    def extract_sections(content: str, section_names: List[str]) -> Dict[str, str]:
        """
        Extract labeled sections from text
        
        Example:
            content = "KEY_FINDINGS: point 1\\nSOURCES: source 1"
            sections = extract_sections(content, ["KEY_FINDINGS", "SOURCES"])
            → {"KEY_FINDINGS": "point 1", "SOURCES": "source 1"}
        """
        result = {}
        
        for section in section_names:
            # Match section header followed by content until next section
            pattern = f"{section}[:\\s]*(.+?)(?=\n[A-Z_]+[:\\s]|$)"
            match = re.search(pattern, content, re.DOTALL | re.IGNORECASE)
            
            if match:
                result[section] = match.group(1).strip()
        
        return result
    
    @staticmethod
    def validate_structure(data: Dict, required_keys: List[str]) -> bool:
        """Check if parsed data has required keys"""
        return all(key in data for key in required_keys)

class ResearchOutputValidator:
    """Validate Research Agent output"""
    
    REQUIRED_KEYS = ["key_findings", "sources", "gaps", "confidence"]
    
    @staticmethod
    def validate(output: str) -> ParseResult:
        """Validate and parse research output"""
        
        result = OutputParser.extract_json(output)
        
        if not result.success:
            # Try section extraction
            sections = OutputParser.extract_sections(
                output,
                ["KEY_FINDINGS", "SOURCES", "GAPS", "CONFIDENCE"]
            )
            
            if sections:
                result.data = {k.lower(): v for k, v in sections.items()}
                result.success = True
                result.confidence = 0.7
        
        # Validate required keys
        if result.success:
            if not OutputParser.validate_structure(
                result.data,
                ResearchOutputValidator.REQUIRED_KEYS
            ):
                missing = [
                    k for k in ResearchOutputValidator.REQUIRED_KEYS
                    if k not in result.data
                ]
                logger.warning(f"Missing keys in research output: {missing}")
                result.confidence *= 0.8
        
        return result

class AnalystOutputValidator:
    """Validate Analyst Agent output"""
    
    REQUIRED_KEYS = ["patterns", "key_insights", "logical_structure", "content_outline"]
    
    @staticmethod
    def validate(output: str) -> ParseResult:
        result = OutputParser.extract_json(output)
        
        if not result.success:
            sections = OutputParser.extract_sections(
                output,
                ["PATTERNS", "KEY_INSIGHTS", "LOGICAL_STRUCTURE", "CONTENT_OUTLINE"]
            )
            
            if sections:
                result.data = {k.lower(): v for k, v in sections.items()}
                result.success = True
                result.confidence = 0.7
        
        if result.success:
            if not OutputParser.validate_structure(
                result.data,
                AnalystOutputValidator.REQUIRED_KEYS
            ):
                result.confidence *= 0.8
        
        return result

class WriterOutputValidator:
    """Validate Writer Agent output"""
    
    REQUIRED_KEYS = ["content", "tone", "length"]
    
    @staticmethod
    def validate(output: str) -> ParseResult:
        result = OutputParser.extract_json(output)
        
        if not result.success:
            sections = OutputParser.extract_sections(
                output,
                ["CONTENT", "TONE", "LENGTH", "IMPROVEMENTS"]
            )
            
            if sections:
                result.data = {k.lower(): v for k, v in sections.items()}
                result.success = True
                result.confidence = 0.7
        
        return result

class ValidatorOutputValidator:
    """Validate Validator Agent output"""
    
    REQUIRED_KEYS = ["quality_score", "final_verdict"]
    
    @staticmethod
    def validate(output: str) -> ParseResult:
        result = OutputParser.extract_json(output)
        
        if not result.success:
            sections = OutputParser.extract_sections(
                output,
                ["QUALITY_SCORE", "ISSUES_FOUND", "IMPROVEMENTS", "FINAL_VERDICT"]
            )
            
            if sections:
                result.data = {k.lower(): v for k, v in sections.items()}
                result.success = True
                result.confidence = 0.7
        
        return result

# Mapping of agent to validator
AGENT_VALIDATORS = {
    "research": ResearchOutputValidator,
    "analyze": AnalystOutputValidator,
    "write": WriterOutputValidator,
    "validate": ValidatorOutputValidator,
}

def get_validator(agent_id: str):
    """Get appropriate validator for agent"""
    return AGENT_VALIDATORS.get(agent_id)