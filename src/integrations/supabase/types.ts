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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_sessions: {
        Row: {
          admin_user_id: string
          created_at: string
          current_section: string
          display_name: string | null
          email: string | null
          id: string
          last_seen_at: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          current_section?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_seen_at?: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          current_section?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_seen_at?: string
        }
        Relationships: []
      }
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
      clips: {
        Row: {
          caption_style: Json | null
          created_at: string
          end_time: string
          hook: string | null
          id: string
          metadata: Json | null
          platforms: string[] | null
          project_id: string
          render_id: string | null
          render_status: string | null
          render_url: string | null
          score: number | null
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          caption_style?: Json | null
          created_at?: string
          end_time: string
          hook?: string | null
          id?: string
          metadata?: Json | null
          platforms?: string[] | null
          project_id: string
          render_id?: string | null
          render_status?: string | null
          render_url?: string | null
          score?: number | null
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          caption_style?: Json | null
          created_at?: string
          end_time?: string
          hook?: string | null
          id?: string
          metadata?: Json | null
          platforms?: string[] | null
          project_id?: string
          render_id?: string | null
          render_status?: string | null
          render_url?: string | null
          score?: number | null
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clips_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      creator_profiles: {
        Row: {
          accent_color: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string
          featured_project_ids: string[] | null
          handle: string
          hero_image_url: string | null
          highlight_metrics: Json | null
          id: string
          is_public: boolean | null
          primary_color: string | null
          social_links: Json | null
          tagline: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name: string
          featured_project_ids?: string[] | null
          handle: string
          hero_image_url?: string | null
          highlight_metrics?: Json | null
          id?: string
          is_public?: boolean | null
          primary_color?: string | null
          social_links?: Json | null
          tagline?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accent_color?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string
          featured_project_ids?: string[] | null
          handle?: string
          hero_image_url?: string | null
          highlight_metrics?: Json | null
          id?: string
          is_public?: boolean | null
          primary_color?: string | null
          social_links?: Json | null
          tagline?: string | null
          updated_at?: string | null
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
      email_events: {
        Row: {
          email_send_id: string | null
          event_data: Json | null
          event_type: string
          id: string
          occurred_at: string | null
        }
        Insert: {
          email_send_id?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          occurred_at?: string | null
        }
        Update: {
          email_send_id?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          occurred_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_email_send_id_fkey"
            columns: ["email_send_id"]
            isOneToOne: false
            referencedRelation: "email_sends"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sends: {
        Row: {
          bounced_at: string | null
          clicked_at: string | null
          created_at: string | null
          created_by: string | null
          delivered_at: string | null
          from_email: string
          id: string
          metadata: Json | null
          opened_at: string | null
          resend_id: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_id: string | null
          to_email: string
          variables: Json | null
        }
        Insert: {
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          from_email: string
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
          to_email: string
          variables?: Json | null
        }
        Update: {
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          from_email?: string
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          resend_id?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
          to_email?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          text_content: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      episodes: {
        Row: {
          audio_url: string | null
          created_at: string | null
          description: string | null
          duration_seconds: number | null
          episode_number: number | null
          file_size_bytes: number | null
          guid: string | null
          id: string
          podcast_id: string
          pub_date: string | null
          season_number: number | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          episode_number?: number | null
          file_size_bytes?: number | null
          guid?: string | null
          id?: string
          podcast_id: string
          pub_date?: string | null
          season_number?: number | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_seconds?: number | null
          episode_number?: number | null
          file_size_bytes?: number | null
          guid?: string | null
          id?: string
          podcast_id?: string
          pub_date?: string | null
          season_number?: number | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
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
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          task_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          task_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          task_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      podcast_distributions: {
        Row: {
          created_at: string
          id: string
          live_url: string | null
          notes: string | null
          platform: string
          podcast_id: string
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          live_url?: string | null
          notes?: string | null
          platform: string
          podcast_id: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          live_url?: string | null
          notes?: string | null
          platform?: string
          podcast_id?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "podcast_distributions_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      podcasts: {
        Row: {
          author: string | null
          author_email: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_explicit: boolean | null
          language: string | null
          rss_feed_url: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          author?: string | null
          author_email?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_explicit?: boolean | null
          language?: string | null
          rss_feed_url?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          author?: string | null
          author_email?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_explicit?: boolean | null
          language?: string | null
          rss_feed_url?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
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
      rss_imports: {
        Row: {
          created_at: string | null
          episodes_imported: number | null
          error_message: string | null
          id: string
          podcast_id: string | null
          rss_url: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          episodes_imported?: number | null
          error_message?: string | null
          id?: string
          podcast_id?: string | null
          rss_url: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          episodes_imported?: number | null
          error_message?: string | null
          id?: string
          podcast_id?: string | null
          rss_url?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rss_imports_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignees: {
        Row: {
          created_at: string
          id: string
          role: string | null
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string | null
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string | null
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_filter_configs: {
        Row: {
          created_at: string | null
          display_order: number | null
          field: string
          id: string
          is_default: boolean | null
          label: string
          operator: string
          options: Json | null
          slug: string
          type: string
          updated_at: string | null
          visible_by_default: boolean | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          field: string
          id?: string
          is_default?: boolean | null
          label: string
          operator?: string
          options?: Json | null
          slug: string
          type: string
          updated_at?: string | null
          visible_by_default?: boolean | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          field?: string
          id?: string
          is_default?: boolean | null
          label?: string
          operator?: string
          options?: Json | null
          slug?: string
          type?: string
          updated_at?: string | null
          visible_by_default?: boolean | null
        }
        Relationships: []
      }
      task_priorities: {
        Row: {
          code: string
          color: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      task_sections: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_collapsed: boolean | null
          name: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_collapsed?: boolean | null
          name: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_collapsed?: boolean | null
          name?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      task_statuses: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      task_watchers: {
        Row: {
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_watchers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          area: string | null
          assignee_id: string | null
          created_at: string
          creator_id: string
          description: string | null
          due_date: string | null
          id: string
          linked_url: string | null
          priority: string
          priority_id: string | null
          release_target: string | null
          section_id: string | null
          status: string
          status_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          assignee_id?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          linked_url?: string | null
          priority?: string
          priority_id?: string | null
          release_target?: string | null
          section_id?: string | null
          status?: string
          status_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          assignee_id?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          linked_url?: string | null
          priority?: string
          priority_id?: string | null
          release_target?: string | null
          section_id?: string | null
          status?: string
          status_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_priority_id_fkey"
            columns: ["priority_id"]
            isOneToOne: false
            referencedRelation: "task_priorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "task_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "task_statuses"
            referencedColumns: ["id"]
          },
        ]
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
      user_preferences: {
        Row: {
          created_at: string
          id: string
          preference_key: string
          preference_value: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preference_key: string
          preference_value?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preference_key?: string
          preference_value?: Json
          updated_at?: string
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
