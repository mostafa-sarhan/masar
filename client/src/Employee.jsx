import React, { useEffect, useState } from "react";
import { getUsers, getAuditLogs, createUser, changePassword, changeRole } from "./services/resourcesApi";
import { formatDate } from "./utils/dataUtils";

export default function Employee() {
  const [employees, setEmployees] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [editEmail, setEditEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [roleEmail, setRoleEmail] = useState("");
  const [newRole, setNewRole] = useState("employee");

  const [auditLogs, setAuditLogs] = useState([]);

  // ======== LOAD DATA ========
  const loadEmployees = async () => {
    try {
      const data = await getUsers();
      setEmployees(data);
    } catch (err) {
      alert(err.message);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await getAuditLogs();
      setAuditLogs(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  useEffect(() => {
    getUsers().then(setEmployees).catch((err) => alert(err.message));
    getAuditLogs().then(setAuditLogs).catch((err) => console.error(err.message));
  }, []);

  // ======== ADD USER ========
  const handleAdd = async () => {
    if (!email || !password) return alert("املأ كل الحقول");

    try {
      await createUser({ email, password, role: "employee" });

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
      await changePassword(editEmail, newPassword);

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
      await changeRole(roleEmail, newRole);

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
            <option value="employee">موظف</option>
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

      {/* AUDIT LOG */}
      <div>
        <h2 className="text-xl font-bold mb-3">🧾 سجل التعديلات</h2>

        <table className="w-full border text-center">
          <thead>
            <tr>
              <th className="p-2 border">العملية</th>
              <th className="p-2 border">الموظف</th>
              <th className="p-2 border">من</th>
              <th className="p-2 border">إلى</th>
              <th className="p-2 border">بواسطة</th>
              <th className="p-2 border">التاريخ</th>
            </tr>
          </thead>

          <tbody>
            {auditLogs.map((log) => (
              <tr key={log._id}>
                <td className="p-2 border">{log.action}</td>
                <td className="p-2 border">{log.targetUser}</td>
                <td className="p-2 border">{log.oldValue || "-"}</td>
                <td className="p-2 border">{log.newValue || "-"}</td>
                <td className="p-2 border">{log.changedBy}</td>
                <td className="p-2 border">{formatDate(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}