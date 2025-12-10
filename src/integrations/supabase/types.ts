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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_action_log: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string
          id: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string
          id?: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string
          id?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_action_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      brief_subscriptions: {
        Row: {
          audience: Database["public"]["Enums"]["brief_audience"]
          created_at: string
          id: string
          is_active: boolean | null
          user_id: string
        }
        Insert: {
          audience: Database["public"]["Enums"]["brief_audience"]
          created_at?: string
          id?: string
          is_active?: boolean | null
          user_id: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["brief_audience"]
          created_at?: string
          id?: string
          is_active?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      competitor_sources: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          last_scraped_at: string | null
          name: string
          scrape_selectors: Json | null
          updated_at: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          name: string
          scrape_selectors?: Json | null
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          name?: string
          scrape_selectors?: Json | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company: string | null
          contact_type: string
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          contact_type: string
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          contact_type?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_briefs: {
        Row: {
          action_items: Json | null
          audience: Database["public"]["Enums"]["brief_audience"]
          brief_date: string
          competitor_updates: Json | null
          created_at: string
          id: string
          insights: Json
          market_signals: Json | null
          raw_data: Json | null
          summary: string
          title: string
        }
        Insert: {
          action_items?: Json | null
          audience: Database["public"]["Enums"]["brief_audience"]
          brief_date?: string
          competitor_updates?: Json | null
          created_at?: string
          id?: string
          insights?: Json
          market_signals?: Json | null
          raw_data?: Json | null
          summary: string
          title: string
        }
        Update: {
          action_items?: Json | null
          audience?: Database["public"]["Enums"]["brief_audience"]
          brief_date?: string
          competitor_updates?: Json | null
          created_at?: string
          id?: string
          insights?: Json
          market_signals?: Json | null
          raw_data?: Json | null
          summary?: string
          title?: string
        }
        Relationships: []
      }
      insight_documents: {
        Row: {
          applicable_metrics: string[] | null
          benchmarks: Json | null
          content_markdown: string | null
          content_summary: string | null
          created_at: string | null
          creator_type_tags: string[] | null
          id: string
          is_processed: boolean | null
          key_points: Json | null
          processing_error: string | null
          published_at: string | null
          recommended_actions: Json | null
          source_id: string | null
          tags: string[] | null
          title: string
          topic_tags: string[] | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          applicable_metrics?: string[] | null
          benchmarks?: Json | null
          content_markdown?: string | null
          content_summary?: string | null
          created_at?: string | null
          creator_type_tags?: string[] | null
          id?: string
          is_processed?: boolean | null
          key_points?: Json | null
          processing_error?: string | null
          published_at?: string | null
          recommended_actions?: Json | null
          source_id?: string | null
          tags?: string[] | null
          title: string
          topic_tags?: string[] | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          applicable_metrics?: string[] | null
          benchmarks?: Json | null
          content_markdown?: string | null
          content_summary?: string | null
          created_at?: string | null
          creator_type_tags?: string[] | null
          id?: string
          is_processed?: boolean | null
          key_points?: Json | null
          processing_error?: string | null
          published_at?: string | null
          recommended_actions?: Json | null
          source_id?: string | null
          tags?: string[] | null
          title?: string
          topic_tags?: string[] | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insight_documents_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "insight_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      insight_sources: {
        Row: {
          created_at: string | null
          created_by: string | null
          creator_type_tags: string[] | null
          documents_count: number | null
          fetch_frequency_hours: number | null
          id: string
          is_active: boolean | null
          last_fetch_at: string | null
          name: string
          tags: string[] | null
          topic_tags: string[] | null
          type: string
          updated_at: string | null
          url: string
          use_transcripts: boolean | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          creator_type_tags?: string[] | null
          documents_count?: number | null
          fetch_frequency_hours?: number | null
          id?: string
          is_active?: boolean | null
          last_fetch_at?: string | null
          name: string
          tags?: string[] | null
          topic_tags?: string[] | null
          type: string
          updated_at?: string | null
          url: string
          use_transcripts?: boolean | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          creator_type_tags?: string[] | null
          documents_count?: number | null
          fetch_frequency_hours?: number | null
          id?: string
          is_active?: boolean | null
          last_fetch_at?: string | null
          name?: string
          tags?: string[] | null
          topic_tags?: string[] | null
          type?: string
          updated_at?: string | null
          url?: string
          use_transcripts?: boolean | null
        }
        Relationships: []
      }
      pricing_features: {
        Row: {
          display_order: number
          feature: string
          id: string
          plan_id: string | null
        }
        Insert: {
          display_order?: number
          feature: string
          id?: string
          plan_id?: string | null
        }
        Update: {
          display_order?: number
          feature?: string
          id?: string
          plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          is_popular: boolean | null
          livestream_hours: string
          name: string
          podcasts: string
          price: number
          recording_hours: string
          storage_gb: string
          team_members: number | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id: string
          is_popular?: boolean | null
          livestream_hours: string
          name: string
          podcasts: string
          price?: number
          recording_hours: string
          storage_gb: string
          team_members?: number | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_popular?: boolean | null
          livestream_hours?: string
          name?: string
          podcasts?: string
          price?: number
          recording_hours?: string
          storage_gb?: string
          team_members?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          source_duration_seconds: number | null
          source_file_name: string | null
          source_file_size: number | null
          source_file_type: string | null
          source_file_url: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          source_duration_seconds?: number | null
          source_file_name?: string | null
          source_file_size?: number | null
          source_file_type?: string | null
          source_file_url?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          source_duration_seconds?: number | null
          source_file_name?: string | null
          source_file_size?: number | null
          source_file_type?: string | null
          source_file_url?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transcripts: {
        Row: {
          avg_confidence: number | null
          content: string | null
          created_at: string
          filler_words_detected: number | null
          id: string
          project_id: string
          segments: Json | null
          updated_at: string
          word_count: number | null
        }
        Insert: {
          avg_confidence?: number | null
          content?: string | null
          created_at?: string
          filler_words_detected?: number | null
          id?: string
          project_id: string
          segments?: Json | null
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          avg_confidence?: number | null
          content?: string | null
          created_at?: string
          filler_words_detected?: number | null
          id?: string
          project_id?: string
          segments?: Json | null
          updated_at?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_integrations: {
        Row: {
          access_token: string
          connected_at: string | null
          id: string
          platform: string
          profile_data: Json | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string | null
          id?: string
          platform: string
          profile_data?: Json | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string | null
          id?: string
          platform?: string
          profile_data?: Json | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_usage: {
        Row: {
          created_at: string | null
          id: string
          livestream_hours_used: number | null
          month_year: string
          podcasts_count: number | null
          recording_hours_used: number | null
          storage_used_gb: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          livestream_hours_used?: number | null
          month_year: string
          podcasts_count?: number | null
          recording_hours_used?: number | null
          storage_used_gb?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          livestream_hours_used?: number | null
          month_year?: string
          podcasts_count?: number | null
          recording_hours_used?: number | null
          storage_used_gb?: number | null
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
      admin_get_stats: { Args: never; Returns: Json }
      admin_get_users: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          id: string
          last_sign_in_at: string
          roles: Database["public"]["Enums"]["app_role"][]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "super_admin"
      brief_audience: "ceo" | "board" | "investor" | "creator"
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
      app_role: ["admin", "moderator", "user", "super_admin"],
      brief_audience: ["ceo", "board", "investor", "creator"],
    },
  },
} as const
