export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          store_name: string | null;
          branch_id: string | null;
          avatar_url: string | null;
          language: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          store_name?: string | null;
          branch_id?: string | null;
          avatar_url?: string | null;
          language?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          store_name?: string | null;
          branch_id?: string | null;
          avatar_url?: string | null;
          language?: string | null;
          updated_at?: string;
        };
      };
      roasting_records: {
        Row: {
          id: string;
          user_id: string;
          bean_name: string | null;
          roast_temperature: number | null;
          roast_time: number | null;
          grind_size: string | null;
          extraction_time: number | null;
          cupping_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bean_name?: string | null;
          roast_temperature?: number | null;
          roast_time?: number | null;
          grind_size?: string | null;
          extraction_time?: number | null;
          cupping_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bean_name?: string | null;
          roast_temperature?: number | null;
          roast_time?: number | null;
          grind_size?: string | null;
          extraction_time?: number | null;
          cupping_score?: number | null;
          created_at?: string;
        };
      };
    };
  };
}

export type RoastingRecordRow = Database["public"]["Tables"]["roasting_records"]["Row"];
export type RoastingRecordInsert = Database["public"]["Tables"]["roasting_records"]["Insert"];
