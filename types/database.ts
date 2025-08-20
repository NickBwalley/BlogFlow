export interface Database {
  public: {
    Tables: {
      blogs: {
        Row: {
          id: string;
          title: string;
          slug: string;
          subtitle: string | null;
          image: string | null;
          image_path: string | null;
          content: string;
          author: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug?: string;
          subtitle?: string | null;
          image?: string | null;
          image_path?: string | null;
          content: string;
          author: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          subtitle?: string | null;
          image?: string | null;
          image_path?: string | null;
          content?: string;
          author?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
