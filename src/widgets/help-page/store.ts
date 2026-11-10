"use client";
import { useSyncExternalStore } from "react";
import { readStorage, writeStorage } from "@/shared/lib/storage";
import { INITIAL_STATE, readState, writeState, type HelpState } from "./model";

/**
 * حالت صفحهٔ راهنما — فروشگاه بیرونی کوچک (الگوی P-02): جست‌وجو و دسته در نشانی‌اند (‎?q=&cat=‎، قابل
 * اشتراک و هم‌نام با SSR قدیمی)؛ پرسش‌های باز فقط در حافظه‌اند مگر با پیوند ‎#item-slug‎ آمده باشند.
 */
type Listener = () => void;
let state: HelpState = INITIAL_STATE;
let hydrated = false;
const listeners = new Set<Listener>();
let timer: ReturnType<typeof setTimeout> | undefined;

function persist(s: HelpState) {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const next = writeState(s, window.location.href);
    if (next !== window.location.href) window.history.replaceState(window.history.state, "", next);
  }, 250);
}

const emit = () => {
  for (const l of listeners) l();
};

export const helpStore = {
  get: () => state,
  set(patch: Partial<HelpState> | ((s: HelpState) => Partial<HelpState>)) {
    const next = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
    if (next.q === state.q && next.cat === state.cat && next.open === state.open) return;
    const urlChanged = next.q !== state.q || next.cat !== state.cat;
    state = next;
    if (urlChanged) persist(state);
    emit();
  },
  toggle(slug: string, open: boolean) {
    helpStore.set((s) => {
      const has = s.open.includes(slug);
      if (has === open) return {};
      return { open: open ? [...s.open, slug] : s.open.filter((x) => x !== slug) };
    });
  },
  subscribe(l: Listener) {
    if (!hydrated && typeof window !== "undefined") {
      hydrated = true;
      state = readState(window.location.search, window.location.hash);
      queueMicrotask(emit);
    }
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useHelpState(): HelpState {
  return useSyncExternalStore(helpStore.subscribe, helpStore.get, () => INITIAL_STATE);
}

// ─── رأی «مفید بود؟» — یک رأی برای هر پرسش در هر مرورگر ──────────────────────
export type Vote = "yes" | "no";
const VOTES_KEY = "mahdieh-help-votes";
let votes: Record<string, Vote> | null = null;
const voteListeners = new Set<Listener>();
const EMPTY: Record<string, Vote> = {};

function loadVotes(): Record<string, Vote> {
  if (votes) return votes;
  try {
    const raw = JSON.parse(readStorage(VOTES_KEY) ?? "{}") as unknown;
    votes =
      raw && typeof raw === "object"
        ? Object.fromEntries(
            Object.entries(raw as Record<string, unknown>).filter(
              (e): e is [string, Vote] => e[1] === "yes" || e[1] === "no",
            ),
          )
        : {};
  } catch {
    votes = {};
  }
  return votes;
}

export const voteStore = {
  get: () => loadVotes(),
  record(slug: string, vote: Vote) {
    votes = { ...loadVotes(), [slug]: vote };
    writeStorage(VOTES_KEY, JSON.stringify(votes));
    for (const l of voteListeners) l();
  },
  subscribe(l: Listener) {
    voteListeners.add(l);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== VOTES_KEY) return;
      votes = null;
      l();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      voteListeners.delete(l);
      window.removeEventListener("storage", onStorage);
    };
  },
};

export function useVotes(): Record<string, Vote> {
  return useSyncExternalStore(voteStore.subscribe, voteStore.get, () => EMPTY);
}
