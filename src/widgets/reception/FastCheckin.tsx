"use client";
import { useId, useRef, useState } from "react";
import { QrScanner } from "@/features/verify-certificate/QrScanner";
import { lookup, transition, type Desk, type DeskRow, type Lookup } from "@/shared/api/desk";
import { faDigits } from "@/shared/lib/fa";
import { useClock } from "@/shared/lib/use-clock";
import { AppDialog } from "@/shared/ui/Dialog";
import { Icon } from "@/shared/ui/Icon";
import { CHECKLIST, checkInBlocker, checkInNote, freshRow, isCompleteScan, type ChecklistId } from "./model";
import { Info, LanePill, Latin, Notice, SectionHead, UnitBadge } from "./parts";
import { errorText, useDeskRuntime } from "./runtime";
import type { OpenDialog } from "./types";

type Result = { query: string; data: Lookup } | { query: string; error: string } | null;

/**
 * میز پذیرش سریع: ورودی اسکنر بارکدخوان (QR کامل، کد رزرو، کد ۸ نویسه‌ای آفلاین، کد ملی، نام/شماره)،
 * اسکن با دوربین همین دستگاه، پرونده و چک‌لیست تحویل کلید. ثبت پذیرش فقط با تیک همهٔ بندهای چک‌لیست
 * و فقط وقتی سرور پنجرهٔ پذیرش را باز بداند؛ یادداشت چک‌لیست در حسابرسی همان پذیرش ثبت می‌شود.
 */
export function FastCheckin({
  desk,
  initial,
  inputRef,
  open,
  onDone,
}: {
  desk: Desk;
  initial: DeskRow | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  open: OpenDialog;
  onDone: (unitCode: string) => void;
}) {
  const { run } = useDeskRuntime();
  const now = useClock();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<DeskRow | null>(initial);
  const [checked, setChecked] = useState<ReadonlySet<ChecklistId>>(new Set());
  const [note, setNote] = useState("");
  const [camera, setCamera] = useState(false);
  const [done, setDone] = useState<DeskRow | null>(null);
  const controller = useRef<AbortController | null>(null);
  const noteId = useId();
  const resultsId = useId();

  const row = selected ? freshRow(desk, selected) : null;
  const blocker = row ? checkInBlocker(row, now) : null;
  const ready = row !== null && blocker === null && checked.size === CHECKLIST.length;

  const choose = (r: DeskRow | null) => {
    setSelected(r);
    setChecked(new Set());
    setNote("");
    setDone(null);
  };

  const search = async (raw: string) => {
    const q = raw.trim();
    if (!q || busy) return;
    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;
    setBusy(true);
    try {
      const data = await lookup(q, ac.signal);
      setResult({ query: q, data });
      choose(data.matches.length === 1 ? (data.matches[0] ?? null) : null);
    } catch (e) {
      if (!ac.signal.aborted) setResult({ query: q, error: errorText(e) });
    } finally {
      if (controller.current === ac) setBusy(false);
    }
  };

  const finalize = async () => {
    if (!row || !ready) return;
    const out = await run(() => transition(row.code, "check-in", { staff_note: checkInNote(checked, note) }), {
      success: `پذیرش ثبت شد؛ کلید ${row.unit_code} به ${row.guest_name || "زائر"} تحویل شد.`,
    });
    if (out.ok) {
      setDone(row);
      setSelected(null);
      setChecked(new Set());
      setNote("");
      setQuery("");
      setResult(null);
      onDone(row.unit_code);
    }
  };

  const toggle = (id: ChecklistId) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
  };

  const matches = result && "data" in result ? result.data.matches : [];
  const cert = result && "data" in result ? result.data.certificate : null;

  return (
    <section className="rc-section rc-fast" id="rc-fast" aria-labelledby="rc-fast-title">
      <SectionHead
        eyebrow="گیت ورودی و احراز هویت"
        id="rc-fast-title"
        title="میز پذیرش سریع و تحویل کلید"
        aside={
          <>
            <span className="rc-muted rc-hide-sm">اسکن بارکدخوان یا جست‌وجوی دستی شناسهٔ گواهی</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => open({ kind: "create", unit: null })}>
              <Icon name="calendar-plus" size={16} /> زائر بی‌نوبت؟ ثبت نوبت حضوری
            </button>
          </>
        }
      />

      <form
        className="rc-scanbar"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          void search(query);
        }}
      >
        <label className="rc-scanbar__input">
          <span className="sr-only">ورودی اسکنر یا جست‌وجوی دستی</span>
          <Icon name="qr" size={20} />
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => {
              const v = e.target.value;
              setQuery(v);
              // بارکدخوان‌ها کل رشته را یک‌جا «تایپ» می‌کنند ⇒ ورودی کامل بی‌نیاز از Enter جست‌وجو می‌شود.
              if (v.length - query.length > 6 && isCompleteScan(v)) void search(v);
            }}
            placeholder="پیوند گواهی (QR)، کد رزرو، کد ۸ نویسه‌ای آفلاین، کد ملی یا نام زائر…"
            aria-describedby={resultsId}
          />
          {busy ? <span className="rc-spinner" aria-hidden="true" /> : null}
        </label>
        <button type="button" className="btn btn-primary" onClick={() => setCamera(true)}>
          <Icon name="camera" size={18} /> <span>اسکن QR با دوربین</span>
        </button>
        <button type="submit" className="btn btn-secondary" disabled={!query.trim() || busy}>
          <Icon name="search" size={18} /> <span>استعلام و فراخوانی</span>
        </button>
      </form>

      <div id={resultsId} className="rc-fast__results" aria-live="polite">
        {done ? (
          <Notice tone="success" icon="check">
            <strong>پذیرش {done.guest_name || "زائر"} ثبت شد.</strong> کلید {done.unit_title} (
            <Latin>{done.unit_code}</Latin>) تحویل شد و رویداد در دفتر شیفت ثبت گردید.
          </Notice>
        ) : null}
        {result && "error" in result ? (
          <Notice tone="danger" icon="alert">
            {result.error}
          </Notice>
        ) : null}
        {result && "data" in result ? (
          <>
            {cert ? (
              cert.valid ? (
                <Notice tone="success" icon="shield-check">
                  <strong>گواهی معتبر است</strong> — امضای دیجیتال سرور تأیید شد و با رزرو جاری مطابقت دارد.
                </Notice>
              ) : (
                <Notice tone="danger" icon="alert">
                  <strong>{cert.mismatch ? "گواهی با وضعیت فعلی رزرو مطابقت ندارد" : "گواهی معتبر نیست"}</strong> —{" "}
                  {cert.error || "امضا یا محتوای گواهی پذیرفته نشد."} مدارک را با دقت بیشتری بررسی کنید.
                </Notice>
              )
            ) : null}
            {matches.length === 0 && result.data.kind !== "empty" ? (
              <Notice tone="amber" icon="search">
                برای «<bdi>{result.query}</bdi>» ({result.data.kind_label}) نوبت فعالی در بازهٔ پذیرش پیدا نشد.
              </Notice>
            ) : null}
            {matches.length > 1 ? (
              <div className="rc-matches">
                <p className="rc-matches__title">
                  {faDigits(matches.length)} نوبت با «{result.data.kind_label}» پیدا شد؛ نوبت درست را انتخاب کنید:
                </p>
                <ul aria-label={`${faDigits(matches.length)} نتیجه`}>
                  {matches.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        className="rc-match"
                        aria-pressed={row?.id === m.id}
                        onClick={() => choose(m)}
                      >
                        <UnitBadge code={m.unit_code} size="sm" />
                        <span className="rc-match__body">
                          <strong>{m.guest_name || "زائر"}</strong>
                          <span>
                            <bdi>{m.desk.start_label}</bdi> · {faDigits(m.guests_count)} نفر
                          </span>
                        </span>
                        <LanePill row={m} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      <div className="rc-dossier" data-empty={row ? undefined : true}>
        <div className="rc-dossier__col">
          <h3>
            <Icon name="user" size={18} /> مشخصات زائر و نوبت اقامت
          </h3>
          {row ? (
            <>
              <dl className="rc-dossier__grid">
                <Info label="نام و نام خانوادگی زائر">
                  <strong>{row.guest_name || "—"}</strong>
                </Info>
                <Info label="شهر مبدأ">{row.desk.guest_city || "—"}</Info>
                <Info label="تعداد زائران">{faDigits(row.guests_count)} نفر</Info>
                <Info label={row.desk.guest_document || "کد ملی"}>
                  <Latin>{row.desk.guest_national_id_masked || "—"}</Latin>
                </Info>
                <Info label="شمارهٔ همراه">
                  <button
                    type="button"
                    className="rc-lock"
                    onClick={() => open({ kind: "dossier", row })}
                    title="نمایش شمارهٔ کامل با تأیید تازه و ثبت هدف"
                  >
                    <Icon name="lock" size={14} />
                    <Latin>{row.guest_phone_masked}</Latin>
                  </button>
                </Info>
                <Info label="کد کوتاه گواهی">
                  <Latin>
                    <strong className="rc-brand-ink">{row.desk.short_code}</strong>
                  </Latin>
                </Info>
              </dl>
              <div className="rc-dossier__meta">
                <LanePill row={row} />
                <span>
                  کد رزرو <Latin>{row.code}</Latin>
                </span>
                <span>
                  <bdi>{row.desk.start_label}</bdi> تا <bdi>{row.desk.end_label}</bdi>
                </span>
                {row.expected_arrival ? <span>رسیدن اعلامی: {faDigits(row.expected_arrival.slice(0, 5))}</span> : null}
                {row.vehicle_plate ? <span>پلاک: {row.vehicle_plate}</span> : null}
              </div>
              {row.guest_note ? (
                <p className="rc-dossier__note">
                  <Icon name="message" size={16} /> یادداشت زائر: {row.guest_note}
                </p>
              ) : null}
            </>
          ) : (
            <p className="rc-dossier__placeholder">
              <Icon name="scan" size={22} />
              <span>
                گواهی زائر را اسکن کنید یا کد رزرو، کد ۸ نویسه‌ای آفلاین یا کد ملی سرپرست را بنویسید؛ پرونده همین‌جا باز
                می‌شود.
              </span>
            </p>
          )}
        </div>

        <div className="rc-dossier__col">
          <h3>
            <Icon name="check" size={18} /> چک‌لیست تحویل
            {row ? (
              <>
                {" "}
                <UnitBadge code={row.unit_code} size="sm" /> — {row.unit_title}
              </>
            ) : (
              " واحد"
            )}
          </h3>
          <fieldset className="rc-checklist" disabled={!row || blocker !== null}>
            <legend className="sr-only">بندهای اجباری پیش از تحویل کلید</legend>
            {CHECKLIST.map((c) => (
              <label key={c.id} className="rc-check rc-check--card">
                <input type="checkbox" checked={checked.has(c.id)} onChange={() => toggle(c.id)} />
                <span>
                  <strong>{c.text}</strong>
                  <small>{c.hint}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <label className="rc-field" htmlFor={noteId}>
            <span className="field-label">یادداشت پذیرش (اختیاری)</span>
            <input
              id={noteId}
              className="text-input"
              value={note}
              maxLength={200}
              onChange={(e) => setNote(e.target.value)}
              disabled={!row || blocker !== null}
              placeholder="مثلاً: یک همراه فردا صبح می‌رسد"
            />
          </label>
          {row && blocker ? (
            <Notice tone="amber" icon="clock">
              {blocker}
            </Notice>
          ) : null}
          <button
            type="button"
            className="btn btn-primary btn-lg btn-block rc-finalize"
            disabled={!ready}
            onClick={() => void finalize()}
          >
            <Icon name="key" size={20} />
            <span>
              {row && !blocker && checked.size < CHECKLIST.length
                ? `تکمیل چک‌لیست (${faDigits(checked.size)} از ${faDigits(CHECKLIST.length)})`
                : "تکمیل پذیرش و ثبت تحویل کلید به زائر"}
            </span>
          </button>
        </div>
      </div>

      <AppDialog
        isOpen={camera}
        onOpenChange={setCamera}
        title="اسکن QR گواهی زائر"
        subtitle="دوربین را روی کد QR برگهٔ گواهی یا گوشی زائر بگیرید."
        size="md"
        className="rc-camera"
      >
        {camera ? (
          <QrScanner
            onDetect={(text) => {
              setCamera(false);
              setQuery(text);
              void search(text);
            }}
            onPaste={() => {
              setCamera(false);
              inputRef.current?.focus();
            }}
            checking={busy}
          />
        ) : null}
      </AppDialog>
    </section>
  );
}
