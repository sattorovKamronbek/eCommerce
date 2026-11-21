import type { OrderEvent, OrderRole, OrderStatus } from "@/lib/orders/model";
import type { Cs2Category, Cs2Wear } from "@/lib/sellers/cs2";
import type { FashionListingVersion, FashionSizeGuideRow } from "@/lib/sellers/fashion";

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
  cs2_group_id: string | null; cs2_category: Cs2Category | null; cs2_model: string | null;
  cs2_wear: Cs2Wear | null; cs2_images: string[]; cs2_group_primary: boolean;
  fashion_product_id?: string | null; fashion_color_id?: string | null; fashion_size?: string | null;
  fashion_price_override?: boolean | null;
};
export type PublicListing = Pick<SellerListing, "id" | "ecosystem" | "title" | "description" | "category" | "variant" | "price_tiyin" | "created_at" |
  "cs2_category" | "cs2_model" | "cs2_wear" | "cs2_images" | "fashion_product_id" | "fashion_color_id" | "fashion_size"> & {
  available: boolean; cs2_group_key: string | null;
  fashion_color?: string | null; fashion_images?: string[] | null;
  fashion_brand?: string | null; fashion_material?: string | null; fashion_fit?: string | null; fashion_care?: string | null;
  fashion_size_guide?: FashionSizeGuideRow[] | null;
};
export type FashionProductDetails = {
  title: string; description: string; category: string; brand: string; material: string; fit: string; care: string;
  price_tiyin: number; state: "draft" | "published"; size_guide: FashionSizeGuideRow[];
};
export type FashionProduct = FashionProductDetails & { id: string; seller_id: string; updated_at: string };
export type FashionColor = { id: string; product_id: string; name: string; images: string[] };
export type FashionColorInput = Pick<FashionColor, "id" | "name" | "images"> & {
  variants: { size: string; price_tiyin: number | null; quantity: number }[];
};
export type CheckoutTerms = {
  listing_id: string; revision: string; seller_phone: string; shipping_tiyin: number; cs2_asset_id: string | null;
};
export type CheckoutOffer = Pick<PublicListing, "ecosystem" | "title" | "category" | "variant" | "description" | "price_tiyin"> & {
  listing_id: string; quote: string; shipping_tiyin: number;
};
export type DirectOrder = {
  id: string; listing_id: string; buyer_id: string; seller_id: string; ecosystem: SellerListing["ecosystem"];
  title: string; category: string; variant: string; description: string; quote: string; quantity: number;
  unit_price_tiyin: number; shipping_tiyin: number; total_tiyin: number; seller_phone: string; cs2_asset_id: string | null;
  delivery_name: string | null; delivery_phone: string | null; delivery_address: string | null;
  status: OrderStatus; stock_state: "held" | "consumed" | "released"; version: number;
  payment_reference: string | null; reported_amount_tiyin: number | null; reported_paid_at: string | null; reported_by: string | null;
  payment_approved_at: string | null; seller_confirmed_at: string | null; buyer_confirmed_at: string | null;
  created_at: string; updated_at: string; expires_at: string;
};
export type DirectOrderEvent = {
  id: number; order_id: string; actor_id: string | null; actor_role: OrderRole | "system"; action: OrderEvent; reason: string | null; created_at: string;
};
export type AccessRole = "customer" | "admin" | "owner";
export type AccessAction = "suspend" | "unsuspend" | "grant_admin" | "revoke_admin";
export type UserAccess = { account_role: AccessRole; suspended: boolean; provider_restricted: boolean; viewer_is_owner: boolean; can_manage_roles: boolean };
export type UserAccessEvent = {
  id: number; target_id: string | null; actor_id: string | null; action: AccessAction; reason: string; created_at: string;
};
export type ProfileIdentityDecision = "verified" | "not_verified" | "cancelled";
export type ProfileIdentityRequest = {
  id: string; subject_id: string; status: "pending" | ProfileIdentityDecision; created_at: string; reviewed_at: string | null;
};
export type Database = {
  public: {
    Tables: {
      marketplace_profile_identity_requests: { Row: ProfileIdentityRequest; Insert: never; Update: never; Relationships: [] };
      marketplace_user_access_events: { Row: UserAccessEvent; Insert: never; Update: never; Relationships: [] };
      marketplace_checkout_terms: { Row: CheckoutTerms; Insert: never; Update: never; Relationships: [] };
      marketplace_orders: { Row: DirectOrder; Insert: never; Update: never; Relationships: [] };
      marketplace_order_events: { Row: DirectOrderEvent; Insert: never; Update: never; Relationships: [] };
      marketplace_fashion_products: { Row: FashionProduct; Insert: never; Update: never; Relationships: [] };
      marketplace_fashion_colors: { Row: FashionColor; Insert: never; Update: never; Relationships: [] };
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
        Insert: Pick<SellerListing, "seller_id" | "ecosystem" | "title" | "description" | "price_tiyin" | "quantity">
          & Partial<Pick<SellerListing, "id" | "category" | "variant" | "state" | "cs2_group_id" | "cs2_category" | "cs2_model" |
            "cs2_wear" | "cs2_images" | "cs2_group_primary">>;
        Update: Partial<Pick<SellerListing, "ecosystem" | "title" | "description" | "category" | "variant" | "price_tiyin" | "quantity" | "state" | "cs2_images">>;
        Relationships: [];
      };
    };
    Views: {
      marketplace_public_listings: { Row: PublicListing; Relationships: [] };
      marketplace_public_fashion_catalog: { Row: PublicListing; Relationships: [] };
      marketplace_checkout_offers: { Row: CheckoutOffer; Relationships: [] };
    };
    Functions: {
      marketplace_request_profile_identity: { Args: { p_subject_id: string }; Returns: string };
      marketplace_own_profile_identity_code: { Args: { p_request_id: string }; Returns: string | null };
      marketplace_review_profile_identity: { Args: { p_request_id: string; p_subject_id: string; p_decision: ProfileIdentityDecision; p_code: string | null }; Returns: undefined };
      marketplace_account_is_active: { Args: Record<string, never>; Returns: boolean };
      marketplace_admin_user_access: { Args: { p_user_id: string }; Returns: UserAccess[] };
      marketplace_manage_user_access: {
        Args: { p_user_id: string; p_action: AccessAction; p_reason: string; p_expected_role: AccessRole; p_expected_suspended: boolean };
        Returns: undefined;
      };
      marketplace_set_checkout_terms: {
        Args: { p_listing_id: string; p_seller_phone: string; p_shipping_tiyin: number; p_cs2_asset_id: string | null }; Returns: undefined;
      };
      marketplace_save_fashion_product: {
        Args: { p_product_id: string; p_expected_updated_at: string | null; p_details: FashionProductDetails;
          p_colors: FashionColorInput[]; p_versions: FashionListingVersion[] };
        Returns: string;
      };
      marketplace_fashion_draft: {
        Args: { p_product_id: string }; Returns: { product: FashionProduct; colors: FashionColor[]; listings: SellerListing[] } | null;
      };
      marketplace_set_fashion_checkout_terms: {
        Args: { p_product_id: string; p_seller_phone: string; p_shipping_tiyin: number }; Returns: undefined;
      };
      marketplace_reserve_order: {
        Args: { p_id: string; p_listing_id: string; p_quote: string; p_quantity: number; p_delivery_name: string | null; p_delivery_phone: string | null; p_delivery_address: string | null };
        Returns: string;
      };
      marketplace_update_order: {
        Args: { p_id: string; p_action: string; p_version: number; p_reason: string | null; p_payment_reference: string | null; p_paid_amount_tiyin: number | null; p_paid_at: string | null };
        Returns: undefined;
      };
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
