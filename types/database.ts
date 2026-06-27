export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: { id: number; name: string; created_at: string }
        Insert: { id?: number; name: string; created_at?: string }
        Update: { id?: number; name: string; created_at?: string }
      }
      profiles: {
        Row: { id: string; full_name: string | null; avatar_url: string | null; role_id: number; updated_at: string | null; created_at: string }
        Insert: { id: string; full_name?: string | null; avatar_url?: string | null; role_id?: number; updated_at?: string | null; created_at?: string }
        Update: { id?: string; full_name?: string | null; avatar_url?: string | null; role_id?: number; updated_at?: string | null; created_at?: string }
      }
      event_categories: {
        Row: { id: number; name: string; slug: string; description: string | null; created_at: string }
        Insert: { id?: number; name: string; slug: string; description?: string | null; created_at?: string }
        Update: { id?: number; name: string; slug?: string; description?: string | null; created_at?: string }
      }
      events: {
        Row: { id: string; organizer_id: string; category_id: number | null; title: string; description: string | null; location_name: string | null; city: string | null; latitude: number | null; longitude: number | null; start_date: string; end_date: string; banner_url: string | null; capacity: number; is_published: boolean; ticket_tiers: any; coupons: any; created_at: string }
        Insert: { id?: string; organizer_id: string; category_id?: number | null; title: string; description?: string | null; location_name?: string | null; city?: string | null; latitude?: number | null; longitude?: number | null; start_date: string; end_date: string; banner_url?: string | null; capacity: number; is_published?: boolean; ticket_tiers?: any; coupons?: any; created_at?: string }
        Update: { id?: string; organizer_id?: string; category_id?: number | null; title?: string; description?: string | null; location_name?: string | null; city?: string | null; latitude?: number | null; longitude?: number | null; start_date?: string; end_date?: string; banner_url?: string | null; capacity?: number; is_published?: boolean; ticket_tiers?: any; coupons?: any; created_at?: string }
      }
      tickets: {
        Row: { id: string; event_id: string; profile_id: string; ticket_type: string; price: number; qr_code_data: string | null; status: string; created_at: string }
        Insert: { id?: string; event_id: string; profile_id: string; ticket_type?: string; price?: number; qr_code_data?: string | null; status?: string; created_at?: string }
        Update: { id?: string; event_id?: string; profile_id?: string; ticket_type?: string; price?: number; qr_code_data?: string | null; status?: string; created_at?: string }
      }
      payments: {
        Row: { id: string; ticket_id: string; amount: number; currency: string; status: string; stripe_payment_intent_id: string | null; created_at: string }
        Insert: { id?: string; ticket_id: string; amount: number; currency?: string; status?: string; stripe_payment_intent_id?: string | null; created_at?: string }
        Update: { id?: string; ticket_id?: string; amount?: number; currency?: string; status?: string; stripe_payment_intent_id?: string | null; created_at?: string }
      }
      attendance_logs: {
        Row: { id: string; ticket_id: string; scanned_by: string | null; scanned_at: string }
        Insert: { id?: string; ticket_id: string; scanned_by?: string | null; scanned_at?: string }
        Update: { id?: string; ticket_id?: string; scanned_by?: string | null; scanned_at?: string }
      }
      chats: {
        Row: { id: string; event_id: string; created_at: string }
        Insert: { id?: string; event_id: string; created_at?: string }
        Update: { id?: string; event_id?: string; created_at?: string }
      }
      messages: {
        Row: { id: string; chat_id: string; sender_id: string; content: string; created_at: string }
        Insert: { id?: string; chat_id: string; sender_id: string; content: string; created_at?: string }
        Update: { id?: string; chat_id?: string; sender_id?: string; content?: string; created_at?: string }
      }
      feedback: {
        Row: { id: string; event_id: string; profile_id: string; rating: number; comment: string | null; created_at: string }
        Insert: { id?: string; event_id: string; profile_id: string; rating: number; comment?: string | null; created_at?: string }
        Update: { id?: string; event_id?: string; profile_id?: string; rating?: number; comment?: string | null; created_at?: string }
      }
      business_requests: {
        Row: { id: string; profile_id: string; business_name: string; tax_id_or_notes: string | null; status: string; created_at: string }
        Insert: { id?: string; profile_id: string; business_name: string; tax_id_or_notes?: string | null; status?: string; created_at?: string }
        Update: { id?: string; profile_id?: string; business_name?: string; tax_id_or_notes?: string | null; status?: string; created_at?: string }
      }
      notifications: {
        Row: { id: string; profile_id: string; title: string; message: string; is_read: boolean; type: string | null; created_at: string }
        Insert: { id?: string; profile_id: string; title: string; message: string; is_read?: boolean; type?: string | null; created_at?: string }
        Update: { id?: string; profile_id?: string; title?: string; message?: string; is_read?: boolean; type?: string | null; created_at?: string }
      }
    }
  }
}
