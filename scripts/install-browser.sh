#!/usr/bin/env bash
# نصب Chromium هم‌نسخهٔ Playwright برای e2e — تاب‌آور در برابر قطعی شبکهٔ آرشیو اوبونتو.
#
# ۱۴۰۵/۰۸/۲۰ اجراکننده‌های GitHub ساعتی هیچ میزبانِ ubuntu.com را resolve نمی‌کردند و
# «playwright install --with-deps» تا سقف زمان شغل معطل می‌ماند. پس دو کار جدا شده است:
#   ۱) خودِ مرورگر از CDN مایکروسافت/Playwright (مستقل از اوبونتو) — شکستش یعنی شکست واقعی؛
#   ۲) کتابخانه‌های سیستمی با سقف زمانی؛ ایمیج اجراکننده تقریباً همه را از پیش دارد و تنها
#      فونت‌های تایلندی/چینی می‌مانند که آزمون‌های ما (با Vazirmatn خودمیزبان) به آن نیازی ندارند.
#      اگر آرشیو در دسترس نباشد هشدار ثبت می‌شود و درستیِ محیط را خودِ e2e می‌سنجد.
set -uo pipefail

for attempt in 1 2 3; do
  if pnpm exec playwright install chromium; then
    break
  fi
  if [[ "${attempt}" == 3 ]]; then
    echo "::error::دریافت Chromium پس از سه تلاش ناموفق ماند."
    exit 1
  fi
  echo "::warning::دریافت Chromium در تلاش ${attempt} ناموفق بود؛ $((attempt * 15)) ثانیه بعد دوباره."
  sleep $((attempt * 15))
done

cat <<'CONF' | sudo tee /etc/apt/apt.conf.d/80-mahdieh-network >/dev/null
Acquire::Retries "2";
Acquire::http::Timeout "15";
Acquire::https::Timeout "15";
CONF

if timeout --kill-after=15 300 pnpm exec playwright install-deps chromium; then
  echo "کتابخانه‌های سیستمی Chromium کامل است."
else
  echo "::warning::آرشیو اوبونتو در دسترس نبود؛ e2e با کتابخانه‌های ازپیش‌نصبِ ایمیج اجرا می‌شود."
fi
exit 0
