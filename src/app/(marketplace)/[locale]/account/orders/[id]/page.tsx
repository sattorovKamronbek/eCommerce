import { accountLocale } from "@/components/account/shell";
import { OrderDetail } from "@/components/orders/view";

export default async function Page({ params, searchParams }: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await accountLocale(params);
  return <OrderDetail locale={locale} id={(await params).id} admin={false} search={await searchParams} />;
}
