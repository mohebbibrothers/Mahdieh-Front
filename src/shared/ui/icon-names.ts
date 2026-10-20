// ⚠ تولید خودکار با scripts/build-icons.mjs — دستی ویرایش نکنید.
export const ICON_NAMES = ["accessibility","arrow-left","arrow-right","arrow-up-left","broom","building","calendar","calendar-check","calendar-x","certificate","check","chevron-down","clock","cloud-off","compass","heart-hand","home","info","list","lock","map-pin","menu","message","minus","moon","mouse-pointer","phone","plus","prayer","refresh","room","shield-check","sliders","snowflake","suite","sun","ticket","user","users","wifi","wifi-off","wrench","x"] as const;
export type IconName = (typeof ICON_NAMES)[number];
