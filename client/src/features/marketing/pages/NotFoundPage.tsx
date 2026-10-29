import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-sm">
        <p className="stamp mb-5 text-sm text-late">404</p>
        <h1 className="text-xl font-semibold text-ink">هذه الصفحة غير موجودة</h1>
        <p className="mt-2 text-sm text-ink-2">ربما تغيّر الرابط أو كُتب بشكل خاطئ.</p>
        <Link to="/">
          <Button className="mt-6">العودة إلى الصفحة الرئيسية</Button>
        </Link>
      </div>
    </div>
  );
}
