from app.database import SessionLocal, engine, Base

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_database(engine=engine, base=Base):
    base.metadata.create_all(bind=engine)

def drop_database(engine=engine, base=Base):
    base.metadata.drop_all(bind=engine)