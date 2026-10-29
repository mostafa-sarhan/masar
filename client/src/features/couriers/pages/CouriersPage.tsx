import { useEffect, useState, type FormEvent } from "react";
import { getCouriers, createCourier } from "@/lib/resources-api";
import type { Courier } from "@/lib/types";
import { createCourierAccount } from "@/lib/portals-api";
import { errorMessage } from "@/lib/errors";
import { promptAccount } from "@/lib/prompt-account";

// Courier records and their mobile-app logins (admins). Reports are under Reports > Couriers.
export default function Couriers() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [name, setName] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    getCouriers().then(setCouriers).catch((err) => alert(errorMessage(err)));
  }, [reloadKey]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createCourier(name.trim());
      setName("");
      reload();
    } catch (err) {
      alert("فشل إضافة المندوب: " + errorMessage(err));
    }
  };

  return (
    <div className="w-[98%] m-auto my-4 space-y-4">
      <h2 className="text-2xl font-bold">المناديب</h2>
      <form onSubmit={add} className="flex gap-3">
        <input required placeholder="اسم المندوب" value={name} onChange={(e) => setName(e.target.value)} className="border-2 rounded px-3 py-2" />
        <button className="bg-blue-500 text-white px-4 py-2 rounded">+ إضافة مندوب</button>
      </form>
      <table className="w-full border-collapse border border-gray-400 text-center">
        <thead><tr><th className="border p-2">المندوب</th><th className="border p-2">حساب تطبيق المندوب</th></tr></thead>
        <tbody>
          {couriers.map((c) => (
            <tr key={c._id}>
              <td className="border p-2">{c.name}</td>
              <td className="border p-2" dir="ltr">
                {c.account ?? (
                  <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={async () => (await promptAccount(c.name, (e, p) => createCourierAccount(c._id, e, p))) && reload()}>
                    إنشاء حساب
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
