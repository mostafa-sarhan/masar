import { useEffect, useState } from "react";
import { getOrders } from "../services/ordersApi";

const EMPTY = { items: [], total: 0, page: 1, pages: 0, totalCost: 0 };

// Loads one page of orders for `params`; refetches when params or `reloadKey` change.
export function usePagedOrders(params, reloadKey = 0) {
  const key = JSON.stringify(params) + "#" + reloadKey;
  const [state, setState] = useState({ key: null, data: EMPTY });

  useEffect(() => {
    let cancelled = false;
    getOrders(JSON.parse(key.slice(0, key.lastIndexOf("#"))))
      .then((data) => !cancelled && setState({ key, data }))
      .catch((err) => {
        console.error(err);
        if (!cancelled) setState({ key, data: EMPTY });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { ...state.data, loading: state.key !== key };
}
