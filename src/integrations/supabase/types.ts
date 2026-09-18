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
      addresses: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          label: string
          landmark: string | null
          line: string
          notes: string | null
          user_id: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          landmark?: string | null
          line: string
          notes?: string | null
          user_id: string
          zone_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          landmark?: string | null
          line?: string
          notes?: string | null
          user_id?: string
          zone_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          detail: Json | null
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          detail?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          detail?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      favourite_products: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          final_unit_price: number | null
          final_weight_kg: number | null
          id: string
          line_total: number
          name: string
          order_id: string
          pack_size: string | null
          picked_quantity: number | null
          product_id: string
          quantity: number
          shopper_note: string | null
          status: string
          store_id: string
          substitution: string
          unit_price: number
        }
        Insert: {
          final_unit_price?: number | null
          final_weight_kg?: number | null
          id?: string
          line_total: number
          name: string
          order_id: string
          pack_size?: string | null
          picked_quantity?: number | null
          product_id: string
          quantity?: number
          shopper_note?: string | null
          status?: string
          store_id: string
          substitution?: string
          unit_price: number
        }
        Update: {
          final_unit_price?: number | null
          final_weight_kg?: number | null
          id?: string
          line_total?: number
          name?: string
          order_id?: string
          pack_size?: string | null
          picked_quantity?: number | null
          product_id?: string
          quantity?: number
          shopper_note?: string | null
          status?: string
          store_id?: string
          substitution?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_landmark: string | null
          address_line: string
          address_zone: string
          admin_note: string | null
          code: string
          collected_at: string | null
          delivered_at: string | null
          delivery_failed_reason: string | null
          delivery_fee: number
          delivery_notes: string | null
          delivery_proof_path: string | null
          final_total: number | null
          handover: string | null
          hide_prices: boolean
          id: string
          id_checked: boolean | null
          payment_method: string
          payment_status: string
          pin: string
          pin_verified: boolean
          placed_at: string
          recipient_name: string | null
          recipient_phone: string | null
          rider_id: string | null
          savings: number
          service_fee: number
          shopper_id: string | null
          shopper_receipt_path: string | null
          slot_id: string
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address_landmark?: string | null
          address_line: string
          address_zone: string
          admin_note?: string | null
          code: string
          collected_at?: string | null
          delivered_at?: string | null
          delivery_failed_reason?: string | null
          delivery_fee?: number
          delivery_notes?: string | null
          delivery_proof_path?: string | null
          final_total?: number | null
          handover?: string | null
          hide_prices?: boolean
          id?: string
          id_checked?: boolean | null
          payment_method: string
          payment_status?: string
          pin: string
          pin_verified?: boolean
          placed_at?: string
          recipient_name?: string | null
          recipient_phone?: string | null
          rider_id?: string | null
          savings?: number
          service_fee?: number
          shopper_id?: string | null
          shopper_receipt_path?: string | null
          slot_id: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address_landmark?: string | null
          address_line?: string
          address_zone?: string
          admin_note?: string | null
          code?: string
          collected_at?: string | null
          delivered_at?: string | null
          delivery_failed_reason?: string | null
          delivery_fee?: number
          delivery_notes?: string | null
          delivery_proof_path?: string | null
          final_total?: number | null
          handover?: string | null
          hide_prices?: boolean
          id?: string
          id_checked?: boolean | null
          payment_method?: string
          payment_status?: string
          pin?: string
          pin_verified?: boolean
          placed_at?: string
          recipient_name?: string | null
          recipient_phone?: string | null
          rider_id?: string | null
          savings?: number
          service_fee?: number
          shopper_id?: string | null
          shopper_receipt_path?: string | null
          slot_id?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shopper_id_fkey"
            columns: ["shopper_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          created_at: string
          file_path: string | null
          id: string
          note: string | null
          order_id: string
          reference: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          id?: string
          note?: string | null
          order_id: string
          reference?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string | null
          id?: string
          note?: string | null
          order_id?: string
          reference?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          method: string
          order_id: string
          reference: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          method: string
          order_id: string
          reference?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          method?: string
          order_id?: string
          reference?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_verified: boolean
          created_at: string
          default_substitution: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          age_verified?: boolean
          created_at?: string
          default_substitution?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          age_verified?: boolean
          created_at?: string
          default_substitution?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_lists: {
        Row: {
          created_at: string
          id: string
          name: string
          product_ids: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          product_ids?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          product_ids?: string[]
          user_id?: string
        }
        Relationships: []
      }
      shopping_list_requests: {
        Row: {
          body: string | null
          created_at: string
          id: string
          image_path: string | null
          instructions: string | null
          preference: string | null
          status: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          image_path?: string | null
          instructions?: string | null
          preference?: string | null
          status?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          image_path?: string | null
          instructions?: string | null
          preference?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          active: boolean
          created_at: string
          id: string
          link_code: string | null
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string | null
          vehicle: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          link_code?: string | null
          name: string
          phone?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
          vehicle?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          link_code?: string | null
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
          vehicle?: string | null
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_staff_code: { Args: { _code: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_assigned_to_order: { Args: { _order_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      my_staff_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      app_role:
        | "customer"
        | "shopper"
        | "rider"
        | "store_manager"
        | "admin"
        | "super_admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "customer",
        "shopper",
        "rider",
        "store_manager",
        "admin",
        "super_admin",
      ],
    },
  },
} as const
