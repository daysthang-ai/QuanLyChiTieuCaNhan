from typing import Optional
import datetime
from pydantic import BaseModel, Field, ConfigDict

class WalletBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    wallet_type: str = Field("BANK", description="CASH, BANK, EWALLET, SAVINGS")
    balance: float = Field(0.0, description="Initial or current balance")
    currency: Optional[str] = "VND"
    account_number_masked: Optional[str] = None
    icon: Optional[str] = "wallet"
    color: Optional[str] = "#3B82F6"
    is_active: Optional[bool] = True
    wallet_scope: Optional[str] = Field("virtual", description="'virtual' for sandbox ledger, 'real' for service/VIP payments")
    is_linked: Optional[bool] = False
    bank_code: Optional[str] = None
    auto_debit_enabled: Optional[bool] = False
    linked_at: Optional[datetime.datetime] = None

class WalletCreate(WalletBase):
    pass

class WalletUpdate(BaseModel):
    name: Optional[str] = None
    wallet_type: Optional[str] = None
    balance: Optional[float] = None
    account_number_masked: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: Optional[bool] = None
    wallet_scope: Optional[str] = None
    is_linked: Optional[bool] = None
    bank_code: Optional[str] = None
    auto_debit_enabled: Optional[bool] = None

class WalletTransfer(BaseModel):
    from_wallet_id: int
    to_wallet_id: int
    amount: float = Field(..., gt=0)
    note: Optional[str] = "Chuyển tiền giữa các ví"
    date: Optional[datetime.datetime] = None

class WalletDeposit(BaseModel):
    amount: float = Field(..., gt=0, description="Số tiền nạp vào ví (VND)")
    source: Optional[str] = Field("BANK_LINK", description="BANK_LINK, CASH, QR_CODE")
    note: Optional[str] = "Nạp tiền vào ví"

class BankLinkRequest(BaseModel):
    bank_code: str = Field(..., description="Mã ngân hàng (TCB, VCB, MB, VPB, MOMO, ACB, BIDV, ...)")
    bank_name: str = Field(..., description="Tên ngân hàng")
    account_number: str = Field(..., min_length=4, description="Số tài khoản / Số thẻ")
    account_holder: str = Field(..., description="Tên chủ tài khoản")
    initial_balance: Optional[float] = Field(5000000.0, description="Số dư liên kết ban đầu")
    auto_debit_consent: bool = Field(True, description="Chấp thuận trích nợ tự động")

class WalletOut(WalletBase):
    id: int
    user_id: int
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)
