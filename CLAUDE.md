# CLAUDE.md - Coding Agent Guidelines for FinTrack AI

## 1. Project Overview & Context
**FinTrack AI** (Hệ thống Quản lý Chi tiêu Cá nhân tích hợp Trí tuệ Nhân tạo) là sản phẩm học phần Ứng dụng Trí tuệ Nhân tạo do **Nhóm 03** (Đặng Quyết Thắng, Nguyễn Văn Tiến, Quách Minh Hiếu) nghiên cứu và phát triển dưới sự hướng dẫn của Giảng viên **Hà Thị Thanh** (Trường ĐH CNTT & Truyền thông - Đại học Thái Nguyên, 2026).

Hệ thống cung cấp giải pháp quản lý tài chính cá nhân toàn diện:
- **Nguyên tắc phân bổ tài chính 50/30/20**: Tự động nhóm danh mục thành *Nhu cầu thiết yếu (50%)*, *Mong muốn & Hưởng thụ (30%)*, *Tiết kiệm & Tích lũy (20%)*.
- **Bóc tách giao dịch tự nhiên bằng AI (FinTrack AI Parser)**: Phân tích câu nói/văn bản Tiếng Việt tự nhiên qua **Google Gemini 1.5 Pro** để trích xuất số tiền, danh mục, ví thanh toán tức thì.
- **Bác sĩ Tài chính AI & Zero-PII Leakage Policy**: Trợ lý ảo cố vấn tài chính 24/7 với cơ chế khử định danh PII (loại bỏ họ tên, email, số tài khoản) trước khi gửi context sang mô hình AI.
- **Quản lý đa ví & Chuyển tiền Double-Entry**: Quản lý Tiền mặt, Ngân hàng, Ví điện tử (MoMo, ZaloPay), Sổ tiết kiệm với cân bằng tài sản ròng.
- **Gamification & Hệ thống 24 Huy hiệu**: Cơ chế tăng cấp Level, tích lũy điểm thưởng XP, chuỗi ngày liên tục (Streak) và 4 hạng huy hiệu (Đồng, Bạc, Vàng, Kim Cương, Huyền Thoại).
- **Cyber Control Center (Admin Portal)**: Bảng điều khiển quản trị toàn diện người dùng, cấu hình System Prompts động, quản lý hạn mức Token AI, kiểm toán an ninh (Audit Logs) và sao lưu dữ liệu.

---

## 2. Technology Stack & Runtime Environment

| Layer | Technology | Details |
|---|---|---|
| **Backend Framework** | **FastAPI** (Python 3.10+) | Asynchronous RESTful API, Pydantic V2 schemas, Dependency Injection |
| **ORM & Database** | **SQLAlchemy** + **SQLite / PostgreSQL** | Quan hệ chuẩn hóa **3NF**, Foreign Key Cascades, Atomic Transactions |
| **Authentication** | **JWT (JSON Web Tokens) + Bcrypt** | Passlib + PyJWT, OAuth2 Password Bearer, Role-based Access Control (RBAC) |
| **AI Subsystem** | **Google Gemini 1.5 Pro API** | Tích hợp Zero-PII Sanitizer, Streaming & Prompt Engineering |
| **Frontend Framework** | **Vanilla JS (ES6+) SPA** | Single Page Application, Modular Component Pattern |
| **UI/UX Styling** | **Modern Glassmorphic Cyber Dark UI** | CSS3 Custom Properties, Responsive Layout, FontAwesome 6 |
| **Data Visualization** | **Chart.js** | Donut Chart cơ cấu chi tiêu, Bar/Line Chart xu hướng dòng tiền 6 tháng |
| **Export Engines** | **OpenPyXL / ReportLab / CSV** | Xuất báo cáo tài chính Excel, PDF, CSV đa định dạng |
| **Testing Framework** | **Pytest** | Unit tests, Integration tests, Test fixtures SQLite in-memory |

---

## 3. Project Structure & Codebase Map

```
HeThongChiTieuCaNhan1.0/
├── backend/
│   ├── app/
│   │   ├── config.py                 # Pydantic Settings, biến môi trường, AI Provider configs
│   │   ├── database.py               # SQLAlchemy Engine, SessionLocal, Base model
│   │   ├── main.py                   # FastAPI app factory, CORS, exception handlers & routing
│   │   ├── models/                   # SQLAlchemy ORM Models (Chuẩn hóa 3NF)
│   │   │   ├── user.py               # Entity User (id, email, role, target_income, subscription_tier)
│   │   │   ├── wallet.py             # Entity Wallet (id, user_id, name, type, balance, account_number)
│   │   │   ├── category.py           # Entity Category (id, user_id, name, type, group_50_30_20, icon)
│   │   │   ├── transaction.py        # Entity Transaction (id, wallet_id, category_id, amount, date)
│   │   │   ├── budget.py             # Entity Budget (id, category_id, month, year, limit_amount)
│   │   │   ├── saving_goal.py        # Entity SavingGoal (id, goal_name, target_amount, current_amount)
│   │   │   └── ai_log.py             # Entity AILog (id, user_id, prompt_tokens, log_type, latency_ms)
│   │   ├── schemas/                  # Pydantic validation schemas (Request/Response)
│   │   ├── services/                 # Business logic & Domain service layer
│   │   │   ├── ai_service.py         # Gemini API client, Zero-PII prompt sanitization & Health Score
│   │   │   ├── badge_service.py      # Gamification engine: Level, XP, Streak, 24 Badges calculation
│   │   │   ├── prompt_manager.py     # Quản lý & tinh chỉnh System Prompts động
│   │   │   ├── report_service.py     # Trích xuất dữ liệu Excel (.xlsx), PDF, CSV
│   │   │   └── seed_service.py       # Khởi tạo danh mục chuẩn 50/30/20 & tài khoản Demo
│   │   ├── routers/                  # REST API Controllers
│   │   │   ├── auth.py               # /api/v1/auth (Register, Login, Demo Access, Profile, Change Password)
│   │   │   ├── wallets.py            # /api/v1/wallets (CRUD Wallets, Fund Transfers)
│   │   │   ├── categories.py         # /api/v1/categories (CRUD Categories, Reset Defaults)
│   │   │   ├── transactions.py       # /api/v1/transactions (CRUD Transactions, Filters, Bill Uploads)
│   │   │   ├── budgets.py            # /api/v1/budgets (Monthly Spending Limits, Multi-tier Alerts)
│   │   │   ├── saving_goals.py       # /api/v1/savings (Savings Goals, Deposits from Wallets)
│   │   │   ├── analytics.py          # /api/v1/analytics (Net Worth, 50/30/20 Stats, Cashflow Trends)
│   │   │   ├── ai.py                 # /api/v1/ai (Natural Parsing, Health Check, Advisor Chat)
│   │   │   ├── badges.py             # /api/v1/badges (Gamification XP, Badges, Streaks)
│   │   │   ├── admin.py              # /api/v1/admin (User Management, AI Configs, Audit Logs, Broadcasts)
│   │   │   ├── backup.py             # /api/v1/backup (Database Snapshot Backup & Restore)
│   │   │   └── exports.py            # /api/v1/exports (Excel/PDF/CSV Download endpoints)
│   │   └── utils/                    # Security helpers (Bcrypt, JWT) & currency formatters
│   └── tests/                        # Pytest Test Suite
│       ├── conftest.py               # Fixtures CSDL in-memory, TestClient
│       ├── test_auth.py              # Kiểm thử xác thực & phân quyền
│       ├── test_wallets.py           # Kiểm thử ví tiền & chuyển tiền
│       ├── test_transactions.py      # Kiểm thử giao dịch & cập nhật số dư
│       ├── test_budgets.py           # Kiểm thử ngân sách & cảnh báo bội chi
│       ├── test_ai.py                # Kiểm thử Zero-PII & bóc tách AI
│       ├── test_badges.py            # Kiểm thử mở khóa thành tích & XP
│       └── test_admin.py             # Kiểm thử quyền Admin & cấu hình hệ thống
├── frontend/
│   ├── index.html                    # Single Page Application root container
│   ├── css/
│   │   └── style.css                 # Glassmorphic Cyber Dark theme styles & CSS variables
│   └── js/
│       ├── api.js                    # Fetch API client wrapper & JWT Token interceptor
│       ├── app.js                    # SPA state machine, view routing & event delegation
│       ├── components/               # Modular UI views
│       │   ├── auth.js               # Modal đăng nhập / đăng ký / Demo access
│       │   ├── dashboard.js          # Dashboard tổng quan tài sản ròng & chỉ số
│       │   ├── wallets.js            # Quản lý danh sách ví, chuyển tiền nội bộ
│       │   ├── categories.js         # Quản lý danh mục 50/30/20
│       │   ├── transactions.js       # Sổ giao dịch, lọc nâng cao, AI Quick Input Modal
│       │   ├── budgets.js            # Thanh tiến độ ngân sách & nhãn cảnh báo bội chi
│       │   ├── savings.js            # Mục tiêu tiết kiệm & nạp tiền trích ví
│       │   ├── analytics.js          # Biểu đồ Donut cơ cấu chi & dòng tiền 6 tháng
│       │   ├── ai_assistant.js       # Bác sĩ tài chính & Chatbot tư vấn 50/30/20
│       │   ├── badges.js             # Bảng 24 Huy hiệu, cấp độ Level, chuỗi Streak
│       │   └── admin.js              # Cyber Control Center (Quản trị toàn sàn)
│       └── utils/
│           └── formatters.js         # Tiện ích định dạng tiền tệ VND và ngày tháng
├── docs/                             # Tài liệu phân tích & đặc tả kỹ thuật
│   ├── 01_BUSINESS_ANALYSIS.md       # Nghiệp vụ tài chính & quy tắc 50/30/20
│   ├── 02_REQUIREMENTS_SPEC.md       # Đặc tả yêu cầu phần mềm (SRS)
│   ├── 03_DATABASE_DESIGN_ERD.md     # Thiết kế cơ sở dữ liệu quan hệ 3NF
│   ├── 04_WIREFRAMES_UI_DESIGN.md    # Thiết kế giao diện & luồng người dùng
│   ├── 05_AI_ARCHITECTURE_PROMPTS.md # Kiến trúc AI, Zero-PII & Prompts
│   └── 06_USER_API_GUIDE.md          # Hướng dẫn sử dụng & REST API
├── architecture.md                   # Kiến trúc tổng thể hệ thống (System Architecture)
├── codebase-map.md                   # Sơ đồ và chi tiết toàn bộ codebase
├── user_stories.md                   # Bản đặc tả User Story chi tiết theo chuẩn Agile
├── nhom3.docx                        # Báo cáo học phần dự án gốc (Nhóm 3)
├── requirements.txt                  # Danh sách thư viện Python phụ thuộc
├── pytest.ini                        # Cấu hình Pytest
├── run.py                            # Entrypoint khởi chạy hệ thống (Launcher)
└── .env.example                      # Mẫu biến môi trường
```

---

## 4. Developer Workflows & Commands

### 4.1. Môi trường & Khởi chạy (Windows PowerShell)
- **Kích hoạt Virtual Environment**:
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
- **Khởi chạy ứng dụng (Backend + Frontend Host)**:
  ```powershell
  .\venv\Scripts\python.exe run.py
  ```
  *(Hoặc chạy trực tiếp uvicorn: `.\venv\Scripts\uvicorn.exe backend.app.main:app --host 127.0.0.1 --port 8000 --reload`)*
- **Cài đặt thư viện mới**:
  ```powershell
  .\venv\Scripts\pip.exe install <package_name>
  .\venv\Scripts\pip.exe freeze > requirements.txt
  ```

### 4.2. Chạy Kiểm thử Tự động (Pytest)
- **Chạy toàn bộ Test Suite**:
  ```powershell
  .\venv\Scripts\pytest.exe -v
  ```
- **Chạy riêng từng phân hệ**:
  ```powershell
  .\venv\Scripts\pytest.exe backend/tests/test_auth.py -v
  .\venv\Scripts\pytest.exe backend/tests/test_transactions.py -v
  .\venv\Scripts\pytest.exe backend/tests/test_ai.py -v
  ```

---

## 5. Architectural Invariants & Mandatory Rules

> [!CAUTION]
> ### 1. Zero-PII Leakage Policy (Bảo mật Riêng tư AI)
> - **Tuyệt đối không bao giờ** gửi thông tin định danh cá nhân (PII: Họ tên, Email, Số điện thoại, Số tài khoản ngân hàng thô, ID người dùng) sang API của các mô hình LLM bên ngoài (Google Gemini API / OpenAI).
> - Mọi dữ liệu trước khi gửi sang AI phải qua module **`ai_service.sanitize_pii()`** để chuyển thành các số liệu tài chính ẩn danh (Anonymous Financial Aggregates).

> [!IMPORTANT]
> ### 2. Chuẩn hóa CSDL 3NF & Toàn vẹn Dữ liệu
> - Cơ sở dữ liệu bắt buộc tuân thủ Dạng chuẩn 3 (**3NF**). Mọi quan hệ giữa User, Wallet, Category, Transaction, Budget, SavingGoal phải có khóa ngoại với ràng buộc bảo vệ (`CASCADE` hoặc `RESTRICT`).
> - Không cho phép xóa danh mục hoặc ví khi đã có giao dịch phát sinh nếu chưa có bước xác nhận điều chuyển.
> - Mọi thao tác cập nhật số dư (nhập giao dịch, chuyển tiền ví, nạp tiết kiệm) phải thực thi trong một **Database Transaction nguyên tử (Atomic)** (`db.commit()` và `db.rollback()` khi lỗi).

> [!IMPORTANT]
> ### 3. Độ chính xác Tiền tệ (Currency Precision)
> - **Tuyệt đối không** dùng số thực `float` cho việc lưu trữ hoặc tính toán số dư tiền tệ. Dùng số nguyên `Integer` (đối với VND) hoặc kiểu dữ liệu số thực chính xác cao để loại trừ triệt để lỗi làm tròn.

> [!WARNING]
> ### 4. Phân quyền & Bảo mật Endpoint (RBAC)
> - Mọi endpoint riêng tư bắt buộc yêu cầu Header `Authorization: Bearer <JWT_TOKEN>`.
> - Các endpoint quản trị (`/api/v1/admin/*`) phải được bảo vệ bằng dependency `get_current_admin_user` (`current_user.role == 'ADMIN'`).
> - Mật khẩu được mã hóa một chiều bằng thuật toán `Bcrypt` an toàn trước khi lưu vào CSDL.

> [!TIP]
> ### 5. Nguyên tắc Quản lý DOM & Chart.js (Frontend)
> - Khi cập nhật hoặc vẽ lại biểu đồ Chart.js (Donut chart cơ cấu chi tiêu, Bar chart dòng tiền), **luôn gọi `chartInstance.destroy()`** trước khi khởi tạo biểu đồ mới trên `<canvas>` để chống hiện tượng chớp giật (jitter) và rò rỉ bộ nhớ.

---

## 6. Project Contacts & Contributors
- **Đặng Quyết Thắng**: Nghiệp vụ tài chính, quy tắc 50/30/20, Viết báo cáo & Hướng dẫn sử dụng.
- **Nguyễn Văn Tiến**: Phát triển Tầng giao diện (Frontend UI/UX), Xây dựng CSDL & Thiết kế hướng đối tượng.
- **Quách Minh Hiếu**: Phát triển Tầng xử lý nghiệp vụ Backend, Bảo mật Zero-PII, Tích hợp AI Engine & Kiểm thử hệ thống.
- **Giảng viên hướng dẫn**: ThS. Hà Thị Thanh (Khoa CNTT - ICTU, 2026).
