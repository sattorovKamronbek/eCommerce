import { copy } from "@/messages";
import Link from "next/link";
export default function NotFound() {
  return (
    <div className="section page-section empty-state">
      <p>404</p>
      <h1>{copy.sahifaTopilmadi}</h1>
      <p>{copy.manzilOzgarganYokiBundayMahsulotMavjud}</p>
      <Link href="/katalog" className="text-link">
        {copy.kataloggaQaytish}
      </Link>
    </div>
  );
}
