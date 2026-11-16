import { copy } from "@/messages";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  PackageCheck,
  RotateCcw,
  Headphones,
  ShieldCheck,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { products } from "@/data/products";
import { messages as uz } from "@/messages";
import { Button } from "@/components/ui/button";
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>{uz.home.title}</h1>
          <p>{uz.home.description}</p>
          <Button asChild size="lg">
            <Link href="/katalog">
              {uz.home.cta}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <div className="hero-caption">
            <span>{copy.oro01}</span>
            <span>{copy.tabiiylikSoddalikMuvozanat}</span>
          </div>
        </div>
        <div className="hero-image">
          <Image
            src="/images/hero.jpg"
            alt={copy.quyoshNuriTushganXonadaYumshoqKreslo}
            fill
            priority
            sizes="(max-width: 760px) 100vw, 58vw"
          />
          <div className="image-caption">{copy.ozingizniUydagidekHisEting}</div>
        </div>
      </section>
      <div className="manifesto">
        <span>{copy.yaxshiDizaynKundalikHayotningBirQismi}</span>
        <span>{copy.shoshilmasdanTanlangUzoqVaqtSeving}</span>
      </div>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{copy.tanlanganBuyumlar}</p>
            <h2>{uz.home.favorites}</h2>
          </div>
          <Link className="text-link" href="/katalog">
            {uz.common.all}
            <ArrowRight />
          </Link>
        </div>
        <div className="product-grid">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      <section id="kolleksiyalar" className="section categories-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{copy.harBirBurchakUchun}</p>
            <h2>{uz.home.categories}</h2>
          </div>
          <span className="muted">{copy.sizniAksEttiradiganDetallar}</span>
        </div>
        <div className="category-grid">
          <Link
            href="/katalog?tur=home"
            className="category-tile category-large"
          >
            <Image
              src="/images/interior.jpg"
              alt={copy.tabiiyRanglardagiShinamUyInteryeri}
              fill
              sizes="(max-width:760px) 100vw, 50vw"
            />
            <div>
              <span>{copy.text01Kolleksiya}</span>
              <h3>{copy.uyVaInteryer}</h3>
              <ArrowRight />
            </div>
          </Link>
          <Link href="/katalog?tur=lighting" className="category-tile">
            <Image
              src="/images/lamp.jpg"
              alt={copy.stolYoritgichi}
              fill
              sizes="(max-width:760px) 50vw, 25vw"
            />
            <div>
              <span>{copy.text02Kolleksiya}</span>
              <h3>{copy.yoruglikSanati}</h3>
              <ArrowRight />
            </div>
          </Link>
          <Link href="/katalog?tur=accessories" className="category-tile">
            <Image
              src="/images/bag-editorial.jpg"
              alt={copy.kundalikAksessuar}
              fill
              sizes="(max-width:760px) 50vw, 25vw"
            />
            <div>
              <span>{copy.text03Kolleksiya}</span>
              <h3>{copy.sizBilanHarKuni}</h3>
              <ArrowRight />
            </div>
          </Link>
        </div>
      </section>
      <section className="editorial">
        <div className="editorial-image">
          <Image
            src="/images/interior.jpg"
            alt={copy.yashashXonasidagiTabiiyMateriallarVaSokin}
            fill
            sizes="(max-width:760px) 100vw, 55vw"
          />
        </div>
        <div className="editorial-copy">
          <p className="eyebrow">{copy.oroFalsafasi}</p>
          <h2>{uz.home.story}</h2>
          <p>{uz.home.storyBody}</p>
          <Link className="text-link" href="/malumot/biz-haqimizda">
            {copy.bizningHikoyamiz}
            <ArrowRight />
          </Link>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{copy.yangiKelganlar}</p>
            <h2>{uz.home.arrivals}</h2>
          </div>
          <Link className="text-link" href="/katalog?yangi=1">
            {uz.common.all}
            <ArrowRight />
          </Link>
        </div>
        <div className="product-grid">
          {products
            .filter((p) => p.isNew)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>
      <section className="services" aria-label={copy.xaridHaqidaMalumot}>
        {[
          {
            icon: PackageCheck,
            title: copy.yetkazibBerish,
            body: copy.shartlarIshgaTushirishdanOldinElonQilinadi,
            href: "yetkazib-berish",
          },
          {
            icon: RotateCcw,
            title: copy.qaytarishShartlari,
            body: copy.xariddanOldinBatafsilMalumot,
            href: "qaytarish",
          },
          {
            icon: Headphones,
            title: copy.sizBilanAloqada,
            body: copy.savollaringizUchunYordamBolimi,
            href: "boglanish",
          },
          {
            icon: ShieldCheck,
            title: copy.ochiqVaTushunarli,
            body: copy.malumotlaringizgaMasuliyatliYondashuv,
            href: "maxfiylik",
          },
        ].map((s) => (
          <Link key={s.title} href={`/malumot/${s.href}`}>
            <s.icon />
            <div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          </Link>
        ))}
      </section>
    </>
  );
}
