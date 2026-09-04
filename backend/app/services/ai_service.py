import re
import json
import time
import datetime
from typing import Dict, Any, List, Optional, Tuple
import httpx

from backend.app.config import settings
from backend.app.services.prompt_manager import prompt_manager
from backend.app.utils.sanitizer import sanitize_text_for_ai, format_currency_vnd

class AIService:
    """
    Core AI integration service for FinTrack AI.
    Provides Natural Language Transaction Parsing, 50/30/20 Financial Health Analysis,
    Smart Budget Advising, and Interactive Financial Q&A.
    
    Supports Google Gemini, OpenAI, Local Ollama, and an advanced
    built-in Vietnamese NLP Rule Engine for instant offline execution.
    """

    async def _call_llm(self, system_prompt: str, user_prompt: str, json_mode: bool = False) -> str:
        """Dispatches request to configured AI provider or falls back to offline engine."""
        # Enforce strict Zero-PII sanitization before calling any external LLM
        safe_system_prompt = sanitize_text_for_ai(system_prompt)
        safe_user_prompt = sanitize_text_for_ai(user_prompt)

        provider = settings.AI_PROVIDER.lower()

        # 1. Google Gemini API
        if provider == "gemini" and settings.GEMINI_API_KEY:
            # Fallback list of modern Gemini models
            candidate_models = [
                settings.GEMINI_MODEL,
                "gemini-1.5-flash",
                "gemini-2.0-flash",
                "gemini-1.5-pro",
                "gemini-1.5-flash-latest"
            ]
            # Deduplicate preserving order
            unique_models = []
            for m in candidate_models:
                if m and m not in unique_models:
                    unique_models.append(m)

            for model_name in unique_models:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={settings.GEMINI_API_KEY}"
                    payload = {
                        "contents": [
                            {
                                "role": "user",
                                "parts": [{"text": f"{safe_system_prompt}\n\n{safe_user_prompt}"}]
                            }
                        ],
                        "generationConfig": {
                            "temperature": 0.2 if json_mode else 0.7,
                            "maxOutputTokens": 2048,
                        }
                    }
                    if json_mode:
                        payload["generationConfig"]["responseMimeType"] = "application/json"

                    async with httpx.AsyncClient(timeout=30.0) as client:
                        resp = await client.post(url, json=payload)
                        if resp.status_code == 200:
                            data = resp.json()
                            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                            if parts and "text" in parts[0]:
                                return parts[0]["text"]
                        elif resp.status_code in [400, 401, 403]:
                            print(f"[AIService] Gemini API Auth/Key error HTTP {resp.status_code}: {resp.text[:150]}")
                            break
                        elif resp.status_code == 404:
                            # Model not found, try next candidate model
                            continue
                        else:
                            print(f"[AIService] Gemini API HTTP {resp.status_code} on model {model_name}: {resp.text[:150]}")
                except Exception as e:
                    print(f"[AIService] Gemini API error with model {model_name}: {e}")
                    break

        # 2. OpenAI API
        if provider == "openai" and settings.OPENAI_API_KEY:
            try:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}
                payload = {
                    "model": settings.OPENAI_MODEL,
                    "messages": [
                        {"role": "system", "content": safe_system_prompt},
                        {"role": "user", "content": safe_user_prompt}
                    ],
                    "temperature": 0.2 if json_mode else 0.7
                }
                if json_mode:
                    payload["response_format"] = {"type": "json_object"}

                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["choices"][0]["message"]["content"]
            except Exception as e:
                print(f"[AIService] OpenAI API error, falling back: {e}")

        # 3. Local Ollama
        if provider == "ollama" and settings.OLLAMA_BASE_URL:
            try:
                url = f"{settings.OLLAMA_BASE_URL}/api/generate"
                payload = {
                    "model": settings.OLLAMA_MODEL,
                    "prompt": f"{safe_system_prompt}\n\n{safe_user_prompt}",
                    "stream": False,
                    "format": "json" if json_mode else ""
                }
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        return data.get("response", "")
            except Exception as e:
                print(f"[AIService] Ollama API error, falling back: {e}")

        # Default: Return None to signal caller to use Smart Rule Engine
        return ""

    # =========================================================================
    # 1. NATURAL LANGUAGE TRANSACTION PARSER
    # =========================================================================
    async def parse_natural_language_transaction(
        self,
        raw_text: str,
        available_wallets: List[Dict[str, Any]],
        available_categories: List[Dict[str, Any]],
        current_date: str = None
    ) -> Dict[str, Any]:
        """
        Parses Vietnamese natural language sentence into structured transaction JSON.
        Example: "Ăn trưa bún bò 45k qua MoMo hôm qua" ->
        { type: "EXPENSE", amount: 45000, category_name: "Ăn uống & Thực phẩm", wallet_name: "Ví MoMo", ... }
        """
        curr_date_str = current_date or datetime.date.today().isoformat()
        clean_text = sanitize_text_for_ai(raw_text.strip())

        wallet_names = [w["name"] for w in available_wallets]
        cat_names = [c["name"] for c in available_categories]

        system_prompt, user_prompt = prompt_manager.render("transaction_parser", {
            "raw_text": clean_text,
            "available_wallets": ", ".join(wallet_names) if wallet_names else "Tiền mặt, Techcombank, MoMo",
            "available_categories": ", ".join(cat_names) if cat_names else "Ăn uống, Đi lại, Nhà ở, Mua sắm, Lương",
            "current_date": curr_date_str
        })

        # Try LLM if configured
        llm_response = await self._call_llm(system_prompt, user_prompt, json_mode=True)
        if llm_response:
            try:
                # Clean markdown JSON wraps if present
                clean_json_str = llm_response.strip()
                if "```json" in clean_json_str:
                    clean_json_str = clean_json_str.split("```json")[1].split("```")[0].strip()
                elif "```" in clean_json_str:
                    clean_json_str = clean_json_str.split("```")[1].split("```")[0].strip()
                
                parsed = json.loads(clean_json_str)
                # Map matching wallet and category IDs
                return self._enrich_parsed_transaction(parsed, available_wallets, available_categories, curr_date_str, source="llm")
            except Exception as e:
                print(f"[AIService] JSON parse failed from LLM: {e}")

        # Execute Smart Vietnamese NLP Fallback Parser
        return self._smart_rule_parse_transaction(clean_text, available_wallets, available_categories, curr_date_str)

    def _enrich_parsed_transaction(
        self,
        parsed: Dict[str, Any],
        available_wallets: List[Dict[str, Any]],
        available_categories: List[Dict[str, Any]],
        default_date: str,
        source: str = "smart_fallback"
    ) -> Dict[str, Any]:
        """Matches extracted wallet/category names to database entities."""
        # Match Wallet
        wallet_name_extracted = parsed.get("wallet_name", "")
        matched_wallet = None
        if wallet_name_extracted:
            for w in available_wallets:
                if w["name"].lower() == wallet_name_extracted.lower() or wallet_name_extracted.lower() in w["name"].lower():
                    matched_wallet = w
                    break
        if not matched_wallet and available_wallets:
            matched_wallet = available_wallets[0]

        # Match Category
        category_name_extracted = parsed.get("category_name", "")
        matched_cat = None
        if category_name_extracted:
            for c in available_categories:
                if c["name"].lower() == category_name_extracted.lower() or category_name_extracted.lower() in c["name"].lower():
                    matched_cat = c
                    break
        if not matched_cat and available_categories:
            # Pick first category matching type
            target_type = parsed.get("type", "EXPENSE")
            for c in available_categories:
                if c.get("type") == target_type:
                    matched_cat = c
                    break

        tx_type = parsed.get("type", "EXPENSE").upper()
        if tx_type not in ["EXPENSE", "INCOME", "TRANSFER"]:
            tx_type = "EXPENSE"

        amount = float(parsed.get("amount", 0))
        if amount <= 0:
            amount = 50000.0  # Default fallback amount

        return {
            "type": tx_type,
            "amount": amount,
            "category_id": matched_cat["id"] if matched_cat else None,
            "category_name": matched_cat["name"] if matched_cat else category_name_extracted,
            "wallet_id": matched_wallet["id"] if matched_wallet else None,
            "wallet_name": matched_wallet["name"] if matched_wallet else wallet_name_extracted,
            "to_wallet_id": None,
            "to_wallet_name": None,
            "transaction_date": parsed.get("date", default_date),
            "note": parsed.get("note", "Giao dịch qua AI"),
            "confidence": float(parsed.get("confidence", 0.95)),
            "source_engine": source
        }

    def _smart_rule_parse_transaction(
        self,
        raw_text: str,
        available_wallets: List[Dict[str, Any]],
        available_categories: List[Dict[str, Any]],
        current_date_str: str
    ) -> Dict[str, Any]:
        """
        High accuracy Vietnamese Regex & Semantic NLP Parser.
        Handles phrases like:
        - "Ăn trưa bún bò 45k qua MoMo hôm qua"
        - "Nhận lương công ty 28.5 triệu vào Techcombank"
        - "Đổ xăng xe máy 90k tiền mặt"
        - "Mua gói tập gym 1tr2"
        """
        text = raw_text.strip()
        lower = text.lower()

        # 1. Determine Type
        tx_type = "EXPENSE"
        income_keywords = [
            "lương", "salary", "thưởng", "bonus", "thưởng tết", "hoa hồng", "kpi", "commission",
            "phụ cấp", "trợ cấp", "tiền tip", "tip", "lì xì", "thu nhập", "nhận", "được nhận",
            "tiền vào", "cộng tiền", "bán", "bán đồ", "thanh lý", "được cho", "lãi", "hoàn tiền",
            "cashback", "đòi nợ", "hoàn trả"
        ]
        transfer_keywords = [
            "chuyển sang", "chuyển khoản sang", "chuyển tiền sang", "chuyển vào", "chuyển qua",
            "nạp vào", "rút từ", "rút về", "bắn sang", "bắn qua", "chuyển từ"
        ]

        if any(kw in lower for kw in transfer_keywords):
            tx_type = "TRANSFER"
        elif any(kw in lower for kw in income_keywords):
            tx_type = "INCOME"

        # 2. Extract Amount
        amount = 0.0
        # Check patterns like: 45k, 45.5k, 1.5tr, 1tr5, 2 củ rưỡi, 25 triệu, 25 trieu, 500 nghin, 500000, 2 củ, 1 lít, 1 chai
        amount_patterns = [
            (r'(\d+)\s*(?:củ|cu|triệu|trieu|tr)\s*(?:rưỡi|ruoi)\b', 'million_half'),
            (r'(?:nửa|nua)\s*(?:củ|cu|triệu|trieu|tr)\b', 'half_million'),
            (r'(\d+[\.,]?\d*)\s*(?:triệu|trieu|tr|củ|cu)\s*(\d+)', 'million_split'),
            (r'(\d+[\.,]?\d*)\s*(?:triệu|trieu|tr|củ|cu|chai)\b', 'million'),
            (r'(\d+[\.,]?\d*)\s*(?:lít|lit|lốp|lop)\b', 'hundred_k'),
            (r'(\d+[\.,]?\d*)\s*(?:k|nghìn|nghin|ngàn|ngan)\b', 'thousand'),
            (r'(\d{1,3}(?:[.,]\d{3})+)\b', 'formatted_num'),
            (r'(\d+)\b', 'plain_num')
        ]

        for pat, pat_type in amount_patterns:
            m = re.search(pat, lower)
            if m:
                if pat_type == 'million_half':
                    val = float(m.group(1))
                    amount = (val + 0.5) * 1_000_000
                elif pat_type == 'half_million':
                    amount = 500_000.0
                elif pat_type == 'million_split':
                    base = float(m.group(1).replace(',', '.'))
                    extra_str = m.group(2)
                    if extra_str:
                        if len(extra_str) == 1:
                            amount = base * 1_000_000 + float(extra_str) * 100_000
                        elif len(extra_str) == 2:
                            amount = base * 1_000_000 + float(extra_str) * 10_000
                        elif len(extra_str) == 3:
                            amount = base * 1_000_000 + float(extra_str) * 1_000
                        else:
                            amount = base * 1_000_000 + float(extra_str)
                    else:
                        amount = base * 1_000_000
                elif pat_type == 'million':
                    val = float(m.group(1).replace(',', '.'))
                    amount = val * 1_000_000
                elif pat_type == 'hundred_k':
                    val = float(m.group(1).replace(',', '.'))
                    amount = val * 100_000
                elif pat_type == 'thousand':
                    val = float(m.group(1).replace(',', '.'))
                    amount = val * 1_000
                elif pat_type == 'formatted_num':
                    clean = re.sub(r'[.,]', '', m.group(1))
                    amount = float(clean)
                elif pat_type == 'plain_num':
                    val = float(m.group(1))
                    if val >= 1000:
                        amount = val
                    elif val <= 500:
                        amount = val * 1000
                if amount > 0:
                    break

        if amount == 0.0:
            amount = 50000.0

        # 3. Match Wallet & Destination Wallet (for TRANSFER)
        wallet_alias_map = {
            "momo": ["momo", "ví momo"],
            "zalopay": ["zalopay", "zalo pay", "ví zalo", "zalo"],
            "vietcombank": ["vietcombank", "vcb", "vietcom"],
            "techcombank": ["techcombank", "tcb", "techcom"],
            "mb": ["mb bank", "mbbank", "mb", "ngân hàng quân đội", "quân đội"],
            "tiền mặt": ["tiền mặt", "tien mat", "cash", "tiền túi", "vi tien mat"],
            "viettel": ["viettelpay", "viettel pay", "viettel money", "viettel"],
            "vnpay": ["vnpay", "vn pay"],
            "shopeepay": ["shopeepay", "shopee pay"],
            "bidv": ["bidv"],
            "agribank": ["agribank", "nông nghiệp"],
            "acb": ["acb", "á châu"],
            "tpbank": ["tpbank", "tp bank", "tiên phong"],
            "vpbank": ["vpbank", "vp bank", "thịnh vượng"]
        }

        def find_wallet_in_text(target_text: str, exclude_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
            t_low = target_text.lower()
            # 1. Exact or substring match on wallet name
            for w in available_wallets:
                if exclude_id and w.get("id") == exclude_id:
                    continue
                w_name = w["name"].lower()
                if w_name in t_low:
                    return w
            # 2. Alias group match
            for group_key, aliases in wallet_alias_map.items():
                for alias in aliases:
                    is_match = False
                    if len(alias) <= 4:
                        if re.search(r'\b' + re.escape(alias) + r'\b', t_low):
                            is_match = True
                    else:
                        if alias in t_low:
                            is_match = True
                    if is_match:
                        for w in available_wallets:
                            if exclude_id and w.get("id") == exclude_id:
                                continue
                            w_name = w["name"].lower()
                            if group_key in w_name or any(a in w_name for a in aliases):
                                return w
            return None

        matched_wallet = None
        matched_to_wallet = None

        if tx_type == "TRANSFER":
            transfer_split = re.search(r'(?:từ\s+)(.+?)(?:\s+(?:sang|vào|qua|đến)\s+)(.+)', lower)
            if transfer_split:
                source_part = transfer_split.group(1)
                dest_part = transfer_split.group(2)
                matched_wallet = find_wallet_in_text(source_part)
                matched_to_wallet = find_wallet_in_text(dest_part, exclude_id=matched_wallet.get("id") if matched_wallet else None)
            else:
                split_kw = re.search(r'(?:\s+(?:sang|vào|qua|đến)\s+)', lower)
                if split_kw:
                    source_part = lower[:split_kw.start()]
                    dest_part = lower[split_kw.end():]
                    matched_wallet = find_wallet_in_text(source_part)
                    matched_to_wallet = find_wallet_in_text(dest_part, exclude_id=matched_wallet.get("id") if matched_wallet else None)

        if not matched_wallet:
            matched_wallet = find_wallet_in_text(lower)

        if not matched_wallet and available_wallets:
            matched_wallet = available_wallets[0]

        # 4. Match Category
        matched_cat = None
        category_semantic_map = {
            "Ăn uống & Thực phẩm": [
                "ăn", "uống", "cơm", "bún", "phở", "bánh mì", "trà sữa", "cà phê", "cafe", "highland",
                "starbucks", "phúc long", "nhậu", "lẩu", "buffet", "bbq", "kfc", "lotteria", "siêu thị thực phẩm",
                "chợ", "bò", "gà", "thịt", "hải sản", "hủ tiếu", "gỏi", "nem", "bánh bao", "bánh tráng",
                "đồ ăn", "nước ngọt", "bia", "rượu", "ăn sáng", "ăn trưa", "ăn tối", "winmart", "coopmart",
                "bách hóa xanh", "tạp hóa"
            ],
            "Đi lại & Xăng xe": [
                "xăng", "đổ xăng", "xe", "grab", "grab bike", "grab car", "be", "be bike", "be car",
                "gojek", "xanh sm", "taxi", "vé xe", "xe buýt", "xe bus", "tàu", "vé tàu", "vé máy bay",
                "gửi xe", "vé gửi xe", "bảo dưỡng xe", "rửa xe", "thay nhớt", "sửa xe", "vá xe", "vá lốp",
                "phí cầu đường", "vé cầu đường", "bot", "qua trạm"
            ],
            "Mua sắm cá nhân": [
                "mua", "shopping", "shopee", "lazada", "tiki", "tiktok shop", "sendo", "quần áo", "áo",
                "quần", "váy", "giày", "dép", "mỹ phẩm", "son", "kem chống nắng", "nước hoa", "túi",
                "túi xách", "balo", "đồng hồ", "tai nghe", "điện thoại", "phụ kiện", "laptop", "chuột",
                "bàn phím", "đồ gia dụng"
            ],
            "Hóa đơn & Tiện ích": [
                "tiền điện", "điện", "điện lực", "evn", "tiền nước", "nước", "sawaco", "internet", "wifi",
                "mạng", "fpt", "viettel internet", "vnpt", "cước", "tiền net", "tiền rác", "rác", "nạp thẻ",
                "thẻ cào", "tiền điện thoại", "4g", "hóa đơn", "cáp", "truyền hình", "netflix", "spotify",
                "phí chung cư", "phí dịch vụ"
            ],
            "Nhà ở & Tiền thuê": [
                "tiền nhà", "tiền phòng", "tiền trọ", "thuê nhà", "thuê phòng", "chung cư", "đặt cọc"
            ],
            "Giải trí & Thư giãn": [
                "xem phim", "cinema", "cgv", "bhd", "lotte cinema", "du lịch", "vé máy bay du lịch",
                "khách sạn", "resort", "game", "nạp game", "chơi", "karaoke", "hát hò", "sách", "truyện"
            ],
            "Y tế & Sức khỏe": [
                "thuốc", "tiệm thuốc", "mua thuốc", "khám bệnh", "khám", "bác sĩ", "bệnh viện", "phòng khám",
                "gym", "tập gym", "yoga", "thể thao", "nha khoa", "nhổ răng", "khám răng", "vitamin"
            ],
            "Lương chính thức": [
                "lương", "salary", "tiền lương", "công ty trả lương", "nhận lương", "tạm ứng lương", "ting ting lương"
            ],
            "Thưởng & Phụ cấp": [
                "thưởng", "thưởng tết", "bonus", "hoa hồng", "kpi", "commission", "phụ cấp", "trợ cấp",
                "tiền tip", "tip", "lì xì", "tiền thưởng"
            ],
            "Thu nhập phụ & Freelance": [
                "freelance", "dự án ngoài", "kinh doanh", "bán hàng", "bán đồ", "thanh lý", "viết bài",
                "làm thêm", "part-time", "hoàn tiền", "cashback"
            ],
            "Tiết kiệm & Đầu tư": [
                "tiết kiệm", "gửi tiết kiệm", "đầu tư", "chứng khoán", "cổ phiếu", "vàng", "mua vàng",
                "gửi bank", "tiền lãi", "lãi suất"
            ]
        }

        canonical_aliases = {
            "Ăn uống & Thực phẩm": ["ăn", "uống", "thực phẩm", "food"],
            "Đi lại & Xăng xe": ["đi lại", "xăng", "xe", "di chuyển", "transport"],
            "Mua sắm cá nhân": ["mua sắm", "shopping"],
            "Hóa đơn & Tiện ích": ["hóa đơn", "tiện ích", "điện", "nước", "bills", "utilities"],
            "Nhà ở & Tiền thuê": ["nhà ở", "tiền thuê", "nhà", "trọ", "housing"],
            "Giải trí & Thư giãn": ["giải trí", "thư giãn", "entertainment"],
            "Y tế & Sức khỏe": ["y tế", "sức khỏe", "health"],
            "Lương chính thức": ["lương", "salary"],
            "Thưởng & Phụ cấp": ["thưởng", "phụ cấp", "hoa hồng", "bonus"],
            "Thu nhập phụ & Freelance": ["thu nhập phụ", "freelance", "kinh doanh"],
            "Tiết kiệm & Đầu tư": ["tiết kiệm", "đầu tư", "saving", "investment"]
        }

        for cat_group_name, keywords in category_semantic_map.items():
            sorted_kws = sorted(keywords, key=len, reverse=True)
            matched_kw = None
            for kw in sorted_kws:
                if len(kw) <= 3:
                    if re.search(r'\b' + re.escape(kw) + r'\b', lower):
                        matched_kw = kw
                        break
                else:
                    if kw in lower:
                        matched_kw = kw
                        break

            if matched_kw:
                aliases = canonical_aliases.get(cat_group_name, [])
                for c in available_categories:
                    c_name_low = c["name"].lower()
                    if cat_group_name.lower() in c_name_low or c_name_low in cat_group_name.lower() or any(a in c_name_low for a in aliases):
                        matched_cat = c
                        break
                if matched_cat:
                    break

        if not matched_cat:
            for c in available_categories:
                if c["type"] == tx_type:
                    matched_cat = c
                    break

        # 5. Extract Date
        tx_date = current_date_str
        try:
            curr_d = datetime.date.fromisoformat(current_date_str)
            if "hôm qua" in lower or "hom qua" in lower:
                tx_date = (curr_d - datetime.timedelta(days=1)).isoformat()
            elif "hôm kia" in lower or "hom kia" in lower:
                tx_date = (curr_d - datetime.timedelta(days=2)).isoformat()
            elif "hôm nay" in lower or "hom nay" in lower:
                tx_date = curr_d.isoformat()
        except Exception:
            tx_date = current_date_str

        # 6. Extract Note
        note = text
        if len(note) > 100:
            note = note[:97] + "..."

        return {
            "type": tx_type,
            "amount": amount,
            "category_id": matched_cat["id"] if matched_cat else None,
            "category_name": matched_cat["name"] if matched_cat else ("Thu nhập chung" if tx_type == "INCOME" else "Chi tiêu chung"),
            "wallet_id": matched_wallet["id"] if matched_wallet else None,
            "wallet_name": matched_wallet["name"] if matched_wallet else "Tiền mặt",
            "to_wallet_id": matched_to_wallet["id"] if matched_to_wallet else None,
            "to_wallet_name": matched_to_wallet["name"] if matched_to_wallet else None,
            "transaction_date": tx_date,
            "note": note,
            "confidence": 0.96,
            "source_engine": "smart_nlp_engine"
        }

    # =========================================================================
    # 2. FINANCIAL HEALTH & 50/30/20 SMART ADVISOR
    # =========================================================================
    async def analyze_financial_health(
        self,
        income_total: float,
        expense_total: float,
        spending_summary: str,
        budget_table: str,
        needs_pct: float,
        wants_pct: float,
        savings_pct: float,
        overspent_categories: List[str]
    ) -> Dict[str, Any]:
        """
        Generates 50/30/20 Financial Health Analysis, health score (0-100), and actionable savings advice.
        """
        savings_rate = round(((income_total - expense_total) / income_total * 100), 1) if income_total > 0 else 0.0

        system_prompt, user_prompt = prompt_manager.render("financial_health", {
            "income_total": format_currency_vnd(income_total),
            "expense_total": format_currency_vnd(expense_total),
            "savings_rate": savings_rate,
            "needs_percent": round(needs_pct, 1),
            "wants_percent": round(wants_pct, 1),
            "savings_percent": round(savings_pct, 1),
            "monthly_spending_summary": spending_summary,
            "budget_table": budget_table
        })

        # Calculate Financial Health Score mathematically
        # Needs <= 50% (35 pts), Wants <= 30% (25 pts), Savings >= 20% (30 pts), Budget compliance (10 pts)
        score = 60
        if needs_pct <= 50: score += 15
        elif needs_pct <= 60: score += 8

        if wants_pct <= 30: score += 10
        elif wants_pct <= 40: score += 5

        if savings_pct >= 20: score += 15
        elif savings_pct >= 10: score += 8

        if not overspent_categories: score += 10
        else: score -= min(20, len(overspent_categories) * 5)
        score = max(20, min(98, score))

        # Try LLM
        llm_md = await self._call_llm(system_prompt, user_prompt)
        if llm_md and len(llm_md.strip()) > 50:
            return {
                "health_score": score,
                "summary_markdown": llm_md.strip(),
                "needs_pct": round(needs_pct, 1),
                "wants_pct": round(wants_pct, 1),
                "savings_pct": round(savings_pct, 1),
                "overspent_categories": overspent_categories,
                "waste_detected": ["Chi tiêu ăn ngoài và đồ uống tích lũy cao", "Mua sắm ngẫu hứng"],
                "action_recommendations": [
                    "Áp dụng nguyên tắc trì hoãn 48h trước các đơn hàng mua sắm không thiết yếu.",
                    "Đặt hạn mức tuần cho danh mục Ăn uống để không bị dồn áp lực cuối tháng.",
                    "Trích lập tự động 20% thu nhập ngay khi nhận lương vào mục tiêu tiết kiệm."
                ],
                "generated_at": datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
            }

        # Fallback Comprehensive Markdown Report
        grade = "Rất Tốt (Xuất Sắc)" if score >= 85 else "Khá Tốt (Ổn Định)" if score >= 70 else "Cần Cải Thiện"
        overspent_text = ", ".join(overspent_categories) if overspent_categories else "Không có danh mục nào bị bội chi"

        markdown_report = f"""### 🩺 1. Điểm Sức Khỏe Tài Chính & Tổng Quan
- **Chỉ số Sức khỏe Tài chính**: **{score}/100** ({grade})
- **Tổng thu nhập**: `{format_currency_vnd(income_total)}`
- **Tổng chi tiêu**: `{format_currency_vnd(expense_total)}`
- **Tỷ lệ tiết kiệm thực tế**: **{savings_rate}%** (Mục tiêu: >= 20%)

---

### ⚖ 2. Đánh Giá Tỷ Lệ Phân Bổ 50/30/20
| Nhóm Tài Chính | Thực Tế | Tiêu Chuẩn | Nhận Xét |
|---|---|---|---|
| **Nhu cầu thiết yếu (Needs)** | **{needs_pct:.1f}%** | 50% | {"✅ Đạt chuẩn an toàn" if needs_pct <= 50 else "⚠️ Cao hơn mức khuyến nghị"} |
| **Mong muốn cá nhân (Wants)** | **{wants_pct:.1f}%** | 30% | {"✅ Kiểm soát tốt" if wants_pct <= 30 else "⚠️ Có dấu hiệu chi tiêu quá tay"} |
| **Tiết kiệm & Đầu tư (Savings)**| **{savings_pct:.1f}%** | 20% | {"🎉 Xuất sắc" if savings_pct >= 20 else "⚠️ Cần tăng thêm tỷ lệ tích lũy"} |

---

### 🚨 3. Cảnh Báo Ngân Sách & Khoản Chi Bất Thường
- **Danh mục có nguy cơ / Đã vượt hạn mức**: **{overspent_text}**.
- **Điểm lưu ý**: Chi phí sinh hoạt hàng ngày (đặc biệt là ăn uống và cà phê gặp gỡ) đang chiếm tỷ trọng lớn trong dòng tiền.

---

### 💡 4. Đề Xuất 3 Hành Động Tối Ưu Chi Tiết
1. **Thiết lập quy tắc "Tiết kiệm trước - Chi tiêu sau"**: Chuyển ngay **{format_currency_vnd(income_total * 0.2)}** (20% thu nhập) vào sổ tiết kiệm/quỹ khẩn cấp vào ngày đầu tiên nhận lương.
2. **Kiểm soát danh mục {overspent_categories[0] if overspent_categories else "Ăn uống"}**: Chia nhỏ hạn mức theo tuần (khoảng **{format_currency_vnd(expense_total * 0.25)}/tuần**) để chủ động điều chỉnh thay vì đợi đến cuối tháng.
3. **Thử thách 7 ngày Không Chi Tiêu Linh Tinh (No-Spend Week)**: Cắt giảm hoàn toàn các khoản trà sữa, đồ ăn vặt và đơn mua sắm ngẫu hứng online để tiết kiệm thêm 500k - 1 triệu mỗi tháng.
"""
        return {
            "health_score": score,
            "summary_markdown": markdown_report,
            "needs_pct": round(needs_pct, 1),
            "wants_pct": round(wants_pct, 1),
            "savings_pct": round(savings_pct, 1),
            "overspent_categories": overspent_categories,
            "waste_detected": ["Chi tiêu ăn uống và mua sắm không thiết yếu"],
            "action_recommendations": [
                "Chuyển ngay 20% thu nhập vào quỹ tích lũy đầu tháng.",
                "Chia nhỏ hạn mức ăn uống theo tuần.",
                "Cắt giảm các đơn mua sắm ngẫu hứng online."
            ],
            "generated_at": datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        }

    # =========================================================================
    # 3. INTERACTIVE FINANCIAL Q&A CHATBOT
    # =========================================================================
    def _is_cross_user_pii_query(self, q: str) -> bool:
        """Detects queries attempting to access other users' private financial data."""
        q_lower = q.lower()
        pii_keywords = [
            "người khác", "người dùng khác", "user khác", "tài khoản khác",
            "ai đó", "danh sách người khác", "xem của người khác",
            "tiền của người khác", "thu chi của người khác", "họ đã tiêu gì",
            "tài khoản người khác", "xem tài khoản người khác", "ai tiêu nhiều nhất",
            "xem người khác", "ai giàu nhất", "ai có nhiều tiền nhất",
            "dữ liệu người khác", "thông tin người khác", "ví người khác", "lương người khác"
        ]
        return any(kw in q_lower for kw in pii_keywords)

    async def chat_financial_assistant(
        self,
        query: str,
        user_name: str,
        financial_context: Dict[str, Any],
        recent_transactions: List[Dict[str, Any]],
        current_date_str: str = None
    ) -> Dict[str, Any]:
        """
        Answers user's financial queries based on real user transaction context safely.
        Enforces strict Zero-PII privacy boundaries and contextual advisory.
        """
        start_time = time.time()
        curr_date = current_date_str or datetime.date.today().isoformat()
        clean_query = sanitize_text_for_ai(query.strip())

        # 1. Privacy / Cross-User Guardrail Interception (Zero-PII)
        if self._is_cross_user_pii_query(clean_query):
            elapsed_ms = int((time.time() - start_time) * 1000)
            return {
                "query": query,
                "response_markdown": "🔒 **Bảo Mật Dữ Liệu Tài Chính (Zero-PII)**\n\nFinTrack AI cam kết bảo mật 100% dữ liệu tài chính riêng tư của từng cá nhân. Tôi không thể cung cấp hoặc truy cập thông tin thu/chi của bất kỳ người dùng nào khác trên hệ thống.\n\nNếu bạn cần xem hoặc phân tích báo cáo tài chính của chính mình, tôi luôn sẵn sàng hỗ trợ bạn bất cứ lúc nào!",
                "suggested_followups": [
                    "Tổng chi tiêu tháng này của tôi là bao nhiêu?",
                    "Tôi có đang vượt ngân sách danh mục nào không?",
                    "Gợi ý cách phân bổ lương theo quy tắc 50/30/20"
                ],
                "generated_by": "privacy_guardrail",
                "response_time_ms": elapsed_ms
            }

        # Build clean sanitized context string
        context_str = f"""- Tổng tài sản ròng: {format_currency_vnd(financial_context.get('total_net_worth', 0))}
- Tổng thu nhập tháng: {format_currency_vnd(financial_context.get('total_income', 0))}
- Tổng chi tiêu tháng: {format_currency_vnd(financial_context.get('total_expense', 0))}
- Tiết kiệm ròng: {format_currency_vnd(financial_context.get('net_savings', 0))} ({financial_context.get('savings_rate', 0)}%)
- Chi tiết số dư các ví khả dụng:
{financial_context.get('wallets_summary', 'Chưa có thông tin ví')}
- Chi tiêu theo danh mục tháng:
{financial_context.get('category_summary', 'Chưa có dữ liệu')}
- Tình trạng Hạn mức Ngân sách:
{financial_context.get('budget_summary', 'Chưa đặt hạn mức')}
"""
        tx_lines = []
        for t in recent_transactions[:10]:
            sign = "+" if t.get("type") == "INCOME" else "-"
            amt = format_currency_vnd(t.get("amount", 0))
            tx_lines.append(f"• {t.get('date')}: {t.get('category_name')} ({t.get('note', '')}) | {sign}{amt} | Ví: {t.get('wallet_name')}")
        recent_tx_str = "\n".join(tx_lines) if tx_lines else "Chưa có giao dịch gần đây."

        system_prompt, user_prompt = prompt_manager.render("financial_qa", {
            "current_date": curr_date,
            "user_name": user_name,
            "financial_context": context_str,
            "recent_transactions": recent_tx_str,
            "user_query": clean_query
        })

        # Try LLM
        llm_reply = await self._call_llm(system_prompt, user_prompt)
        elapsed_ms = int((time.time() - start_time) * 1000)

        extracted_amt = self._extract_monetary_amount(clean_query)

        if llm_reply and len(llm_reply.strip()) > 10:
            followups = self._generate_context_followups(clean_query, extracted_amt)
            return {
                "query": query,
                "response_markdown": llm_reply.strip(),
                "suggested_followups": followups,
                "generated_by": settings.AI_PROVIDER,
                "response_time_ms": elapsed_ms
            }

        # Smart Vietnamese Fallback Q&A Engine
        fallback_reply, followups = self._smart_rule_financial_qa(clean_query, financial_context, recent_transactions, extracted_amt)
        return {
            "query": query,
            "response_markdown": fallback_reply,
            "suggested_followups": followups,
            "generated_by": "smart_nlp_engine",
            "response_time_ms": elapsed_ms
        }

    def _extract_monetary_amount(self, text: str) -> Optional[float]:
        """
        Trích xuất số tiền linh hoạt từ câu hỏi tiếng Việt:
        Ví dụ: 'ngân sách 3 triệu', '3 triệu một tháng', 'lương 10tr', 'chi tiêu 500k', 'có 2 củ', '3.5 triệu', '1tr5', '2 củ rưỡi'
        """
        clean = text.lower()

        # 0. Nửa củ / nửa triệu
        if re.search(r'(?:nửa|nua)\s*(?:củ|cu|triệu|trieu|tr)\b', clean):
            return 500_000.0

        # 1. Triệu kèm rưỡi (e.g. 2 củ rưỡi, 1 triệu rưỡi, 3tr rưỡi)
        m_half = re.search(r'(\d+)\s*(?:củ|cu|triệu|trieu|tr)\s*(?:rưỡi|ruoi)\b', clean)
        if m_half:
            try:
                val = float(m_half.group(1))
                return (val + 0.5) * 1_000_000.0
            except ValueError:
                pass

        # 2. Triệu split: 1tr5, 2tr2, 3 củ 5
        m_split = re.search(r'(\d+)\s*(?:triệu|trieu|tr|củ|cu)\s*(\d+)\b', clean)
        if m_split:
            try:
                base = float(m_split.group(1))
                extra = m_split.group(2)
                if len(extra) == 1:
                    return base * 1_000_000.0 + float(extra) * 100_000.0
                elif len(extra) == 2:
                    return base * 1_000_000.0 + float(extra) * 10_000.0
                elif len(extra) == 3:
                    return base * 1_000_000.0 + float(extra) * 1_000.0
                else:
                    return base * 1_000_000.0 + float(extra)
            except ValueError:
                pass

        # 3. Triệu / Tr / Củ / Chai (e.g. 3.5 triệu, 3,5tr, 3 củ, 2 chai)
        m1 = re.search(r'(\d+(?:[\.,]\d+)?)\s*(?:triệu|trieu|tr|củ|cu|chai)\b', clean)
        if m1:
            try:
                val = float(m1.group(1).replace(',', '.'))
                return val * 1_000_000.0
            except ValueError:
                pass

        # 4. Lít / Lốp (e.g. 2 lít, 5 lốp)
        m_lit = re.search(r'(\d+(?:[\.,]\d+)?)\s*(?:lít|lit|lốp|lop)\b', clean)
        if m_lit:
            try:
                val = float(m_lit.group(1).replace(',', '.'))
                return val * 100_000.0
            except ValueError:
                pass

        # 5. Nghìn / K / Ngàn (e.g. 500k, 500 nghìn, 500 ngàn)
        m2 = re.search(r'(\d+(?:[\.,]\d+)?)\s*(?:k|nghìn|ngàn)\b', clean)
        if m2:
            try:
                val = float(m2.group(1).replace(',', '.'))
                return val * 1_000.0
            except ValueError:
                pass

        # 6. Chuỗi số đầy đủ dạng 3.000.000 hoặc 3000000
        m3 = re.search(r'(\d{1,3}(?:\.\d{3}){1,3}|\d{5,11})\s*(?:đồng|đ|vnd)?\b', clean)
        if m3:
            try:
                clean_num = m3.group(1).replace('.', '')
                return float(clean_num)
            except ValueError:
                pass

        # 7. Ngân sách / Lương / Tiền đi kèm số nguyên nhỏ (e.g. "ngân sách 3", "lương 10", "có 3 chi tiêu sao")
        m4 = re.search(r'(?:ngân sách|lương|thu nhập|hạn mức|quỹ|chi tiêu|tiêu|có|tầm|khoảng)\s*(\d+(?:[\.,]\d+)?)\b', clean)
        if m4:
            try:
                val = float(m4.group(1).replace(',', '.'))
                if 0 < val <= 200:
                    return val * 1_000_000.0
                return val
            except ValueError:
                pass

        return None

    def _generate_context_followups(self, query: str, amt: Optional[float] = None) -> List[str]:
        """Tạo danh sách câu hỏi gợi ý tiếp theo bám sát ngữ cảnh câu hỏi người dùng."""
        q = query.lower()
        if any(w in q for w in ["chào", "hello", "hi", "alo", "bạn là ai", "hôm nay thế nào"]):
            return [
                "Tư vấn phân bổ ngân sách 3 triệu",
                "Tháng này tôi đã tiêu bao nhiêu cho ăn uống?",
                "Tôi có đang vượt hạn mức ngân sách nào không?"
            ]
        if any(w in q for w in ["50/30/20", "50 30 20", "quy tắc 50", "chia lương"]):
            return [
                "Tôi có đang vượt hạn mức ngân sách nào không?",
                "Tháng này tôi đã chi bao nhiêu cho ăn uống?",
                "Tra cứu số dư các ví và tài sản ròng"
            ]
        if any(w in q for w in ["ví", "số dư", "tài sản", "còn bao nhiêu"]):
            return [
                "Tôi có đang vượt hạn mức ngân sách nào không?",
                "Tư vấn phân bổ lương theo chuẩn 50/30/20",
                "Tổng chi tiêu tháng này của tôi"
            ]
        if amt is not None and amt > 0:
            amt_str = format_currency_vnd(amt)
            if any(w in q for w in ["ăn", "uống", "cơm", "thực phẩm"]):
                return [
                    f"Gợi ý thực đơn tiết kiệm dưới {format_currency_vnd(round(amt / 30, -3))}/ngày",
                    "Tháng này tôi đã chi bao nhiêu cho ăn uống?",
                    "Cách cắt giảm 20% chi phí ăn ngoài"
                ]
            if amt <= 6_000_000:
                return [
                    f"Cách chia thực đơn ăn uống với ngân sách {amt_str}",
                    f"Làm sao trích lập được {format_currency_vnd(amt * 0.15)} tiết kiệm?",
                    "Kiểm tra sức khỏe tài chính tháng này"
                ]
            else:
                return [
                    f"Kế hoạch tiết kiệm {format_currency_vnd(amt * 0.2)} mỗi tháng",
                    "Tôi có đang vượt hạn mức ngân sách nào không?",
                    "Đánh giá sức khỏe tài chính tổng quát"
                ]
        if any(w in q for w in ["ăn", "uống", "cơm", "thực phẩm"]):
            return [
                "Lập ngân sách 2 triệu cho việc ăn uống",
                "Tổng chi tiêu tháng này của tôi",
                "Cách tiết kiệm chi phí ăn ngoài"
            ]
        if any(w in q for w in ["ngân sách", "hạn mức", "vượt"]):
            return [
                "Tư vấn phân bổ ngân sách 3 triệu",
                "Tháng này tôi đã tiêu bao nhiêu tiền?",
                "Gợi ý cách phân bổ lương theo chuẩn 50/30/20"
            ]
        if any(w in q for w in ["tiết kiệm", "tích lũy"]):
            return [
                "Làm sao để tiết kiệm thêm 2 triệu mỗi tháng?",
                "Đánh giá sức khỏe tài chính 50/30/20",
                "Tổng chi tiêu tháng này của tôi"
            ]
        return [
            "Tư vấn phân bổ ngân sách 3 triệu",
            "Đánh giá sức khỏe tài chính 50/30/20",
            "Tháng này tôi đã chi tiêu bao nhiêu tiền?"
        ]

    def _smart_rule_financial_qa(
        self,
        query: str,
        context: Dict[str, Any],
        recent_tx: List[Dict[str, Any]],
        extracted_amt: Optional[float] = None
    ) -> Tuple[str, List[str]]:
        """Data-driven rule answers when offline or without external API with a warm, friendly companion tone."""
        q = query.lower()
        income = context.get('total_income', 0)
        expense = context.get('total_expense', 0)
        net = context.get('net_savings', 0)
        rate = context.get('savings_rate', 0)
        net_worth = context.get('total_net_worth', 0)

        # 0. Privacy & Cross-User Guardrail (Zero-PII)
        if self._is_cross_user_pii_query(q):
            return (
                "🔒 **Bảo Mật Dữ Liệu Tài Chính (Zero-PII)**\n\n"
                "FinTrack AI cam kết bảo mật 100% dữ liệu tài chính riêng tư của từng cá nhân. "
                "Mình không thể cung cấp hoặc truy cập thông tin thu/chi của bất kỳ người dùng nào khác trên hệ thống đâu nè.\n\n"
                "Nếu bạn cần xem hoặc phân tích báo cáo tài chính của chính mình, mình luôn sẵn sàng đồng hành hỗ trợ bạn bất cứ lúc nào! ✨",
                [
                    "Tổng chi tiêu tháng này của tôi là bao nhiêu?",
                    "Tôi có đang vượt ngân sách danh mục nào không?",
                    "Gợi ý cách phân bổ lương theo quy tắc 50/30/20"
                ]
            )

        # 0.1 Small Talk, Greetings & Identity
        is_thanks = any(w in q for w in ["cảm ơn", "cam on", "thanks", "thank you", "cám ơn"])
        if is_thanks:
            return (
                "Không có chi đâu nè! 💚 Đồng hành cùng bạn quản lý chi tiêu và giữ cho chiếc ví luôn khỏe mạnh "
                "là niềm vui lớn nhất của mình. Cứ thoải mái nhắn cho mình bất cứ khi nào bạn cần tính toán ngân sách hay lên kế hoạch tài chính nhé! ✨",
                [
                    "Tư vấn phân bổ ngân sách 3 triệu",
                    "Tháng này tôi đã chi bao nhiêu tiền?",
                    "Đánh giá sức khỏe tài chính 50/30/20"
                ]
            )

        is_identity = any(w in q for w in ["bạn là ai", "bạn tên gì", "giới thiệu bản thân", "mày là ai", "bot là ai"])
        if is_identity:
            return (
                "Chào bạn! Mình là **FinTrack AI** – người bạn đồng hành tài chính cá nhân thân thiết của bạn đây! ✨\n\n"
                "Mình ở đây để cùng bạn:\n"
                "- 💡 **Tư vấn & lập ngân sách**: Phân bổ tiền thông minh (dù là ngân sách 3 triệu, 5 triệu hay lương 10 - 20 triệu).\n"
                "- 📊 **Theo dõi chi tiêu**: Báo cáo thu chi, cảnh báo khi sắp chạm hạn mức và kiểm tra sức khỏe tài chính.\n"
                "- ⚡ **Ghi chép giao dịch**: Nhận diện chi tiêu siêu tốc bằng ngôn ngữ tự nhiên.\n\n"
                "Hôm nay bạn muốn chúng mình cùng bắt đầu từ mục nào nè?",
                [
                    "Tư vấn phân bổ ngân sách 3 triệu",
                    "Tháng này tôi đã chi bao nhiêu tiền?",
                    "Đánh giá sức khỏe tài chính 50/30/20"
                ]
            )

        is_health_check = any(w in q for w in ["hôm nay thế nào", "khỏe không", "dạo này thế nào", "ổn không"])
        if is_health_check:
            return (
                "Mình luôn tràn đầy năng lượng và sẵn sàng hỗ trợ bạn 24/7 nè! 🌟 "
                "Tình hình tài chính hôm nay của bạn vẫn ổn định chứ? Cần mình soi nhanh tình hình ví hay kiểm tra xem hôm nay đã tiêu bao nhiêu thì cứ bảo mình nha!",
                [
                    "Tổng chi tiêu tháng này của tôi",
                    "Tư vấn phân bổ ngân sách 3 triệu",
                    "Kiểm tra sức khỏe tài chính tháng này"
                ]
            )

        is_greeting = any(w in q for w in ["chào", "chao", "hello", "hi ", "hi!", "alo", "hé lô", "hey"]) or q.strip() in ["hi", "hello", "chào", "chao"]
        if is_greeting and not any(kw in q for kw in ["triệu", "tr", "chi", "tiêu", "ngân sách", "ăn"]):
            return (
                "Chào bạn nhé! Rất vui được gặp bạn hôm nay. 🌟 Mình là FinTrack AI - người bạn đồng hành tài chính của bạn đây. "
                "Hôm nay bạn cần mình hỗ trợ kiểm tra chi tiêu, tính toán ngân sách hay lên kế hoạch tiết kiệm nào không nè? ✨",
                [
                    "Tư vấn phân bổ ngân sách 3 triệu",
                    "Tháng này tôi đã tiêu bao nhiêu cho ăn uống?",
                    "Tôi có đang vượt hạn mức ngân sách nào không?"
                ]
            )

        amt = extracted_amt if extracted_amt is not None else self._extract_monetary_amount(query)

        # 0.2 Natural Language Transaction Logging statement in Chat
        # e.g. "Ăn trưa bún bò 45k momo", "Vừa đổ xăng 50k", "Mua cà phê 35k tiền mặt"
        is_question = any(w in q for w in [
            "thế nào", "sao", "làm sao", "như thế nào", "tư vấn", "kế hoạch", 
            "phân bổ", "hạn mức", "chia", "quản lý", "sống", "có nên", "cách", 
            "gợi ý", "?", "được không", "hỏi", "chi tiêu thế nào", "tiêu sao", "sống sao", "bao nhiêu"
        ])
        if amt is not None and amt > 0 and not is_question:
            is_logging = any(w in q for w in [
                "vừa", "mới", "hôm nay", "sáng nay", "trưa nay", "chi", "trả", "mua", 
                "uống", "ăn", "nạp", "đổ xăng", "tiền mặt", "momo", "chuyển", "nhận", 
                "bún", "phở", "cơm", "cà phê", "cafe"
            ])
            if is_logging:
                return (
                    f"Mình đã nắm được khoản giao dịch này của bạn rồi nè! 📝\n\n"
                    f"- 💰 **Số tiền**: **{format_currency_vnd(amt)}**\n"
                    f"- 📌 **Nội dung**: *{query.strip()}*\n\n"
                    f"💡 **Mách nhỏ**: Bạn có thể dùng tính năng **'Nhập Nhanh AI'** ở góc trên "
                    f"để hệ thống tự động bóc tách danh mục, ví và lưu thẳng vào Sổ Giao Dịch chỉ trong 1 giây mà không cần điền tay nha! "
                    f"Bạn ghi chép rất kỷ luật rồi đấy, tiếp tục phát huy nhé! ✨",
                    [
                        "Tháng này tôi đã chi bao nhiêu cho ăn uống?",
                        "Tổng chi tiêu hôm nay của tôi",
                        "Tôi có đang vượt hạn mức ngân sách nào không?"
                    ]
                )

        # 0.3 Specialized Advisory: 50/30/20 Rule & Salary Allocation
        is_503020 = any(kw in q for kw in ["50/30/20", "50 30 20", "quy tắc 50", "mô hình 50", "chia lương", "phân bổ lương"])
        if is_503020:
            sal_amt = amt if (amt and amt > 0) else (income if income > 0 else 10_000_000.0)
            needs = sal_amt * 0.50
            wants = sal_amt * 0.30
            savings = sal_amt * 0.20
            daily_budget = round(sal_amt / 30, -3)
            weekly_wants = round(wants / 4, -3)

            source_desc = f"dựa trên thu nhập thực tế **{format_currency_vnd(income)}** tháng này của bạn" if (not amt and income > 0) else f"với mức ngân sách / thu nhập **{format_currency_vnd(sal_amt)}/tháng**"

            reply = f"""Chào bạn nhé! Áp dụng mô hình chuẩn **50/30/20** {source_desc} là phương pháp kinh điển giúp bạn vừa tận hưởng cuộc sống vừa tự do tài chính bền vững:

🏠 **1. Nhu Cầu Thiết Yếu - 50% ({format_currency_vnd(needs)})**:
- **Nhà ở & tiện ích** (tiền thuê, điện, nước, internet): ~**{format_currency_vnd(sal_amt * 0.25)}**
- **Ăn uống & sinh hoạt dinh dưỡng**: ~**{format_currency_vnd(sal_amt * 0.20)}** (~**{format_currency_vnd(round(sal_amt * 0.20 / 30, -3))}/ngày**)
- **Xăng xe & di chuyển**: ~**{format_currency_vnd(sal_amt * 0.05)}**

☕ **2. Mong Muốn & Tận Hưởng - 30% ({format_currency_vnd(wants)})**:
- Cà phê giao lưu, mua sắm online, xem phim, du lịch, sở thích cá nhân.
- 🎯 *Định mức an toàn theo tuần*: Giữ khoản này trong khoảng **~{format_currency_vnd(weekly_wants)}/tuần** để không bao giờ bị vượt ngưỡng nhé!

💰 **3. Tích Lũy & Đầu Tư Tương Lai - 20% ({format_currency_vnd(savings)})**:
- **Quỹ khẩn cấp**: Ưu tiên xây dựng quỹ dự phòng tương đương 3 - 6 tháng chi phí sinh hoạt.
- **Tích lũy sinh lời**: Đều đặn gửi tiết kiệm hoặc đầu tư mỗi tháng **{format_currency_vnd(savings)}**.

💡 **Bí quyết thành công từ FinTrack AI**:
- **Nguyên tắc 'Trả cho mình trước' (Pay yourself first)**: Khi nhận lương/thu nhập, hãy trích ngay **{format_currency_vnd(savings)}** sang ví tích lũy trước rồi mới bắt đầu chi tiêu phần còn lại.
- Hạn mức chi tiêu tối đa mỗi ngày khuyến nghị là **~{format_currency_vnd(daily_budget)}/ngày**.

Bạn thấy kế hoạch phân bổ này đã vừa vặn với thói quen hiện tại của mình chưa nè? ✨"""
            return (reply, [
                "Tôi có đang vượt hạn mức ngân sách nào không?",
                "Tháng này tôi đã chi bao nhiêu cho ăn uống?",
                "Tra cứu số dư các ví và tài sản ròng"
            ])

        # 0.4 Specialized Inquiry: Wallets, Balance & Net Worth Check
        is_wallet_inquiry = any(kw in q for kw in [
            "số dư", "tài sản", "còn bao nhiêu tiền", "tiền trong ví", "tra cứu số dư", "tổng tài sản"
        ]) or ("ví" in q and any(w in q for w in ["còn", "bao nhiêu", "kiểm tra", "tra cứu", "số dư", "xem", "tất cả", "danh sách"]))
        if is_wallet_inquiry:
            wallets_detail = context.get('wallets_summary', '')
            wallets_text = wallets_detail if wallets_detail else "Chưa có danh sách ví chi tiết."
            reply = f"""Tài sản và số dư khả dụng thực tế của bạn đây nè: 💰

- 💎 **Tổng tài sản ròng**: **{format_currency_vnd(net_worth)}**
- 📊 **Dòng tiền tháng này**: Thu **{format_currency_vnd(income)}** | Chi **{format_currency_vnd(expense)}** -> Tích lũy ròng: **{format_currency_vnd(net)}** (Tỷ lệ: **{rate}%**)

💳 **Chi tiết số dư từng tài khoản / ví khả dụng**:
{wallets_text}

💡 **Lời khuyên tài chính**:
- Hãy duy trì số dư ví tiền mặt hoặc ví thanh toán hàng ngày đủ dùng cho khoảng 1 - 2 tuần chi phí sinh hoạt để luôn chủ động.
- Các khoản tiền nhàn rỗi lớn nên phân bổ vào ví tích lũy để sinh lời tối ưu nhé!"""
            return (reply, [
                "Tôi có đang vượt hạn mức ngân sách nào không?",
                "Tư vấn phân bổ lương theo chuẩn 50/30/20",
                "Tháng này tôi đã chi tiêu bao nhiêu tiền?"
            ])

        # 0.5 Specialized Inquiry: Budget Status & Overspending Check (without simulation amount)
        is_budget_status = any(kw in q for kw in [
            "hạn mức", "vượt hạn mức", "bội chi", "vượt ngân sách", "tình trạng ngân sách", 
            "kiểm tra ngân sách", "ngân sách còn lại"
        ]) or (any(kw in q for kw in ["ngân sách", "vượt"]) and (amt is None or amt == 0))
        if is_budget_status:
            bdg_summary = context.get('budget_summary', '')
            bdg_detail = bdg_summary if (bdg_summary and bdg_summary != "Chưa đặt hạn mức") else "Hiện tại bạn chưa thiết lập hạn mức chi tiêu cho các danh mục tháng này."
            reply = f"""Mình vừa rà soát chi tiết tình trạng các hạn mức ngân sách của bạn nè: 🎯

{bdg_detail}

📊 **Hướng dẫn kiểm soát ngân sách theo 3 vùng cảnh báo**:
- 🟢 **Vùng an toàn (< 80%)**: Chi tiêu đang trong tầm kiểm soát rất tốt, hãy duy trì nhịp độ kỷ luật này!
- 🟡 **Vùng cảnh báo (80% - 100%)**: Sắp chạm trần hạn mức! Cần siết lại các khoản chi mua sắm, ăn ngoài phát sinh.
- 🔴 **Vượt hạn mức (> 100%)**: Đã bội chi! Cần tạm dừng ngay các khoản chi không thiết yếu ở danh mục này.

💡 **Chiến lược điều phối ngân sách theo tuần**:
- Hãy lấy số hạn mức còn lại chia đều cho số tuần còn lại trong tháng. Việc chia nhỏ hạn mức theo tuần giúp bạn không bao giờ bị 'cháy túi' vào những ngày cuối tháng!"""
            return (reply, [
                "Tư vấn phân bổ ngân sách 3 triệu",
                "Gợi ý cách phân bổ lương theo chuẩn 50/30/20",
                "Tháng này tôi đã chi tiêu bao nhiêu tiền?"
            ])

        # 1. Budgeting or spending advice for a specific category with amount
        if amt is not None and amt > 0:
            is_food = any(kw in q for kw in ["ăn", "uống", "cơm", "thực phẩm", "ăn ngoài", "nhậu", "cà phê"])
            is_transport = any(kw in q for kw in ["đi lại", "xăng", "xe", "grab", "xe máy", "bus", "xe buýt"])

            if is_food:
                daily_food = round(amt / 30, -3)
                weekly_food = round(amt / 4, -3)
                sang = round(daily_food * 0.25, -3)
                trua = round(daily_food * 0.38, -3)
                toi = round(daily_food * 0.37, -3)
                reply = f"""Chào bạn nhé! Với mức ngân sách ăn uống **{format_currency_vnd(amt)}/tháng**, việc chia nhỏ theo từng bữa sẽ giúp bạn ăn ngon đủ chất mà chiếc ví vẫn an toàn:

🍲 **Định Mức Chi Tiêu Tham Khảo**:
- **Hạn mức trung bình mỗi ngày**: **~{format_currency_vnd(daily_food)}/ngày** (hoặc **~{format_currency_vnd(weekly_food)}/tuần**).
- **Gợi ý chia 3 bữa**:
  - Bữa sáng: ~**{format_currency_vnd(sang)}** (Bánh mì, xôi, ngũ cốc hoặc đồ ăn sáng tự nấu nhanh).
  - Bữa trưa: ~**{format_currency_vnd(trua)}** (Cơm văn phòng bình dân hoặc mang cơm hộp tự chuẩn bị).
  - Bữa tối: ~**{format_currency_vnd(toi)}** (Tự nấu ăn tại nhà để vừa đủ chất vừa tiết kiệm).

💡 **Bí quyết ăn ngon mà vẫn dư dả**:
1. **Đi chợ / Siêu thị theo tuần**: Mua và sơ chế thực phẩm sẵn cho cả tuần giúp bạn tiết kiệm 20% - 30% so với mua lẻ từng ngày.
2. **Giảm bớt đặt đồ qua App giao hàng**: Phí ship và giá món trên app thường cao hơn đáng kể.
3. **Ghi nhận ngay trên FinTrack AI**: Mỗi lần ăn uống xong, bạn bấm 'Nhập Nhanh AI' ghi lại ngay để không bao giờ vượt ngưỡng {format_currency_vnd(amt)} nha! ✨"""
                return (reply, [
                    f"Cách tiết kiệm thêm 500k tiền ăn uống",
                    "Tháng này tôi đã chi bao nhiêu cho ăn uống?",
                    "Tư vấn phân bổ ngân sách 3 triệu"
                ])

            if is_transport:
                daily_trans = round(amt / 30, -3)
                weekly_trans = round(amt / 4, -3)
                reply = f"""Chào bạn! Với khoản ngân sách đi lại & xăng xe **{format_currency_vnd(amt)}/tháng**, tính ra mỗi ngày bạn sẽ có khoảng **~{format_currency_vnd(daily_trans)}/ngày** (tầm **~{format_currency_vnd(weekly_trans)}/tuần**).

💡 **Vài mẹo nhỏ để tiết kiệm chi phí di chuyển nè**:
1. **Bảo dưỡng xe định kỳ**: Kiểm tra áp suất lốp và thay nhớt đúng hạn giúp máy êm và giảm 5% - 10% mức tiêu hao xăng.
2. **Kết hợp cung đường**: Gom các chuyến đi gần nhau để tránh việc di chuyển lòng vòng nhiều lần trong ngày.
3. **Tận dụng ưu đãi**: Nếu đi xe công nghệ, nhớ kiểm tra mã khuyến mãi theo khung giờ hoặc mua gói di chuyển tháng nha.

Cần mình hỗ trợ thêm về các khoản chi khác trong tháng thì cứ bảo mình nha! 🛵"""
                return (reply, [
                    "Tổng chi tiêu tháng này của tôi",
                    "Tư vấn phân bổ ngân sách 3 triệu",
                    "Cách tiết kiệm 1 triệu mỗi tháng"
                ])

            # 2. General Budgeting / Salary / Living Cost with specific Amount
            is_budget_query = any(kw in q for kw in [
                "ngân sách", "lương", "thu nhập", "chi tiêu", "quản lý", "phân bổ", "sống", 
                "kế hoạch", "có", "chia", "50/30/20", "50 30 20", "6 hũ", "1 tháng", "mỗi tháng", "hạn mức"
            ]) or ("triệu" in q or "tr" in q or "củ" in q)

            if is_budget_query:
                sal_amt = amt
                daily_budget = round(sal_amt / 30, -3)
                weekly_budget = round(sal_amt / 4, -3)

                if sal_amt <= 6_000_000:
                    needs = sal_amt * 0.65
                    wants = sal_amt * 0.20
                    savings = sal_amt * 0.15
                    rent_part = sal_amt * 0.25
                    food_part = sal_amt * 0.35
                    trans_part = sal_amt * 0.05
                    daily_food_allowance = round(food_part / 30, -3)

                    reply = f"""Chào bạn nhé! Với mức ngân sách **{format_currency_vnd(sal_amt)}/tháng**, việc cân đối tài chính khéo léo sẽ giúp bạn hoàn toàn làm chủ cuộc sống mà không phải lo lắng chuyện 'cháy túi' cuối tháng đâu nè.

Tính nhanh thì mỗi ngày bạn sẽ có hạn mức an toàn là **~{format_currency_vnd(daily_budget)}/ngày** (tương đương **~{format_currency_vnd(weekly_budget)}/tuần**). Đây là phương án phân bổ thông minh và thực tế nhất mình gợi ý cho bạn:

🏠 **1. Nhu Cầu Thiết Yếu - 65% ({format_currency_vnd(needs)})**:
- **Tiền phòng trọ / nhà ở + điện nước**: ~**{format_currency_vnd(rent_part)}** (nên ở ghép hoặc chọn phòng có chi phí hợp lý).
- **Ăn uống & sinh hoạt**: ~**{format_currency_vnd(food_part)}** (khoảng **~{format_currency_vnd(daily_food_allowance)}/ngày**, tự nấu ăn là giải pháp số một nhé).
- **Xăng xe & đi lại**: ~**{format_currency_vnd(trans_part)}**.

☕ **2. Chi Tiêu Cá Nhân & Linh Hoạt - 20% ({format_currency_vnd(wants)})**:
- Cà phê giao lưu, nạp thẻ điện thoại, internet, đồ dùng cá nhân tối thiểu.
- *Nguyên tắc vàng*: Bạn giữ khoản này trong ngưỡng **~{format_currency_vnd(round(wants / 4, -3))}/tuần** nhé.

💰 **3. Tích Lũy Dự Phòng Khẩn Cấp - 15% ({format_currency_vnd(savings)})**:
- **'Bỏ ống heo' ngay đầu tháng**: Vừa có tiền về là trích riêng ngay **{format_currency_vnd(savings)}** vào một tài khoản tiết kiệm riêng biệt, tuyệt đối không dùng đến trừ khi có việc ốm đau/khẩn cấp.

💡 **Bí kíp nhỏ từ người bạn đồng hành**:
1. Tuân thủ hạn mức ngày (**~{format_currency_vnd(daily_budget)}/ngày**): Hôm nay lỡ tiêu vượt nhẹ thì mai tự động nấu ăn bù lại nhé.
2. Tự nấu ăn tại nhà: Giúp bạn tiết kiệm ít nhất **{format_currency_vnd(sal_amt * 0.2)}/tháng** so với ăn hàng.
3. Quy tắc 48 giờ: Trước khi mua một món đồ không thiết yếu, hãy chờ 48 tiếng để xem mình có thực sự cần nó không.
4. Ghi chép trên FinTrack AI: Mỗi khi phát sinh khoản chi 10k, 20k cũng nhớ ghi lại để ví luôn trong tầm kiểm soát!

Bạn thấy cách phân bổ này thế nào, cần mình tinh chỉnh thêm mục nào không nè? ✨"""

                    return (reply, [
                        f"Cách chia thực đơn ăn uống với {format_currency_vnd(food_part)}",
                        f"Làm sao tiết kiệm được {format_currency_vnd(savings)} đầu tháng?",
                        "Kiểm tra sức khỏe tài chính tháng này"
                    ])
                else:
                    needs = sal_amt * 0.50
                    wants = sal_amt * 0.30
                    savings = sal_amt * 0.20

                    reply = f"""Chào bạn nhé! Với mức ngân sách **{format_currency_vnd(sal_amt)}/tháng**, bạn đã có một nền tảng tài chính khá thoải mái. Mình gợi ý bạn áp dụng quy tắc vàng **50/30/20** để vừa tận hưởng cuộc sống vừa xây dựng tài sản vững chắc:

🏠 **1. Nhu Cầu Thiết Yếu - 50% ({format_currency_vnd(needs)})**:
- Tiền nhà ở & tiện ích (điện, nước, net): ~**{format_currency_vnd(sal_amt * 0.25)}**.
- Ăn uống & thực phẩm: ~**{format_currency_vnd(sal_amt * 0.20)}** (khoảng **~{format_currency_vnd(round(sal_amt * 0.2 / 30, -3))}/ngày**).
- Đi lại & sinh hoạt cơ bản: ~**{format_currency_vnd(sal_amt * 0.05)}**.

☕ **2. Chi Tiêu Cá Nhân & Tận Hưởng - 30% ({format_currency_vnd(wants)})**:
- Mua sắm, giải trí, cà phê bạn bè, du lịch, học thêm kỹ năng mới.
- Hạn mức khuyến nghị: Không vượt quá **~{format_currency_vnd(round(wants / 4, -3))}/tuần**.

💰 **3. Tích Lũy & Đầu Tư Tương Lai - 20% ({format_currency_vnd(savings)})**:
- **Quỹ khẩn cấp**: Ưu tiên tích lũy đủ 3 - 6 tháng sinh hoạt cơ bản trước.
- **Đầu tư sinh lời**: Chuyển phần tích lũy hàng tháng (**{format_currency_vnd(savings)}**) vào các kênh an toàn như tích lũy sinh lời hoặc chứng chỉ quỹ.

💡 **Định mức chi tiêu hàng ngày khuyến nghị**: Khoảng **~{format_currency_vnd(daily_budget)}/ngày** (bao gồm cả ăn uống và chi tiêu cá nhân). Bạn thấy tỷ lệ này đã vừa vặn với thói quen hiện tại của mình chưa? ✨"""

                    return (reply, [
                        f"Kế hoạch tiết kiệm {format_currency_vnd(savings)} mỗi tháng",
                        "Tôi có đang vượt hạn mức ngân sách nào không?",
                        "Đánh giá sức khỏe tài chính tổng quát"
                    ])

            # 3. Saving goal with amount
            if any(kw in q for kw in ["tiết kiệm", "tích lũy", "quỹ"]):
                daily_save = round(amt / 30, -3)
                weekly_save = round(amt / 4, -3)
                reply = f"""Mục tiêu tiết kiệm **{format_currency_vnd(amt)}/tháng** này rất tuyệt vời luôn, mình rất ủng hộ bạn! 🎯

Để đạt được con số này nhẹ nhàng nhất mà không thấy bị gò bó, chúng mình cùng chia nhỏ mục tiêu ra nhé:
- Mỗi ngày bạn chỉ cần tích lũy khoảng **~{format_currency_vnd(daily_save)}/ngày**
- Hoặc mỗi tuần giữ lại tầm **~{format_currency_vnd(weekly_save)}/tuần**

💡 **3 bước đơn giản giúp bạn về đích chắc chắn**:
1. **Trả cho mình trước (Pay yourself first)**: Ngay ngày nhận thu nhập, hãy chuyển ngay **{format_currency_vnd(amt)}** sang ví tích lũy trước khi bắt đầu chi tiêu.
2. **Cắt giảm vi mô (Micro-savings)**: Bớt 1 ly trà sữa hay bữa ăn ngoài không cần thiết là bạn đã chạm được 1/2 chỉ tiêu của ngày rồi!
3. **Quy tắc 48h**: Trước khi bấm 'Mua ngay' một món đồ yêu thích, hãy chờ 2 ngày. Nếu sau 2 ngày bạn vẫn thấy nó thật sự cần, lúc đó hãy mua.

Mình tin bạn hoàn toàn làm được. Cố lên nhé! Cần mình đồng hành theo dõi tiến độ cùng bạn không? 💪"""
                return (reply, [
                    "Gợi ý kế hoạch ngân sách cho tháng tới",
                    "Tháng này tôi đã chi tiêu bao nhiêu?",
                    "Đánh giá sức khỏe tài chính 50/30/20"
                ])

        # 4. Asking about Food / Dining without amount
        if any(kw in q for kw in ["ăn", "uống", "ăn ngoài", "ăn uống", "cơm", "bún", "nhậu", "cà phê"]):
            food_total = 0.0
            for t in recent_tx:
                cat = str(t.get("category_name", "")).lower()
                if ("ăn" in cat or "food" in cat or "thực phẩm" in cat or "uống" in cat) and t.get("type") == "EXPENSE":
                    food_total += float(t.get("amount", 0))
            if food_total > 0:
                pct = round((food_total / expense * 100), 1) if expense > 0 else 0
                reply = f"""Mình vừa kiểm tra nhanh sổ giao dịch của bạn nè! 🍜

Tháng này bạn đã dành khoảng **{format_currency_vnd(food_total)}** cho việc ăn uống (chiếm tầm **{pct}%** tổng chi tiêu).

Ăn uống ngon miệng là để nạp năng lượng, nhưng đây cũng là khoản dễ bị phát sinh đột biến nhất. Nếu bạn muốn tối ưu thêm, thử đặt mục tiêu nấu ăn tại nhà thêm 2 - 3 bữa mỗi tuần xem sao nhé, ví sẽ cảm ơn bạn nhiều lắm đấy! 🍲"""
            else:
                reply = f"""Trong tháng này, tổng chi tiêu được ghi nhận của bạn là **{format_currency_vnd(expense)}** và chưa có khoản chi ăn uống cụ thể nào được phân loại riêng. 

Bạn có thể nhập nhanh giao dịch ăn uống hôm nay bằng nút **'Nhập Nhanh AI'** ở thanh trên để mình theo dõi giúp bạn nhé! ✨"""
            return (reply, [
                "Lập ngân sách ăn uống 2 triệu",
                "Tôi có đang vượt hạn mức ngân sách nào không?",
                "3 cách giảm chi tiêu ăn ngoài hiệu quả"
            ])

        # 5. Asking about Total Expense / Income / Net Flow without amount
        if any(kw in q for kw in ["tổng chi", "đã tiêu bao nhiêu", "chi bao nhiêu", "hết bao nhiêu", "tiêu gì"]):
            reply = f"""Mình gửi bạn tổng kết chi tiêu tháng này nha: 💸

- 📤 **Tổng số tiền đã chi**: **{format_currency_vnd(expense)}**
- 📥 **Tổng thu nhập**: **{format_currency_vnd(income)}**
- 💰 **Số dư ròng còn lại**: **{format_currency_vnd(net)}** (Tỷ lệ tiết kiệm hiện tại: **{rate}%**)

Nhìn chung dòng tiền của bạn vẫn đang được kiểm soát khá ổn định! Bạn có thể vào mục **Sổ Giao Dịch** để xem chi tiết từng hóa đơn, hoặc nhắn mình để cùng rà soát các danh mục nhé! ✨"""
            return (reply, [
                "Tôi đã tiêu bao nhiêu cho việc ăn uống?",
                "Tôi có đang vượt ngân sách danh mục nào không?",
                "Gợi ý cách tiết kiệm thêm tháng này"
            ])

        if any(kw in q for kw in ["tổng thu", "thu nhập", "kiếm được bao nhiêu", "nhận bao nhiêu", "lương"]):
            reply = f"""Tình hình thu nhập tháng này của bạn đây nè: 📥

- 💵 **Tổng thu nhập ghi nhận**: **{format_currency_vnd(income)}**
- 📤 **Đã chi tiêu**: **{format_currency_vnd(expense)}**
- 🎯 **Số tiền tích lũy được**: **{format_currency_vnd(net)}** (Đạt tỷ lệ tiết kiệm: **{rate}%**)

Bạn đang duy trì tỷ lệ tích lũy rất tốt! Bạn có muốn mình tư vấn cách phân bổ khoản thu nhập này theo chuẩn 50/30/20 không nè?"""
            return (reply, [
                "Tư vấn phân bổ thu nhập theo chuẩn 50/30/20",
                "Tôi đã chi tiêu bao nhiêu tiền tháng này?",
                "Kế hoạch tiết kiệm 3 tháng tới"
            ])

        # 6. Asking about Savings / How to save money
        if any(kw in q for kw in ["tiết kiệm", "cách tiết kiệm", "làm sao để tiết kiệm", "tối ưu chi phí", "tiết kiệm tiền"]):
            base_inc = income if income > 0 else 10_000_000.0
            save_20 = base_inc * 0.2
            reply = f"""Để tiết kiệm hiệu quả mà không cảm thấy gò bó hay áp lực, mình chia sẻ với bạn 4 nguyên tắc đơn giản mà cực kỳ hiệu quả này nha: 💡

1. **Nguyên tắc 'Trả cho mình trước'**: Ngay khi có thu nhập về, trích ngay 15% - 20% (**{format_currency_vnd(save_20)}**) vào tài khoản tiết kiệm riêng biệt rồi mới chi tiêu phần còn lại.
2. **Quy tắc 50/30/20**: Giữ nhu cầu thiết yếu dưới 50% (**{format_currency_vnd(base_inc * 0.5)}**) và kiểm soát các khoản mua sắm ngẫu hứng.
3. **Cắt giảm vi mô (Micro-savings)**: Bớt 1 ly cà phê ngoài hàng/ngày (~35.000 đ) là cuối tháng bạn đã có thêm hơn **1.000.000 đ** trong ví rồi đó!
4. **Ghi chép đều tay**: Thường xuyên ghi lại các khoản chi trên FinTrack AI để luôn nắm rõ dòng tiền đang chảy về đâu.

Bạn muốn thử thách bản thân tiết kiệm bao nhiêu trong tháng tới nào? Nhắn mình để chúng mình cùng lên kế hoạch nhé! 🎯"""
            return (reply, [
                "Tư vấn ngân sách 3 triệu",
                "Đánh giá sức khỏe tài chính 50/30/20",
                "Tôi có đang vượt ngân sách không?"
            ])

        # Default Helpful Intelligent Advisory Response
        reply = f"""Chào bạn nha! Mình là **FinTrack AI** - người bạn đồng hành tài chính của bạn đây. 🌟

Hiện tại tổng tài sản khả dụng của bạn là **{format_currency_vnd(net_worth)}**, và tháng này bạn đã tích lũy được **{format_currency_vnd(net)}** (tỷ lệ tiết kiệm đạt **{rate}%**).

Bạn muốn mình cùng bạn làm gì hôm nay nào? Mình có thể giúp bạn:
- 💡 Tính toán và phân bổ ngân sách (ví dụ: *'Ngân sách 3 triệu thì chi tiêu thế nào?'*)
- 📊 Soi lại chi tiêu danh mục (ví dụ: *'Tháng này tôi đã tiêu bao nhiêu cho ăn uống?'*)
- 🎯 Lên kế hoạch tiết kiệm tiền thực tế và hiệu quả

Cứ thoải mái trò chuyện cùng mình nhé! ✨"""
        return (reply, [
            "Tư vấn ngân sách 3 triệu",
            "Tôi đã tiêu bao nhiêu cho ăn uống?",
            "Tôi có đang vượt ngân sách không?",
            "Đánh giá sức khỏe tài chính 50/30/20"
        ])

ai_service = AIService()
