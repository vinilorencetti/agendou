// Auto-generated types — regenerate with:
// npx supabase gen types typescript --project-id <id> > types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'master_admin' | 'adm_geral' | 'adm_basico' | 'cliente'
export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
export type TenantStatus = 'active' | 'suspended' | 'cancelled'
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export type FinancialEntryType = 'income' | 'expense'
export type FinancialEntryStatus = 'pending' | 'paid' | 'cancelled'

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          slug: string
          name: string
          status: TenantStatus
          phone: string | null
          email: string | null
          description: string | null
          address_street: string | null
          address_number: string | null
          address_district: string | null
          address_city: string | null
          address_state: string | null
          address_zip: string | null
          logo_url: string | null
          primary_color: string
          secondary_color: string
          background_color: string
          theme_name: string
          cancellation_policy_hours: number
          plan: string
          plan_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          slug: string
          name: string
          status?: TenantStatus
          phone?: string | null
          email?: string | null
          description?: string | null
          address_street?: string | null
          address_number?: string | null
          address_district?: string | null
          address_city?: string | null
          address_state?: string | null
          address_zip?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          background_color?: string
          theme_name?: string
          cancellation_policy_hours?: number
          plan?: string
          plan_expires_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>
        Relationships: []
      }
      users: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          avatar_url?: string | null
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          tenant_id: string | null
          role: UserRole
          is_active: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          tenant_id?: string | null
          role: UserRole
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>
        Relationships: [
          { foreignKeyName: 'user_roles_tenant_id_fkey'; columns: ['tenant_id']; isOneToOne: false; referencedRelation: 'tenants'; referencedColumns: ['id'] },
          { foreignKeyName: 'user_roles_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'users'; referencedColumns: ['id'] },
        ]
      }
      services: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          duration_min: number
          price: number
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          name: string
          description?: string | null
          duration_min: number
          price: number
          is_active?: boolean
          display_order?: number
        }
        Update: Partial<Database['public']['Tables']['services']['Insert']>
        Relationships: [
          { foreignKeyName: 'services_tenant_id_fkey'; columns: ['tenant_id']; isOneToOne: false; referencedRelation: 'tenants'; referencedColumns: ['id'] },
        ]
      }
      professionals: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          name: string
          bio: string | null
          avatar_url: string | null
          commission_pct: number
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          name: string
          user_id?: string | null
          bio?: string | null
          avatar_url?: string | null
          commission_pct?: number
          is_active?: boolean
          display_order?: number
        }
        Update: Partial<Database['public']['Tables']['professionals']['Insert']>
        Relationships: [
          { foreignKeyName: 'professionals_tenant_id_fkey'; columns: ['tenant_id']; isOneToOne: false; referencedRelation: 'tenants'; referencedColumns: ['id'] },
          { foreignKeyName: 'professionals_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'users'; referencedColumns: ['id'] },
        ]
      }
      professional_services: {
        Row: {
          professional_id: string
          service_id: string
        }
        Insert: {
          professional_id: string
          service_id: string
        }
        Update: {
          professional_id?: string
          service_id?: string
        }
        Relationships: [
          { foreignKeyName: 'professional_services_professional_id_fkey'; columns: ['professional_id']; isOneToOne: false; referencedRelation: 'professionals'; referencedColumns: ['id'] },
          { foreignKeyName: 'professional_services_service_id_fkey'; columns: ['service_id']; isOneToOne: false; referencedRelation: 'services'; referencedColumns: ['id'] },
        ]
      }
      professional_schedules: {
        Row: {
          id: string
          professional_id: string
          day: DayOfWeek
          is_working: boolean
          start_time: string
          end_time: string
          break_start_time: string | null
          break_end_time: string | null
          created_at: string
        }
        Insert: {
          professional_id: string
          day: DayOfWeek
          is_working?: boolean
          start_time: string
          end_time: string
          break_start_time?: string | null
          break_end_time?: string | null
        }
        Update: Partial<Database['public']['Tables']['professional_schedules']['Insert']>
        Relationships: [
          { foreignKeyName: 'professional_schedules_professional_id_fkey'; columns: ['professional_id']; isOneToOne: false; referencedRelation: 'professionals'; referencedColumns: ['id'] },
        ]
      }
      professional_blocked_times: {
        Row: {
          id: string
          professional_id: string
          start_at: string
          end_at: string
          reason: string | null
          created_at: string
        }
        Insert: {
          professional_id: string
          start_at: string
          end_at: string
          reason?: string | null
        }
        Update: Partial<Database['public']['Tables']['professional_blocked_times']['Insert']>
        Relationships: [
          { foreignKeyName: 'professional_blocked_times_professional_id_fkey'; columns: ['professional_id']; isOneToOne: false; referencedRelation: 'professionals'; referencedColumns: ['id'] },
        ]
      }
      clients: {
        Row: {
          id: string
          tenant_id: string
          user_id: string | null
          full_name: string
          phone: string | null
          email: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          full_name: string
          user_id?: string | null
          phone?: string | null
          email?: string | null
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
        Relationships: [
          { foreignKeyName: 'clients_tenant_id_fkey'; columns: ['tenant_id']; isOneToOne: false; referencedRelation: 'tenants'; referencedColumns: ['id'] },
          { foreignKeyName: 'clients_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'users'; referencedColumns: ['id'] },
        ]
      }
      appointments: {
        Row: {
          id: string
          tenant_id: string
          client_id: string
          professional_id: string
          service_id: string
          status: AppointmentStatus
          starts_at: string
          ends_at: string
          price_snapshot: number
          duration_min_snapshot: number
          notes: string | null
          internal_notes: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          client_id: string
          professional_id: string
          service_id: string
          status: AppointmentStatus
          starts_at: string
          ends_at: string
          price_snapshot: number
          duration_min_snapshot: number
          notes?: string | null
          internal_notes?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
        }
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
        Relationships: [
          { foreignKeyName: 'appointments_client_id_fkey'; columns: ['client_id']; isOneToOne: false; referencedRelation: 'clients'; referencedColumns: ['id'] },
          { foreignKeyName: 'appointments_professional_id_fkey'; columns: ['professional_id']; isOneToOne: false; referencedRelation: 'professionals'; referencedColumns: ['id'] },
          { foreignKeyName: 'appointments_service_id_fkey'; columns: ['service_id']; isOneToOne: false; referencedRelation: 'services'; referencedColumns: ['id'] },
          { foreignKeyName: 'appointments_tenant_id_fkey'; columns: ['tenant_id']; isOneToOne: false; referencedRelation: 'tenants'; referencedColumns: ['id'] },
        ]
      }
      financial_entries: {
        Row: {
          id: string
          tenant_id: string
          appointment_id: string | null
          professional_id: string | null
          type: FinancialEntryType
          status: FinancialEntryStatus
          description: string
          amount: number
          due_date: string
          paid_at: string | null
          category: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          tenant_id: string
          type: FinancialEntryType
          status: FinancialEntryStatus
          description: string
          amount: number
          due_date: string
          appointment_id?: string | null
          professional_id?: string | null
          paid_at?: string | null
          category?: string | null
          notes?: string | null
          created_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['financial_entries']['Insert']>
        Relationships: [
          { foreignKeyName: 'financial_entries_appointment_id_fkey'; columns: ['appointment_id']; isOneToOne: false; referencedRelation: 'appointments'; referencedColumns: ['id'] },
          { foreignKeyName: 'financial_entries_professional_id_fkey'; columns: ['professional_id']; isOneToOne: false; referencedRelation: 'professionals'; referencedColumns: ['id'] },
          { foreignKeyName: 'financial_entries_tenant_id_fkey'; columns: ['tenant_id']; isOneToOne: false; referencedRelation: 'tenants'; referencedColumns: ['id'] },
        ]
      }
      tenant_business_hours: {
        Row: {
          id: string
          tenant_id: string
          day: DayOfWeek
          is_open: boolean
          open_time: string
          close_time: string
          created_at: string
        }
        Insert: {
          tenant_id: string
          day: DayOfWeek
          is_open?: boolean
          open_time: string
          close_time: string
        }
        Update: Partial<Database['public']['Tables']['tenant_business_hours']['Insert']>
        Relationships: [
          { foreignKeyName: 'tenant_business_hours_tenant_id_fkey'; columns: ['tenant_id']; isOneToOne: false; referencedRelation: 'tenants'; referencedColumns: ['id'] },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      auth_is_master_admin: { Args: Record<string, never>; Returns: boolean }
      auth_is_adm_geral: { Args: { p_tenant_id: string }; Returns: boolean }
      auth_is_any_admin: { Args: { p_tenant_id: string }; Returns: boolean }
      auth_user_role: { Args: { p_tenant_id: string }; Returns: UserRole }
      auth_has_permission: { Args: { p_tenant_id: string; p_permission: string }; Returns: boolean }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
