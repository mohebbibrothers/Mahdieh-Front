#!/usr/bin/env bash
# نصب Chromium هم‌نسخهٔ Playwright به‌همراه کتابخانه‌های سیستمی، مقاوم در برابر قطعی گذرای
# آینهٔ اوبونتو/DNS روی اجراکننده‌های GitHub: مهلت کوتاهِ apt و تلاش دوباره با فاصلهٔ فزاینده.
set -uo pipefail

cat <<'CONF' | sudo tee /etc/apt/apt.conf.d/80-mahdieh-retries >/dev/null
Acquire::Retries "3";
Acquire::http::Timeout "20";
Acquire::https::Timeout "20";
CONF

# security.ubuntu.com گاهی روی اجراکننده‌ها resolve نمی‌شود؛ شاخهٔ ‎-security‎ را از همان آینهٔ
# اصلیِ اجراکننده بخوان (archive همان بسته‌ها را دارد).
mirror="$(grep -rhoE 'https?://[a-z0-9.-]*archive\.ubuntu\.com/ubuntu/?' /etc/apt/sources.list /etc/apt/sources.list.d/ 2>/dev/null | head -n1 || true)"
mirror="${mirror:-http://archive.ubuntu.com/ubuntu/}"
for f in /etc/apt/sources.list /etc/apt/sources.list.d/*.list /etc/apt/sources.list.d/*.sources; do
  if [[ -f "${f}" ]]; then
    sudo sed -i -E "s#https?://security\.ubuntu\.com/ubuntu/?#${mirror}#g" "${f}"
  fi
done

for attempt in 1 2 3; do
  if pnpm exec playwright install --with-deps chromium; then
    exit 0
  fi
  echo "::warning::نصب Chromium در تلاش ${attempt} ناموفق بود؛ $((attempt * 20)) ثانیه بعد دوباره."
  sleep $((attempt * 20))
done
echo "::error::نصب Chromium پس از سه تلاش ناموفق ماند."
exit 1
