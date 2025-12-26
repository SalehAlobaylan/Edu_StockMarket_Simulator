-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "System can insert market candles" ON public.market_candles;

-- Create a restrictive policy that only allows admins to insert
-- Note: Edge functions using service_role key bypass RLS entirely, so they'll still work
CREATE POLICY "Admins can insert market candles" 
ON public.market_candles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));