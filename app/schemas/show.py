from pydantic import BaseModel
from typing import Optional, List


class CategoryResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True


class RatingResponse(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True


class ShowResponse(BaseModel):
    id: int
    show_id: str
    type: str
    title: str
    director: Optional[str] = None
    cast: Optional[str] = None
    country: Optional[str] = None
    date_added: Optional[str] = None
    release_year: Optional[int] = None
    rating: Optional[str] = None
    duration: Optional[str] = None
    listed_in: Optional[str] = None
    description: Optional[str] = None
    categories: List[CategoryResponse] = []
    
    class Config:
        from_attributes = True


class ShowFilter(BaseModel):
    search: Optional[str] = None
    type: Optional[str] = None  # Movie or TV Show
    category: Optional[str] = None
    rating: Optional[str] = None
    year_from: Optional[int] = None
    year_to: Optional[int] = None
    country: Optional[str] = None
    page: int = 1
    per_page: int = 20


class PaginatedShowsResponse(BaseModel):
    items: List[ShowResponse]
    total: int
    page: int
    per_page: int
    pages: int

