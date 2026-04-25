import { useCallback, useEffect, useState } from "react";
import { getPayouts } from "../api/endpoints.js";
import { usePolling } from "./usePolling.js";

export function usePayouts(hasToken) {
  const [data, setData] = useState([]);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    if (!hasToken) return;
    setErr(null);
    const { data: d } = await getPayouts();
    setData(d);
  }, [hasToken]);

  useEffect(() => {
    void load();
  }, [load]);

  usePolling(load, 3000, hasToken);

  return { data, err, reload: load };
}
