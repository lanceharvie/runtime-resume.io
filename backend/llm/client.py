"""LLM client abstraction."""


class LLMClient:
    """Minimal abstraction around the selected LLM provider."""

    def generate(self, *, system_prompt: str, user_prompt: str, response_format: str = "json") -> str:
        raise NotImplementedError("LLM client not implemented yet")
