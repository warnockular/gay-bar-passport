// Generated-style Supabase Database type for the Phase 2 schema.
// After migrations are live, replace this file with `supabase gen types typescript`.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      journal_entries: {
        Row: {
          body: string | null;
          city: string | null;
          city_slug: string | null;
          country: string | null;
          country_slug: string | null;
          created_at: string;
          entry_date: string;
          favorite_id: string | null;
          id: string;
          is_private: boolean;
          moderation_status: "active" | "hidden" | "flagged";
          title: string;
          updated_at: string;
          user_id: string;
          venue_id: string | null;
          visit_id: string | null;
        };
        Insert: {
          body?: string | null;
          city?: string | null;
          city_slug?: string | null;
          country?: string | null;
          country_slug?: string | null;
          created_at?: string;
          entry_date?: string;
          favorite_id?: string | null;
          id?: string;
          is_private?: boolean;
          moderation_status?: "active" | "hidden" | "flagged";
          title: string;
          updated_at?: string;
          user_id: string;
          venue_id?: string | null;
          visit_id?: string | null;
        };
        Update: {
          body?: string | null;
          city?: string | null;
          city_slug?: string | null;
          country?: string | null;
          country_slug?: string | null;
          created_at?: string;
          entry_date?: string;
          favorite_id?: string | null;
          id?: string;
          is_private?: boolean;
          moderation_status?: "active" | "hidden" | "flagged";
          title?: string;
          updated_at?: string;
          user_id?: string;
          venue_id?: string | null;
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
          },
          {
            foreignKeyName: "journal_entries_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_entries_favorite_id_fkey";
            columns: ["favorite_id"];
            isOneToOne: false;
            referencedRelation: "favorites";
            referencedColumns: ["id"];
          }
        ];
      };
      journal_photos: {
        Row: {
          caption: string | null;
          created_at: string;
          entry_id: string;
          id: string;
          storage_path: string;
          user_id: string;
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          entry_id: string;
          id?: string;
          storage_path: string;
          user_id: string;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          entry_id?: string;
          id?: string;
          storage_path?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journal_photos_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_photos_entry_id_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          }
        ];
      };
      follows: {
        Row: {
          created_at: string;
          follower_id: string;
          following_id: string;
        };
        Insert: {
          created_at?: string;
          follower_id: string;
          following_id: string;
        };
        Update: {
          created_at?: string;
          follower_id?: string;
          following_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_following_id_fkey";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      journal_likes: {
        Row: {
          created_at: string;
          entry_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          entry_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          entry_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journal_likes_entry_id_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      journal_comments: {
        Row: {
          body: string;
          created_at: string;
          entry_id: string;
          id: string;
          moderation_status: "active" | "hidden" | "flagged";
          updated_at: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          entry_id: string;
          id?: string;
          moderation_status?: "active" | "hidden" | "flagged";
          updated_at?: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          entry_id?: string;
          id?: string;
          moderation_status?: "active" | "hidden" | "flagged";
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "journal_comments_entry_id_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "journal_comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          actor_id: string | null;
          comment_id: string | null;
          created_at: string;
          id: string;
          journal_entry_id: string | null;
          read_at: string | null;
          type: "new_follower" | "new_like" | "new_comment";
          user_id: string;
        };
        Insert: {
          actor_id?: string | null;
          comment_id?: string | null;
          created_at?: string;
          id?: string;
          journal_entry_id?: string | null;
          read_at?: string | null;
          type: "new_follower" | "new_like" | "new_comment";
          user_id: string;
        };
        Update: {
          actor_id?: string | null;
          comment_id?: string | null;
          created_at?: string;
          id?: string;
          journal_entry_id?: string | null;
          read_at?: string | null;
          type?: "new_follower" | "new_like" | "new_comment";
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_journal_entry_id_fkey";
            columns: ["journal_entry_id"];
            isOneToOne: false;
            referencedRelation: "journal_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "journal_comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      moderation_flags: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          reason: string;
          resolved_at: string | null;
          resolved_by: string | null;
          status: "open" | "resolved" | "dismissed";
          target_id: string;
          target_type: "user" | "venue" | "journal" | "comment";
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          reason: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: "open" | "resolved" | "dismissed";
          target_id: string;
          target_type: "user" | "venue" | "journal" | "comment";
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          reason?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: "open" | "resolved" | "dismissed";
          target_id?: string;
          target_type?: "user" | "venue" | "journal" | "comment";
        };
        Relationships: [
          {
            foreignKeyName: "moderation_flags_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "moderation_flags_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          id: string;
          metadata: Json;
          target_id: string | null;
          target_type: string;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json;
          target_id?: string | null;
          target_type: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          id?: string;
          metadata?: Json;
          target_id?: string | null;
          target_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
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
      achievements: {
        Row: {
          code: string;
          created_at: string;
          description: string;
          id: string;
          name: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description: string;
          id?: string;
          name: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          deleted_at: string | null;
          display_name: string | null;
          home_city: string | null;
          id: string;
          role: "user" | "moderator" | "admin";
          status: "active" | "suspended";
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          display_name?: string | null;
          home_city?: string | null;
          id: string;
          role?: "user" | "moderator" | "admin";
          status?: "active" | "suspended";
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          display_name?: string | null;
          home_city?: string | null;
          id?: string;
          role?: "user" | "moderator" | "admin";
          status?: "active" | "suspended";
          updated_at?: string;
        };
        Relationships: [];
      };
      venues: {
        Row: {
          address: string | null;
          category: Database["public"]["Enums"]["venue_category"];
          city_slug: string;
          city: string;
          country_slug: string;
          country: string;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          is_lgbtq_owned: boolean;
          is_published: boolean;
          latitude: number | null;
          longitude: number | null;
          name: string;
          neighborhood: string | null;
          region: string | null;
          review_status: "active" | "hidden" | "pending_review";
          slug: string;
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          address?: string | null;
          category?: Database["public"]["Enums"]["venue_category"];
          city_slug: string;
          city: string;
          country_slug: string;
          country: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_lgbtq_owned?: boolean;
          is_published?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          neighborhood?: string | null;
          region?: string | null;
          review_status?: "active" | "hidden" | "pending_review";
          slug: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          address?: string | null;
          category?: Database["public"]["Enums"]["venue_category"];
          city_slug?: string;
          city?: string;
          country_slug?: string;
          country?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_lgbtq_owned?: boolean;
          is_published?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          neighborhood?: string | null;
          region?: string | null;
          review_status?: "active" | "hidden" | "pending_review";
          slug?: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      venue_tags: {
        Row: {
          tag_id: string;
          venue_id: string;
        };
        Insert: {
          tag_id: string;
          venue_id: string;
        };
        Update: {
          tag_id?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "venue_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "venue_tags_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          }
        ];
      };
      favorites: {
        Row: {
          created_at: string;
          id: string;
          user_id: string;
          venue_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          user_id: string;
          venue_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          user_id?: string;
          venue_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_venue_id_fkey";
            columns: ["venue_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          }
        ];
      };
      user_achievements: {
        Row: {
          achievement_id: string;
          awarded_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          achievement_id: string;
          awarded_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          achievement_id?: string;
          awarded_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey";
            columns: ["achievement_id"];
            isOneToOne: false;
            referencedRelation: "achievements";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      visit_photos: {
        Row: {
          caption: string | null;
          created_at: string;
          id: string;
          storage_path: string;
          user_id: string;
          visit_id: string;
        };
        Insert: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          storage_path: string;
          user_id: string;
          visit_id: string;
        };
        Update: {
          caption?: string | null;
          created_at?: string;
          id?: string;
          storage_path?: string;
          user_id?: string;
          visit_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "visit_photos_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "visit_photos_visit_id_fkey";
            columns: ["visit_id"];
            isOneToOne: false;
            referencedRelation: "visits";
            referencedColumns: ["id"];
          }
        ];
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
      current_profile_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_admin_role: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
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
