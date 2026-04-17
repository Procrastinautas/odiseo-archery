Connecting to db 5432
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      arrows: {
        Row: {
          brand: string
          created_at: string
          diameter_mm: number | null
          fletchings: string | null
          id: string
          notes: string | null
          point_type: string | null
          shaft_material: string | null
          user_id: string
        }
        Insert: {
          brand: string
          created_at?: string
          diameter_mm?: number | null
          fletchings?: string | null
          id?: string
          notes?: string | null
          point_type?: string | null
          shaft_material?: string | null
          user_id: string
        }
        Update: {
          brand?: string
          created_at?: string
          diameter_mm?: number | null
          fletchings?: string | null
          id?: string
          notes?: string | null
          point_type?: string | null
          shaft_material?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arrows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_settings: {
        Row: {
          account_holder: string
          account_number: string
          account_type: string | null
          bank_name: string
          id: string
          instructions: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_holder: string
          account_number: string
          account_type?: string | null
          bank_name: string
          id?: string
          instructions?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_holder?: string
          account_number?: string
          account_type?: string | null
          bank_name?: string
          id?: string
          instructions?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bows: {
        Row: {
          created_at: string
          draw_weight: number
          hand: Database["public"]["Enums"]["bow_hand"]
          id: string
          notes: string | null
          type: Database["public"]["Enums"]["bow_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          draw_weight: number
          hand: Database["public"]["Enums"]["bow_hand"]
          id?: string
          notes?: string | null
          type: Database["public"]["Enums"]["bow_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          draw_weight?: number
          hand?: Database["public"]["Enums"]["bow_hand"]
          id?: string
          notes?: string | null
          type?: Database["public"]["Enums"]["bow_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      improvement_areas: {
        Row: {
          attachment_url: string | null
          comment: string
          created_at: string
          id: string
          training_session_id: string
        }
        Insert: {
          attachment_url?: string | null
          comment: string
          created_at?: string
          id?: string
          training_session_id: string
        }
        Update: {
          attachment_url?: string | null
          comment?: string
          created_at?: string
          id?: string
          training_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "improvement_areas_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      marketplace_posts: {
        Row: {
          category: Database["public"]["Enums"]["marketplace_category"]
          created_at: string
          description: string
          id: string
          images: Json
          price: number | null
          status: Database["public"]["Enums"]["marketplace_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["marketplace_category"]
          created_at?: string
          description: string
          id?: string
          images?: Json
          price?: number | null
          status?: Database["public"]["Enums"]["marketplace_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["marketplace_category"]
          created_at?: string
          description?: string
          id?: string
          images?: Json
          price?: number | null
          status?: Database["public"]["Enums"]["marketplace_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          sent_at: string | null
          subject: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sent_at?: string | null
          subject: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sent_at?: string | null
          subject?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          receipt_url: string | null
          scheduled_session_id: string
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          receipt_url?: string | null
          scheduled_session_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          receipt_url?: string | null
          scheduled_session_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_scheduled_session_id_fkey"
            columns: ["scheduled_session_id"]
            isOneToOne: false
            referencedRelation: "scheduled_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          picture_url: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          picture_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          picture_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      round_scores: {
        Row: {
          below_8_count: number | null
          created_at: string
          data: Json
          id: string
          method: Database["public"]["Enums"]["score_method"]
          misses: number | null
          nines: number | null
          round_id: string
          tens: number | null
          total_score: number | null
          xs: number | null
        }
        Insert: {
          below_8_count?: number | null
          created_at?: string
          data: Json
          id?: string
          method: Database["public"]["Enums"]["score_method"]
          misses?: number | null
          nines?: number | null
          round_id: string
          tens?: number | null
          total_score?: number | null
          xs?: number | null
        }
        Update: {
          below_8_count?: number | null
          created_at?: string
          data?: Json
          id?: string
          method?: Database["public"]["Enums"]["score_method"]
          misses?: number | null
          nines?: number | null
          round_id?: string
          tens?: number | null
          total_score?: number | null
          xs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "round_scores_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: true
            referencedRelation: "rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      rounds: {
        Row: {
          created_at: string
          id: string
          round_number: number
          training_session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          round_number: number
          training_session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          round_number?: number
          training_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rounds_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_sessions: {
        Row: {
          admin_note: string | null
          created_at: string
          date: string
          distance: number
          id: string
          location_id: string
          material_arrows: boolean
          material_bow: boolean
          material_karkaj: boolean
          material_protection_gear: boolean
          material_tap: boolean
          material_weights: boolean
          notes: string | null
          status: Database["public"]["Enums"]["session_status"]
          time: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          date: string
          distance: number
          id?: string
          location_id: string
          material_arrows?: boolean
          material_bow?: boolean
          material_karkaj?: boolean
          material_protection_gear?: boolean
          material_tap?: boolean
          material_weights?: boolean
          notes?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          time: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          date?: string
          distance?: number
          id?: string
          location_id?: string
          material_arrows?: boolean
          material_bow?: boolean
          material_karkaj?: boolean
          material_protection_gear?: boolean
          material_tap?: boolean
          material_weights?: boolean
          notes?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scope_marks: {
        Row: {
          bow_id: string
          created_at: string
          distance: number
          id: string
          mark_value: string
          notes: string | null
        }
        Insert: {
          bow_id: string
          created_at?: string
          distance: number
          id?: string
          mark_value: string
          notes?: string | null
        }
        Update: {
          bow_id?: string
          created_at?: string
          distance?: number
          id?: string
          mark_value?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scope_marks_bow_id_fkey"
            columns: ["bow_id"]
            isOneToOne: false
            referencedRelation: "bows"
            referencedColumns: ["id"]
          },
        ]
      }
      stretching_plans: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "stretching_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          ai_advice: string | null
          ai_recap: string | null
          arrow_id: string | null
          bow_id: string | null
          created_at: string
          distance: number | null
          end_time: string | null
          final_thoughts: string | null
          id: string
          new_gear_notes: string | null
          physical_status: string | null
          scheduled_session_id: string | null
          scoresheet_url: string | null
          start_time: string | null
          target_size: string | null
          type: Database["public"]["Enums"]["training_type"] | null
          updated_at: string
          user_id: string
          weather: Database["public"]["Enums"]["weather_type"] | null
        }
        Insert: {
          ai_advice?: string | null
          ai_recap?: string | null
          arrow_id?: string | null
          bow_id?: string | null
          created_at?: string
          distance?: number | null
          end_time?: string | null
          final_thoughts?: string | null
          id?: string
          new_gear_notes?: string | null
          physical_status?: string | null
          scheduled_session_id?: string | null
          scoresheet_url?: string | null
          start_time?: string | null
          target_size?: string | null
          type?: Database["public"]["Enums"]["training_type"] | null
          updated_at?: string
          user_id: string
          weather?: Database["public"]["Enums"]["weather_type"] | null
        }
        Update: {
          ai_advice?: string | null
          ai_recap?: string | null
          arrow_id?: string | null
          bow_id?: string | null
          created_at?: string
          distance?: number | null
          end_time?: string | null
          final_thoughts?: string | null
          id?: string
          new_gear_notes?: string | null
          physical_status?: string | null
          scheduled_session_id?: string | null
          scoresheet_url?: string | null
          start_time?: string | null
          target_size?: string | null
          type?: Database["public"]["Enums"]["training_type"] | null
          updated_at?: string
          user_id?: string
          weather?: Database["public"]["Enums"]["weather_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_arrow_id_fkey"
            columns: ["arrow_id"]
            isOneToOne: false
            referencedRelation: "arrows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_bow_id_fkey"
            columns: ["bow_id"]
            isOneToOne: false
            referencedRelation: "bows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_scheduled_session_id_fkey"
            columns: ["scheduled_session_id"]
            isOneToOne: false
            referencedRelation: "scheduled_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      warmup_plans: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          id?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "warmup_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      bow_hand: "left" | "right"
      bow_type: "recurve" | "compound" | "barebow"
      marketplace_category: "bow" | "arrows" | "accessory" | "other"
      marketplace_status: "active" | "sold" | "removed"
      payment_status: "pending" | "confirmed" | "rejected"
      score_method: "manual" | "summary" | "target_map"
      session_status: "pending" | "confirmed" | "declined" | "cancelled"
      training_type: "control" | "training" | "contest"
      user_role: "admin" | "user"
      weather_type: "sunny" | "cloudy" | "rainy" | "heavy_rain" | "windy"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      bow_hand: ["left", "right"],
      bow_type: ["recurve", "compound", "barebow"],
      marketplace_category: ["bow", "arrows", "accessory", "other"],
      marketplace_status: ["active", "sold", "removed"],
      payment_status: ["pending", "confirmed", "rejected"],
      score_method: ["manual", "summary", "target_map"],
      session_status: ["pending", "confirmed", "declined", "cancelled"],
      training_type: ["control", "training", "contest"],
      user_role: ["admin", "user"],
      weather_type: ["sunny", "cloudy", "rainy", "heavy_rain", "windy"],
    },
  },
} as const

A new version of Supabase CLI is available: v2.90.0 (currently installed v2.84.2)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
