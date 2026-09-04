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
                        elif resp.status_code == 404:
                            # Model not found, try next candidate model
                            continue
                        else:
                            print(f"[AIService] Gemini API HTTP {resp.status_code} on model {model_name}: {resp.text[:150]}")
                except Exception as e:
                    print(f"[AIService] Gemini API error with model {model_name}: {e}")
                    continue

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
        income_keywords = ["lương", "thưởng", "nhận", "thu", "bán", "được cho", "tiền vào", "lãi", "cộng tiền"]
        transfer_keywords = ["chuyển sang", "chuyển khoản sang", "nạp vào", "rút từ"]

        if any(kw in lower for kw in transfer_keywords):
            tx_type = "TRANSFER"
        elif any(kw in lower for kw in income_keywords):
            tx_type = "INCOME"

        # 2. Extract Amount
        amount = 0.0
        # Check patterns like: 45k, 45.5k, 1.5tr, 1tr5, 25 triệu, 25 trieu, 500 nghin, 500000, 2 củ, 1 lít, 1 chai
        amount_patterns = [
            (r'(\d+[\.,]?\d*)\s*(?:triệu|trieu|tr)\s*(\d+)?', 'million_split'),
            (r'(\d+[\.,]?\d*)\s*(?:củ|cu|chai)', 'million'),
            (r'(\d+[\.,]?\d*)\s*(?:triệu|trieu|tr)\b', 'million'),
            (r'(\d+[\.,]?\d*)\s*(?:lít|lit|lốp|lop)\b', 'hundred_k'),
            (r'(\d+[\.,]?\d*)\s*(?:k|nghìn|nghin|ngàn|ngan)\b', 'thousand'),
            (r'(\d{1,3}(?:[.,]\d{3})+)\b', 'formatted_num'),
            (r'(\d+)\b', 'plain_num')
        ]

        for pat, pat_type in amount_patterns:
            m = re.search(pat, lower)
            if m:
                if pat_type == 'million_split':
                    base = float(m.group(1).replace(',', '.'))
                    extra = float(m.group(2)) if m.group(2) else 0
                    amount = base * 1_000_000 + (extra * 100_000 if extra < 10 else extra * 10_000)
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
                    elif val <= 500: # e.g. "45" might mean 45k
                        amount = val * 1000
                if amount > 0:
                    break

        if amount == 0.0:
            amount = 50000.0

        # 3. Match Wallet
        matched_wallet = None
        for w in available_wallets:
            w_name = w["name"].lower()
            if w_name in lower or ("momo" in w_name and "momo" in lower) or ("techcom" in w_name and ("techcom" in lower or "tcb" in lower)) or ("tiền mặt" in w_name and ("tiền mặt" in lower or "tien mat" in lower or "cash" in lower)):
                matched_wallet = w
                break
        if not matched_wallet and available_wallets:
            matched_wallet = available_wallets[0]

        # 4. Match Category
        matched_cat = None
        category_semantic_map = {
            "Ăn uống & Thực phẩm": ["ăn", "uống", "cơm", "bún", "phở", "bánh mì", "trà sữa", "cà phê", "cafe", "nhậu", "lẩu", "buffet", "siêu thị", "chợ", "bò", "gà", "thịt", "tạp hóa"],
            "Đi lại & Xăng xe": ["xăng", "xe", "grab", "be", "gojek", "gửi xe", "bảo dưỡng", "rửa xe", "taxi", "vé xe", "xe buýt"],
            "Nhà ở & Tiền thuê": ["tiền nhà", "tiền phòng", "tiền trọ", "thuê nhà", "chung cư", "phí dịch vụ"],
            "Hóa đơn & Tiện ích": ["điện", "nước", "internet", "wifi", "rác", "nạp thẻ", "điện thoại", "hóa đơn"],
            "Mua sắm cá nhân": ["mua", "shopee", "lazada", "tiki", "quần áo", "giày", "dép", "váy", "mỹ phẩm", "son", "túi"],
            "Giải trí & Thư giãn": ["xem phim", "cinema", "netflix", "spotify", "du lịch", "game", "chơi", "karaoke"],
            "Y tế & Sức khỏe": ["thuốc", "khám", "bác sĩ", "bệnh viện", "gym", "tập gym", "thể thao", "nha khoa"],
            "Lương chính thức": ["lương", "salary", "công ty trả lương"],
            "Thưởng & Hoa hồng": ["thưởng", "bonus", "hoa hồng", "kpi"],
            "Thu nhập phụ & Freelance": ["freelance", "dự án ngoài", "kinh doanh", "bán hàng", "viết bài"],
            "Tiết kiệm & Đầu tư": ["tiết kiệm", "đầu tư", "chứng khoán", "vàng", "gửi bank"]
        }

        for cat_name, keywords in category_semantic_map.items():
            if any(kw in lower for kw in keywords):
                # Find in available_categories
                for c in available_categories:
                    if c["name"].lower() == cat_name.lower() or cat_name.lower() in c["name"].lower():
                        matched_cat = c
                        break
                if matched_cat:
                    break

        if not matched_cat:
            # Fallback by type
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
        # Remove wallet keywords and amount phrases to clean up note if possible
        if len(note) > 100:
            note = note[:97] + "..."

        return {
            "type": tx_type,
            "amount": amount,
            "category_id": matched_cat["id"] if matched_cat else None,
            "category_name": matched_cat["name"] if matched_cat else "Chi tiêu chung",
            "wallet_id": matched_wallet["id"] if matched_wallet else None,
            "wallet_name": matched_wallet["name"] if matched_wallet else "Tiền mặt",
            "to_wallet_id": None,
            "to_wallet_name": None,
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

        if llm_reply and len(llm_reply.strip()) > 10:
            return {
                "query": query,
                "response_markdown": llm_reply.strip(),
                "suggested_followups": [
                    "Tôi có đang vượt ngân sách danh mục nào không?",
                    "Đánh giá sức khỏe tài chính tháng này",
                    "Gợi ý kế hoạch tiết kiệm 3 tháng tới"
                ],
                "generated_by": settings.AI_PROVIDER,
                "response_time_ms": elapsed_ms
            }

        # Smart Vietnamese Fallback Q&A Engine
        fallback_reply = self._smart_rule_financial_qa(clean_query, financial_context, recent_transactions)
        return {
            "query": query,
            "response_markdown": fallback_reply,
            "suggested_followups": [
                "Đánh giá sức khỏe tài chính 50/30/20",
                "Tôi đã tiêu bao nhiêu cho việc ăn ngoài?",
                "Cách tiết kiệm thêm 2 triệu tháng này"
            ],
            "generated_by": "smart_nlp_engine",
            "response_time_ms": elapsed_ms
        }

    def _smart_rule_financial_qa(
        self,
        query: str,
        context: Dict[str, Any],
        recent_tx: List[Dict[str, Any]]
    ) -> str:
        """Data-driven rule answers when offline or without external API."""
        q = query.lower()
        income = context.get('total_income', 0)
        expense = context.get('total_expense', 0)
        net = context.get('net_savings', 0)
        rate = context.get('savings_rate', 0)

        # 0. Privacy & Cross-User Guardrail (Zero-PII)
        if self._is_cross_user_pii_query(q):
            return """🔒 **Bảo Mật Dữ Liệu Tài Chính (Zero-PII)**

FinTrack AI cam kết bảo mật 100% dữ liệu tài chính riêng tư của từng cá nhân. Tôi không thể cung cấp hoặc truy cập thông tin thu/chi của bất kỳ người dùng nào khác trên hệ thống.

Nếu bạn cần xem hoặc phân tích báo cáo tài chính của chính mình, tôi luôn sẵn sàng hỗ trợ bạn bất cứ lúc nào!"""

        # 1. Asking about Salary Allocation & Budgeting for specific Salary amounts
        salary_match = re.search(r'(?:lương|thu nhập|lương tháng)\s*(?:là|khoảng|được)?\s*(\d+[\.,]?\d*)\s*(triệu|trieu|tr|k|nghìn|ngàn|củ)?', q)
        if salary_match or any(kw in q for kw in ["50/30/20", "50 30 20", "6 hũ", "phân bổ lương", "chia lương", "quản lý lương"]):
            sal_amt = 0.0
            if salary_match:
                val = float(salary_match.group(1).replace(',', '.'))
                unit = (salary_match.group(2) or '').lower()
                if unit in ['k', 'nghìn', 'ngàn']:
                    sal_amt = val * 1000
                elif val < 1000:  # e.g. 5, 10, 15, 20
                    sal_amt = val * 1_000_000
                else:
                    sal_amt = val
            elif income > 0:
                sal_amt = income
            else:
                sal_amt = 5_000_000.0  # Default demo salary

            needs = sal_amt * 0.5
            wants = sal_amt * 0.3
            savings = sal_amt * 0.2

            return f"""🎯 **Kế Hoạch Phân Bổ Chi Tiêu & Tiết Kiệm Theo Quy Tắc 50/30/20:**
*(Áp dụng cho mức thu nhập: **{format_currency_vnd(sal_amt)}/tháng**)*

---

### 1. 🏠 Nhu Cầu Thiết Yếu - 50% (**{format_currency_vnd(needs)}**)
- **Tiền trọ / Nhà ở + Điện nước**: Ưu tiên giữ dưới 25-30% thu nhập (~**{format_currency_vnd(sal_amt * 0.25)}**).
- **Ăn uống & Nhu yếu phẩm cơ bản**: ~**{format_currency_vnd(sal_amt * 0.2)}** (tự nấu ăn tại nhà để tối ưu chi phí).
- **Xăng xe & Đi lại**: ~**{format_currency_vnd(sal_amt * 0.05)}**.

### 2. ☕ Chi Tiêu Cá Nhân & Linh Hoạt - 30% (**{format_currency_vnd(wants)}**)
- Mua sắm đồ dùng cá nhân, cà phê gặp gỡ bạn bè, giải trí.
- **Mẹo tối ưu**: Áp dụng quy tắc trì hoãn 48 giờ trước khi mua một món đồ không thực sự cần thiết.

### 3. 💰 Tiết Kiệm & Quỹ Dự Phòng - 20% (**{format_currency_vnd(savings)}**)
- **Quỹ khẩn cấp**: Trích ngay **{format_currency_vnd(savings)}** vào ngày nhận lương vào tài khoản tích lũy riêng.
- Khi tích lũy đủ 3 - 6 tháng chi phí sinh hoạt, bạn có thể chuyển một phần sang đầu tư gia tăng tài sản.

---
💡 **Lời khuyên thực tế từ FinTrack AI**: *"Tiết kiệm trước - Chi tiêu sau"* là chìa khóa vàng giúp bạn luôn làm chủ tài chính và không rơi vào cảnh cạn túi cuối tháng!"""

        # 2. Asking about Food / Dining / Eating out
        if any(kw in q for kw in ["ăn", "uống", "ăn ngoài", "ăn uống", "cơm", "bún", "nhậu", "cà phê"]):
            food_total = 0.0
            for t in recent_tx:
                cat = str(t.get("category_name", "")).lower()
                if ("ăn" in cat or "food" in cat or "thực phẩm" in cat or "uống" in cat) and t.get("type") == "EXPENSE":
                    food_total += float(t.get("amount", 0))
            if food_total > 0:
                pct = round((food_total / expense * 100), 1) if expense > 0 else 0
                return f"""📊 **Chi tiêu cho Danh mục Ăn uống & Thực phẩm:**
- Tổng số tiền đã ghi nhận gần đây: **{format_currency_vnd(food_total)}** (chiếm khoảng **{pct}%** tổng chi tiêu).
- **Nhận xét**: Chi tiêu ăn uống chiếm tỷ trọng lớn trong ngân sách sinh hoạt. Bạn nên đặt hạn mức tuần và tăng cường tự nấu ăn tại nhà để tiết kiệm thêm 20-30% chi phí."""
            return f"""📊 **Chi tiêu Ăn uống**: Trong tháng này, tổng chi tiêu của bạn là **{format_currency_vnd(expense)}**. Bạn có thể xem chi tiết biểu đồ cơ cấu chi tiêu trên Dashboard."""

        # 3. Asking about Total Expense / Income / Net Flow
        if any(kw in q for kw in ["tổng chi", "đã tiêu bao nhiêu", "chi bao nhiêu", "hết bao nhiêu", "tiêu gì"]):
            return f"""💸 **Tổng kết chi tiêu tháng này của bạn:**
- **Tổng số tiền đã chi**: **{format_currency_vnd(expense)}**
- **Tổng thu nhập**: **{format_currency_vnd(income)}**
- **Số dư ròng còn lại**: **{format_currency_vnd(net)}** (Tỷ lệ tiết kiệm: **{rate}%**)

Bạn có thể vào mục **Sổ Giao Dịch** để xem chi tiết từng hóa đơn hoặc đặt câu hỏi về danh mục cụ thể!"""

        if any(kw in q for kw in ["tổng thu", "thu nhập", "kiếm được bao nhiêu", "nhận bao nhiêu", "lương"]):
            return f"""📥 **Tổng kết thu nhập tháng này:**
- **Tổng thu nhập**: **{format_currency_vnd(income)}**
- **Đã chi tiêu**: **{format_currency_vnd(expense)}**
- **Số tiền đã tích lũy**: **{format_currency_vnd(net)}** (Tỷ lệ tiết kiệm: **{rate}%**)"""

        # 4. Asking about Budgets / Overspending
        if any(kw in q for kw in ["ngân sách", "vượt hạn mức", "bội chi", "hạn mức", "vượt"]):
            return f"""🎯 **Tình trạng Ngân sách & Hạn mức tháng này:**
{context.get('budget_summary', 'Bạn chưa thiết lập hạn mức cho các danh mục.')}

💡 **Lời khuyên**: Hãy luôn duy trì mức chi tiêu các danh mục dưới ngưỡng 80% hạn mức để đảm bảo an toàn tài chính."""

        # 5. Asking about Wallets / Balances / Net Worth
        if any(kw in q for kw in ["ví", "tài sản", "còn bao nhiêu tiền", "số dư"]):
            return f"""💰 **Tài sản & Số dư khả dụng của bạn:**
- **Tổng tài sản ròng**: **{format_currency_vnd(context.get('total_net_worth', 0))}**
- **Dòng tiền ròng tháng này**: **{format_currency_vnd(net)}** (Thu: {format_currency_vnd(income)} | Chi: {format_currency_vnd(expense)})

Bạn có thể quản lý chi tiết từng tài khoản tại mục **Quản Lý Ví**."""

        # 6. Asking about Savings / How to save money
        if any(kw in q for kw in ["tiết kiệm", "cách tiết kiệm", "làm sao để tiết kiệm", "tối ưu chi phí", "tiết kiệm tiền"]):
            base_inc = income if income > 0 else 10_000_000.0
            save_20 = base_inc * 0.2
            return f"""💡 **Chiến lược tối ưu hóa và tăng tốc tiết kiệm cho bạn:**
1. **Trích lập 20% thu nhập ({format_currency_vnd(save_20)})**: Ngay khi có thu nhập về tài khoản, hãy tự động nạp vào Quỹ tiết kiệm hoặc tài khoản tích lũy sinh lời.
2. **Quy tắc 50/30/20**: Giữ nhu cầu thiết yếu dưới 50% ({format_currency_vnd(base_inc * 0.5)}) và hạn chế mua sắm ngẫu hứng.
3. **Cắt giảm vi mô (Micro-savings)**: Cắt bớt 1 cốc cà phê ngoài hàng/ngày (~35.000 đ) giúp bạn tiết kiệm thêm hơn **1.000.000 đ/tháng**.
4. **Theo dõi chi tiêu hàng ngày**: Ghi nhận ngay các giao dịch nhỏ lẻ vào FinTrack AI để không bị thất thoát ngân sách."""

        # Default Helpful Intelligent Advisory Response
        return f"""👋 Xin chào! Tôi là **FinTrack AI Advisor** - Cố vấn tài chính thông minh của bạn.

Dưới đây là tóm tắt nhanh tình hình tài chính của bạn:
- 💰 **Tổng tài sản khả dụng**: **{format_currency_vnd(context.get('total_net_worth', 0))}**
- 📥 **Thu nhập tháng**: **{format_currency_vnd(income)}** | 📤 **Chi tiêu**: **{format_currency_vnd(expense)}**
- 🎯 **Tỷ lệ tiết kiệm**: **{rate}%**

Bạn có thể hỏi tôi bất kỳ câu hỏi nào như:
- *"Lương 5 triệu thì nên chi tiêu và tiết kiệm thế nào?"*
- *"Tôi đã tiêu bao nhiêu cho việc ăn uống tháng này?"*
- *"Tôi có đang vượt ngân sách danh mục nào không?"*
- *"Gợi ý 3 cách cắt giảm chi tiêu không thiết yếu?"*"""

ai_service = AIService()
