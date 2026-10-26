// ⚠ تولید خودکار از openapi/mahdieh.yaml با scripts/gen-api.mjs — دستی ویرایش نکنید.
export type paths = {
    "/api/v1/auth/csrf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * دریافت توکن CSRF
         * @description کوکی ``csrftoken`` را تنظیم می‌کند و همان توکن را برمی‌گرداند. فرانت آن را در هدر ``X-CSRFToken`` همهٔ درخواست‌های نوشتنی می‌فرستد. پاسخ کش نمی‌شود.
         */
        get: operations["auth_csrf_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * خروج از حساب
         * @description ابطال نشست جاری و پاک‌سازی کوکی.
         */
        post: operations["auth_logout_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/logout-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * خروج از همهٔ دستگاه‌ها
         * @description ابطال همهٔ نشست‌های دیگر و بستن نشست جاری.
         */
        post: operations["auth_logout_all_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/mfa/recovery-codes/regenerate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * ساخت دوبارهٔ کدهای بازیابی
         * @description ابطال کدهای قبلی و صدور ده کد تازه.
         */
        post: operations["auth_mfa_recovery_codes_regenerate_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/mfa/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * وضعیت تأیید دومرحله‌ای
         * @description وضعیت ثبت، تأیید نشست و پنجرهٔ تأیید تازه.
         */
        get: operations["auth_mfa_status_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/mfa/totp/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * فعال‌سازی اپ احراز هویت
         * @description کدهای بازیابی فقط در همین پاسخ برمی‌گردند؛ آن‌ها را جای امن نگه دارید.
         */
        post: operations["auth_mfa_totp_confirm_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/mfa/totp/setup": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * آغاز ثبت اپ احراز هویت
         * @description راز تازه و QR برمی‌گرداند؛ تا تأیید نخستین کد، دستگاه فعال نمی‌شود.
         */
        post: operations["auth_mfa_totp_setup_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/mfa/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * تأیید دومرحله‌ای
         * @description کد شش‌رقمی اپ یا یک کد بازیابی. پس از ۵ تلاش ناموفق، ۱۵ دقیقه قفل (``mfa_locked``). همین مسیر برای «تأیید تازه» پیش از کارهای پرخطر است.
         */
        post: operations["auth_mfa_verify_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/otp/request": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * درخواست کد یک‌بارمصرف
         * @description کد یک‌بارمصرف را به شمارهٔ داده‌شده پیامک می‌کند. پاسخ برای شماره‌های ثبت‌شده و ثبت‌نشده یکسان است (ضد شمارش کاربران).
         */
        post: operations["auth_otp_request_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/otp/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * تأیید کد و ورود
         * @description با تأیید کد، نشست کاربر باز می‌شود. اگر پروفایل کامل نباشد، ``next_step`` مقدار ``complete_profile`` می‌گیرد.
         */
        post: operations["auth_otp_verify_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/auth/session": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * وضعیت نشست
         * @description برای مهمان ``authenticated=false`` و ``profile=null``؛ هرگز ۴۰۱ نمی‌دهد.
         */
        get: operations["auth_session_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/blocks": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * فهرست بلوک‌ها در بازه
         * @description بازگرداندن بلوک‌های فعال هم‌پوشان با بازه.
         */
        get: operations["blocks_list"];
        put?: never;
        /**
         * ثبت بلوک نگهداری
         * @description دلیل اجباری است؛ دو بلوک هم‌پوشان روی یک واحد از سمت دیتابیس رد می‌شود.
         */
        post: operations["blocks_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/blocks/{block_id}/remove": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * برداشتن بلوک
         * @description حذف نرم بلوک با ثبت دلیل در حسابرسی.
         */
        post: operations["blocks_remove_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/calendar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * تقویم موجودی
         * @description برای هر روز، وضعیت هر نیم‌روز هر واحد را برمی‌گرداند: آزاد / اشغال / بافر نظافت / غیرقابل‌رزرو / گذشته.
         */
        get: operations["calendar_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/calendar/windows": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * کشف نخستین بازهٔ آزاد هر واحد
         * @description برای هر واحد فعال، زودترین ران پیوستهٔ نیم‌روزهای آزاد را در کل افق رزرو برمی‌گرداند (آغاز دست‌کم به‌اندازهٔ حداقل مهلت پیش از ورود پس از اکنون). واحدی که ظرفیتش از ``guests`` کمتر است ``fits_guests=false`` و بازهٔ تهی دارد.
         */
        get: operations["calendar_windows_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/certificates/verify-offline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * بازرسی آفلاین گواهی
         * @description مقایسهٔ زمان-ثابت کد کوتاه بازمحاسبه‌شده با کد چاپی.
         */
        post: operations["certificates_verify_offline_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/certificates/verify/{token}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * تأیید آنلاین گواهی اقامت
         * @description همیشه ۲۰۰ با ``valid`` برمی‌گرداند تا صفحهٔ فرانت هر سه حالت را روشن نشان دهد: معتبر، امضای نادرست/منقضی، یا ناهم‌خوان با سامانه.
         */
        get: operations["certificates_verify_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * پیکربندی فرانت (سیاست‌ها، شبکهٔ زمانی، برچسب‌ها، کشورها)
         * @description ساخت پیکربندی و پاسخ شرطی.
         */
        get: operations["config_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/feedback/{token}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * وضعیت فرم نظرسنجی
         * @description باز / ثبت‌شده / بسته (با دلیل) — به‌همراه برچسب‌های فرم.
         */
        get: operations["feedback_token_retrieve"];
        put?: never;
        /**
         * ثبت نظر زائر
         * @description اعتبارسنجی و ثبت یک‌بارهٔ نظر؛ پاسخ دوم ⇒ ۴۰۹.
         */
        post: operations["feedback_token_submit"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/help": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * میز راهنما
         * @description محتوای راهنما با نتیجهٔ جست‌وجو (در صورت وجود پرسش).
         */
        get: operations["help_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * پروفایل من
         * @description بازگرداندن نمای ایمن پروفایل کاربر جاری.
         */
        get: operations["me_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/calendar.ics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * تقویم همهٔ اقامت‌های پیش‌رو (ICS)
         * @description ICS رزروهای فعال آیندهٔ کاربر.
         */
        get: operations["me_calendar.ics_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * ثبت/ویرایش پروفایل
         * @description نام، نام خانوادگی، ملیت، استان، شهر و مدرک هویتی (کد ملی یا گذرنامه) را ثبت می‌کند. مدرک با AES-GCM رمزنگاری و ایندکس کور یکتا می‌شود (ضد حساب تکراری). همهٔ خطاها یک‌جا در ``errors`` (فیلدبه‌فیلد) برمی‌گردند.
         */
        patch: operations["me_profile_partial_update"];
        trace?: never;
    };
    "/api/v1/me/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * دستگاه‌های من
         * @description نشست‌های فعال کاربر، نشست جاری در صدر.
         */
        get: operations["me_sessions_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/sessions/{session_id}/revoke": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * خروج یک دستگاه
         * @description ابطال نشست انتخابی (نشست جاری با «خروج» بسته می‌شود).
         */
        post: operations["me_sessions_revoke_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me/standing": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * وضعیت توان رزرو من
         * @description پیش از نمایش دکمهٔ «رزرو» بپرسید: سهمیهٔ فعال/دوره‌ای/سالانه، خنک‌شدن پس از لغو دیرهنگام، محرومیت عدم‌حضور و تکمیل پروفایل — با همان کدهای پیش‌بینی رزرو.
         */
        get: operations["me_standing_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/meta": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * فرادادهٔ سرویس
         * @description نام سرویس، محیط، نسخهٔ قرارداد، منطقهٔ زمانی، امروزِ جلالی (با ارقام لاتین — قرارداد ماشینی) و — اگر در استقرار تنظیم شده باشد — اطلاعات تماس پذیرش. بدون احراز هویت و بی‌اثر بر داده.
         */
        get: operations["meta_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/occasions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * مناسبت‌های بازهٔ تاریخی
         * @description بازگرداندن مناسبت‌های بازه؛ پیش‌فرض شش ماه آینده.
         */
        get: operations["occasions_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/property": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * ساختار طبقات و واحدها
         * @description بازگرداندن طبقات با واحدهای فعال هر طبقه.
         */
        get: operations["property_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reservations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * رزروهای من
         * @description بازگرداندن رزروهای کاربر جاری در دامنهٔ درخواستی (مکان‌نما + شمارش).
         */
        get: operations["reservations_list"];
        put?: never;
        /**
         * ثبت رزرو
         * @description با ارسال هدر ``Idempotency-Key``، ارسال دوبارهٔ همان درخواست (ضربهٔ دوبارهٔ کاربر یا تلاش مجدد موبایل) رزرو دوم نمی‌سازد؛ همان پاسخ قبلی بازپخش می‌شود.
         */
        post: operations["reservations_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reservations/{code}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات رزرو
         * @description بازگرداندن یک رزرو با کنترل مالکیت.
         */
        get: operations["reservations_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * هماهنگی ورود (ساعت رسیدن، پلاک، یادداشت)
         * @description زائر پس از ثبت، ساعت تقریبی رسیدن، پلاک خودرو و یادداشت برای پذیرش را به‌روز می‌کند — فقط پیش از پذیرش حضوری (``details_editable``). اثری بر سانس و سهمیه ندارد؛ در تاریخچه رخداد «هماهنگی ورود» ثبت می‌شود. پس از پذیرش/لغو ⇒ ۴۰۹ ``details_locked``.
         */
        patch: operations["reservations_partial_update"];
        trace?: never;
    };
    "/api/v1/reservations/{code}/calendar.ics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * افزودن رزرو به تقویم (ICS)
         * @description ساخت ICS برای رزرو صاحب درخواست (یا هر رزرو برای کارکنان).
         */
        get: operations["reservations_calendar.ics_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reservations/{code}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * لغو رزرو
         * @description لغو رزرو کاربر (یا توسط کارکنان با دلیل اجباری).
         */
        post: operations["reservations_cancel_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reservations/{code}/cancel-preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * پیش‌نمایش لغو رزرو
         * @description رایگان یا دیرهنگام؛ و اگر دیرهنگام، تا کی رزرو تازه بسته می‌ماند.
         */
        get: operations["reservations_cancel_preview_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reservations/{code}/certificate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * گواهی اقامت
         * @description فقط برای رزروهای تأییدشده، پذیرش‌شده یا پایان‌یافته (لغوشده ⇒ ۴۰۹).
         */
        get: operations["reservations_certificate_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reservations/{code}/timeline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * تاریخچهٔ رزرو من
         * @description رخدادهای رزرو بدون نام کارمند، دلیل داخلی و یادداشت‌ها.
         */
        get: operations["reservations_timeline_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/reservations/quote": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * پیش‌بینی رزرو (سبد)
         * @description همهٔ دلایل رد + بازه‌های جایگزین را **پیش از** ثبت رزرو برمی‌گرداند.
         */
        post: operations["reservations_quote_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/guests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * دفتر زائران
         * @description فهرست صفحه‌بندی‌شدهٔ زائران با شمارش‌های خلاصه.
         */
        get: operations["staff_guests_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/guests/{guest_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * کارت زائر
         * @description مشخصات پوشانده + توان رزرو + آخرین رزروها.
         */
        get: operations["staff_guests_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/guests/{guest_id}/reveal-phone": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * نمایش شمارهٔ کامل زائر
         * @description اگر آخرین تأیید عامل دوم کهنه باشد ⇒ ۴۰۳ با کد ``step_up_required``؛ کلاینت کد تازه می‌گیرد (``auth/mfa/verify``) و دوباره می‌فرستد.
         */
        post: operations["staff_guests_reveal_phone_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/insights": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * داشبورد تحلیلی (کارکنان)
         * @description اشغال روزبه‌روز، روند، نقشهٔ حرارتی واحد×روز، فشار پیش‌رو و پیش‌بینی سادهٔ تقاضا. پنجرهٔ نامعتبر ⇒ ۴۲۲؛ بیش از حد مجاز به سقف سیاست بریده می‌شود.
         */
        get: operations["staff_insights_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/policies": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * فهرست سیاست‌ها (کارکنان)
         * @description همهٔ کلیدهای سیاست با مقدار مؤثر، پیش‌فرض، نوع، نسخه و آخرین تغییر. فرانت پنل کارکنان از همین پاسخ، جدول «قواعد اقامت» را می‌سازد.
         */
        get: operations["staff_policies_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/policies/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * خواندن یک سیاست (کارکنان)
         * @description مقدار مؤثر یک سیاست.
         */
        get: operations["staff_policies_retrieve"];
        put?: never;
        /**
         * تغییر یک سیاست (فقط مدیر)
         * @description نسخهٔ تازهٔ سیاست را منتشر می‌کند. **دلیل اجباری است** و در تاریخچهٔ حسابرسی ثبت می‌شود: هر تغییر سیاست باید قابل توضیح بماند.
         */
        post: operations["staff_policies_update"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/reports/reservations.xlsx": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * خروجی اکسل گزارش رزروها
         * @description یک کارپوشهٔ هفت‌برگی راست‌به‌چپ برمی‌گرداند: راهنما، رزروها، تقویم سانس‌ها، اشغال واحدها، آمار روزانه، کنش‌های کارکنان و پیامک‌ها. بیشترین بازه 366 روز است و هش فایل در هدر ``X-Report-SHA256`` می‌آید.
         */
        get: operations["staff_reports_reservations.xlsx_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/reports/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * خلاصهٔ گزارش (پیش‌نمایش)
         * @description جمع‌بندی مدیریتی بازه: شمار رزروها، نرخ اشغال و اثر انگشت محتوا.
         */
        get: operations["staff_reports_summary_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/reservations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * تابلوی رزروهای بازه
         * @description بازگرداندن رزروهای بازه برای پذیرش (صفحه‌بندی مکان‌نما).
         */
        get: operations["staff_reservations_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/reservations/{code}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات رزرو برای کارکنان
         * @description بازگرداندن یک رزرو با کد — بدون کنترل مالکیت (کارمند مجاز است).
         */
        get: operations["staff_reservations_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/reservations/{code}/{action_name}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * انتقال کارمندی رزرو (پذیرش / تخلیه / عدم‌حضور / یادداشت)
         * @description check-in: پذیرش (از چند ساعت پیش از آغاز اقامت باز است)؛ check-out: تخلیه؛ no-show: عدم‌حضور با یادداشت اجباری؛ note: ثبت یادداشت داخلی.
         */
        post: operations["staff_reservations_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/reservations/{code}/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * تاریخچهٔ رخدادهای رزرو
         * @description رخدادهای رزرو به ترتیب زمان، با عامل و دلیل.
         */
        get: operations["staff_reservations_events_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/reservations/{code}/move": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * جابه‌جایی رزرو
         * @description جانشین‌کردن رزرو فعلی با رزرو تازه روی واحد/بازهٔ دیگر.
         */
        post: operations["staff_reservations_move_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/reservations/create": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * ثبت رزرو تلفنی/حضوری
         * @description ساخت حساب در صورت نبود، سپس ثبت رزرو با منبع تلفنی/حضوری.
         */
        post: operations["staff_reservations_create_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/waitlist": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * کل صف (کارکنان)
         * @description صف کامل + پیشنهادهای باز + آمار — مبنای تصمیم میز پذیرش.
         */
        get: operations["staff_waitlist_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/units": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * فهرست واحدهای اقامتی
         * @description بازگرداندن پنج واحد زائرسرا با طبقه، ظرفیت و امکانات.
         */
        get: operations["units_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/units/{code}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * جزئیات واحد
         * @description بازگرداندن یک واحد با تصاویر و امکانات.
         */
        get: operations["units_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/waitlist": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * درخواست‌های در جریان من
         * @description درخواست‌های «در جریان» زائر (مکان‌نما + شمارش کل).
         */
        get: operations["waitlist_retrieve"];
        put?: never;
        /**
         * ثبت درخواست انتظار
         * @description برای بازه‌ای که پُر است، نوبت می‌گیرید. ``unit_code`` تهی ⇒ آمادگی برای هر واحد آزادی در آن بازه. نوبت‌ها بر پایهٔ زمان ثبت و بدون پرش‌زدن رعایت می‌شوند.
         */
        post: operations["waitlist_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/waitlist/{entry_id}/withdraw": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * انصراف از نوبت
         * @description درخواست را می‌بندد و نوبت را به‌ترتیب به نفر بعدی می‌دهد.
         */
        post: operations["waitlist_withdraw_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/waitlist/offers/{offer_id}/respond": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * پاسخ به پیشنهاد سانس
         * @description پیشنهاد سانس آزادشده را می‌پذیرید (رزرو ساخته می‌شود) یا رد می‌کنید (سانس به نفر بعدی می‌رسد). مهلت پاسخ محدود است؛ پیشنهاد منقضی ⇒ ۴۰۹.
         */
        post: operations["waitlist_offers_respond_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/waitlist/offers/by-token/{token}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * پیشنهاد سانس از روی پیوند پیامک
         * @description اعتبارسنجی توکن و بازگرداندن پیشنهاد صاحب پیوند.
         */
        get: operations["waitlist_offers_by_token_retrieve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
};
export type webhooks = Record<string, never>;
export type components = {
    schemas: {
        /** @description یک بازهٔ جایگزین پیشنهادی وقتی بازهٔ درخواستی اشغال است. */
        Alternative: {
            date_jalali: string;
            /** Format: date-time */
            end: string;
            floor_number: number;
            is_same_unit: boolean;
            /** Format: date-time */
            start: string;
            unit_code: string;
            unit_title: string;
        };
        /**
         * @description نمایش بلوک نگهداری — برای پنل کارکنان (دلیل در تقویم عمومی نمی‌آید).
         *
         *     ``period`` صریح و ساخت‌یافته است (``{"start", "end"}``) نه رشتهٔ JSON فرارکرده؛
         *     تایپ‌های کلاینت فرانت باید مستقیم از سند OpenAPI ساخته شوند.
         */
        Block: {
            /**
             * زمان ایجاد
             * Format: date-time
             */
            readonly created_at: string;
            /**
             * شناسه
             * Format: uuid
             * @description شناسهٔ UUIDv7 — مرتب با زمان و غیرقابل‌حدس
             */
            readonly id: string;
            /**
             * نوع بلوک
             * @description * `maintenance` - تعمیر و نگهداری
             *     * `cleaning` - نظافت اساسی
             *     * `event` - رویداد / مأموریت
             *     * `admin` - تصمیم مدیریتی
             * @enum {string}
             */
            kind: "maintenance" | "cleaning" | "event" | "admin";
            readonly period: {
                /** Format: date-time */
                end: string | null;
                /** Format: date-time */
                start: string | null;
            };
            /**
             * دلیل
             * @description اجباری؛ در تقویم عمومی به‌صورت برچسب نشان داده می‌شود.
             */
            reason: string;
            readonly unit_code: string;
        };
        /** @description ورودی ثبت بلوک نگهداری توسط کارکنان (دلیل اجباری). */
        BlockCreateRequest: {
            /**
             * Format: date-time
             * @description پایان بلوک (ISO 8601)
             */
            end: string;
            kind: string;
            reason: string;
            /**
             * Format: date-time
             * @description آغاز بلوک (ISO 8601)
             */
            start: string;
            /** @description تهی ⇒ بلوک سراسری */
            unit_code?: string;
        };
        /** @description پاسخ تقویم — روزها + فرادادهٔ سیاست. */
        Calendar: {
            days: components["schemas"]["CalendarDay"][];
            horizon_days: number;
            lattice: {
                [key: string]: number;
            };
            max_cells: number;
            min_cells: number;
        };
        /** @description وضعیت یک نیم‌روز روی یک واحد. */
        CalendarCell: {
            detail: string;
            /** Format: date-time */
            end: string;
            index: number;
            kind: string;
            label: string;
            /** Format: date-time */
            start: string;
            status: string;
        };
        /** @description یک شبانه‌روز از تقویم موجودی. */
        CalendarDay: {
            date_jalali: string;
            /** Format: date */
            day: string;
            demand_level: string;
            free_cells: number;
            is_weekend: boolean;
            /** Format: double */
            occupancy_rate: number;
            total_cells: number;
            units: components["schemas"]["CalendarUnit"][];
            weekday: string;
        };
        /** @description وضعیت یک واحد در یک روز. */
        CalendarUnit: {
            capacity_total: number;
            cells: components["schemas"]["CalendarCell"][];
            code: string;
            floor_number: number;
            title: string;
            unit_type: string;
        };
        /** @description پاسخ کشف بازه — مرزهای جست‌وجو + ردیف هر واحد. */
        CalendarWindows: {
            guests: number;
            /** Format: date-time */
            horizon_end: string;
            max_cells: number;
            min_cells: number;
            /** Format: date-time */
            not_before: string;
            units: components["schemas"]["UnitWindow"][];
        };
        /** @description پیامد لغو در همین لحظه (سند). */
        CancelPreview: {
            cancellable: boolean;
            cooldown_hours: number;
            /** Format: date-time */
            cooldown_until: string | null;
            /** Format: date-time */
            free_until: string;
            late: boolean;
            message: string;
        };
        /** @description ورودی لغو رزرو. */
        CancelRequest: {
            reason?: string;
            /** @default guest_request */
            reason_kind: string;
        };
        /** @description گواهی اقامت قابل‌چاپ (سند). */
        Certificate: {
            code: string;
            fields: components["schemas"]["CertificateField"][];
            holder: string;
            issued_on: string;
            /** Format: uri */
            offline_check_url: string;
            /** @description SVG درون‌خطی (بدون اعلان XML) */
            qr_svg: string;
            short_code: string;
            /** Format: uri */
            verify_url: string;
        };
        /** @description یک سطر گواهی: برچسب و مقدار. */
        CertificateField: {
            label: string;
            value: string;
        };
        /** @description نتیجهٔ تأیید آنلاین گواهی (سند). */
        CertificateVerification: {
            /** Format: date-time */
            checked_at: string;
            crypto_valid: boolean;
            error: string;
            mismatch: boolean;
            payload: {
                [key: string]: unknown;
            };
            reservation_status: string | null;
            valid: boolean;
        };
        /** @description پاسخ پیکربندی فرانت (سند؛ زیرساختارها ``object`` تعریف شده‌اند). */
        Config: {
            auth: {
                [key: string]: number;
            };
            countries: {
                [key: string]: unknown;
            }[];
            features: {
                [key: string]: boolean;
            };
            labels: {
                [key: string]: unknown;
            };
            lattice: {
                [key: string]: number;
            };
            policies: {
                [key: string]: unknown;
            }[];
            provinces: {
                [key: string]: unknown;
            }[];
            schema_version: number;
            site: {
                [key: string]: unknown;
            };
            status_groups: {
                [key: string]: unknown;
            };
            units: {
                [key: string]: unknown;
            }[];
        };
        /**
         * @description اطلاعات تماس پذیرش — **اختیاری** و فقط برای نمایش.
         *
         *     چرا در پاسخ سرویس است و در پایگاه‌داده نه؟ چون دادهٔ کسب‌وکار نیست: یک
         *     مقدار استقرار است که فرانت می‌تواند نسخهٔ خودش را داشته باشد. دادنش از یک
         *     نقطه (بک‌اند) باعث می‌شود صفحهٔ راهنما، نمونه‌های SSR و فرانت **واگرا نشوند**.
         *     اگر خالی باشد، پاسخ ``null`` می‌دهد تا فرانت بداند «بک‌اند نسخه‌ای منتشر
         *     نکرده» — نه این‌که رشتهٔ خالی را شمارهٔ تلفن بپندارد.
         */
        Contact: {
            /** @description نشانی زائرسرا (متن فارسی) */
            address: string;
            /** @description شمارهٔ پذیرش (ارقام لاتین، خالی‌پذیر) */
            phone: string;
        };
        /** @description توکن CSRF برای نوشتن‌های فرانت (کوکی هم‌زمان تنظیم می‌شود). */
        Csrf: {
            cookie_name: string;
            csrf_token: string;
            /** @description نام هدری که توکن باید در آن بیاید */
            header_name: string;
        };
        /** @description وضعیت نظرسنجی یک اقامت (سند). */
        FeedbackState: {
            comment_max_length: number;
            rating_labels: {
                [key: string]: string;
            };
            reason: string;
            reservation: {
                [key: string]: unknown;
            };
            /**
             * @description * `open` - open
             *     * `submitted` - submitted
             *     * `closed` - closed
             * @enum {string}
             */
            state: "open" | "submitted" | "closed";
            submitted: {
                [key: string]: unknown;
            } | null;
            subscores: {
                [key: string]: unknown;
            }[];
        };
        /** @description بدنهٔ ثبت نظر — امتیاز کلی اجباری، بقیه اختیاری. */
        FeedbackSubmitRequest: {
            comment?: string;
            rating: number;
            /** @description زیرامتیازها: cleanliness, hospitality, facilities, comfort */
            scores?: {
                [key: string]: number | null;
            };
            would_recommend?: boolean | null;
        };
        /** @description نمایش طبقه با واحدهای فعال آن. */
        Floor: {
            /** نکات دسترسی */
            accessibility_notes?: string;
            /** توضیح */
            description?: string;
            /** شمارهٔ طبقه */
            number: number;
            /** عنوان */
            title: string;
            readonly units: components["schemas"]["Unit"][];
        };
        /** @description یک روز از پیش‌بینی تقاضا — میانگین متحرک روزِ هفته، با شفافیت نمونه. */
        ForecastRow: {
            /** @description بالا/پایین — بر پایهٔ تعداد نمونه */
            confidence: string;
            date_jalali: string;
            /** Format: date */
            day: string;
            /** Format: double */
            expected_occupancy: number;
            samples: number;
            weekday: string;
        };
        /** @description نخستین ران پیوستهٔ آزاد یک واحد (کشف بازه). */
        FreeWindow: {
            /** @description بلندترین اقامت مجاز از همین آغاز */
            bookable_cells: number;
            /** @description طول کامل ران آزاد (نیم‌روز) */
            cells: number;
            date_jalali: string;
            /** Format: date */
            day: string;
            /** Format: date-time */
            end: string;
            /** @description ران تا پایان افق جست‌وجو ادامه دارد */
            open_ended: boolean;
            /**
             * @description * `day` - day
             *     * `night` - night
             * @enum {string}
             */
            period: "day" | "night";
            /** Format: date-time */
            start: string;
            start_label: string;
            stay_label: string;
            weekday: string;
        };
        /** @description کارت زائر: مشخصات پوشانده، وضعیت توان رزرو و رزروهای اخیر (سند). */
        GuestDetail: {
            guest: components["schemas"]["GuestRow"];
            id_document_type: string;
            national_id_masked: string;
            recent_reservations: components["schemas"]["StaffReservation"][];
            standing: components["schemas"]["Standing"];
        };
        /** @description پوشش فهرست زائران (سند). */
        GuestList: {
            meta: components["schemas"]["PageMeta"];
            results: components["schemas"]["GuestRow"][];
        };
        /** @description یک سطر دفتر زائران — بدون هیچ دادهٔ روشن حساس. */
        GuestRow: {
            city: string;
            /** Format: date-time */
            date_joined: string;
            display_name: string;
            /** Format: uuid */
            id: string;
            is_profile_complete: boolean;
            /** Format: date-time */
            last_stay_end: string | null;
            nationality: string;
            /** @description نام فارسی کشور. */
            readonly nationality_title: string;
            no_show_count: number;
            phone_masked: string;
            /** @description نام فارسی استان (برای زائر ایرانی). */
            readonly province_title: string;
            reservations_count: number;
        };
        /** @description پاسخ میز راهنما (سند). */
        Help: {
            categories: {
                [key: string]: unknown;
            }[];
            contact: {
                [key: string]: string;
            };
            matches: {
                [key: string]: unknown;
            }[];
            note: string;
            query: string;
            quick_steps: {
                [key: string]: unknown;
            }[];
        };
        /** @description کل پاسخ ``GET /api/v1/staff/insights``. */
        Insights: {
            busiest: components["schemas"]["RankedDay"] | null;
            days: number;
            /**
             * Format: date
             * @description پایان پنجرهٔ تحلیل
             */
            end: string;
            /** Format: double */
            first_half: number;
            forecast: components["schemas"]["ForecastRow"][];
            free_cells: number;
            fully_free_days: string[];
            /**
             * Format: double
             * @description نرخ اشغال کل پنجره (۰ تا ۱)
             */
            occupancy: number;
            occupied_cells: number;
            planning: components["schemas"]["Planning"];
            points: components["schemas"]["OccupancyPoint"][];
            pressure: components["schemas"]["Pressure"];
            quietest: components["schemas"]["RankedDay"] | null;
            /** Format: double */
            second_half: number;
            /**
             * Format: date
             * @description آغاز پنجرهٔ تحلیل
             */
            start: string;
            total_cells: number;
            /**
             * Format: double
             * @description اختلاف نیمهٔ دوم و اول (مثبت ⇒ روبه‌رشد)
             */
            trend: number;
        };
        /** @description بدنهٔ ثبت درخواست انتظار. */
        JoinRequest: {
            /**
             * Format: date-time
             * @description پایان بازهٔ دلخواه (ISO 8601)
             */
            end: string;
            guests_count: number;
            note?: string;
            /**
             * Format: date-time
             * @description آغاز بازهٔ دلخواه (ISO 8601)
             */
            start: string;
            unit_code?: string;
        };
        /** @description فرادادهٔ سرویس — برای پایش و بررسی نسخه توسط تیم پشتیبانی و فرانت. */
        Meta: {
            /** @description اطلاعات تماس پذیرش (اگر در استقرار تنظیم شده باشد؛ وگرنه null) */
            contact?: components["schemas"]["Contact"] | null;
            /** @description محیط اجرا: development/staging/production */
            environment: string;
            /** @description نسخهٔ قرارداد API (نسخه‌بندی مسیر) */
            schema_version: string;
            /** @description نام سرویس (برای هم‌خوانی با ردیابی) */
            service: string;
            /** @description منطقهٔ زمانی سرویس (ذخیرهٔ UTC، نمایش محلی) */
            timezone: string;
            /** @description امروزِ تقویم جلالی — همیشه با ارقام لاتین */
            today_jalali: string;
        };
        /** @description کد شش‌رقمی اپ احراز هویت یا کد بازیابی ``XXXXX-XXXXX``. */
        MfaCodeRequest: {
            code: string;
        };
        /** @description نتیجهٔ فعال‌سازی: کدهای بازیابی (یک‌بار) + وضعیت تازه. */
        MfaConfirmResult: {
            recovery_codes: string[];
            status: components["schemas"]["MfaStatus"];
        };
        /** @description دادهٔ ثبت عامل دوم — فقط همین یک بار برمی‌گردد. */
        MfaEnrollment: {
            otpauth_uri: string;
            /** @description QR به‌شکل SVG درون‌خطی */
            qr_svg: string;
            /** @description راز Base32 برای ورود دستی */
            secret: string;
            /** @description همان راز در گروه‌های چهارتایی */
            secret_display: string;
        };
        /** @description وضعیت عامل دوم نشست جاری. */
        MfaStatus: {
            enrolled: boolean;
            method: string;
            recovery_codes_remaining: number;
            /** @description آیا این حساب مشمول عامل دوم است؟ */
            required: boolean;
            step_up_seconds: number;
            /**
             * Format: date-time
             * @description تا این لحظه، کارهای پرخطر بدون تأیید دوباره مجازند
             */
            step_up_valid_until: string | null;
            /** @description آیا همین نشست تأیید شده است؟ */
            verified: boolean;
            /** Format: date-time */
            verified_at: string | null;
        };
        /** @description نتیجهٔ تأیید: روش استفاده‌شده + وضعیت تازه. */
        MfaVerifyResult: {
            /**
             * @description * `totp` - totp
             *     * `recovery` - recovery
             * @enum {string}
             */
            method: "totp" | "recovery";
            status: components["schemas"]["MfaStatus"];
        };
        /** @description ورودی جابه‌جایی رزرو توسط کارکنان. */
        MoveRequest: {
            /** Format: date-time */
            end: string;
            expected_version?: number | null;
            reason: string;
            /** Format: date-time */
            start: string;
            unit_code: string;
        };
        /** @description نمایش مناسبت برای رنگ‌آمیزی تقویم. */
        Occasion: {
            /**
             * تاریخ میلادی
             * Format: date
             */
            date_gregorian: string;
            /** تاریخ جلالی */
            date_jalali?: string;
            /**
             * سطح تقاضا
             * @description * `normal` - عادی
             *     * `high` - پرتقاضا
             *     * `peak` - اوج
             * @enum {string}
             */
            demand_level?: "normal" | "high" | "peak";
            /** توضیح */
            description?: string;
            /** تاریخ قمری */
            hijri_date?: string;
            /**
             * شناسه
             * Format: uuid
             * @description شناسهٔ UUIDv7 — مرتب با زمان و غیرقابل‌حدس
             */
            readonly id: string;
            /** تعطیل رسمی */
            is_holiday?: boolean;
            readonly is_peak: boolean;
            /**
             * تاریخ تقریبی
             * @description ماه قمری هنوز در تقویم رسمی نیامده؛ تاریخ برآورد نجومی است
             */
            is_provisional?: boolean;
            /**
             * نوع
             * @description * `holiday` - تعطیل رسمی
             *     * `religious` - مناسبت مذهبی
             *     * `seasonal` - اوج فصلی
             *     * `custom` - سفارشی
             * @enum {string}
             */
            kind: "holiday" | "religious" | "seasonal" | "custom";
            /**
             * منبع
             * @description * `manual` - ورود دستی
             *     * `official` - تقویم رسمی کشور
             * @enum {string}
             */
            source?: "manual" | "official";
            /** عنوان */
            title: string;
        };
        /** @description یک روز از سری اشغال. */
        OccupancyPoint: {
            /** @description همان روز، جلالی و خوانا */
            date_jalali: string;
            /**
             * Format: date
             * @description روز میلادی (ISO)
             */
            day: string;
            /** @description سانی‌های آزاد */
            free_cells: number;
            /** @description سانی‌های اشغال‌شده */
            occupied_cells: number;
            /**
             * Format: double
             * @description نرخ اشغال این روز (۰ تا ۱)
             */
            rate: number;
            /** @description وضعیت روز: free/tight/busy/… */
            state: string;
            /** @description کل سانی‌های روز (واحد × سانی) */
            total_cells: number;
            /** @description نام روز هفته */
            weekday: string;
        };
        /** @description پاسخ پذیرش پیشنهاد: خود پیشنهاد + رزرو ساخته‌شده (فقط برای سند). */
        OfferAccepted: {
            offer: components["schemas"]["SlotOffer"];
            reservation_code: string;
            /** Format: uuid */
            reservation_id: string;
        };
        /** @description بدنهٔ پاسخ به پیشنهاد. */
        OfferActionRequest: {
            reason_kind?: string;
        };
        /** @description پیشنهاد سانس با جزئیات نمایشی — برای صفحهٔ پیوند پیامکی. */
        OfferDetail: {
            readonly action: string;
            /** Format: date-time */
            readonly ends_at: string;
            /** Format: uuid */
            readonly entry_id: string;
            /** Format: date-time */
            readonly expires_at: string;
            readonly guests_count: number;
            /** Format: uuid */
            readonly id: string;
            readonly is_open: boolean;
            readonly seconds_left: number;
            /** Format: date-time */
            readonly starts_at: string;
            readonly status: string;
            readonly unit_code: string;
            readonly unit_title: string;
        };
        /**
         * @description بدنهٔ پاسخ به پیشنهاد: ``accept`` یا ``decline`` با دلیل اختیاری.
         *
         *     ``action`` عمداً ``CharField`` است و نه ``ChoiceField``: کنش ناشناخته باید
         *     مانند گذشته ``۴۰۹`` با کد ``bad_action`` برگرداند (قرارداد خطای یکسان)، نه
         *     ``۴۲۲`` عمومی سریالایزر.
         */
        OfferRespondRequest: {
            /** @description accept (پیش‌فرض) یا decline */
            action?: string;
            reason_kind?: string;
        };
        /** @description فیلدهای روی گواهی چاپی + کد کوتاه. */
        OfflineCheckRequest: {
            code: string;
            ends: string;
            floor: number;
            guests: number;
            holder: string;
            short_code: string;
            starts: string;
            unit: string;
        };
        /** @description نتیجهٔ بازرسی آفلاین. */
        OfflineCheckResult: {
            valid: boolean;
        };
        /** @description ورودی درخواست کد ورود. */
        OtpRequestRequest: {
            /** @description شمارهٔ تلفن همراه؛ قالب‌های ۰۹…، ۹…، +۹۸… و ارقام فارسی پذیرفته می‌شود. */
            phone: string;
        };
        /** @description پاسخ درخواست کد — یکسان برای همهٔ شماره‌ها (ضد شمارش کاربران). */
        OtpRequestResult: {
            /** @description سرنوشت پیامک در دفتر تحویل */
            delivery_status: string;
            /** @description مدت اعتبار کد به ثانیه */
            expires_in: number;
            /** @description زمان انتظار تا درخواست کد تازه (ثانیه) */
            resend_after: number;
        };
        /** @description ورودی تأیید کد یک‌بارمصرف. */
        OtpVerifyRequest: {
            /** @description کد یک‌بارمصرف ارسال‌شده با پیامک */
            code: string;
            phone: string;
        };
        /**
         * @description فرادادهٔ صفحه‌بندی مکان‌نما — بخش ``meta`` هر پاسخ فهرست.
         *
         *     ``total`` فقط در فهرست‌های کاربرمحور می‌آید؛ نبودنش یعنی «شمارش کل را
         *     نخواستیم چون گران است»، نه «صفر».
         */
        PageMeta: {
            /** @description نشانی صفحهٔ بعد (یا null) */
            next: string | null;
            /** @description اندازهٔ صفحهٔ همین پاسخ */
            page_size: number;
            /** @description نشانی صفحهٔ قبل (یا null) */
            previous: string | null;
            /** @description شمارش کل (فقط فهرست‌های کاربرمحور) */
            total?: number;
        };
        /**
         * @description ورودی تکمیل/ویرایش پروفایل — تبعهٔ ایران یا زائر خارجی (ADR-0019).
         *
         *     قواعد وابسته به ملیت (کد ملی/استان برای ایران، گذرنامه برای خارجی) در سرویس
         *     دامنه سنجیده می‌شوند تا همهٔ خطاها یک‌جا و فیلدبه‌فیلد برگردند.
         */
        PatchedProfileUpdateRequest: {
            /** @default  */
            city: string;
            /** @default  */
            first_name: string;
            /** @default  */
            last_name: string;
            /**
             * @description کد ملی ۱۰ رقمی (اتباع ایران)؛ رمزنگاری‌شده ذخیره می‌شود. در ویرایش پروفایل کامل، خالی = همان کد ملی ثبت‌شده نگه داشته می‌شود.
             * @default
             */
            national_id: string;
            /**
             * @description کد کشور ISO 3166-1 alpha-2 (فهرست در /api/v1/config)؛ پیش‌فرض IR.
             * @default IR
             */
            nationality: string;
            /**
             * @description شمارهٔ گذرنامه (زائر خارجی)؛ رمزنگاری‌شده ذخیره می‌شود. در ویرایش با همان ملیت، خالی = همان گذرنامهٔ ثبت‌شده نگه داشته می‌شود.
             * @default
             */
            passport_number: string;
            /**
             * @description برای اتباع ایران الزامی؛ برای زائر خارجی نادیده گرفته می‌شود.
             *
             *     * `tehran` - تهران
             *     * `alborz` - البرز
             *     * `ardabil` - اردبیل
             *     * `isfahan` - اصفهان
             *     * `ilam` - ایلام
             *     * `bushehr` - بوشهر
             *     * `chaharmahal` - چهارمحال و بختیاری
             *     * `khorasan_south` - خراسان جنوبی
             *     * `khorasan_razavi` - خراسان رضوی
             *     * `khorasan_north` - خراسان شمالی
             *     * `khuzestan` - خوزستان
             *     * `zanjan` - زنجان
             *     * `semnan` - سمنان
             *     * `sistan` - سیستان و بلوچستان
             *     * `fars` - فارس
             *     * `qazvin` - قزوین
             *     * `qom` - قم
             *     * `kurdistan` - کردستان
             *     * `kerman` - کرمان
             *     * `kermanshah` - کرمانشاه
             *     * `kohgiluyeh` - کهگیلویه و بویراحمد
             *     * `golestan` - گلستان
             *     * `gilan` - گیلان
             *     * `lorestan` - لرستان
             *     * `mazandaran` - مازندران
             *     * `markazi` - مرکزی
             *     * `hormozgan` - هرمزگان
             *     * `hamedan` - همدان
             *     * `yazd` - یزد
             *     * `west_azerbaijan` - آذربایجان غربی
             *     * `east_azerbaijan` - آذربایجان شرقی
             * @default
             * @enum {string}
             */
            province: "tehran" | "alborz" | "ardabil" | "isfahan" | "ilam" | "bushehr" | "chaharmahal" | "khorasan_south" | "khorasan_razavi" | "khorasan_north" | "khuzestan" | "zanjan" | "semnan" | "sistan" | "fars" | "qazvin" | "qom" | "kurdistan" | "kerman" | "kermanshah" | "kohgiluyeh" | "golestan" | "gilan" | "lorestan" | "mazandaran" | "markazi" | "hormozgan" | "hamedan" | "yazd" | "west_azerbaijan" | "east_azerbaijan" | "";
        };
        /** @description ویرایش جزئی هماهنگی ورود توسط زائر — هر فیلد اختیاری، دست‌کم یکی لازم. */
        PatchedReservationDetailsUpdateRequest: {
            /**
             * Format: time
             * @description ساعت تقریبی رسیدن (HH:MM)؛ تهی = نامشخص
             */
            expected_arrival?: string | null;
            guest_note?: string;
            vehicle_plate?: string;
        };
        /** @description نقشهٔ حرارتی واحد×روز. */
        Planning: {
            days: number;
            labels: string[];
            rows: components["schemas"]["PlanningRow"][];
            /** Format: date */
            start_day: string;
        };
        /** @description یک ردیف نقشهٔ حرارتی: نرخ روزبه‌روز یک واحد. */
        PlanningRow: {
            /** Format: double */
            average: number;
            /** @description شناسهٔ واحد */
            code: string;
            floor: number;
            rates: number[];
            title: string;
        };
        /** @description پوشش پاسخ فهرست سیاست‌ها — ``{"results": [...]}`` (فقط برای سند OpenAPI). */
        PolicyList: {
            results: components["schemas"]["PolicyValue"][];
        };
        /** @description پاسخ انتشار نسخهٔ تازهٔ سیاست (فقط برای سند OpenAPI). */
        PolicyRevision: {
            /** Format: date-time */
            effective_from: string;
            key: string;
            value: unknown;
            version: number;
        };
        /** @description بدنهٔ تغییر سیاست — دلیل اجباری است (حداقل ۵ نویسه). */
        PolicyUpdateRequest: {
            reason: string;
            value: unknown;
        };
        /** @description یک سیاست با مقدار مؤثر، پیش‌فرض، نوع فارسی و تاریخ آخرین تغییر. */
        PolicyValue: {
            changed: boolean;
            changed_by: string | null;
            default: unknown;
            help_text: string;
            key: string;
            label: string;
            reason: string;
            type: string;
            /** Format: date-time */
            updated_at: string | null;
            value: unknown;
            version: number;
        };
        /** @description فشار پیش‌رو — چند روز خالی است و چند روز پُر؛ مبنای تصمیم پذیرش. */
        Pressure: {
            /** Format: double */
            average_lead_time_days: number | null;
            days: number;
            empty_count: number;
            empty_days: string[];
            /** Format: date */
            start_day: string;
            tight_count: number;
            tight_days: components["schemas"]["TightDay"][];
        };
        /** @description نمای پروفایل کاربر — همهٔ فیلدهای حساس پوشانده‌اند. */
        Profile: {
            readonly city: string;
            /** Format: date-time */
            readonly date_joined: string;
            readonly display_name: string;
            readonly first_name: string;
            /** Format: uuid */
            readonly id: string;
            /**
             * @description * `national_id` - کد ملی
             *     * `passport` - گذرنامه
             * @enum {string}
             */
            readonly id_document_type: "national_id" | "passport";
            readonly is_profile_complete: boolean;
            readonly is_staff_member: boolean;
            readonly last_name: string;
            readonly national_id_masked: string;
            readonly nationality: string;
            readonly nationality_title: string;
            readonly phone_masked: string;
            readonly province: string;
            readonly province_title: string;
            readonly role: string;
        };
        /** @description یک سهمیهٔ شمارشی. */
        Quota: {
            limit: number;
            remaining: number;
            used: number;
            window_days: number | null;
        };
        /** @description پاسخ پیش‌بینی رزرو — سبد پیش از تأیید (فقط برای سند و کلاینت تایپ‌شده). */
        Quote: {
            allowed: boolean;
            alternatives: components["schemas"]["Alternative"][];
            capacity_total: number;
            cells: number;
            duration_label: string;
            /** Format: date-time */
            end: string | null;
            guests_count: number;
            is_available: boolean;
            notes: string[];
            /** Format: date-time */
            start: string | null;
            unit: components["schemas"]["QuoteUnit"];
            violations: components["schemas"]["Violation"][];
        };
        /** @description ورودی پیش‌بینی رزرو (سبد رزرو). */
        QuoteRequestRequest: {
            /**
             * Format: date-time
             * @description پایان اقامت (ISO 8601)
             */
            end: string;
            guests_count: number;
            /**
             * Format: date-time
             * @description آغاز اقامت (ISO 8601)
             */
            start: string;
            unit_code: string;
        };
        /** @description واحدِ پیش‌بینی. */
        QuoteUnit: {
            code: string;
            title: string;
        };
        /** @description روز شاخص (شلوغ‌ترین/خلوت‌ترین). */
        RankedDay: {
            date_jalali: string;
            /** Format: date */
            day: string;
            /** Format: double */
            rate: number;
        };
        /** @description کدهای بازیابی تازه (کدهای قبلی باطل شدند). */
        RecoveryCodes: {
            recovery_codes: string[];
        };
        /** @description نمای عمومی رزرو — بدون هیچ دادهٔ هویتی مهمان. */
        Reservation: {
            /** @description آیا دکمهٔ «لغو» باید نمایش داده شود؟ */
            readonly can_cancel: boolean;
            readonly cells_count: number;
            /**
             * کد رزرو
             * @description کد انسان‌خوان برای مکالمهٔ تلفنی؛ مثل M-1405-0231
             */
            code: string;
            /** @description زمان ثبت رزرو (وقت محلی سایت). */
            readonly created_at: string;
            readonly date_jalali: string;
            /** @description آیا ساعت رسیدن، پلاک و یادداشت هنوز قابل ویرایش است؟ (پیش از پذیرش حضوری) */
            readonly details_editable: boolean;
            readonly duration_label: string;
            /** @description پایان اقامت در قالب ISO 8601 (وقت محلی سایت). */
            readonly end: string;
            /**
             * ساعت تقریبی ورود
             * Format: time
             */
            readonly expected_arrival: string | null;
            /** @description امتیاز ثبت‌شدهٔ نظرسنجی (۱ تا ۵) برای اقامت پایان‌یافته؛ وگرنه ``None``. */
            readonly feedback_rating: number | null;
            /**
             * @description پیوند نظرسنجی همین اقامت برای صاحبش (همان پیوند پیامک) — فقط وقتی هنوز پذیرفتنی است.
             *
             *     شرط‌های ارزان (وضعیت «پایان‌یافته») پیش از هر پرس‌وجو بررسی می‌شوند؛ پس فهرست رزروهای
             *     پیش‌رو هیچ پرس‌وجوی اضافه‌ای نمی‌زند.
             */
            readonly feedback_url: string | null;
            readonly floor_number: number;
            /** @description آخرین لحظهٔ لغو رایگان؛ پس از آن، لغو «دیرهنگام» با خنک‌شدن است. */
            readonly free_cancel_until: string;
            /** یادداشت مهمان */
            guest_note?: string;
            /** تعداد نفرات */
            guests_count: number;
            /** @description پایان نگه‌داشت موقت (فقط وضعیت «نگه‌داشت»)؛ پس از آن، سانس خودکار آزاد می‌شود. */
            readonly hold_expires_at: string | null;
            /**
             * شناسه
             * Format: uuid
             * @description شناسهٔ UUIDv7 — مرتب با زمان و غیرقابل‌حدس
             */
            readonly id: string;
            readonly is_active: boolean;
            /** لغو دیرهنگام */
            readonly is_late_cancel: boolean;
            /** @description آغاز اقامت در قالب ISO 8601 (وقت محلی سایت). */
            readonly start: string;
            /**
             * وضعیت
             * @description * `hold` - نگه‌داشت موقت
             *     * `confirmed` - تأییدشده
             *     * `checked_in` - پذیرش‌شده
             *     * `completed` - پایان‌یافته
             *     * `cancelled_by_guest` - لغو توسط زائر
             *     * `cancelled_by_staff` - لغو توسط کارکنان
             *     * `no_show` - عدم‌حضور
             *     * `expired` - منقضی‌شده
             *     * `superseded` - جانشین‌شده
             * @enum {string}
             */
            status?: "hold" | "confirmed" | "checked_in" | "completed" | "cancelled_by_guest" | "cancelled_by_staff" | "no_show" | "expired" | "superseded";
            readonly status_label: string;
            readonly unit_code: string;
            readonly unit_title: string;
            /** پلاک خودرو */
            readonly vehicle_plate: string;
            readonly weekday: string;
        };
        /** @description ورودی ثبت رزرو توسط زائر. */
        ReservationCreateRequest: {
            /**
             * Format: date-time
             * @description پایان اقامت (ISO 8601)
             */
            end: string;
            /** Format: time */
            expected_arrival?: string | null;
            guest_note?: string;
            guests_count: number;
            /**
             * Format: date-time
             * @description آغاز اقامت (ISO 8601)
             */
            start: string;
            unit_code: string;
            vehicle_plate?: string;
        };
        /** @description یک رخداد از تاریخچهٔ رزرو — نمای زائر (بدون نام کارمند و دلیل داخلی). */
        ReservationEvent: {
            /** @description زمان رخداد (وقت محلی سایت). */
            readonly at: string;
            /** از وضعیت */
            from_status?: string;
            /**
             * شناسه
             * Format: uuid
             */
            readonly id: string;
            /**
             * نوع رخداد
             * @description * `created` - ایجاد
             *     * `confirmed` - تأیید
             *     * `cancelled` - لغو
             *     * `moved` - جابه‌جایی
             *     * `checked_in` - پذیرش
             *     * `checked_out` - تخلیه
             *     * `no_show` - عدم‌حضور
             *     * `expired` - انقضای نگه‌داشت
             *     * `note` - یادداشت
             *     * `details` - هماهنگی ورود
             * @enum {string}
             */
            kind: "created" | "confirmed" | "cancelled" | "moved" | "checked_in" | "checked_out" | "no_show" | "expired" | "note" | "details";
            readonly kind_label: string;
            /** به وضعیت */
            to_status?: string;
        };
        /** @description پوشش تاریخچهٔ رزرو. */
        ReservationEventList: {
            results: components["schemas"]["ReservationEvent"][];
        };
        /**
         * @description پوشش فهرست رزروهای من: ``{"results": [...], "meta": {...}}``.
         *
         *     ``meta.total`` برای فهرست‌های کاربرمحور فرستاده می‌شود تا فرانت بتواند
         *     «۳ رزرو فعال» را بدون صفحه‌گردی نشان دهد.
         */
        ReservationList: {
            meta: components["schemas"]["PageMeta"];
            results: components["schemas"]["Reservation"][];
        };
        /** @description شمارهٔ کامل زائر (فقط در پاسخ همین درخواست؛ هرگز کش نشود). */
        RevealedPhone: {
            phone: string;
        };
        /** @description درخواست نمایش شمارهٔ کامل — با هدف ساختاریافته. */
        RevealPhoneRequest: {
            note?: string;
            /**
             * @description * `call_guest` - call_guest
             *     * `verify_identity` - verify_identity
             *     * `emergency` - emergency
             *     * `other` - other
             * @enum {string}
             */
            purpose: "call_guest" | "verify_identity" | "emergency" | "other";
        };
        /** @description یک نشست فعال در فهرست «دستگاه‌های من». */
        SessionItem: {
            /** Format: date-time */
            created_at: string;
            /** @description مثل «Chrome · Android» */
            device: string;
            /** Format: uuid */
            id: string;
            is_current: boolean;
            /** Format: date-time */
            last_seen_at: string;
            /** @description پیشوند شبکه (نه آی‌پی کامل) */
            network: string;
        };
        /** @description پوشش فهرست نشست‌ها. */
        SessionList: {
            results: components["schemas"]["SessionItem"][];
        };
        /** @description پاسخ ورود موفق — پروفایل + گام بعدی کاربر. */
        SessionResult: {
            is_new_user: boolean;
            /**
             * @description گام بعدی: تکمیل پروفایل یا رفتن به صفحهٔ رزرو
             *
             *     * `complete_profile` - complete_profile
             *     * `home` - home
             * @enum {string}
             */
            next_step: "complete_profile" | "home";
            profile: components["schemas"]["Profile"];
        };
        /** @description وضعیت نشست برای فرانت — همیشه ۲۰۰ (مهمان هم پاسخ معتبر می‌گیرد، نه ۴۰۱). */
        SessionState: {
            /** @description آیا کاربری وارد شده است */
            authenticated: boolean;
            /** @description کارمندی که هنوز تأیید دومرحله‌ای این نشست را انجام نداده است */
            mfa_pending: boolean;
            /** @description نمای ایمن پروفایل یا null برای مهمان */
            profile: components["schemas"]["Profile"] | null;
        };
        /** @description نمایش یک پیشنهاد سانس. */
        SlotOffer: {
            /** Format: date-time */
            readonly ends_at: string;
            /** Format: uuid */
            readonly entry_id: string;
            /** Format: date-time */
            readonly expires_at: string;
            /** Format: uuid */
            readonly id: string;
            readonly seconds_left: number;
            /** Format: date-time */
            readonly starts_at: string;
            readonly status: string;
            readonly unit_code: string;
        };
        /** @description نمای کارکنان — با جزئیات عملیاتی و هویت مهمان (پوشانده). */
        StaffReservation: {
            /** @description آیا دکمهٔ «لغو» باید نمایش داده شود؟ */
            readonly can_cancel: boolean;
            /** دلیل لغو */
            cancel_reason?: string;
            /**
             * دستهٔ دلیل لغو
             * @description * `guest_request` - درخواست زائر
             *     * `maintenance` - تعمیر و نگهداری
             *     * `overbooking` - اصلاح رزرو
             *     * `duplicate` - رزرو تکراری
             *     * `no_show` - عدم‌حضور
             *     * `other` - سایر
             * @enum {string}
             */
            cancel_reason_kind?: "guest_request" | "maintenance" | "overbooking" | "duplicate" | "no_show" | "other" | "";
            /**
             * زمان لغو
             * Format: date-time
             */
            cancelled_at?: string | null;
            readonly cells_count: number;
            /**
             * زمان پذیرش
             * Format: date-time
             */
            checked_in_at?: string | null;
            /**
             * زمان تخلیه
             * Format: date-time
             */
            checked_out_at?: string | null;
            /**
             * کد رزرو
             * @description کد انسان‌خوان برای مکالمهٔ تلفنی؛ مثل M-1405-0231
             */
            code: string;
            /** @description زمان ثبت رزرو (وقت محلی سایت). */
            readonly created_at: string;
            readonly date_jalali: string;
            /** @description آیا ساعت رسیدن، پلاک و یادداشت هنوز قابل ویرایش است؟ (پیش از پذیرش حضوری) */
            readonly details_editable: boolean;
            readonly duration_label: string;
            /** @description پایان اقامت در قالب ISO 8601 (وقت محلی سایت). */
            readonly end: string;
            /**
             * ساعت تقریبی ورود
             * Format: time
             */
            readonly expected_arrival: string | null;
            /** @description امتیاز ثبت‌شدهٔ نظرسنجی (۱ تا ۵) برای اقامت پایان‌یافته؛ وگرنه ``None``. */
            readonly feedback_rating: number | null;
            /**
             * @description پیوند نظرسنجی همین اقامت برای صاحبش (همان پیوند پیامک) — فقط وقتی هنوز پذیرفتنی است.
             *
             *     شرط‌های ارزان (وضعیت «پایان‌یافته») پیش از هر پرس‌وجو بررسی می‌شوند؛ پس فهرست رزروهای
             *     پیش‌رو هیچ پرس‌وجوی اضافه‌ای نمی‌زند.
             */
            readonly feedback_url: string | null;
            readonly floor_number: number;
            /** @description آخرین لحظهٔ لغو رایگان؛ پس از آن، لغو «دیرهنگام» با خنک‌شدن است. */
            readonly free_cancel_until: string;
            /** Format: uuid */
            readonly guest_id: string;
            readonly guest_name: string;
            readonly guest_nationality: string;
            /** یادداشت مهمان */
            guest_note?: string;
            readonly guest_phone_masked: string;
            /** تعداد نفرات */
            guests_count: number;
            /** @description پایان نگه‌داشت موقت (فقط وضعیت «نگه‌داشت»)؛ پس از آن، سانس خودکار آزاد می‌شود. */
            readonly hold_expires_at: string | null;
            /**
             * شناسه
             * Format: uuid
             * @description شناسهٔ UUIDv7 — مرتب با زمان و غیرقابل‌حدس
             */
            readonly id: string;
            readonly is_active: boolean;
            /** لغو دیرهنگام */
            readonly is_late_cancel: boolean;
            /**
             * زمان ثبت عدم‌حضور
             * Format: date-time
             */
            no_show_at?: string | null;
            /**
             * منبع ایجاد
             * @description * `web` - وب (خود زائر)
             *     * `phone` - تلفنی
             *     * `desk` - پذیرش حضوری
             *     * `admin` - پنل مدیریت
             *     * `waitlist` - پذیرش پیشنهاد صف انتظار
             * @enum {string}
             */
            source?: "web" | "phone" | "desk" | "admin" | "waitlist";
            readonly source_label: string;
            /** یادداشت داخلی */
            staff_note?: string;
            /** @description آغاز اقامت در قالب ISO 8601 (وقت محلی سایت). */
            readonly start: string;
            /**
             * وضعیت
             * @description * `hold` - نگه‌داشت موقت
             *     * `confirmed` - تأییدشده
             *     * `checked_in` - پذیرش‌شده
             *     * `completed` - پایان‌یافته
             *     * `cancelled_by_guest` - لغو توسط زائر
             *     * `cancelled_by_staff` - لغو توسط کارکنان
             *     * `no_show` - عدم‌حضور
             *     * `expired` - منقضی‌شده
             *     * `superseded` - جانشین‌شده
             * @enum {string}
             */
            status?: "hold" | "confirmed" | "checked_in" | "completed" | "cancelled_by_guest" | "cancelled_by_staff" | "no_show" | "expired" | "superseded";
            readonly status_label: string;
            readonly superseded_by_code: string;
            readonly unit_code: string;
            readonly unit_title: string;
            /** پلاک خودرو */
            readonly vehicle_plate: string;
            /**
             * نسخه
             * Format: int64
             */
            version?: number;
            readonly weekday: string;
        };
        /** @description ورودی ثبت رزرو تلفنی/حضوری توسط کارکنان. */
        StaffReservationCreateRequest: {
            city?: string;
            /**
             * Format: date-time
             * @description پایان اقامت (ISO 8601)
             */
            end: string;
            /** Format: time */
            expected_arrival?: string | null;
            first_name?: string;
            guest_note?: string;
            guests_count: number;
            last_name?: string;
            /** @description شمارهٔ تلفن مهمان؛ اگر حساب نداشته باشد ساخته می‌شود. */
            phone: string;
            province?: string;
            staff_note?: string;
            /**
             * Format: date-time
             * @description آغاز اقامت (ISO 8601)
             */
            start: string;
            unit_code: string;
            vehicle_plate?: string;
        };
        /** @description رخداد برای کارکنان — با عامل، دلیل و فراداده. */
        StaffReservationEvent: {
            /** برچسب کنش‌گر */
            actor_label?: string;
            /** @description زمان رخداد (وقت محلی سایت). */
            readonly at: string;
            /** از وضعیت */
            from_status?: string;
            /**
             * شناسه
             * Format: uuid
             */
            readonly id: string;
            /**
             * نوع رخداد
             * @description * `created` - ایجاد
             *     * `confirmed` - تأیید
             *     * `cancelled` - لغو
             *     * `moved` - جابه‌جایی
             *     * `checked_in` - پذیرش
             *     * `checked_out` - تخلیه
             *     * `no_show` - عدم‌حضور
             *     * `expired` - انقضای نگه‌داشت
             *     * `note` - یادداشت
             *     * `details` - هماهنگی ورود
             * @enum {string}
             */
            kind: "created" | "confirmed" | "cancelled" | "moved" | "checked_in" | "checked_out" | "no_show" | "expired" | "note" | "details";
            readonly kind_label: string;
            /** فراداده */
            metadata?: unknown;
            /** دلیل */
            reason?: string;
            /** به وضعیت */
            to_status?: string;
        };
        /** @description پوشش تاریخچهٔ رزرو برای کارکنان. */
        StaffReservationEventList: {
            results: components["schemas"]["StaffReservationEvent"][];
        };
        /** @description پوشش میز کارکنان — با صفحهٔ بزرگ‌تر و بدون شمارش کل (کوئری گران). */
        StaffReservationList: {
            meta: components["schemas"]["PageMeta"];
            results: components["schemas"]["StaffReservation"][];
        };
        /** @description پاسخ نمای کارکنان: صف، پیشنهادهای باز، آمار و نمای کلی (فقط برای سند). */
        StaffWaitlist: {
            open_offers: components["schemas"]["SlotOffer"][];
            overview: {
                [key: string]: unknown;
            };
            queue: components["schemas"]["Waitlist"][];
            stats: {
                [key: string]: unknown;
            };
        };
        /** @description وضعیت توان رزرو زائر (سند). */
        Standing: {
            active: components["schemas"]["Quota"];
            blockers: components["schemas"]["Violation"][];
            can_book: boolean;
            /** Format: date-time */
            cooldown_until: string | null;
            /** Format: date-time */
            next_eligible_at: string | null;
            profile_complete: boolean;
            /** Format: date-time */
            suspended_until: string | null;
            window: components["schemas"]["Quota"];
            year: components["schemas"]["Quota"];
        };
        /** @description روز پُر (نزدیک اشباع) در گزارش فشار پیش‌رو. */
        TightDay: {
            /** Format: date */
            day: string;
            /** Format: double */
            rate: number;
        };
        /** @description بدنهٔ انتقال کارمندی — ``staff_note`` برای no-show و note اجباری است (سند). */
        TransitionRequestRequest: {
            /** @description برای no-show و note اجباری؛ برای بقیه نادیده */
            staff_note?: string;
        };
        /** @description نمایش واحد — دقیقاً آنچه تقویم و کارت واحد لازم دارد. */
        Unit: {
            /** ظرفیت بزرگسال */
            capacity_adults?: number;
            /** ظرفیت کودک */
            capacity_children?: number;
            readonly capacity_total: number;
            /**
             * بافر نظافت (دقیقه)
             * @description خالی = تابع سیاست سراسری «بافر نظافت»؛ صفر = صریحاً بدون بافر.
             */
            cleaning_buffer_minutes?: number | null;
            /**
             * کد واحد
             * @description کد کوتاه برای مکالمهٔ تلفنی و تابلو؛ مثل A1
             */
            code: string;
            readonly features: components["schemas"]["UnitFeature"][];
            readonly floor_number: number;
            /**
             * شناسه
             * Format: uuid
             * @description شناسهٔ UUIDv7 — مرتب با زمان و غیرقابل‌حدس
             */
            readonly id: string;
            /** عنوان */
            title: string;
            readonly type_label: string;
            /**
             * نوع واحد
             * @description * `suite` - سوئیت
             *     * `large_room` - اتاق بزرگ
             * @enum {string}
             */
            unit_type: "suite" | "large_room";
        };
        /** @description نمای کامل واحد — با تصاویر و یادداشت عمومی. */
        UnitDetail: {
            /** ظرفیت بزرگسال */
            capacity_adults?: number;
            /** ظرفیت کودک */
            capacity_children?: number;
            readonly capacity_total: number;
            /**
             * بافر نظافت (دقیقه)
             * @description خالی = تابع سیاست سراسری «بافر نظافت»؛ صفر = صریحاً بدون بافر.
             */
            cleaning_buffer_minutes?: number | null;
            /**
             * کد واحد
             * @description کد کوتاه برای مکالمهٔ تلفنی و تابلو؛ مثل A1
             */
            code: string;
            readonly features: components["schemas"]["UnitFeature"][];
            readonly floor_number: number;
            /**
             * شناسه
             * Format: uuid
             * @description شناسهٔ UUIDv7 — مرتب با زمان و غیرقابل‌حدس
             */
            readonly id: string;
            /** یادداشت کارکنان */
            notes?: string;
            readonly photos: components["schemas"]["UnitPhoto"][];
            /** عنوان */
            title: string;
            readonly type_label: string;
            /**
             * نوع واحد
             * @description * `suite` - سوئیت
             *     * `large_room` - اتاق بزرگ
             * @enum {string}
             */
            unit_type: "suite" | "large_room";
        };
        /** @description نمایش یک امکان واحد. */
        UnitFeature: {
            /** کد */
            code: string;
            /** نماد */
            icon?: string;
            /** امکان شاخص */
            is_highlight?: boolean;
            /** عنوان */
            title: string;
        };
        /** @description نمایش تصویر واحد. */
        UnitPhoto: {
            /** متن جایگزین */
            alt_text?: string;
            readonly id: number;
            /** تصویر شاخص */
            is_cover?: boolean;
            /** ترتیب */
            sort_order?: number;
            /** Format: uri */
            readonly url: string | null;
        };
        /** @description یک واحد در پاسخ کشف بازه. */
        UnitWindow: {
            capacity_total: number;
            code: string;
            fits_guests: boolean;
            floor_number: number;
            title: string;
            unit_type: string;
            window: components["schemas"]["FreeWindow"] | null;
        };
        /** @description یک تخلف قاعده: کد ماشین‌خوان + پیام فارسی. */
        Violation: {
            code: string;
            message: string;
        };
        /** @description نمایش یک درخواست صف انتظار. */
        Waitlist: {
            readonly cells_count: number;
            /** Format: date-time */
            readonly created_at: string;
            /** Format: date-time */
            readonly ends_at: string;
            readonly guests_count: number;
            /** Format: uuid */
            readonly id: string;
            readonly offers_sent: number;
            /** @description پیشنهاد باز همین درخواست (فقط در وضعیت «پیشنهاد ارسال‌شده»)؛ پرتال زائر با آن کارت «پذیرش/رد» و شمارش معکوس را بی‌نیاز از لینک پیامک نشان می‌دهد. */
            readonly open_offer: components["schemas"]["SlotOffer"] | null;
            /** @description نوبت فعلی درخواست در صف. */
            readonly position: number;
            /** Format: date-time */
            readonly starts_at: string;
            readonly status: string;
            readonly status_label: string;
            readonly unit_code: string;
            readonly unit_title: string;
        };
        /** @description پوشش پاسخ فهرست — ``{"results": [...], "meta": {...}}`` (فقط برای سند). */
        WaitlistList: {
            meta: components["schemas"]["PageMeta"];
            results: components["schemas"]["Waitlist"][];
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
};
export type $defs = Record<string, never>;
export interface operations {
    auth_csrf_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Csrf"];
                };
            };
        };
    };
    auth_logout_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    auth_logout_all_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    auth_mfa_recovery_codes_regenerate_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RecoveryCodes"];
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description تصادم با وضعیت موجود */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    auth_mfa_status_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MfaStatus"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    auth_mfa_totp_confirm_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MfaCodeRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MfaConfirmResult"];
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description تصادم با وضعیت موجود */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    auth_mfa_totp_setup_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MfaEnrollment"];
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description تصادم با وضعیت موجود */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    auth_mfa_verify_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MfaCodeRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MfaVerifyResult"];
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description تصادم با وضعیت موجود */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    auth_otp_request_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OtpRequestRequest"];
            };
        };
        responses: {
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OtpRequestResult"];
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description تعداد درخواست زیاد */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    auth_otp_verify_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OtpVerifyRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionResult"];
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description تعداد درخواست زیاد */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    auth_session_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionState"];
                };
            };
        };
    };
    blocks_list: {
        parameters: {
            query?: {
                /** @description آغاز بازه (YYYY-MM-DD) */
                from?: string;
                /** @description پایان بازه (YYYY-MM-DD) */
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Block"][];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    blocks_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BlockCreateRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Block"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description تصادم با وضعیت موجود */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    blocks_remove_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                block_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BlockCreateRequest"];
            };
        };
        responses: {
            /** @description No response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    calendar_retrieve: {
        parameters: {
            query?: {
                /** @description تعداد روز (۱ تا 62) */
                days?: number;
                /** @description آغاز تقویم (YYYY-MM-DD)؛ پیش‌فرض امروز */
                from?: string;
            };
            header?: {
                /** @description ETag پاسخ قبلی؛ اگر تقویم تغییر نکرده باشد ⇒ ۳۰۴ بدون بدنه */
                "If-None-Match"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Calendar"];
                };
            };
            /** @description No response body */
            304: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    calendar_windows_retrieve: {
        parameters: {
            query?: {
                /** @description تعداد همسفران (۱ تا 60)؛ پیش‌فرض ۱ */
                guests?: number;
                /** @description کوتاه‌ترین ران پذیرفتنی (نیم‌روز)؛ پیش‌فرض کف سیاست */
                min_cells?: number;
            };
            header?: {
                /** @description ETag پاسخ قبلی؛ بی‌تغییر ⇒ ۳۰۴ بدون بدنه */
                "If-None-Match"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CalendarWindows"];
                };
            };
            /** @description No response body */
            304: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    certificates_verify_offline_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OfflineCheckRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OfflineCheckResult"];
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    certificates_verify_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                token: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CertificateVerification"];
                };
            };
        };
    };
    config_retrieve: {
        parameters: {
            query?: never;
            header?: {
                /** @description ETag پاسخ قبلی ⇒ ۳۰۴ اگر چیزی عوض نشده باشد */
                "If-None-Match"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Config"];
                };
            };
            /** @description No response body */
            304: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    feedback_token_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                token: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FeedbackState"];
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description دیگر در دسترس نیست */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    feedback_token_submit: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                token: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FeedbackSubmitRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FeedbackState"];
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description تصادم با وضعیت موجود */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description دیگر در دسترس نیست */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    help_retrieve: {
        parameters: {
            query?: {
                /** @description فقط یک دسته (slug) */
                cat?: string;
                /** @description جست‌وجوی فارسی (با تحمل نیم‌فاصله و ی/ک) */
                q?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Help"];
                };
            };
        };
    };
    me_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Profile"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    "me_calendar.ics_retrieve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description پروندهٔ iCalendar (RFC 5545) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/calendar": string;
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    me_profile_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedProfileUpdateRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Profile"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    me_sessions_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionList"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    me_sessions_revoke_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                session_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No response body */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    me_standing_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Standing"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    meta_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Meta"];
                };
            };
        };
    };
    occasions_list: {
        parameters: {
            query?: {
                /** @description آغاز بازه (YYYY-MM-DD) */
                from?: string;
                /** @description پایان بازه (YYYY-MM-DD) */
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Occasion"][];
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    property_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Floor"][];
                };
            };
        };
    };
    reservations_list: {
        parameters: {
            query?: {
                /** @description مکان‌نمای صفحهٔ بعد/قبل (از meta.next) */
                cursor?: string;
                /** @description اندازهٔ صفحه (پیش‌فرض ۲۰، سقف ۱۰۰) */
                page_size?: number;
                /** @description upcoming (نزدیک‌ترین سفر نخست) | past | all (تازه‌ترین سفر نخست)؛ پیش‌فرض upcoming */
                scope?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReservationList"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    reservations_create: {
        parameters: {
            query?: never;
            header?: {
                /** @description کلید یکتای کلاینت برای جلوگیری از رزرو تکراری */
                "Idempotency-Key"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReservationCreateRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Reservation"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description تصادم با وضعیت موجود */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    reservations_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Reservation"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    reservations_partial_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["PatchedReservationDetailsUpdateRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Reservation"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description تصادم با وضعیت موجود */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    "reservations_calendar.ics_retrieve": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description پروندهٔ iCalendar (RFC 5545) */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "text/calendar": string;
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    reservations_cancel_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["CancelRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Reservation"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description تصادم با وضعیت موجود */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    reservations_cancel_preview_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CancelPreview"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    reservations_certificate_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Certificate"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description تصادم با وضعیت موجود */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    reservations_timeline_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReservationEventList"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    reservations_quote_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["QuoteRequestRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Quote"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    staff_guests_list: {
        parameters: {
            query?: {
                /** @description بخشی از شماره یا نام */
                q?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GuestList"];
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    staff_guests_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                guest_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GuestDetail"];
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    staff_guests_reveal_phone_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                guest_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RevealPhoneRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["RevealedPhone"];
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    staff_insights_retrieve: {
        parameters: {
            query?: {
                /** @description طول پنجره به روز (۱ تا 366) */
                days?: number;
                /** @description روز آغاز پنجره (ISO، پیش‌فرض: امروز) */
                start?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Insights"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    staff_policies_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PolicyList"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    staff_policies_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PolicyValue"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    staff_policies_update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PolicyUpdateRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PolicyRevision"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    "staff_reports_reservations.xlsx_retrieve": {
        parameters: {
            query?: {
                /** @description از تاریخ (YYYY-MM-DD) */
                from?: string;
                /** @description masked (پیش‌فرض) یا full — شمارهٔ کامل فقط برای مدیر و با تأیید تازهٔ عامل دوم (در غیر این صورت ۴۰۳ با کد manager_only یا step_up_required) */
                phones?: "full" | "masked";
                /** @description وضعیت رزروها با کاما؛ خالی = همهٔ وضعیت‌ها */
                status?: string;
                /** @description تا تاریخ (YYYY-MM-DD) */
                to?: string;
                /** @description کد واحدها با کاما؛ خالی = همهٔ واحدها (مثال: A1,B1) */
                units?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": string;
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    staff_reports_summary_retrieve: {
        parameters: {
            query?: {
                /** @description از تاریخ (YYYY-MM-DD) */
                from?: string;
                /** @description تا تاریخ (YYYY-MM-DD) */
                to?: string;
                /** @description کد واحدها با کاما؛ خالی = همهٔ واحدها (مثال: A1,B1) */
                units?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    staff_reservations_list: {
        parameters: {
            query?: {
                /** @description تعداد روز (پیش‌فرض ۷، سقف 62) */
                days?: number;
                /** @description آغاز بازه (YYYY-MM-DD) */
                from?: string;
                /** @description جست‌وجو: کد رزرو، بخشی از شماره یا نام زائر */
                q?: string;
                /** @description منبع‌ها با ویرگول: web, phone, desk, admin, waitlist */
                source?: string;
                /** @description وضعیت‌ها با ویرگول: hold, confirmed, checked_in, completed, cancelled_by_guest, cancelled_by_staff, no_show, expired, superseded */
                status?: string;
                /** @description کد واحدها با ویرگول (مثل A1,B3) */
                unit?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StaffReservationList"];
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    staff_reservations_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StaffReservation"];
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    staff_reservations_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                action_name: "check-in" | "check-out" | "no-show" | "note";
                code: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["TransitionRequestRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StaffReservation"];
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description تصادم با وضعیت موجود */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    staff_reservations_events_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StaffReservationEventList"];
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    staff_reservations_move_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MoveRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StaffReservation"];
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description تصادم با وضعیت موجود */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    staff_reservations_create_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StaffReservationCreateRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StaffReservation"];
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description تصادم با وضعیت موجود */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    staff_waitlist_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StaffWaitlist"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description دسترسی مجاز نیست */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    units_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Unit"][];
                };
            };
        };
    };
    units_retrieve: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["UnitDetail"];
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    waitlist_retrieve: {
        parameters: {
            query?: {
                /** @description مکان‌نمای صفحهٔ بعد/قبل (از meta.next) */
                cursor?: string;
                /** @description اندازهٔ صفحه (پیش‌فرض ۲۰، سقف ۱۰۰) */
                page_size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WaitlistList"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    waitlist_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["JoinRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Waitlist"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    waitlist_withdraw_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                entry_id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["OfferActionRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Waitlist"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    waitlist_offers_respond_create: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                offer_id: string;
            };
            cookie?: never;
        };
        requestBody?: {
            content: {
                "application/json": components["schemas"]["OfferRespondRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SlotOffer"];
                };
            };
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OfferAccepted"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description تصادم با وضعیت موجود */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    waitlist_offers_by_token_retrieve: {
        parameters: {
            query?: {
                /** @description کنش درج‌شده در پیوند */
                action?: "accept" | "decline";
            };
            header?: never;
            path: {
                token: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OfferDetail"];
                };
            };
            /** @description ورود لازم است */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description یافت نشد */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description دیگر در دسترس نیست */
            410: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
            /** @description ورودی نامعتبر */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        /** @description بازه‌های آزاد جایگزین هنگام تصادم رزرو. */
                        alternatives?: {
                            [key: string]: unknown;
                        }[];
                        code: string;
                        detail: string;
                        /** @description نگاشت خطای فیلدها؛ در هر پاسخ ۴۲۲ همیشه حاضر است (ADR-0017). */
                        errors?: {
                            [key: string]: string[];
                        };
                        instance?: string;
                        /** @description وضعیت تأیید دومرحله‌ای کارکنان در پاسخ‌های mfa_required/step_up_required. */
                        mfa?: {
                            [key: string]: unknown;
                        };
                        otel_trace_id?: string;
                        /** @description ثانیه تا تلاش دوباره (۴۲۹). */
                        retry_after?: number;
                        status: number;
                        title: string;
                        trace_id?: string;
                        /** Format: uri */
                        type: string;
                        /** @description همهٔ تخلف‌های قواعد رزرو، یک‌جا (نه یکی‌یکی). */
                        violations?: {
                            code: string;
                            message: string;
                        }[];
                    } & {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
}
