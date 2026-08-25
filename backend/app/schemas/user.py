from typing import Optional
import datetime
from pydantic import BaseModel, EmailStr, ConfigDict

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    currency: Optional[str] = "VND"
    avatar_url: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    currency: Optional[str] = "VND"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    currency: Optional[str] = None
    avatar_url: Optional[str] = None

class PasswordChange(BaseModel):
    old_password: str
    new_password: str

class UserOut(UserBase):
    id: int
    role: str
    status: Optional[str] = "ACTIVE"
    plan: Optional[str] = "FREE"
    plan_tier: Optional[str] = "Free"
    plan_activated_at: Optional[datetime.datetime] = None
    plan_expires_at: Optional[datetime.datetime] = None
    is_plan_active: Optional[bool] = True
    days_remaining: Optional[int] = None
    plan_name: Optional[str] = None
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
