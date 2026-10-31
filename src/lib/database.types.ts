// Hand-written to match supabase/migrations. Once you have a linked project you
// can regenerate this with:
//   npx supabase gen types typescript --linked > src/lib/database.types.ts

export type EventKind = "event" | "workshop" | "meal" | "treat" | "deadline";
export type DevRole = "frontend" | "backend" | "fullstack";
export type TeamStatus = "looking" | "has_team";
export type CheckinStatus = "ok" | "already" | "bad_code" | "closed" | "no_profile" | "signed_out";

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: number;
          title: string;
          description: string | null;
          location: string | null;
          kind: EventKind;
          starts_at: string;
          ends_at: string | null;
          created_at: string;
        };
        Insert: {
          title: string;
          description?: string | null;
          location?: string | null;
          kind?: EventKind;
          starts_at: string;
          ends_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          name: string;
          usc_year: string;
          major: string;
          email: string;
          discord: string | null;
          link: string | null;
          avatar_url: string | null;
          skills: string[];
          languages: string[];
          role: DevRole;
          looking_for: string | null;
          team_size_pref: number | null;
          team_status: TeamStatus;
          search_text: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          usc_year: string;
          major: string;
          email: string;
          discord?: string | null;
          link?: string | null;
          avatar_url?: string | null;
          skills?: string[];
          languages?: string[];
          role: DevRole;
          looking_for?: string | null;
          team_size_pref?: number | null;
          team_status?: TeamStatus;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      organizers: {
        Row: { user_id: string };
        Insert: { user_id: string };
        Update: { user_id?: string };
        Relationships: [];
      };
      checkin_codes: {
        Row: { event_id: number; code: string };
        Insert: { event_id: number; code?: string };
        Update: { event_id?: number; code?: string };
        Relationships: [];
      };
      checkins: {
        Row: { event_id: number; user_id: string; created_at: string };
        Insert: { event_id: number; user_id: string };
        Update: { event_id?: number; user_id?: string };
        Relationships: [
          {
            foreignKeyName: "checkins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_organizer: { Args: Record<string, never>; Returns: boolean };
      check_in: { Args: { p_event_id: number; p_code: string }; Returns: CheckinStatus };
    };
    Enums: {
      event_kind: EventKind;
      dev_role: DevRole;
      team_status: TeamStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
