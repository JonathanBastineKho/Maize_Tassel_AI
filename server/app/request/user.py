from pydantic import BaseModel

class UserRequest(BaseModel):
    email: str

class UserCreateRequest(UserRequest):
    password: str