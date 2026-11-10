/** کپی امن (HTTPS ⇒ ‎Clipboard API‎؛ وگرنه ‎execCommand‎) با بازخورد «کپی شد». */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (window.isSecureContext && "clipboard" in navigator) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* ادامه با روش جایگزین */
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.className = "sr-only";
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}
