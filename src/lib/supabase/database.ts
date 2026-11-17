export type Profile = { id: string; display_name: string; preferred_locale: "uz" | "ru" | "en"; created_at: string; updated_at: string };
export type SellerApplication = {
  applicant_id: string; applicant_type: "individual" | "company"; name: string; contact: string;
  region: string; requested_scope: "cs2" | "fashion" | "both"; registration_details: string | null;
  status: "pending" | "approved" | "rejected"; revision: number; created_at: string; reviewed_at: string | null;
};
export type SellerListing = {
  id: string; seller_id: string; seller_revision: number; ecosystem: "cs2" | "fashion"; title: string;
  description: string; category: string; variant: string; price_tiyin: number; quantity: number;
  state: "draft" | "published" | "archived"; moderation_status: "allowed" | "blocked"; created_at: string; updated_at: string;
};
export type PublicListing = Pick<SellerListing, "id" | "ecosystem" | "title" | "description" | "category" | "variant" | "price_tiyin" | "created_at"> & { available: boolean };
export type Database = {
  public: {
    Tables: {
      marketplace_profiles: {
        Row: Profile;
        Insert: { id: string; display_name?: string; preferred_locale?: "uz" | "ru" | "en"; created_at?: string; updated_at?: string };
        Update: { display_name?: string; preferred_locale?: "uz" | "ru" | "en" };
        Relationships: [];
      };
      marketplace_user_roles: {
        Row: { user_id: string; role: "admin" | "owner"; created_at: string };
        Insert: { user_id: string; role: "admin" | "owner"; created_at?: string };
        Update: never;
        Relationships: [];
      };
      marketplace_seller_applications: {
        Row: SellerApplication;
        Insert: Pick<SellerApplication, "applicant_id" | "applicant_type" | "name" | "contact" | "region" | "requested_scope"> & { registration_details?: string | null };
        Update: never;
        Relationships: [];
      };
      marketplace_seller_grants: {
        Row: { seller_id: string; application_revision: number; verified_by: string | null; verified_at: string };
        Insert: never; Update: never; Relationships: [];
      };
      marketplace_listings: {
        Row: SellerListing;
        Insert: Pick<SellerListing, "seller_id" | "ecosystem" | "title" | "description" | "price_tiyin" | "quantity"> & Partial<Pick<SellerListing, "id" | "category" | "variant" | "state">>;
        Update: Partial<Pick<SellerListing, "ecosystem" | "title" | "description" | "category" | "variant" | "price_tiyin" | "quantity" | "state">>;
        Relationships: [];
      };
    };
    Views: { marketplace_public_listings: { Row: PublicListing; Relationships: [] } };
    Functions: {
      marketplace_review_seller_application: { Args: { p_applicant_id: string; p_decision: string; p_revision: number }; Returns: undefined };
      marketplace_resubmit_seller_application: { Args: { p_type: string; p_name: string; p_contact: string; p_region: string; p_scope: string; p_registration: string | null }; Returns: undefined };
      marketplace_create_seller_challenge: { Args: Record<string, never>; Returns: string };
      marketplace_verify_seller: { Args: { p_applicant_id: string; p_revision: number; p_code: string }; Returns: undefined };
      marketplace_admin_archive_listing: { Args: { p_listing_id: string }; Returns: undefined };
      marketplace_admin_restore_listing: { Args: { p_listing_id: string }; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
