from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from models import RoleEnum

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[RoleEnum] = None

# --- User Schemas ---
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    role: RoleEnum = RoleEnum.Investigator

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

# --- Case Schemas ---
class CaseBase(BaseModel):
    case_number: str = Field(..., max_length=50)
    title: str = Field(..., max_length=200)
    suspect_name: Optional[str] = None
    status: str = "Open"

class CaseCreate(CaseBase):
    pass

class CaseResponse(CaseBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Network Forensic Schemas ---
class NetworkForensicResponse(BaseModel):
    id: int
    case_id: int
    parsed_data: dict
    created_at: datetime

    class Config:
        from_attributes = True
