export type Profile = { id: string; display_name: string; preferred_locale: "uz" | "ru" | "en"; created_at: string; updated_at: string };
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
        Row: { user_id: string; role: "admin"; created_at: string };
        Insert: { user_id: string; role: "admin"; created_at?: string };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
