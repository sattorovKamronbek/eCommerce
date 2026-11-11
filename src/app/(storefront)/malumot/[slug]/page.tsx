import { copy } from "@/messages";
import { notFound } from "next/navigation";
import Link from "next/link";
const pages: Record<string, { title: string; body: string }> = {
  "biz-haqimizda": {
    title: copy.kamroqAmmoYaxshiroq,
    body: copy.oroKundalikHayotdagiOddiyBuyumlargaYangicha,
  },
  "yetkazib-berish": {
    title: copy.yetkazibBerish,
    body: copy.sotuvHaliBoshlanmaganYetkazibBerishHududlari,
  },
  qaytarish: {
    title: copy.qaytarishVaAlmashtirish,
    body: copy.buyurtmalarHozirchaQabulQilinmaydiQaytarishShartlari,
  },
  boglanish: {
    title: copy.aloqadaBolamiz,
    body: copy.dokonIshlabChiqilmoqdaTasdiqlanganTelefonEmail,
  },
  maxfiylik: {
    title: copy.malumotlaringizHaqida,
    body: copy.ushbuVersiyaHisobYokiBuyurtmaMalumotlarini,
  },
};
export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return { title: pages[(await params).slug]?.title ?? copy.sahifaTopilmadi };
}
export default async function Info({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = pages[(await params).slug];
  if (!p) notFound();
  return (
    <div className="section page-section info-page">
      <p className="eyebrow">{copy.oroMalumot}</p>
      <h1>{p.title}</h1>
      <p>{p.body}</p>
      <Link href="/katalog" className="text-link">
        {copy.katalogniKorish}
      </Link>
    </div>
  );
}
