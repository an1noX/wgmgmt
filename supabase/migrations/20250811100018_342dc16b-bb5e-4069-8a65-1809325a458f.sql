-- Ensure wireguard_server table has a default configuration
INSERT INTO public.wireguard_server (
  interface_name, 
  listen_port, 
  private_key, 
  public_key, 
  network_subnet, 
  dns_servers, 
  endpoint, 
  status
) 
SELECT 
  'wg0', 
  51820, 
  'GENERATE_SERVER_PRIVATE_KEY', 
  'xCi3cBO9Azd7L1jkKUWUVZNC2uEH7HTPY+05GrMkOUE=', 
  '10.7.0.0/24', 
  ARRAY['1.1.1.1', '8.8.8.8'], 
  'vpn.techpinoy.net:51820', 
  'running'
WHERE NOT EXISTS (SELECT 1 FROM public.wireguard_server LIMIT 1);