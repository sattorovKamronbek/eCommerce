export type Profile = { id: string; display_name: string; preferred_locale: "uz" | "ru" | "en"; created_at: string; updated_at: string };
export type SellerApplication = {
  applicant_id: string; applicant_type: "individual" | "company"; name: string; contact: string;
  region: string; requested_scope: "cs2" | "fashion" | "both"; registration_details: string | null;
  status: "pending" | "approved" | "rejected"; revision: number; created_at: string; reviewed_at: string | null;
};
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
    };
    Views: Record<string, never>;
    Functions: {
      marketplace_review_seller_application: { Args: { p_applicant_id: string; p_decision: string; p_revision: number }; Returns: undefined };
      marketplace_resubmit_seller_application: { Args: { p_type: string; p_name: string; p_contact: string; p_region: string; p_scope: string; p_registration: string | null }; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
