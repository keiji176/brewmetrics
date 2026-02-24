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
      bean_profiles: {
        Row: {
          id: string;
          user_id: string;
          bean_name: string | null;
          variety: string | null;
          roaster: string | null;
          origin: string | null;
          roast_level: string | null;
          process: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bean_name?: string | null;
          variety?: string | null;
          roaster?: string | null;
          origin?: string | null;
          roast_level?: string | null;
          process?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bean_name?: string | null;
          variety?: string | null;
          roaster?: string | null;
          origin?: string | null;
          roast_level?: string | null;
          process?: string | null;
          created_at?: string;
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
      grinder_calibrations: {
        Row: {
          id: string;
          user_id: string;
          grinder_name: string;
          fine_click: number;
          medium_fine_click: number;
          medium_click: number;
          medium_coarse_click: number;
          coarse_click: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          grinder_name: string;
          fine_click: number;
          medium_fine_click: number;
          medium_click: number;
          medium_coarse_click: number;
          coarse_click: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          grinder_name?: string;
          fine_click?: number;
          medium_fine_click?: number;
          medium_click?: number;
          medium_coarse_click?: number;
          coarse_click?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export enum GrindSize {
  FINE = "FINE",
  MEDIUM_FINE = "MEDIUM_FINE",
  MEDIUM = "MEDIUM",
  MEDIUM_COARSE = "MEDIUM_COARSE",
  COARSE = "COARSE",
}

export type BeanProfileRow = Database["public"]["Tables"]["bean_profiles"]["Row"];
export type BeanProfileInsert = Database["public"]["Tables"]["bean_profiles"]["Insert"];
export type RoastingRecordRow = Database["public"]["Tables"]["roasting_records"]["Row"];
export type RoastingRecordInsert = Database["public"]["Tables"]["roasting_records"]["Insert"];
export type GrinderCalibrationRow = Database["public"]["Tables"]["grinder_calibrations"]["Row"];
export type GrinderCalibrationInsert = Database["public"]["Tables"]["grinder_calibrations"]["Insert"];
