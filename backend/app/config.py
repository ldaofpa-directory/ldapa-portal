import logging
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_PATH = os.getenv("DATABASE_PATH", "ldapa.db")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
JWT_SECRET = os.getenv("JWT_SECRET", "")
if not JWT_SECRET:
    JWT_SECRET = "dev-secret-change-in-production"
    logger.warning("JWT_SECRET not set — using insecure default. Set JWT_SECRET env var in production.")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-5-mini")
