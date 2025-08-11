import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Shield, Users, Wifi, Download, Eye, Trash2, Activity, LogOut, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/hooks/useAuth";
import { useWireGuard, type WireGuardPeer } from "@/hooks/useWireGuard";

export default function WireGuardDashboard() {
  const { user, signOut } = useAuth();
  const {
    peers,
    serverConfig,
    loading,
    createPeer,
    deletePeer,
    downloadConfig,
    refreshPeerStatus,
    syncWireGuardStatus,
    formatTransfer,
    generatePeerConfigContent
  } = useWireGuard();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPeer, setSelectedPeer] = useState<WireGuardPeer | null>(null);
  const [newPeerName, setNewPeerName] = useState("");
  const [newPeerIP, setNewPeerIP] = useState("");

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

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

  const handleCreatePeer = async () => {
    if (!newPeerName || !newPeerIP) {
      return;
    }

    try {
      await createPeer(newPeerName, `${newPeerIP}/32`);
      setNewPeerName("");
      setNewPeerIP("");
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDeletePeer = async (peerId: string) => {
    try {
      await deletePeer(peerId);
    } catch (error) {
      // Error handling is done in the hook
    }
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
            <p className="text-muted-foreground">
              Manage your WireGuard VPN peers and connections - {user.email}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={syncWireGuardStatus}
              disabled={loading}
              className="mr-2"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Sync Status
            </Button>
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
                  <Button onClick={handleCreatePeer} disabled={loading}>
                    {loading ? "Creating..." : "Create Peer"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
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
              <div className="text-2xl font-bold text-success">
                {serverConfig?.status === 'running' ? 'Online' : 'Offline'}
              </div>
              <p className="text-xs text-muted-foreground">
                WireGuard interface {serverConfig?.interface_name || 'wg0'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {serverConfig?.network_subnet || '10.0.0.0/24'}
              </div>
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading peers...</span>
              </div>
            ) : (
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
                      <TableCell>{peer.allowed_ips}</TableCell>
                      <TableCell>{getStatusBadge(peer.status)}</TableCell>
                      <TableCell>
                        {peer.last_handshake 
                          ? new Date(peer.last_handshake).toLocaleString()
                          : "Never"
                        }
                      </TableCell>
                      <TableCell>
                        ↓ {formatTransfer(peer.transfer_rx)} ↑ {formatTransfer(peer.transfer_tx)}
                      </TableCell>
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
                                    value={generatePeerConfigContent(peer)}
                                  />
                                  <Button 
                                    className="mt-2 w-full" 
                                    variant="outline"
                                    onClick={() => downloadConfig(peer)}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download .conf
                                  </Button>
                                </div>
                                <div className="flex flex-col items-center space-y-4">
                                  <Label>QR Code (Mobile)</Label>
                                  <div className="bg-white p-4 rounded-lg">
                                    <QRCodeSVG
                                      value={generatePeerConfigContent(peer)}
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
                            onClick={() => refreshPeerStatus(peer.id)}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}