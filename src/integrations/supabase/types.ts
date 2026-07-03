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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      daily_briefings: {
        Row: {
          briefing_date: string
          created_at: string
          focus_points: Json
          greeting: string
          id: string
          mood_summary: string | null
          user_id: string
          verse_ref: string | null
          verse_text: string | null
        }
        Insert: {
          briefing_date: string
          created_at?: string
          focus_points?: Json
          greeting: string
          id?: string
          mood_summary?: string | null
          user_id: string
          verse_ref?: string | null
          verse_text?: string | null
        }
        Update: {
          briefing_date?: string
          created_at?: string
          focus_points?: Json
          greeting?: string
          id?: string
          mood_summary?: string | null
          user_id?: string
          verse_ref?: string | null
          verse_text?: string | null
        }
        Relationships: []
      }
      devotionals: {
        Row: {
          created_at: string
          id: string
          is_answered: boolean
          note_content: string | null
          prayer_request: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_answered?: boolean
          note_content?: string | null
          prayer_request?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_answered?: boolean
          note_content?: string | null
          prayer_request?: string | null
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          order_index: number
          parent_id: string | null
          scope: Database["public"]["Enums"]["goal_scope"]
          status: Database["public"]["Enums"]["goal_status"]
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          parent_id?: string | null
          scope: Database["public"]["Enums"]["goal_scope"]
          status?: Database["public"]["Enums"]["goal_status"]
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          parent_id?: string | null
          scope?: Database["public"]["Enums"]["goal_scope"]
          status?: Database["public"]["Enums"]["goal_status"]
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      mood_logs: {
        Row: {
          id: string
          logged_at: string
          mood: Database["public"]["Enums"]["mood_label"]
          user_id: string
        }
        Insert: {
          id?: string
          logged_at?: string
          mood: Database["public"]["Enums"]["mood_label"]
          user_id: string
        }
        Update: {
          id?: string
          logged_at?: string
          mood?: Database["public"]["Enums"]["mood_label"]
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          detail_a: string | null
          detail_b: string | null
          email: string | null
          focus: string | null
          id: string
          life_phase: Database["public"]["Enums"]["life_phase"]
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          detail_a?: string | null
          detail_b?: string | null
          email?: string | null
          focus?: string | null
          id: string
          life_phase?: Database["public"]["Enums"]["life_phase"]
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          detail_a?: string | null
          detail_b?: string | null
          email?: string | null
          focus?: string | null
          id?: string
          life_phase?: Database["public"]["Enums"]["life_phase"]
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          bookmarked: boolean
          category: Database["public"]["Enums"]["resource_category"]
          created_at: string
          id: string
          status: Database["public"]["Enums"]["resource_status"]
          summary: string | null
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          user_id: string
        }
        Insert: {
          bookmarked?: boolean
          category?: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["resource_status"]
          summary?: string | null
          title: string
          type?: Database["public"]["Enums"]["resource_type"]
          user_id: string
        }
        Update: {
          bookmarked?: boolean
          category?: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["resource_status"]
          summary?: string | null
          title?: string
          type?: Database["public"]["Enums"]["resource_type"]
          user_id?: string
        }
        Relationships: []
      }
      tribe_members: {
        Row: {
          joined_at: string
          tribe_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          tribe_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          tribe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tribe_members_tribe_id_fkey"
            columns: ["tribe_id"]
            isOneToOne: false
            referencedRelation: "tribes"
            referencedColumns: ["id"]
          },
        ]
      }
      tribe_posts: {
        Row: {
          author_id: string
          created_at: string
          id: string
          likes: number
          text: string
          tribe_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          likes?: number
          text: string
          tribe_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          likes?: number
          text?: string
          tribe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tribe_posts_tribe_id_fkey"
            columns: ["tribe_id"]
            isOneToOne: false
            referencedRelation: "tribes"
            referencedColumns: ["id"]
          },
        ]
      }
      tribes: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_reviews: {
        Row: {
          created_at: string
          id: string
          patterns: Json
          suggestions: Json
          summary: string | null
          user_id: string
          week_start: string
          wins: Json
        }
        Insert: {
          created_at?: string
          id?: string
          patterns?: Json
          suggestions?: Json
          summary?: string | null
          user_id: string
          week_start: string
          wins?: Json
        }
        Update: {
          created_at?: string
          id?: string
          patterns?: Json
          suggestions?: Json
          summary?: string | null
          user_id?: string
          week_start?: string
          wins?: Json
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          action: string
          amount: number
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          amount?: number
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          amount?: number
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_stats: {
        Args: { _user_id: string }
        Returns: {
          current_streak: number
          level: number
          longest_streak: number
          total_xp: number
          xp_today: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_tribe_member: {
        Args: { _tribe_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin"
      goal_scope: "yearly" | "quarterly" | "weekly" | "daily"
      goal_status: "active" | "done" | "archived"
      life_phase: "Student" | "Employee" | "Business Owner" | "In-Transition"
      mood_label: "Excellent" | "Good" | "Neutral" | "Stressed"
      resource_category: "Faith" | "Mind" | "Body" | "General"
      resource_status: "not-started" | "in-progress" | "completed"
      resource_type: "Books" | "Audio" | "Frameworks" | "Checklists" | "Video"
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
      app_role: ["user", "admin"],
      goal_scope: ["yearly", "quarterly", "weekly", "daily"],
      goal_status: ["active", "done", "archived"],
      life_phase: ["Student", "Employee", "Business Owner", "In-Transition"],
      mood_label: ["Excellent", "Good", "Neutral", "Stressed"],
      resource_category: ["Faith", "Mind", "Body", "General"],
      resource_status: ["not-started", "in-progress", "completed"],
      resource_type: ["Books", "Audio", "Frameworks", "Checklists", "Video"],
    },
  },
} as const
