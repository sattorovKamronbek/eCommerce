import { copy } from "@/messages";
import Link from "next/link";
export const metadata = { title: copy.shaxsiyHisob };
export default function Account() {
  return (
    <div className="section page-section info-page">
      <p className="eyebrow">{copy.shaxsiyHisob}</p>
      <h1>{copy.sizUchunAjratilganJoy}</h1>
      <p>{copy.hisobYaratishTizimgaKirishVaBuyurtmalar}</p>
      <p>{copy.hozirchaMalumotlaringizYigilmaydiSevimlilarVaSavat}</p>
      <Link className="text-link" href="/katalog">
        {copy.katalogniKorish}
      </Link>
    </div>
  );
}
