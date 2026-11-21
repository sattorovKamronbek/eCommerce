import { accountLocale } from "@/components/account/shell";
import { OrdersList } from "@/components/orders/view";

export default async function Page({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await accountLocale(params);
  return <OrdersList locale={locale} admin={false} search={await searchParams} />;
}
