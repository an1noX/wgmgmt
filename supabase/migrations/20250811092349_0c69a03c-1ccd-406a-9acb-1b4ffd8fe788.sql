-- Update wireguard_server table with actual server configuration
UPDATE public.wireguard_server 
SET 
  public_key = 'xCi3cBO9Azd7L1jkKUWUVZNC2uEH7HTPY+05GrMkOUE=',
  private_key = 'MO5G99E8n/PTqcaRywSrMLZ0C86mmDNdpeVq6/SgtXs=',
  network_subnet = '10.7.0.1/24',
  listen_port = 51820,
  endpoint = 'vpn.techpinoy.net:51820',
  dns_servers = ARRAY['1.1.1.1', '8.8.8.8'],
  status = 'running',
  updated_at = now()
WHERE id = (SELECT id FROM public.wireguard_server LIMIT 1);

-- If no server config exists, insert it
INSERT INTO public.wireguard_server (
  public_key,
  private_key,
  network_subnet,
  listen_port,
  endpoint,
  dns_servers,
  status,
  interface_name
)
SELECT 
  'xCi3cBO9Azd7L1jkKUWUVZNC2uEH7HTPY+05GrMkOUE=',
  'MO5G99E8n/PTqcaRywSrMLZ0C86mmDNdpeVq6/SgtXs=',
  '10.7.0.1/24',
  51820,
  'vpn.techpinoy.net:51820',
  ARRAY['1.1.1.1', '8.8.8.8'],
  'running',
  'wg0'
WHERE NOT EXISTS (SELECT 1 FROM public.wireguard_server);

-- Insert actual WireGuard peers
-- Note: Using a dummy user_id since we need authentication to be implemented
-- Users will need to sign up and these peers can be associated with their accounts
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
  '', -- Private key not shown in wg show output
  '10.7.0.2/32',
  '136.158.24.51:59295',
  'connected',
  25,
  0, -- Set actual values from your wg show output if available
  0, -- Set actual values from your wg show output if available
  '00000000-0000-0000-0000-000000000000' -- Placeholder user_id
),
(
  'srv05',
  'FafcLYAgf3QSOkSPY89Z+MUa+V4IWVsCmcoAC7p2n0A=',
  '', -- Private key not shown in wg show output
  '10.7.0.3/32',
  '136.158.24.51:63374',
  'connected',
  25,
  0, -- Set actual values from your wg show output if available
  0, -- Set actual values from your wg show output if available
  '00000000-0000-0000-0000-000000000000' -- Placeholder user_id
)
ON CONFLICT (public_key) DO UPDATE SET
  name = EXCLUDED.name,
  allowed_ips = EXCLUDED.allowed_ips,
  endpoint = EXCLUDED.endpoint,
  status = EXCLUDED.status,
  updated_at = now();