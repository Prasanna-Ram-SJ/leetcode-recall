export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  username: string;
  username_normalized: string;
  timezone: string;
  created_at: string;
}

export interface SolvedProblem {
  id: string;
  user_id: string;
  slug: string;
  canonical_url: string;
  title: string;
  created_at: string;
}

export interface RecallList {
  id: string;
  user_id: string;
  name: string;
  daily_target: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecallListProblem {
  id: string;
  list_id: string;
  problem_id: string;
  user_id: string;
  added_at: string;
  problems?: SolvedProblem;
}

export interface ListCycle {
  id: string;
  list_id: string;
  user_id: string;
  cycle_number: number;
  is_current: boolean;
  created_at: string;
  completed_at: string | null;
}

export interface CycleItemRecord {
  id: string;
  cycle_id: string;
  problem_id: string;
  position: number;
  is_served: boolean;
  served_batch_id: string | null;
}

export interface DailyBatch {
  id: string;
  list_id: string;
  user_id: string;
  batch_date: string;
  cycle_id: string;
  created_at: string;
}

export interface DailyBatchItem {
  id: string;
  batch_id: string;
  problem_id: string;
  position: number;
  is_completed: boolean;
  completed_at: string | null;
  problems?: SolvedProblem;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          username: string;
          username_normalized: string;
          timezone?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          username_normalized?: string;
          timezone?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      problems: {
        Row: SolvedProblem;
        Insert: {
          id?: string;
          user_id: string;
          slug: string;
          canonical_url: string;
          title: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          slug?: string;
          canonical_url?: string;
          title?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      recall_lists: {
        Row: RecallList;
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          daily_target?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          daily_target?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recall_list_problems: {
        Row: RecallListProblem;
        Insert: {
          id?: string;
          list_id: string;
          problem_id: string;
          user_id: string;
          added_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          problem_id?: string;
          user_id?: string;
          added_at?: string;
        };
        Relationships: [];
      };
      list_cycles: {
        Row: ListCycle;
        Insert: {
          id?: string;
          list_id: string;
          user_id: string;
          cycle_number?: number;
          is_current?: boolean;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          list_id?: string;
          user_id?: string;
          cycle_number?: number;
          is_current?: boolean;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      cycle_items: {
        Row: CycleItemRecord;
        Insert: {
          id?: string;
          cycle_id: string;
          problem_id: string;
          position: number;
          is_served?: boolean;
          served_batch_id?: string | null;
        };
        Update: {
          id?: string;
          cycle_id?: string;
          problem_id?: string;
          position?: number;
          is_served?: boolean;
          served_batch_id?: string | null;
        };
        Relationships: [];
      };
      daily_batches: {
        Row: DailyBatch;
        Insert: {
          id?: string;
          list_id: string;
          user_id: string;
          batch_date: string;
          cycle_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          user_id?: string;
          batch_date?: string;
          cycle_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      daily_batch_items: {
        Row: DailyBatchItem;
        Insert: {
          id?: string;
          batch_id: string;
          problem_id: string;
          position: number;
          is_completed?: boolean;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          batch_id?: string;
          problem_id?: string;
          position?: number;
          is_completed?: boolean;
          completed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      materialize_daily_batch: {
        Args: {
          p_list_id: string;
          p_batch_date: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
