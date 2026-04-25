import { useCallback, useEffect, useState } from "react";
import { getBalance } from "../api/endpoints.js";
import { usePolling } from "./usePolling.js";

export function useBalance(hasToken) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    if (!hasToken) return;
    setErr(null);
    const { data: d } = await getBalance();
    setData(d);
  }, [hasToken]);

  useEffect(() => {
    void load();
  }, [load]);

  usePolling(load, 5000, hasToken);

  return { data, err, reload: load };
}
