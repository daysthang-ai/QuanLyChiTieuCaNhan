# TÀI LIỆU THIẾT KẾ KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE DOCUMENT)
## FINTRACK AI - HỆ THỐNG QUẢN LÝ CHI TIÊU CÁ NHÂN TÍCH HỢP AI

> **Dự án**: FinTrack AI  
> **Nhóm thực hiện**: Nhóm 03 (Đặng Quyết Thắng, Nguyễn Văn Tiến, Quách Minh Hiếu)  
> **Giảng viên hướng dẫn**: ThS. Hà Thị Thanh  
> **Đơn vị**: Khoa CNTT - Trường Đại học CNTT & Truyền thông (ICTU) - 2026

---

## 1. Tổng quan Kiến trúc Hệ thống (System Architecture Overview)

Hệ thống **FinTrack AI** được thiết kế theo mô hình kiến trúc phân tầng độc lập (**Layered & Modular Decoupled Architecture**), phân tách rõ ràng giữa tầng giao diện người dùng, tầng xử lý API & dịch vụ nghiệp vụ, phân hệ Trí tuệ Nhân tạo đám mây và tầng lưu trữ dữ liệu quan hệ chuẩn hóa **3NF**.

```mermaid
flowchart TB
    subgraph Client_Layer ["1. TẦNG GIAO DIỆN NGƯỜI DÙNG (PRESENTATION LAYER)"]
        UI_Web["Single Page Application (SPA)<br/>• Vanilla JS (ES6+) Modular Architecture<br/>• Glassmorphic Modern Dark Cyber Theme<br/>• Responsive UI (Desktop & Mobile)"]
        Chart_Engine["Thư viện Trực quan hóa<br/>• Chart.js (Donut & Bar Charts)<br/>• FontAwesome 6 Icons & CSS3 Glow"]
    end

    subgraph API_Gateway ["2. TẦNG ĐIỀU KHIỂN & API GATEWAY (FASTAPI)"]
        FastAPI_Core["FastAPI Framework (Python 3.10+)<br/>• Asynchronous Request Pipeline<br/>• CORS & Rate Limiting Middleware<br/>• Pydantic V2 Request/Response Validation"]
        Auth_Guard["Xác thực & Phân quyền (RBAC)<br/>• JWT Bearer Token Validation<br/>• Role Guard: USER / ADMIN<br/>• Password Hashing: Bcrypt"]
        Routers["13 RESTful API Routers<br/>• /auth, /wallets, /categories, /transactions<br/>• /budgets, /savings, /analytics, /ai<br/>• /badges, /admin, /backup, /exports"]
    end

    subgraph Domain_Services ["3. TẦNG DỊCH VỤ NGHIỆP VỤ (DOMAIN SERVICES)"]
        Budget_Engine["Động cơ Ngân sách 50/30/20<br/>• Hạn mức chi tiêu tháng<br/>• Cảnh báo đa cấp: Xanh, Vàng, Đỏ"]
        Wallet_Engine["Động cơ Quản lý Đa Ví<br/>• Cân đối tài sản ròng<br/>• Chuyển tiền Double-Entry nguyên tử"]
        Gamification_Engine["Động cơ Gamification<br/>• Tính chuỗi Streak liên tục<br/>• Cấp độ Level & Điểm XP<br/>• Mở khóa 24 Huy hiệu Thành tích"]
        Report_Engine["Động cơ Báo cáo & Trích xuất<br/>• OpenPyXL (Excel .xlsx)<br/>• ReportLab (PDF) / CSV"]
    end

    subgraph AI_Subsystem ["4. PHÂN HỆ AI & BẢO MẬT ZERO-PII (AI PIPELINE)"]
        PII_Sanitizer["Zero-PII Sanitizer & Data Masking<br/>• Loại bỏ Tên, Email, Số điện thoại, STK thô<br/>• Ẩn danh hóa số liệu tài chính"]
        Prompt_Engine["Dynamic Prompt Manager<br/>• System Prompt Natural Language Parser<br/>• System Prompt Financial Health Advisor"]
        LLM_Cloud["Mô hình AI Đám mây (LLM)<br/>• Google Gemini 1.5 Pro API<br/>• JSON Structured Output / Chat Streaming"]
    end

    subgraph Data_Layer ["5. TẦNG DỮ LIỆU & LƯU TRỮ (DATA LAYER - 3NF)"]
        ORM["SQLAlchemy ORM Engine<br/>• SessionLocal & Dependency Injection<br/>• Atomic Transactions & Rollback"]
        RDBMS[("CSDL Quan hệ Chuẩn 3NF<br/>• SQLite / PostgreSQL<br/>• 7 Thực thể & Ràng buộc Khóa ngoại")]
        File_Store["Lưu trữ Tệp Cục bộ<br/>• Thư mục /uploads (Hóa đơn, Bill)"]
    end

    Client_Layer <==>|HTTP / RESTful API (JSON)| API_Gateway
    API_Gateway --> Domain_Services
    Domain_Services --> Data_Layer
    Domain_Services <--> AI_Subsystem
```

---

## 2. Phân Tầng Chi Tiết Hệ Thống

### 2.1. Tầng Giao diện (Presentation Layer)
- **Kiến trúc SPA (Single Page Application)**: Giao diện web tải một lần duy nhất, điều hướng giữa các tab thông qua cơ chế chuyển đổi Component (`switchTab`) không gây giật lag hoặc tải lại trang.
- **Phong cách Glassmorphic Cyber Dark**: Sử dụng hiệu ứng nền mờ gương (`backdrop-filter: blur()`), viền neon phát sáng, hỗ trợ tối ưu hiển thị số liệu tài chính trong môi trường thiếu sáng.
- **Tối ưu hóa Chart.js**: Áp dụng quy tắc hủy thể hiện biểu đồ (`chartInstance.destroy()`) trước khi vẽ lại trên canvas để triệt tiêu hiện tượng nhấp nháy (jitter) và rò rỉ bộ nhớ (memory leaks).

### 2.2. Tầng Điều khiển & Cổng API (API Layer - FastAPI)
- **Phiên bản & Tiền tố**: Chuẩn hóa toàn bộ RESTful API dưới tiền tố `/api/v1/`.
- **Kiểm thực dữ liệu (Validation)**: Sử dụng **Pydantic V2** định nghĩa các lược đồ `In`, `Out`, `Update`, đảm bảo dữ liệu đầu vào luôn đúng kiểu, đúng ràng buộc nghiệp vụ.
- **Xác thực và Phân quyền (RBAC)**:
  - Sử dụng chuẩn `OAuth2PasswordBearer` kết hợp `JWT Token`.
  - Phân quyền 2 cấp độ: **USER** (Quản lý tài chính cá nhân) và **ADMIN** (Toàn quyền quản trị hệ thống, token, người dùng và prompt).

### 2.3. Tầng Dịch vụ Nghiệp vụ (Business Domain Layer)
- **Quy tắc Phân bổ Ngân sách 50/30/20**:
  - **50% Nhu cầu thiết yếu (Needs)**: Tiền thuê nhà, điện nước, ăn uống, y tế, xăng xe.
  - **30% Mong muốn & Hưởng thụ (Wants)**: Mua sắm, cà phê, du lịch, giải trí.
  - **20% Tiết kiệm & Tích lũy (Savings)**: Quỹ khẩn cấp, sổ tiết kiệm, đầu tư.
- **Động cơ Cảnh báo Hạn mức Đa tầng (3-Tier Alerting)**:
  - *Mức 1 (An toàn - Xanh)*: Chi tiêu $< 80\%$ hạn mức.
  - *Mức 2 (Cảnh báo - Vàng)*: Chi tiêu từ $80\%$ đến $99\%$ hạn mức.
  - *Mức 3 (Bội chi - Đỏ)*: Chi tiêu $\ge 100\%$ hạn mức, hiển thị rõ số tiền thâm hụt.
- **Động cơ Chuyển tiền Double-Entry**: Đảm bảo trừ tiền ví nguồn và cộng tiền ví đích diễn ra đồng thời trong một giao dịch nguyên tử, tổng tài sản ròng toàn hệ thống luôn bảo toàn.
- **Hệ thống Gamification 24 Huy hiệu**: Quản lý chuỗi ngày kỷ luật (Streak), điểm kinh nghiệm (XP), cấp độ (Level) và 24 huy hiệu mở khóa theo 4 cấp hạng.

---

## 3. Kiến trúc Phân hệ AI & Đường Ống Bảo Mật Zero-PII

Nhằm giải quyết triệt để rủi ro rò rỉ thông tin cá nhân và số tài khoản ngân hàng khi tương tác với các mô hình ngôn ngữ lớn (LLM), FinTrack AI thiết lập đường ống xử lý bảo mật nghiêm ngặt **Zero-PII Leakage Pipeline**:

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant App as Frontend SPA
    participant Sanitizer as Module Zero-PII Sanitizer
    participant Context as Bộ Tổng Hợp Số Liệu Ẩn Danh
    participant LLM as Google Gemini 1.5 Pro
    participant Audit as Nhật Ký Kiểm Toán (AILog)

    User->>App: Gửi câu lệnh: "Tôi là Thắng STK 19038888, hãy tư vấn tiết kiệm 50/30/20"
    App->>Sanitizer: Gửi chuỗi thô (Raw Prompt)
    Note over Sanitizer: Thực thi Regex Masking:<br/>1. Xóa Tên riêng ("Tôi là Thắng" -> "Tôi")<br/>2. Ẩn STK ("19038888" -> "[REDACTED_ACCOUNT]")<br/>3. Xóa Email/Số điện thoại
    Sanitizer->>Context: Trích xuất chuỗi câu hỏi sạch
    Context->>Context: Tổng hợp chỉ số tài chính ẩn danh:<br/>- Tổng thu nhập: 20.000.000 đ<br/>- Tổng chi: 14.000.000 đ (Needs: 55%, Wants: 35%, Savings: 10%)
    Context->>LLM: Gửi Anonymous Payload + System Prompt Cố vấn 50/30/20
    LLM-->>App: Trả về phân tích & giải pháp tái cơ cấu chi tiêu
    App->>Audit: Ghi Log số Token, Latency (Cam kết KHÔNG lưu PII thô)
    App-->>User: Hiển thị phản hồi tư vấn tài chính chi tiết
```

### Nguyên tắc Vàng của Zero-PII Sanitizer:
1. **Không bao giờ gửi PII thô**: Các trường `full_name`, `email`, `user_id`, số tài khoản ngân hàng thực tế, số điện thoại đều được khử định danh ở cấp độ Backend trước khi đóng gói payload API.
2. **Ẩn danh hóa số liệu (Anonymous Metrics)**: Mô hình AI chỉ nhận được các số liệu tài chính trừu tượng dạng số tổng hợp và tỷ lệ phần trăm phân bổ.
3. **Kiểm toán an ninh AI**: Mọi lượt gọi LLM được ghi nhận trong bảng `ai_logs` để theo dõi Token tiêu thụ và độ trễ phản hồi (`latency_ms`) mà không lưu trữ dữ liệu nhạy cảm của người dùng.

---

## 4. Thiết kế Cơ sở Dữ liệu Quan hệ Chuẩn 3NF (Database ERD)

Hệ thống sử dụng cơ sở dữ liệu quan hệ gồm 7 bảng thực thể chuẩn hóa theo dạng chuẩn 3 (**Third Normal Form - 3NF**), loại bỏ trùng lặp và đảm bảo tính toàn vẹn tham chiếu.

```mermaid
erDiagram
    users ||--o{ wallets : "sở hữu"
    users ||--o{ categories : "tạo danh mục riêng"
    users ||--o{ transactions : "thực hiện"
    users ||--o{ budgets : "thiết lập hạn mức"
    users ||--o{ saving_goals : "đặt mục tiêu"
    users ||--o{ ai_logs : "lịch sử gọi AI"

    wallets ||--o{ transactions : "ghi nhận biến động"
    categories ||--o{ transactions : "phân loại giao dịch"
    categories ||--o{ budgets : "áp dụng ngân sách"

    users {
        int id PK
        string email UK "Indexed, Tên đăng nhập"
        string password_hash "Mã hóa Bcrypt"
        string full_name "Họ và tên hiển thị"
        string role "USER hoặc ADMIN"
        string currency "VND hoặc USD"
        int target_income "Thu nhập mục tiêu"
        string subscription_tier "FREE, PRO, VIP"
        boolean is_active "Trạng thái kích hoạt"
        datetime created_at "Thời điểm tạo"
    }

    wallets {
        int id PK
        int user_id FK "Liên kết users.id"
        string name "Tên ví (Techcombank, MoMo, Tiền mặt)"
        string type "CASH, BANK, EWALLET, SAVINGS"
        int balance "Số dư khả dụng (Đơn vị VNĐ)"
        string account_number "Số tài khoản che bảo mật"
        string color "Mã màu nhận diện"
        string icon "Icon biểu diện"
        boolean is_active "Trạng thái sử dụng"
    }

    categories {
        int id PK
        int user_id FK "Liên kết users.id (NULL nếu DM chung)"
        string name "Tên danh mục (Ăn uống, Mua sắm...)"
        string type "EXPENSE hoặc INCOME"
        string group_50_30_20 "NEEDS, WANTS, SAVINGS"
        string icon "Biểu tượng nhận diện"
        string color "Mã màu đại diện"
        boolean is_default "Đánh dấu danh mục hệ thống"
    }

    transactions {
        int id PK
        int user_id FK "Liên kết users.id"
        int wallet_id FK "Liên kết wallets.id"
        int category_id FK "Liên kết categories.id"
        int amount "Số tiền giao dịch (VNĐ)"
        string type "EXPENSE, INCOME, TRANSFER"
        date transaction_date "Ngày phát sinh"
        string description "Ghi chú chi tiết"
        string tags "Nhãn phân loại (vd: #giadinh)"
        string receipt_image "Đường dẫn ảnh hóa đơn"
        boolean is_ai_generated "Tạo tự động từ AI Parser"
    }

    budgets {
        int id PK
        int user_id FK "Liên kết users.id"
        int category_id FK "Liên kết categories.id"
        int month "Tháng áp dụng (1-12)"
        int year "Năm áp dụng (vd: 2026)"
        int limit_amount "Hạn mức tối đa (VNĐ)"
        float alert_thresh "Ngưỡng cảnh báo (mặc định 0.80)"
    }

    saving_goals {
        int id PK
        int user_id FK "Liên kết users.id"
        string goal_name "Tên mục tiêu (Du lịch, Mua xe...)"
        int target_amount "Số tiền mục tiêu (VNĐ)"
        int current_amount "Số tiền đã tích lũy (VNĐ)"
        date deadline "Hạn định hoàn thành"
        string color "Mã màu đại diện"
        string icon "Biểu tượng mục tiêu"
        boolean is_completed "Trạng thái hoàn thành"
    }

    ai_logs {
        int id PK
        int user_id FK "Liên kết users.id"
        string log_type "AI_PARSE, AI_ADVISOR, HEALTH_CHECK"
        int prompt_tokens "Số token prompt"
        int completion_tokens "Số token phản hồi"
        int latency_ms "Thời gian xử lý (mili-giây)"
        datetime created_at "Thời điểm gọi"
    }
```

---

## 5. Kiến trúc Phân hệ Quản trị (Admin Cyber Control Center)

Phân hệ Quản trị đóng vai trò trung tâm điều phối và giám sát toàn bộ hoạt động của hệ thống FinTrack AI:

```mermaid
flowchart LR
    Admin([Quản Trị Viên / Admin])

    subgraph Control_Center ["CYBER CONTROL CENTER (ADMIN WORKSTATION)"]
        Dashboard_Admin["1. Bảng Tổng Quan Chỉ Số<br/>• Tổng người dùng & Tương tác DAU/MAU<br/>• Doanh thu & Cơ cấu gói (Free/Pro/VIP)<br/>• Trạng thái Server & Database Health"]
        User_Mgmt["2. Quản Trị Người Dùng<br/>• Tra cứu hồ sơ tài chính chi tiết<br/>• Nâng/Hạ gói cước dịch vụ<br/>• Khóa / Mở khóa tài khoản"]
        AI_Config["3. Quản Trị AI & Token<br/>• Tinh chỉnh System Prompt Parser & Advisor<br/>• Quản lý hạn mức Token/ngày theo gói cước<br/>• Thống kê chi phí API thực tế"]
        Global_Cat["4. Danh Mục Mẫu Toàn Sàn<br/>• Cấu hình bộ danh mục chuẩn 50/30/20<br/>• Tự động nhân bản cho tài khoản mới"]
        Audit_Logs["5. Nhật Ký & Giám Sát An Ninh<br/>• Bảng Audit Log thời gian thực<br/>• Lọc theo sự kiện: SECURITY, AI_API, ERROR"]
        Sys_Settings["6. Cài Đặt & Dịch Vụ Nền<br/>• Phát thông báo Broadcast toàn hệ thống<br/>• Cấu hình SMTP Mail Server<br/>• Tạo snapshot sao lưu & phục hồi CSDL"]
    end

    Admin --> Dashboard_Admin
    Admin --> User_Mgmt
    Admin --> AI_Config
    Admin --> Global_Cat
    Admin --> Audit_Logs
    Admin --> Sys_Settings
```

---

## 6. Sơ đồ Tuần tự Các Ca Nghiệp Vụ Cốt Lõi

### 6.1. Luồng Xác thực & Khởi tạo Danh mục Mặc định
```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng mới
    participant UI as Giao diện Đăng ký
    participant Auth as Auth Router (/api/v1/auth)
    participant Seed as Seed Service
    participant DB as Cơ sở dữ liệu

    User->>UI: Nhập Email, Password, Họ tên
    UI->>Auth: POST /api/v1/auth/register
    Auth->>Auth: Hash Password với Bcrypt
    Auth->>DB: Tạo bản ghi User mới
    Auth->>Seed: seed_user_default_categories(user_id)
    Seed->>DB: Sao chép bộ danh mục chuẩn 50/30/20 vào tài khoản user
    Seed->>DB: Khởi tạo các ví mặc định (Tiền mặt, Ngân hàng)
    Auth-->>UI: Cấp JWT Token & Profile ban đầu
    UI-->>User: Chuyển hướng vào Dashboard cá nhân
```

### 6.2. Luồng Cảnh báo Ngân sách Bội chi khi Ghi nhận Chi tiêu
```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant UI as Giao diện Giao dịch
    participant TxRouter as Transaction Router
    participant BudgetService as Budget Evaluation Engine
    participant DB as Cơ sở dữ liệu

    User->>UI: Thêm khoản chi Mua sắm 2.200.000 đ
    UI->>TxRouter: POST /api/v1/transactions
    TxRouter->>DB: Ghi nhận giao dịch & Trừ số dư ví
    TxRouter->>BudgetService: Kiểm tra hạn mức danh mục Mua sắm trong tháng
    BudgetService->>DB: Lấy Hạn mức (2.000.000 đ) & Tổng chi hiện tại (2.200.000 đ)
    BudgetService-->>TxRouter: Trả về trạng thái BỘI CHI (Tỷ lệ 110%, Vượt 200.000 đ)
    TxRouter-->>UI: Trả về kết quả giao dịch kèm Cảnh báo Đỏ (Overbudget Alert)
    UI-->>User: Hiển thị Toast cảnh báo & Đổi màu thanh tiến độ sang ĐỎ
```

---

## 7. Kiến trúc Bảo mật và An toàn Dữ liệu

| Lớp Bảo mật | Cơ chế Thực thi | Mục đích / Cam kết |
|---|---|---|
| **Xác thực** | JWT (JSON Web Tokens) với thuật toán HMAC-SHA256, thời hạn 24 giờ | Ngăn chặn giả mạo phiên làm việc |
| **Mã hóa Mật khẩu** | Thuật toán `Bcrypt` với Salt tự sinh ngẫu nhiên | Chống tấn công Rainbow table và rò rỉ dữ liệu |
| **Phân quyền (RBAC)** | Dependency Injection `get_current_admin_user` kiểm soát `role == 'ADMIN'` | Bảo vệ tuyệt đối các chức năng quản trị toàn sàn |
| **Chống SQL Injection** | Sử dụng SQLAlchemy ORM Parameterized Queries | Loại trừ 100% rủi ro chèn mã độc vào truy vấn SQL |
| **Chống XSS & CORS** | Sanitize dữ liệu đầu vào HTML và cấu hình CORS Middleware chặt chẽ | Ngăn chặn tấn công Cross-Site Scripting |
| **Bảo mật Riêng tư AI** | Zero-PII Leakage Sanitizer khử sạch tên, email, STK trước khi gọi API LLM | Bảo đảm quyền riêng tư tài chính tuyệt đối cho người dùng |
| **Sao lưu Dữ liệu** | Cơ chế Database Snapshot định dạng JSON có mã hóa kiểm toán | Đảm bảo khả năng phục hồi dữ liệu khi có sự cố thảm họa |
