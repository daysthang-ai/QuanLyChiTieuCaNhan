# 06. HƯỚNG DẪN CÀI ĐẶT, VẬN HÀNH & TÀI LIỆU API (USER & API GUIDE)

## 1. Yêu Cầu Môi Trường & Cài Đặt

- **Python**: Phiên bản 3.10 trở lên (khuyên dùng Python 3.12).
- **Trình duyệt**: Chrome, Edge, Firefox hoặc Safari bất kỳ.

### Các bước khởi chạy nhanh:
```bash
# 1. Kích hoạt môi trường ảo (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# 2. Chạy toàn bộ ứng dụng bằng 1 lệnh duy nhất
py run.py
```
Ứng dụng sẽ tự động:
1. Khởi tạo Cơ sở dữ liệu SQLite `fintrack.db`.
2. Nạp dữ liệu mẫu phong phú (Tài khoản mẫu, Ví mẫu, Danh mục chuẩn 50/30/20, Lịch sử giao dịch 3 tháng, Ngân sách, Mục tiêu tiết kiệm).
3. Khởi chạy máy chủ FastAPI tại `http://127.0.0.1:8000`.
4. Mở trình duyệt web hiển thị trang chủ FinTrack AI.

---

## 2. Tài Khoản Đăng Nhập Mẫu

| Tài Khoản | Email | Mật Khẩu | Quyền Hạn |
|---|---|---|---|
| **Người Dùng Mẫu (Demo User)** | `user@fintrack.ai` | `User@123456` | Toàn quyền sử dụng chức năng cá nhân |
| **Quản Trị Viên (System Admin)**| `admin@fintrack.ai`| `Admin@123456`| Quyền quản trị hệ thống |

---

## 3. Danh Sách Endpoint API Chính (FastAPI OpenAPI)

Swagger UI tương tác trực tiếp có sẵn tại: `http://127.0.0.1:8000/docs`

### 3.1. Xác thực & Tài khoản (`/api/v1/auth`)
- `POST /api/v1/auth/register`: Đăng ký tài khoản mới.
- `POST /api/v1/auth/login`: Đăng nhập lấy JWT Bearer Token.
- `GET /api/v1/auth/me`: Lấy thông tin người dùng hiện tại.
- `PUT /api/v1/auth/profile`: Cập nhật thông tin hồ sơ.
- `POST /api/v1/auth/change-password`: Đổi mật khẩu.

### 3.2. Quản lý Ví (`/api/v1/wallets`)
- `GET /api/v1/wallets/`: Danh sách ví của người dùng.
- `POST /api/v1/wallets/`: Tạo ví mới.
- `PUT /api/v1/wallets/{id}`: Cập nhật thông tin ví.
- `DELETE /api/v1/wallets/{id}`: Xóa ví.
- `POST /api/v1/wallets/transfer`: Chuyển tiền giữa 2 ví.

### 3.3. Quản lý Danh mục (`/api/v1/categories`)
- `GET /api/v1/categories/`: Lấy danh sách danh mục thu/chi.
- `POST /api/v1/categories/`: Tạo danh mục tùy chỉnh.
- `PUT /api/v1/categories/{id}`: Cập nhật danh mục.
- `DELETE /api/v1/categories/{id}`: Xóa danh mục.

### 3.4. Quản lý Giao dịch (`/api/v1/transactions`)
- `GET /api/v1/transactions/`: Lấy danh sách giao dịch có bộ lọc (from_date, to_date, category_id, wallet_id, min_amount, max_amount, search).
- `POST /api/v1/transactions/`: Thêm giao dịch (tự động cập nhật số dư ví & kiểm tra hạn mức ngân sách).
- `PUT /api/v1/transactions/{id}`: Cập nhật giao dịch.
- `DELETE /api/v1/transactions/{id}`: Xóa giao dịch.
- `POST /api/v1/transactions/upload-receipt`: Upload ảnh hóa đơn đính kèm.

### 3.5. Hạn mức Ngân sách (`/api/v1/budgets`)
- `GET /api/v1/budgets/`: Danh sách ngân sách kèm % đã chi và trạng thái cảnh báo.
- `POST /api/v1/budgets/`: Thiết lập hạn mức ngân sách mới.
- `PUT /api/v1/budgets/{id}`: Cập nhật hạn mức.
- `DELETE /api/v1/budgets/{id}`: Xóa hạn mức.
- `GET /api/v1/budgets/alerts`: Lấy danh sách danh mục đang vượt 80% hoặc 100%.

### 3.6. Mục tiêu Tiết kiệm (`/api/v1/saving-goals`)
- `GET /api/v1/saving-goals/`: Danh sách mục tiêu tiết kiệm kèm tiến độ %.
- `POST /api/v1/saving-goals/`: Tạo mục tiêu mới.
- `POST /api/v1/saving-goals/{id}/deposit`: Nạp tiền vào mục tiêu tiết kiệm.
- `PUT /api/v1/saving-goals/{id}`: Sửa mục tiêu.
- `DELETE /api/v1/saving-goals/{id}`: Xóa mục tiêu.

### 3.7. Thống kê & Xuất Báo cáo (`/api/v1/analytics`, `/api/v1/exports`)
- `GET /api/v1/analytics/summary`: KPI cards tổng quan (Tổng tài sản, Thu, Chi, Tiết kiệm).
- `GET /api/v1/analytics/cashflow`: Dữ liệu biểu đồ dòng tiền 6 tháng.
- `GET /api/v1/analytics/category-breakdown`: Dữ liệu biểu đồ tròn cơ cấu chi tiêu.
- `GET /api/v1/analytics/fifty-thirty-twenty`: Phân tích tỷ lệ thực tế theo quy tắc 50/30/20.
- `GET /api/v1/exports/excel`: Tải file báo cáo Excel `.xlsx`.
- `GET /api/v1/exports/csv`: Tải file CSV.
- `GET /api/v1/exports/pdf`: Tải file báo cáo PDF.

### 3.8. AI FinTrack Engine (`/api/v1/ai`)
- `POST /api/v1/ai/parse-transaction`: Bóc tách câu tự nhiên thành JSON giao dịch.
- `GET /api/v1/ai/financial-health`: Đánh giá sức khỏe tài chính và đề xuất tiết kiệm.
- `POST /api/v1/ai/chat`: Hỏi đáp dữ liệu tài chính cá nhân với Trợ lý AI.
- `GET /api/v1/ai/budget-advice`: Gợi ý thiết lập hạn mức ngân sách tháng tới.
