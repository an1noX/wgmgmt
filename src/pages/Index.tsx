import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import WireGuardDashboard from "@/components/WireGuardDashboard";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <WireGuardDashboard />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="h-24 w-24 text-primary mx-auto mb-8" />
          <h1 className="text-4xl font-bold text-foreground mb-6">
            WireGuard Management Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Secure, cloud-based VPN management with real peer creation, editing, 
            and file operations. Full database integration with authentication.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Real Peer Management</h3>
              <p className="text-muted-foreground">
                Create, edit, and delete WireGuard peers with automatic key generation
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">File Operations</h3>
              <p className="text-muted-foreground">
                Upload existing configs, download generated configs, QR codes
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Cloud Backend</h3>
              <p className="text-muted-foreground">
                Supabase integration with authentication and real-time updates
              </p>
            </div>
          </div>

          <Link to="/auth">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
