# Netflix Catalog 🎬

Веб-приложение для работы с каталогом Netflix


## Быстрый старт

```bash
docker compose up --build
```

Приложение доступно по адресу: http://localhost:8000

## Функционал

- Авторизация
- Поиск
- Фильтры:
  - По типу контента
  - По категориям
  - По рейтингу
  - По году выпуска
- Пагинация

## Демо-аккаунт

- Username: demo
- Password: demo123

## Технологии

- Backend: FastAPI, SQLAlchemy, Pydantic
- Database: PostgreSQL 15
- Frontend: HTML5, CSS3, JavaScript (Vanilla)
- Data Processing: Pandas
- Containerization: Docker, Docker Compose

## База данных

### Таблицы

- users - Пользователи
- shows - Фильмы и сериалы
- categories - Категории
- ratings - Возрастные рейтинги
- show_categories - Связь фильмов с категориями

## API Endpoints

### Авторизация

- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Информация о текущем пользователе

### Каталог

- `GET /api/shows/` - Список фильмов/сериалов с фильтрами
- `GET /api/shows/{id}` - Информация о конкретном фильме
- `GET /api/shows/categories` - Список категорий
- `GET /api/shows/ratings` - Список рейтингов
- `GET /api/shows/types` - Список типов контента
- `GET /api/shows/countries` - Список стран
- `GET /api/shows/years` - Диапазон годов

## Docker Commands

```bash
docker compose up --build
docker compose up -d --build
docker compose down
docker compose down -v
docker compose logs -f
docker compose restart app
```

## Переменные окружения

DATABASE_URL - URL подключения к PostgreSQL
SECRET_KEY - Секретный ключ для JWT
CSV_PATH - Путь к CSV файлу /app/data/netflix.csv
