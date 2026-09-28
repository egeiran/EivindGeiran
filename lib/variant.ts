"use client";

import { useEffect, useState } from "react";

/**
 * Midlertidig A/B-bryter for scrolleffektene: `?now=pin` eller `?gantt=auto` i
 * adressen velger en annen variant enn den første i lista. Adressen leses først
 * etter montering, så SSR og hydrering alltid er enige om standardvarianten.
 */
export function useQueryVariant<T extends string>(key: string, values: readonly T[]): T {
  const [value, setValue] = useState<T>(values[0]);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get(key);
    const hit = values.find((v) => v === q);
    if (hit) setValue(hit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return value;
}
