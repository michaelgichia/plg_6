import os

from pinecone import Pinecone

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV_NAME = os.getenv("PINECONE_ENV_NAME")
EMBEDDING_MODEL = "text-embedding-3-small"

EXPECTED_DIMENSION = 1536
MAX_FILES = 10
MAX_FILE_SIZE_MB = 25
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

pc = Pinecone(api_key=PINECONE_API_KEY, environment=PINECONE_ENV_NAME)
