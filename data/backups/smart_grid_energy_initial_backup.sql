--
-- PostgreSQL database dump
--

\restrict D4mFGIFm3nny5Ny2NrLtoeJ5QC6eK8Ri7o944FyBKEhrZEFuOfkh9UCYUTBIstX

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: descriptive_statistics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.descriptive_statistics (
    id integer NOT NULL,
    scope character varying(50) NOT NULL,
    count integer NOT NULL,
    mean double precision NOT NULL,
    std double precision NOT NULL,
    variance double precision NOT NULL,
    min_val double precision NOT NULL,
    q25 double precision NOT NULL,
    median double precision NOT NULL,
    q75 double precision NOT NULL,
    max_val double precision NOT NULL,
    skewness double precision NOT NULL,
    kurtosis double precision NOT NULL
);


ALTER TABLE public.descriptive_statistics OWNER TO postgres;

--
-- Name: descriptive_statistics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.descriptive_statistics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.descriptive_statistics_id_seq OWNER TO postgres;

--
-- Name: descriptive_statistics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.descriptive_statistics_id_seq OWNED BY public.descriptive_statistics.id;


--
-- Name: distribution_fits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.distribution_fits (
    id integer NOT NULL,
    distribution character varying(50) NOT NULL,
    param_shape double precision,
    param_loc double precision DEFAULT 0.0 NOT NULL,
    param_scale double precision NOT NULL,
    aic double precision NOT NULL,
    bic double precision NOT NULL,
    ks_statistic double precision NOT NULL,
    ks_pvalue double precision NOT NULL,
    ad_statistic double precision NOT NULL,
    rank integer NOT NULL,
    parameters_json json
);


ALTER TABLE public.distribution_fits OWNER TO postgres;

--
-- Name: distribution_fits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.distribution_fits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.distribution_fits_id_seq OWNER TO postgres;

--
-- Name: distribution_fits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.distribution_fits_id_seq OWNED BY public.distribution_fits.id;


--
-- Name: extreme_value_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.extreme_value_results (
    id integer NOT NULL,
    block_type character varying(50) NOT NULL,
    sample_maxima_count integer NOT NULL,
    shape_xi double precision NOT NULL,
    loc_mu double precision NOT NULL,
    scale_sigma double precision NOT NULL,
    return_period_years integer NOT NULL,
    return_level_kwh double precision NOT NULL,
    ci_lower_95 double precision NOT NULL,
    ci_upper_95 double precision NOT NULL
);


ALTER TABLE public.extreme_value_results OWNER TO postgres;

--
-- Name: extreme_value_results_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.extreme_value_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.extreme_value_results_id_seq OWNER TO postgres;

--
-- Name: extreme_value_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.extreme_value_results_id_seq OWNED BY public.extreme_value_results.id;


--
-- Name: segment_statistics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.segment_statistics (
    id integer NOT NULL,
    segment_type character varying(50) NOT NULL,
    segment_value character varying(50) NOT NULL,
    count integer NOT NULL,
    mean_kwh double precision NOT NULL,
    std_kwh double precision NOT NULL,
    median_kwh double precision NOT NULL,
    min_kwh double precision NOT NULL,
    max_kwh double precision NOT NULL,
    skewness double precision NOT NULL,
    kurtosis double precision NOT NULL,
    best_fit_dist character varying(50) NOT NULL,
    dist_shape double precision,
    dist_loc double precision DEFAULT 0.0 NOT NULL,
    dist_scale double precision NOT NULL,
    ks_stat double precision NOT NULL
);


ALTER TABLE public.segment_statistics OWNER TO postgres;

--
-- Name: segment_statistics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.segment_statistics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.segment_statistics_id_seq OWNER TO postgres;

--
-- Name: segment_statistics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.segment_statistics_id_seq OWNED BY public.segment_statistics.id;


--
-- Name: descriptive_statistics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.descriptive_statistics ALTER COLUMN id SET DEFAULT nextval('public.descriptive_statistics_id_seq'::regclass);


--
-- Name: distribution_fits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distribution_fits ALTER COLUMN id SET DEFAULT nextval('public.distribution_fits_id_seq'::regclass);


--
-- Name: extreme_value_results id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extreme_value_results ALTER COLUMN id SET DEFAULT nextval('public.extreme_value_results_id_seq'::regclass);


--
-- Name: segment_statistics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.segment_statistics ALTER COLUMN id SET DEFAULT nextval('public.segment_statistics_id_seq'::regclass);


--
-- Data for Name: descriptive_statistics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.descriptive_statistics (id, scope, count, mean, std, variance, min_val, q25, median, q75, max_val, skewness, kurtosis) FROM stdin;
\.


--
-- Data for Name: distribution_fits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.distribution_fits (id, distribution, param_shape, param_loc, param_scale, aic, bic, ks_statistic, ks_pvalue, ad_statistic, rank, parameters_json) FROM stdin;
\.


--
-- Data for Name: extreme_value_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.extreme_value_results (id, block_type, sample_maxima_count, shape_xi, loc_mu, scale_sigma, return_period_years, return_level_kwh, ci_lower_95, ci_upper_95) FROM stdin;
\.


--
-- Data for Name: segment_statistics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.segment_statistics (id, segment_type, segment_value, count, mean_kwh, std_kwh, median_kwh, min_kwh, max_kwh, skewness, kurtosis, best_fit_dist, dist_shape, dist_loc, dist_scale, ks_stat) FROM stdin;
\.


--
-- Name: descriptive_statistics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.descriptive_statistics_id_seq', 1, false);


--
-- Name: distribution_fits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.distribution_fits_id_seq', 1, false);


--
-- Name: extreme_value_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.extreme_value_results_id_seq', 1, false);


--
-- Name: segment_statistics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.segment_statistics_id_seq', 1, false);


--
-- Name: descriptive_statistics descriptive_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.descriptive_statistics
    ADD CONSTRAINT descriptive_statistics_pkey PRIMARY KEY (id);


--
-- Name: descriptive_statistics descriptive_statistics_scope_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.descriptive_statistics
    ADD CONSTRAINT descriptive_statistics_scope_key UNIQUE (scope);


--
-- Name: distribution_fits distribution_fits_distribution_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distribution_fits
    ADD CONSTRAINT distribution_fits_distribution_key UNIQUE (distribution);


--
-- Name: distribution_fits distribution_fits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distribution_fits
    ADD CONSTRAINT distribution_fits_pkey PRIMARY KEY (id);


--
-- Name: extreme_value_results extreme_value_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extreme_value_results
    ADD CONSTRAINT extreme_value_results_pkey PRIMARY KEY (id);


--
-- Name: segment_statistics segment_statistics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.segment_statistics
    ADD CONSTRAINT segment_statistics_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict D4mFGIFm3nny5Ny2NrLtoeJ5QC6eK8Ri7o944FyBKEhrZEFuOfkh9UCYUTBIstX

