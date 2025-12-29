"""
Script to load Netflix data from CSV into the database
"""
import pandas as pd
import sys
import os
import time

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app.models.show import Show, Category, Rating
from app.models.user import User
from app.services.auth import get_password_hash


def wait_for_db(max_retries=30, delay=2):
    """Wait for database to be ready"""
    from sqlalchemy import text
    for i in range(max_retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("Database is ready!")
            return True
        except Exception as e:
            print(f"Waiting for database... ({i+1}/{max_retries})")
            time.sleep(delay)
    raise Exception("Database not available after maximum retries")


def load_data(csv_path: str):
    """Load data from CSV file into database"""
    
    # Wait for database
    wait_for_db()
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")
    
    # Read CSV
    print(f"Reading CSV file: {csv_path}")
    df = pd.read_csv(csv_path)
    
    # Clean data - replace NaN with None
    df = df.where(pd.notnull(df), None)
    
    print(f"Found {len(df)} records in CSV")
    
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_count = db.query(Show).count()
        if existing_count > 0:
            print(f"Database already contains {existing_count} shows. Skipping data load.")
            create_default_user(db)
            return
        
        # Create ratings
        print("Creating ratings...")
        ratings_set = set()
        for rating in df['rating'].dropna().unique():
            if rating and str(rating).strip():
                ratings_set.add(str(rating).strip())
        
        ratings_map = {}
        for rating_name in ratings_set:
            rating_obj = Rating(name=rating_name)
            db.add(rating_obj)
            db.flush()
            ratings_map[rating_name] = rating_obj
        
        # Create categories
        print("Creating categories...")
        categories_set = set()
        for listed_in in df['listed_in'].dropna():
            if listed_in:
                for category in str(listed_in).split(','):
                    cat_name = category.strip()
                    if cat_name:
                        categories_set.add(cat_name)
        
        categories_map = {}
        for category_name in categories_set:
            category_obj = Category(name=category_name)
            db.add(category_obj)
            db.flush()
            categories_map[category_name] = category_obj
        
        # Create shows
        print("Creating shows...")
        for idx, row in df.iterrows():
            # Skip empty rows
            if pd.isna(row.get('show_id')) or pd.isna(row.get('title')):
                continue
            
            # Get rating
            rating_obj = None
            if row.get('rating') and str(row['rating']).strip():
                rating_obj = ratings_map.get(str(row['rating']).strip())
            
            # Get release year
            release_year = None
            if row.get('release_year'):
                try:
                    release_year = int(row['release_year'])
                except (ValueError, TypeError):
                    pass
            
            # Create show
            show = Show(
                show_id=str(row['show_id']),
                type=str(row['type']) if row.get('type') else 'Unknown',
                title=str(row['title']),
                director=str(row['director']) if row.get('director') else None,
                cast=str(row['cast']) if row.get('cast') else None,
                country=str(row['country']) if row.get('country') else None,
                date_added=str(row['date_added']) if row.get('date_added') else None,
                release_year=release_year,
                rating_id=rating_obj.id if rating_obj else None,
                duration=str(row['duration']) if row.get('duration') else None,
                listed_in=str(row['listed_in']) if row.get('listed_in') else None,
                description=str(row['description']) if row.get('description') else None
            )
            
            # Add categories
            if row.get('listed_in'):
                for category_name in str(row['listed_in']).split(','):
                    cat_name = category_name.strip()
                    if cat_name and cat_name in categories_map:
                        show.categories.append(categories_map[cat_name])
            
            db.add(show)
            
            if (idx + 1) % 100 == 0:
                print(f"Processed {idx + 1} records...")
        
        db.commit()
        print(f"Successfully loaded {db.query(Show).count()} shows!")
        print(f"Created {db.query(Category).count()} categories")
        print(f"Created {db.query(Rating).count()} ratings")
        
        # Create default user
        create_default_user(db)
        
    except Exception as e:
        db.rollback()
        print(f"Error loading data: {e}")
        raise
    finally:
        db.close()


def create_default_user(db: Session):
    """Create a default demo user"""
    # Check if user exists
    existing_user = db.query(User).filter(User.username == "demo").first()
    if existing_user:
        print("Demo user already exists")
        return
    
    # Create demo user
    demo_user = User(
        username="demo",
        email="demo@example.com",
        hashed_password=get_password_hash("demo123")
    )
    db.add(demo_user)
    db.commit()
    print("Created demo user: username='demo', password='demo123'")


if __name__ == "__main__":
    csv_path = os.environ.get("CSV_PATH", "/app/data/netflix.csv")
    load_data(csv_path)

