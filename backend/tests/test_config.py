from app.core.config import Settings


def test_postgres_scheme_is_normalised_for_sqlalchemy_2():
    s = Settings(DATABASE_URL="postgres://u:p@host:5432/db")
    assert s.DATABASE_URL == "postgresql://u:p@host:5432/db"


def test_other_database_urls_are_left_alone():
    assert Settings(DATABASE_URL="postgresql://u:p@h/db").DATABASE_URL == "postgresql://u:p@h/db"
    assert Settings(DATABASE_URL="sqlite:///./x.db").DATABASE_URL == "sqlite:///./x.db"


def test_cors_origins_are_split_and_trimmed():
    s = Settings(CORS_ORIGINS="https://a.com, https://b.com ,")
    assert s.cors_origin_list == ["https://a.com", "https://b.com"]
