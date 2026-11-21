import Image from "next/image";
import { storeConfig } from "@/lib/config";

export function BrandLogo({ presentation = "full" }: { presentation?: "full" | "masthead" }) {
  const { logo, compactLogo } = storeConfig.brand;
  return <picture className="brand-logo">
    {presentation === "masthead" && <source
      media="(max-width: 660px)"
      srcSet={compactLogo.src}
      width={compactLogo.width}
      height={compactLogo.height}
    />}
    <Image {...logo} alt={storeConfig.name} unoptimized loading={presentation === "masthead" ? "eager" : "lazy"} />
  </picture>;
}
