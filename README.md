
# WireGuard Management Dashboard

A comprehensive web-based WireGuard VPN management system built with React, TypeScript, and Supabase. This application provides a user-friendly interface for managing WireGuard peers, configurations, and server status.

## Features

- 🔐 **Authentication System** - Secure user authentication with Supabase Auth
- 👥 **Peer Management** - Create, update, and delete WireGuard peers
- 📱 **QR Code Generation** - Generate QR codes for easy mobile configuration
- 📊 **Dashboard Analytics** - Real-time connection status and transfer statistics
- 📁 **Configuration Files** - Download .conf files for WireGuard clients
- 🛡️ **Security** - Row Level Security (RLS) policies for data protection
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **UI Components**: shadcn/ui
- **Build Tool**: Vite
- **Icons**: Lucide React
- **QR Codes**: qrcode.react

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- A [Supabase](https://supabase.com/) account

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/an1noX/wgmgmt.git
cd wgmgmt
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Supabase Setup

#### Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and create a new project
2. Note down your project URL and anon key from the project settings

#### Run Database Migrations

1. Install the Supabase CLI:
```bash
npm install -g @supabase/cli
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your local project to your Supabase project:

**For Supabase Cloud (this project):**
```bash
supabase link --project-ref nqvhbsepjlinqyqaxgsi
```

**For Self-hosted Supabase:**
```bash
supabase link --project-ref YOUR_PROJECT_ID --db-url "postgresql://postgres:[password]@[host]:[port]/postgres"
```

4. Push the database migrations:
```bash
supabase db push
```

This will create the necessary tables:
- `wireguard_peers` - Stores peer configurations
- `wireguard_server` - Stores server configuration
- Storage bucket `wireguard-configs` for configuration files

#### Deploy Edge Functions

Deploy the WireGuard management edge function:
```bash
supabase functions deploy wireguard-manager
```

### 4. Environment Configuration

The application uses Supabase's auto-generated client configuration. The connection details are already configured in `src/integrations/supabase/client.ts`.

If you need to update the Supabase configuration:
1. Replace the values in `src/integrations/supabase/client.ts` with your project details
2. Update `supabase/config.toml` with your project ID

### 5. Configure Authentication

1. In your Supabase dashboard, go to Authentication → Settings
2. Add your domain to the "Site URL" and "Redirect URLs"
3. For local development, add: `http://localhost:8080`
4. For production, add your production domain

### 6. Storage Setup

The storage bucket `wireguard-configs` is automatically created with the migration. It stores WireGuard configuration files securely with RLS policies.

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## WireGuard Server Setup

This application manages WireGuard configurations but requires a separate WireGuard server. Here's how to set up the server:

### Server Installation

On your VPN server (Ubuntu/Debian):

```bash
# Update package list
sudo apt update

# Install WireGuard
sudo apt install wireguard

# Generate server keys
wg genkey | sudo tee /etc/wireguard/private.key
sudo chmod go= /etc/wireguard/private.key
sudo cat /etc/wireguard/private.key | wg pubkey | sudo tee /etc/wireguard/public.key
```

### Server Configuration

Create `/etc/wireguard/wg0.conf`:

```ini
[Interface]
PrivateKey = <SERVER_PRIVATE_KEY>
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Peers will be added here automatically by the management system
```

### Enable IP Forwarding

```bash
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Start WireGuard Service

```bash
sudo systemctl enable wg-quick@wg0.service
sudo systemctl start wg-quick@wg0.service
```

### Update Server Configuration in Database

1. Log into your application
2. The system will automatically detect if server configuration is missing
3. Update the server configuration with:
   - **Public Key**: Your server's public key
   - **Endpoint**: Your server's public IP and port (e.g., `your-server.example.com:51820`)
   - **Network Subnet**: `10.0.0.0/24` (or your chosen subnet)
   - **DNS Servers**: `1.1.1.1, 8.8.8.8` (or your preferred DNS)

## Client Configuration

### Desktop Clients

1. Install WireGuard on the client device
2. In the dashboard, create a new peer
3. Download the `.conf` file
4. Import the configuration file into WireGuard client
5. Connect to the VPN

### Mobile Clients

1. Install WireGuard app from App Store/Play Store
2. In the dashboard, view a peer's configuration
3. Scan the QR code with the mobile app
4. The configuration will be automatically imported

### Client Configuration Files Location

Downloaded `.conf` files contain all necessary settings:

```ini
[Interface]
PrivateKey = <CLIENT_PRIVATE_KEY>
Address = 10.0.0.2/32
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = <SERVER_PUBLIC_KEY>
Endpoint = your-server.example.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Lovable

If using Lovable's hosting:
1. Click the "Publish" button in the Lovable editor
2. Your app will be deployed automatically

### Deploy to Custom Hosting

The built files in the `dist` folder can be deployed to any static hosting service:

- **Vercel**: Connect your GitHub repository
- **Netlify**: Connect your GitHub repository  
- **Cloudflare Pages**: Connect your GitHub repository
- **Traditional hosting**: Upload the `dist` folder contents

### Environment Variables for Production

Ensure your production environment has:
- Correct Supabase project URL and keys in the client configuration
- Proper authentication redirect URLs configured in Supabase

## Usage

### Creating Your First Peer

1. Sign up for an account or log in
2. Click "Add Peer" in the dashboard
3. Enter a name (e.g., "john-laptop") and IP address (e.g., "10.0.0.2")
4. Download the configuration file or scan the QR code
5. Import into your WireGuard client and connect

### Managing Peers

- **View Status**: See connection status and data transfer
- **Update Configuration**: Modify peer settings
- **Delete Peers**: Remove unwanted configurations
- **Download Configs**: Get fresh configuration files

### Monitoring

The dashboard provides:
- Total peer count
- Currently connected peers
- Server status
- Data transfer statistics per peer
- Last handshake timestamps

## Security Considerations

- All data is protected by Supabase Row Level Security (RLS)
- Users can only access their own peer configurations
- Configuration files are stored securely in Supabase Storage
- Authentication is required for all operations

## Troubleshooting

### Common Issues

1. **Can't connect to VPN**: Check server firewall allows port 51820/UDP
2. **Peers not connecting**: Verify server public key and endpoint in database
3. **Authentication issues**: Check Supabase Auth settings and redirect URLs
4. **Build errors**: Ensure all dependencies are installed with `npm install`

### Support

For issues and questions:
1. Check the browser console for error messages
2. Verify Supabase configuration and connectivity
3. Ensure WireGuard server is properly configured and running

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
