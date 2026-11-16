import { storeConfig } from "@/lib/config";
export default function MarketplaceLoading() {
  return <div className="mp-catalog" role="progressbar" aria-label={storeConfig.name} aria-busy="true"><div className="loading-line" /></div>;
}
