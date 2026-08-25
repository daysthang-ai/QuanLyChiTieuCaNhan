# 04. ĐỀ XUẤT WIREFRAME & THIẾT KẾ GIAO DIỆN (UI/UX SPECIFICATION)

## 1. Phong Cách Thiết Kế Tổng Thể (Design System)
- **Chủ đề (Theme)**: Hiện đại, phong cách Fintech chuyên nghiệp, tinh gọn (Clean & Elegant Glassmorphism).
- **Màu sắc chủ đạo**:
  - `Primary Emerald/Teal`: `#10B981` (Tài chính, sinh sôi, tăng trưởng).
  - `Accent Indigo/Violet`: `#6366F1` (Trí tuệ nhân tạo, công nghệ cao).
  - `Warning Amber`: `#F59E0B` (Cảnh báo 80% hạn mức).
  - `Danger Rose/Red`: `#EF4444` (Bội chi >100%, chi phí).
  - `Background Neutral`: Slate `#F8FAFC` (Light) / `#0F172A` (Dark).
- **Phông chữ**: Inter / Be Vietnam Pro (tối ưu hóa hiển thị tiếng Việt và số liệu tài chính).

---

## 2. Wireframe 1: Dashboard Tài Chính Tổng Quan

```
+-------------------------------------------------------------------------------------------------------------+
|  [Logo] FinTrack AI           [🔍 Tìm kiếm...]      [⚡ Nhập Nhanh AI]    [🔔 Cảnh Báo (2)]    [👤 User ▼]   |
+-------------------+-----------------------------------------------------------------------------------------+
|  [📊 Tổng Quan]   |  BỘ CHỈ SỐ KPI TÀI CHÍNH THÁNG NÀY (Tháng 08/2026)                                      |
|  [💳 Ví & TK]     |  +-------------------+ +-------------------+ +-------------------+ +------------------+ |
|  [💸 Thu - Chi]   |  | 💰 TỔNG TÀI SẢN   | | 📥 TỔNG THU NHẬP  | | 📤 TỔNG CHI TIÊU  | | 🎯 TỶ LỆ TIẾT KIỆM | |
|  [🎯 Ngân Sách]   |  | 85,450,000 đ      | | 32,000,000 đ      | | 18,250,000 đ      | | 42.9% (Tốt)        | |
|  [🏆 Tiết Kiệm]   |  +-------------------+ +-------------------+ +-------------------+ +------------------+ |
|  [📈 Báo Cáo]     |                                                                                         |
|  [🤖 AI Cố Vấn]   |  +--------------------------------------------+  +------------------------------------+ |
|  [⚙ Cài Đặt]      |  | 📈 BIỂU ĐỒ DÒNG TIỀN 6 THÁNG GẦN NHẤT     |  | 🍩 CƠ CẤU CHI TIÊU THEO DANH MỤC   | |
|                   |  |    [Thu Nhập vs Chi Tiêu vs Tiết Kiệm]     |  |    - Ăn uống (42%)                 | |
|                   |  |    (Biểu đồ Bar/Line Chart)                |  |    - Tiền nhà (25%)                | |
|                   |  |                                            |  |    - Mua sắm (18%)                 | |
|                   |  |                                            |  |    - Khác (15%)                    | |
|                   |  +--------------------------------------------+  +------------------------------------+ |
|                   |                                                                                         |
|                   |  +--------------------------------------------+  +------------------------------------+ |
|                   |  | 🚨 CẢNH BÁO HẠN MỨC NGÂN SÁCH             |  | 🕒 GIAO DỊCH GẦN ĐÂY               | |
|                   |  |  • Ăn uống: [████████████████░] 88% (Gần chạm)|  |  • Mua gói Gym: -1.2tr (Techcombank)| |
|                   |  |  • Mua sắm: [████████████████████] 105% (Vượt)|  |  • Lương cty: +28tr (Techcombank)  | |
|                   |  |  • Xăng xe: [████████░░░░░░░░] 45% (An toàn) |  |  • Ăn trưa bún bò: -45k (MoMo)    | |
|                   |  +--------------------------------------------+  +------------------------------------+ |
+-------------------+-----------------------------------------------------------------------------------------+
```

---

## 3. Wireframe 2: Màn Hình / Modal Nhập Nhanh Giao Dịch Bằng AI

```
+---------------------------------------------------------------------------------------+
|  ⚡ NHẬP NHANH GIAO DỊCH BẰNG TRÍ TUỆ NHÂN TẠO (AI PARSER)                         [X] |
+---------------------------------------------------------------------------------------+
|  Nhập tự nhiên câu thu chi của bạn (AI tự động bóc tách Số tiền, Danh mục, Ví):       |
|                                                                                       |
|  [ Ăn trưa bún bò 45k trả qua MoMo hôm qua                                        ]   |
|                                                                                       |
|  Gợi ý nhanh:                                                                         |
|  [+ Đổ xăng 80k tiền mặt]  [+ Lương 25tr vào Techcombank]  [+ Mua cà phê 40k MoMo]    |
|                                                                                       |
|                                     [ 🪄 BÓC TÁCH BẰNG AI ]                           |
|  -----------------------------------------------------------------------------------  |
|  ✨ KẾT QUẢ BÓC TÁCH (Xác nhận hoặc chỉnh sửa):                                       |
|                                                                                       |
|  Loại giao dịch:   (•) Chi tiêu (Expense)   ( ) Thu nhập (Income)                     |
|  Số tiền:          [ 45,000                 ] VND                                     |
|  Danh mục:         [ 🍲 Ăn uống & Thực phẩm ▼]                                       |
|  Ví thanh toán:    [ 🟣 Ví MoMo             ▼]                                       |
|  Thời gian:        [ 2026-08-19 (Hôm qua)   ] 📅                                      |
|  Ghi chú:          [ Ăn trưa bún bò         ]                                         |
|  Độ tin cậy AI:    [🟩 98% Tin cậy (Cao)    ]                                         |
|                                                                                       |
|                         [ Hủy bỏ ]     [  LƯU GIAO DỊCH VÀO HỆ THỐNG ]               |
+---------------------------------------------------------------------------------------+
```

---

## 4. Wireframe 3: Khung Chat Trợ Lý AI Cố Vấn Tài Chính (Financial Q&A Drawer)

```
+---------------------------------------------------------------------------------------+
|  🤖 TRỢ LÝ TÀI CHÍNH CÁ NHÂN FINTRACK AI                                           [X] |
+---------------------------------------------------------------------------------------+
|  FinTrack AI: Xin chào Alex! Tôi đã phân tích toàn bộ 38 giao dịch của bạn trong      |
|  tháng 08/2026. Bạn muốn kiểm tra dòng tiền hay cần lời khuyên tiết kiệm nào?         |
|                                                                                       |
|  👤 Bạn: "Tháng này tôi đã tiêu bao nhiêu tiền cho việc ăn ngoài?"                     |
|                                                                                       |
|  FinTrack AI:                                                                         |
|  📊 **Tổng hợp chi tiêu Ăn uống & Ăn ngoài Tháng 08/2026:**                           |
|  - Tổng số tiền đã chi: **5,650,000 đ** (chiếm 31% tổng chi tiêu tháng).             |
|  - So với hạn mức đặt ra (5,000,000 đ): Bạn đang **vượt hạn mức 13% (650k)**.         |
|  - Khoản chi lớn nhất: Ăn buffet lẩu cuối tuần (1,250,000 đ vào ngày 12/08).          |
|                                                                                       |
|  💡 **Gợi ý từ AI**: Từ giờ đến cuối tháng còn 11 ngày, bạn nên hạn chế ăn tối bên    |
|  ngoài và tự nấu ăn tại nhà để cân đối ngân sách về mức an toàn.                      |
|                                                                                       |
|  [ Gợi ý câu hỏi tiếp theo ]:                                                         |
|  [🩺 Đánh giá sức khỏe 50/30/20]  [💡 3 mẹo tiết kiệm tháng này]  [📊 So sánh tháng trước]|
|  -----------------------------------------------------------------------------------  |
|  [ Nhập câu hỏi tài chính của bạn tại đây...                             ] [ Gửi 🚀 ] |
+---------------------------------------------------------------------------------------+
```
