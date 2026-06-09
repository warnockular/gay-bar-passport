// Generated-style Supabase Database type for the Phase 2 schema.
// After migrations are live, replace this file with `supabase gen types typescript`.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      journal_entries: {
        Row: {
          body: string | null;
          created_at: string;
          entry_date: string;
          id: string;
          is_private: boolean;
          title: string;
          updated_at: string;
          user_id: string;
          visit_id: string | null;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          entry_date?: string;
          id?: string;
          is_private?: boolean;
          title: string;
          updated_at?: string;
          user_id: string;
          visit_id?: string | null;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          entry_date?: string;
          id?: string;
          is_private?: boolean;
          title?: string;
          updated_at?: string;
          user_id?: string;
          visit_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "journal_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_entries_visit_id_fkey";
            columns: ["visit_id"];
            isOneToOne: false;
            referencedRelation: "visits";
            referencedColumns: ["id"];
          }
        ];
      };
      passport_stamps: {
        Row: {
          city: string;
          country: string;
          created_at: string;
          id: string;
          issued_at: string;
          stamp_code: string;
          user_id: string;
          venue_id: string | null;
          visit_id: string | null;
        };
        Insert: {
          city: string;
          country: string;
          created_at?: string;
          id?: string;
          issued_at?: string;
          stamp_code: string;
          user_id: string;
          venue_id?: string | null;
          visit_id?: string | null;
        };
        Update: {
          city?: string;
          country?: string;
          created_at?: string;
          id?: string;
          issued_at?: string;
          stamp_code?: string;
          user_id?: string;
          venue_id?: string | null;
          visit_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "passport_stamps_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "passport_stamps_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "passport_stamps_visit_id_fkey";
            columns: ["visit_id"];
            isOneToOne: false;
            referencedRelation: "visits";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          home_city: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          home_city?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          home_city?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      venues: {
        Row: {
          category: Database["public"]["Enums"]["venue_category"];
          city: string;
          country: string;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_lgbtq_owned: boolean;
          is_published: boolean;
          name: string;
          region: string | null;
          slug: string;
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          category?: Database["public"]["Enums"]["venue_category"];
          city: string;
          country: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_lgbtq_owned?: boolean;
          is_published?: boolean;
          name: string;
          region?: string | null;
          slug: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          category?: Database["public"]["Enums"]["venue_category"];
          city?: string;
          country?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_lgbtq_owned?: boolean;
          is_published?: boolean;
          name?: string;
          region?: string | null;
          slug?: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [];
      };
      visits: {
        Row: {
          created_at: string;
          id: string;
          mood: Database["public"]["Enums"]["visit_mood"] | null;
          private_notes: string | null;
          rating: number | null;
          updated_at: string;
          user_id: string;
          venue_id: string;
          visited_on: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          mood?: Database["public"]["Enums"]["visit_mood"] | null;
          private_notes?: string | null;
          rating?: number | null;
          updated_at?: string;
          user_id: string;
          venue_id: string;
          visited_on: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          mood?: Database["public"]["Enums"]["visit_mood"] | null;
          private_notes?: string | null;
          rating?: number | null;
          updated_at?: string;
          user_id?: string;
          venue_id?: string;
          visited_on?: string;
        };
        Relationships: [
          {
            foreignKeyName: "visits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "visits_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      handle_new_user: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      set_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: {
      venue_category: "bar" | "club" | "lounge" | "cafe" | "performance" | "community";
      visit_mood: "iconic" | "intimate" | "social" | "romantic" | "high_energy" | "reflective";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
