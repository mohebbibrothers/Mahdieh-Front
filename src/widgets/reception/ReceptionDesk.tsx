"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { logout } from "@/shared/api/auth";
import { deskQuery, isMfaGate, mfaStatusQuery, type Desk, type DeskRow } from "@/shared/api/desk";
import { sessionQuery } from "@/shared/api/queries";
import { useHydratedNow } from "@/shared/lib/use-clock";
import { useOnline } from "@/shared/lib/use-online";
import { Icon } from "@/shared/ui/Icon";
import { toast } from "@/shared/ui/toast";
import { CommandDeck } from "./CommandDeck";
import {
  BlockDialog,
  CancelDialog,
  CheckoutDialog,
  CompleteDialog,
  CreateDialog,
  HousekeepingDialog,
  MoveDialog,
  NoShowDialog,
  NoteDialog,
  UnblockDialog,
} from "./Dialogs";
import { FastCheckin } from "./FastCheckin";
import { DossierDialog, ExportDialog, RecoveryDialog, SopDrawer, WaitlistDialog } from "./InfoDialogs";
import { AuditTrail, Ledger } from "./Ledger";
import { MfaGate } from "./MfaGate";
import { agoLabel, type BoardFilter } from "./model";
import { Notice } from "./parts";
import { DeskRuntimeProvider, errorText } from "./runtime";
import type { DeskDialog } from "./types";
import { KpiStrip, UnitBoard } from "./UnitBoard";

const FLASH_MS = 2_400;

/**
 * P-06 میز پذیرش خادمان — فقط کارکنان (سرور برای دیگران ‎404‎ واقعی می‌دهد).
 * ترتیب نگهبان‌ها: نشست ⇒ عامل دوم (دروازهٔ تمام‌صفحه) ⇒ تصویر زندهٔ میز با نظرسنجی ‎poll_seconds‎.
 */
export function Reception() {
  return (
    <DeskRuntimeProvider>
      <ReceptionGate />
    </DeskRuntimeProvider>
  );
}

function ReceptionGate() {
  const params = useSearchParams();
  const session = useQuery(sessionQuery);
  const mfa = useQuery({ ...mfaStatusQuery, enabled: Boolean(session.data?.profile?.is_staff_member) });
  const staff = session.data?.profile?.is_staff_member === true;
  // ‎hold‎: پس از ثبت TOTP، دروازه تا ذخیرهٔ کدهای بازیابی باز نمی‌شود (حتی با نظرسنجی تازهٔ وضعیت).
  const [hold, setHold] = useState(false);
  const gated = hold || (mfa.data ? mfa.data.required && !mfa.data.verified : false);
  const desk = useQuery({ ...deskQuery, enabled: staff && Boolean(mfa.data) && !gated });

  if (session.isPending || (staff && mfa.isPending)) return <DeskSkeleton />;
  if (!staff) {
    return (
      <div className="rc-locked">
        <Icon name="lock" size={28} />
        <h1>این بخش ویژهٔ خادمان پیشخوان است</h1>
        <p>برای ادامه با حساب کارمندی وارد شوید.</p>
        <Link className="btn btn-primary" href="/">
          بازگشت به صفحهٔ نخست
        </Link>
      </div>
    );
  }
  if (mfa.data && (gated || isMfaGate(desk.error))) {
    return (
      <MfaGate
        status={mfa.data}
        name={session.data?.profile?.first_name || "خادم"}
        next={params.get("next")}
        onHold={setHold}
      />
    );
  }
  if (desk.data) return <ReceptionDesk desk={desk.data} />;
  if (desk.isError) {
    return (
      <div className="rc-locked">
        <Icon name="alert" size={28} />
        <h1>تصویر پیشخوان بارگذاری نشد</h1>
        <p>{errorText(desk.error)}</p>
        <button type="button" className="btn btn-primary" onClick={() => void desk.refetch()}>
          <Icon name="refresh" size={18} /> تلاش دوباره
        </button>
      </div>
    );
  }
  return <DeskSkeleton />;
}

function DeskSkeleton() {
  return (
    <div className="rc-skeleton-page" aria-busy="true" aria-label="در حال آماده‌سازی پیشخوان">
      <div className="skeleton rc-sk-hero" />
      <div className="rc-sk-kpis">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton rc-sk-kpi" />
        ))}
      </div>
      <div className="rc-sk-board">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton rc-sk-unit" />
        ))}
      </div>
    </div>
  );
}

function ReceptionDesk({ desk: initial }: { desk: Desk }) {
  const qc = useQueryClient();
  const online = useOnline();
  const now = useHydratedNow(5_000);
  const live = useQuery({
    ...deskQuery,
    initialData: initial,
    refetchInterval: online ? Math.max(10, initial.poll_seconds) * 1000 : false,
  });
  const desk = live.data;
  const [filter, setFilter] = useState<BoardFilter>(null);
  const [dialog, setDialog] = useState<DeskDialog | null>(null);
  const [checkin, setCheckin] = useState<{ row: DeskRow | null; key: number }>({ row: null, key: 0 });
  const [highlight, setHighlight] = useState<string | null>(null);
  const scanner = useRef<HTMLInputElement>(null);
  const flashTimer = useRef<number | null>(null);

  const flash = (code: string) => {
    setHighlight(code);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setHighlight(null), FLASH_MS);
    const el = document.getElementById(`rc-unit-${code}`);
    el?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
    });
  };

  const focusScanner = () => {
    document.getElementById("rc-fast")?.scrollIntoView({ block: "start", behavior: "smooth" });
    scanner.current?.focus({ preventScroll: true });
  };

  const startCheckIn = (row: DeskRow) => {
    setDialog(null);
    setCheckin((c) => ({ row, key: c.key + 1 }));
    requestAnimationFrame(() =>
      document.getElementById("rc-fast")?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );
  };

  const onShortcut = useEffectEvent((e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    const typing = t?.closest("input, textarea, [contenteditable='true']");
    if (dialog || typing) return;
    if (e.key === "/" || e.key === "F2") {
      e.preventDefault();
      focusScanner();
    }
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => onShortcut(e);
    window.addEventListener("keydown", h);
    return () => {
      window.removeEventListener("keydown", h);
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    };
  }, []);

  const onLogout = async () => {
    try {
      await logout();
    } catch {
      /* نشست سمت سرور به هر حال منقضی می‌شود */
    }
    qc.clear();
    toast("از پیشخوان خارج شدید.", "info");
    // بارگذاری کامل و جایگزینی تاریخچه: هیچ دادهٔ زائری در حافظه نمی‌ماند و «بازگشت» به میز برنمی‌گردد.
    window.location.replace("/");
  };

  const close = () => setDialog(null);
  const updatedLabel = now ? agoLabel(new Date(live.dataUpdatedAt).toISOString(), now) : "به‌روز";

  return (
    <div className="rc-page" data-offline={online ? undefined : true}>
      {!online ? (
        <Notice tone="amber" icon="alert">
          اتصال شبکهٔ پیشخوان قطع است؛ تصویر آخرین وضعیت ({updatedLabel}) نمایش داده می‌شود و کنش‌ها تا برقراری اتصال
          ثبت نمی‌شوند.
        </Notice>
      ) : live.isRefetchError ? (
        <Notice tone="amber" icon="refresh">
          به‌روزرسانی خودکار ناموفق بود ({errorText(live.error)})؛ چند ثانیهٔ دیگر دوباره تلاش می‌شود.
        </Notice>
      ) : null}

      <CommandDeck desk={desk} open={setDialog} onKey={flash} onLogout={() => void onLogout()} />
      <KpiStrip desk={desk} filter={filter} onFilter={setFilter} />
      <UnitBoard
        desk={desk}
        filter={filter}
        onClearFilter={() => setFilter(null)}
        open={setDialog}
        onCheckIn={startCheckIn}
        onFocusScanner={focusScanner}
        onRefresh={() => void live.refetch()}
        refreshing={live.isFetching}
        updatedLabel={updatedLabel}
        highlight={highlight}
      />
      <FastCheckin
        key={checkin.key}
        desk={desk}
        initial={checkin.row}
        inputRef={scanner}
        open={setDialog}
        onDone={flash}
      />
      <div className="rc-lower">
        <Ledger desk={desk} open={setDialog} onCheckIn={startCheckIn} />
        <AuditTrail events={desk.events} onUnit={flash} />
      </div>

      <DialogHost dialog={dialog} desk={desk} close={close} open={setDialog} onCheckIn={startCheckIn} />
    </div>
  );
}

function DialogHost({
  dialog,
  desk,
  close,
  open,
  onCheckIn,
}: {
  dialog: DeskDialog | null;
  desk: Desk;
  close: () => void;
  open: (d: DeskDialog) => void;
  onCheckIn: (row: DeskRow) => void;
}) {
  if (!dialog) return null;
  switch (dialog.kind) {
    case "checkout":
      return <CheckoutDialog key={dialog.row.id} row={dialog.row} desk={desk} close={close} />;
    case "housekeeping":
      return <HousekeepingDialog key={dialog.unit.code} unit={dialog.unit} desk={desk} close={close} />;
    case "complete":
      return <CompleteDialog key={dialog.unit.code} unit={dialog.unit} close={close} />;
    case "block":
      return <BlockDialog key={dialog.unit.code} unit={dialog.unit} desk={desk} close={close} />;
    case "unblock":
      return <UnblockDialog key={dialog.unit.code} unit={dialog.unit} close={close} />;
    case "noshow":
      return <NoShowDialog key={dialog.row.id} row={dialog.row} close={close} />;
    case "cancel":
      return <CancelDialog key={dialog.row.id} row={dialog.row} desk={desk} close={close} />;
    case "note":
      return <NoteDialog key={dialog.row.id} row={dialog.row} close={close} />;
    case "move":
      return <MoveDialog key={dialog.row.id} row={dialog.row} desk={desk} close={close} />;
    case "dossier":
      return <DossierDialog key={dialog.row.id} row={dialog.row} open={open} onCheckIn={onCheckIn} close={close} />;
    case "waitlist":
      return <WaitlistDialog close={close} />;
    case "export":
      return <ExportDialog desk={desk} close={close} />;
    case "create":
      return <CreateDialog unit={dialog.unit} desk={desk} close={close} />;
    case "sop":
      return <SopDrawer desk={desk} close={close} />;
    case "recovery":
      return <RecoveryDialog remaining={desk.mfa.recovery_codes_remaining} close={close} />;
  }
}
