import { useEffect, useState } from "react";
import { getOrders, type OrderFilters } from "../api/orders-api";
import type { Order, OrderPageMeta } from "@/lib/types";

type Paged = { items: Order[] } & OrderPageMeta;
const EMPTY: Paged = { items: [], total: 0, page: 1, pages: 0, totalCost: 0 };

// Loads one page of orders for `params`; refetches when params or `reloadKey` change.
export function usePagedOrders(params: OrderFilters, reloadKey = 0) {
  const key = JSON.stringify(params) + "#" + reloadKey;
  const [state, setState] = useState<{ key: string | null; data: Paged }>({ key: null, data: EMPTY });

  useEffect(() => {
    let cancelled = false;
    getOrders(JSON.parse(key.slice(0, key.lastIndexOf("#"))))
      .then(({ data, meta }) => !cancelled && setState({ key, data: { items: data, ...(meta as OrderPageMeta) } }))
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
