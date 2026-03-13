content = """\
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type GenericRelationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string
          picture_url: string | null
          role: 'admin' | 'user'
          created_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email: string
          picture_url?: string | null
          role?: 'admin' | 'user'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          picture_url?: string | null
          role?: 'admin' | 'user'
          created_at?: string
        }
        Relationships: []
      }
      bows: {
        Row: {
          id: string
          user_id: string
          hand: 'left' | 'right'
          type: 'recurve' | 'compound' | 'barebow'
          draw_weight: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          hand: 'left' | 'right'
          type: 'recurve' | 'compound' | 'barebow'
          draw_weight: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          hand?: 'left' | 'right'
          type?: 'recurve' | 'compound' | 'barebow'
          draw_weight?: number
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bows_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      scope_marks: {
        Row: {
          id: string
          bow_id: string
          distance: number
          mark_value: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          bow_id: string
          distance: number
          mark_value: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          bow_id?: string
          distance?: number
          mark_value?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'scope_marks_bow_id_fkey'
            columns: ['bow_id']
            isOneToOne: false
            referencedRelation: 'bows'
            referencedColumns: ['id']
          }
        ]
      }
      arrows: {
        Row: {
          id: string
          user_id: string
          brand: string
          diameter_mm: number | null
          fletchings: string | null
          shaft_material: string | null
          point_type: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          brand: string
          diameter_mm?: number | null
          fletchings?: string | null
          shaft_material?: string | null
          point_type?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          brand?: string
          diameter_mm?: number | null
          fletchings?: string | null
          shaft_material?: string | null
          point_type?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'arrows_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      locations: {
        Row: {
          id: string
          name: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      bank_settings: {
        Row: {
          id: string
          bank_name: string
          account_holder: string
          account_number: string
          account_type: string | null
          instructions: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          bank_name: string
          account_holder: string
          account_number: string
          account_type?: string | null
          instructions?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          bank_name?: string
          account_holder?: string
          account_number?: string
          account_type?: string | null
          instructions?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'bank_settings_updated_by_fkey'
            columns: ['updated_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      scheduled_sessions: {
        Row: {
          id: string
          user_id: string
          date: string
          time: string
          distance: number
          location_id: string
          status: 'pending' | 'confirmed' | 'declined' | 'cancelled'
          material_bow: boolean
          material_arrows: boolean
          material_karkaj: boolean
          material_protection_gear: boolean
          material_weights: boolean
          material_tap: boolean
          notes: string | null
          admin_note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          time: string
          distance: number
          location_id: string
          status?: 'pending' | 'confirmed' | 'declined' | 'cancelled'
          material_bow?: boolean
          material_arrows?: boolean
          material_karkaj?: boolean
          material_protection_gear?: boolean
          material_weights?: boolean
          material_tap?: boolean
          notes?: string | null
          admin_note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          time?: string
          distance?: number
          location_id?: string
          status?: 'pending' | 'confirmed' | 'declined' | 'cancelled'
          material_bow?: boolean
          material_arrows?: boolean
          material_karkaj?: boolean
          material_protection_gear?: boolean
          material_weights?: boolean
          material_tap?: boolean
          notes?: string | null
          admin_note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'scheduled_sessions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'scheduled_sessions_location_id_fkey'
            columns: ['location_id']
            isOneToOne: false
            referencedRelation: 'locations'
            referencedColumns: ['id']
          }
        ]
      }
      payments: {
        Row: {
          id: string
          scheduled_session_id: string
          user_id: string
          receipt_url: string | null
          status: 'pending' | 'confirmed' | 'rejected'
          admin_note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          scheduled_session_id: string
          user_id: string
          receipt_url?: string | null
          status?: 'pending' | 'confirmed' | 'rejected'
          admin_note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          scheduled_session_id?: string
          user_id?: string
          receipt_url?: string | null
          status?: 'pending' | 'confirmed' | 'rejected'
          admin_note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_scheduled_session_id_fkey'
            columns: ['scheduled_session_id']
            isOneToOne: false
            referencedRelation: 'scheduled_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      training_sessions: {
        Row: {
          id: string
          scheduled_session_id: string | null
          user_id: string
          weather: 'sunny' | 'cloudy' | 'rainy' | 'heavy_rain' | 'windy' | null
          type: 'control' | 'training' | 'contest' | null
          distance: number | null
          start_time: string | null
          end_time: string | null
          target_size: string | null
          bow_id: string | null
          arrow_id: string | null
          new_gear_notes: string | null
          physical_status: string | null
          scoresheet_url: string | null
          final_thoughts: string | null
          ai_recap: string | null
          ai_advice: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          scheduled_session_id?: string | null
          user_id: string
          weather?: 'sunny' | 'cloudy' | 'rainy' | 'heavy_rain' | 'windy' | null
          type?: 'control' | 'training' | 'contest' | null
          distance?: number | null
          start_time?: string | null
          end_time?: string | null
          target_size?: string | null
          bow_id?: string | null
          arrow_id?: string | null
          new_gear_notes?: string | null
          physical_status?: string | null
          scoresheet_url?: string | null
          final_thoughts?: string | null
          ai_recap?: string | null
          ai_advice?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          scheduled_session_id?: string | null
          user_id?: string
          weather?: 'sunny' | 'cloudy' | 'rainy' | 'heavy_rain' | 'windy' | null
          type?: 'control' | 'training' | 'contest' | null
          distance?: number | null
          start_time?: string | null
          end_time?: string | null
          target_size?: string | null
          bow_id?: string | null
          arrow_id?: string | null
          new_gear_notes?: string | null
          physical_status?: string | null
          scoresheet_url?: string | null
          final_thoughts?: string | null
          ai_recap?: string | null
          ai_advice?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'training_sessions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'training_sessions_scheduled_session_id_fkey'
            columns: ['scheduled_session_id']
            isOneToOne: false
            referencedRelation: 'scheduled_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'training_sessions_bow_id_fkey'
            columns: ['bow_id']
            isOneToOne: false
            referencedRelation: 'bows'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'training_sessions_arrow_id_fkey'
            columns: ['arrow_id']
            isOneToOne: false
            referencedRelation: 'arrows'
            referencedColumns: ['id']
          }
        ]
      }
      rounds: {
        Row: {
          id: string
          training_session_id: string
          round_number: number
          created_at: string
        }
        Insert: {
          id?: string
          training_session_id: string
          round_number: number
          created_at?: string
        }
        Update: {
          id?: string
          training_session_id?: string
          round_number?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'rounds_training_session_id_fkey'
            columns: ['training_session_id']
            isOneToOne: false
            referencedRelation: 'training_sessions'
            referencedColumns: ['id']
          }
        ]
      }
      round_scores: {
        Row: {
          id: string
          round_id: string
          method: 'manual' | 'summary' | 'target_map'
          data: Json
          total_score: number | null
          tens: number | null
          xs: number | null
          nines: number | null
          below_8_count: number | null
          misses: number | null
          created_at: string
        }
        Insert: {
          id?: string
          round_id: string
          method: 'manual' | 'summary' | 'target_map'
          data: Json
          total_score?: number | null
          tens?: number | null
          xs?: number | null
          nines?: number | null
          below_8_count?: number | null
          misses?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          round_id?: string
          method?: 'manual' | 'summary' | 'target_map'
          data?: Json
          total_score?: number | null
          tens?: number | null
          xs?: number | null
          nines?: number | null
          below_8_count?: number | null
          misses?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'round_scores_round_id_fkey'
            columns: ['round_id']
            isOneToOne: false
            referencedRelation: 'rounds'
            referencedColumns: ['id']
          }
        ]
      }
      improvement_areas: {
        Row: {
          id: string
          training_session_id: string
          comment: string
          attachment_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          training_session_id: string
          comment: string
          attachment_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          training_session_id?: string
          comment?: string
          attachment_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'improvement_areas_training_session_id_fkey'
            columns: ['training_session_id']
            isOneToOne: false
            referencedRelation: 'training_sessions'
            referencedColumns: ['id']
          }
        ]
      }
      warmup_plans: {
        Row: {
          id: string
          title: string
          description: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'warmup_plans_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      stretching_plans: {
        Row: {
          id: string
          title: string
          description: string
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'stretching_plans_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          subject: string
          body: string
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          subject: string
          body: string
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          subject?: string
          body?: string
          sent_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      marketplace_posts: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          price: number | null
          category: 'bow' | 'arrows' | 'accessory' | 'other'
          images: Json
          status: 'active' | 'sold' | 'removed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          price?: number | null
          category: 'bow' | 'arrows' | 'accessory' | 'other'
          images?: Json
          status?: 'active' | 'sold' | 'removed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          price?: number | null
          category?: 'bow' | 'arrows' | 'accessory' | 'other'
          images?: Json
          status?: 'active' | 'sold' | 'removed'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'marketplace_posts_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
  }
}
"""

with open('/Users/camilopr/weeellp/odiseo-app/src/types/database.ts', 'w') as f:
    f.write(content)
print('done', len(content.splitlines()), 'lines')
