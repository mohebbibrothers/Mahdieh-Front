# /// script
# requires-python = ">=3.12"
# dependencies = ["fonttools==4.67.0", "brotli==1.2.1"]
# ///
"""
ساخت بازتولیدپذیر فونت‌های وزیرمتن از بستهٔ رسمی npm (‎vazirmatn@33.0.3‎، مجوز OFL).

اجرا:  uv run scripts/build-fonts.py

خروجی در ‎src/shared/fonts/‎:
  · vazirmatn-variable.woff2      — صفحه (محور ‎wght‎ ۱۰۰–۹۰۰)
  · vazirmatn-print-{400..800}.woff2 — فقط چاپ/PDF گواهی

چرا نسخهٔ ایستا برای چاپ؟ موتور PDF کروم (Skia) فونت متغیر را به‌شکل Type3 جاسازی می‌کند؛
نمایشگرهای PDF (Edge، Acrobat، نمایشگر ویندوز) فاصله و اتصال حروف Type3 را به‌هم می‌ریزند
(«ا» چسبیده به حرف بعد). فونت ایستا به‌شکل TrueType/CID جاسازی می‌شود و همه‌جا درست است.

زیرمجموعه: لاتین پایه و نشانه‌های Latin-1 («» · ×)، فارسی/عربی رایج (ٱ، ۀ، اعراب)، نشانه‌گذاری عمومی
(— – … • فاصله‌های باریک و ZWNJ)، ﷲ و دایرهٔ نقطه‌چین — با همهٔ قابلیت‌های چیدمان (‎ss01‎، ‎tnum‎ …).
"""

from __future__ import annotations

import base64
import hashlib
import io
import tarfile
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

TARBALL = "https://registry.npmjs.org/vazirmatn/-/vazirmatn-33.0.3.tgz"
INTEGRITY = "sha512-fbjNc0CMjazZpIegWzz9OHGzI1APFboT+x7ZecXlUCtDe/nkyx7gtCTZnWS/+eeXG7fbfXymCPKJI8EsnM3iqw=="
OUT = Path(__file__).resolve().parent.parent / "src" / "shared" / "fonts"

UNICODES = [
    *range(0x0020, 0x007F),  # لاتین پایه
    *range(0x00A0, 0x00C0),  # نشانه‌های Latin-1: فاصلهٔ نشکن، « » · ° ©
    0x00D7, 0x00F7,  # × ÷
    # فارسی و عربی رایج (نه کل بلوک: حروف اردو/سندی/… فقط حجم می‌افزایند)
    0x060C, 0x061B, 0x061F, 0x066A, 0x066B, 0x066C,  # ، ؛ ؟ ٪ ٫ ٬
    *range(0x0621, 0x063B),  # ء تا غ
    *range(0x0640, 0x0656),  # ـ و حروف تا ی عربی، اعراب، همزهٔ بالا/پایین
    *range(0x0660, 0x066A),  # ارقام عربی
    0x0670, 0x0671, 0x0674,  # الف کوچک بالا، الف وصل (بسم‌الله)، همزهٔ بالا
    0x067E, 0x0686, 0x0698, 0x06A9, 0x06AF,  # پ چ ژ ک گ
    0x06C0, 0x06C1, 0x06CC, 0x06D5,  # ۀ ه‍ ی ە
    *range(0x06F0, 0x06FA),  # ارقام فارسی
    *range(0x2000, 0x2070),  # نشانه‌گذاری عمومی، ZWNJ/ZWJ، نشانه‌های جهت
    0x2212,  # منها
    0x25CC,  # دایرهٔ نقطه‌چین (نمایش اعراب تنها)
    0xFDF2,  # ﷲ
    0xFEFF,
]
STATIC = {400: "Regular", 500: "Medium", 600: "SemiBold", 700: "Bold", 800: "ExtraBold"}


def fetch() -> tarfile.TarFile:
    data = urllib.request.urlopen(TARBALL, timeout=60).read()
    algo, expected = INTEGRITY.split("-", 1)
    actual = base64.b64encode(hashlib.new(algo, data).digest()).decode()
    if actual != expected:
        raise SystemExit(f"اثرانگشت بستهٔ وزیرمتن نادرست است: {actual}")
    return tarfile.open(fileobj=io.BytesIO(data), mode="r:gz")


def build(src: bytes, out: Path) -> None:
    font = TTFont(io.BytesIO(src))
    options = subset.Options()
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.notdef_outline = True
    options.flavor = "woff2"
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=UNICODES)
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(out)
    print(f"✔ {out.name}: {out.stat().st_size / 1024:.1f}KB · {len(font.getBestCmap())} نویسه")


def main() -> None:
    tar = fetch()
    read = lambda name: tar.extractfile(f"package/fonts/webfonts/{name}.woff2").read()  # noqa: E731
    build(read("Vazirmatn[wght]"), OUT / "vazirmatn-variable.woff2")
    for weight, name in STATIC.items():
        build(read(f"Vazirmatn-{name}"), OUT / f"vazirmatn-print-{weight}.woff2")


if __name__ == "__main__":
    main()
