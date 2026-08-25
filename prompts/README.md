# FinTrack AI - Hệ Thống Prompt Templates & An Toàn Dữ Liệu

Thư mục `prompts/` chứa toàn bộ các mẫu Prompt kỹ thuật số phục vụ cho các tính năng AI của hệ thống **FinTrack AI**. Việc tách biệt Prompt khỏi mã nguồn giúp dễ dàng tinh chỉnh, tối ưu hoá ngữ cảnh (context window) và chuyển đổi linh hoạt giữa các mô hình LLM (Gemini, GPT-4o, Claude, Llama 3).

---

## 1. Danh Sách Prompt Templates

| File | Tên Tính Năng | Mục Đích | Đầu Ra Yêu Cầu |
|---|---|---|---|
| `transaction_parser.prompt.md` | Bóc tách Giao dịch Tự nhiên | Trích xuất số tiền, loại giao dịch, danh mục, ví, ghi chú từ câu nói | JSON chuẩn (Strict JSON Schema) |
| `financial_health.prompt.md` | Phân tích Sức khỏe Tài chính | Đánh giá tỷ lệ 50/30/20, cảnh báo bội chi và đề xuất tối ưu chi phí | Báo cáo Markdown + Điểm số 0-100 |
| `financial_qa.prompt.md` | Hỏi đáp Dữ liệu Tài chính | Trả lời các câu hỏi tự nhiên về chi tiêu dựa trên dữ liệu an toàn | Văn bản Markdown ngắn gọn, chính xác |
| `smart_budget_advisor.prompt.md` | Cố vấn Hạn mức Ngân sách | Đề xuất ngân sách từng danh mục cho tháng tới dựa trên xu hướng | Bảng gợi ý ngân sách JSON/Markdown |

---

## 2. Quy Định Bảo Mật & An Toàn Dữ Liệu (PII Protection)

Trước khi truyền bất kỳ dữ liệu nào vào context của mô hình AI:
1. **Không gửi thông tin định danh cá nhân nhạy cảm**: Không gửi Số tài khoản ngân hàng thực tế, Số định danh CCCD/CMND, Mật khẩu, Số điện thoại, Email đầy đủ.
2. **Ẩn danh hóa dữ liệu (Sanitization)**:
   - Các số tài khoản ngân hàng (nếu có trong ghi chú) được tự động che thành `****1234`.
   - Tên ví chỉ sử dụng tên gợi nhớ người dùng đặt (ví dụ: *Techcombank*, *MoMo*, *Tiền mặt*).
   - Dữ liệu thu chi được gửi dưới dạng bảng tổng hợp số liệu (Aggregated data) thay vì toàn bộ log chi tiết nếu không cần thiết.
3. **Cơ chế Fallback Thông Minh (Smart Rule-based Engine)**:
   - Khi không có kết nối Internet hoặc chưa cấu hình API Key, hệ thống tự động kích hoạt bộ phân tích ngôn ngữ tự nhiên tiếng Việt nội bộ (Rule-based Regex & Dictionary NLP Engine) để ứng dụng vẫn hoạt động 100% không bị gián đoạn.
