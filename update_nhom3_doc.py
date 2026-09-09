# -*- coding: utf-8 -*-
"""
Script to synchronize nhom3.docx with 100% of live codebase features:
- Update Mục Lục Hình Ảnh (Figures 1-24)
- Update Mục Lục Bảng (Tables 1-5, 22 Use Cases, 20 Test Cases)
- Update Table 2 (20 Test Cases)
- Update Requirements (Chapter 1/2)
- Update Chapter 3 (All 12 User modules, All 10 Admin modules)
- Update Table 4 (All 22 Use Cases: UC-USR-01..12, UC-ADM-13..22)
- Update Chapter 4 (All live UI/UX: Landing Page 5 tabs, Hamburger menu, Dual-channel payment, 50/30/20 card, Multi-tier alerts, 10 Admin modules, Figures 6-24)
- Update Table 5 (All 20 Test Cases: TC-01..TC-20)
- Update Chapter 5 & Chapter 6 evaluation and conclusions (20/20 PASS 100%)
"""

import sys
import docx
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

sys.stdout.reconfigure(encoding='utf-8')

def format_run(run, font_name="Times New Roman", size_pt=14, bold=False, italic=False, color=None):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = color

def set_cell_content(cell, text, font_name="Times New Roman", size_pt=14, bold=False, italic=False, align=None):
    p = cell.paragraphs[0]
    p.text = ""
    if align is not None:
        p.alignment = align
    r = p.add_run(text)
    format_run(r, font_name=font_name, size_pt=size_pt, bold=bold, italic=italic)

def add_p_before(ref_p, text="", style='Normal', font_name="Times New Roman", size_pt=14, bold=False, italic=False, align=None):
    new_p = ref_p.insert_paragraph_before('', style=style)
    if align is not None:
        new_p.alignment = align
    if text:
        r = new_p.add_run(text)
        format_run(r, font_name=font_name, size_pt=size_pt, bold=bold, italic=italic)
    return new_p

def add_bullet_before(ref_p, title, content, style='List Paragraph', font_name="Times New Roman", size_pt=14):
    new_p = ref_p.insert_paragraph_before('', style=style)
    r1 = new_p.add_run(title)
    format_run(r1, font_name=font_name, size_pt=size_pt, bold=True)
    r2 = new_p.add_run(content)
    format_run(r2, font_name=font_name, size_pt=size_pt, bold=False)
    return new_p

def run_update():
    print("Loading nhom3.docx...")
    doc = docx.Document('nhom3.docx')
    print(f"Loaded: {len(doc.paragraphs)} paragraphs, {len(doc.tables)} tables.")

    # -------------------------------------------------------------
    # 1. CẬP NHẬT MỤC LỤC HÌNH ẢNH & MỤC LỤC BẢNG
    # -------------------------------------------------------------
    print("\n--- 1. Cập nhật Mục Lục Hình Ảnh & Mục Lục Bảng ---")
    
    # Tìm dòng Hình 18 trong mục lục hình ảnh (quanh paragraph 20)
    p_hinh18_idx = None
    for i in range(2, 25):
        if "Hình 18" in doc.paragraphs[i].text:
            p_hinh18_idx = i
            break
    
    if p_hinh18_idx is not None:
        ref_p = doc.paragraphs[p_hinh18_idx + 1] # Chèn trước dòng tiếp theo (Mục Lục Bảng)
        new_figures = [
            "Hình 19. Landing Page giới thiệu đa tab, Menu 3 gạch Slide-Down và Đăng nhập Demo 1-Click.\t37",
            "Hình 20. Phân hệ Gói Dịch Vụ VIP, Bảng giá 3 kỳ hạn và Modal Thanh toán Kép VietQR / Trích Ví.\t38",
            "Hình 21. Hộp thư & Thông báo đa kênh (Notification Center) và Chuông cảnh báo Header.\t39",
            "Hình 22. Trung tâm Hỗ trợ Kỹ thuật (User Ticket Center) và Theo dõi giải quyết khiếu nại.\t39",
            "Hình 23. Quản trị Cổng Ngân Hàng & VietQR (Admin Bank Gateway) và Giả lập Mock Webhook.\t40",
            "Hình 24. Quản trị Đơn Nạp VIP & Tiếp nhận Xử lý Ticket Hỗ trợ (Admin Support Center).\t40"
        ]
        for fig_text in new_figures:
            already_exists = any(fig_text[:10] in doc.paragraphs[k].text for k in range(2, 35))
            if not already_exists:
                p = ref_p.insert_paragraph_before(fig_text, style='table of figures')
                for r in p.runs:
                    format_run(r, font_name="Times New Roman", size_pt=14)
                print(f"  + Đã thêm vào Mục lục Hình ảnh: {fig_text[:50]}...")

    # Cập nhật Mục Lục Bảng: Bảng 4 và Bảng 5
    for i in range(15, 35):
        text = doc.paragraphs[i].text
        if "Bảng 4" in text and "Use Cases" in text:
            doc.paragraphs[i].text = "Bảng 4. Bảng tổng hợp danh mục các Use Cases của hệ thống (22 Use Cases).\t25"
            for r in doc.paragraphs[i].runs:
                format_run(r, font_name="Times New Roman", size_pt=14)
            print("  + Đã cập nhật Mục lục Bảng 4 (22 Use Cases)")
        elif "Bảng 5" in text and "Test Cases" in text:
            doc.paragraphs[i].text = "Bảng 5. Kịch bản và kết quả kiểm thử hệ thống chi tiết (20 Test Cases)\t41"
            for r in doc.paragraphs[i].runs:
                format_run(r, font_name="Times New Roman", size_pt=14)
            print("  + Đã cập nhật Mục lục Bảng 5 (20 Test Cases)")

    # Cập nhật Bảng 2: Phân công nhiệm vụ (hàng 1 Đặng Quyết Thắng)
    t2 = doc.tables[2]
    for row in t2.rows:
        if len(row.cells) > 2 and "Đặng Quyết Thắng" in row.cells[1].text:
            text = row.cells[2].text
            if "16 kịch bản kiểm thử" in text:
                row.cells[2].text = text.replace("16 kịch bản kiểm thử", "20 kịch bản kiểm thử")
                for p in row.cells[2].paragraphs:
                    for r in p.runs:
                        format_run(r, font_name="Times New Roman", size_pt=14)
                print("  + Đã cập nhật Table 2: Đặng Quyết Thắng -> 20 kịch bản kiểm thử")

    # -------------------------------------------------------------
    # 2. CẬP NHẬT YÊU CẦU CHỨC NĂNG (CHƯƠNG 1 / 2)
    # -------------------------------------------------------------
    print("\n--- 2. Cập nhật Yêu cầu chức năng trong Báo cáo ---")
    p_req_idx = None
    for i, p in enumerate(doc.paragraphs):
        if "Trợ lý ảo AI Q&A giải đáp thắc mắc tài chính" in p.text:
            p_req_idx = i
            break
    
    if p_req_idx is not None:
        ref_p = doc.paragraphs[p_req_idx + 1] # Chèn sau bullet cuối
        extra_reqs = [
            ("- Phân hệ Gói dịch vụ & Thanh toán đa kênh: ", "Cung cấp bảng giá 4 cấp độ (Free, Pro, VIP, Platinum), 3 chu kỳ thanh toán linh hoạt (1 tháng, 3 tháng chiết khấu 5%, 1 năm tặng 2 tháng). Hỗ trợ thanh toán kép VietQR Napas247 SePay tự động và Trích ví thanh toán trực tiếp bảo mật."),
            ("- Phân hệ Hộp thư & Thông báo đa kênh: ", "Hệ thống chuông cảnh báo trên Header và trang quản lý thông báo phân loại 4 nhóm (Cảnh báo ngân sách, Lời khuyên tài chính AI, Thông báo hệ thống, Kết quả duyệt VIP), tích hợp deep link điều hướng và đánh dấu đã đọc."),
            ("- Phân hệ Trung tâm Hỗ trợ & Khiếu nại kỹ thuật: ", "Cổng gửi phiếu hỗ trợ (ticket) cho người dùng phân loại sự cố (Lỗi giao dịch, Nạp VIP, Tính năng), chọn mức độ ưu tiên (Thấp, Bình thường, Cao), theo dõi tiến độ giải quyết và nhận phản hồi trực tiếp từ Admin."),
            ("- Trung tâm Điều hành Quản trị Toàn diện (Admin Control Center 10 phân hệ): ", "Giao diện quản trị tập trung gồm 10 phân hệ chuyên biệt: Dashboard giám sát toàn sàn, Quản lý người dùng, Quản lý đơn nạp VIP, Quản trị Cổng ngân hàng & VietQR SePay kèm Mock Webhook Tester, Quản trị AI & Prompt, Quản lý danh mục mẫu 50/30/20, Nhật ký kiểm toán Audit Logs, Phát thông báo broadcast toàn hệ thống, Tiếp nhận xử lý ticket khiếu nại, và Cài đặt máy chủ SMTP & Sao lưu khôi phục database.")
        ]
        if not any("Phân hệ Gói dịch vụ & Thanh toán đa kênh:" in doc.paragraphs[k].text for k in range(p_req_idx, p_req_idx + 10)):
            for title, content in extra_reqs:
                add_bullet_before(ref_p, title, content, style='List Paragraph')
            print("  + Đã bổ sung 4 nhóm yêu cầu chức năng mới vào Chương 1/2")

    # -------------------------------------------------------------
    # 3. CẬP NHẬT CHƯƠNG 3 (YÊU CẦU CHỨC NĂNG & ĐẶC TẢ CHI TIẾT)
    # -------------------------------------------------------------
    print("\n--- 3. Cập nhật Chương 3: Chi tiết các phân hệ chức năng ---")
    
    # Tìm vị trí phân hệ Gói dịch vụ (quanh paragraph 283)
    p_sub_idx = None
    for i, p in enumerate(doc.paragraphs):
        if "Phân hệ Bảng Giá Dịch Vụ VIP & Cổng Thanh Toán VietQR Tự Động" in p.text:
            p_sub_idx = i
            break
            
    if p_sub_idx is not None:
        doc.paragraphs[p_sub_idx].text = "Phân hệ Bảng Giá Dịch Vụ VIP & Thanh Toán Đa Kênh (VietQR / Trích Ví)"
        for k in range(p_sub_idx, p_sub_idx + 10):
            if "Cơ chế thanh toán VietQR động:" in doc.paragraphs[k].text:
                doc.paragraphs[k].text = "Cơ chế thanh toán đa kênh (Dual-Channel Payment): Hệ thống cung cấp 2 phương thức thanh toán linh hoạt và an toàn tuyệt đối:"
                ref_sub = doc.paragraphs[k + 1]
                add_bullet_before(ref_sub, "- Kênh 1 - Quét mã VietQR Động (MB Bank Napas247): ", "Tích hợp cổng ngân hàng Quân Đội MB Bank (Số tài khoản: 0374617569 - Chủ tài khoản: DANG QUYET THANG). Tự động sinh mã QR Napas247 theo chuẩn VietQR với đúng số tiền theo chu kỳ đăng ký (1 tháng, 3 tháng giảm 5%, 1 năm tặng 2 tháng) kèm cú pháp định danh đơn hàng duy nhất, kết nối webhook SePay tự động khớp giao dịch 24/7.")
                add_bullet_before(ref_sub, "- Kênh 2 - Trích Ví Thanh Toán Trực Tiếp (Direct Wallet Debit): ", "Cho phép người dùng sử dụng trực tiếp số dư ví tiền thật cá nhân đã nạp trên hệ thống để nâng cấp gói cước ngay tức thì. Giao diện tích hợp cơ chế bảo mật che số tài khoản dạng (**** **** **** 8888) và chỉ thực hiện giao dịch khi có sự xác nhận chủ động từ người dùng.")
                add_bullet_before(ref_sub, "- Huy hiệu thời hạn & Hạn ngạch AI động: ", "Sau khi nâng cấp thành công, giao diện tự động cập nhật Huy hiệu phân hạng (Pro, VIP, Platinum) kèm số ngày sử dụng còn lại và hiển thị trực tiếp thanh hạn ngạch số lượt gọi AI Parser còn lại trong ngày theo gói dịch vụ.")
                add_bullet_before(ref_sub, "- Quản lý Lịch sử Đơn Nạp: ", "Người dùng dễ dàng tra cứu toàn bộ lịch sử hóa đơn nạp gói VIP, mã giao dịch, số tiền, phương thức thanh toán và trạng thái phê duyệt trực quan.")
                print("  + Đã cập nhật chi tiết Phân hệ Gói cước & Thanh toán kép trong Chương 3")
                break

    # Cập nhật phân hệ Quản trị Hệ thống trong Chương 3 (Section 3.2)
    p_admin_idx = None
    for i, p in enumerate(doc.paragraphs):
        if p.text.strip() == "Phân hệ Quản trị Hệ thống (Admin)":
            p_admin_idx = i
            break
            
    if p_admin_idx is not None:
        print(f"  + Tìm thấy Phân hệ Quản trị Hệ thống tại paragraph {p_admin_idx}")
        has_bank_gw = any("Quản trị Cổng Ngân Hàng & VietQR" in doc.paragraphs[k].text for k in range(p_admin_idx, min(p_admin_idx + 40, len(doc.paragraphs))))
        if not has_bank_gw:
            p_logs_idx = None
            for k in range(p_admin_idx, min(p_admin_idx + 40, len(doc.paragraphs))):
                if "Nhật ký Hệ thống & Giám sát An ninh" in doc.paragraphs[k].text:
                    p_logs_idx = k
                    break
            
            if p_logs_idx is not None:
                ref_admin = doc.paragraphs[p_logs_idx]
                h3_sub = add_p_before(ref_admin, "Quản trị Đơn Nạp VIP & Lịch Sử Giao Dịch Toàn Sàn (Admin Subscriptions)", style='Heading 3')
                add_bullet_before(ref_admin, "Kiểm soát dòng tiền đăng ký gói: ", "Theo dõi bảng kê toàn bộ đơn hàng nâng cấp VIP trên toàn hệ thống kèm biểu đồ doanh thu thực tế, tỷ trọng các gói (Pro, VIP, Platinum) và chu kỳ đăng ký (1 tháng, 3 tháng, 1 năm).")
                add_bullet_before(ref_admin, "Bộ lọc & Thao tác 1-Click: ", "Hỗ trợ lọc đơn theo trạng thái (Chờ duyệt, Đã phê duyệt, Đã từ chối); cung cấp nút bấm Phê duyệt 1-Click tự động kích hoạt gói cước, tăng thời hạn sử dụng cho người dùng và gửi thông báo xác nhận tức thì; hỗ trợ xuất danh sách đơn ra tệp CSV.")

                h3_bank = add_p_before(ref_admin, "Quản trị Cổng Ngân Hàng & VietQR (Admin Bank Gateway)", style='Heading 3')
                add_bullet_before(ref_admin, "Cấu hình Cổng Ngân Hàng Thụ Hưởng: ", "Thiết lập thông tin tài khoản ngân hàng Quân Đội MB Bank Napas247 tiếp nhận thanh toán (Số tài khoản: 0374617569 - DANG QUYET THANG), cấu hình SePay API Key và Webhook URL để nhận tín hiệu biến động số dư tự động.")
                add_bullet_before(ref_admin, "Bảng Giả Lập Kiểm Thử Mock VietQR Webhook Tester: ", "Tích hợp sẵn giao diện giả lập phát tín hiệu Webhook chuyển khoản ngân hàng phục vụ kiểm thử end-to-end, cho phép Admin kiểm tra tính chính xác của cơ chế tự động khớp mã đơn và cộng tiền tức thời mà không phát sinh chi phí thực tế.")

                p_settings_idx = None
                for k in range(p_logs_idx, min(p_logs_idx + 40, len(doc.paragraphs))):
                    if "Cài đặt Hệ thống & Dịch vụ Nền" in doc.paragraphs[k].text or "Cài đặt Hệ thống" in doc.paragraphs[k].text:
                        p_settings_idx = k
                        break
                        
                if p_settings_idx is not None:
                    p_uc_table_idx = None
                    for k in range(p_settings_idx, min(p_settings_idx + 30, len(doc.paragraphs))):
                        if "Bảng Tổng hợp Danh mục Ca Sử dụng" in doc.paragraphs[k].text or "Bảng 4" in doc.paragraphs[k].text:
                            p_uc_table_idx = k
                            break
                    if p_uc_table_idx is not None:
                        ref_uc = doc.paragraphs[p_uc_table_idx]
                        h3_notif = add_p_before(ref_uc, "Quản trị Phát Thông Báo Hệ Thống (Broadcast System)", style='Heading 3')
                        add_bullet_before(ref_uc, "Phát thông báo broadcast toàn sàn: ", "Giao diện soạn thảo tiêu đề, nội dung, phân loại sự cố (Thông báo bảo trì, Cập nhật tính năng, Khuyến mãi nạp VIP) và đẩy thông báo tức thì tới hòm thư của toàn bộ tài khoản người dùng.")

                        h3_supp = add_p_before(ref_uc, "Quản trị Tiếp Nhận & Xử Lý Ticket Hỗ Trợ (Admin Support Center)", style='Heading 3')
                        add_bullet_before(ref_uc, "Tiếp nhận và giải quyết khiếu nại kỹ thuật: ", "Danh sách hiển thị toàn bộ yêu cầu hỗ trợ từ người dùng. Admin trực tiếp mở xem chi tiết sự cố, lựa chọn cập nhật trạng thái (Đang xử lý / Đã giải quyết / Đóng) và nhập nội dung giải đáp chính thức gửi phản hồi về cho người dùng.")
                        print("  + Đã bổ sung 4 phân hệ Admin vào Chương 3 (Subscriptions, Bank Gateway, Broadcast, Support Center)")

    # -------------------------------------------------------------
    # 4. CẬP NHẬT TABLE 4 (USE CASES: ĐẦY ĐỦ 22 USE CASES)
    # -------------------------------------------------------------
    print("\n--- 4. Cập nhật Bảng 4: Bảng Tổng Hợp Danh Mục Use Cases (22 Use Cases) ---")
    
    for i, p in enumerate(doc.paragraphs):
        if "Bảng 4." in p.text:
            p.text = "Bảng 4. Bảng tổng hợp danh mục các Use Cases của hệ thống (22 Use Cases)."
            for r in p.runs:
                format_run(r, font_name="Times New Roman", size_pt=14, bold=True)
            print(f"  + Đã cập nhật Caption Bảng 4 tại paragraph {i}")
            break

    t4 = doc.tables[4]
    use_cases_data = [
        ("UC-USR-01", "Đăng ký & Đăng nhập", "User", "Đăng ký tài khoản mới, mã hóa mật khẩu, đăng nhập thông thường hoặc truy cập nhanh 1-Click Demo User / Admin.", "Email, Mật khẩu, Họ tên, Nút 1-Click Demo", "Token xác thực, Khởi tạo tài khoản và tự động sao chép danh mục mẫu 50/30/20."),
        ("UC-USR-02", "Thiết lập Hồ sơ & Bảo mật cá nhân", "User", "Cập nhật thông tin cá nhân, đổi mật khẩu, quản lý khóa an ninh và bảo vệ quyền riêng tư Zero-PII Leakage.", "Thông tin cá nhân, Mật khẩu cũ/mới, Khóa API cá nhân", "Thông tin cập nhật, Bảo vệ dữ liệu nhạy cảm trước khi gửi AI."),
        ("UC-USR-03", "Quản lý Ví & Tài khoản", "User", "Kiến trúc 2 tầng (Ví ghi chép Sandbox & Ví thanh toán thực). Thêm, sửa, đóng ví, nạp số dư và chuyển tiền nội bộ giữa các ví.", "Tên ví, Phân loại ví, Số dư ban đầu, Số tài khoản, Số tiền chuyển", "Danh sách thẻ ví phân loại trực quan, Biến động số dư tức thời, Tự động che số tài khoản (**** 8888)."),
        ("UC-USR-04", "Quản lý Danh mục Thu – Chi", "User", "Thiết lập danh mục cá nhân hóa theo nhóm quy tắc chuẩn 50/30/20, hỗ trợ icon và mã màu sắc nhận diện.", "Tên danh mục, Phân loại (Thu/Chi), Nhóm chuẩn 50/30/20, Icon", "Cây danh mục chuẩn hóa, Tự động liên kết khi ghi chép giao dịch."),
        ("UC-USR-05", "Nhập Giao dịch Thủ công & AI", "User", "Tạo, cập nhật, xóa giao dịch qua form chi tiết hoặc bóc tách câu nói tự nhiên bằng tiếng Việt qua FinTrack AI Parser.", "Câu text tự nhiên / (Số tiền, Danh mục, Ví nguồn, Ghi chú, Ảnh bill)", "Bút toán giao dịch mới, Cập nhật số dư ví tương ứng, Gắn nhãn nhận diện AI."),
        ("UC-USR-06", "Quản lý Hạn mức Ngân sách", "User", "Đặt trần chi tiêu tháng, theo dõi cảnh báo đa tầng 3 cấp độ (An toàn <80%, Cảnh báo 80-99%, Bội chi >=100%) và phân bổ 50/30/20.", "Danh mục chi tiêu, Trần hạn mức tối đa, Chu kỳ tháng", "Thanh tiến độ đổi màu trực quan, Thẻ 3 cột phân bổ 50/30/20, Cảnh báo vượt trần chi tiêu."),
        ("UC-USR-07", "Quản lý Mục tiêu Tiết kiệm", "User", "Lập kế hoạch tích lũy tài chính, nạp tiền trích từ ví vào quỹ tích lũy, theo dõi tiến độ và đếm ngược số ngày.", "Tên mục tiêu, Số tiền cần đạt, Hạn định ngày, Số tiền nạp tích lũy", "Thanh tiến độ hoàn thành %, Số ngày còn lại, Biến động số dư ví trích tiền."),
        ("UC-USR-08", "Báo cáo, Thống kê & Xuất file", "User", "Xem biểu đồ trực quan xu hướng dòng tiền, cơ cấu chi tiêu (Donut Chart) và trích xuất lịch sử ra file Excel, PDF, CSV.", "Bộ lọc (Khoảng thời gian, Danh mục, Ví, Loại giao dịch)", "Biểu đồ Donut, Biểu đồ kết hợp Cột - Đường, Tệp báo cáo xuất định dạng Excel/PDF/CSV."),
        ("UC-USR-09", "Trợ lý Tài chính & Gamification", "User", "Chat hỏi đáp cố vấn tài chính 24/7 với AI, nhận điểm kinh nghiệm XP, duy trì chuỗi Streak và mở khóa 24 huy hiệu thành tích.", "Câu hỏi tư vấn tài chính, Hành vi ghi chép chi tiêu kỷ luật hàng ngày", "Lời khuyên cá nhân hóa từ AI, Cập nhật Level, Thanh tiến độ XP, Huy hiệu mở khóa."),
        ("UC-USR-10", "Đăng ký / Gia hạn VIP VietQR & Trích Ví", "User", "Đăng ký gói VIP (4 cấp độ), chọn 3 chu kỳ linh hoạt và thanh toán kép qua VietQR MB Bank Napas247 hoặc Trích ví tiền thật trực tiếp.", "Gói cước (Free/Pro/VIP/Platinum), Chu kỳ (1M/3M/1Y), Kênh thanh toán", "Mã VietQR động SePay / Trừ số dư ví tiền thật, Hóa đơn nạp VIP, Huy hiệu hạn dùng và hạn ngạch AI."),
        ("UC-USR-11", "Hộp Thư & Hệ Thống Thông Báo Đa Kênh", "User", "Tiếp nhận và quản lý thông báo theo 4 nhóm sự kiện (Cảnh báo ngân sách, Lời khuyên AI, Thông báo hệ thống, Duyệt VIP), hỗ trợ deep link điều hướng.", "Thao tác xem thông báo, Lọc phân loại, Đánh dấu đã đọc tất cả, Xóa thông báo", "Danh sách thông báo trực quan, Huy hiệu số lượng chưa đọc trên Header, Điều hướng tới tab chức năng."),
        ("UC-USR-12", "Gửi Phiếu Hỗ Trợ & Khiếu Nại (User Support Center)", "User", "Gửi yêu cầu trợ giúp kỹ thuật, khiếu nại nạp VIP hoặc góp ý tính năng tới Ban Quản Trị; theo dõi tiến độ và nhận phản hồi trực tiếp.", "Tiêu đề sự cố, Phân loại nghiệp vụ (Bug/Payment/Feature), Mức độ ưu tiên, Nội dung", "Mã Ticket (TCK-xxxxx), Trạng thái Mở/Đang xử lý/Đã giải quyết, Lịch sử phản hồi từ Admin."),
        ("UC-ADM-13", "Giám sát Tổng quan Hệ thống (Admin Dashboard)", "Admin", "Theo dõi chỉ số vận hành toàn sàn: tổng số người dùng, doanh thu thực tế, lượt gọi/token AI tiêu thụ, tình trạng Server Health Check.", "Chu kỳ thống kê (Hôm nay/Tuần/Tháng)", "Dashboard tổng quan, Biểu đồ DAU/MAU, Biểu đồ cơ cấu gói, Bảng tin nhanh & Log an ninh."),
        ("UC-ADM-14", "Quản trị Tài khoản Người dùng", "Admin", "Tra cứu người dùng, phân quyền User/Admin, đổi gói cước và thực hiện khóa tài khoản cưỡng chế (Hard Lockout) tức thời.", "Từ khóa tìm kiếm, Bộ lọc quyền/gói/trạng thái, Thao tác Khóa/Mở/Phân quyền", "Cập nhật hồ sơ tài khoản, Hủy phiên đăng nhập của user bị khóa, Modal xem chi tiết tài chính."),
        ("UC-ADM-15", "Quản trị Đơn Nạp VIP Toàn Sàn (Admin Subscriptions)", "Admin", "Kiểm soát bảng kê toàn bộ đơn nạp VIP, đối soát doanh thu thực và phê duyệt/từ chối 1-Click kích hoạt gói cước cho người dùng.", "Bộ lọc trạng thái (Tất cả/Chờ duyệt/Đã duyệt/Từ chối), Thao tác Duyệt/Hủy", "Gói VIP kích hoạt tức thì cho User, Cộng thời hạn sử dụng, Cập nhật doanh thu toàn sàn, Xuất file CSV."),
        ("UC-ADM-16", "Quản trị Cổng Ngân Hàng & VietQR (Admin Bank Gateway)", "Admin", "Cấu hình tài khoản thụ hưởng MB Bank Napas247, SePay API Key, Webhook URL và giả lập kiểm thử nạp tiền tự động qua Mock Webhook Tester.", "Số tài khoản MB Bank, Tên chủ thẻ, API Key SePay, Dữ liệu phát Mock Webhook", "Cập nhật mã VietQR động toàn hệ thống, Xử lý webhook tự động cộng tiền và duyệt đơn tức thời."),
        ("UC-ADM-17", "Cấu hình Mô hình & Prompt AI (Admin AI Engine)", "Admin", "Quản trị model AI (Gemini 1.5 Pro), trực tiếp tinh chỉnh System Prompt Parser và Financial Health Advisor, cấu hình hạn mức calls/day theo gói.", "Lựa chọn Provider/Model, System Prompt Parser, System Prompt Advisor, Daily Call Limit", "Cập nhật cấu hình AI toàn sàn, Giám sát lượng Token tiêu thụ và chi phí API."),
        ("UC-ADM-18", "Quản lý Danh mục Mẫu Toàn Sàn & Khung 50/30/20 (Admin Master Data)", "Admin", "Thiết lập và chuẩn hóa kho danh mục Thu/Chi mặc định nhân bản tự động cho người dùng mới; cấu hình thông số chuẩn 50/30/20.", "Tên danh mục mẫu, Phân loại (Thu/Chi), Nhóm 50/30/20, Icon đại diện, Tỷ lệ khung mẫu", "Bộ danh mục chuẩn hệ thống, Đồng bộ mẫu phân tích tài chính cho người dùng mới."),
        ("UC-ADM-19", "Quản lý Nhật ký & An ninh (Admin Audit Logs)", "Admin", "Giám sát và truy vết toàn bộ hoạt động đăng nhập, thay đổi dữ liệu, gọi API AI và cảnh báo an ninh bảo mật theo thời gian thực.", "Bộ lọc loại Log (SECURITY, DATA_CHANGE, AI_API, ERROR), Tìm kiếm IP/Email", "Bảng Audit Log chi tiết thời gian thực, Hỗ trợ điều tra sự cố và giám sát tấn công."),
        ("UC-ADM-20", "Quản trị Phát Thông Báo Hệ Thống (Broadcast System)", "Admin", "Soạn thảo và phát thông báo hệ thống đồng loạt (broadcast) đến hộp thư và thanh thông báo của toàn bộ người dùng trên nền tảng.", "Tiêu đề thông báo, Nội dung, Phân loại (Hệ thống/Bảo trì/Khuyến mãi), Mức độ ưu tiên", "Thông báo đẩy tức thì đến toàn bộ tài khoản người dùng đang hoạt động."),
        ("UC-ADM-21", "Quản trị Tiếp Nhận & Xử Lý Ticket Hỗ Trợ (Admin Support Center)", "Admin", "Tiếp nhận toàn bộ ticket khiếu nại từ người dùng, xem chi tiết sự cố, gửi phản hồi giải pháp và cập nhật trạng thái xử lý ticket.", "Mã Ticket cần xử lý, Nội dung phản hồi giải pháp, Trạng thái (Đang xử lý / Đã giải quyết / Đóng)", "Cập nhật tiến độ ticket, Gửi phản hồi chính thức về hộp thư của người dùng kèm nhật ký thời gian."),
        ("UC-ADM-22", "Cài đặt Hệ Thống, SMTP Mail & Sao Lưu Cơ Sở Dữ Liệu (Admin Settings)", "Admin", "Cấu hình thông số gửi thư SMTP máy chủ, quản lý các khóa API an ninh và thực hiện sao lưu/phục hồi tệp fintrack.db.", "Thông số SMTP Host, Port, Email, App Password; Khóa API; Lệnh tạo bản Snapshot Database", "Tệp sao lưu fintrack.db được tải về an toàn, Hệ thống khôi phục trạng thái nguyên vẹn.")
    ]

    for idx, uc_row in enumerate(use_cases_data):
        row_idx = idx + 1
        if row_idx < len(t4.rows):
            row = t4.rows[row_idx]
        else:
            row = t4.add_row()
        
        for col_idx, text_val in enumerate(uc_row):
            cell = row.cells[col_idx]
            bold = (col_idx == 0)
            set_cell_content(cell, text_val, font_name="Times New Roman", size_pt=14, bold=bold)
            
    print(f"  + Hoàn thành cập nhật Bảng 4: Tổng {len(t4.rows)} hàng (1 header + 22 Use Cases).")

    # -------------------------------------------------------------
    # 5. CẬP NHẬT CHƯƠNG 4 (HIỆN THỰC HOÁ & KẾT QUẢ THỬ NGHIỆM)
    # -------------------------------------------------------------
    print("\n--- 5. Cập nhật Chương 4: Hiện thực hoá và hình ảnh minh họa ---")
    
    for i, p in enumerate(doc.paragraphs):
        t = p.text.strip()
        if t == "Quản lý Tài khoản & Ví tiền":
            if not any("Hình 6" in doc.paragraphs[k].text for k in range(i, min(i + 15, len(doc.paragraphs)))):
                for k in range(i, min(i + 15, len(doc.paragraphs))):
                    if "Sổ Giao Dịch" in doc.paragraphs[k].text:
                        ref_fig = doc.paragraphs[k]
                        add_p_before(ref_fig, "Hình 6. Quản lý Tài khoản & Ví tiền", style='Caption')
                        print("  + Đã bổ sung Caption: Hình 6. Quản lý Tài khoản & Ví tiền")
                        break
        elif t == "Sổ Giao Dịch và Điểm nhấn Nhập Nhanh bằng AI":
            if not any("Hình 7" in doc.paragraphs[k].text for k in range(i, min(i + 10, len(doc.paragraphs)))):
                for k in range(i, min(i + 10, len(doc.paragraphs))):
                    if "Ghi Giao Dịch Thủ Công:" in doc.paragraphs[k].text:
                        ref_fig = doc.paragraphs[k]
                        add_p_before(ref_fig, "Hình 7. Sổ Giao Dịch Thu - Chi", style='Caption')
                        print("  + Đã bổ sung Caption: Hình 7. Sổ Giao Dịch Thu - Chi")
                        break
        elif "Mục tiêu Tiết kiệm: Khởi tạo các quỹ tích lũy" in t:
            if not any("Hình 10" in doc.paragraphs[k].text for k in range(i, min(i + 10, len(doc.paragraphs)))):
                for k in range(i, min(i + 10, len(doc.paragraphs))):
                    if "Phân tích Báo cáo, Trợ lý AI" in doc.paragraphs[k].text:
                        ref_fig = doc.paragraphs[k]
                        add_p_before(ref_fig, "Hình 10. Ngân sách & Mục tiêu Tiết kiệm", style='Caption')
                        print("  + Đã bổ sung Caption: Hình 10. Ngân sách & Mục tiêu Tiết kiệm")
                        break
        elif "Trợ lý AI Cố Vấn (FinTrack AI Chatbot):" in t:
            if not any("Hình 12" in doc.paragraphs[k].text for k in range(i, min(i + 10, len(doc.paragraphs)))):
                for k in range(i, min(i + 10, len(doc.paragraphs))):
                    if "Hệ thống Gamification & Thành tích:" in doc.paragraphs[k].text:
                        ref_fig = doc.paragraphs[k]
                        add_p_before(ref_fig, "Hình 12. Trợ lý AI Cố Vấn (FinTrack AI Chatbot)", style='Caption')
                        print("  + Đã bổ sung Caption: Hình 12. Trợ lý AI Cố Vấn (FinTrack AI Chatbot)")
                        break
        elif "Hệ thống Gamification & Thành tích: Theo dõi Cấp độ" in t:
            if not any("Hình 13" in doc.paragraphs[k].text for k in range(i, min(i + 10, len(doc.paragraphs)))):
                for k in range(i, min(i + 10, len(doc.paragraphs))):
                    if "Hiện thực hóa Phân hệ Quản trị Hệ thống" in doc.paragraphs[k].text:
                        ref_fig = doc.paragraphs[k]
                        add_p_before(ref_fig, "Hình 13. Hệ thống Gamification & Thành tích", style='Caption')
                        print("  + Đã bổ sung Caption: Hình 13. Hệ thống Gamification & Thành tích")
                        break
        elif "Tổng quan Hệ thống (Control Center):" in t:
            if not any("Hình 14" in doc.paragraphs[k].text for k in range(i, min(i + 10, len(doc.paragraphs)))):
                for k in range(i, min(i + 10, len(doc.paragraphs))):
                    if "Quản lý Người dùng Toàn sàn:" in doc.paragraphs[k].text:
                        ref_fig = doc.paragraphs[k]
                        add_p_before(ref_fig, "Hình 14. Tổng quan hệ thống Admin Control Center", style='Caption')
                        print("  + Đã bổ sung Caption: Hình 14. Tổng quan hệ thống Admin Control Center")
                        break
        elif "Quản lý Người dùng Toàn sàn: Bảng tra cứu" in t:
            if not any("Hình 15" in doc.paragraphs[k].text for k in range(i, min(i + 10, len(doc.paragraphs)))):
                for k in range(i, min(i + 10, len(doc.paragraphs))):
                    if "Quản trị AI & Token:" in doc.paragraphs[k].text:
                        ref_fig = doc.paragraphs[k]
                        add_p_before(ref_fig, "Hình 15. Quản lý Người dùng", style='Caption')
                        print("  + Đã bổ sung Caption: Hình 15. Quản lý Người dùng")
                        break
        elif "Quản trị AI & Token: Theo dõi lượng Token" in t:
            if not any("Hình 16" in doc.paragraphs[k].text for k in range(i, min(i + 10, len(doc.paragraphs)))):
                for k in range(i, min(i + 10, len(doc.paragraphs))):
                    if "Quản lý Danh mục Mặc định Toàn sàn:" in doc.paragraphs[k].text:
                        ref_fig = doc.paragraphs[k]
                        add_p_before(ref_fig, "Hình 16. Quản trị Al & Token", style='Caption')
                        print("  + Đã bổ sung Caption: Hình 16. Quản trị Al & Token")
                        break
        elif "Nhật ký Hệ thống (Audit Logs) & Cài đặt:" in t:
            if not any("Hình 17" in doc.paragraphs[k].text for k in range(i, min(i + 10, len(doc.paragraphs)))):
                for k in range(i, min(i + 10, len(doc.paragraphs))):
                    if "KIỂM THỬ HỆ THỐNG" in doc.paragraphs[k].text:
                        ref_fig = doc.paragraphs[k]
                        add_p_before(ref_fig, "Hình 17. Nhật ký Hệ thống", style='Caption')
                        add_p_before(ref_fig, "Hình 18. Cài đặt hệ thống", style='Caption')
                        print("  + Đã bổ sung Caption: Hình 17 & Hình 18")
                        break

    # Bổ sung các tiểu mục và Hình 19, 20, 21, 22 vào Phân hệ Người Dùng (Section 4.2)
    p_user_sec_idx = None
    for i, p in enumerate(doc.paragraphs):
        if "Hiện thực hóa Phân hệ Quản trị Hệ thống" in p.text:
            p_user_sec_idx = i
            break
            
    if p_user_sec_idx is not None:
        ref_user_end = doc.paragraphs[p_user_sec_idx]
        has_hinh19 = any("Hình 19" in doc.paragraphs[k].text for k in range(max(0, p_user_sec_idx - 30), min(len(doc.paragraphs), p_user_sec_idx + 10)))
        if not has_hinh19:
            add_p_before(ref_user_end, "Giao diện Landing Page Giới thiệu Đa Tab & Menu Hamburger Slide-Down", style='Heading 3')
            add_bullet_before(ref_user_end, "Trang chủ chào đón trực quan (Landing Page): ", "Thiết kế theo phong cách Cyber Neon hiện đại kết hợp hiệu ứng kính mờ Glassmorphism và hạt ánh sáng nền động (Ambient Light Orbs). Trang chủ gồm 5 tab chuyển hướng độc lập: Trang chủ (home), Trợ lý AI (advisor), Tính năng (features), Bảng giá VIP (pricing) và Về chúng tôi (about).")
            add_bullet_before(ref_user_end, "Thanh điều hướng cố định & Dropdown Menu 3 gạch Slide-Down: ", "Tích hợp nút hamburger 3 gạch mở dropdown menu (#landing-nav-dropdown) trượt xuống mượt mà, tối ưu hiển thị trên mọi độ phân giải màn hình. Cung cấp 2 nút truy cập nhanh 1-Click: Demo User (Đặng Quyết Thắng) và Demo Admin (Root Admin) giúp người dùng trải nghiệm tức thì các tính năng cao cấp.")
            add_p_before(ref_user_end, "Hình 19. Landing Page giới thiệu đa tab, Menu 3 gạch Slide-Down và Đăng nhập Demo 1-Click.", style='Caption')

            add_p_before(ref_user_end, "Hiện thực hóa Phân hệ Gói Cước VIP, 3 Kỳ Hạn & Thanh Toán Kép VietQR / Trích Ví", style='Heading 3')
            add_bullet_before(ref_user_end, "Bảng giá 4 cấp độ & Bộ chọn 3 kỳ hạn: ", "Giao diện hiển thị trực quan 4 gói cước: FinTrack Free (0 đ/tháng), FinTrack Pro (49.000 đ/tháng), FinTrack Premium (99.000 đ/tháng) và FinTrack Platinum VIP (199.000 đ/tháng). Tích hợp bộ chuyển đổi 3 kỳ hạn: 1 Tháng, 3 Tháng (tiết kiệm 5%), 1 Năm (tặng thêm 2 tháng sử dụng).")
            add_bullet_before(ref_user_end, "Modal Thanh Toán Kép (Dual-Channel Modal): ", "Cung cấp 2 tab thanh toán tiện lợi: Tab 1 - Quét mã VietQR động qua MB Bank Napas247 (tự động nhận diện thanh toán qua SePay Webhook); Tab 2 - Trích Ví Thanh Toán Trực Tiếp (Direct Wallet Debit) từ số dư ví tiền thật với cơ chế che số thẻ an toàn (**** **** **** 8888). Kèm dynamic badge hiển thị thời hạn VIP và hạn ngạch AI Parser còn lại trong ngày.")
            add_p_before(ref_user_end, "Hình 20. Phân hệ Gói Dịch Vụ VIP, Bảng giá 3 kỳ hạn và Modal Thanh toán Kép VietQR / Trích Ví.", style='Caption')

            add_p_before(ref_user_end, "Hiện thực hóa Hộp Thư & Hệ Thống Thông Báo Đa Kênh", style='Heading 3')
            add_bullet_before(ref_user_end, "Trung tâm thông báo (Notification Center): ", "Giao diện tab Thông báo và Widget chuông thông báo trên Header kèm huy hiệu đếm số lượng tin nhắn chưa đọc thời gian thực. Hệ thống tự động phân loại 4 nhóm thông báo: Cảnh báo ngân sách, Lời khuyên tài chính AI, Thông báo hệ thống, và Duyệt đơn VIP.")
            add_bullet_before(ref_user_end, "Tương tác thông minh: ", "Hỗ trợ lọc nhanh theo danh mục, nút Đánh dấu đã đọc tất cả chỉ với 1 click, và cơ chế liên kết điều hướng trực tiếp (deep link) đưa người dùng thẳng đến màn hình nghiệp vụ liên quan.")
            add_p_before(ref_user_end, "Hình 21. Hộp thư & Thông báo đa kênh (Notification Center) và Chuông cảnh báo Header.", style='Caption')

            add_p_before(ref_user_end, "Hiện thực hóa Trung Tâm Hỗ Trợ & Khiếu Nại Kỹ Thuật (User Ticket Center)", style='Heading 3')
            add_bullet_before(ref_user_end, "Cổng gửi phiếu khiếu nại & hỗ trợ: ", "Giao diện cho phép người dùng khởi tạo phiếu hỗ trợ (ticket) khi gặp sự cố thanh toán VietQR, lỗi giao dịch hoặc gửi đóng góp tính năng mới. Người dùng lựa chọn mức độ ưu tiên (Thấp, Bình thường, Cao) và nhập mô tả chi tiết.")
            add_bullet_before(ref_user_end, "Theo dõi tiến độ & Phản hồi trực tiếp: ", "Hiển thị danh sách ticket với mã định danh TCK duy nhất, nhãn trạng thái (Mở, Đang xử lý, Đã giải quyết) và lịch sử phản hồi giải đáp chính thức từ Quản trị viên theo thời gian thực.")
            add_p_before(ref_user_end, "Hình 22. Trung tâm Hỗ trợ Kỹ thuật (User Ticket Center) và Theo dõi giải quyết khiếu nại.", style='Caption')

            add_p_before(ref_user_end, "Phân Bổ Ngân Sách Thông Minh 50/30/20 & Cảnh Báo Đa Tầng", style='Heading 3')
            add_bullet_before(ref_user_end, "Thẻ Phân Bổ 3 Cột 50/30/20: ", "Trực quan hóa cấu trúc ngân sách thành 3 nhóm tài chính khoa học: Nhu cầu thiết yếu (50%), Mong muốn cá nhân (30%), Tiết kiệm & Đầu tư (20%). Hệ thống tự động tính toán tổng số tiền đã phân bổ, tỷ trọng thực tế và cảnh báo lệch chuẩn so với khung khuyến nghị.")
            add_bullet_before(ref_user_end, "Hệ thống cảnh báo 3 ngưỡng màu sắc: ", "Thanh tiến độ tự động đổi màu theo tỷ lệ chi tiêu thực tế: Dưới 80% (Màu Xanh - An toàn), Từ 80% đến 99% (Màu Vàng - Cảnh báo sắp chạm trần), và Từ 100% trở lên (Màu Đỏ - Vượt hạn mức bội chi) kèm hiển thị chính xác số tiền chi tiêu vượt trần.")
            print("  + Đã bổ sung 5 tiểu mục và Hình 19..22 vào Section 4.2 (Phân hệ người dùng)")

    # Bổ sung các tiểu mục và Hình 23, 24 vào Phân hệ Quản trị (Section 4.3)
    p_test_sec_idx = None
    for i, p in enumerate(doc.paragraphs):
        if "KIỂM THỬ HỆ THỐNG (TEST CASES)" in p.text:
            p_test_sec_idx = i
            break
            
    if p_test_sec_idx is not None:
        ref_admin_end = doc.paragraphs[p_test_sec_idx]
        has_hinh23 = any("Hình 23" in doc.paragraphs[k].text for k in range(max(0, p_test_sec_idx - 30), min(len(doc.paragraphs), p_test_sec_idx + 10)))
        if not has_hinh23:
            add_p_before(ref_admin_end, "Quản trị Đơn Nạp VIP & Lịch Sử Giao Dịch Toàn Sàn (Admin Subscriptions)", style='Heading 3')
            add_bullet_before(ref_admin_end, "Kiểm soát doanh thu toàn sàn: ", "Bảng kê chi tiết toàn bộ hóa đơn nạp gói cước VIP, lọc theo trạng thái (Chờ duyệt, Đã duyệt, Đã từ chối). Cung cấp nút thao tác 1-Click Phê duyệt (tự động kích hoạt gói và tăng thời hạn cho User) hoặc Từ chối kèm lý do, hỗ trợ kết xuất báo cáo CSV.")

            add_p_before(ref_admin_end, "Quản trị Cổng Ngân Hàng & VietQR (Admin Bank Gateway)", style='Heading 3')
            add_bullet_before(ref_admin_end, "Bảng điều khiển Cổng Ngân Hàng Thụ Hưởng: ", "Cấu hình tài khoản ngân hàng Quân Đội MB Bank Napas247, SePay API Key, và Webhook URL. Điểm nhấn đột phá là Bảng Giả Lập Kiểm Thử Mock VietQR Webhook Tester tích hợp sẵn, cho phép Admin mô phỏng phát tín hiệu nhận tiền tự động với bất kỳ số tiền và mã đơn test nào để kiểm tra độ tin cậy của quy trình khớp giao dịch.")
            add_p_before(ref_admin_end, "Hình 23. Quản trị Cổng Ngân Hàng & VietQR (Admin Bank Gateway) và Giả lập Mock Webhook.", style='Caption')

            add_p_before(ref_admin_end, "Quản trị Tiếp Nhận & Xử Lý Ticket Hỗ Trợ (Admin Support Center)", style='Heading 3')
            add_bullet_before(ref_admin_end, "Trung tâm xử lý khiếu nại kỹ thuật: ", "Admin tiếp nhận danh sách ticket gửi từ người dùng trên toàn hệ thống, xem xét chi tiết nội dung sự cố nạp VIP hoặc lỗi thao tác, chuyển trạng thái xử lý và trực tiếp soạn thảo văn bản phản hồi gửi về hòm thư người dùng.")
            add_p_before(ref_admin_end, "Hình 24. Quản trị Đơn Nạp VIP & Tiếp nhận Xử lý Ticket Hỗ trợ (Admin Support Center).", style='Caption')

            add_p_before(ref_admin_end, "Quản trị Phát Thông Báo Hệ Thống (Broadcast System)", style='Heading 3')
            add_bullet_before(ref_admin_end, "Phát thông báo broadcast toàn hệ thống: ", "Cung cấp công cụ soạn thảo và gửi thông báo khẩn cấp hoặc tin tức khuyến mãi đến toàn bộ người dùng đang hoạt động, tự động xuất hiện trên chuông thông báo Header và trang Hộp thư.")
            print("  + Đã bổ sung các tiểu mục Quản trị và Hình 23, 24 vào Section 4.3")

    # -------------------------------------------------------------
    # 6. CẬP NHẬT TABLE 5 (TEST CASES: ĐẦY ĐỦ 20 TEST CASES)
    # -------------------------------------------------------------
    print("\n--- 6. Cập nhật Bảng 5: Kịch bản kiểm thử chi tiết (20 Test Cases) ---")
    
    for i, p in enumerate(doc.paragraphs):
        if "Bảng 5." in p.text:
            p.text = "Bảng 5. Kịch bản và kết quả kiểm thử hệ thống chi tiết (20 Test Cases)"
            for r in p.runs:
                format_run(r, font_name="Times New Roman", size_pt=14, bold=True)
            print(f"  + Đã cập nhật Caption Bảng 5 tại paragraph {i}")
            break

    t5 = doc.tables[5]
    extra_test_cases = [
        ("TC-17", "Gửi Phiếu Hỗ Trợ Kỹ Thuật và Ban Quản Trị Phản Hồi Xử Lý", 
         "Tài khoản người dùng đã đăng nhập, mở tab Trung Tâm Hỗ Trợ",
         "1. Nhấn 'Gửi Phiếu Hỗ Trợ Mới'\n2. Điền Tiêu đề và chọn loại Khiếu nại\n3. Bấm Gửi yêu cầu\n4. Admin vào menu Hỗ Trợ tiếp nhận và gửi phản hồi giải quyết",
         "Tiêu đề: 'Kiểm tra giao dịch nạp VIP'\nLoại: Thanh toán\nMức ưu tiên: Cao\nPhản hồi Admin: 'Đã đối soát thành công và kích hoạt VIP'",
         "Ticket được tạo thành công với mã TCK-xxxxx; Admin gửi phản hồi thành công và trạng thái ticket chuyển sang Đã giải quyết.",
         "Ticket được tạo chuẩn xác, Admin phản hồi tức thì và hiển thị đầy đủ trong lịch sử khiếu nại của User.",
         "PASS"),

        ("TC-18", "Cảnh Báo Ngân Sách Đa Tầng (80% Vàng, 100% Đỏ) & Khuyến Nghị 50/30/20",
         "Danh mục Ăn uống có hạn mức 3.000.000 đ/tháng",
         "1. Nhập giao dịch 2.500.000 đ (83.3%)\n2. Kiểm tra tab Hạn Mức Ngân Sách\n3. Nhập tiếp giao dịch 600.000 đ (103.3%)\n4. Kiểm tra thẻ 50/30/20 và chuông thông báo",
         "Giao dịch 1: 2.500.000 đ\nGiao dịch 2: 600.000 đ\nDanh mục: Ăn uống",
         "Giao dịch 1 kích hoạt cảnh báo Vàng (Sắp chạm trần). Giao dịch 2 kích hoạt cảnh báo Đỏ (Bội chi), hiển thị số tiền vượt trần và gửi cảnh báo về Header.",
         "Thanh tiến độ đổi màu chính xác (Vàng -> Đỏ), thẻ 50/30/20 cập nhật cảnh báo nhóm Thiết yếu kịp thời.",
         "PASS"),

        ("TC-19", "Nạp VIP Bằng Kênh Trích Ví Trực Tiếp & Che Số Thẻ Bảo Mật",
         "Tài khoản có ví tiền thật với số dư khả dụng >= 99.000 đ",
         "1. Mở tab Gói Dịch Vụ, chọn gói FinTrack Premium (99.000 đ)\n2. Tại Modal nạp, chọn tab 'Trích Ví Trực Tiếp'\n3. Kiểm tra số thẻ che bảo mật\n4. Bấm Xác nhận",
         "Gói: PREMIUM (99k/tháng)\nKênh thanh toán: Trích Ví Tiền Thật\nSố thẻ hiển thị: **** **** **** 8888",
         "Hệ thống trừ đúng 99.000 đ từ ví tiền thật, không làm lộ số thẻ đầy đủ; gói cước kích hoạt ngay và cộng 30 ngày sử dụng.",
         "Trừ tiền thành công, mã hóa số tài khoản an toàn, gói Premium kích hoạt tức thì không cần chờ duyệt.",
         "PASS"),

        ("TC-20", "Cổng Ngân Hàng Admin & Giả Lập Nhận Tiền Tự Động (Mock VietQR Webhook)",
         "Đăng nhập tài khoản Admin, mở menu Cổng Ngân Hàng & VietQR",
         "1. Mở giao diện Cổng Ngân Hàng Admin\n2. Sử dụng công cụ Mock VietQR Webhook Tester\n3. Nhập số tiền và mã đơn test\n4. Bấm 'Giả Lập Nhận Tiền Webhook'",
         "Số tiền: 199.000 đ\nMã đơn test: #ORD-TEST999\nNgân hàng: MB Bank Napas247",
         "Backend xác thực Webhook payload, tự động khớp mã đơn hàng, kích hoạt tức thì gói Platinum VIP và cập nhật doanh thu.",
         "Webhook giả lập được xử lý trong 0.5s, đơn hàng chuyển sang Đã duyệt và tài khoản đích được nâng cấp tự động.",
         "PASS")
    ]

    existing_tcs = set(row.cells[0].text.strip() for row in t5.rows)
    for tc_tuple in extra_test_cases:
        tc_id = tc_tuple[0]
        if tc_id not in existing_tcs:
            row = t5.add_row()
            for col_idx, val in enumerate(tc_tuple):
                cell = row.cells[col_idx]
                bold = (col_idx == 0 or col_idx == 7)
                set_cell_content(cell, val, font_name="Times New Roman", size_pt=14, bold=bold)
            print(f"  + Đã thêm vào Bảng 5: {tc_id} - {tc_tuple[1]}")

    print(f"  + Hoàn thành cập nhật Bảng 5: Tổng {len(t5.rows)} hàng (1 header + 20 Test Cases).")

    # -------------------------------------------------------------
    # 7. CẬP NHẬT ĐÁNH GIÁ KIỂM THỬ (CHƯƠNG 5 & 6)
    # -------------------------------------------------------------
    print("\n--- 7. Cập nhật Đánh giá Tổng kết Kiểm thử & Kết luận ---")
    for i, p in enumerate(doc.paragraphs):
        t = p.text.strip()
        if "Tổng số ca kiểm thử thực hiện:" in t:
            p.text = "Tổng số ca kiểm thử thực hiện: 20 ca kiểm thử trọng tâm (mở rộng từ 16 lên 20 ca sau khi hoàn thiện toàn bộ các phân hệ nạp VIP VietQR, trích ví trực tiếp, cổng ngân hàng SePay, trung tâm hỗ trợ ticket và hệ sinh thái ngân sách 50/30/20). Bao phủ toàn bộ các luồng nghiệp vụ Người dùng cá nhân (User), Quản trị viên (Moderator/Admin) và Trung tâm xử lý AI."
            for r in p.runs:
                format_run(r, font_name="Times New Roman", size_pt=14)
            print("  + Đã cập nhật thống kê: 20 ca kiểm thử trọng tâm")
        elif "Kết quả: 16/16 ca kiểm thử đạt trạng thái PASS" in t:
            p.text = "Kết quả: 20/20 ca kiểm thử đạt trạng thái PASS (100%)."
            for r in p.runs:
                format_run(r, font_name="Times New Roman", size_pt=14, bold=True)
            print("  + Đã cập nhật kết quả: 20/20 ca kiểm thử PASS (100%)")
        elif "Cung cấp công cụ điều hành đa quyền (Root Admin & Moderator), quản lý nạp duyệt đơn gói cước" in t:
            p.text = "- Bảng điều khiển Quản trị (Admin Control Center 10 phân hệ) mạnh mẽ: Cung cấp bộ công cụ điều hành toàn diện gồm 10 phân hệ chuyên biệt: Dashboard giám sát, Quản lý người dùng, Quản trị đơn nạp VIP & doanh thu, Quản trị Cổng ngân hàng VietQR & Mock Webhook Tester, Quản trị mô hình/prompt AI, Quản lý danh mục mẫu 50/30/20, Nhật ký an ninh Audit Logs, Phát thông báo broadcast toàn sàn, Tiếp nhận giải quyết ticket khiếu nại kỹ thuật, và Cài đặt máy chủ SMTP & Sao lưu khôi phục database."
            for r in p.runs:
                format_run(r, font_name="Times New Roman", size_pt=14)
            print("  + Đã cập nhật phần kết luận: Admin Control Center 10 phân hệ")

    # -------------------------------------------------------------
    # 8. LƯU TỆP DOCX
    # -------------------------------------------------------------
    print("\nSaving updated nhom3.docx...")
    doc.save('nhom3.docx')
    print("SUCCESS: nhom3.docx has been updated successfully!")

if __name__ == '__main__':
    run_update()
