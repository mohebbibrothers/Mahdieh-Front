"use client";
import { useQuery } from "@tanstack/react-query";
import { meQuery } from "@/shared/api/queries";
import { AppDialog } from "@/shared/ui/Dialog";
import { AccountPanel } from "./AccountButton";
import { closeAccountSheet, useLoginState } from "./auth-store";
import { LoginDialog } from "./LoginDialog";

/** لایهٔ نشست — یک‌بار در هر صفحه: پنجرهٔ ورود + برگهٔ حساب (موبایل). */
export function SessionLayer() {
  const { account } = useLoginState();
  const me = useQuery(meQuery);
  const user = me.data;
  return (
    <>
      <LoginDialog />
      <AppDialog
        isOpen={account && Boolean(user)}
        onOpenChange={(o) => (o ? null : closeAccountSheet())}
        title="حساب من"
        size="sm"
        closeLabel="بستن حساب"
      >
        {user ? <AccountPanel user={user} onDone={closeAccountSheet} /> : null}
      </AppDialog>
    </>
  );
}
