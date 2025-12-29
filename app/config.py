from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = 'postgresql://netflix_user:netflix_password@db:5432/netflix_db'
    
    SECRET_KEY: str = 'your-super-secret-key-change-in-production-netflix-2024'
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    APP_NAME: str = 'Netflix Catalog'
    DEBUG: bool = True
    
    class Config:
        env_file = '.env'


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()

