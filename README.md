# 💎 FinTrack AI - Hệ Thống Quản Lý Chi Tiêu Cá Nhân Thông Minh & AI Advisor

**FinTrack AI** là nền tảng quản lý tài chính cá nhân toàn diện, ứng dụng Trí tuệ Nhân tạo (Generative AI & Smart NLP) xuyên suốt chu trình quản lý dòng tiền: từ nhập liệu tự nhiên, tự động phân loại, kiểm soát hạn mức ngân sách, cảnh báo bội chi đến cố vấn tài chính 50/30/20 và hỏi đáp dữ liệu tài chính theo thời gian thực.

---

## 🌟 Tính Năng Nổi Bật

### 1. Quản Lý Tài Chính Toàn Diện
- 💳 **Quản lý đa ví & tài khoản**: Theo dõi số dư tiền mặt, thẻ ngân hàng, ví điện tử MoMo/ZaloPay, sổ tiết kiệm; chuyển tiền giữa các ví.
- 💸 **Quản lý giao dịch thu - chi**: Ghi nhận chi tiêu, thu nhập, chuyển tiền; đính kèm hóa đơn/bill; bộ lọc đa tiêu chí (ngày, danh mục, ví, khoảng tiền).
- 🎯 **Hạn mức ngân sách (Budget)**: Thiết lập hạn mức chi tiêu theo tháng/tuần cho từng danh mục; **tự động cảnh báo khi chạm 80% (Warning) và vượt 100% (Overspent)**.
- 🏆 **Mục tiêu tiết kiệm (Saving Goals)**: Lập mục tiêu tích lũy (Quỹ khẩn cấp, mua xe, du lịch), theo dõi tiến độ %, trích nạp tiền trực tiếp từ ví.
- 📈 **Báo cáo & Phân tích chuyên sâu**: Biểu đồ dòng tiền 6 tháng, cơ cấu chi tiêu Donut, đối chiếu quy tắc tài chính **50/30/20**.
- 📄 **Xuất báo cáo 1-Click**: Tải file **Excel (.xlsx)** định dạng kế toán, **CSV** (UTF-8 BOM), và **PDF**.

### 2. Tích Hợp Trí Tuệ Nhân Tạo (FinTrack AI Engine)
- ⚡ **AI Natural Language Parser (Bóc tách giao dịch tự nhiên)**:
  - Người dùng chỉ cần gõ câu tiếng Việt tự nhiên (VD: *"Ăn trưa bún bò 45k trả qua MoMo hôm qua"*, *"Lương 25tr vào Techcombank"*).
  - AI tự động trích xuất: Loại giao dịch, Số tiền, Danh mục, Ví thanh toán, Ngày giờ, Ghi chú -> Điền vào form xác nhận 1-click.
- 🩺 **AI Financial Health Advisor (Chẩn đoán sức khỏe 50/30/20)**:
  - Chấm điểm **Chỉ số Sức khỏe Tài chính (0-100)**.
  - Phân tích cơ cấu chi tiêu thực tế so với chuẩn (50% Thiết yếu, 30% Mong muốn, 20% Tiết kiệm).
  - Chỉ ra các danh mục nguy cơ bội chi và đề xuất **3 hành động cụ thể để tiết kiệm**.
- 🤖 **Financial Q&A Assistant (Trợ lý Hỏi - Đáp Tài Chính Cá Nhân)**:
  - Giải đáp các câu hỏi tự nhiên: *"Tháng này tôi đã chi bao nhiêu tiền ăn ngoài?"*, *"Tôi có đang vượt ngân sách không?"*, *"Làm sao để tiết kiệm 3 triệu tháng tới?"*.
  - Truy vấn số liệu thực tế an toàn và trả lời ngắn gọn, trực quan.
- 🛡 **Bảo Mật Dữ Liệu Riêng Tư (PII Protection)**:
  - Tự động ẩn số tài khoản ngân hàng (`****1234`), email, số điện thoại trước khi đưa vào context của mô hình AI.
- 🔄 **Hỗ Trợ Đa Nhà Cung Cấp & Fallback Offline**:
  - Hỗ trợ **Google Gemini API**, **OpenAI GPT-4o**, **Local Ollama**, và tích hợp sẵn **Bộ Phân Tích NLP Tiếng Việt Nội Bộ (Smart Fallback Engine)** giúp ứng dụng chạy 100% không cần kết nối mạng hay API key!

---

## 🛠 Công Nghệ Sử Dụng

- **Backend**: Python 3.12, FastAPI (Asynchronous RESTful API, Pydantic v2, JWT Security, Bcrypt).
- **Database & ORM**: SQLAlchemy 2.0, SQLite (mặc định cho local demo), sẵn sàng cho PostgreSQL / MySQL.
- **Frontend**: Single Page Application (SPA), HTML5/CSS3/JavaScript ES6 Modules, Tailwind CSS, FontAwesome 6, Chart.js, Canvas Confetti.
- **Data Export**: `openpyxl` (Excel), `reportlab` (PDF), `csv` (UTF-8 with BOM).
- **Testing**: `pytest`, `pytest-asyncio`, `httpx` (100% test pass).

---

## 🚀 Hướng Dẫn Khởi Chạy Nhanh

### 1. Kích hoạt môi trường ảo & Cài đặt thư viện
```bash
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Cài đặt thư viện (nếu cần)
pip install -r requirements.txt
```

### 2. Chạy ứng dụng bằng 1 lệnh duy nhất
```bash
py run.py
# hoặc
uvicorn backend.app.main:app --reload --port 8000
```
- Giao diện web người dùng: **http://127.0.0.1:8000**
- Tài liệu API tương tác (Swagger UI): **http://127.0.0.1:8000/docs**
- Tài liệu Redoc: **http://127.0.0.1:8000/redoc**

---

## 👥 Tài Khoản Mẫu Trải Nghiệm (Demo Credentials)

Hệ thống đã tự động nạp sẵn dữ liệu mẫu thực tế:

| Vai Trò | Email Đăng Nhập | Mật Khẩu | Dữ Liệu Có Sẵn |
|---|---|---|---|
| **Người Dùng (User)** | `user@fintrack.ai` | `User@123456` | 4 Ví (Techcombank, MoMo, Tiền mặt, VPBank), 18 Danh mục chuẩn, 30+ Giao dịch 3 tháng, Hạn mức ngân sách, Mục tiêu tiết kiệm |
| **Quản Trị Viên (Admin)** | `admin@fintrack.ai` | `Admin@123456` | Quyền quản trị toàn hệ thống |

---

## 🧪 Chạy Bộ Kiểm Thử (Unit & Integration Tests)

```bash
.\venv\Scripts\pytest.exe -v
```
Kết quả kiểm thử: **20/20 Test Cases Passed (100%)** bao gồm Xác thực JWT, Quản lý Ví, Giao dịch & Hoàn tiền, Tính toán Ngân sách 80%/100%, NLP AI Parser, Khử dữ liệu PII và Phân tích tài chính.

---

## 📁 Cấu Trúc Dự Án

```
HeThongChiTieuCaNhan1.0/
├── backend/
│   ├── app/
│   │   ├── config.py           # Cấu hình hệ thống, JWT secret, AI Provider
│   │   ├── database.py         # SQLAlchemy engine & SessionLocal
│   │   ├── main.py             # FastAPI entry point & CORS
│   │   ├── models/             # User, Wallet, Category, Transaction, Budget, SavingGoal, AIChatLog
│   │   ├── schemas/            # Pydantic v2 validation schemas
│   │   ├── routers/            # Auth, Wallets, Categories, Transactions, Budgets, SavingGoals, Analytics, Exports, AI, Backup
│   │   ├── services/           # AI Service, Prompt Manager, Report Generator, Seed Service
│   │   └── utils/              # Bcrypt security, PII sanitizer
│   └── tests/                  # Bộ test cases pytest hoàn chỉnh
├── frontend/
│   ├── index.html              # Giao diện Single Page Application hiện đại
│   ├── css/style.css           # Glassmorphism & Fintech theme styles
│   └── js/
│       ├── api.js              # Centralized API fetch client with JWT
│       ├── app.js              # Router & state manager
│       ├── components/         # Dashboard, Transactions, Wallets, Budgets, Savings, Analytics, AI Assistant, Auth
│       └── utils/              # Currency/Date formatters
├── prompts/                    # Thư mục Prompt Templates độc lập
│   ├── transaction_parser.prompt.md
│   ├── financial_health.prompt.md
│   ├── financial_qa.prompt.md
│   └── smart_budget_advisor.prompt.md
├── docs/                       # Toàn bộ tài liệu nghiệp vụ, SRS, ERD, Wireframes, AI Specs
│   ├── 01_BUSINESS_ANALYSIS.md
│   ├── 02_REQUIREMENTS_SPEC.md
│   ├── 03_DATABASE_DESIGN_ERD.md
│   ├── 04_WIREFRAMES_UI_DESIGN.md
│   ├── 05_AI_ARCHITECTURE_PROMPTS.md
│   └── 06_USER_API_GUIDE.md
├── .env.example
├── .env
├── requirements.txt
├── pytest.ini
├── run.py
└── README.md
```
