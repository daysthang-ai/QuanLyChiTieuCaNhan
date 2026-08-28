"""
Script tạo file PowerPoint báo cáo thuyết trình đồ án FinTrack AI: BaoCao_FinTrackAI_Demo.pptx
Sử dụng python-pptx, hỗ trợ kế thừa template.pptx nếu có hoặc tự động vẽ giao diện Dark Cyber Glassmorphism.
"""

import sys
import os
from pathlib import Path

# Đảm bảo in tiếng Việt không bị lỗi encoding trên Windows console
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# --- BẢNG MÀU CHUẨN DARK CYBER NEON ---
COLOR_BG_DARK = RGBColor(11, 15, 25)        # #0B0F19 (Nền tối Cyber)
COLOR_CARD_BG = RGBColor(17, 24, 39)        # #111827 (Nền Card)
COLOR_CARD_BORDER = RGBColor(30, 41, 59)    # #1E293B (Viền Card)
COLOR_CYAN = RGBColor(0, 242, 254)          # #00F2FE (Xanh ngọc sáng)
COLOR_CYAN_LIGHT = RGBColor(56, 189, 248)   # #38BDF8
COLOR_PURPLE = RGBColor(168, 85, 247)       # #A855F7 (Tím Neon)
COLOR_PINK = RGBColor(236, 72, 153)         # #EC4899 (Hồng Neon)
COLOR_GOLD = RGBColor(245, 158, 11)         # #F59E0B (Vàng Gold)
COLOR_EMERALD = RGBColor(16, 185, 129)      # #10B981 (Xanh lục)
COLOR_WHITE = RGBColor(240, 246, 252)       # #F0F6FC (Trắng sáng)
COLOR_GRAY = RGBColor(148, 163, 184)        # #94A3B8 (Xám chữ phụ)
COLOR_ROSE = RGBColor(244, 63, 94)          # #F43F5E (Đỏ/Rose)

def set_shape_flat_color(shape, bg_rgb, border_rgb=None, border_width=1):
    """Thiết lập màu nền và viền cho shape."""
    shape.fill.solid()
    shape.fill.fore_color.rgb = bg_rgb
    if border_rgb:
        shape.line.color.rgb = border_rgb
        shape.line.width = Pt(border_width)
    else:
        shape.line.fill.background()

def create_background_decor(slide, width, height, slide_title=""):
    """Vẽ background Cyber Dark kèm thanh Top Header và Footer."""
    # Nền chính
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, width, height)
    set_shape_flat_color(bg, COLOR_BG_DARK, None)
    
    # Thanh Neon phát sáng đỉnh slide (Gradient simulation)
    top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, width, Inches(0.08))
    set_shape_flat_color(top_bar, COLOR_CYAN, None)

    # Footer
    footer_box = slide.shapes.add_textbox(Inches(0.8), height - Inches(0.45), width - Inches(1.6), Inches(0.35))
    tf = footer_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "FinTrack AI • Nền Tảng Quản Lý Chi Tiêu Cá Nhân Tích Hợp AI • Nhóm 03 - ICTU 2026"
    p.font.size = Pt(10)
    p.font.color.rgb = COLOR_GRAY
    p.font.name = "Segoe UI"

    # Slide Title nếu có
    if slide_title:
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), width - Inches(1.6), Inches(0.9))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        p_title = tf_title.paragraphs[0]
        p_title.text = slide_title
        p_title.font.size = Pt(24)
        p_title.font.bold = True
        p_title.font.color.rgb = COLOR_CYAN
        p_title.font.name = "Segoe UI"

def add_demo_slide(prs, slide_num_str, title, feature_bullets, demo_title, demo_hint):
    """Tạo slide Demo chia đôi bố cục: Trái = Tóm tắt tính năng, Phải = Placeholder ảnh Demo."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    w, h = prs.slide_width, prs.slide_height
    create_background_decor(slide, w, h, f"[{slide_num_str}] {title}")

    col_w = Inches(5.6)
    col_h = Inches(5.6)
    top_pos = Inches(1.35)

    # 1. CỘT TRÁI: Thẻ Tóm tắt Tính năng
    left_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), top_pos, col_w, col_h)
    set_shape_flat_color(left_card, COLOR_CARD_BG, COLOR_CARD_BORDER, 1.5)

    # Header Card Trái
    hdr_box = slide.shapes.add_textbox(Inches(1.1), top_pos + Inches(0.2), col_w - Inches(0.6), Inches(0.5))
    tf_hdr = hdr_box.text_frame
    p_hdr = tf_hdr.paragraphs[0]
    p_hdr.text = "⚡ ĐẶC TẢ TÍNH NĂNG NỔI BẬT"
    p_hdr.font.size = Pt(15)
    p_hdr.font.bold = True
    p_hdr.font.color.rgb = COLOR_GOLD
    p_hdr.font.name = "Segoe UI"

    # Bullet contents
    content_box = slide.shapes.add_textbox(Inches(1.1), top_pos + Inches(0.7), col_w - Inches(0.6), col_h - Inches(0.9))
    tf_cnt = content_box.text_frame
    tf_cnt.word_wrap = True

    for i, (head, desc) in enumerate(feature_bullets):
        p = tf_cnt.add_paragraph() if i > 0 else tf_cnt.paragraphs[0]
        p.text = f"• {head}: "
        p.font.bold = True
        p.font.size = Pt(13)
        p.font.color.rgb = COLOR_CYAN_LIGHT
        p.font.name = "Segoe UI"
        
        # Thêm đoạn text chi tiết
        run = p.add_run()
        run.text = desc
        run.font.bold = False
        run.font.size = Pt(12.5)
        run.font.color.rgb = COLOR_WHITE
        p.space_after = Pt(10)

    # 2. CỘT PHẢI: Khung Placeholder Chèn Ảnh Demo
    right_card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), top_pos, col_w, col_h)
    set_shape_flat_color(right_card, RGBColor(15, 23, 42), COLOR_PURPLE, 1.5)

    # Placeholder text & icon area
    demo_box = slide.shapes.add_textbox(Inches(7.1), top_pos + Inches(0.3), col_w - Inches(0.6), Inches(0.6))
    tf_demo = demo_box.text_frame
    p_demo = tf_demo.paragraphs[0]
    p_demo.text = f"🖼️ GIAO DIỆN MINH HỌA (DEMO)"
    p_demo.font.size = Pt(14)
    p_demo.font.bold = True
    p_demo.font.color.rgb = COLOR_PURPLE
    p_demo.font.name = "Segoe UI"

    # Sub box inside image area
    inner_placeholder = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(7.1), top_pos + Inches(0.9), col_w - Inches(0.6), col_h - Inches(1.2))
    set_shape_flat_color(inner_placeholder, RGBColor(8, 12, 22), RGBColor(51, 65, 85), 1)

    ph_text_box = slide.shapes.add_textbox(Inches(7.3), top_pos + Inches(2.2), col_w - Inches(1.0), Inches(2.0))
    tf_ph = ph_text_box.text_frame
    tf_ph.word_wrap = True
    p_ph1 = tf_ph.paragraphs[0]
    p_ph1.alignment = PP_ALIGN.CENTER
    p_ph1.text = f"[ CHÈN HÌNH ẢNH MINH HỌA TẠI ĐÂY ]\n"
    p_ph1.font.bold = True
    p_ph1.font.size = Pt(14)
    p_ph1.font.color.rgb = COLOR_CYAN

    p_ph2 = tf_ph.add_paragraph()
    p_ph2.alignment = PP_ALIGN.CENTER
    p_ph2.text = demo_hint
    p_ph2.font.size = Pt(11.5)
    p_ph2.font.color.rgb = COLOR_GRAY

def build_presentation():
    template_path = Path("template.pptx")
    
    if template_path.exists():
        print(f"[FinTrack AI] Tìm thấy template: {template_path.resolve()}, đang kế thừa...")
        prs = Presentation(template_path)
    else:
        print("[FinTrack AI] Khởi tạo Presentation chuẩn 16:9 Dark Cyber...")
        prs = Presentation()
        prs.slide_width = Inches(13.333)
        prs.slide_height = Inches(7.5)

    w, h = prs.slide_width, prs.slide_height

    # =========================================================================
    # SLIDE 1: TRANG BÌA (Title Slide)
    # =========================================================================
    slide1 = prs.slides.add_slide(prs.slide_layouts[6])
    create_background_decor(slide1, w, h)

    # Brand Title Box
    title_box = slide1.shapes.add_textbox(Inches(1.0), Inches(1.3), w - Inches(2.0), Inches(2.6))
    tf = title_box.text_frame
    tf.word_wrap = True
    
    p_tag = tf.paragraphs[0]
    p_tag.text = "ĐỒ ÁN HỌC PHẦN: ỨNG DỤNG TRÍ TUỆ NHÂN TẠO (AI APPS 2026)"
    p_tag.font.size = Pt(13)
    p_tag.font.bold = True
    p_tag.font.color.rgb = COLOR_GOLD
    p_tag.font.name = "Segoe UI"
    p_tag.space_after = Pt(8)

    p_main = tf.add_paragraph()
    p_main.text = "FINTRACK AI - HỆ THỐNG QUẢN LÝ CHI TIÊU CÁ NHÂN CÓ TÍCH HỢP AI"
    p_main.font.size = Pt(28)
    p_main.font.bold = True
    p_main.font.color.rgb = COLOR_CYAN
    p_main.font.name = "Segoe UI"
    p_main.space_after = Pt(10)

    p_sub = tf.add_paragraph()
    p_sub.text = "Nền tảng Quản lý Tài chính Thông minh • Bóc tách Giao dịch Tiếng Việt • Cố vấn 50/30/20 & Bảo mật Zero-PII"
    p_sub.font.size = Pt(15)
    p_sub.font.color.rgb = COLOR_WHITE
    p_sub.font.name = "Segoe UI"

    # Info Card (Giảng viên & Sinh viên)
    info_card = slide1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(4.3), w - Inches(2.0), Inches(2.4))
    set_shape_flat_color(info_card, COLOR_CARD_BG, COLOR_CARD_BORDER, 1.5)

    info_box = slide1.shapes.add_textbox(Inches(1.3), Inches(4.5), w - Inches(2.6), Inches(2.0))
    tf_info = info_box.text_frame
    tf_info.word_wrap = True

    p_gv = tf_info.paragraphs[0]
    p_gv.text = "👩‍🏫 Giảng viên hướng dẫn: "
    p_gv.font.bold = True
    p_gv.font.size = Pt(14)
    p_gv.font.color.rgb = COLOR_GOLD
    r_gv = p_gv.add_run()
    r_gv.text = "ThS. Hà Thị Thanh"
    r_gv.font.bold = True
    r_gv.font.color.rgb = COLOR_WHITE
    p_gv.space_after = Pt(10)

    p_sv = tf_info.add_paragraph()
    p_sv.text = "👥 Nhóm sinh viên thực hiện: "
    p_sv.font.bold = True
    p_sv.font.size = Pt(14)
    p_sv.font.color.rgb = COLOR_CYAN_LIGHT
    r_sv = p_sv.add_run()
    r_sv.text = "Nhóm 03 - Lớp Công Nghệ Thông Tin K20 (ICTU 2026)"
    r_sv.font.bold = True
    r_sv.font.color.rgb = COLOR_WHITE
    p_sv.space_after = Pt(6)

    p_names = tf_info.add_paragraph()
    p_names.text = "• Đặng Quyết Thắng (Trưởng nhóm)   • Nguyễn Văn Tiến   • Quách Minh Hiếu"
    p_names.font.bold = True
    p_names.font.size = Pt(14)
    p_names.font.color.rgb = COLOR_PURPLE

    # =========================================================================
    # SLIDE 2: ĐẶT VẤN ĐỀ & MỤC TIÊU PHÁT TRIỂN
    # =========================================================================
    slide2 = prs.slides.add_slide(prs.slide_layouts[6])
    create_background_decor(slide2, w, h, "01. ĐẶT VẤN ĐỀ & MỤC TIÊU PHÁT TRIỂN DỰ ÁN")

    card_w = Inches(5.6)
    card_h = Inches(5.6)
    
    # Cột 1: Thực trạng & Bất cập
    c1 = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.35), card_w, card_h)
    set_shape_flat_color(c1, COLOR_CARD_BG, COLOR_ROSE, 1.5)

    tb1 = slide2.shapes.add_textbox(Inches(1.1), Inches(1.55), card_w - Inches(0.6), card_h - Inches(0.4))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    
    p = tf1.paragraphs[0]
    p.text = "🚨 THỰC TRẠNG & BẤT CẬP APP TRUYỀN THỐNG"
    p.font.bold = True
    p.font.size = Pt(15)
    p.font.color.rgb = COLOR_ROSE
    p.space_after = Pt(14)

    items1 = [
        ("Bùng nổ thanh toán không tiền mặt", "QR Code, MoMo, thẻ tín dụng khiến người trẻ tiêu tiền nhanh nhưng khó kiểm soát số dư ròng."),
        ("Nhập liệu thủ công rườm rà", "Gõ từng con số, chọn danh mục mất 1-2 phút khiến 85% người dùng bỏ cuộc sau 1-2 tuần."),
        ("Thiếu tính cố vấn thông minh", "Ứng dụng cũ chỉ đóng vai trò 'sổ ghi chép thụ động', không chỉ ra được nguyên nhân bội chi."),
        ("Lo ngại rủi ro rò rỉ dữ liệu cá nhân", "Người dùng e ngại chia sẻ thông tin sao kê và số tài khoản ngân hàng nhạy cảm.")
    ]
    for h_txt, d_txt in items1:
        p_item = tf1.add_paragraph()
        p_item.text = f"• {h_txt}: "
        p_item.font.bold = True
        p_item.font.size = Pt(13)
        p_item.font.color.rgb = COLOR_GOLD
        r = p_item.add_run()
        r.text = d_txt
        r.font.bold = False
        r.font.size = Pt(12)
        r.font.color.rgb = COLOR_WHITE
        p_item.space_after = Pt(8)

    # Cột 2: Mục tiêu & Giải pháp FinTrack AI
    c2 = slide2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.35), card_w, card_h)
    set_shape_flat_color(c2, COLOR_CARD_BG, COLOR_CYAN, 1.5)

    tb2 = slide2.shapes.add_textbox(Inches(7.1), Inches(1.55), card_w - Inches(0.6), card_h - Inches(0.4))
    tf2 = tb2.text_frame
    tf2.word_wrap = True

    p = tf2.paragraphs[0]
    p.text = "🎯 GIẢI PHÁP ĐỘT PHÁ CỦA FINTRACK AI"
    p.font.bold = True
    p.font.size = Pt(15)
    p.font.color.rgb = COLOR_CYAN
    p.space_after = Pt(14)

    items2 = [
        ("Tự động hóa ghi chép qua AI tiếng Việt", "FinTrack AI Parser bóc tách câu nói tự nhiên thành giao dịch có cấu trúc trong ~400ms."),
        ("Cố vấn tài chính chuẩn 50/30/20", "Chẩn đoán sức khỏe dòng tiền, phân bổ quỹ thiết yếu, giải trí, tích lũy và cảnh báo vượt hạn mức."),
        ("Bảo mật tuyệt đối Zero-PII Leakage", "Khử 100% định danh tài khoản, số thẻ trước khi đưa vào mô hình AI; từ chối truy vấn người khác."),
        ("Gamification duy trì thói quen", "Streak chuỗi ngày kỷ luật, thanh tiến trình 6 bậc Level Road Map và 24 huy hiệu vinh danh.")
    ]
    for h_txt, d_txt in items2:
        p_item = tf2.add_paragraph()
        p_item.text = f"• {h_txt}: "
        p_item.font.bold = True
        p_item.font.size = Pt(13)
        p_item.font.color.rgb = COLOR_EMERALD
        r = p_item.add_run()
        r.text = d_txt
        r.font.bold = False
        r.font.size = Pt(12)
        r.font.color.rgb = COLOR_WHITE
        p_item.space_after = Pt(8)

    # =========================================================================
    # SLIDE 3: KIẾN TRÚC PHÂN TẦNG & CƠ SỞ DỮ LIỆU 9 BẢNG
    # =========================================================================
    slide3 = prs.slides.add_slide(prs.slide_layouts[6])
    create_background_decor(slide3, w, h, "02. KIẾN TRÚC PHÂN TẦNG & THIẾT KẾ CSDL 9 BẢNG (3NF)")

    # 3 Khối Card ngang
    card_w3 = Inches(3.65)
    card_h3 = Inches(5.6)
    
    # Khối 1: Kiến trúc phân tầng
    k1 = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.35), card_w3, card_h3)
    set_shape_flat_color(k1, COLOR_CARD_BG, COLOR_CYAN, 1.5)
    tb = slide3.shapes.add_textbox(Inches(0.95), Inches(1.5), card_w3 - Inches(0.3), card_h3 - Inches(0.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🏛️ KIẾN TRÚC PHÂN TẦNG"
    p.font.bold = True; p.font.size = Pt(14); p.font.color.rgb = COLOR_CYAN
    p.space_after = Pt(10)
    
    layers = [
        ("Frontend Client (SPA)", "HTML5, Tailwind CSS, Dark Cyber Glassmorphism, Chart.js, ES6 Modules."),
        ("FastAPI Backend", "Asynchronous Python 3.12, Pydantic v2, JWT Security, OAuth2, Bcrypt."),
        ("Database Engine", "SQLite WAL Mode (Local) / PostgreSQL sẵn sàng, SQLAlchemy ORM 2.0."),
        ("AI Micro-Engine", "Google Gemini 1.5 Pro / Flash kết hợp Rule Engine NLP tiếng Việt nội bộ.")
    ]
    for l_title, l_desc in layers:
        p_l = tf.add_paragraph()
        p_l.text = f"• {l_title}: "
        p_l.font.bold = True; p_l.font.size = Pt(12); p_l.font.color.rgb = COLOR_GOLD
        r = p_l.add_run(); r.text = l_desc; r.font.bold = False; r.font.size = Pt(11.5); r.font.color.rgb = COLOR_WHITE
        p_l.space_after = Pt(6)

    # Khối 2: Kiến trúc 2-Scope Ledger
    k2 = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.8), Inches(1.35), card_w3, card_h3)
    set_shape_flat_color(k2, COLOR_CARD_BG, COLOR_PURPLE, 1.5)
    tb = slide3.shapes.add_textbox(Inches(4.95), Inches(1.5), card_w3 - Inches(0.3), card_h3 - Inches(0.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "💳 ĐA VÍ 2 TẦNG (2-SCOPE)"
    p.font.bold = True; p.font.size = Pt(14); p.font.color.rgb = COLOR_PURPLE
    p.space_after = Pt(10)

    scopes = [
        ("Tầng 1: Ví Kế Toán Ảo (virtual)", "Phục vụ ghi chép dòng tiền chi tiêu hàng ngày (Ví tiền mặt, MB Bank, MoMo, Techcombank). Không phát sinh tiền tệ thật."),
        ("Tầng 2: Ví Tiền Thật (real)", "Lưu trữ số dư nạp từ cổng ngân hàng VietQR MB Bank để thanh toán / gia hạn các gói dịch vụ VIP."),
        ("Ưu Điểm Thiết Kế", "Tách bạch 100% giữa sổ kế toán cá nhân và số dư giao dịch với nền tảng, loại bỏ nhầm lẫn dòng tiền.")
    ]
    for s_title, s_desc in scopes:
        p_s = tf.add_paragraph()
        p_s.text = f"• {s_title}: "
        p_s.font.bold = True; p_s.font.size = Pt(12); p_s.font.color.rgb = COLOR_PINK
        r = p_s.add_run(); r.text = s_desc; r.font.bold = False; r.font.size = Pt(11.5); r.font.color.rgb = COLOR_WHITE
        p_s.space_after = Pt(8)

    # Khối 3: CSDL 9 Bảng Chuẩn 3NF
    k3 = slide3.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.8), Inches(1.35), card_w3, card_h3)
    set_shape_flat_color(k3, COLOR_CARD_BG, COLOR_EMERALD, 1.5)
    tb = slide3.shapes.add_textbox(Inches(8.95), Inches(1.5), card_w3 - Inches(0.3), card_h3 - Inches(0.3))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "🗄️ CSDL 9 BẢNG (3NF)"
    p.font.bold = True; p.font.size = Pt(14); p.font.color.rgb = COLOR_EMERALD
    p.space_after = Pt(10)

    tables = [
        ("users", "Định danh, mật khẩu bcrypt, role, status, plan VIP."),
        ("wallets", "Ví kế toán ảo & ví thanh toán thực tế."),
        ("categories", "Danh mục thu/chi chuẩn hóa nhóm 50/30/20."),
        ("transactions", "Nhật ký thu chi, hoàn tiền, flag created_by_ai."),
        ("budgets", "Hạn mức ngân sách, ngưỡng cảnh báo 80%/100%."),
        ("savings_goals", "Mục tiêu tích lũy tài chính, tiến độ %."),
        ("subscription_orders", "Đơn hàng nạp VIP qua VietQR MB Bank."),
        ("notifications", "Hộp thư thông báo biến động, cảnh báo hạn mức."),
        ("support_tickets", "Tiếp nhận và phản hồi khiếu nại của user.")
    ]
    for t_name, t_desc in tables:
        p_t = tf.add_paragraph()
        p_t.text = f"• {t_name}: "
        p_t.font.bold = True; p_t.font.size = Pt(11); p_t.font.color.rgb = COLOR_CYAN_LIGHT
        r = p_t.add_run(); r.text = t_desc; r.font.bold = False; r.font.size = Pt(10.5); r.font.color.rgb = COLOR_WHITE
        p_t.space_after = Pt(3)

    # =========================================================================
    # SLIDE 4 [DEMO 1]: DASHBOARD & QUẢN LÝ ĐA VÍ 2 TẦNG
    # =========================================================================
    add_demo_slide(
        prs,
        "DEMO 01",
        "TỔNG QUAN DASHBOARD & QUẢN LÝ ĐA VÍ 2 TẦNG",
        [
            ("Chỉ số KPI Real-time", "Theo dõi trực quan Tổng tài sản ròng, Thu nhập tháng, Chi tiêu tháng và Tỷ lệ tiết kiệm thực tế."),
            ("Biểu đồ Dòng tiền 6 Tháng", "Trực quan hóa xu hướng thu/chi qua Chart.js đa trục, đối chiếu biến động tài chính theo từng tháng."),
            ("Cơ cấu Chi tiêu Donut", "Tự động phân nhóm danh mục chi tiêu, hiển thị tỷ trọng % chi tiết ngay trung tâm biểu đồ."),
            ("Kiến trúc Đa ví Linh hoạt", "Quản lý ví tiền mặt, tài khoản ngân hàng, ví điện tử MoMo; hỗ trợ chuyển tiền nội bộ giữa các ví."),
            ("Nạp nhanh số dư Ví", "Cập nhật tức thì số dư thực tế vào sổ kế toán chỉ với 1 thao tác.")
        ],
        "MÀN HÌNH DASHBOARD & QUẢN LÝ VÍ",
        "Vị trí chèn ảnh minh họa:\n1. Màn hình Tổng quan Dashboard KPI\n2. Màn hình Danh sách Tài khoản & Ví tiền"
    )

    # =========================================================================
    # SLIDE 5 [DEMO 2]: FINTRACK AI PARSER (NHẬP NHANH BẰNG AI)
    # =========================================================================
    add_demo_slide(
        prs,
        "DEMO 02",
        "ĐIỂM NHẤN FINTRACK AI PARSER - NHẬP NHANH BẰNG AI",
        [
            ("Nhập liệu 1 chạm tiếng Việt", "Người dùng gõ/nói tự nhiên: 'Ăn trưa bún bò 45k MoMo', 'Lương 28 triệu vào Techcombank'."),
            ("Bóc tách thông minh siêu tốc", "AI tự động trích xuất Loại (Thu/Chi), Số tiền, Danh mục, Ví tương ứng trong ~400ms với độ tin cậy >95%."),
            ("Sổ Giao dịch Đa tiêu chí", "Tra cứu lịch sử thu chi theo khoảng ngày, theo ví thanh toán, theo danh mục hoặc từ khóa ghi chú."),
            ("Badge Loại giao dịch Cyber", "Phân loại trực quan: Thu nhập (Xanh), Chi tiêu (Đỏ), Chuyển ví (Cyan) chống tràn chữ."),
            ("Xuất Báo cáo 1-Click", "Hỗ trợ xuất dữ liệu ra file Excel (.xlsx), PDF chuyên nghiệp và CSV chuẩn UTF-8.")
        ],
        "MODAL AI PARSER & SỔ GIAO DỊCH",
        "Vị trí chèn ảnh minh họa:\n1. Modal Bóc tách Giao dịch bằng AI Parser\n2. Bảng Sổ giao dịch Thu - Chi đa bộ lọc"
    )

    # =========================================================================
    # SLIDE 6 [DEMO 3]: QUẢN TRỊ NGÂN SÁCH 50/30/20 & TRỢ LÝ AI 24/7
    # =========================================================================
    add_demo_slide(
        prs,
        "DEMO 03",
        "QUẢN TRỊ NGÂN SÁCH 50/30/20 & TRỢ LÝ CỐ VẤN AI 24/7",
        [
            ("Cảnh báo Ngân sách Đa tầng", "Đổi màu thanh tiến trình trực quan: Xanh (<80% An toàn), Vàng (80-99% Cảnh báo), Đỏ (>=100% Bội chi)."),
            ("Chẩn đoán Sức khỏe 50/30/20", "Chấm điểm Sức khỏe Tài chính (0-100), phân tích tỷ trọng Thiết yếu (50%), Mong muốn (30%), Tiết kiệm (20%)."),
            ("Đề xuất 3 Hành động Cắt giảm", "Chỉ ra chính xác các danh mục có nguy cơ thâm hụt và đưa ra lời khuyên tối ưu chi phí thực tế."),
            ("Trợ lý AI Financial Q&A", "Hỏi đáp ngôn ngữ tự nhiên về tài chính: 'Lương 5 triệu phân bổ thế nào?', 'Tháng này tôi đã tiêu bao nhiêu?'."),
            ("Định dạng Markdown Chuyên nghiệp", "Câu trả lời từ AI được render bảng biểu, gạch đầu dòng và số tiền định dạng VND rõ ràng.")
        ],
        "HẠN MỨC NGÂN SÁCH & AI CHATBOT",
        "Vị trí chèn ảnh minh họa:\n1. Màn hình Hạn mức Ngân sách & Cảnh báo\n2. Màn hình Trợ lý Cố vấn AI Chatbot 24/7"
    )

    # =========================================================================
    # SLIDE 7 [DEMO 4]: GAMIFICATION & CỔNG NẠP VIETQR MB BANK
    # =========================================================================
    add_demo_slide(
        prs,
        "DEMO 04",
        "GAMIFICATION THÀNH TÍCH & CỔNG NẠP VIETQR MB BANK",
        [
            ("Level Road Map 6 Cột Mốc", "Hệ thống cấp bậc: Khởi Đầu (Lv.0) -> Đồng (Lv.1-2) -> Bạc (Lv.3-4) -> Vàng (Lv.5-6) -> Kim Cương (Lv.7-8) -> Huyền Thoại (Lv.9-10)."),
            ("Bộ Sưu Tập 24 Huy Hiệu", "Mở khóa vinh danh theo kỷ luật tài chính, hoàn thành ngân sách và tích lũy tiết kiệm."),
            ("Chuỗi Kỷ Luật (Streak)", "Ghi nhận số ngày duy trì ghi chép tài chính liên tục, thúc đẩy thói quen quản lý tiền bạc."),
            ("Bảng Giá 4 Gói Dịch Vụ VIP", "Free (0đ), Pro (49k/tháng), Premium (99k/tháng) và Platinum VIP (199k/tháng)."),
            ("Cổng Nạp VietQR MB Bank", "Sinh mã QR động theo chuẩn NAPAS 247: STK 0374617569 (DANG QUYET THANG), tự gán đúng số tiền & cú pháp đơn hàng.")
        ],
        "GAMIFICATION & BẢNG GIÁ VIETQR",
        "Vị trí chèn ảnh minh họa:\n1. Màn hình Gamification Level Road Map & Huy hiệu\n2. Bảng giá 4 Gói VIP & Modal Quét VietQR MB Bank"
    )

    # =========================================================================
    # SLIDE 8 [DEMO 5]: PHÂN HỆ QUẢN TRỊ ADMIN & MODERATOR CONSOLE
    # =========================================================================
    add_demo_slide(
        prs,
        "DEMO 05",
        "PHÂN HỆ QUẢN TRỊ HỆ THỐNG (ADMIN & MODERATOR CONSOLE)",
        [
            ("Admin Control Center", "Theo dõi chỉ số DAU/MAU, tổng doanh thu nạp VIP, Server Health Check (FastAPI, SQLite WAL, Gemini Latency)."),
            ("Giám sát AI Token Tiêu Thụ", "Quản lý lưu lượng request, token tiêu thụ trong ngày và hạn mức của từng nhóm tài khoản."),
            ("Quản lý Người Dùng & Khóa Cứng", "Phân quyền Root Admin/Moderator, khóa tài khoản vi phạm chính sách, đặt lại mật khẩu."),
            ("Duyệt Đơn Nạp VIP 1-Click", "Phê duyệt đối soát đơn hàng VietQR MB Bank tức thì, tự động kích hoạt hạn sử dụng VIP và gửi thông báo."),
            ("Audit Logs & Quản trị AI", "Ghi vết mọi hành vi nhạy cảm theo IP/thời gian thực; cho phép Admin chỉnh sửa trực tiếp System Prompt AI.")
        ],
        "ADMIN CONTROL CENTER & AI CONSOLE",
        "Vị trí chèn ảnh minh họa:\n1. Bảng điều khiển Admin Dashboard & Giám sát\n2. Trung tâm Quản trị AI, Duyệt đơn VIP & Audit Logs"
    )

    # =========================================================================
    # SLIDE 9: BẢO MẬT ZERO-PII LEAKAGE & HARD LOCKOUT 2 TẦNG
    # =========================================================================
    slide9 = prs.slides.add_slide(prs.slide_layouts[6])
    create_background_decor(slide9, w, h, "03. BẢO MẬT ZERO-PII LEAKAGE & HARD LOCKOUT 2 TẦNG")

    card_w9 = Inches(3.65)
    card_h9 = Inches(5.6)

    # Cột 1: Zero-PII Leakage
    b1 = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.35), card_w9, card_h9)
    set_shape_flat_color(b1, COLOR_CARD_BG, COLOR_CYAN, 1.5)
    tb = slide9.shapes.add_textbox(Inches(0.95), Inches(1.5), card_w9 - Inches(0.3), card_h9 - Inches(0.3))
    tf = tb.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.text = "🔒 ZERO-PII LEAKAGE"; p.font.bold = True; p.font.size = Pt(14); p.font.color.rgb = COLOR_CYAN
    p.space_after = Pt(10)

    pii_items = [
        ("Khử dữ liệu nhạy cảm", "Tự động làm sạch số tài khoản ngân hàng (****1234), email, số điện thoại trước khi chuyển vào Prompt AI."),
        ("Zero-PII Guardrail", "Khi người dùng hỏi về dữ liệu của người khác, AI bắt buộc từ chối 100% theo tiêu chuẩn bảo mật dữ liệu riêng tư."),
        ("Không lưu trữ thông tin thẻ", "Không lưu CVV/mật khẩu thanh toán, bảo vệ quyền riêng tư tuyệt đối.")
    ]
    for h_txt, d_txt in pii_items:
        p_item = tf.add_paragraph()
        p_item.text = f"• {h_txt}: "
        p_item.font.bold = True; p_item.font.size = Pt(12); p_item.font.color.rgb = COLOR_GOLD
        r = p_item.add_run(); r.text = d_txt; r.font.bold = False; r.font.size = Pt(11.5); r.font.color.rgb = COLOR_WHITE
        p_item.space_after = Pt(8)

    # Cột 2: Hard Lockout 2 Tầng
    b2 = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(4.8), Inches(1.35), card_w9, card_h9)
    set_shape_flat_color(b2, COLOR_CARD_BG, COLOR_ROSE, 1.5)
    tb = slide9.shapes.add_textbox(Inches(4.95), Inches(1.5), card_w9 - Inches(0.3), card_h9 - Inches(0.3))
    tf = tb.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.text = "🚫 HARD LOCKOUT 2 TẦNG"; p.font.bold = True; p.font.size = Pt(14); p.font.color.rgb = COLOR_ROSE
    p.space_after = Pt(10)

    lock_items = [
        ("Tầng 1: Backend FastAPI Dependency", "Khi tài khoản ở trạng thái LOCKED, API get_current_user chặn đứng ngay với mã lỗi HTTP 403 Forbidden."),
        ("Tầng 2: Frontend Client Interceptor", "Bắt sự kiện lỗi 403, tự động xóa sạch LocalStorage token và cưỡng chế đá ra màn hình Đăng nhập."),
        ("Chặn Đăng Nhập", "API /login từ chối cấp phát JWT token đối với mọi tài khoản đang bị vô hiệu hóa.")
    ]
    for h_txt, d_txt in lock_items:
        p_item = tf.add_paragraph()
        p_item.text = f"• {h_txt}: "
        p_item.font.bold = True; p_item.font.size = Pt(12); p_item.font.color.rgb = COLOR_PINK
        r = p_item.add_run(); r.text = d_txt; r.font.bold = False; r.font.size = Pt(11.5); r.font.color.rgb = COLOR_WHITE
        p_item.space_after = Pt(8)

    # Cột 3: Audit Logs & Quyền riêng tư
    b3 = slide9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.8), Inches(1.35), card_w9, card_h9)
    set_shape_flat_color(b3, COLOR_CARD_BG, COLOR_PURPLE, 1.5)
    tb = slide9.shapes.add_textbox(Inches(8.95), Inches(1.5), card_w9 - Inches(0.3), card_h9 - Inches(0.3))
    tf = tb.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.text = "🛡️ AUDIT LOGS & AN TOÀN"; p.font.bold = True; p.font.size = Pt(14); p.font.color.rgb = COLOR_PURPLE
    p.space_after = Pt(10)

    audit_items = [
        ("Ghi vết hoạt động toàn diện", "Audit Logs ghi nhận mọi thao tác: Đăng nhập, Duyệt đơn VIP, Khóa user, Sửa Prompt AI kèm IP & mốc thời gian."),
        ("Mã hóa mật khẩu an toàn", "Sử dụng thuật toán Bcrypt Salt rounds tiêu chuẩn cao cho toàn bộ tài khoản."),
        ("Session Timeout 7 ngày", "Access Token JWT có thời hạn định kỳ, tự động thu hồi khi hết hạn hoặc khi user đăng xuất.")
    ]
    for h_txt, d_txt in audit_items:
        p_item = tf.add_paragraph()
        p_item.text = f"• {h_txt}: "
        p_item.font.bold = True; p_item.font.size = Pt(12); p_item.font.color.rgb = COLOR_EMERALD
        r = p_item.add_run(); r.text = d_txt; r.font.bold = False; r.font.size = Pt(11.5); r.font.color.rgb = COLOR_WHITE
        p_item.space_after = Pt(8)

    # =========================================================================
    # SLIDE 10: KẾ HOẠCH & KẾT QUẢ KIỂM THỬ HỆ THỐNG
    # =========================================================================
    slide10 = prs.slides.add_slide(prs.slide_layouts[6])
    create_background_decor(slide10, w, h, "04. KẾ HOẠCH & KẾT QUẢ KIỂM THỬ HỆ THỐNG (TEST CASES)")

    # Bảng 15 Ca kiểm thử trọng tâm & Kết quả
    table_card = slide10.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.35), w - Inches(1.6), Inches(5.6))
    set_shape_flat_color(table_card, COLOR_CARD_BG, COLOR_CARD_BORDER, 1.5)

    tb = slide10.shapes.add_textbox(Inches(1.1), Inches(1.5), w - Inches(2.2), Inches(5.2))
    tf = tb.text_frame; tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "🧪 KẾT QUẢ THỰC NGHIỆM 15 CA KIỂM THỬ TRỌNG TÂM (BLACK-BOX & UNIT TESTS)"
    p.font.bold = True; p.font.size = Pt(15); p.font.color.rgb = COLOR_CYAN
    p.space_after = Pt(10)

    test_groups = [
        ("Phân hệ Xác thực & Phân quyền (TC01 - TC03)", "Đăng ký, Đăng nhập JWT, Phân quyền Role-based (User / Mod / Admin), Khóa cứng tài khoản (Hard Lockout) -> KẾT QUẢ: PASS 100%"),
        ("Quản lý Ví & Sổ Giao dịch (TC04 - TC07)", "Tạo ví, nạp số dư, chuyển ví nội bộ, ghi thu/chi, bộ lọc đa tiêu chí, hoàn tiền tự động khi xóa giao dịch -> KẾT QUẢ: PASS 100%"),
        ("Hạn mức Ngân sách & Gamification (TC08 - TC10)", "Cảnh báo đổi màu ngưỡng 80% (Warning) & 100% (Overspent), tính điểm XP, cập nhật Level Road Map 6 bậc -> KẾT QUẢ: PASS 100%"),
        ("AI NLP Parser & Cố vấn 50/30/20 (TC11 - TC13)", "Bóc tách câu nói tự nhiên tiếng Việt, chẩn đoán sức khỏe dòng tiền, Zero-PII Guardrail từ chối xem dữ liệu người khác -> KẾT QUẢ: PASS 100%"),
        ("Cổng Nạp VietQR & Admin Control (TC14 - TC15)", "Sinh mã VietQR MB Bank chuẩn NAPAS 247, duyệt đơn VIP 1-Click, quản trị System Prompt và xuất CSV -> KẾT QUẢ: PASS 100%")
    ]

    for g_title, g_desc in test_groups:
        p_g = tf.add_paragraph()
        p_g.text = f"✅ {g_title}\n"
        p_g.font.bold = True; p_g.font.size = Pt(12.5); p_g.font.color.rgb = COLOR_EMERALD
        r = p_g.add_run(); r.text = f"   Chi tiết: {g_desc}"
        r.font.bold = False; r.font.size = Pt(11.5); r.font.color.rgb = COLOR_WHITE
        p_g.space_after = Pt(6)

    # Thống kê tổng hợp
    p_sum = tf.add_paragraph()
    p_sum.text = "📊 TỔNG HỢP: 15/15 Kịch Bản Kiểm Thử & 46/46 Bài Test Pytest Tự Động ĐẠT 100% PASS (0 Lỗi Nghiệp Vụ, Độ Trễ AI ~400ms - 600ms)."
    p_sum.font.bold = True; p_sum.font.size = Pt(12.5); p_sum.font.color.rgb = COLOR_GOLD

    # =========================================================================
    # SLIDE 11: TỔNG KẾT, HƯỚNG PHÁT TRIỂN & LỜI CẢM ƠN
    # =========================================================================
    slide11 = prs.slides.add_slide(prs.slide_layouts[6])
    create_background_decor(slide11, w, h, "05. TỔNG KẾT, HƯỚNG PHÁT TRIỂN & LỜI CẢM ƠN")

    card_w11 = Inches(5.6)
    card_h11 = Inches(5.6)

    # Cột 1: Kết quả & Hướng phát triển
    c1 = slide11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.35), card_w11, card_h11)
    set_shape_flat_color(c1, COLOR_CARD_BG, COLOR_CYAN, 1.5)
    tb1 = slide11.shapes.add_textbox(Inches(1.1), Inches(1.55), card_w11 - Inches(0.6), card_h11 - Inches(0.4))
    tf1 = tb1.text_frame; tf1.word_wrap = True

    p = tf1.paragraphs[0]; p.text = "🏆 KẾT QUẢ ĐẠT ĐƯỢC & HƯỚNG MỞ RỘNG"; p.font.bold = True; p.font.size = Pt(14); p.font.color.rgb = COLOR_CYAN
    p.space_after = Pt(12)

    conclusions = [
        ("Hoàn thành sản phẩm toàn diện", "Xây dựng thành công hệ thống Single Page Dark Cyber hiện đại, tích hợp trọn vẹn AI Google Gemini 1.5 Pro và kiến trúc Đa ví 2 tầng."),
        ("Giải quyết bài toán thực tế", "Giúp người dùng ghi chép chi tiêu trong vài giây, duy trì kỷ luật qua Gamification và được cố vấn dòng tiền 50/30/20."),
        ("Đóng gói ứng dụng Mobile (Flutter / React Native)", "Phát triển phiên bản di động hỗ trợ đồng bộ dữ liệu thời gian thực và thông báo đẩy Push Notification."),
        ("Tích hợp Vision AI (OCR Hóa Đơn)", "Tự động chụp và bóc tách hóa đơn VAT/siêu thị bằng mô hình Gemini Vision."),
        ("Kết nối Open Banking API Tự Động", "Tự động đồng bộ lịch sử giao dịch ngân hàng theo chuẩn Open Banking Việt Nam.")
    ]
    for h_txt, d_txt in conclusions:
        p_item = tf1.add_paragraph()
        p_item.text = f"• {h_txt}: "
        p_item.font.bold = True; p_item.font.size = Pt(12); p_item.font.color.rgb = COLOR_GOLD
        r = p_item.add_run(); r.text = d_txt; r.font.bold = False; r.font.size = Pt(11.5); r.font.color.rgb = COLOR_WHITE
        p_item.space_after = Pt(6)

    # Cột 2: Lời Cảm Ơn & Q&A
    c2 = slide11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.8), Inches(1.35), card_w11, card_h11)
    set_shape_flat_color(c2, COLOR_CARD_BG, COLOR_PURPLE, 1.5)
    tb2 = slide11.shapes.add_textbox(Inches(7.1), Inches(1.55), card_w11 - Inches(0.6), card_h11 - Inches(0.4))
    tf2 = tb2.text_frame; tf2.word_wrap = True

    p = tf2.paragraphs[0]; p.text = "💖 LỜI CẢM ƠN TỪ NHÓM 03"; p.font.bold = True; p.font.size = Pt(14); p.font.color.rgb = COLOR_PURPLE
    p.space_after = Pt(12)

    p_body = tf2.add_paragraph()
    p_body.text = "Nhóm 03 xin gửi lời cảm ơn chân thành và sâu sắc nhất đến:\n\n"
    p_body.font.size = Pt(12.5); p_body.font.color.rgb = COLOR_WHITE

    p_gv = tf2.add_paragraph()
    p_gv.text = "👩‍🏫 ThS. Hà Thị Thanh"
    p_gv.font.bold = True; p_gv.font.size = Pt(14); p_gv.font.color.rgb = COLOR_GOLD
    p_gv_sub = tf2.add_paragraph()
    p_gv_sub.text = "Giảng viên hướng dẫn học phần Ứng dụng Trí tuệ Nhân tạo, đã tận tình chỉ dẫn và định hướng chuyên môn quý báu cho nhóm trong suốt quá trình nghiên cứu và thực hiện đồ án."
    p_gv_sub.font.size = Pt(12); p_gv_sub.font.color.rgb = COLOR_GRAY
    p_gv_sub.space_after = Pt(16)

    p_qa = tf2.add_paragraph()
    p_qa.alignment = PP_ALIGN.CENTER
    p_qa.text = "🎉 XIN TRÂN TRỌNG CẢM ƠN!\nCHÚNG EM XIN SẴN SÀNG NHẬN CÂU HỎI & GÓP Ý TỪ HỘI ĐỒNG"
    p_qa.font.bold = True; p_qa.font.size = Pt(13.5); p_qa.font.color.rgb = COLOR_CYAN

    # Lưu file
    output_filename = "BaoCao_FinTrackAI_Demo.pptx"
    prs.save(output_filename)
    print(f"\n[FinTrack AI] ✅ ĐÃ TẠO THÀNH CÔNG FILE SLIDE THUYẾT TRÌNH: {output_filename}")
    print(f"Tổng số Slide: {len(prs.slides)} slides.")

if __name__ == "__main__":
    build_presentation()
