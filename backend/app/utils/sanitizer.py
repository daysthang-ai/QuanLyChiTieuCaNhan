import re
from typing import List, Dict, Any

def mask_account_number(account_num: str) -> str:
    """Masks a bank account number to keep only the last 4 digits (e.g., ****1234)."""
    if not account_num:
        return "****"
    clean = re.sub(r"\D", "", account_num)
    if len(clean) <= 4:
        return "****" + clean
    return "*" * (len(clean) - 4) + clean[-4:]

def sanitize_text_for_ai(text: str) -> str:
    """
    Strips or masks sensitive PII (Phone numbers, Email addresses, Credit card / Bank numbers)
    from text before sending to LLMs.
    """
    if not text:
        return ""
    
    # Mask email addresses
    text = re.sub(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", "[EMAIL ĐÃ ẨN]", text)

    # Mask phone numbers (e.g. 0901234567, +84901234567)
    text = re.sub(r"(\+84|0)(3|5|7|8|9)\d{8}\b", "[SỐ ĐIỆN THOẠI ĐÃ ẨN]", text)

    # Mask potential bank account / card numbers (9 to 19 consecutive digits)
    text = re.sub(r"\b\d{9,19}\b", lambda m: mask_account_number(m.group(0)), text)
    
    return text

def format_currency_vnd(amount: float) -> str:
    """Formats a float to VND standard display, e.g., 1,500,000 đ."""
    return f"{amount:,.0f} đ".replace(",", ".")
