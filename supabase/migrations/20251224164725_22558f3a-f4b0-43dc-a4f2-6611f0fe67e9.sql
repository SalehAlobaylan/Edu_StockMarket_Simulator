-- =============================================
-- STOCK MARKET SIMULATOR - PRD ALIGNED SCHEMA (Part 1)
-- =============================================

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for proper role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can select all roles" ON public.user_roles
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON public.user_roles
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles" ON public.user_roles
    FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
    FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- ASSETS TABLE (Market instruments)
-- =============================================
CREATE TABLE public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    exchange VARCHAR(50) DEFAULT 'TADAWUL',
    currency VARCHAR(10) DEFAULT 'SAR',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view assets" ON public.assets
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert assets" ON public.assets
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update assets" ON public.assets
    FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete assets" ON public.assets
    FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- MARKET CANDLES TABLE (OHLCV data)
-- =============================================
CREATE TABLE public.market_candles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open NUMERIC NOT NULL,
    high NUMERIC NOT NULL,
    low NUMERIC NOT NULL,
    close NUMERIC NOT NULL,
    volume BIGINT,
    UNIQUE (asset_id, timestamp)
);

CREATE INDEX idx_market_candles_asset_timestamp ON public.market_candles(asset_id, timestamp DESC);
CREATE INDEX idx_market_candles_timestamp ON public.market_candles(timestamp DESC);

ALTER TABLE public.market_candles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market candles" ON public.market_candles
    FOR SELECT USING (true);

CREATE POLICY "System can insert market candles" ON public.market_candles
    FOR INSERT WITH CHECK (true);

-- =============================================
-- RISK PROFILES TABLE
-- =============================================
CREATE TABLE public.risk_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    max_position_pct NUMERIC DEFAULT 10,
    max_notional NUMERIC DEFAULT 100000,
    max_leverage NUMERIC DEFAULT 1,
    max_drawdown_pct NUMERIC DEFAULT 20,
    allow_short BOOLEAN DEFAULT FALSE,
    stop_loss_pct NUMERIC DEFAULT 5,
    take_profit_pct NUMERIC DEFAULT 10,
    trailing_stop_pct NUMERIC,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.risk_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own risk profiles" ON public.risk_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own risk profiles" ON public.risk_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own risk profiles" ON public.risk_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own risk profiles" ON public.risk_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- EQUATION TEMPLATES TABLE (Pre-built strategies)
-- =============================================
CREATE TABLE public.equation_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    entry_logic TEXT NOT NULL,
    exit_logic TEXT NOT NULL,
    category VARCHAR(100),
    difficulty VARCHAR(50) DEFAULT 'beginner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.equation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view equation templates" ON public.equation_templates
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert equation templates" ON public.equation_templates
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update equation templates" ON public.equation_templates
    FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete equation templates" ON public.equation_templates
    FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- JOBS TABLE (Background task tracking)
-- =============================================
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    progress_pct INTEGER DEFAULT 0,
    payload JSONB,
    result_ref UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

CREATE INDEX idx_jobs_user_status ON public.jobs(user_id, status);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs" ON public.jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs" ON public.jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs" ON public.jobs
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_profiles_updated_at
    BEFORE UPDATE ON public.risk_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();