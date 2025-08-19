import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export interface CreateProfileData {
  first_name?: string | null;
  avatar_url?: string | null;
  email: string;
}

export interface UpdateProfileData {
  first_name?: string | null;
  avatar_url?: string | null;
  email?: string;
}
