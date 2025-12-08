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
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
