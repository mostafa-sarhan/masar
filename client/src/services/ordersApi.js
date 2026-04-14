import { fetchWithAuth } from "./Api";

export const ORDERS_URL = "https://sys-shipping-backend.onrender.com/orders";

// ============================
// Get all orders
// ============================
export async function getData(setOrders) {
  const data = await fetchWithAuth(ORDERS_URL);
  const nonArchivedOrders = data.filter(order => !order.isArchived);
  setOrders(nonArchivedOrders);
}

// ============================
// Create new order
// ============================
export async function createOrder(orderData) {
  return fetchWithAuth(ORDERS_URL, {
    method: "POST",
    body: JSON.stringify(orderData),
  });
}

// ============================
// Delete order
// ============================
export async function handleDelete(id, setOrders) {
  const confirmDelete = window.confirm("هل انت متأكد من الحذف؟");
  if (!confirmDelete) return;

  await fetchWithAuth(`${ORDERS_URL}/${id}`, { method: "DELETE" });
  setOrders(prev => prev.filter(order => order._id !== id));
}

// ============================
// Update order
// ============================
export async function updateOrder(id, updatedOrder) {
  return fetchWithAuth(`${ORDERS_URL}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updatedOrder),
  });
}
