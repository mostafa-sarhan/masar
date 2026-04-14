const API_URL = "https://sys-shipping-backend.onrender.com/auth";

export async function loginUser(email, password) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  console.log("LOGIN RESPONSE:", data); // 👈 مهم جدًا

  if (!res.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}