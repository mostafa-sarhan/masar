import { useState } from "react";
import { Link } from "react-router-dom";
import { Printer } from "lucide-react";
import type { CreateOrderInput } from "@masar/shared";
import { createOrder } from "../api/orders-api";
import OrderForm from "../components/OrderForm";
import { printLabel } from "../lib/print";
import { PageHeader, Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { useFeedback } from "@/components/ui/feedback-context";
import { errorMessage } from "@/lib/errors";
import type { Order } from "@/lib/types";

export default function NewOrderPage() {
  const { toast } = useFeedback();
  const [formKey, setFormKey] = useState(0);
  const [last, setLast] = useState<Order | null>(null);

  const submit = async (data: CreateOrderInput) => {
    try {
      const order = await createOrder(data);
      setLast(order);
      setFormKey((k) => k + 1); // clear the form for the next one
      toast(`تم إنشاء الشحنة ${order.barcode}`);
    } catch (err) {
      toast(errorMessage(err), "danger");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="شحنة جديدة" description="يحصل كل طلب على باركود ورابط تتبع للعميل تلقائيًا." />
      {last && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ok/40 bg-ok-soft px-4 py-3 text-sm">
          <span className="text-ok">
            تم إنشاء الشحنة <b className="num">{last.barcode}</b> للعميل {last.fullName}.
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" icon={<Printer className="size-4" />} onClick={() => printLabel(last)}>
              طباعة الملصق
            </Button>
            <Link to="/orders">
              <Button size="sm" variant="quiet">
                عرض الشحنات
              </Button>
            </Link>
          </div>
        </div>
      )}
      <Panel>
        <OrderForm key={formKey} onSubmit={submit} />
      </Panel>
    </div>
  );
}
