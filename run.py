#!/usr/bin/env python3
"""
FinTrack AI - Quick Startup Runner
Tự động kích hoạt môi trường ảo (venv), tự động giải phóng cổng máy chủ (port 8000),
và khởi chạy máy chủ web FinTrack AI mượt mà, không bao giờ bị nghẽn hay chờ host.
"""
import os
import sys
import socket
import subprocess
from pathlib import Path
import webbrowser
import threading
import time

# Force UTF-8 encoding on Windows console to prevent UnicodeEncodeError
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent

# Force current working directory and sys.path to project root
os.chdir(str(BASE_DIR))
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Check and auto-switch to venv python if running with global python
VENV_PYTHON_WIN = BASE_DIR / "venv" / "Scripts" / "python.exe"
VENV_PYTHON_UNIX = BASE_DIR / "venv" / "bin" / "python"

venv_python = None
if VENV_PYTHON_WIN.exists():
    venv_python = VENV_PYTHON_WIN
elif VENV_PYTHON_UNIX.exists():
    venv_python = VENV_PYTHON_UNIX

if venv_python and Path(sys.executable).resolve() != venv_python.resolve():
    print(f"[INFO] Đang chuyển sang môi trường ảo: {venv_python}")
    try:
        res = subprocess.run([str(venv_python)] + sys.argv, cwd=str(BASE_DIR))
        sys.exit(res.returncode)
    except Exception as e:
        print(f"Không thể khởi động qua venv: {e}")

# If we are here, we are running inside venv
os.chdir(str(BASE_DIR))
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

try:
    import uvicorn
except ImportError:
    print("[INFO] Đang cài đặt thư viện cần thiết từ requirements.txt...")
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", str(BASE_DIR / "requirements.txt")], cwd=str(BASE_DIR))
    import uvicorn

def is_port_in_use(host: str, port: int) -> bool:
    """Kiểm tra cổng hiện tại có đang bị chiếm dụng hay không."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.4)
        return s.connect_ex((host, port)) == 0

def release_port(port: int = 8000, host: str = "127.0.0.1") -> bool:
    """
    Tự động tìm và chấm dứt triệt để các tiến trình con/cũ đang chiếm giữ cổng port
    giúp người dùng không phải chờ đợi hoặc giải phóng cổng thủ công.
    """
    if not is_port_in_use(host, port):
        return True

    print(f"[⚡ TỰ ĐỘNG XỬ LÝ] Cổng {port} đang bị giữ bởi tiến trình cũ. Đang giải phóng cổng ngay...")
    current_pid = os.getpid()

    for _ in range(3):
        if not is_port_in_use(host, port):
            return True

        if sys.platform == "win32":
            try:
                res = subprocess.run(f'netstat -ano | findstr :{port}', shell=True, capture_output=True, text=True)
                lines = res.stdout.strip().splitlines()
                pids = set()
                for line in lines:
                    parts = line.strip().split()
                    if len(parts) >= 5 and f":{port}" in parts[1]:
                        pid = parts[-1]
                        if pid.isdigit() and int(pid) > 0 and int(pid) != current_pid:
                            pids.add(pid)

                for pid in pids:
                    try:
                        subprocess.run(f"taskkill /F /T /PID {pid}", shell=True, capture_output=True)
                    except Exception:
                        pass
            except Exception as e:
                print(f"[CẢNH BÁO] Không thể kill PID chiếm cổng {port}: {e}")
        else:
            try:
                subprocess.run(f"fuser -k {port}/tcp", shell=True, capture_output=True)
            except Exception:
                pass

        time.sleep(0.5)

    return not is_port_in_use(host, port)

def get_clean_port(preferred_port: int = 8000, host: str = "127.0.0.1") -> int:
    """Đảm bảo luôn luôn giải phóng và chạy trên cổng chính xác."""
    if release_port(preferred_port, host):
        return preferred_port

    # Trường hợp cổng 8000 bị khóa cứng bởi tiến trình hệ thống, chọn cổng kế tiếp
    for fallback_port in range(preferred_port + 1, preferred_port + 5):
        if release_port(fallback_port, host):
            print(f"[INFO] Đã chuyển sang cổng phụ khả dụng: {fallback_port}")
            return fallback_port
    return preferred_port

def open_browser_instantly(url: str, host: str, port: int):
    """Theo dõi khi máy chủ phản hồi thì tự động mở trình duyệt ngay lập tức."""
    start_time = time.time()
    while time.time() - start_time < 6.0:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(0.3)
                if s.connect_ex((host, port)) == 0:
                    time.sleep(0.3)
                    webbrowser.open(url)
                    return
        except Exception:
            pass
        time.sleep(0.15)
    try:
        webbrowser.open(url)
    except Exception:
        pass

if __name__ == "__main__":
    HOST = "127.0.0.1"
    PORT = get_clean_port(8000, HOST)
    URL = f"http://{HOST}:{PORT}"

    print("\n" + "="*72)
    print(f"🚀 FINTRACK AI SERVER ĐANG CHẠY TẠI:   {URL}")
    print(f"📚 SWAGGER API DOCS:                   {URL}/docs")
    print(f"🤖 TRÍ TUỆ NHÂN TẠO:                   Google Gemini (gemini-3.6-flash)")
    print(f"👤 TÀI KHOẢN MẪU (USER):               user@fintrack.ai  | Pass: User@123456")
    print(f"👑 TÀI KHOẢN ADMIN:                    admin@fintrack.ai | Pass: Admin@123456")
    print("="*72 + "\n")

    threading.Thread(target=open_browser_instantly, args=(URL, HOST, PORT), daemon=True).start()
    uvicorn.run("backend.app.main:app", host=HOST, port=PORT, app_dir=str(BASE_DIR), reload=True)
