import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { UserPlus, KeyRound, ShieldCheck, Users, ScrollText } from "lucide-react";
import type { Role } from "@masar/shared";
import { getUsers, getAuditLogs, createUser, changePassword, changeRole } from "@/lib/resources-api";
import { Combobox, type ComboOption } from "@/components/ui/Combobox";
import { useAuth } from "@/app/auth-context";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { Tabs } from "@/components/ui/Tabs";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Overlay";
import { Badge } from "@/components/ui/Status";
import Pagination from "@/components/ui/Pagination";
import { AccountForm } from "@/components/forms/AccountForm";
import { useFeedback } from "@/components/ui/feedback-context";
import { errorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format-date";
import { ROLE_LABELS } from "@/lib/roles";
import type { UserRow, AuditEventRow } from "@/lib/types";

const ACTIONS: Record<string, string> = {
  CREATE_USER: "إضافة مستخدم",
  CHANGE_PASSWORD: "تعيين كلمة مرور",
  CHANGE_OWN_PASSWORD: "تغيير كلمة المرور",
  CHANGE_ROLE: "تغيير الدور",
  CREATE: "إضافة",
  UPDATE: "تعديل",
  STATUS_CHANGE: "تغيير حالة شحنة",
  DELETE: "حذف",
  RENAME: "تغيير الاسم",
  ROTATE_API_KEY: "تغيير مفتاح API",
  REVOKE_API_KEY: "إلغاء مفتاح API",
  UPDATE_SETTINGS: "تعديل الإعدادات",
  UPDATE_ZONE_PRICES: "تعديل أسعار التاجر",
  CREATE_ZONE: "إضافة منطقة شحن",
  UPDATE_ZONE: "تعديل منطقة شحن",
  DELETE_ZONE: "حذف منطقة شحن",
};
const ENTITIES: Record<string, string> = { user: "مستخدم", order: "شحنة", merchant: "تاجر", courier: "مندوب", settings: "الإعدادات", zone: "منطقة شحن" };
const ENTITY_OPTIONS = Object.entries(ENTITIES).map(([value, label]) => ({ value, label }));
const ROLE_TONE: Record<Role, "info" | "ok" | "neutral" | "warn"> = { owner: "warn", admin: "info", employee: "neutral", courier: "ok", merchant: "neutral" };

type Dialog = { kind: "add" } | { kind: "password"; user: UserRow } | { kind: "role"; user: UserRow } | null;

export default function UsersPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "audit" ? "audit" : "team";
  return (
    <>
      <PageHeader title="المستخدمون والسجل" description="فريق الشركة وحسابات المناديب والتجار، وسجل كل تعديل حساس." />
      <Tabs
        className="mb-5"
        value={tab}
        onChange={(t) => setParams({ tab: t })}
        tabs={[
          { value: "team", label: "المستخدمون" },
          { value: "audit", label: "سجل التعديلات" },
        ]}
      />
      {tab === "team" ? <Team /> : <Audit />}
    </>
  );
}

function Team() {
  const { user: me } = useAuth();
  const { toast } = useFeedback();
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    getUsers().then(setUsers).catch((err) => toast(errorMessage(err), "danger"));
  }, [reloadKey, toast]);

  return (
    <>
      <Panel title="المستخدمون" action={<Button size="sm" icon={<UserPlus className="size-4" />} onClick={() => setDialog({ kind: "add" })}>موظف جديد</Button>}>
        <DataTable
          caption="المستخدمون"
          loading={!users}
          rows={users ?? []}
          rowKey={(u) => u.id}
          columns={[
            { key: "email", header: "البريد الإلكتروني", primary: true, cell: (u) => <span dir="ltr" className="font-medium text-ink">{u.email}</span> },
            { key: "role", header: "الدور", cell: (u) => <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role]}</Badge> },
            { key: "pw", header: "كلمة المرور", cell: (u) => (u.mustChangePassword ? <Badge tone="warn">مؤقتة</Badge> : <span className="text-ink-3">مُعيّنة</span>) },
          ]}
          rowActions={(u) =>
            u.id !== me?.id &&
            !["courier", "merchant"].includes(u.role) &&
            (u.role !== "owner" || me?.role === "owner") && (
              <div className="flex gap-1">
                <Button variant="quiet" size="sm" icon={<KeyRound className="size-4" />} onClick={() => setDialog({ kind: "password", user: u })}>
                  كلمة مرور
                </Button>
                <Button variant="quiet" size="sm" icon={<ShieldCheck className="size-4" />} onClick={() => setDialog({ kind: "role", user: u })}>
                  الدور
                </Button>
              </div>
            )
          }
          empty={{ icon: <Users />, title: "لا يوجد مستخدمون" }}
        />
      </Panel>

      <Modal open={dialog?.kind === "add"} onClose={() => setDialog(null)} title="موظف جديد" description="يدخل الموظف بكلمة مرور مؤقتة ويغيّرها عند أول دخول.">
        <AccountForm
          submitLabel="إضافة الموظف"
          onSubmit={async (email, password) => {
            await createUser({ email, password, role: "employee" });
            toast(`تمت إضافة ${email}`);
            setDialog(null);
            reload();
          }}
        />
      </Modal>
      {dialog?.kind === "password" && <PasswordDialog user={dialog.user} onClose={() => setDialog(null)} onDone={reload} />}
      {dialog?.kind === "role" && <RoleDialog user={dialog.user} canGrantOwner={me?.role === "owner"} onClose={() => setDialog(null)} onDone={reload} />}
    </>
  );
}

function PasswordDialog({ user, onClose, onDone }: { user: UserRow; onClose(): void; onDone(): void }) {
  const { toast } = useFeedback();
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await changePassword(user.id, password);
      toast("تم تعيين كلمة مرور مؤقتة؛ سيُطلب تغييرها عند الدخول");
      onDone();
      onClose();
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={`كلمة مرور مؤقتة: ${user.email}`} description="سيُسجَّل خروج المستخدم من كل الأجهزة.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="كلمة المرور المؤقتة" hint="10 أحرف على الأقل، وتحتوي على حروف وأرقام">{(p) => <Input {...p} dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />}</Field>
        <Button type="submit" loading={saving} className="w-full">
          تعيين
        </Button>
      </form>
    </Modal>
  );
}

function RoleDialog({ user, canGrantOwner, onClose, onDone }: { user: UserRow; canGrantOwner: boolean; onClose(): void; onDone(): void }) {
  const { toast } = useFeedback();
  const [role, setRole] = useState<Role>(user.role);
  const [saving, setSaving] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await changeRole(user.id, role);
      toast("تم تغيير الدور");
      onDone();
      onClose();
    } catch (err) {
      toast(errorMessage(err), "danger");
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={`دور ${user.email}`} description="يُطبَّق فورًا ويُسجَّل خروج المستخدم من الأجهزة الأخرى.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="الدور" hint="المدير يدير كل شيء عدا حسابات المالكين. الموظف يدير الشحنات فقط.">
          {(p) => (
            <Select {...p} value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="employee">موظف</option>
              <option value="admin">مدير</option>
              {canGrantOwner && <option value="owner">مالك</option>}
            </Select>
          )}
        </Field>
        <Button type="submit" loading={saving} className="w-full" disabled={role === user.role}>
          حفظ الدور
        </Button>
      </form>
    </Modal>
  );
}

function Audit() {
  const { toast } = useFeedback();
  const [page, setPage] = useState(1);
  const [actor, setActor] = useState("");
  const [entity, setEntity] = useState("");
  const [users, setUsers] = useState<ComboOption[]>([]);
  const [result, setResult] = useState<{ items: AuditEventRow[]; pages: number } | null>(null);
  useEffect(() => {
    getUsers()
      .then((list) => setUsers(list.map((u) => ({ value: u.id, label: u.email, hint: ROLE_LABELS[u.role] }))))
      .catch(() => setUsers([]));
  }, []);
  useEffect(() => {
    getAuditLogs({ page, limit: 25, actor, entity })
      .then(({ data, meta }) => setResult({ items: data, pages: meta.pages }))
      .catch((err) => toast(errorMessage(err), "danger"));
  }, [page, actor, entity, toast]);

  return (
    <Panel>
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:max-w-2xl">
        <Combobox value={actor} onChange={(v) => { setActor(v); setPage(1); }} options={users} placeholder="كل المستخدمين" emptyText="لا يوجد مستخدم بهذا البريد" aria-label="المستخدم" />
        <Combobox value={entity} onChange={(v) => { setEntity(v); setPage(1); }} options={ENTITY_OPTIONS} placeholder="كل الأنواع" aria-label="نوع السجل" />
      </div>
      <DataTable
        caption="سجل التعديلات"
        loading={!result}
        rows={result?.items ?? []}
        rowKey={(e) => e._id}
        columns={[
          { key: "action", header: "العملية", primary: true, cell: (e) => <span className="font-medium text-ink">{ACTIONS[e.action] ?? e.action}</span> },
          { key: "entity", header: "على", cell: (e) => <span className="text-ink-2">{ENTITIES[e.entity] ?? e.entity} <span dir="auto" className="num">{e.label}</span></span> },
          { key: "actor", header: "بواسطة", cell: (e) => <span dir="ltr" className="text-ink-2">{e.actor?.email ?? "الربط مع التاجر"}</span> },
          { key: "at", header: "الوقت", cell: (e) => <span className="num text-ink-3">{formatDateTime(e.createdAt)}</span> },
        ]}
        empty={{ icon: <ScrollText />, title: "لا توجد تعديلات مسجلة بعد" }}
      />
      <Pagination page={page} pages={result?.pages ?? 0} onChange={setPage} />
    </Panel>
  );
}
