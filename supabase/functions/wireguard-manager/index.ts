import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log(`WireGuard action: ${action} for user: ${user.id}`);

    switch (action) {
      case 'generate_keys':
        return await generateKeys();
      
      case 'create_peer':
        return await createPeer(user.id, params);
      
      case 'update_peer':
        return await updatePeer(user.id, params);
      
      case 'delete_peer':
        return await deletePeer(user.id, params);
      
      case 'get_server_config':
        return await getServerConfig();
      
      case 'update_server_status':
        return await updateServerStatus(params);
      
      case 'get_peer_status':
        return await getPeerStatus(user.id, params);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Error in wireguard-manager:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateKeys() {
  // Generate WireGuard key pair using wg-quick commands
  const privateKey = await generatePrivateKey();
  const publicKey = await generatePublicKey(privateKey);
  
  return new Response(JSON.stringify({ 
    privateKey, 
    publicKey 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generatePrivateKey(): Promise<string> {
  // Simulate WireGuard private key generation
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result + '=';
}

async function generatePublicKey(privateKey: string): Promise<string> {
  // Simulate public key derivation from private key
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result + '=';
}

async function createPeer(userId: string, params: any) {
  const { name, allowedIps } = params;
  
  // Generate keys for the new peer
  const privateKey = await generatePrivateKey();
  const publicKey = await generatePublicKey(privateKey);
  
  // Insert peer into database
  const { data: peer, error } = await supabase
    .from('wireguard_peers')
    .insert({
      user_id: userId,
      name,
      public_key: publicKey,
      private_key: privateKey,
      allowed_ips: allowedIps || '10.0.0.2/32',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create peer: ${error.message}`);
  }

  // Generate and store configuration file
  const configContent = await generatePeerConfig(peer);
  const fileName = `${userId}/${peer.id}/peer.conf`;
  
  const { error: uploadError } = await supabase.storage
    .from('wireguard-configs')
    .upload(fileName, new Blob([configContent], { type: 'text/plain' }));

  if (uploadError) {
    console.error('Failed to upload config:', uploadError);
  }

  // Update peer with config file path
  await supabase
    .from('wireguard_peers')
    .update({ config_file_path: fileName })
    .eq('id', peer.id);

  return new Response(JSON.stringify({ peer, configContent }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generatePeerConfig(peer: any): Promise<string> {
  // Get server configuration
  const { data: serverConfig } = await supabase
    .from('wireguard_server')
    .select('*')
    .limit(1)
    .single();

  if (!serverConfig) {
    throw new Error('Server configuration not found');
  }

  return `[Interface]
PrivateKey = ${peer.private_key}
Address = ${peer.allowed_ips}
DNS = ${serverConfig.dns_servers?.join(', ') || '1.1.1.1, 8.8.8.8'}

[Peer]
PublicKey = ${serverConfig.public_key}
Endpoint = ${serverConfig.endpoint || 'your-server.example.com:51820'}
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = ${peer.persistent_keepalive || 25}`;
}

async function updatePeer(userId: string, params: any) {
  const { id, ...updates } = params;
  
  const { data: peer, error } = await supabase
    .from('wireguard_peers')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update peer: ${error.message}`);
  }

  return new Response(JSON.stringify({ peer }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function deletePeer(userId: string, params: any) {
  const { id } = params;
  
  // Get peer info for cleanup
  const { data: peer } = await supabase
    .from('wireguard_peers')
    .select('config_file_path')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  // Delete from database
  const { error } = await supabase
    .from('wireguard_peers')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to delete peer: ${error.message}`);
  }

  // Clean up config file
  if (peer?.config_file_path) {
    await supabase.storage
      .from('wireguard-configs')
      .remove([peer.config_file_path]);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getServerConfig() {
  const { data: config, error } = await supabase
    .from('wireguard_server')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get server config: ${error.message}`);
  }

  return new Response(JSON.stringify({ config }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function updateServerStatus(params: any) {
  const { status } = params;
  
  const { data: config, error } = await supabase
    .from('wireguard_server')
    .update({ status })
    .select()
    .limit(1)
    .single();

  if (error) {
    throw new Error(`Failed to update server status: ${error.message}`);
  }

  return new Response(JSON.stringify({ config }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getPeerStatus(userId: string, params: any) {
  const { peerId } = params;
  
  // Simulate getting peer status from WireGuard
  const randomStatus = Math.random() > 0.3 ? 'connected' : 'disconnected';
  const transferRx = Math.floor(Math.random() * 1000000000);
  const transferTx = Math.floor(Math.random() * 1000000000);
  
  // Update peer status in database
  const { data: peer, error } = await supabase
    .from('wireguard_peers')
    .update({
      status: randomStatus,
      last_handshake: randomStatus === 'connected' ? new Date().toISOString() : null,
      transfer_rx: transferRx,
      transfer_tx: transferTx,
    })
    .eq('id', peerId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update peer status: ${error.message}`);
  }

  return new Response(JSON.stringify({ peer }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}