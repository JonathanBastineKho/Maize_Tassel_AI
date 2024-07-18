from app.database import SessionLocal, engine, Base
from app.database.schema import TypeOfUser
from sqlalchemy import inspect
from bcrypt import hashpw, gensalt
from config import Config
from .schema import User, Model
from datetime import datetime, timezone

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_database(engine=engine, base=Base):
    if inspect(engine).get_table_names():
        return
    base.metadata.create_all(bind=engine)

    # Create admin
    db = SessionLocal()
    password_hash = hashpw(Config.ADMIN_PASSWORD.encode('utf-8'), gensalt())
    admin = User(email=Config.ADMIN_EMAIL, name="admin", password=password_hash, role=TypeOfUser.ADMIN, verified=True)
    db.add(admin)

    # Adding default model
    default_model = Model(version=0, finish_train_date=datetime.now(timezone.utc), test_map=0.901, test_mae=5.87, model_url="admin/models/yolov9e-0.pt", deployed=True, run_id=Config.INITIAL_RUN_ID)
    db.add(default_model)

    db.commit()
    db.close()

def drop_database(engine=engine, base=Base):
    base.metadata.drop_all(bind=engine)