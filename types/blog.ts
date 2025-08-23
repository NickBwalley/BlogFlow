import { Database } from "./database";

export type Blog = Database["public"]["Tables"]["blogs"]["Row"];
export type BlogInsert = Database["public"]["Tables"]["blogs"]["Insert"];
export type BlogUpdate = Database["public"]["Tables"]["blogs"]["Update"];

export interface BlogFormData {
  title: string;
  subtitle?: string;
  image?: string;
  image_path?: string;
  content: string;
  author: string;
}

export interface BlogListItem {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  image: string | null;
  image_path: string | null;
  author: string;
  created_at: string;
  updated_at: string;
  content: string;
}
