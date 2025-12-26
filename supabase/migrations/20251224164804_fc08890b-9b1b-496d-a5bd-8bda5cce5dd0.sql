-- =============================================
-- STOCK MARKET SIMULATOR - PRD ALIGNED SCHEMA (Part 2)
-- =============================================

-- =============================================
-- ORDERS TABLE (Per-simulation order records)
-- =============================================
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.assets(id),
    side VARCHAR(10) NOT NULL,
    quantity NUMERIC NOT NULL,
    order_type VARCHAR(50) DEFAULT 'MARKET',
    limit_price NUMERIC,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_simulation ON public.orders(simulation_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view orders from own simulations" ON public.orders
    FOR SELECT USING (
        simulation_id IN (SELECT id FROM public.simulations WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert orders for own simulations" ON public.orders
    FOR INSERT WITH CHECK (
        simulation_id IN (SELECT id FROM public.simulations WHERE user_id = auth.uid())
    );

-- =============================================
-- FILLS TABLE (Order execution records)
-- =============================================
CREATE TABLE public.fills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    filled_quantity NUMERIC NOT NULL,
    fill_price NUMERIC NOT NULL,
    commission NUMERIC DEFAULT 0,
    slippage NUMERIC DEFAULT 0,
    filled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fills_order ON public.fills(order_id);

ALTER TABLE public.fills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fills from own orders" ON public.fills
    FOR SELECT USING (
        order_id IN (
            SELECT o.id FROM public.orders o 
            JOIN public.simulations s ON o.simulation_id = s.id 
            WHERE s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert fills for own orders" ON public.fills
    FOR INSERT WITH CHECK (
        order_id IN (
            SELECT o.id FROM public.orders o 
            JOIN public.simulations s ON o.simulation_id = s.id 
            WHERE s.user_id = auth.uid()
        )
    );

-- =============================================
-- SIMULATION EVENTS TABLE (Audit trail)
-- =============================================
CREATE TABLE public.simulation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    event_type VARCHAR(100) NOT NULL,
    details JSONB
);

CREATE INDEX idx_simulation_events_simulation ON public.simulation_events(simulation_id, timestamp);

ALTER TABLE public.simulation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events from own simulations" ON public.simulation_events
    FOR SELECT USING (
        simulation_id IN (SELECT id FROM public.simulations WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert events for own simulations" ON public.simulation_events
    FOR INSERT WITH CHECK (
        simulation_id IN (SELECT id FROM public.simulations WHERE user_id = auth.uid())
    );

-- =============================================
-- RISK EVENTS TABLE (Constraint violations)
-- =============================================
CREATE TABLE public.risk_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB
);

CREATE INDEX idx_risk_events_simulation ON public.risk_events(simulation_id);

ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view risk events from own simulations" ON public.risk_events
    FOR SELECT USING (
        simulation_id IN (SELECT id FROM public.simulations WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert risk events for own simulations" ON public.risk_events
    FOR INSERT WITH CHECK (
        simulation_id IN (SELECT id FROM public.simulations WHERE user_id = auth.uid())
    );

-- =============================================
-- UPDATE SIMULATIONS TABLE (Add missing columns)
-- =============================================
ALTER TABLE public.simulations 
ADD COLUMN IF NOT EXISTS risk_profile_id UUID REFERENCES public.risk_profiles(id),
ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES public.assets(id);

-- =============================================
-- UPDATE STRATEGIES TABLE (Add required columns)
-- =============================================
ALTER TABLE public.strategies
ADD COLUMN IF NOT EXISTS indicators_used TEXT[],
ADD COLUMN IF NOT EXISTS variables_used TEXT[];

-- =============================================
-- UPDATE HOLDINGS TABLE (Add asset_id reference)
-- =============================================
ALTER TABLE public.holdings
ADD COLUMN IF NOT EXISTS asset_id UUID REFERENCES public.assets(id);

-- =============================================
-- Create trigger to auto-create default risk profile and role for new users
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_extended()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default risk profile
  INSERT INTO public.risk_profiles (user_id, name, is_default)
  VALUES (NEW.id, 'Default Profile', true);
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for extended user setup
DROP TRIGGER IF EXISTS on_auth_user_created_extended ON auth.users;
CREATE TRIGGER on_auth_user_created_extended
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_extended();