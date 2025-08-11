import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface WireGuardPeer {
  id: string;
  user_id: string;
  name: string;
  public_key: string;
  private_key: string;
  allowed_ips: string;
  endpoint?: string;
  persistent_keepalive: number;
  status: "connected" | "disconnected" | "never_connected";
  last_handshake?: string;
  transfer_rx: number;
  transfer_tx: number;
  config_file_path?: string;
  created_at: string;
  updated_at: string;
}

export interface WireGuardServer {
  id: string;
  interface_name: string;
  listen_port: number;
  private_key: string;
  public_key: string;
  network_subnet: string;
  dns_servers: string[];
  endpoint?: string;
  status: "running" | "stopped" | "error";
  created_at: string;
  updated_at: string;
}

export function useWireGuard() {
  const [peers, setPeers] = useState<WireGuardPeer[]>([]);
  const [serverConfig, setServerConfig] = useState<WireGuardServer | null>(null);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();
  const { toast } = useToast();

  // Load peers from database
  const loadPeers = async () => {
    if (!session?.user) return;

    try {
      const { data, error } = await supabase
        .from('wireguard_peers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPeers((data || []) as WireGuardPeer[]);
    } catch (error: any) {
      console.error('Error loading peers:', error);
      toast({
        title: "Error",
        description: "Failed to load peers",
        variant: "destructive"
      });
    }
  };

  // Load server configuration
  const loadServerConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('wireguard_server')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setServerConfig(data as WireGuardServer);
    } catch (error: any) {
      console.error('Error loading server config:', error);
    }
  };

  // Call edge function
  const callEdgeFunction = async (action: string, params: any = {}) => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('wireguard-manager', {
      body: { action, ...params },
    });

    if (error) throw error;
    return data;
  };

  // Create new peer
  const createPeer = async (name: string, allowedIps: string) => {
    try {
      setLoading(true);
      const result = await callEdgeFunction('create_peer', { name, allowedIps });
      await loadPeers(); // Refresh the list
      
      toast({
        title: "Success",
        description: `Peer "${name}" created successfully`
      });
      
      return result;
    } catch (error: any) {
      console.error('Error creating peer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create peer",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update peer
  const updatePeer = async (id: string, updates: Partial<WireGuardPeer>) => {
    try {
      setLoading(true);
      await callEdgeFunction('update_peer', { id, ...updates });
      await loadPeers();
      
      toast({
        title: "Success",
        description: "Peer updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating peer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update peer",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete peer
  const deletePeer = async (id: string) => {
    try {
      setLoading(true);
      await callEdgeFunction('delete_peer', { id });
      await loadPeers();
      
      toast({
        title: "Success",
        description: "Peer deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting peer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete peer",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Download config file
  const downloadConfig = async (peer: WireGuardPeer) => {
    try {
      if (!peer.config_file_path) {
        throw new Error('Config file not found');
      }

      const { data, error } = await supabase.storage
        .from('wireguard-configs')
        .download(peer.config_file_path);

      if (error) throw error;

      const text = await data.text();
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${peer.name}.conf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Configuration downloaded"
      });
    } catch (error: any) {
      console.error('Error downloading config:', error);
      toast({
        title: "Error",
        description: "Failed to download configuration",
        variant: "destructive"
      });
    }
  };

  // Refresh peer status
  const refreshPeerStatus = async (peerId: string) => {
    try {
      await callEdgeFunction('get_peer_status', { peerId });
      await loadPeers();
    } catch (error: any) {
      console.error('Error refreshing peer status:', error);
    }
  };

  // Sync WireGuard status from actual server
  const syncWireGuardStatus = async () => {
    try {
      const result = await callEdgeFunction('sync_wireguard_status', {});
      console.log('WireGuard sync result:', result);
      await loadPeers(); // Reload all peers to get updated status
      await loadServerConfig(); // Reload server config
      
      toast({
        title: "Success",
        description: `Synced status for ${result.peersUpdated || 0} peers`
      });
      
      return result;
    } catch (error: any) {
      console.error('Error syncing WireGuard status:', error);
      toast({
        title: "Error",
        description: "Failed to sync WireGuard status",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Format transfer data
  const formatTransfer = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Load data on mount and auth changes
  useEffect(() => {
    if (session?.user) {
      loadPeers();
      loadServerConfig();
      
      // Auto-sync every 30 seconds
      const interval = setInterval(() => {
        syncWireGuardStatus().catch(console.error);
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      setPeers([]);
      setServerConfig(null);
    }
    setLoading(false);
  }, [session]);

  return {
    peers,
    serverConfig,
    loading,
    createPeer,
    updatePeer,
    deletePeer,
    downloadConfig,
    refreshPeerStatus,
    syncWireGuardStatus,
    formatTransfer,
    loadPeers,
    loadServerConfig,
  };
}