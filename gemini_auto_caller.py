"""
==============================================================================
  GEMINI API AUTO-CALLER WITH FALLBACK & CHECKPOINTING
  Script tu dong goi Gemini API voi co che du phong va luu tien trinh
==============================================================================
  Phien ban: 1.0.0

  Huong dan cau hinh:
  1. Cai thu vien: pip install google-generativeai
  2. Dien API Key vao danh sach API_KEYS ben duoi
  3. Tuy chinh danh sach TASKS (tac vu dau vao)
  4. Chay: python gemini_auto_caller.py
==============================================================================
"""

import google.generativeai as genai
import json
import time
import os
import sys
from datetime import datetime

# ==============================================================================
# PHAN CAU HINH - CHINH SUA TAI DAY
# ==============================================================================

# Danh sach API Key (them nhieu key de tang kha nang du phong)
API_KEYS = [
    "AIzaSy_YOUR_FIRST_API_KEY_HERE",       # Key 1 (uu tien cao nhat)
    "AIzaSy_YOUR_SECOND_API_KEY_HERE",      # Key 2 (du phong)
    "AIzaSy_YOUR_THIRD_API_KEY_HERE",       # Key 3 (du phong)
]

# Danh sach model theo thu tu uu tien (model dau = nhanh nhat/re nhat)
MODELS = [
    "gemini-2.0-flash",           # Model chinh - nhanh, tiet kiem quota
    "gemini-2.0-flash-lite",      # Du phong 1 - nhe hon
    "gemini-1.5-flash",           # Du phong 2
    "gemini-1.5-pro",             # Du phong 3 - manh nhat
]

# ==============================================================================
# DANH SACH TAC VU DAU VAO
# ==============================================================================
# Moi phan tu la mot dict voi cac truong:
#   - "id"     : Ma dinh danh duy nhat (dung de tracking)
#   - "prompt" : Noi dung cau hoi / yeu cau gui den Gemini

TASKS = [
    {"id": "task_001", "prompt": "Giai thich khai niem Machine Learning bang tieng Viet trong 3 cau."},
    {"id": "task_002", "prompt": "Viet mot ham Python de tinh so Fibonacci."},
    {"id": "task_003", "prompt": "Liet ke 5 thanh pho lon nhat Viet Nam va dan so cua chung."},
    {"id": "task_004", "prompt": "Dich cau sau sang tieng Anh: Tri tue nhan tao dang thay doi the gioi."},
    {"id": "task_005", "prompt": "Giai thich su khac biet giua HTTP va HTTPS."},
    # Them tac vu cua ban vao day...
]

# ==============================================================================
# CAI DAT NANG CAO
# ==============================================================================

CHECKPOINT_FILE = "checkpoint.json"   # Ten file luu tien trinh
OUTPUT_FILE     = "results.json"      # Ten file luu ket qua dau ra
DELAY_BETWEEN_CALLS = 2.0             # Thoi gian nghi giua cac lan goi API (giay)
RETRY_DELAY_ON_ERROR = 30.0           # Thoi gian cho sau khi gap loi quota (giay)
MAX_RETRIES_PER_TASK = 3              # So lan thu lai toi da cho moi tac vu

# Cac tu khoa nhan dien loi gioi han han muc
QUOTA_ERROR_KEYWORDS = [
    "quota",
    "rate_limit",
    "rate limit",
    "resource_exhausted",
    "429",
    "resourceexhausted",
    "too many requests",
    "exceeded",
]

# ==============================================================================
# HELPER: MAU SAC LOG (ANSI Escape Codes)
# ==============================================================================

class Colors:
    RESET   = "\033[0m"
    BOLD    = "\033[1m"
    RED     = "\033[91m"
    GREEN   = "\033[92m"
    YELLOW  = "\033[93m"
    BLUE    = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN    = "\033[96m"
    WHITE   = "\033[97m"
    GRAY    = "\033[90m"

def enable_windows_ansi():
    """Kich hoat ANSI color tren Windows."""
    if sys.platform == "win32":
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
        except Exception:
            pass

def now() -> str:
    """Tra ve timestamp hien tai dang chuoi."""
    return datetime.now().strftime("%H:%M:%S")

def log(level: str, message: str):
    """In log co mau sac ra console."""
    colors = {
        "INFO"    : Colors.CYAN,
        "SUCCESS" : Colors.GREEN,
        "WARNING" : Colors.YELLOW,
        "ERROR"   : Colors.RED,
        "SWITCH"  : Colors.MAGENTA,
        "SAVE"    : Colors.BLUE,
        "RESTORE" : Colors.BLUE,
    }
    icons = {
        "INFO"    : "[i]",
        "SUCCESS" : "[OK]",
        "WARNING" : "[!]",
        "ERROR"   : "[X]",
        "SWITCH"  : "[>>]",
        "SAVE"    : "[S]",
        "RESTORE" : "[R]",
    }
    color   = colors.get(level, Colors.WHITE)
    icon    = icons.get(level, "*")
    ts      = f"{Colors.GRAY}[{now()}]{Colors.RESET}"
    lvl_str = f"{color}{Colors.BOLD}[{level}]{Colors.RESET}"
    print(f"{ts} {icon} {lvl_str} {message}")

def print_separator(char: str = "-", length: int = 70, color: str = Colors.GRAY):
    print(f"{color}{char * length}{Colors.RESET}")

def print_banner():
    """In banner khoi dong."""
    print_separator("=", 70, Colors.CYAN)
    print(f"{Colors.CYAN}{Colors.BOLD}  GEMINI API AUTO-CALLER v1.0{Colors.RESET}")
    print(f"{Colors.WHITE}  Fallback & Checkpointing System{Colors.RESET}")
    print_separator("=", 70, Colors.CYAN)
    print()

# ==============================================================================
# CHECKPOINT MANAGER
# ==============================================================================

class CheckpointManager:
    """Quan ly luu va khoi phuc tien trinh xu ly."""

    def __init__(self, checkpoint_file: str, output_file: str):
        self.checkpoint_file = checkpoint_file
        self.output_file     = output_file
        self.data = {
            "last_completed_index" : -1,
            "completed_task_ids"   : [],
            "total_tasks"          : 0,
            "started_at"           : None,
            "last_updated_at"      : None,
        }

    def load(self) -> int:
        """
        Doc file checkpoint neu ton tai.
        Tra ve index tiep theo can xu ly (0 neu bat dau moi).
        """
        if not os.path.exists(self.checkpoint_file):
            log("INFO", f"Khong tim thay checkpoint -- bat dau tu tac vu dau tien.")
            return 0

        try:
            with open(self.checkpoint_file, "r", encoding="utf-8") as f:
                self.data = json.load(f)

            last_idx = self.data.get("last_completed_index", -1)
            resume_from = last_idx + 1
            completed_count = len(self.data.get("completed_task_ids", []))

            print_separator()
            log("RESTORE", f"Da tim thay file checkpoint: {Colors.BOLD}{self.checkpoint_file}{Colors.RESET}")
            log("RESTORE", f"Tac vu da hoan thanh: {Colors.GREEN}{completed_count}{Colors.RESET}")
            log("RESTORE", f"Tiep tuc tu vi tri index: {Colors.YELLOW}{resume_from}{Colors.RESET}")
            print_separator()
            print()
            return resume_from

        except (json.JSONDecodeError, KeyError) as e:
            log("WARNING", f"File checkpoint bi loi ({e}). Bat dau lai tu dau.")
            return 0

    def save(self, current_index: int, task_id: str, total_tasks: int):
        """Luu tien trinh sau moi tac vu hoan thanh."""
        if self.data.get("started_at") is None:
            self.data["started_at"] = datetime.now().isoformat()

        self.data["last_completed_index"] = current_index
        self.data["total_tasks"]          = total_tasks
        self.data["last_updated_at"]      = datetime.now().isoformat()

        if task_id not in self.data["completed_task_ids"]:
            self.data["completed_task_ids"].append(task_id)

        try:
            with open(self.checkpoint_file, "w", encoding="utf-8") as f:
                json.dump(self.data, f, ensure_ascii=False, indent=2)
            log("SAVE", (
                f"Checkpoint da luu -> index {Colors.YELLOW}{current_index}{Colors.RESET} "
                f"({Colors.GREEN}{len(self.data['completed_task_ids'])}{Colors.RESET}"
                f"/{Colors.CYAN}{total_tasks}{Colors.RESET} tac vu)"
            ))
        except IOError as e:
            log("ERROR", f"Khong the luu checkpoint: {e}")

    def clear(self):
        """Xoa file checkpoint sau khi hoan tat toan bo."""
        if os.path.exists(self.checkpoint_file):
            os.remove(self.checkpoint_file)
            log("INFO", f"Da xoa file checkpoint (hoan tat toan bo tac vu).")


# ==============================================================================
# OUTPUT MANAGER
# ==============================================================================

class OutputManager:
    """Quan ly ghi ket qua ra file JSON."""

    def __init__(self, output_file: str):
        self.output_file = output_file
        self.results: list = []
        self._load_existing()

    def _load_existing(self):
        """Load ket qua cu neu da co file."""
        if os.path.exists(self.output_file):
            try:
                with open(self.output_file, "r", encoding="utf-8") as f:
                    self.results = json.load(f)
                log("INFO", f"Da load {len(self.results)} ket qua cu tu {self.output_file}")
            except Exception:
                self.results = []

    def append(self, task_id: str, prompt: str, response: str, model_used: str, key_index: int):
        """Them mot ket qua moi va ghi xuong file."""
        entry = {
            "task_id"    : task_id,
            "prompt"     : prompt,
            "response"   : response,
            "model_used" : model_used,
            "key_index"  : key_index,
            "timestamp"  : datetime.now().isoformat(),
        }
        self.results.append(entry)
        self._write()

    def _write(self):
        """Ghi toan bo ket qua xuong file."""
        try:
            with open(self.output_file, "w", encoding="utf-8") as f:
                json.dump(self.results, f, ensure_ascii=False, indent=2)
        except IOError as e:
            log("ERROR", f"Khong the ghi file ket qua: {e}")


# ==============================================================================
# GEMINI CLIENT VOI FALLBACK
# ==============================================================================

class GeminiClientWithFallback:
    """
    Gemini API client tu dong du phong:
      - Xoay vong API Key khi gap loi quota
      - Chuyen model khi toan bo key deu bi quota
    """

    def __init__(self, api_keys: list, models: list):
        # Loc bo key placeholder
        self.api_keys  = [k for k in api_keys if "YOUR" not in k and len(k) > 10]
        self.models    = models
        self.key_idx   = 0   # Index key hien tai
        self.model_idx = 0   # Index model hien tai

        if not self.api_keys:
            raise ValueError(
                "Khong tim thay API Key hop le. "
                "Vui long dien key vao danh sach API_KEYS trong script!"
            )

        self._configure_current()
        log("INFO", (
            f"Khoi tao client voi {Colors.CYAN}{len(self.api_keys)}{Colors.RESET} API Key, "
            f"{Colors.CYAN}{len(self.models)}{Colors.RESET} model."
        ))

    def _configure_current(self):
        """Cau hinh genai voi key va model hien tai."""
        genai.configure(api_key=self.api_keys[self.key_idx])
        self.model = genai.GenerativeModel(self.current_model_name)

    @property
    def current_key_display(self) -> str:
        key = self.api_keys[self.key_idx]
        return f"...{key[-6:]}"  # An key, chi hien 6 ky tu cuoi

    @property
    def current_model_name(self) -> str:
        return self.models[self.model_idx]

    def _is_quota_error(self, error: Exception) -> bool:
        """Kiem tra xem loi co phai do gioi han han muc khong."""
        err_str = str(error).lower()
        return any(kw in err_str for kw in QUOTA_ERROR_KEYWORDS)

    def _switch_key(self) -> bool:
        """
        Chuyen sang API Key tiep theo trong danh sach.
        Tra ve True neu chuyen thanh cong, False neu da het key.
        """
        next_key_idx = self.key_idx + 1
        if next_key_idx < len(self.api_keys):
            old_display = self.current_key_display
            self.key_idx = next_key_idx
            self._configure_current()
            log("SWITCH", (
                f"Chuyen API Key: {Colors.RED}{old_display}{Colors.RESET} -> "
                f"{Colors.GREEN}{self.current_key_display}{Colors.RESET} "
                f"(Key {self.key_idx + 1}/{len(self.api_keys)})"
            ))
            return True
        return False

    def _switch_model(self) -> bool:
        """
        Chuyen sang model tiep theo va reset ve key dau tien.
        Tra ve True neu thanh cong, False neu da het model.
        """
        next_model_idx = self.model_idx + 1
        if next_model_idx < len(self.models):
            old_model = self.current_model_name
            self.model_idx = next_model_idx
            self.key_idx   = 0  # Reset ve key dau tien khi doi model
            self._configure_current()
            log("SWITCH", (
                f"Chuyen Model: {Colors.RED}{old_model}{Colors.RESET} -> "
                f"{Colors.GREEN}{self.current_model_name}{Colors.RESET} | "
                f"Reset ve Key 1/{len(self.api_keys)}"
            ))
            return True
        return False

    def call_api(self, prompt: str) -> str:
        """
        Goi Gemini API voi co che tu dong du phong day du.
        Tu dong chuyen key/model khi gap loi quota.
        """
        retries_exhausted = 0

        while True:
            try:
                log("INFO", (
                    f"Goi API -> Model: {Colors.CYAN}{self.current_model_name}{Colors.RESET} | "
                    f"Key: {Colors.YELLOW}{self.current_key_display}{Colors.RESET}"
                ))
                response = self.model.generate_content(prompt)
                return response.text

            except Exception as e:
                if self._is_quota_error(e):
                    log("WARNING", f"Gap loi quota/rate-limit: {Colors.RED}{type(e).__name__}{Colors.RESET}")
                    log("WARNING", f"Chi tiet: {str(e)[:120]}...")

                    # Buoc 1: Thu chuyen key trong cung model
                    if self._switch_key():
                        log("INFO", f"Thu lai voi key moi sau {RETRY_DELAY_ON_ERROR}s...")
                        time.sleep(RETRY_DELAY_ON_ERROR)
                        continue

                    # Buoc 2: Da het key -> chuyen sang model tiep theo
                    log("WARNING", f"Da het API Key cho model {self.current_model_name}.")
                    if self._switch_model():
                        log("INFO", f"Thu lai voi model moi sau {RETRY_DELAY_ON_ERROR}s...")
                        time.sleep(RETRY_DELAY_ON_ERROR)
                        continue

                    # Buoc 3: Da het ca key lan model
                    log("ERROR", "Da het toan bo API Key va Model du phong! Khong the tiep tuc.")
                    raise RuntimeError("Exhausted all API keys and models.") from e

                else:
                    # Loi khac (network, content block, v.v.)
                    retries_exhausted += 1
                    log("ERROR", (
                        f"Loi khong phai quota: {Colors.RED}{type(e).__name__}: "
                        f"{str(e)[:100]}{Colors.RESET}"
                    ))
                    if retries_exhausted >= MAX_RETRIES_PER_TASK:
                        log("ERROR", f"Da thu {MAX_RETRIES_PER_TASK} lan -- bo qua tac vu nay.")
                        raise
                    log("INFO", f"Thu lai sau 5 giay (lan {retries_exhausted}/{MAX_RETRIES_PER_TASK})...")
                    time.sleep(5)


# ==============================================================================
# HAM CHINH
# ==============================================================================

def run_all_tasks(
    tasks: list,
    client: GeminiClientWithFallback,
    checkpoint_mgr: CheckpointManager,
    output_mgr: OutputManager,
):
    """Vong lap chinh de xu ly toan bo danh sach tac vu."""
    total = len(tasks)
    start_index = checkpoint_mgr.load()  # Lay vi tri tiep tuc

    if start_index >= total:
        log("SUCCESS", "Toan bo tac vu da duoc xu ly truoc do. Khong co gi de chay them!")
        return

    remaining = total - start_index
    log("INFO", (
        f"Bat dau xu ly {Colors.CYAN}{remaining}{Colors.RESET} tac vu con lai "
        f"(tu index {Colors.YELLOW}{start_index}{Colors.RESET} den "
        f"{Colors.YELLOW}{total - 1}{Colors.RESET})."
    ))
    print_separator()
    print()

    for i in range(start_index, total):
        task    = tasks[i]
        task_id = task.get("id", f"task_{i:04d}")
        prompt  = task.get("prompt", "")

        print_separator("-", 70, Colors.GRAY)
        log("INFO", (
            f"[{Colors.YELLOW}{i + 1}{Colors.RESET}/{Colors.CYAN}{total}{Colors.RESET}] "
            f"Xu ly: {Colors.BOLD}{task_id}{Colors.RESET}"
        ))
        log("INFO", f"Prompt: {Colors.WHITE}{prompt[:80]}{'...' if len(prompt) > 80 else ''}{Colors.RESET}")

        try:
            response_text = client.call_api(prompt)

            # Ghi ket qua
            output_mgr.append(
                task_id    = task_id,
                prompt     = prompt,
                response   = response_text,
                model_used = client.current_model_name,
                key_index  = client.key_idx,
            )

            # Luu checkpoint
            checkpoint_mgr.save(i, task_id, total)

            log("SUCCESS", (
                f"Hoan thanh {Colors.BOLD}{task_id}{Colors.RESET} | "
                f"Phan hoi: {Colors.GREEN}{len(response_text)}{Colors.RESET} ky tu"
            ))

            # Preview ngan phan hoi
            preview = response_text[:150].replace("\n", " ")
            if len(response_text) > 150:
                print(f"  {Colors.GRAY}-> {preview}...{Colors.RESET}")
            else:
                print(f"  {Colors.GRAY}-> {preview}{Colors.RESET}")

        except KeyboardInterrupt:
            print()
            log("WARNING", "Nguoi dung dung script (Ctrl+C). Checkpoint da duoc luu.")
            log("INFO", f"Chay lai script de tiep tuc tu tac vu: {Colors.YELLOW}{task_id}{Colors.RESET}")
            sys.exit(0)

        except RuntimeError as e:
            # Het quota toan bo
            log("ERROR", str(e))
            log("INFO", f"Checkpoint da luu tai index {i - 1}. Chay lai sau khi co quota.")
            sys.exit(1)

        except Exception as e:
            # Loi khong khac phuc duoc o tac vu nay -- bo qua va tiep tuc
            log("ERROR", f"Bo qua {task_id} do loi: {e}")
            checkpoint_mgr.save(i, task_id + "_SKIPPED", total)

        finally:
            # Nghi giua cac lan goi (tru tac vu cuoi)
            if i < total - 1:
                log("INFO", f"Nghi {DELAY_BETWEEN_CALLS}s truoc tac vu tiep theo...")
                time.sleep(DELAY_BETWEEN_CALLS)

    print()
    print_separator("=", 70, Colors.GREEN)
    log("SUCCESS", f"HOAN TAT TOAN BO {total} TAC VU!")
    log("INFO", f"Ket qua da luu tai: {Colors.CYAN}{Colors.BOLD}{OUTPUT_FILE}{Colors.RESET}")
    print_separator("=", 70, Colors.GREEN)

    # Xoa checkpoint sau khi hoan tat
    checkpoint_mgr.clear()


# ==============================================================================
# ENTRY POINT
# ==============================================================================

def main():
    enable_windows_ansi()
    print_banner()

    # Khoi tao cac thanh phan
    try:
        client         = GeminiClientWithFallback(API_KEYS, MODELS)
        checkpoint_mgr = CheckpointManager(CHECKPOINT_FILE, OUTPUT_FILE)
        output_mgr     = OutputManager(OUTPUT_FILE)
    except ValueError as e:
        log("ERROR", str(e))
        sys.exit(1)

    # Bat dau xu ly
    try:
        run_all_tasks(TASKS, client, checkpoint_mgr, output_mgr)
    except KeyboardInterrupt:
        print()
        log("WARNING", "Script bi dung. Tien trinh da duoc luu vao checkpoint.")
        sys.exit(0)


if __name__ == "__main__":
    main()
