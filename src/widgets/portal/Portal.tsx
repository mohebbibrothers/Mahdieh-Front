"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { SignInForm } from "@/features/session/SignInForm";
import { ApiError } from "@/shared/api/client";
import { readPolicies } from "@/shared/api/policies";
import { configQuery, reservationsQuery, sessionQuery, standingQuery } from "@/shared/api/queries";
import { reservationQuery } from "@/shared/api/reservations";
import type { Reservation } from "@/shared/api/schemas";
import { destHref } from "@/shared/config/destinations";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import { setSearch } from "@/widgets/booking/use-search";
import { AccountSecurity } from "./AccountSecurity";
import { CommandDeck } from "./CommandDeck";
import { Companion } from "./Companion";
import { normalizeCode, pickFeatured } from "./model";
import { LoadError } from "./parts";
import { PastStays } from "./PastStays";
import { StayCard } from "./StayCard";
import { VerifySection } from "./VerifySection";
import { Waitlist } from "./Waitlist";

/** نمایش یک رزرو در کارت شاخص: نشانی ‎?code=‎ (قابل اشتراک/بازگشت) + پیمایش نرم به کارت. */
function focusStay(code: string | null) {
  setSearch({ code }, code ? "push" : "replace");
  requestAnimationFrame(() => {
    const el = document.getElementById("stay");
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  });
}

/** P-07 پرتال زائر — همهٔ چرخهٔ پس از ثبت: پیگیری، گواهی، هماهنگی ورود، صف انتظار، سابقه، حساب. */
export function Portal() {
  const session = useQuery(sessionQuery);
  const profile = session.data?.profile ?? null;
  const signedIn = Boolean(profile);
  const params = useSearchParams();
  const rawCode = params.get("code");
  const code = rawCode ? normalizeCode(rawCode) : null;

  const config = useQuery(configQuery);
  const policies = readPolicies(config.data);
  const standing = useQuery({ ...standingQuery, enabled: signedIn });
  const upcoming = useQuery({ ...reservationsQuery("upcoming"), enabled: signedIn });
  const list = upcoming.data?.results ?? [];
  // فعال‌ها نخست (سرور نزدیک‌ترین را اول می‌دهد)؛ لغوشده‌های پیش‌رو فقط با ‎?code=‎ دیده می‌شوند.
  const active = list.filter((r) => r.is_active);
  const inList = code ? list.find((r) => r.code.toUpperCase() === code) : undefined;
  const pinnedQuery = useQuery({
    ...reservationQuery(code ?? "-"),
    enabled: signedIn && Boolean(code) && !inList && upcoming.isSuccess,
  });
  const pinned = !inList && pinnedQuery.data ? pinnedQuery.data : null;
  const featured: Reservation | null = pinned ?? inList ?? pickFeatured(active, null);

  // کد ناموجود در حساب ⇒ پیام و پاک کردن نشانی (نه صفحهٔ خطا).
  const warned = useRef<string | null>(null);
  useEffect(() => {
    const e = pinnedQuery.error;
    if (!code || !e || warned.current === code) return;
    warned.current = code;
    toast(
      e instanceof ApiError && e.status === 404 ? `رزرو ${code} در حساب شما پیدا نشد.` : "بارگذاری رزرو ممکن نشد.",
      "warn",
    );
    setSearch({ code: null });
  }, [code, pinnedQuery.error]);

  if (session.isPending) {
    return (
      <div className="pt-wrap" aria-busy="true">
        <div className="skeleton pt-deck-skel" aria-hidden="true" />
        <div className="skeleton pt-stay-skel" aria-hidden="true" />
      </div>
    );
  }

  // خطای سرور/شبکه در خواندن نشست ⇒ نه فرم ورود (زائرِ واردشده را گمراه می‌کند)، بلکه تلاش دوباره.
  if (session.isError && !session.data) {
    return (
      <div className="pt-wrap">
        <LoadError
          title="ارتباط با سامانه برقرار نشد"
          text="وضعیت ورود شما خوانده نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید؛ رزروهای شما محفوظ است."
          onRetry={() => void session.refetch()}
          busy={session.isFetching}
        />
        <VerifySection />
        <Companion unitCode={null} />
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="pt-wrap">
        <CommandDeck profile={null} standing={undefined} recent={[]} onOpenCode={() => undefined}>
          <GuestInvite />
        </CommandDeck>
        <VerifySection />
        <Companion unitCode={null} />
      </div>
    );
  }

  const recent = [...active, ...list.filter((r) => !r.is_active)];
  return (
    <div className="pt-wrap">
      <CommandDeck profile={profile} standing={standing.data} recent={recent} onOpenCode={focusStay} />
      <div id="stay" className="pt-anchor">
        {upcoming.isPending || (code && !inList && pinnedQuery.isPending && !pinnedQuery.error) ? (
          <div className="skeleton pt-stay-skel" aria-hidden="true" />
        ) : upcoming.isError && !upcoming.data ? (
          <LoadError
            title="رزروهای شما بارگذاری نشد"
            text="ارتباط با سامانه موقتاً برقرار نیست؛ رزروها سر جای خود هستند. چند لحظه بعد دوباره تلاش کنید."
            onRetry={() => void upcoming.refetch()}
            busy={upcoming.isFetching}
          />
        ) : featured ? (
          <StayCard
            key={featured.code}
            r={featured}
            others={active}
            onPick={(c) => focusStay(c)}
            policies={policies}
            pinned={Boolean(pinned)}
            onUnpin={() => focusStay(null)}
          />
        ) : (
          <NoStay blocker={standing.data && !standing.data.can_book ? standing.data.blockers[0]?.message : undefined} />
        )}
      </div>
      <Waitlist onAccepted={(c) => focusStay(c)} />
      <PastStays
        onOpen={focusStay}
        upcoming={[...active].sort((x, y) => x.start.localeCompare(y.start))[0] ?? null}
        canBook={standing.data?.can_book}
      />
      {profile ? <AccountSecurity profile={profile} /> : null}
      <Companion unitCode={featured && featured.is_active ? featured.unit_code : null} />
      <VerifySection />
    </div>
  );
}

function NoStay({ blocker }: { blocker: string | undefined }) {
  return (
    <article className="pt-stay pt-stay--empty" aria-labelledby="pt-nostay">
      <span className="pt-stay__art" aria-hidden="true">
        <Icon name="calendar-plus" size={28} />
      </span>
      <div>
        <h2 id="pt-nostay">اقامت پیش‌رویی ندارید</h2>
        <p>
          {blocker ??
            "زمان آزاد را در تقویم ببینید و در چند گام رزرو رایگان خود را ثبت کنید؛ گواهی، هماهنگی ورود و پیگیری همه این‌جا خواهد بود."}
        </p>
      </div>
      <div className="pt-stay__cta">
        <Link className="btn btn-primary btn-lg" href={destHref("calendar")}>
          <Icon name="calendar" size={18} /> تقویم زمان‌های آزاد
        </Link>
        <Link className="btn btn-secondary btn-lg" href={destHref("units")}>
          <Icon name="building" size={18} /> واحدهای اقامتی
        </Link>
      </div>
    </article>
  );
}

/** مهمان: ورود درجا (همان فرم پیامکی صفحهٔ صدور) + آنچه پرتال پس از ورود می‌دهد. */
function GuestInvite() {
  return (
    <div className="pt-guest">
      <div className="pt-guest__copy">
        <h2>
          <Icon name="user" size={20} /> ورود به پرتال با شمارهٔ همراه
        </h2>
        <p>رزروها فقط برای صاحب همان شماره نمایش داده می‌شوند؛ بی‌گذرواژه، با یک کد پیامکی.</p>
        <ul>
          <li>
            <Icon name="certificate" size={16} /> گواهی رسمی اقامت و چاپ / PDF
          </li>
          <li>
            <Icon name="car" size={16} /> اعلام ساعت رسیدن و پلاک خودرو
          </li>
          <li>
            <Icon name="bell" size={16} /> پاسخ به پیشنهاد سانس صف انتظار
          </li>
          <li>
            <Icon name="history" size={16} /> سابقهٔ سفرها و ثبت دل‌نوشته
          </li>
        </ul>
      </div>
      <div className="pt-guest__form account-flow account-flow--page">
        <SignInForm
          variant="page"
          phoneLabel="شمارهٔ همراه ثبت‌شده در رزرو"
          submitLabel="دریافت کد ورود"
          onVerified={(res) => {
            const name = res.profile.first_name || "زائر گرامی";
            toast(
              res.is_new_user ? "حساب شما ساخته شد؛ برای رزرو، مشخصات سجلی را کامل کنید." : `${name}، خوش آمدید.`,
              "success",
            );
          }}
        />
      </div>
    </div>
  );
}
