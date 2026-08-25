import os
from pathlib import Path
from typing import Dict, Any, Tuple
from backend.app.config import settings

class PromptManager:
    """
    Loads and manages prompt templates from the prompts/ directory.
    Supports variable substitution and template decomposition (System / User prompts).
    """

    def __init__(self, prompts_dir: str = None):
        self.prompts_dir = Path(prompts_dir or settings.PROMPTS_DIR)

    def load_template(self, template_name: str) -> str:
        """Loads the raw content of a prompt markdown file."""
        filename = f"{template_name}.prompt.md"
        filepath = self.prompts_dir / filename
        
        if not filepath.exists():
            # Try without .prompt.md suffix
            filepath = self.prompts_dir / f"{template_name}.md"
            if not filepath.exists():
                raise FileNotFoundError(f"Prompt template '{template_name}' not found at {self.prompts_dir}")

        with open(filepath, "r", encoding="utf-8") as f:
            return f.read()

    def parse_template(self, raw_content: str) -> Tuple[str, str]:
        """
        Extracts [SYSTEM PROMPT] and [USER PROMPT] blocks from a markdown template.
        """
        system_prompt = ""
        user_prompt = ""

        if "[SYSTEM PROMPT]" in raw_content:
            parts = raw_content.split("[SYSTEM PROMPT]")
            if len(parts) > 1:
                sub_parts = parts[1].split("[USER PROMPT]")
                system_prompt = sub_parts[0].strip()
                if len(sub_parts) > 1:
                    user_prompt = sub_parts[1].strip()
        elif "[USER PROMPT]" in raw_content:
            user_prompt = raw_content.split("[USER PROMPT]")[1].strip()
        else:
            user_prompt = raw_content.strip()

        return system_prompt, user_prompt

    def render(self, template_name: str, variables: Dict[str, Any]) -> Tuple[str, str]:
        """
        Loads a template by name, extracts system & user prompts,
        and replaces {{variable_name}} with supplied variable values.
        """
        raw_content = self.load_template(template_name)
        system_prompt, user_prompt = self.parse_template(raw_content)

        for key, value in variables.items():
            placeholder = f"{{{{{key}}}}}"
            val_str = str(value) if value is not None else ""
            system_prompt = system_prompt.replace(placeholder, val_str)
            user_prompt = user_prompt.replace(placeholder, val_str)

        return system_prompt, user_prompt

prompt_manager = PromptManager()
