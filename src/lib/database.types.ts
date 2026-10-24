// Hand-written to match supabase/migrations. Once you have a linked project you
// can regenerate this with:
//   npx supabase gen types typescript --linked > src/lib/database.types.ts

export type EventKind = "event" | "workshop" | "meal" | "treat" | "deadline";
export type DevRole = "frontend" | "backend" | "fullstack";
export type TeamStatus = "looking" | "has_team";

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
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
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
