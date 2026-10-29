import { useState, type FormEvent } from "react";
import { errorMessage } from "@/lib/errors";

export const PASSWORD_HINT = "10 أحرف على الأقل، حروف وأرقام";

// Shared by the tenant app and the platform console. onSubmit(current, next) returns the new user/admin.
interface ChangePasswordFormProps<T> {
  title: string;
  note?: string;
  onSubmit(current: string, next: string): Promise<T>;
  onDone(result: T): void;
}

export default function ChangePasswordForm<T>({ title, note, onSubmit, onDone }: ChangePasswordFormProps<T>) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (next !== confirm) return setError("الباسورد الجديد غير متطابق");
    try {
      onDone(await onSubmit(current, next));
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const input = (placeholder: string, value: string, set: (v: string) => void) => (
    <input type="password" placeholder={placeholder} className="border p-1 rounded-lg my-2 w-[300px]" value={value} onChange={(e) => set(e.target.value)} required />
  );

  return (
    <div className="w-full flex justify-center items-center h-screen bg-main">
      <form onSubmit={submit} className="bg-amber-50 rounded-lg text-center p-4 m-2 flex flex-col text-black">
        <h1 className="text-xl font-bold mb-1">{title}</h1>
        {note && <p className="text-sm text-gray-600 mb-2">{note}</p>}
        {input("الباسورد الحالي", current, setCurrent)}
        {input(`الباسورد الجديد (${PASSWORD_HINT})`, next, setNext)}
        {input("تأكيد الباسورد الجديد", confirm, setConfirm)}
        {error && <p className="text-red-500 whitespace-pre-line">{error}</p>}
        <button type="submit" className="bg-black text-white rounded-lg py-1 mt-3">حفظ</button>
      </form>
    </div>
  );
}
