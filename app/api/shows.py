from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import Optional, List
from app.database import get_db
from app.models.show import Show, Category, Rating
from app.models.user import User
from app.schemas.show import ShowResponse, PaginatedShowsResponse, CategoryResponse, RatingResponse
from app.services.auth import get_current_active_user

router = APIRouter()


@router.get("/", response_model=PaginatedShowsResponse)
def get_shows(
    search: Optional[str] = Query(None, description="Search in title, director, cast, description"),
    type: Optional[str] = Query(None, description="Filter by type: Movie or TV Show"),
    category: Optional[str] = Query(None, description="Filter by category"),
    rating: Optional[str] = Query(None, description="Filter by rating"),
    year_from: Optional[int] = Query(None, description="Filter by release year from"),
    year_to: Optional[int] = Query(None, description="Filter by release year to"),
    country: Optional[str] = Query(None, description="Filter by country"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get shows with filters and pagination"""
    query = db.query(Show)
    
    # Search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Show.title.ilike(search_term),
                Show.director.ilike(search_term),
                Show.cast.ilike(search_term),
                Show.description.ilike(search_term)
            )
        )
    
    # Type filter
    if type:
        query = query.filter(Show.type == type)
    
    # Category filter
    if category:
        query = query.join(Show.categories).filter(Category.name == category)
    
    # Rating filter
    if rating:
        query = query.join(Show.rating_rel).filter(Rating.name == rating)
    
    # Year filter
    if year_from:
        query = query.filter(Show.release_year >= year_from)
    if year_to:
        query = query.filter(Show.release_year <= year_to)
    
    # Country filter
    if country:
        query = query.filter(Show.country.ilike(f"%{country}%"))
    
    # Get total count
    total = query.count()
    
    # Pagination
    offset = (page - 1) * per_page
    shows = query.order_by(Show.title).offset(offset).limit(per_page).all()
    
    # Convert to response
    items = []
    for show in shows:
        show_dict = {
            "id": show.id,
            "show_id": show.show_id,
            "type": show.type,
            "title": show.title,
            "director": show.director,
            "cast": show.cast,
            "country": show.country,
            "date_added": show.date_added,
            "release_year": show.release_year,
            "rating": show.rating_rel.name if show.rating_rel else None,
            "duration": show.duration,
            "listed_in": show.listed_in,
            "description": show.description,
            "categories": [{"id": c.id, "name": c.name} for c in show.categories]
        }
        items.append(ShowResponse(**show_dict))
    
    pages = (total + per_page - 1) // per_page
    
    return PaginatedShowsResponse(
        items=items,
        total=total,
        page=page,
        per_page=per_page,
        pages=pages
    )


@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all categories"""
    categories = db.query(Category).order_by(Category.name).all()
    return categories


@router.get("/ratings", response_model=List[RatingResponse])
def get_ratings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all ratings"""
    ratings = db.query(Rating).order_by(Rating.name).all()
    return ratings


@router.get("/types", response_model=List[str])
def get_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all show types"""
    types = db.query(Show.type).distinct().all()
    return [t[0] for t in types if t[0]]


@router.get("/countries", response_model=List[str])
def get_countries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all countries"""
    countries = db.query(Show.country).distinct().all()
    unique_countries = set()
    for c in countries:
        if c[0]:
            for country in c[0].split(","):
                unique_countries.add(country.strip())
    return sorted(list(unique_countries))


@router.get("/years", response_model=dict)
def get_year_range(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get min and max release years"""
    result = db.query(
        func.min(Show.release_year),
        func.max(Show.release_year)
    ).first()
    return {"min": result[0], "max": result[1]}


@router.get("/{show_id}", response_model=ShowResponse)
def get_show(
    show_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a single show by ID"""
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Show not found")
    
    return ShowResponse(
        id=show.id,
        show_id=show.show_id,
        type=show.type,
        title=show.title,
        director=show.director,
        cast=show.cast,
        country=show.country,
        date_added=show.date_added,
        release_year=show.release_year,
        rating=show.rating_rel.name if show.rating_rel else None,
        duration=show.duration,
        listed_in=show.listed_in,
        description=show.description,
        categories=[{"id": c.id, "name": c.name} for c in show.categories]
    )

