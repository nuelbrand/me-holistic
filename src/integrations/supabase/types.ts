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
      accountability_pairs: {
        Row: {
          created_at: string
          id: string
          partner_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          partner_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          partner_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      challenge_progress: {
        Row: {
          challenge_id: string
          created_at: string
          log_date: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          log_date?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          log_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_days: number
          id: string
          starts_on: string
          title: string
          tribe_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          starts_on?: string
          title: string
          tribe_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          starts_on?: string
          title?: string
          tribe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_tribe_id_fkey"
            columns: ["tribe_id"]
            isOneToOne: false
            referencedRelation: "tribes"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
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
          is_public: boolean
          note_content: string | null
          prayer_request: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_answered?: boolean
          is_public?: boolean
          note_content?: string | null
          prayer_request?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_answered?: boolean
          is_public?: boolean
          note_content?: string | null
          prayer_request?: string | null
          user_id?: string
        }
        Relationships: []
      }
      focus_sessions: {
        Row: {
          actual_min: number
          completed: boolean
          ended_at: string | null
          id: string
          label: string
          planned_min: number
          started_at: string
          user_id: string
        }
        Insert: {
          actual_min?: number
          completed?: boolean
          ended_at?: string | null
          id?: string
          label?: string
          planned_min?: number
          started_at?: string
          user_id: string
        }
        Update: {
          actual_min?: number
          completed?: boolean
          ended_at?: string | null
          id?: string
          label?: string
          planned_min?: number
          started_at?: string
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
      habit_logs: {
        Row: {
          created_at: string
          habit_id: string
          id: string
          log_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          habit_id: string
          id?: string
          log_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          habit_id?: string
          id?: string
          log_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived: boolean
          cadence: string
          color: string
          created_at: string
          icon: string
          id: string
          order_index: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          cadence?: string
          color?: string
          created_at?: string
          icon?: string
          id?: string
          order_index?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          cadence?: string
          color?: string
          created_at?: string
          icon?: string
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      memory_verses: {
        Row: {
          created_at: string
          ease: number
          id: string
          interval_days: number
          next_review: string
          reference: string
          review_count: number
          streak: number
          text: string
          translation: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ease?: number
          id?: string
          interval_days?: number
          next_review?: string
          reference: string
          review_count?: number
          streak?: number
          text: string
          translation?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ease?: number
          id?: string
          interval_days?: number
          next_review?: string
          reference?: string
          review_count?: number
          streak?: number
          text?: string
          translation?: string | null
          updated_at?: string
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
      nutrition_logs: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string
          description: string
          fat_g: number | null
          id: string
          log_date: string
          meal: string
          protein_g: number | null
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          description: string
          fat_g?: number | null
          id?: string
          log_date?: string
          meal: string
          protein_g?: number | null
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          description?: string
          fat_g?: number | null
          id?: string
          log_date?: string
          meal?: string
          protein_g?: number | null
          user_id?: string
        }
        Relationships: []
      }
      post_reactions: {
        Row: {
          created_at: string
          emoji: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "tribe_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_replies: {
        Row: {
          author_id: string
          created_at: string
          id: string
          parent_reply_id: string | null
          post_id: string
          text: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          parent_reply_id?: string | null
          post_id: string
          text: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          parent_reply_id?: string | null
          post_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "post_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "tribe_posts"
            referencedColumns: ["id"]
          },
        ]
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
      sleep_logs: {
        Row: {
          bedtime: string | null
          created_at: string
          hours: number
          id: string
          log_date: string
          notes: string | null
          quality: number | null
          source: string
          user_id: string
          wake_time: string | null
        }
        Insert: {
          bedtime?: string | null
          created_at?: string
          hours: number
          id?: string
          log_date?: string
          notes?: string | null
          quality?: number | null
          source?: string
          user_id: string
          wake_time?: string | null
        }
        Update: {
          bedtime?: string | null
          created_at?: string
          hours?: number
          id?: string
          log_date?: string
          notes?: string | null
          quality?: number | null
          source?: string
          user_id?: string
          wake_time?: string | null
        }
        Relationships: []
      }
      thought_records: {
        Row: {
          automatic_thought: string
          balanced_thought: string | null
          created_at: string
          emotions: string[]
          evidence_against: string | null
          evidence_for: string | null
          id: string
          intensity_after: number | null
          intensity_before: number
          situation: string
          user_id: string
        }
        Insert: {
          automatic_thought: string
          balanced_thought?: string | null
          created_at?: string
          emotions?: string[]
          evidence_against?: string | null
          evidence_for?: string | null
          id?: string
          intensity_after?: number | null
          intensity_before?: number
          situation: string
          user_id: string
        }
        Update: {
          automatic_thought?: string
          balanced_thought?: string | null
          created_at?: string
          emotions?: string[]
          evidence_against?: string | null
          evidence_for?: string | null
          id?: string
          intensity_after?: number | null
          intensity_before?: number
          situation?: string
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
      tribe_post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tribe_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "tribe_posts"
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
      water_logs: {
        Row: {
          created_at: string
          glasses: number
          goal: number
          id: string
          log_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          glasses?: number
          goal?: number
          id?: string
          log_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          glasses?: number
          goal?: number
          id?: string
          log_date?: string
          updated_at?: string
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
      weight_logs: {
        Row: {
          body_fat_pct: number | null
          created_at: string
          id: string
          log_date: string
          notes: string | null
          source: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          body_fat_pct?: number | null
          created_at?: string
          id?: string
          log_date?: string
          notes?: string | null
          source?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          body_fat_pct?: number | null
          created_at?: string
          id?: string
          log_date?: string
          notes?: string | null
          source?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string
          exercise: string
          id: string
          notes: string | null
          order_index: number
          sets: Json
          user_id: string
          workout_id: string
        }
        Insert: {
          created_at?: string
          exercise: string
          id?: string
          notes?: string | null
          order_index?: number
          sets?: Json
          user_id: string
          workout_id: string
        }
        Update: {
          created_at?: string
          exercise?: string
          id?: string
          notes?: string | null
          order_index?: number
          sets?: Json
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          calories: number | null
          created_at: string
          distance_km: number | null
          duration_min: number
          external_id: string | null
          id: string
          intensity: number
          kind: string
          mood_after: number | null
          notes: string | null
          performed_at: string
          source: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number | null
          created_at?: string
          distance_km?: number | null
          duration_min?: number
          external_id?: string | null
          id?: string
          intensity?: number
          kind?: string
          mood_after?: number | null
          notes?: string | null
          performed_at?: string
          source?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number | null
          created_at?: string
          distance_km?: number | null
          duration_min?: number
          external_id?: string | null
          id?: string
          intensity?: number
          kind?: string
          mood_after?: number | null
          notes?: string | null
          performed_at?: string
          source?: string
          title?: string | null
          updated_at?: string
          user_id?: string
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
      award_xp: { Args: { _action: string }; Returns: undefined }
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
