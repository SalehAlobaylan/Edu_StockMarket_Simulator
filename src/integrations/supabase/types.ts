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
      assets: {
        Row: {
          created_at: string | null
          currency: string | null
          exchange: string | null
          id: string
          is_active: boolean | null
          name: string
          sector: string | null
          ticker: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          exchange?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sector?: string | null
          ticker: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          exchange?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sector?: string | null
          ticker?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      equation_templates: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          difficulty: string | null
          entry_logic: string
          exit_logic: string
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          entry_logic: string
          exit_logic: string
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          entry_logic?: string
          exit_logic?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      fills: {
        Row: {
          commission: number | null
          fill_price: number
          filled_at: string | null
          filled_quantity: number
          id: string
          order_id: string
          slippage: number | null
        }
        Insert: {
          commission?: number | null
          fill_price: number
          filled_at?: string | null
          filled_quantity: number
          id?: string
          order_id: string
          slippage?: number | null
        }
        Update: {
          commission?: number | null
          fill_price?: number
          filled_at?: string | null
          filled_quantity?: number
          id?: string
          order_id?: string
          slippage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fills_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      holdings: {
        Row: {
          asset_id: string | null
          avg_price: number
          created_at: string
          id: string
          name: string
          portfolio_id: string
          quantity: number
          ticker: string
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          avg_price: number
          created_at?: string
          id?: string
          name: string
          portfolio_id: string
          quantity?: number
          ticker: string
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          avg_price?: number
          created_at?: string
          id?: string
          name?: string
          portfolio_id?: string
          quantity?: number
          ticker?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "holdings_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holdings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          payload: Json | null
          progress_pct: number | null
          result_ref: string | null
          started_at: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          payload?: Json | null
          progress_pct?: number | null
          result_ref?: string | null
          started_at?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          payload?: Json | null
          progress_pct?: number | null
          result_ref?: string | null
          started_at?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      market_candles: {
        Row: {
          asset_id: string
          close: number
          high: number
          id: string
          low: number
          open: number
          timestamp: string
          volume: number | null
        }
        Insert: {
          asset_id: string
          close: number
          high: number
          id?: string
          low: number
          open: number
          timestamp: string
          volume?: number | null
        }
        Update: {
          asset_id?: string
          close?: number
          high?: number
          id?: string
          low?: number
          open?: number
          timestamp?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_candles_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          asset_id: string
          created_at: string | null
          id: string
          limit_price: number | null
          order_type: string | null
          quantity: number
          side: string
          simulation_id: string
          status: string | null
        }
        Insert: {
          asset_id: string
          created_at?: string | null
          id?: string
          limit_price?: number | null
          order_type?: string | null
          quantity: number
          side: string
          simulation_id: string
          status?: string | null
        }
        Update: {
          asset_id?: string
          created_at?: string | null
          id?: string
          limit_price?: number | null
          order_type?: string | null
          quantity?: number
          side?: string
          simulation_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          cash_balance: number
          created_at: string
          id: string
          initial_capital: number
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cash_balance?: number
          created_at?: string
          id?: string
          initial_capital?: number
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cash_balance?: number
          created_at?: string
          id?: string
          initial_capital?: number
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          default_capital: number | null
          default_commission: number | null
          default_slippage: number | null
          default_stop_loss: number | null
          default_take_profit: number | null
          full_name: string | null
          id: string
          max_position_pct: number | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_capital?: number | null
          default_commission?: number | null
          default_slippage?: number | null
          default_stop_loss?: number | null
          default_take_profit?: number | null
          full_name?: string | null
          id?: string
          max_position_pct?: number | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_capital?: number | null
          default_commission?: number | null
          default_slippage?: number | null
          default_stop_loss?: number | null
          default_take_profit?: number | null
          full_name?: string | null
          id?: string
          max_position_pct?: number | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      risk_events: {
        Row: {
          details: Json | null
          event_type: string
          id: string
          simulation_id: string
          triggered_at: string | null
        }
        Insert: {
          details?: Json | null
          event_type: string
          id?: string
          simulation_id: string
          triggered_at?: string | null
        }
        Update: {
          details?: Json | null
          event_type?: string
          id?: string
          simulation_id?: string
          triggered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_events_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_profiles: {
        Row: {
          allow_short: boolean | null
          created_at: string | null
          id: string
          is_default: boolean | null
          max_drawdown_pct: number | null
          max_leverage: number | null
          max_notional: number | null
          max_position_pct: number | null
          name: string
          stop_loss_pct: number | null
          take_profit_pct: number | null
          trailing_stop_pct: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_short?: boolean | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          max_drawdown_pct?: number | null
          max_leverage?: number | null
          max_notional?: number | null
          max_position_pct?: number | null
          name: string
          stop_loss_pct?: number | null
          take_profit_pct?: number | null
          trailing_stop_pct?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_short?: boolean | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          max_drawdown_pct?: number | null
          max_leverage?: number | null
          max_notional?: number | null
          max_position_pct?: number | null
          name?: string
          stop_loss_pct?: number | null
          take_profit_pct?: number | null
          trailing_stop_pct?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      simulation_events: {
        Row: {
          details: Json | null
          event_type: string
          id: string
          simulation_id: string
          timestamp: string | null
        }
        Insert: {
          details?: Json | null
          event_type: string
          id?: string
          simulation_id: string
          timestamp?: string | null
        }
        Update: {
          details?: Json | null
          event_type?: string
          id?: string
          simulation_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulation_events_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      simulations: {
        Row: {
          asset_id: string | null
          cagr_pct: number | null
          commission_pct: number | null
          completed_at: string | null
          created_at: string
          end_date: string
          id: string
          initial_capital: number
          max_drawdown_pct: number | null
          max_position_pct: number | null
          name: string
          num_trades: number | null
          result_data: Json | null
          risk_profile_id: string | null
          sharpe_ratio: number | null
          slippage_bps: number | null
          start_date: string
          status: string
          strategy_id: string | null
          ticker: string
          total_return_pct: number | null
          user_id: string
          win_rate_pct: number | null
        }
        Insert: {
          asset_id?: string | null
          cagr_pct?: number | null
          commission_pct?: number | null
          completed_at?: string | null
          created_at?: string
          end_date: string
          id?: string
          initial_capital?: number
          max_drawdown_pct?: number | null
          max_position_pct?: number | null
          name: string
          num_trades?: number | null
          result_data?: Json | null
          risk_profile_id?: string | null
          sharpe_ratio?: number | null
          slippage_bps?: number | null
          start_date: string
          status?: string
          strategy_id?: string | null
          ticker: string
          total_return_pct?: number | null
          user_id: string
          win_rate_pct?: number | null
        }
        Update: {
          asset_id?: string | null
          cagr_pct?: number | null
          commission_pct?: number | null
          completed_at?: string | null
          created_at?: string
          end_date?: string
          id?: string
          initial_capital?: number
          max_drawdown_pct?: number | null
          max_position_pct?: number | null
          name?: string
          num_trades?: number | null
          result_data?: Json | null
          risk_profile_id?: string | null
          sharpe_ratio?: number | null
          slippage_bps?: number | null
          start_date?: string
          status?: string
          strategy_id?: string | null
          ticker?: string
          total_return_pct?: number | null
          user_id?: string
          win_rate_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "simulations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_risk_profile_id_fkey"
            columns: ["risk_profile_id"]
            isOneToOne: false
            referencedRelation: "risk_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          created_at: string
          description: string | null
          entry_logic: string
          exit_logic: string
          id: string
          indicators_used: string[] | null
          is_template: boolean | null
          name: string
          updated_at: string
          user_id: string
          variables_used: string[] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          entry_logic: string
          exit_logic: string
          id?: string
          indicators_used?: string[] | null
          is_template?: boolean | null
          name: string
          updated_at?: string
          user_id: string
          variables_used?: string[] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          entry_logic?: string
          exit_logic?: string
          id?: string
          indicators_used?: string[] | null
          is_template?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
          variables_used?: string[] | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          commission: number | null
          created_at: string
          id: string
          portfolio_id: string
          price: number
          quantity: number
          ticker: string
          type: string
          value: number
        }
        Insert: {
          commission?: number | null
          created_at?: string
          id?: string
          portfolio_id: string
          price: number
          quantity: number
          ticker: string
          type: string
          value: number
        }
        Update: {
          commission?: number | null
          created_at?: string
          id?: string
          portfolio_id?: string
          price?: number
          quantity?: number
          ticker?: string
          type?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      watchlist: {
        Row: {
          created_at: string
          id: string
          ticker: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ticker: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ticker?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
