"use client";

import { useSyncExternalStore } from "react";

const QUERY_KEY = "gvision-leads-query";
const LEADS_PATH = "/leads";

// The leads list keeps its filters and sorting in the URL. Remember the last
// query per tab so links back to the list can return to the same view.
export function rememberLeadsQuery(query: string) {
  try {
    sessionStorage.setItem(QUERY_KEY, query);
  } catch {
    // sessionStorage unavailable — links fall back to the unfiltered list
  }
}

export function getLeadsHref() {
  try {
    const query = sessionStorage.getItem(QUERY_KEY);
    return query ? `${LEADS_PATH}?${query}` : LEADS_PATH;
  } catch {
    return LEADS_PATH;
  }
}

const subscribe = () => () => {};
const getServerHref = () => LEADS_PATH;

// Server render and hydration use the plain path, then the stored query is
// picked up on the client without a hydration mismatch.
export function useLeadsHref() {
  return useSyncExternalStore(subscribe, getLeadsHref, getServerHref);
}
