-- Update RLS policies to allow all authenticated users to see all peers
DROP POLICY IF EXISTS "Users can view their own peers" ON public.wireguard_peers;
DROP POLICY IF EXISTS "Users can create their own peers" ON public.wireguard_peers;
DROP POLICY IF EXISTS "Users can update their own peers" ON public.wireguard_peers;
DROP POLICY IF EXISTS "Users can delete their own peers" ON public.wireguard_peers;

-- Create new policies for shared access
CREATE POLICY "All authenticated users can view all peers" 
ON public.wireguard_peers 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "All authenticated users can create peers" 
ON public.wireguard_peers 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "All authenticated users can update peers" 
ON public.wireguard_peers 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "All authenticated users can delete peers" 
ON public.wireguard_peers 
FOR DELETE 
TO authenticated
USING (true);

-- Update existing peers to be associated with current authenticated user
UPDATE public.wireguard_peers 
SET user_id = '0367a0ce-fb10-4b67-909f-3509b6d4b0b2'
WHERE name IN ('jnonymous', 'srv05');