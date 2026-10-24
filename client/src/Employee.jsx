import React, { useEffect, useState } from "react";
import { getUsers, getAuditLogs, createUser, changePassword, changeRole } from "./services/resourcesApi";
import { errorMessage } from "./services/errors";
import { formatDate } from "./utils/dataUtils";
import Pagination from "./Pagination";

const ROLE_LABELS = { admin: "أدمين", employee: "موظف" };
const ACTION_LABELS = {
  CREATE_USER: "إضافة موظف",
  CHANGE_PASSWORD: "تغيير باسورد",
  CHANGE_ROLE: "تغيير الدور",
  CREATE: "إضافة",
  UPDATE: "تعديل",
  STATUS_CHANGE: "تغيير الحالة",
  DELETE: "حذف",
  RENAME: "تغيير الاسم",
  ROTATE_API_KEY: "تغيير مفتاح API",
  REVOKE_API_KEY: "إلغاء مفتاح API",
};
const ENTITY_LABELS = { user: "موظف", order: "شحنة", merchant: "تاجر", courier: "مندوب" };
const PASSWORD_HINT = "10 أحرف على الأقل، حروف وأرقام";

const describeChanges = (changes) =>
  Object.entries(changes || {})
    .filter(([field]) => field !== "order")
    .map(([field, { from, to }]) => `${field}: ${from ?? "-"} ← ${to ?? "-"}`)
    .join("، ");

export default function Employee() {
  const [employees, setEmployees] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [editId, setEditId] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [roleId, setRoleId] = useState("");
  const [newRole, setNewRole] = useState("employee");

  const [logs, setLogs] = useState({ items: [], page: 1, pages: 0 });
  const [logPage, setLogPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    getUsers().then(setEmployees).catch((err) => alert(errorMessage(err)));
  }, [reloadKey]);

  useEffect(() => {
    getAuditLogs({ page: logPage, limit: 20 })
      .then(({ data, meta }) => setLogs({ items: data, ...meta }))
      .catch((err) => console.error(err));
  }, [logPage, reloadKey]);

  const run = async (action, success) => {
    try {
      await action();
      alert(success);
      reload();
      return true;
    } catch (err) {
      alert("فشل ❌: " + errorMessage(err));
      return false;
    }
  };

  const handleAdd = async () => {
    if (!email || !password) return alert("املأ كل الحقول");
    if (await run(() => createUser({ email, password, role: "employee" }), "تمت الإضافة ✅")) {
      setEmail("");
      setPassword("");
    }
  };

  const handleChangePassword = async () => {
    if (!editId || !newPassword) return alert("اختر الموظف وأدخل الباسورد");
    if (await run(() => changePassword(editId, newPassword), "تم تغيير الباسورد ✅ (تم تسجيل خروج الموظف من كل الأجهزة)")) {
      setEditId("");
      setNewPassword("");
    }
  };

  const handleChangeRole = async () => {
    if (!roleId) return alert("اختر الموظف والدور");
    if (await run(() => changeRole(roleId, newRole), "تم تغيير الدور ✅")) setRoleId("");
  };

  const employeeSelect = (value, onChange) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="border p-2 rounded">
      <option value="">اختر موظف</option>
      {employees.map((e) => (
        <option key={e.id} value={e.id}>{e.email}</option>
      ))}
    </select>
  );

  return (
    <div className="p-6 space-y-10">
      {/* ADD */}
      <div className="border p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-3">➕ إضافة موظف</h2>
        <div className="flex gap-3 flex-wrap">
          <input type="email" placeholder="الإيميل" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 rounded" />
          <input type="password" placeholder={`الباسورد (${PASSWORD_HINT})`} value={password} onChange={(e) => setPassword(e.target.value)} className="border p-2 rounded min-w-[260px]" />
          <button onClick={handleAdd} className="bg-green-600 hover:bg-green-700 text-white px-4 rounded">إضافة</button>
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
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td className="p-2 border">{emp.email}</td>
                <td className="p-2 border">{ROLE_LABELS[emp.role] || emp.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CHANGE PASSWORD */}
      <div className="border p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-3">🔑 تغيير باسورد</h2>
        <div className="flex gap-3 flex-wrap">
          {employeeSelect(editId, setEditId)}
          <input type="password" placeholder={`باسورد جديد (${PASSWORD_HINT})`} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="border p-2 rounded min-w-[260px]" />
          <button onClick={handleChangePassword} className="bg-blue-600 text-white px-4 rounded">تغيير</button>
        </div>
      </div>

      {/* CHANGE ROLE */}
      <div className="border p-4 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-3">🛡️ تغيير الدور</h2>
        <div className="flex gap-3 flex-wrap">
          {employeeSelect(roleId, setRoleId)}
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="border p-2 rounded">
            <option value="employee">موظف</option>
            <option value="admin">أدمين</option>
          </select>
          <button onClick={handleChangeRole} className="bg-purple-600 text-white px-4 rounded">تغيير</button>
        </div>
      </div>

      {/* AUDIT LOG */}
      <div>
        <h2 className="text-xl font-bold mb-3">🧾 سجل التعديلات</h2>
        <table className="w-full border text-center">
          <thead>
            <tr>
              <th className="p-2 border">العملية</th>
              <th className="p-2 border">النوع</th>
              <th className="p-2 border">على</th>
              <th className="p-2 border">التغييرات</th>
              <th className="p-2 border">بواسطة</th>
              <th className="p-2 border">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {logs.items.map((log) => (
              <tr key={log._id}>
                <td className="p-2 border">{ACTION_LABELS[log.action] || log.action}</td>
                <td className="p-2 border">{ENTITY_LABELS[log.entity] || log.entity}</td>
                <td className="p-2 border">{log.label || "-"}</td>
                <td className="p-2 border text-sm" dir="auto">{describeChanges(log.changes) || "-"}</td>
                <td className="p-2 border">{log.actor?.email || "-"}</td>
                <td className="p-2 border">{formatDate(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination page={logPage} pages={logs.pages} onChange={setLogPage} />
      </div>
    </div>
  );
}
