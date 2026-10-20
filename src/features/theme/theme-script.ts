/**
 * اسکریپت مسدودکنندهٔ کوچک در <head> (پیش از نخستین رنگ‌آمیزی) ⇒ بدون «چشمک» تم.
 * postbuild به آن nonce=__CSP_NONCE__ می‌دهد و جنگو nonce واقعی هر پاسخ را جایگزین می‌کند.
 */
import { EASY_KEY, THEME_KEY } from "@/shared/config/keys";

export const THEME_BOOT = `(function(){try{var d=document.documentElement,s=localStorage,p=s.getItem("${THEME_KEY}");if(p!=="light"&&p!=="dark")p="system";var r=p==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p;d.setAttribute("data-theme",r);d.setAttribute("data-theme-pref",p);if(s.getItem("${EASY_KEY}")==="1")d.setAttribute("data-easy","true");document.addEventListener("DOMContentLoaded",function(){document.body.setAttribute("data-theme",r);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",r==="dark"?"#132823":"#f7f6f0")})}catch(e){}})();`;
