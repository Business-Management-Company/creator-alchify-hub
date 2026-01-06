CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user',
    'super_admin'
);


--
-- Name: brief_audience; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.brief_audience AS ENUM (
    'ceo',
    'board',
    'investor',
    'creator'
);


--
-- Name: admin_get_stats(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_stats() RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  result JSON;
BEGIN
  -- Only allow admins
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'total_projects', (SELECT COUNT(*) FROM public.projects),
    'total_transcripts', (SELECT COUNT(*) FROM public.transcripts),
    'users_today', (SELECT COUNT(*) FROM auth.users WHERE created_at >= CURRENT_DATE),
    'projects_today', (SELECT COUNT(*) FROM public.projects WHERE created_at >= CURRENT_DATE),
    'projects_by_status', (
      SELECT json_object_agg(COALESCE(status, 'unknown'), count)
      FROM (SELECT status, COUNT(*) as count FROM public.projects GROUP BY status) s
    )
  ) INTO result;
  
  RETURN result;
END;
$$;


--
-- Name: admin_get_users(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.admin_get_users() RETURNS TABLE(id uuid, email text, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, display_name text, roles public.app_role[])
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Only allow admins or super_admins
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text,
    au.created_at,
    au.last_sign_in_at,
    p.display_name::text,
    COALESCE(ARRAY_AGG(ur.role) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::app_role[])
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.user_id = au.id
  LEFT JOIN public.user_roles ur ON ur.user_id = au.id
  GROUP BY au.id, au.email, au.created_at, au.last_sign_in_at, p.display_name
  ORDER BY au.created_at DESC;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: admin_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_user_id uuid NOT NULL,
    display_name text,
    email text,
    current_section text DEFAULT 'Admin Dashboard'::text NOT NULL,
    last_seen_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_action_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_action_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    user_id uuid NOT NULL,
    action_type text NOT NULL,
    action_details jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: brief_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brief_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    audience public.brief_audience NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: competitor_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competitor_sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    category text NOT NULL,
    scrape_selectors jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    last_scraped_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    contact_type text NOT NULL,
    company text,
    title text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contacts_contact_type_check CHECK ((contact_type = ANY (ARRAY['board_member'::text, 'board_observer'::text, 'creator'::text, 'advisor'::text])))
);


--
-- Name: creator_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.creator_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    handle text NOT NULL,
    display_name text NOT NULL,
    tagline text,
    bio text,
    avatar_url text,
    hero_image_url text,
    primary_color text,
    accent_color text,
    social_links jsonb DEFAULT '{}'::jsonb,
    highlight_metrics jsonb DEFAULT '[]'::jsonb,
    featured_project_ids text[] DEFAULT '{}'::text[],
    is_public boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT handle_format CHECK (((handle ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'::text) OR (handle ~ '^[a-z0-9]$'::text)))
);


--
-- Name: daily_briefs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_briefs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brief_date date DEFAULT CURRENT_DATE NOT NULL,
    audience public.brief_audience NOT NULL,
    title text NOT NULL,
    summary text NOT NULL,
    insights jsonb DEFAULT '[]'::jsonb NOT NULL,
    competitor_updates jsonb DEFAULT '[]'::jsonb,
    market_signals jsonb DEFAULT '[]'::jsonb,
    action_items jsonb DEFAULT '[]'::jsonb,
    raw_data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: email_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email_send_id uuid,
    event_type text NOT NULL,
    event_data jsonb,
    occurred_at timestamp with time zone DEFAULT now()
);


--
-- Name: email_sends; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_sends (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    template_id uuid,
    resend_id text,
    from_email text NOT NULL,
    to_email text NOT NULL,
    subject text NOT NULL,
    status text DEFAULT 'sent'::text,
    variables jsonb,
    metadata jsonb,
    sent_at timestamp with time zone DEFAULT now(),
    delivered_at timestamp with time zone,
    opened_at timestamp with time zone,
    clicked_at timestamp with time zone,
    bounced_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    html_content text NOT NULL,
    text_content text,
    category text DEFAULT 'transactional'::text NOT NULL,
    description text,
    variables jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: insight_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insight_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_id uuid,
    title text NOT NULL,
    url text,
    published_at timestamp with time zone,
    content_markdown text,
    content_summary text,
    key_points jsonb DEFAULT '[]'::jsonb,
    benchmarks jsonb DEFAULT '[]'::jsonb,
    recommended_actions jsonb DEFAULT '[]'::jsonb,
    applicable_metrics text[] DEFAULT '{}'::text[],
    tags text[] DEFAULT '{}'::text[],
    creator_type_tags text[] DEFAULT '{}'::text[],
    topic_tags text[] DEFAULT '{}'::text[],
    is_processed boolean DEFAULT false,
    processing_error text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: insight_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insight_sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    url text NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    creator_type_tags text[] DEFAULT '{}'::text[],
    topic_tags text[] DEFAULT '{}'::text[],
    is_active boolean DEFAULT true,
    use_transcripts boolean DEFAULT false,
    last_fetch_at timestamp with time zone,
    fetch_frequency_hours integer DEFAULT 24,
    documents_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT insight_sources_type_check CHECK ((type = ANY (ARRAY['firecrawl'::text, 'rss'::text])))
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    task_id uuid,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pricing_features; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pricing_features (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id text,
    feature text NOT NULL,
    display_order integer DEFAULT 0 NOT NULL
);


--
-- Name: pricing_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pricing_plans (
    id text NOT NULL,
    name text NOT NULL,
    price integer DEFAULT 0 NOT NULL,
    storage_gb text NOT NULL,
    recording_hours text NOT NULL,
    livestream_hours text NOT NULL,
    podcasts text NOT NULL,
    team_members integer,
    is_popular boolean DEFAULT false,
    display_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    display_name text,
    avatar_url text,
    bio text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'uploaded'::text,
    source_file_url text,
    source_file_name text,
    source_file_type text,
    source_file_size bigint,
    source_duration_seconds integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT projects_source_file_type_check CHECK ((source_file_type = ANY (ARRAY['video'::text, 'audio'::text]))),
    CONSTRAINT projects_status_check CHECK ((status = ANY (ARRAY['uploaded'::text, 'alchifying'::text, 'transcribing'::text, 'editing'::text, 'ready'::text, 'exported'::text])))
);


--
-- Name: task_assignees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_assignees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: task_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    author_id uuid NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: task_filter_configs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_filter_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label text NOT NULL,
    slug text NOT NULL,
    field text NOT NULL,
    type text NOT NULL,
    operator text DEFAULT 'equals'::text NOT NULL,
    options jsonb DEFAULT '[]'::jsonb,
    visible_by_default boolean DEFAULT true,
    display_order integer DEFAULT 0,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT task_filter_configs_operator_check CHECK ((operator = ANY (ARRAY['equals'::text, 'not_equals'::text, 'in'::text, 'between'::text, 'gte'::text, 'lte'::text, 'contains'::text]))),
    CONSTRAINT task_filter_configs_type_check CHECK ((type = ANY (ARRAY['enum'::text, 'date'::text, 'number'::text, 'boolean'::text])))
);


--
-- Name: task_priorities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_priorities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    is_default boolean DEFAULT false,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    color text DEFAULT '#6b7280'::text
);


--
-- Name: task_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#6366f1'::text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_collapsed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: task_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_statuses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    is_default boolean DEFAULT false,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    color text DEFAULT '#6b7280'::text
);


--
-- Name: task_watchers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_watchers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'backlog'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    due_date date,
    area text,
    creator_id uuid NOT NULL,
    assignee_id uuid,
    linked_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    status_id uuid,
    priority_id uuid,
    release_target text DEFAULT 'Backlog'::text,
    section_id uuid,
    CONSTRAINT tasks_priority_check CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]))),
    CONSTRAINT tasks_release_target_check CHECK (((release_target IS NULL) OR (release_target = ANY (ARRAY['Dec-22-Full-Test'::text, 'Dec-28-Final-Testing'::text, 'Jan-1-Alpha'::text])))),
    CONSTRAINT tasks_status_check CHECK ((status = ANY (ARRAY['backlog'::text, 'in_progress'::text, 'blocked'::text, 'done'::text])))
);


--
-- Name: transcripts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transcripts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    content text,
    segments jsonb,
    avg_confidence numeric(4,3),
    word_count integer,
    filler_words_detected integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    platform text NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    token_expires_at timestamp with time zone,
    profile_data jsonb DEFAULT '{}'::jsonb,
    connected_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_integrations_platform_check CHECK ((platform = ANY (ARRAY['youtube'::text, 'instagram'::text, 'facebook'::text])))
);


--
-- Name: user_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    preference_key text NOT NULL,
    preference_value jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_id text DEFAULT 'free'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    current_period_start timestamp with time zone DEFAULT now(),
    current_period_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    month_year text NOT NULL,
    storage_used_gb numeric(10,2) DEFAULT 0,
    recording_hours_used numeric(10,2) DEFAULT 0,
    livestream_hours_used numeric(10,2) DEFAULT 0,
    podcasts_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: admin_sessions admin_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_pkey PRIMARY KEY (id);


--
-- Name: admin_sessions admin_sessions_user_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_user_unique UNIQUE (admin_user_id);


--
-- Name: ai_action_log ai_action_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_action_log
    ADD CONSTRAINT ai_action_log_pkey PRIMARY KEY (id);


--
-- Name: brief_subscriptions brief_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brief_subscriptions
    ADD CONSTRAINT brief_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: brief_subscriptions brief_subscriptions_user_id_audience_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brief_subscriptions
    ADD CONSTRAINT brief_subscriptions_user_id_audience_key UNIQUE (user_id, audience);


--
-- Name: competitor_sources competitor_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitor_sources
    ADD CONSTRAINT competitor_sources_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: creator_profiles creator_profiles_handle_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creator_profiles
    ADD CONSTRAINT creator_profiles_handle_key UNIQUE (handle);


--
-- Name: creator_profiles creator_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creator_profiles
    ADD CONSTRAINT creator_profiles_pkey PRIMARY KEY (id);


--
-- Name: creator_profiles creator_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creator_profiles
    ADD CONSTRAINT creator_profiles_user_id_key UNIQUE (user_id);


--
-- Name: daily_briefs daily_briefs_brief_date_audience_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_briefs
    ADD CONSTRAINT daily_briefs_brief_date_audience_key UNIQUE (brief_date, audience);


--
-- Name: daily_briefs daily_briefs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_briefs
    ADD CONSTRAINT daily_briefs_pkey PRIMARY KEY (id);


--
-- Name: email_events email_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_events
    ADD CONSTRAINT email_events_pkey PRIMARY KEY (id);


--
-- Name: email_sends email_sends_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_sends
    ADD CONSTRAINT email_sends_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (id);


--
-- Name: insight_documents insight_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_documents
    ADD CONSTRAINT insight_documents_pkey PRIMARY KEY (id);


--
-- Name: insight_sources insight_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_sources
    ADD CONSTRAINT insight_sources_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: pricing_features pricing_features_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_features
    ADD CONSTRAINT pricing_features_pkey PRIMARY KEY (id);


--
-- Name: pricing_plans pricing_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_plans
    ADD CONSTRAINT pricing_plans_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: task_assignees task_assignees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignees
    ADD CONSTRAINT task_assignees_pkey PRIMARY KEY (id);


--
-- Name: task_assignees task_assignees_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignees
    ADD CONSTRAINT task_assignees_unique UNIQUE (task_id, user_id);


--
-- Name: task_comments task_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_pkey PRIMARY KEY (id);


--
-- Name: task_filter_configs task_filter_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_filter_configs
    ADD CONSTRAINT task_filter_configs_pkey PRIMARY KEY (id);


--
-- Name: task_filter_configs task_filter_configs_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_filter_configs
    ADD CONSTRAINT task_filter_configs_slug_key UNIQUE (slug);


--
-- Name: task_priorities task_priorities_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_priorities
    ADD CONSTRAINT task_priorities_code_key UNIQUE (code);


--
-- Name: task_priorities task_priorities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_priorities
    ADD CONSTRAINT task_priorities_pkey PRIMARY KEY (id);


--
-- Name: task_sections task_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_sections
    ADD CONSTRAINT task_sections_pkey PRIMARY KEY (id);


--
-- Name: task_statuses task_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_statuses
    ADD CONSTRAINT task_statuses_pkey PRIMARY KEY (id);


--
-- Name: task_statuses task_statuses_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_statuses
    ADD CONSTRAINT task_statuses_slug_key UNIQUE (slug);


--
-- Name: task_watchers task_watchers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_watchers
    ADD CONSTRAINT task_watchers_pkey PRIMARY KEY (id);


--
-- Name: task_watchers task_watchers_task_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_watchers
    ADD CONSTRAINT task_watchers_task_id_user_id_key UNIQUE (task_id, user_id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: transcripts transcripts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transcripts
    ADD CONSTRAINT transcripts_pkey PRIMARY KEY (id);


--
-- Name: user_integrations user_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_integrations
    ADD CONSTRAINT user_integrations_pkey PRIMARY KEY (id);


--
-- Name: user_integrations user_integrations_user_id_platform_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_integrations
    ADD CONSTRAINT user_integrations_user_id_platform_key UNIQUE (user_id, platform);


--
-- Name: user_preferences user_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_preferences user_preferences_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_preferences
    ADD CONSTRAINT user_preferences_unique UNIQUE (user_id, preference_key);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: user_subscriptions user_subscriptions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);


--
-- Name: user_usage user_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_usage
    ADD CONSTRAINT user_usage_pkey PRIMARY KEY (id);


--
-- Name: user_usage user_usage_user_id_month_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_usage
    ADD CONSTRAINT user_usage_user_id_month_year_key UNIQUE (user_id, month_year);


--
-- Name: idx_admin_sessions_last_seen; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_sessions_last_seen ON public.admin_sessions USING btree (last_seen_at);


--
-- Name: idx_admin_sessions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_sessions_user_id ON public.admin_sessions USING btree (admin_user_id);


--
-- Name: idx_ai_action_log_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_action_log_project ON public.ai_action_log USING btree (project_id);


--
-- Name: idx_ai_action_log_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_action_log_user ON public.ai_action_log USING btree (user_id);


--
-- Name: idx_email_events_send_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_events_send_id ON public.email_events USING btree (email_send_id);


--
-- Name: idx_email_events_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_events_type ON public.email_events USING btree (event_type);


--
-- Name: idx_email_sends_sent_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_sends_sent_at ON public.email_sends USING btree (sent_at);


--
-- Name: idx_email_sends_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_sends_status ON public.email_sends USING btree (status);


--
-- Name: idx_email_sends_template_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_sends_template_id ON public.email_sends USING btree (template_id);


--
-- Name: idx_email_templates_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_templates_category ON public.email_templates USING btree (category);


--
-- Name: idx_insight_documents_applicable_metrics; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_insight_documents_applicable_metrics ON public.insight_documents USING gin (applicable_metrics);


--
-- Name: idx_insight_documents_creator_type_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_insight_documents_creator_type_tags ON public.insight_documents USING gin (creator_type_tags);


--
-- Name: idx_insight_documents_published_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_insight_documents_published_at ON public.insight_documents USING btree (published_at DESC);


--
-- Name: idx_insight_documents_source_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_insight_documents_source_id ON public.insight_documents USING btree (source_id);


--
-- Name: idx_insight_documents_tags; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_insight_documents_tags ON public.insight_documents USING gin (tags);


--
-- Name: idx_insight_sources_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_insight_sources_is_active ON public.insight_sources USING btree (is_active);


--
-- Name: idx_insight_sources_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_insight_sources_type ON public.insight_sources USING btree (type);


--
-- Name: idx_notifications_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_unread ON public.notifications USING btree (user_id, is_read) WHERE (is_read = false);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_task_assignees_task; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_assignees_task ON public.task_assignees USING btree (task_id);


--
-- Name: idx_task_assignees_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_assignees_user ON public.task_assignees USING btree (user_id);


--
-- Name: idx_task_comments_task; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_task_comments_task ON public.task_comments USING btree (task_id);


--
-- Name: idx_tasks_assignee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_assignee ON public.tasks USING btree (assignee_id);


--
-- Name: idx_tasks_creator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_creator ON public.tasks USING btree (creator_id);


--
-- Name: idx_tasks_due_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_due_date ON public.tasks USING btree (due_date);


--
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- Name: idx_user_preferences_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_preferences_user ON public.user_preferences USING btree (user_id);


--
-- Name: competitor_sources update_competitor_sources_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_competitor_sources_updated_at BEFORE UPDATE ON public.competitor_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: contacts update_contacts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: creator_profiles update_creator_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON public.creator_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: email_templates update_email_templates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: insight_documents update_insight_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_insight_documents_updated_at BEFORE UPDATE ON public.insight_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: insight_sources update_insight_sources_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_insight_sources_updated_at BEFORE UPDATE ON public.insight_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: task_filter_configs update_task_filter_configs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_task_filter_configs_updated_at BEFORE UPDATE ON public.task_filter_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tasks update_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: transcripts update_transcripts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_transcripts_updated_at BEFORE UPDATE ON public.transcripts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_integrations update_user_integrations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_integrations_updated_at BEFORE UPDATE ON public.user_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_subscriptions update_user_subscriptions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_usage update_user_usage_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_user_usage_updated_at BEFORE UPDATE ON public.user_usage FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_action_log ai_action_log_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_action_log
    ADD CONSTRAINT ai_action_log_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: brief_subscriptions brief_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brief_subscriptions
    ADD CONSTRAINT brief_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: creator_profiles creator_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.creator_profiles
    ADD CONSTRAINT creator_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: email_events email_events_email_send_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_events
    ADD CONSTRAINT email_events_email_send_id_fkey FOREIGN KEY (email_send_id) REFERENCES public.email_sends(id) ON DELETE CASCADE;


--
-- Name: email_sends email_sends_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_sends
    ADD CONSTRAINT email_sends_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: email_sends email_sends_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_sends
    ADD CONSTRAINT email_sends_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.email_templates(id) ON DELETE SET NULL;


--
-- Name: email_templates email_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: insight_documents insight_documents_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_documents
    ADD CONSTRAINT insight_documents_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.insight_sources(id) ON DELETE CASCADE;


--
-- Name: insight_sources insight_sources_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insight_sources
    ADD CONSTRAINT insight_sources_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: notifications notifications_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: pricing_features pricing_features_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pricing_features
    ADD CONSTRAINT pricing_features_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.pricing_plans(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: projects projects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: task_assignees task_assignees_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignees
    ADD CONSTRAINT task_assignees_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_comments task_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: task_comments task_comments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_comments
    ADD CONSTRAINT task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: task_watchers task_watchers_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_watchers
    ADD CONSTRAINT task_watchers_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_priority_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_priority_id_fkey FOREIGN KEY (priority_id) REFERENCES public.task_priorities(id);


--
-- Name: tasks tasks_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.task_sections(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.task_statuses(id);


--
-- Name: transcripts transcripts_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transcripts
    ADD CONSTRAINT transcripts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: user_integrations user_integrations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_integrations
    ADD CONSTRAINT user_integrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_subscriptions user_subscriptions_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.pricing_plans(id);


--
-- Name: user_subscriptions user_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_usage user_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_usage
    ADD CONSTRAINT user_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: contacts Admins can create contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can create contacts" ON public.contacts FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: contacts Admins can delete contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete contacts" ON public.contacts FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: task_comments Admins can manage all comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all comments" ON public.task_comments USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: notifications Admins can manage all notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all notifications" ON public.notifications USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: task_assignees Admins can manage all task assignees; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all task assignees" ON public.task_assignees USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: task_watchers Admins can manage all task watchers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all task watchers" ON public.task_watchers USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: tasks Admins can manage all tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all tasks" ON public.tasks USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: competitor_sources Admins can manage competitor sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage competitor sources" ON public.competitor_sources USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: daily_briefs Admins can manage daily briefs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage daily briefs" ON public.daily_briefs USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: email_templates Admins can manage email templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage email templates" ON public.email_templates USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: insight_documents Admins can manage insight documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage insight documents" ON public.insight_documents USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: insight_sources Admins can manage insight sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage insight sources" ON public.insight_sources USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: pricing_features Admins can manage pricing features; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage pricing features" ON public.pricing_features USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: pricing_plans Admins can manage pricing plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage pricing plans" ON public.pricing_plans USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: task_filter_configs Admins can manage task filter configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage task filter configs" ON public.task_filter_configs USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: task_priorities Admins can manage task priorities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage task priorities" ON public.task_priorities USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: task_sections Admins can manage task sections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage task sections" ON public.task_sections USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: task_statuses Admins can manage task statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage task statuses" ON public.task_statuses USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_sessions Admins can manage their own session; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage their own session" ON public.admin_sessions USING (((admin_user_id = auth.uid()) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)))) WITH CHECK (((admin_user_id = auth.uid()) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role))));


--
-- Name: contacts Admins can update contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update contacts" ON public.contacts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: admin_sessions Admins can view all admin sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all admin sessions" ON public.admin_sessions FOR SELECT USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: contacts Admins can view all contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all contacts" ON public.contacts FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: email_events Admins can view email events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view email events" ON public.email_events USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: email_sends Admins can view email sends; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view email sends" ON public.email_sends USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'super_admin'::public.app_role)));


--
-- Name: pricing_features Anyone can view pricing features; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view pricing features" ON public.pricing_features FOR SELECT USING (true);


--
-- Name: pricing_plans Anyone can view pricing plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view pricing plans" ON public.pricing_plans FOR SELECT USING (true);


--
-- Name: creator_profiles Anyone can view public profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view public profiles" ON public.creator_profiles FOR SELECT USING ((is_public = true));


--
-- Name: insight_sources Authenticated users can view active sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view active sources" ON public.insight_sources FOR SELECT USING ((is_active = true));


--
-- Name: daily_briefs Authenticated users can view briefs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view briefs" ON public.daily_briefs FOR SELECT TO authenticated USING (true);


--
-- Name: competitor_sources Authenticated users can view competitor sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view competitor sources" ON public.competitor_sources FOR SELECT TO authenticated USING (true);


--
-- Name: task_filter_configs Authenticated users can view filter configs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view filter configs" ON public.task_filter_configs FOR SELECT USING (true);


--
-- Name: insight_documents Authenticated users can view processed documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view processed documents" ON public.insight_documents FOR SELECT USING ((is_processed = true));


--
-- Name: task_priorities Authenticated users can view task priorities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view task priorities" ON public.task_priorities FOR SELECT USING (true);


--
-- Name: task_sections Authenticated users can view task sections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view task sections" ON public.task_sections FOR SELECT USING (true);


--
-- Name: task_statuses Authenticated users can view task statuses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view task statuses" ON public.task_statuses FOR SELECT USING (true);


--
-- Name: profiles Profiles are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);


--
-- Name: notifications System can insert notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);


--
-- Name: ai_action_log Users can create AI action logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create AI action logs" ON public.ai_action_log FOR INSERT WITH CHECK (((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = ai_action_log.project_id) AND (projects.user_id = auth.uid()))))));


--
-- Name: task_comments Users can create comments on visible tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create comments on visible tasks" ON public.task_comments FOR INSERT WITH CHECK (((auth.uid() = author_id) AND (EXISTS ( SELECT 1
   FROM public.tasks t
  WHERE ((t.id = task_comments.task_id) AND ((t.assignee_id = auth.uid()) OR (t.creator_id = auth.uid())))))));


--
-- Name: creator_profiles Users can create own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create own profile" ON public.creator_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: projects Users can create their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: transcripts Users can create transcripts for their projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create transcripts for their projects" ON public.transcripts FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = transcripts.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: user_integrations Users can delete own integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own integrations" ON public.user_integrations FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: creator_profiles Users can delete own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own profile" ON public.creator_profiles FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: projects Users can delete their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: transcripts Users can delete transcripts of their projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete transcripts of their projects" ON public.transcripts FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = transcripts.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: user_integrations Users can insert own integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own integrations" ON public.user_integrations FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_subscriptions Users can insert own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own subscription" ON public.user_subscriptions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_usage Users can insert own usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own usage" ON public.user_usage FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: brief_subscriptions Users can manage own subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own subscriptions" ON public.brief_subscriptions USING ((auth.uid() = user_id));


--
-- Name: task_watchers Users can manage own watch status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own watch status" ON public.task_watchers USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: user_preferences Users can manage their own preferences; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage their own preferences" ON public.user_preferences USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_integrations Users can update own integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own integrations" ON public.user_integrations FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: creator_profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.creator_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_subscriptions Users can update own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own subscription" ON public.user_subscriptions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: user_usage Users can update own usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own usage" ON public.user_usage FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: tasks Users can update tasks assigned to them; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update tasks assigned to them" ON public.tasks FOR UPDATE USING ((auth.uid() = assignee_id));


--
-- Name: tasks Users can update tasks they created; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update tasks they created" ON public.tasks FOR UPDATE USING ((auth.uid() = creator_id));


--
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: projects Users can update their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: transcripts Users can update transcripts of their projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update transcripts of their projects" ON public.transcripts FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = transcripts.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: task_assignees Users can view assignees for their tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view assignees for their tasks" ON public.task_assignees FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.tasks t
  WHERE ((t.id = task_assignees.task_id) AND ((t.assignee_id = auth.uid()) OR (t.creator_id = auth.uid()))))) OR (user_id = auth.uid())));


--
-- Name: task_comments Users can view comments on visible tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view comments on visible tasks" ON public.task_comments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.tasks t
  WHERE ((t.id = task_comments.task_id) AND ((t.assignee_id = auth.uid()) OR (t.creator_id = auth.uid()))))));


--
-- Name: user_integrations Users can view own integrations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own integrations" ON public.user_integrations FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: creator_profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.creator_profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_subscriptions Users can view own subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own subscription" ON public.user_subscriptions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_usage Users can view own usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own usage" ON public.user_usage FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: tasks Users can view tasks assigned to them; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view tasks assigned to them" ON public.tasks FOR SELECT USING ((auth.uid() = assignee_id));


--
-- Name: tasks Users can view tasks they created; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view tasks they created" ON public.tasks FOR SELECT USING ((auth.uid() = creator_id));


--
-- Name: ai_action_log Users can view their own AI actions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own AI actions" ON public.ai_action_log FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: projects Users can view their own projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: transcripts Users can view transcripts of their projects; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view transcripts of their projects" ON public.transcripts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = transcripts.project_id) AND (projects.user_id = auth.uid())))));


--
-- Name: task_watchers Users can view watchers for visible tasks; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view watchers for visible tasks" ON public.task_watchers FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.tasks t
  WHERE ((t.id = task_watchers.task_id) AND ((t.assignee_id = auth.uid()) OR (t.creator_id = auth.uid()))))) OR (user_id = auth.uid())));


--
-- Name: admin_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_action_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_action_log ENABLE ROW LEVEL SECURITY;

--
-- Name: brief_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.brief_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: competitor_sources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.competitor_sources ENABLE ROW LEVEL SECURITY;

--
-- Name: contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: creator_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_briefs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_briefs ENABLE ROW LEVEL SECURITY;

--
-- Name: email_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

--
-- Name: email_sends; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;

--
-- Name: email_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: insight_documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.insight_documents ENABLE ROW LEVEL SECURITY;

--
-- Name: insight_sources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.insight_sources ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: pricing_features; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pricing_features ENABLE ROW LEVEL SECURITY;

--
-- Name: pricing_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: projects; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

--
-- Name: task_assignees; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

--
-- Name: task_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: task_filter_configs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_filter_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: task_priorities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_priorities ENABLE ROW LEVEL SECURITY;

--
-- Name: task_sections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_sections ENABLE ROW LEVEL SECURITY;

--
-- Name: task_statuses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: task_watchers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.task_watchers ENABLE ROW LEVEL SECURITY;

--
-- Name: tasks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

--
-- Name: transcripts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

--
-- Name: user_integrations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

--
-- Name: user_preferences; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_usage; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;