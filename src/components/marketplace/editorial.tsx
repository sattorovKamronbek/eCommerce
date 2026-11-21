import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function EditorialHeading({ id, children }: { id: string; children: ReactNode }) {
  return <h2 id={id} className="mp-imprint">{children}</h2>;
}

export function EditorialArt({ src, sizes, alt = "", preload }: {
  src: string;
  sizes: string;
  alt?: string;
  preload?: boolean;
}) {
  return <div className="mp-art">
    <Image src={src} alt={alt} fill sizes={sizes} preload={preload} />
  </div>;
}

export function EditorialLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="mp-editorial-link">{children}<ArrowUpRight aria-hidden="true" /></Link>;
}
