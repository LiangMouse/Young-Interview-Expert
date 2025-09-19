-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.interviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  duration text NOT NULL DEFAULT ''::text,
  type text NOT NULL DEFAULT ''::text,
  score integer DEFAULT 0,
  date timestamp with time zone DEFAULT now(),
  CONSTRAINT interviews_pkey PRIMARY KEY (id),
  CONSTRAINT interviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.resumes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  file_url text NOT NULL,
  parsed_text text,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT resumes_pkey PRIMARY KEY (id),
  CONSTRAINT resumes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.user_profile_vectors (
  id text NOT NULL,
  content text NOT NULL,
  metadata jsonb NOT NULL,
  embedding USER-DEFINED,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_profile_vectors_pkey PRIMARY KEY (id),
  CONSTRAINT user_profile_vectors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  nickname text,
  avatar_url text,
  bio text DEFAULT ''::text,
  job_intention text,
  skills ARRAY DEFAULT '{}'::text[],
  experience_years integer DEFAULT 0,
  graduation_date text,
  work_experiences jsonb DEFAULT '[]'::jsonb,
  project_experiences jsonb DEFAULT '[]'::jsonb,
  resume_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  company_intention text,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);