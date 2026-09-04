import re
from typing import List, Dict, Any

def mask_account_number(account_num: str) -> str:
    """Masks a bank account or card number to keep only the last 4 digits (e.g., ****1234)."""
    if not account_num:
        return "****"
    clean = re.sub(r"\D", "", account_num)
    if len(clean) <= 4:
        return "****" + clean
    return "*" * min(len(clean) - 4, 12) + clean[-4:]

def sanitize_text_for_ai(text: str) -> str:
    """
    Zero-PII Engine: Strips or masks all sensitive Personal Identifiable Information (PII)
    including Phone numbers, Email addresses, Credit/Debit card numbers, Bank account numbers,
    Citizen ID (CCCD/CMND), and Real Full Names before sending to LLM APIs (Google Gemini, OpenAI, etc.).
    """
    if not text:
        return ""

    sanitized = str(text)

    # 1. Mask Email addresses
    sanitized = re.sub(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", "[EMAIL ĐÃ ẨN]", sanitized)

    # 2. Mask Vietnamese and International Phone numbers (e.g. 0901234567, 090.123.4567, +84 901 234 567)
    sanitized = re.sub(r"(\+?84|0)([\s.-]?)(3|5|7|8|9)([\s.-]?\d){8}\b", "[SỐ ĐIỆN THOẠI ĐÃ ẨN]", sanitized)

    # 3. Mask Credit/Debit card formats (e.g. 1234-5678-9012-3456 or 1234 5678 9012 3456)
    sanitized = re.sub(r"\b(?:\d{4}[ -]?){3}\d{4}\b", "[SỐ THẺ NGÂN HÀNG ĐÃ ẨN]", sanitized)

    # 4. Mask Bank account numbers (9 to 19 consecutive digits)
    sanitized = re.sub(r"\b\d{9,19}\b", lambda m: mask_account_number(m.group(0)), sanitized)

    # 5. Mask Citizen Identification (CCCD 12 digits)
    sanitized = re.sub(r"\b\d{12}\b", "[CCCD ĐÃ ẨN]", sanitized)

    # 6. Mask explicit personal name labels in financial records
    sanitized = re.sub(r"(?i)(chủ\s*tài\s*khoản|người\s*nhận|tên\s*chủ\s*tk|chủ\s*tk|người\s*gửi|chủ\s*thẻ)[\s:]+([A-ZÀ-Ỹa-zà-ỹ\s]+)(?=[\n,\.;]|$)", r"\1: [TÊN ĐÃ ẨN]", sanitized)
    sanitized = re.sub(r"(?i)\bDANG\s+QUYET\s+THANG\b", "[CHỦ HỆ THỐNG ĐÃ ẨN]", sanitized)

    # 7. Mask OTP & Security tokens
    sanitized = re.sub(r"(?i)\b(mã\s*otp|mã\s*xác\s*thực|otp)[\s:]+(\d{4,8})\b", r"\1: [OTP ĐÃ ẨN]", sanitized)

    return sanitized

def format_currency_vnd(amount: float) -> str:
    """Formats a float to VND standard display, e.g., 1,500,000 đ."""
    return f"{amount:,.0f} đ".replace(",", ".")
