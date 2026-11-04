// Filters of the orders and archive lists (kept in the URL on the orders page).
export type Filters = {
  search: string;
  status: string;
  merchant: string;
  courier: string;
  governorate: string;
  zone: string;
  date: string;
};

export const EMPTY_FILTERS: Filters = { search: "", status: "", merchant: "", courier: "", governorate: "", zone: "", date: "" };
