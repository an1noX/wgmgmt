-- Create WireGuard peers table
CREATE TABLE public.wireguard_peers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL,
  allowed_ips TEXT NOT NULL DEFAULT '10.0.0.0/32',
  endpoint TEXT,
  persistent_keepalive INTEGER DEFAULT 25,
  status TEXT NOT NULL DEFAULT 'never_connected' CHECK (status IN ('connected', 'disconnected', 'never_connected')),
  last_handshake TIMESTAMP WITH TIME ZONE,
  transfer_rx BIGINT DEFAULT 0,
  transfer_tx BIGINT DEFAULT 0,
  config_file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.wireguard_peers ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own peers" 
ON public.wireguard_peers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own peers" 
ON public.wireguard_peers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own peers" 
ON public.wireguard_peers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own peers" 
ON public.wireguard_peers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_wireguard_peers_updated_at
BEFORE UPDATE ON public.wireguard_peers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for WireGuard configs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wireguard-configs', 'wireguard-configs', false);

-- Create storage policies for WireGuard configs
CREATE POLICY "Users can view their own configs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'wireguard-configs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own configs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'wireguard-configs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own configs" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'wireguard-configs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own configs" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'wireguard-configs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create server configuration table
CREATE TABLE public.wireguard_server (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interface_name TEXT NOT NULL DEFAULT 'wg0',
  listen_port INTEGER NOT NULL DEFAULT 51820,
  private_key TEXT NOT NULL,
  public_key TEXT NOT NULL,
  network_subnet TEXT NOT NULL DEFAULT '10.0.0.0/24',
  dns_servers TEXT[] DEFAULT ARRAY['1.1.1.1', '8.8.8.8'],
  endpoint TEXT,
  status TEXT NOT NULL DEFAULT 'stopped' CHECK (status IN ('running', 'stopped', 'error')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for server config
ALTER TABLE public.wireguard_server ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read server config
CREATE POLICY "Authenticated users can view server config" 
ON public.wireguard_server 
FOR SELECT 
TO authenticated
USING (true);

-- Only authenticated users can manage server config
CREATE POLICY "Authenticated users can manage server config" 
ON public.wireguard_server 
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create trigger for server config timestamps
CREATE TRIGGER update_wireguard_server_updated_at
BEFORE UPDATE ON public.wireguard_server
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();