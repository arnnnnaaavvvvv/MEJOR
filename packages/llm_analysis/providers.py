import json
import os
from typing import Dict, Any, Optional
import httpx
from pydantic import BaseModel
from apps.api.core.config import settings

class LLMProvider:
    async def analyze_visuals(
        self,
        image_base64: str,
        untrusted_text: str,
        system_rubric: str
    ) -> Dict[str, Any]:
        raise NotImplementedError

class MockVisionProvider(LLMProvider):
    async def analyze_visuals(
        self,
        image_base64: str,
        untrusted_text: str,
        system_rubric: str
    ) -> Dict[str, Any]:
        # Return high-fidelity structured mock evaluation
        return {
            "hero_5_second_verdict": "Clear value proposition: user understands primary service within 3 seconds.",
            "visual_hierarchy_rating": "Good",
            "squint_cta_focal_point": "Primary CTA button has dominant focal contrast under squint simulation.",
            "findings": [
                {
                    "check_id": "LLM-HIER-01",
                    "layer": "UX",
                    "severity": "MINOR",
                    "confidence": "MEDIUM",
                    "title": "Subtle Hero Secondary CTA Competition",
                    "problem": "Secondary 'Learn More' ghost button competes slightly with primary 'Get Started' button prominence.",
                    "selector": "div.hero-actions > button:nth-child(2)",
                    "fix_goal": "Lower contrast of secondary action to ghost style with subtle border.",
                    "constraints": ["Keep primary button solid brand color."],
                    "acceptance_check": "Primary CTA must have >= 2x visual weight compared to secondary action."
                }
            ]
        }

class OpenAIVisionProvider(LLMProvider):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY

    async def analyze_visuals(
        self,
        image_base64: str,
        untrusted_text: str,
        system_rubric: str
    ) -> Dict[str, Any]:
        if not self.api_key:
            return await MockVisionProvider().analyze_visuals(image_base64, untrusted_text, system_rubric)

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        prompt_content = [
            {"type": "text", "text": f"{system_rubric}\n\n<untrusted_scanned_page_text>\n{untrusted_text[:1500]}\n</untrusted_scanned_page_text>"},
        ]
        if image_base64:
            prompt_content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{image_base64}", "detail": "low"}
            })

        payload = {
            "model": "gpt-4o-mini",
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": "You are a senior UI/UX design auditor. Respond strictly in valid JSON."},
                {"role": "user", "content": prompt_content}
            ],
            "max_tokens": 1000
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_json = data["choices"][0]["message"]["content"]
                return json.loads(raw_json)
            else:
                return await MockVisionProvider().analyze_visuals(image_base64, untrusted_text, system_rubric)

def get_llm_provider() -> LLMProvider:
    if settings.OPENAI_API_KEY:
        return OpenAIVisionProvider()
    return MockVisionProvider()
