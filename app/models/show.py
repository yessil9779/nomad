from sqlalchemy import Column, Integer, String, Text, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.database import Base


show_categories = Table(
    'show_categories',
    Base.metadata,
    Column('show_id', Integer, ForeignKey('shows.id'), primary_key=True),
    Column('category_id', Integer, ForeignKey('categories.id'), primary_key=True)
)


class Category(Base):
    __tablename__ = 'categories'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    
    shows = relationship('Show', secondary=show_categories, back_populates='categories')


class Rating(Base):
    __tablename__ = 'ratings'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), unique=True, index=True, nullable=False)
    
    shows = relationship('Show', back_populates='rating_rel')


class Show(Base):
    __tablename__ = 'shows'
    
    id = Column(Integer, primary_key=True, index=True)
    show_id = Column(String(50), unique=True, index=True, nullable=False)
    type = Column(String(20), index=True, nullable=False)
    title = Column(String(500), index=True, nullable=False)
    director = Column(String(500), nullable=True)
    cast = Column(Text, nullable=True)
    country = Column(String(500), nullable=True)
    date_added = Column(String(100), nullable=True)
    release_year = Column(Integer, index=True, nullable=True)
    rating_id = Column(Integer, ForeignKey('ratings.id'), nullable=True)
    duration = Column(String(50), nullable=True)
    listed_in = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    
    rating_rel = relationship('Rating', back_populates='shows')
    categories = relationship('Category', secondary=show_categories, back_populates='shows')

