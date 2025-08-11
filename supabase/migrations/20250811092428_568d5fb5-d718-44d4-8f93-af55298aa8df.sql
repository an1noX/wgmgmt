-- First, add a unique constraint on public_key for wireguard_peers table
ALTER TABLE public.wireguard_peers ADD CONSTRAINT wireguard_peers_public_key_unique UNIQUE (public_key);

-- Update or insert server configuration
INSERT INTO public.wireguard_server (
  public_key,
  private_key,
  network_subnet,
  listen_port,
  endpoint,
  dns_servers,
  status,
  interface_name
) VALUES (
  'xCi3cBO9Azd7L1jkKUWUVZNC2uEH7HTPY+05GrMkOUE=',
  'MO5G99E8n/PTqcaRywSrMLZ0C86mmDNdpeVq6/SgtXs=',
  '10.7.0.1/24',
  51820,
  'vpn.techpinoy.net:51820',
  ARRAY['1.1.1.1', '8.8.8.8'],
  'running',
  'wg0'
)
ON CONFLICT (id) DO UPDATE SET
  public_key = EXCLUDED.public_key,
  private_key = EXCLUDED.private_key,
  network_subnet = EXCLUDED.network_subnet,
  listen_port = EXCLUDED.listen_port,
  endpoint = EXCLUDED.endpoint,
  dns_servers = EXCLUDED.dns_servers,
  status = EXCLUDED.status,
  updated_at = now();

-- Insert actual WireGuard peers with placeholder user_id
-- Note: These will need to be associated with real user accounts after authentication is set up
INSERT INTO public.wireguard_peers (
  name,
  public_key,
  private_key,
  allowed_ips,
  endpoint,
  status,
  persistent_keepalive,
  transfer_rx,
  transfer_tx,
  user_id
) VALUES 
(
  'jnonymous',
  'S84x6nNFdwG15i7dmPm7EDya0xNXk51BV91uSHwVj34=',
  '',
  '10.7.0.2/32',
  '136.158.24.51:59295',
  'connected',
  25,
  0,
  0,
  '00000000-0000-0000-0000-000000000000'
),
(
  'srv05',
  'FafcLYAgf3QSOkSPY89Z+MUa+V4IWVsCmcoAC7p2n0A=',
  '',
  '10.7.0.3/32',
  '136.158.24.51:63374',
  'connected',
  25,
  0,
  0,
  '00000000-0000-0000-0000-000000000000'
)
ON CONFLICT (public_key) DO UPDATE SET
  name = EXCLUDED.name,
  allowed_ips = EXCLUDED.allowed_ips,
  endpoint = EXCLUDED.endpoint,
  status = EXCLUDED.status,
  updated_at = now();