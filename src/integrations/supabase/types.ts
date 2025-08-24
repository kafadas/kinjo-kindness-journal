export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string | null
          id: string
          mime: string | null
          moment_id: string
          path: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          mime?: string | null
          moment_id: string
          path: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          mime?: string | null
          moment_id?: string
          path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          slug: string
          sort_order: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          user_id?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string | null
          emoji: string | null
          id: string
          name: string
          sort_order: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          name: string
          sort_order?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          user_id?: string
        }
        Relationships: []
      }
      moments: {
        Row: {
          action: Database["public"]["Enums"]["action_t"]
          attachment_count: number | null
          category_id: string | null
          created_at: string | null
          description: string | null
          happened_at: string
          id: string
          person_id: string | null
          significance: boolean | null
          source: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action?: Database["public"]["Enums"]["action_t"]
          attachment_count?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          happened_at?: string
          id?: string
          person_id?: string | null
          significance?: boolean | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["action_t"]
          attachment_count?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          happened_at?: string
          id?: string
          person_id?: string | null
          significance?: boolean | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      nudges: {
        Row: {
          entity_id: string | null
          id: string
          last_shown_at: string | null
          nudge_type: string | null
          snoozed_until: string | null
          user_id: string
        }
        Insert: {
          entity_id?: string | null
          id?: string
          last_shown_at?: string | null
          nudge_type?: string | null
          snoozed_until?: string | null
          user_id: string
        }
        Update: {
          entity_id?: string | null
          id?: string
          last_shown_at?: string | null
          nudge_type?: string | null
          snoozed_until?: string | null
          user_id?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          aliases: string[] | null
          avatar_type: string | null
          avatar_value: string | null
          created_at: string | null
          default_category_id: string | null
          display_name: string
          id: string
          last_recorded_moment_at: string | null
          merged_into: string | null
          user_id: string
        }
        Insert: {
          aliases?: string[] | null
          avatar_type?: string | null
          avatar_value?: string | null
          created_at?: string | null
          default_category_id?: string | null
          display_name: string
          id?: string
          last_recorded_moment_at?: string | null
          merged_into?: string | null
          user_id: string
        }
        Update: {
          aliases?: string[] | null
          avatar_type?: string | null
          avatar_value?: string | null
          created_at?: string | null
          default_category_id?: string | null
          display_name?: string
          id?: string
          last_recorded_moment_at?: string | null
          merged_into?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_default_category_id_fkey"
            columns: ["default_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      person_groups: {
        Row: {
          group_id: string
          person_id: string
        }
        Insert: {
          group_id: string
          person_id: string
        }
        Update: {
          group_id?: string
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_groups_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          timezone: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          timezone?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          timezone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          id: string
          is_active: boolean | null
          text: string
          theme: string | null
          user_id: string | null
          weight: number | null
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          text: string
          theme?: string | null
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          id?: string
          is_active?: boolean | null
          text?: string
          theme?: string | null
          user_id?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      reflections: {
        Row: {
          created_at: string | null
          id: string
          range_end: string | null
          range_start: string | null
          suggestions: string | null
          summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          range_end?: string | null
          range_start?: string | null
          suggestions?: string | null
          summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          range_end?: string | null
          range_start?: string | null
          suggestions?: string | null
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          ai_provider: string | null
          default_capture_mode: string | null
          default_category_id: string | null
          discreet_mode: boolean | null
          email_opt_in: boolean | null
          theme: string | null
          user_id: string
          weekly_digest: boolean | null
        }
        Insert: {
          ai_provider?: string | null
          default_capture_mode?: string | null
          default_category_id?: string | null
          discreet_mode?: boolean | null
          email_opt_in?: boolean | null
          theme?: string | null
          user_id: string
          weekly_digest?: boolean | null
        }
        Update: {
          ai_provider?: string | null
          default_capture_mode?: string | null
          default_category_id?: string | null
          discreet_mode?: boolean | null
          email_opt_in?: boolean | null
          theme?: string | null
          user_id?: string
          weekly_digest?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_default_category_id_fkey"
            columns: ["default_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          best: number | null
          current: number | null
          last_entry_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          best?: number | null
          current?: number | null
          last_entry_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          best?: number | null
          current?: number | null
          last_entry_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _action_from_text: {
        Args: { p_action: string }
        Returns: Database["public"]["Enums"]["action_t"]
      }
      auth_uid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      category_share_counts: {
        Args: {
          p_action: string
          p_end: string
          p_significant_only: boolean
          p_start: string
          p_user: string
        }
        Returns: {
          category_id: string
          count: number
          name: string
        }[]
      }
      category_share_delta_v1: {
        Args: {
          p_action: string
          p_end: string
          p_significant_only: boolean
          p_start: string
          p_tz: string
          p_user: string
        }
        Returns: {
          category_id: string
          category_name: string
          cnt: number
          pct: number
        }[]
      }
      compute_streak: {
        Args: { _user: string }
        Returns: {
          best: number
          current: number
          last_entry_date: string
        }[]
      }
      create_moment_quick: {
        Args: {
          p_action?: Database["public"]["Enums"]["action_t"]
          p_category_id?: string
          p_description: string
          p_happened_at?: string
          p_person_id?: string
        }
        Returns: string
      }
      daily_moment_counts_v1: {
        Args: {
          p_action: string
          p_end: string
          p_significant_only: boolean
          p_start: string
          p_tz: string
          p_user: string
        }
        Returns: {
          d: string
          given_count: number
          received_count: number
          total: number
        }[]
      }
      get_user_moment_date_range: {
        Args: { p_user: string }
        Returns: {
          max_date: string
          min_date: string
        }[]
      }
      given_received_by_category: {
        Args: { _from: string; _to: string; _user: string }
        Returns: {
          category_id: string
          category_name: string
          given_count: number
          received_count: number
        }[]
      }
      median_gap_by_category: {
        Args: {
          p_action?: string
          p_end: string
          p_significant_only?: boolean
          p_start: string
          p_user: string
        }
        Returns: {
          category_id: string
          median_days: number
          name: string
        }[]
      }
      opportunities_people: {
        Args: { _from: string; _limit?: number; _to: string; _user: string }
        Returns: {
          days_since: number
          display_name: string
          last_recorded: string
          person_id: string
        }[]
      }
      refresh_person_last_recorded: {
        Args: { p_person_id: string }
        Returns: undefined
      }
      significant_moments: {
        Args: { _from: string; _to: string; _user: string }
        Returns: {
          category_id: string
          description: string
          happened_at: string
          moment_id: string
          person_id: string
        }[]
      }
      user_moment_bounds: {
        Args: { p_tz?: string; p_user: string }
        Returns: {
          max_date: string
          min_date: string
        }[]
      }
    }
    Enums: {
      action_t: "given" | "received"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      action_t: ["given", "received"],
    },
  },
} as const
