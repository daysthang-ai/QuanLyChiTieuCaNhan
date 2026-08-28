# BẢN ĐỒ CƠ SỞ MÃ NGUỒN (CODEBASE MAP) - FINTRACK AI

> **Dự án**: FinTrack AI - Nền tảng Quản lý Tài chính Cá nhân Tích hợp Trí tuệ Nhân tạo  
> **Nhóm thực hiện**: Nhóm 03 (Đặng Quyết Thắng, Nguyễn Văn Tiến, Quách Minh Hiếu)  
> **Khoa CNTT - Trường Đại học CNTT & Truyền thông (ICTU) - 2026**

---

## 1. Cây Thư Mục Tổng Quan Dự Án

Toàn bộ mã nguồn dự án được tổ chức theo cấu trúc phân tầng rõ rệt (**Layered & Modular Architecture**):

```
HeThongChiTieuCaNhan1.0/
├── backend/                                # TẦNG XỬ LÝ NGHIỆP VỤ BACKEND & RESTFUL API
│   ├── app/
│   │   ├── __init__.py                     # Package entry point của backend app
│   │   ├── config.py                       # Cấu hình biến môi trường & Pydantic Settings
│   │   ├── database.py                     # Kết nối CSDL SQLAlchemy, SessionLocal & Engine WAL
│   │   ├── main.py                         # Điểm khởi tạo FastAPI App, CORS, Static & gắn Routers
│   │   ├── models/                         # ORM Models (11 Thực thể CSDL quan hệ chuẩn 3NF)
│   │   │   ├── __init__.py                 # Export toàn bộ 11 thực thể ORM
│   │   │   ├── user.py                     # Model User & Phân quyền RBAC (USER, MODERATOR, ADMIN)
│   │   │   ├── wallet.py                   # Model Wallet (Ví 2 tầng: Virtual Sandbox & Real Payment)
│   │   │   ├── category.py                 # Model Category (Danh mục chi tiêu 4 nhóm 50/30/20)
│   │   │   ├── transaction.py              # Model Transaction (Bút toán Thu / Chi / Chuyển Ví)
│   │   │   ├── budget.py                   # Model Budget (Hạn mức ngân sách tháng & cờ cảnh báo)
│   │   │   ├── saving_goal.py              # Model SavingGoal (Mục tiêu tiết kiệm & tích lũy)
│   │   │   ├── ai_log.py                   # Model AIChatLog (Lịch sử truy vấn AI, Token, Latency)
│   │   │   ├── notification.py             # Model Notification, NotificationRead, NotificationDismiss
│   │   │   ├── subscription_order.py       # Model SubscriptionOrder (Đơn nạp VIP, mã VietQR)
│   │   │   ├── support_ticket.py           # Model SupportTicket (Yêu cầu khiếu nại & hỗ trợ kỹ thuật)
│   │   │   ├── system_bank_account.py      # Model SystemBankAccount & BankTransaction (Webhook SePay)
│   │   │   └── system_setting.py           # Model SystemSetting (Key-Value Dynamic Settings)
│   │   ├── schemas/                        # Pydantic Data Validation Schemas (Input/Output DTO)
│   │   │   ├── __init__.py                 # Export toàn bộ schemas
│   │   │   ├── user.py                     # Schemas UserCreate, UserLogin, UserResponse, PasswordChange
│   │   │   ├── wallet.py                   # Schemas WalletCreate, WalletUpdate, WalletTransfer, WalletResponse
│   │   │   ├── category.py                 # Schemas CategoryCreate, CategoryUpdate, CategoryResponse
│   │   │   ├── transaction.py              # Schemas TransactionCreate, TransactionFilter, TransactionResponse
│   │   │   ├── budget.py                   # Schemas BudgetCreate, BudgetUpdate, BudgetResponse
│   │   │   ├── saving_goal.py              # Schemas SavingGoalCreate, SavingGoalDeposit, SavingGoalResponse
│   │   │   ├── ai.py                       # Schemas AIParseRequest, AIAdvisorRequest, AIHealthScoreResponse
│   │   │   └── analytics.py                # Schemas CashflowResponse, CategoryBreakdown, HealthCheck
│   │   ├── services/                       # Tầng dịch vụ nghiệp vụ (Business Domain Services)
│   │   │   ├── __init__.py                 # Export service classes
│   │   │   ├── ai_service.py               # Client Google Gemini 1.5/3.7, Zero-PII Sanitizer & Advisor
│   │   │   ├── badge_service.py            # Hệ thống Gamification: 24 Huy hiệu, Level, XP, Streak
│   │   │   ├── prompt_manager.py           # Quản lý & Tinh chỉnh System Prompts động
│   │   │   ├── report_service.py           # Xuất báo cáo tài chính Excel (.xlsx), PDF, CSV
│   │   │   └── seed_service.py             # Khởi tạo CSDL mẫu & Danh mục mặc định 50/30/20
│   │   ├── routers/                        # Tầng điều khiển API (API Endpoints Controllers)
│   │   │   ├── __init__.py                 # Gắn kết router
│   │   │   ├── auth.py                     # /api/v1/auth - Đăng ký, Đăng nhập, Demo Access, Đổi mật khẩu
│   │   │   ├── wallets.py                  # /api/v1/wallets - Quản lý ví 2 tầng, Chuyển tiền Double-Entry
│   │   │   ├── categories.py               # /api/v1/categories - CRUD Danh mục & Khôi phục mặc định
│   │   │   ├── transactions.py             # /api/v1/transactions - CRUD Bút toán, Bộ lọc & Upload Bill
│   │   │   ├── budgets.py                  # /api/v1/budgets - Hạn mức tháng & Cảnh báo bội chi
│   │   │   ├── saving_goals.py             # /api/v1/savings - Mục tiêu tiết kiệm & Nạp tiền trích ví
│   │   │   ├── analytics.py                # /api/v1/analytics - Thống kê tài sản ròng, 50/30/20, Dòng tiền
│   │   │   ├── ai.py                       # /api/v1/ai - Bóc tách giao dịch tự nhiên, Bác sĩ tài chính
│   │   │   ├── badges.py                   # /api/v1/badges - Truy vấn danh hiệu, Điểm XP, Chuỗi ngày
│   │   │   ├── admin.py                    # /api/v1/admin - Control Center, Quản lý User, Prompts, Token, Logs
│   │   │   ├── backup.py                   # /api/v1/backup - Sao lưu Snapshot CSDL & Khôi phục
│   │   │   ├── exports.py                  # /api/v1/exports - Tải file báo cáo Excel / PDF / CSV
│   │   │   ├── notifications.py            # /api/v1/notifications - Hộp thư cá nhân & Broadcast
│   │   │   ├── payments.py                 # /api/v1/payments - Cổng VietQR MB Bank, SePay Webhook
│   │   │   ├── subscriptions.py            # /api/v1/subscriptions - Đăng ký & Nâng cấp gói VIP
│   │   │   └── support.py                  # /api/v1/support - Quản lý Ticket hỗ trợ & Khiếu nại
│   │   └── utils/                          # Module tiện ích bảo mật & xử lý chuỗi
│   │       ├── __init__.py                 # Export utilities
│   │       ├── security.py                 # Mã hóa Bcrypt, tạo & giải mã JWT Token
│   │       └── sanitizer.py                # Biểu thức chính quy Regex khử PII thô
│   └── tests/                              # BỘ KIỂM THỬ TỰ ĐỘNG (55 TEST CASES)
│       ├── __init__.py                     # Package tests
│       ├── conftest.py                     # Fixture client test, database cô lập & mock tokens
│       ├── test_admin.py                   # Kiểm thử Control Center, đổi quyền, khóa user, settings
│       ├── test_ai.py                      # Kiểm thử AI Parser, Zero-PII Sanitizer, Health Score
│       ├── test_auth.py                    # Kiểm thử Đăng ký, Đăng nhập, Demo Login, Lockout 2 tầng
│       ├── test_badges.py                  # Kiểm thử Gamification, tính chuỗi Streak, cấp bậc Level
│       ├── test_budgets.py                 # Kiểm thử Hạn mức tháng, cảnh báo ngưỡng 80% & 100%
│       ├── test_notifications.py           # Kiểm thử Broadcast thông báo, lọc theo gói, đánh dấu đã đọc
│       ├── test_payments.py                # Kiểm thử Cổng VietQR, SePay Webhook, nạp tiền tự động
│       ├── test_transactions.py            # Kiểm thử Bút toán Thu/Chi/Transfer, cập nhật số dư ví
│       ├── test_vip_and_support.py         # Kiểm thử Quota gói VIP, gửi ticket hỗ trợ kỹ thuật
│       └── test_wallets.py                 # Kiểm thử Ví 2 tầng, chuyển tiền nguyên tử, Open Banking
├── frontend/                               # TẦNG GIAO DIỆN NGƯỜI DÙNG SINGLE PAGE APPLICATION (SPA)
│   ├── index.html                          # Khung HTML gốc của SPA, Master Floating Glass Container
│   ├── css/
│   │   └── style.css                       # Neo-Futuristic Glassmorphic Dark UI & @property 120fps Neon Border
│   └── js/
│       ├── api.js                          # Wrapper gọi Fetch API tập trung, JWT Interceptor & Hard Lockout
│       ├── app.js                          # SPA State Manager, Điều hướng Tab & Global Event Bus
│       ├── components/                     # Các Controller giao diện theo từng Module
│       │   ├── auth.js                     # Đăng nhập, Đăng ký, Đổi mật khẩu, Chuyển đổi Demo
│       │   ├── dashboard.js                # Tổng quan tài sản ròng, Widget Doughnut Chart 6 màu neon
│       │   ├── wallets.js                  # Quản lý ví 2 tầng, Thêm ví mới, Chuyển tiền nội bộ
│       │   ├── categories.js               # Quản lý danh mục theo nhóm 50/30/20, chọn icon & mã màu
│       │   ├── transactions.js             # Sổ giao dịch, Bộ lọc nâng cao, Modal AI Quick Parse
│       │   ├── budgets.js                  # Thanh tiến độ ngân sách & Cảnh báo đa cấp (Xanh/Vàng/Đỏ)
│       │   ├── savings.js                  # Mục tiêu tiết kiệm, đếm ngược ngày & Nạp tiền trích từ ví
│       │   ├── analytics.js                # Biểu đồ Doughnut cơ cấu chi & Cột dòng tiền 6 tháng
│       │   ├── ai_assistant.js             # Bác sĩ tài chính & Chatbot tư vấn 50/30/20 24/7
│       │   ├── badges.js                   # Bảng 24 Huy hiệu Gamification, Cấp độ Level, Chuỗi Streak
│       │   ├── notifications.js            # Hộp thư thông báo người dùng, đánh dấu đọc & dismiss
│       │   ├── subscription.js             # Bảng giá 4 gói VIP, Sinh mã VietQR MB Bank & Polling trạng thái
│       │   ├── support.js                  # Gửi ticket hỗ trợ, theo dõi tiến độ giải quyết khiếu nại
│       │   └── admin.js                    # Admin Control Center: 5 tab settings, duyệt VIP, AI token, logs
│       └── utils/
│           └── formatters.js               # Định dạng số tiền VND, che STK (*), ngày giờ định dạng Việt Nam
├── scripts/ & root runners                 # CÁC SCRIPT KHỞI CHẠY & TIỆN ÍCH QUẢN TRỊ
│   ├── run.py                              # Script Python Runner: Tự chuyển venv, giải phóng port 8000
│   ├── run.bat                             # File Batch khởi chạy 1-Click trên Windows
│   ├── run.ps1                             # Script PowerShell khởi chạy tự động
│   ├── Khoi_Chay_FinTrack_AI.bat           # File khởi chạy nhanh console UTF-8
│   ├── KhoiChay_FinTrack.cmd               # Phím tắt Command Prompt khởi động
│   ├── KhoiChay_FinTrack.vbs               # VBScript chạy nền không hiện cửa sổ đen
│   ├── Tao_Shortcut_Desktop.vbs            # Tạo biểu tượng lối tắt ngoài Desktop
│   ├── Fix_Loi_Mo_File_Bat.bat             # Script sửa lỗi môi trường Windows batch
│   ├── seed_admin_finance.py               # Chuẩn hóa 5 ví, 30+ giao dịch mẫu cho tài khoản Admin
│   ├── reset_user_data.py                  # Đưa tài khoản user@fintrack.ai về 0đ ban đầu
│   ├── clean_db.py                         # Dọn sạch CSDL SQLite, đưa toàn bộ ví về 0 VNĐ
│   └── build_presentation.py               # Script tạo tự động slide PowerPoint báo cáo đề tài
├── docs/                                   # TÀI LIỆU KỸ THUẬT & HỒ SƠ THIẾT KẾ
│   ├── 01_BUSINESS_ANALYSIS.md             # Phân tích bài toán nghiệp vụ tài chính cá nhân
│   ├── 02_REQUIREMENTS_SPEC.md             # Đặc tả yêu cầu chức năng và phi chức năng
│   ├── 03_DATABASE_DESIGN_ERD.md           # Thiết kế CSDL quan hệ 11 bảng chuẩn 3NF
│   ├── 04_WIREFRAMES_UI_DESIGN.md          # Thiết kế Wireframes giao diện SPA
│   ├── 05_AI_ARCHITECTURE_PROMPTS.md       # Cấu trúc System Prompts & Pipeline Zero-PII
│   └── 06_USER_API_GUIDE.md                # Hướng dẫn tích hợp API và tài liệu Swagger
├── erd.mmd                                 # Mã nguồn Mermaid ERD 11 bảng thực thể CSDL 3NF
├── erd_style.css                           # Theme styling cho sơ đồ CSDL Mermaid
├── mermaid-config.json                     # Cấu hình render Mermaid Dark Cyber theme
├── architecture.md                         # Tài liệu thiết kế kiến trúc hệ thống chi tiết
├── codebase-map.md                         # Bản đồ tổ chức cơ sở mã nguồn (Tài liệu này)
├── user_stories.md                         # Đặc tả 19 Use Cases và 16 Test Cases
├── nhom3_extracted.txt                     # Nội dung báo cáo Word đồ án Nhóm 03 trích xuất
├── nhom3.docx                              # File Word gốc báo cáo học phần AI
├── BaoCao_FinTrackAI_Demo.pptx             # File slide thuyết trình PowerPoint của nhóm
├── CLAUDE.md                               # Hướng dẫn nguyên tắc lập trình và Agent guidelines
├── requirements.txt                        # Danh sách thư viện Python phụ thuộc
├── pytest.ini                              # Cấu hình Pytest test discovery
└── .env.example                            # Mẫu thiết lập biến môi trường chuẩn
```

---

## 2. Chi Tiết Tầng Backend (`backend/app/`)

### 2.1. Cấu Hình & Kết Nối CSDL
- **[`config.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/config.py)**: Khai báo lớp `Settings` kế thừa từ `pydantic_settings.BaseSettings`, nạp cấu hình `.env`: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM` (`HS256`), `ACCESS_TOKEN_EXPIRE_MINUTES`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `SEPAY_API_TOKEN`, `SEPAY_WEBHOOK_SECRET`.
- **[`database.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/database.py)**: Khởi tạo SQLAlchemy Engine với SQLite WAL mode, cung cấp `SessionLocal` và Dependency `get_db()`.
- **[`main.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/main.py)**: Điểm vào chính của ứng dụng FastAPI. Thiết lập `CORSMiddleware`, phục vụ Static Files (`/static` và `/uploads`), gắn kết toàn bộ 14 API Routers dưới tiền tố `/api/v1/*` và `/api/*`.

### 2.2. Danh Mục 11 Thực Thể Dữ Liệu Chuẩn 3NF (`backend/app/models/`)
1. **[`user.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/models/user.py)** (`users`): Quản lý định danh, mật khẩu Bcrypt, vai trò RBAC (`USER`, `MODERATOR`, `ADMIN`), trạng thái (`ACTIVE`, `LOCKED`), gói cước VIP (`FREE`, `PRO`, `PREMIUM`, `PLATINUM`), thời hạn gói và tiền tệ.
2. **[`wallet.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/models/wallet.py)** (`wallets`): Quản lý ví 2 tầng: `wallet_scope = "virtual"` (Sandbox kế toán cá nhân) và `wallet_scope = "real"` (Ví thanh toán tiền thật).
3. **[`category.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/models/category.py)** (`categories`): Danh mục thu/chi phân chia 4 nhóm chuẩn 50/30/20 (`NEEDS`, `WANTS`, `SAVINGS`, `INCOME`), hỗ trợ danh mục mẫu dùng chung (`user_id = NULL`).
4. **[`transaction.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/models/transaction.py)** (`transactions`): Bút toán thu, chi, chuyển ví nội bộ (`TRANSFER`), đính kèm link ảnh hóa đơn, cờ nhận diện AI (`created_by_ai`).
5. **[`budget.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/models/budget.py)** (`budgets`): Hạn mức chi tiêu tháng theo danh mục, cờ đánh dấu gửi cảnh báo 80% (`alert_80_sent`) và bội chi 100% (`alert_100_sent`).
6. **[`saving_goal.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/models/saving_goal.py)** (`saving_goals`): Mục tiêu tích lũy tài chính, số tiền mục tiêu, số tiền đã tích lũy và hạn chót.
7. **[`ai_log.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/models/ai_log.py)** (`ai_chat_logs`): Nhật ký kiểm toán AI đã bóc tách Zero-PII, lưu trữ Prompt Template, thời gian xử lý (`response_time_ms`).
8. **[`notification.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/models/notification.py)** (`notifications`, `notification_reads`, `notification_dismissals`): Quản lý hộp thư thông báo trực tiếp và Broadcast toàn sàn.
9. **[`subscription_order.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/models/subscription_order.py)** (`subscription_orders`): Đơn mua gói VIP, mã đơn hàng (`order_code`), phương thức VietQR MB Bank, trạng thái (`PENDING`, `APPROVED`, `REJECTED`).
10. **[`support_ticket.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/models/support_ticket.py)** (`support_tickets`): Tiếp nhận yêu cầu khiếu nại, hỗ trợ kỹ thuật và phản hồi từ Admin.
11. **[`system_bank_account.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/models/system_bank_account.py)** (`system_bank_accounts`, `bank_transactions`): Quản lý thông tin tài khoản ngân hàng thụ hưởng của sàn và nhật ký Webhook đối soát SePay.
12. **[`system_setting.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/models/system_setting.py)** (`system_settings`): Lưu trữ cấu hình động Key-Value của hệ thống.

### 2.3. Lớp Dịch Vụ Nghiệp Vụ (`backend/app/services/`)
- **[`ai_service.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/services/ai_service.py)**:
  - `sanitize_pii(text)`: Sử dụng biểu thức chính quy Regex khử sạch tên riêng, email, số điện thoại, số tài khoản ngân hàng.
  - `parse_transaction_natural_language(text, user_context)`: Gọi Google Gemini 1.5 Pro / 3.7 Flash bóc tách câu tiếng Việt thành cấu trúc JSON `{amount, type, category_name, wallet_name, note}`.
  - `calculate_financial_health_score(metrics)`: Chấm điểm sức khỏe tài chính thang 100 dựa trên tỷ lệ tuân thủ 50/30/20.
  - `chat_financial_advisor(user_message, anonymous_summary)`: Trợ lý AI cố vấn tài chính 50/30/20 bảo mật Zero-PII.
- **[`badge_service.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/services/badge_service.py)**: Động cơ Gamification tính chuỗi Streak, điểm XP, 6 cấp bậc Level và tự động mở khóa bộ 24 Huy hiệu thành tích.
- **[`prompt_manager.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/services/prompt_manager.py)**: Quản trị và lưu trữ nội dung System Prompts động cho AI Parser và AI Advisor.
- **[`report_service.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/services/report_service.py)**: Xuất báo cáo tài chính định dạng Excel (`.xlsx`), PDF và CSV.
- **[`seed_service.py`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/backend/app/services/seed_service.py)**: Nạp bộ danh mục chuẩn 50/30/20 và tạo sẵn tài khoản mẫu Admin, Moderator, User.

### 2.4. Danh Mục API Routers (`backend/app/routers/`)

| Router File | Tiền Tố API | Vai Trò & Chức Năng Chính | Phân Quyền |
| :--- | :--- | :--- | :--- |
| **`auth.py`** | `/api/v1/auth` | Đăng ký, Đăng nhập, Demo Login, Lấy profile cá nhân, Đổi mật khẩu | Public / Authenticated |
| **`wallets.py`** | `/api/v1/wallets` | CRUD ví 2 tầng (`virtual`/`real`), Chuyển tiền nội bộ Double-Entry | Authenticated |
| **`categories.py`**| `/api/v1/categories`| CRUD danh mục 50/30/20, Khôi phục danh mục mẫu hệ thống | Authenticated |
| **`transactions.py`**| `/api/v1/transactions`| CRUD bút toán, Bộ lọc nâng cao, Đính kèm ảnh hóa đơn | Authenticated |
| **`budgets.py`** | `/api/v1/budgets` | Thiết lập hạn mức tháng, Tính % chi tiêu & Cảnh báo đa cấp | Authenticated |
| **`saving_goals.py`**| `/api/v1/savings` | Lập mục tiêu tích lũy, Nạp tiền trích từ ví, Đếm ngược ngày | Authenticated |
| **`analytics.py`** | `/api/v1/analytics` | Thống kê tài sản ròng, Phân tích 50/30/20, Dòng tiền 6 tháng | Authenticated |
| **`ai.py`** | `/api/v1/ai` | Bóc tách ngôn ngữ tự nhiên, Chấm điểm tài chính, Chat AI 24/7 | Authenticated |
| **`badges.py`** | `/api/v1/badges` | Danh sách 24 huy hiệu, Điểm XP, Cấp độ Level, Chuỗi Streak | Authenticated |
| **`notifications.py`**| `/api/v1/notifications`| Hộp thư thông báo người dùng, Đánh dấu đọc, Dismiss | Authenticated |
| **`subscriptions.py`**| `/api/v1/subscriptions`| Bảng giá 4 gói VIP, Tạo đơn hàng, Kiểm tra trạng thái đơn | Authenticated |
| **`payments.py`** | `/api/v1/payments` | Cổng VietQR MB Bank, SePay Webhook tự động khớp đơn nạp | Public / Webhook / Admin |
| **`support.py`** | `/api/v1/support` | Gửi ticket hỗ trợ, Lịch sử yêu cầu khiếu nại | Authenticated |
| **`admin.py`** | `/api/v1/admin` | Control Center, Quản trị người dùng, AI Prompts, Token Quota, Logs | Root Admin / Moderator |
| **`backup.py`** | `/api/v1/backup` | Tạo Snapshot Database JSON, Khôi phục dữ liệu hệ thống | Root Admin |
| **`exports.py`** | `/api/v1/exports` | Tải xuống file báo cáo Excel / PDF / CSV | Authenticated |

---

## 3. Chi Tiết Tầng Frontend (`frontend/`)

### 3.1. Cấu Trúc Giao Diện & Điều Khiển SPA
- **[`index.html`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/frontend/index.html)**:
  - Khung HTML Single Page Application (SPA).
  - Header nổi độc lập (`glass-nav`), nút truy cập nhanh AI, chuông thông báo có badge số lượng unread.
  - Sidebar 2 chế độ: Menu Cá Nhân (10 mục) & Menu Admin Control Center (10 mục).
  - Master Floating Glass Container (`#main-glass-wrapper`) bao trọn vùng nội dung chính.
- **[`css/style.css`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/frontend/css/style.css)**:
  - Phong cách thiết kế **Neo-Futuristic Glassmorphism**.
  - Lớp viền **Animated Glowing Neon Border** với `conic-gradient` 360 độ quay 8s đồng bộ.
  - Ambient Light Orbs phát sáng đa sắc dưới nền.
- **[`js/api.js`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/frontend/js/api.js)**:
  - Lớp `ApiClient` đóng gói toàn bộ phương thức gọi HTTP Fetch.
  - Tự động chèn header `Authorization: Bearer <TOKEN>`.
  - **Hard Lockout Interceptor**: Bắt mã lỗi `401` và `403` (tài khoản bị khóa) để tự động xóa session và điều hướng ra trang đăng nhập.
- **[`js/app.js`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/frontend/js/app.js)**:
  - Quản lý trạng thái Client tập trung (`currentUser`, `wallets`, `categories`, `activeTab`).
  - Chuyển đổi tab không tải lại trang (`switchTab(tabName)`).
  - Đồng bộ số liệu giữa các màn hình qua Event Listener.

### 3.2. Thành Phần Giao Diện Modun Hóa (`frontend/js/components/`)
1. **[`auth.js`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/frontend/js/components/auth.js)**: Đăng nhập chuẩn, Đăng ký mới, Đăng nhập nhanh Demo (User / Admin), Đổi mật khẩu.
2. **[`dashboard.js`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/frontend/js/components/dashboard.js)**: 4 thẻ KPI tài chính, nút che/hiện số dư, Widget **Doughnut Chart** cơ cấu chi tiêu với tâm rỗng và 6 mã màu neon, danh sách bút toán gần đây.
3. **[`wallets.js`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/frontend/js/components/wallets.js)**: Hiển thị thẻ ví ngân hàng/ví điện tử, phân tách ví `virtual` và `real`, modal chuyển tiền Double-Entry.
4. **[`categories.js`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/frontend/js/components/categories.js)**: Quản trị cây danh mục 4 nhóm 50/30/20, tùy biến icon và màu sắc.
5. **[`transactions.js`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/frontend/js/components/transactions.js)**: Sổ giao dịch dạng bảng, bộ lọc thời gian/danh mục/ví, Modal bóc tách tự nhiên bằng AI Parser, xuất file Excel/PDF.
6. **[`budgets.js`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/frontend/js/components/budgets.js)**: Hạn mức tháng, thanh tiến độ 3 cấp (Xanh <80%, Vàng 80-99%, Đỏ $\ge$100% Bội chi).
7. **[`savings.js`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/frontend/js/components/savings.js)**: Thẻ mục tiêu tích lũy, đếm ngược ngày, modal nạp tiền trích trực tiếp từ ví.
8. **[`analytics.js`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/frontend/js/components/analytics.js)**: Biểu đồ Donut tỷ trọng chi tiêu, Biểu đồ Cột - Đường dòng tiền 6 tháng, kiểm tra tỷ lệ chuẩn 50/30/20.
9. **[`ai_assistant.js`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/frontend/js/components/ai_assistant.js)**: Bác sĩ tài chính chẩn đoán dòng tiền, Khung chat cố vấn 50/30/20 thông minh 24/7.
10. **[`badges.js`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/frontend/js/components/badges.js)**: Bảng vinh danh 24 Huy hiệu Gamification, thanh tiến độ Level & XP, huy hiệu Streak.
11. **[`subscription.js`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/frontend/js/components/subscription.js)**: Bảng giá 4 gói cước VIP, modal thanh toán sinh mã VietQR Napas 247 động và polling trạng thái đơn hàng tự động.
12. **[`notifications.js`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/frontend/js/components/notifications.js)**: Hộp thư thông báo cá nhân và tin tức từ Ban Quản trị.
13. **[`support.js`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/frontend/js/components/support.js)**: Gửi phiếu khiếu nại/hỗ trợ kỹ thuật và theo dõi phản hồi giải quyết.
14. **[`admin.js`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/frontend/js/components/admin.js)**: Admin Control Center toàn diện: Giám sát DAU/MAU, quản lý bảng User, Khóa/Mở tài khoản, Cổng VietQR Admin, Quản trị AI Prompts & Token Quota, Bảng Audit Log thời gian thực, 5 Tab Cài Đặt Hệ Thống.

---

## 4. Danh Mục Scripts & Tiện Ích Khởi Chạy

| Tên File Script | Mô Tả Chức Năng & Cách Sử Dụng |
| :--- | :--- |
| **`run.py`** | Script Runner thông minh: Kiểm tra môi trường ảo `venv`, tự giải phóng cổng 8000 bị kẹt, tự bật trình duyệt khi server phản hồi.<br>`python run.py` |
| **`run.bat`** | File Batch khởi chạy 1-Click trên Windows Command Prompt.<br>`.\run.bat` |
| **`run.ps1`** | Script PowerShell khởi chạy tự động với thiết lập mã hóa UTF-8 tiếng Việt chuẩn.<br>`.\run.ps1` |
| **`Khoi_Chay_FinTrack_AI.bat`** | File batch khởi động nhanh với giao diện console hiển thị đẹp mắt. |
| **`KhoiChay_FinTrack.vbs`** | Script Visual Basic khởi chạy máy chủ ẩn dưới nền không hiện cửa sổ Command Prompt. |
| **`Tao_Shortcut_Desktop.vbs`**| Tự động tạo biểu tượng lối tắt FinTrack AI ngoài màn hình Desktop. |
| **`seed_admin_finance.py`** | Chuẩn hóa toàn bộ 5 ví tài sản, 30+ giao dịch mẫu 3 tháng, ngân sách và mục tiêu cho tài khoản `admin@fintrack.ai`.<br>`python seed_admin_finance.py` |
| **`reset_user_data.py`** | Đưa toàn bộ số dư và dữ liệu tài khoản `user@fintrack.ai` về trạng thái ban đầu (0 VNĐ).<br>`python reset_user_data.py` |
| **`clean_db.py`** | Dọn sạch dữ liệu giao dịch rác, đưa số dư toàn bộ hệ thống về 0đ khởi tạo.<br>`python clean_db.py` |
| **`build_presentation.py`** | Script tự động tạo bài thuyết trình PowerPoint (`BaoCao_FinTrackAI_Demo.pptx`) báo cáo trước hội đồng. |

---

## 5. Tài Liệu Thiết Kế & Hồ Sơ Đồ Án

- **[`architecture.md`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/architecture.md)**: Đặc tả kiến trúc hệ thống chuyên sâu, sơ đồ 11 bảng CSDL 3NF, luồng SePay Webhook qua Cloudflare Tunnel và pipeline bảo mật Zero-PII.
- **[`user_stories.md`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/user_stories.md)**: Bản đặc tả chi tiết 19 Use Cases (UC-USR-01 đến UC-ADM-19) và 16 Test Cases (TC-01 đến TC-16).
- **[`erd.mmd`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/erd.mmd)**: Mã nguồn Mermaid ERD thể hiện 11 bảng thực thể CSDL 3NF và quan hệ ràng buộc.
- **[`nhom3_extracted.txt`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/nhom3_extracted.txt)**: Văn bản báo cáo kỹ thuật học phần AI của Nhóm 03.
- **[`CLAUDE.md`](file:///D:/Visua%20Studio%20Code/HeThongChiTieuCaNhan1.0/CLAUDE.md)**: Nguyên tắc lập trình và tài liệu chỉ dẫn Coding Agent.
