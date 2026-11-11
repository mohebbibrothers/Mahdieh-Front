#!/usr/bin/env bash
# نصب Chromium هم‌نسخهٔ Playwright به‌همراه کتابخانه‌های سیستمی، مقاوم در برابر قطعی گذرای
# آینهٔ اوبونتو/DNS روی اجراکننده‌های GitHub: مهلت کوتاهِ apt و تلاش دوباره با فاصلهٔ فزاینده.
set -uo pipefail

cat <<'CONF' | sudo tee /etc/apt/apt.conf.d/80-mahdieh-retries >/dev/null
Acquire::Retries "3";
Acquire::http::Timeout "20";
Acquire::https::Timeout "20";
CONF

for attempt in 1 2 3 4; do
  if pnpm exec playwright install --with-deps chromium; then
    exit 0
  fi
  echo "::warning::نصب Chromium در تلاش ${attempt} ناموفق بود؛ $((attempt * 30)) ثانیه بعد دوباره."
  sleep $((attempt * 30))
done
echo "::error::نصب Chromium پس از چهار تلاش ناموفق ماند."
exit 1
