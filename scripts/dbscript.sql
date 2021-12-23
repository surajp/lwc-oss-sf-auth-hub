--
-- PostgreSQL database dump
--

-- Dumped from database version 11.1
-- Dumped by pg_dump version 14.0 (Ubuntu 14.0-1.pgdg18.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: trigger_set_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trigger_set_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
NEW.lastmodified = NOW();
RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_set_timestamp() OWNER TO postgres;

SET default_tablespace = '';

--
-- Name: auditlog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auditlog (
    user_id text,
    ip_address text,
    url text,
    hostname text,
    body text,
    method text,
    created timestamp without time zone DEFAULT now(),
    params text
);


ALTER TABLE public.auditlog OWNER TO postgres;

--
-- Name: authorized_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.authorized_users (
    id integer NOT NULL,
    email text
);


ALTER TABLE public.authorized_users OWNER TO postgres;

--
-- Name: authorized_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.authorized_users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.authorized_users_id_seq OWNER TO postgres;

--
-- Name: authorized_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.authorized_users_id_seq OWNED BY public.authorized_users.id;


--
-- Name: connections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.connections (
    id text NOT NULL,
    instance_url text,
    refresh_token text,
    created timestamp without time zone DEFAULT now() NOT NULL,
    lastmodified timestamp without time zone DEFAULT now() NOT NULL,
    username text,
    notes text,
    issandbox boolean
);


ALTER TABLE public.connections OWNER TO postgres;

--
-- Name: orgshares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orgshares (
    id integer NOT NULL,
    user_id text NOT NULL,
    org_id text NOT NULL,
    created timestamp without time zone DEFAULT now(),
    lastmodified timestamp without time zone DEFAULT now(),
    accesslevel text
);


ALTER TABLE public.orgshares OWNER TO postgres;

--
-- Name: orgshares_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.orgshares ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.orgshares_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text,
    email text,
    created timestamp without time zone DEFAULT now(),
    lastmodified timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: authorized_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.authorized_users ALTER COLUMN id SET DEFAULT nextval('public.authorized_users_id_seq'::regclass);


--
-- Name: authorized_users authorized_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.authorized_users
    ADD CONSTRAINT authorized_users_pkey PRIMARY KEY (id);


--
-- Name: connections connections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT connections_pkey PRIMARY KEY (id);


--
-- Name: orgshares orgshare_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orgshares
    ADD CONSTRAINT orgshare_uniq UNIQUE (org_id, user_id);


--
-- Name: orgshares orgshares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orgshares
    ADD CONSTRAINT orgshares_pkey PRIMARY KEY (id);


--
-- Name: connections unique_username; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connections
    ADD CONSTRAINT unique_username UNIQUE (username, issandbox);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: authorized_users set_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.authorized_users FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();


--
-- Name: connections set_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();


--
-- Name: orgshares set_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.orgshares FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();


--
-- Name: users set_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();


--
-- Name: orgshares fk_orgid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orgshares
    ADD CONSTRAINT fk_orgid FOREIGN KEY (org_id) REFERENCES public.connections(id) ON DELETE CASCADE;


--
-- Name: orgshares fk_userid; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orgshares
    ADD CONSTRAINT fk_userid FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

