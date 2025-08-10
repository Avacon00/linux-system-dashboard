#!/bin/bash

# Linux System Dashboard Installer
# Ein modernes System-Dashboard für Linux Arch

set -e

echo "🚀 Linux System Dashboard Installer"
echo "=================================="

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktionen
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Prüfe ob Node.js installiert ist
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js ist nicht installiert!"
        echo "Bitte installieren Sie Node.js von https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js Version 16 oder höher ist erforderlich!"
        echo "Aktuelle Version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) gefunden"
}

# Prüfe System-Distribution
check_distribution() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        print_info "Distribution: $PRETTY_NAME"
    else
        print_warning "Unbekannte Distribution"
    fi
}

# Installiere Abhängigkeiten
install_dependencies() {
    print_info "Installiere Abhängigkeiten..."
    
    # Arch Linux spezifische Pakete
    if command -v pacman &> /dev/null; then
        print_info "Installiere Arch Linux Pakete..."
        sudo pacman -S --needed --noconfirm \
            htop \
            net-tools \
            iproute2 \
            ufw \
            systemd
    fi
    
    # Node.js Abhängigkeiten
    print_info "Installiere Node.js Abhängigkeiten..."
    npm install
    
    print_success "Abhängigkeiten installiert"
}

# Erstelle Desktop-Integration
setup_desktop() {
    print_info "Erstelle Desktop-Integration..."
    
    # Erstelle Verzeichnisse
    sudo mkdir -p /usr/local/bin
    sudo mkdir -p /usr/local/share/icons
    sudo mkdir -p /usr/local/share/applications
    
    # Kopiere Desktop-Datei
    sudo cp linux-system-dashboard.desktop /usr/local/share/applications/
    
    # Erstelle Symlink
    sudo ln -sf "$(pwd)/node_modules/.bin/electron" /usr/local/bin/linux-system-dashboard
    
    # Aktualisiere Desktop-Datenbank
    sudo update-desktop-database /usr/local/share/applications
    
    print_success "Desktop-Integration erstellt"
}

# Erstelle Icon (Platzhalter)
create_icon() {
    print_info "Erstelle Icon..."
    
    # Hier könnte ein echtes Icon erstellt werden
    # Für jetzt verwenden wir ein Platzhalter-Icon
    cat > /tmp/icon.svg << 'EOF'
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" fill="#007acc" rx="4"/>
  <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">L</text>
</svg>
EOF
    
    # Konvertiere zu PNG (falls ImageMagick verfügbar ist)
    if command -v convert &> /dev/null; then
        convert /tmp/icon.svg /tmp/icon.png
        sudo cp /tmp/icon.png /usr/local/share/icons/linux-system-dashboard.png
    else
        print_warning "ImageMagick nicht verfügbar - Icon wird übersprungen"
    fi
    
    rm -f /tmp/icon.svg /tmp/icon.png
}

# Erstelle Systemd-Service (optional)
setup_service() {
    read -p "Möchten Sie einen Systemd-Service erstellen? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Erstelle Systemd-Service..."
        
        cat > /tmp/linux-system-dashboard.service << EOF
[Unit]
Description=Linux System Dashboard
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/local/bin/linux-system-dashboard
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
        
        sudo cp /tmp/linux-system-dashboard.service /etc/systemd/system/
        sudo systemctl daemon-reload
        sudo systemctl enable linux-system-dashboard.service
        
        print_success "Systemd-Service erstellt und aktiviert"
        rm -f /tmp/linux-system-dashboard.service
    fi
}

# Erstelle Berechtigungen
setup_permissions() {
    print_info "Richte Berechtigungen ein..."
    
    # Erstelle sudoers-Eintrag für pacman (optional)
    read -p "Möchten Sie sudo-Rechte für pacman einrichten? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "$USER ALL=(ALL) NOPASSWD: /usr/bin/pacman" | sudo tee -a /etc/sudoers.d/linux-dashboard
        print_success "Sudo-Rechte für pacman eingerichtet"
    fi
}

# Hauptinstallation
main() {
    print_info "Starte Installation..."
    
    check_nodejs
    check_distribution
    install_dependencies
    setup_desktop
    create_icon
    setup_service
    setup_permissions
    
    print_success "Installation abgeschlossen!"
    echo
    echo "🎉 Linux System Dashboard wurde erfolgreich installiert!"
    echo
    echo "Sie können das Dashboard jetzt starten mit:"
    echo "  npm start"
    echo "  oder über das Anwendungsmenü"
    echo
    echo "Für Entwickler:"
    echo "  npm run dev"
    echo
    echo "Für Build:"
    echo "  npm run build"
    echo
    echo "Viel Spaß mit Ihrem neuen System-Dashboard! 🚀"
}

# Führe Installation aus
main "$@"
