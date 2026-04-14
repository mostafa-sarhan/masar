import React, { useEffect, useState } from "react";

const BASE_URL = "https://sys-shipping-backend.onrender.com";

export default function Employee() {
  const [employees, setEmployees] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [editEmail, setEditEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [roleEmail, setRoleEmail] = useState("");
  const [newRole, setNewRole] = useState("user");

  const [auditLogs, setAuditLogs] = useState([]);

  const token = localStorage.getItem("token");

  // ======== CHECK TOKEN ========
  useEffect(() => {
    if (!token) {
      alert("لازم تسجل دخول الأول ❌");
    }
  }, []);

  // ======== HELPER FETCH ========
  const fetchWithToken = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("SERVER ERROR:", data);
      throw new Error(data.message || "Server error");
    }

    return data;
  };

  // ======== LOAD DATA ========
  const loadEmployees = async () => {
    try {
      const data = await fetchWithToken(`${BASE_URL}/users`);
      setEmployees(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await fetchWithToken(`${BASE_URL}/users/auditlogs`);
      setAuditLogs(data);
    } catch (err) {
      console.log(err.message);
    }
  };

  useEffect(() => {
    loadEmployees();
    loadAuditLogs();
  }, []);

  // ======== ADD USER ========
  const handleAdd = async () => {
    if (!email || !password) return alert("املأ كل الحقول");

    try {
      const res = await fetchWithToken(`${BASE_URL}/users`, {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          role: "employee", // ✅ FIXED
        }),
      });

      console.log("ADD SUCCESS:", res);

      setEmail("");
      setPassword("");
      alert("تمت الإضافة ✅");

      loadEmployees();
    } catch (err) {
      alert("فشل الإضافة ❌: " + err.message);
    }
  };

  // ======== CHANGE PASSWORD ========
  const handleChangePassword = async () => {
    if (!editEmail || !newPassword)
      return alert("اختر الموظف وأدخل الباسورد");

    try {
      await fetchWithToken(`${BASE_URL}/users/password`, {
        method: "PUT",
        body: JSON.stringify({ email: editEmail, newPassword }),
      });

      setEditEmail("");
      setNewPassword("");
      alert("تم تغيير الباسورد ✅");

      loadAuditLogs();
    } catch (err) {
      alert("فشل ❌: " + err.message);
    }
  };

  // ======== CHANGE ROLE ========
  const handleChangeRole = async () => {
    if (!roleEmail || !newRole)
      return alert("اختر الموظف والدور");

    try {
      await fetchWithToken(`${BASE_URL}/users/role`, {
        method: "PUT",
        body: JSON.stringify({
          targetEmail: roleEmail,
          newRole,
        }),
      });

      setRoleEmail("");
      alert("تم تغيير الدور ✅");

      loadEmployees();
      loadAuditLogs();
    } catch (err) {
      alert("فشل ❌: " + err.message);
    }
  };

  return (
    <div className="p-6 space-y-10">

      {/* ADD */}
      <div className="border p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-3">➕ إضافة موظف</h2>

        <div className="flex gap-3 flex-wrap">
          <input
            type="email"
            placeholder="الإيميل"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="password"
            placeholder="الباسورد"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded"
          />

          <button
            onClick={handleAdd}
            className="bg-green-600 hover:bg-green-700 text-white px-4 rounded"
          >
            إضافة
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div>
        <h2 className="text-xl font-bold mb-3">📋 الموظفون</h2>

        <table className="w-full border text-center">
          <thead>
            <tr>
              <th className="p-2 border">الإيميل</th>
              <th className="p-2 border">الدور</th>
            </tr>
          </thead>

          <tbody>
            {employees.map((emp, i) => (
              <tr key={i}>
                <td className="p-2 border">{emp.email}</td>
                <td className="p-2 border">{emp.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CHANGE PASSWORD */}
      <div className="border p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-3">🔑 تغيير باسورد</h2>

        <div className="flex gap-3 flex-wrap">
          <select
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">اختر موظف</option>
            {employees.map((e, i) => (
              <option key={i} value={e.email}>
                {e.email}
              </option>
            ))}
          </select>

          <input
            type="password"
            placeholder="باسورد جديد"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border p-2 rounded"
          />

          <button
            onClick={handleChangePassword}
            className="bg-blue-600 text-white px-4 rounded"
          >
            تغيير
          </button>
        </div>
      </div>

      {/* CHANGE ROLE */}
      <div className="border p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-3">🛡️ تغيير الدور</h2>

        <div className="flex gap-3 flex-wrap">
          <select
            value={roleEmail}
            onChange={(e) => setRoleEmail(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">اختر موظف</option>
            {employees.map((e, i) => (
              <option key={i} value={e.email}>
                {e.email}
              </option>
            ))}
          </select>

          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="user">موظف</option>
            <option value="admin">أدمين</option>
          </select>

          <button
            onClick={handleChangeRole}
            className="bg-purple-600 text-white px-4 rounded"
          >
            تغيير
          </button>
        </div>
      </div>

    </div>
  );
}