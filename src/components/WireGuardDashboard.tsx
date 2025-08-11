import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Shield, Users, Wifi, Download, Eye, Trash2, Activity } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";

interface WireGuardPeer {
  id: string;
  name: string;
  publicKey: string;
  allowedIPs: string;
  endpoint?: string;
  status: "connected" | "disconnected" | "never_connected";
  createdAt: string;
  lastHandshake?: string;
  transferRx: string;
  transferTx: string;
}

const mockPeers: WireGuardPeer[] = [
  {
    id: "1",
    name: "admin-laptop",
    publicKey: "ABC123DEF456...",
    allowedIPs: "10.0.0.2/32",
    status: "connected",
    createdAt: "2024-01-15",
    lastHandshake: "2 minutes ago",
    transferRx: "1.2 GB",
    transferTx: "450 MB"
  },
  {
    id: "2", 
    name: "mobile-device",
    publicKey: "XYZ789GHI012...",
    allowedIPs: "10.0.0.3/32",
    status: "disconnected",
    createdAt: "2024-01-10",
    lastHandshake: "1 hour ago",
    transferRx: "500 MB", 
    transferTx: "120 MB"
  },
  {
    id: "3",
    name: "backup-server",
    publicKey: "MNO345PQR678...",
    allowedIPs: "10.0.0.4/32",
    status: "never_connected",
    createdAt: "2024-01-12",
    transferRx: "0 B",
    transferTx: "0 B"
  }
];

const generatePeerConfig = (peer: WireGuardPeer) => `[Interface]
PrivateKey = PEER_PRIVATE_KEY_HERE
Address = ${peer.allowedIPs}
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = SERVER_PUBLIC_KEY_HERE
Endpoint = your-server.example.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25`;

// LocalStorage utility functions
const STORAGE_KEY = "wireguard-peers";

const loadPeersFromStorage = (): WireGuardPeer[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading peers from localStorage:", error);
  }
  return mockPeers; // Fallback to mock data
};

const savePeersToStorage = (peers: WireGuardPeer[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(peers));
  } catch (error) {
    console.error("Error saving peers to localStorage:", error);
  }
};

export default function WireGuardDashboard() {
  const [peers, setPeers] = useState<WireGuardPeer[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<WireGuardPeer | null>(null);
  const [newPeerName, setNewPeerName] = useState("");
  const [newPeerIP, setNewPeerIP] = useState("");
  const { toast } = useToast();

  // Load peers from localStorage on component mount
  useEffect(() => {
    const storedPeers = loadPeersFromStorage();
    setPeers(storedPeers);
  }, []);

  // Save peers to localStorage whenever peers state changes
  useEffect(() => {
    if (peers.length > 0) {
      savePeersToStorage(peers);
    }
  }, [peers]);

  const getStatusBadge = (status: WireGuardPeer["status"]) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-success text-success-foreground">Connected</Badge>;
      case "disconnected":
        return <Badge variant="secondary">Disconnected</Badge>;
      case "never_connected":
        return <Badge variant="outline">Never Connected</Badge>;
    }
  };

  const handleCreatePeer = () => {
    if (!newPeerName || !newPeerIP) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const newPeer: WireGuardPeer = {
      id: Date.now().toString(),
      name: newPeerName,
      publicKey: `${Math.random().toString(36).substring(2, 15)}...`,
      allowedIPs: `${newPeerIP}/32`,
      status: "never_connected",
      createdAt: new Date().toISOString().split('T')[0],
      transferRx: "0 B",
      transferTx: "0 B"
    };

    setPeers([...peers, newPeer]);
    setNewPeerName("");
    setNewPeerIP("");
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Peer Created",
      description: `Successfully created peer "${newPeerName}"`
    });
  };

  const handleDeletePeer = (peerId: string) => {
    setPeers(peers.filter(p => p.id !== peerId));
    toast({
      title: "Peer Deleted",
      description: "Peer has been removed from the server"
    });
  };

  const connectedCount = peers.filter(p => p.status === "connected").length;
  const totalCount = peers.length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">WireGuard Management</h1>
            <p className="text-muted-foreground">Manage your WireGuard VPN peers and connections</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Peer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Peer</DialogTitle>
                <DialogDescription>
                  Add a new WireGuard peer configuration
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Peer Name</Label>
                  <Input
                    id="name"
                    value={newPeerName}
                    onChange={(e) => setNewPeerName(e.target.value)}
                    placeholder="e.g., john-laptop"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ip">IP Address</Label>
                  <Input
                    id="ip"
                    value={newPeerIP}
                    onChange={(e) => setNewPeerIP(e.target.value)}
                    placeholder="e.g., 10.0.0.5"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePeer}>Create Peer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Peers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
              <p className="text-xs text-muted-foreground">
                Active VPN configurations
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected</CardTitle>
              <Activity className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{connectedCount}</div>
              <p className="text-xs text-muted-foreground">
                Currently online
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Server Status</CardTitle>
              <Shield className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">Online</div>
              <p className="text-xs text-muted-foreground">
                WireGuard interface active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">10.0.0.0/24</div>
              <p className="text-xs text-muted-foreground">
                VPN subnet range
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Peers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Peer Management</CardTitle>
            <CardDescription>
              View and manage all WireGuard peer configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Handshake</TableHead>
                  <TableHead>Transfer</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {peers.map((peer) => (
                  <TableRow key={peer.id}>
                    <TableCell className="font-medium">{peer.name}</TableCell>
                    <TableCell>{peer.allowedIPs}</TableCell>
                    <TableCell>{getStatusBadge(peer.status)}</TableCell>
                    <TableCell>{peer.lastHandshake || "Never"}</TableCell>
                    <TableCell>↓ {peer.transferRx} ↑ {peer.transferTx}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPeer(peer)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Peer Configuration: {peer.name}</DialogTitle>
                              <DialogDescription>
                                Download configuration or scan QR code
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <Label>Configuration File</Label>
                                <Textarea
                                  className="mt-2 font-mono text-sm"
                                  rows={12}
                                  readOnly
                                  value={generatePeerConfig(peer)}
                                />
                                <Button className="mt-2 w-full" variant="outline">
                                  <Download className="w-4 h-4 mr-2" />
                                  Download .conf
                                </Button>
                              </div>
                              <div className="flex flex-col items-center space-y-4">
                                <Label>QR Code (Mobile)</Label>
                                <div className="bg-white p-4 rounded-lg">
                                  <QRCodeSVG
                                    value={generatePeerConfig(peer)}
                                    size={200}
                                    level="M"
                                    includeMargin
                                  />
                                </div>
                                <p className="text-sm text-muted-foreground text-center">
                                  Scan with WireGuard mobile app
                                </p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePeer(peer.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}