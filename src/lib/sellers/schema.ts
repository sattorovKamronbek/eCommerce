/** Supabase reports absent relations by PostgREST or PostgreSQL code. */
export function isSellerSchemaMissing(error: { code?: string } | null): boolean {
  return error?.code === "PGRST205" || error?.code === "42P01";
}
