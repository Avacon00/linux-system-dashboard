#!/bin/bash

# Linux System Dashboard - Quick Setup
# Einfache Installation für Arch Linux

set -e

echo "🚀 Linux System Dashboard - Quick Setup"
echo "======================================="

# Farben
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Funktionen
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Prüfe Arch Linux
check_arch() {
    if ! grep -q "Arch Linux" /etc/os-release 2>/dev/null; then
        print_error "Diese Installation ist für Arch Linux optimiert!"
        echo "Andere Distributionen werden möglicherweise nicht vollständig unterstützt."
        read -p "Trotzdem fortfahren? (y/N): " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Prüfe Node.js
check_nodejs() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js ist nicht installiert!"
        echo "Installation von Node.js..."
        sudo pacman -S --needed --noconfirm nodejs npm
    fi
    
    # Prüfe ob node Befehl erfolgreich war
    if ! node --version &> /dev/null; then
        print_error "Node.js Installation fehlgeschlagen!"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js Version 16 oder höher ist erforderlich!"
        echo "Aktuelle Version: $(node --version)"
        echo "Aktualisiere Node.js..."
        sudo pacman -S --needed --noconfirm nodejs npm
    fi
    
    print_success "Node.js $(node --version) gefunden"
}

# Installiere System-Abhängigkeiten
install_system_deps() {
    print_info "Installiere System-Abhängigkeiten..."
    
    sudo pacman -S --needed --noconfirm \
        htop \
        net-tools \
        iproute2 \
        ufw \
        systemd \
        git
    
    print_success "System-Abhängigkeiten installiert"
}

# Installiere Node.js Abhängigkeiten
install_node_deps() {
    print_info "Installiere Node.js Abhängigkeiten..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json nicht gefunden!"
        exit 1
    fi
    
    npm install
    
    print_success "Node.js Abhängigkeiten installiert"
}

# Erstelle Desktop-Shortcut
create_desktop_shortcut() {
    print_info "Erstelle Desktop-Shortcut..."
    
    # Erstelle Verzeichnisse
    sudo mkdir -p /usr/local/bin
    sudo mkdir -p /usr/local/share/applications
    
    # Erstelle Symlink für npm start
    sudo ln -sf "$(pwd)" /usr/local/bin/linux-system-dashboard
    
    # Erstelle Wrapper-Script
    cat > /tmp/linux-system-dashboard-wrapper << EOF
#!/bin/bash
cd "$(pwd)"
npm start
EOF
    sudo mv /tmp/linux-system-dashboard-wrapper /usr/local/bin/linux-system-dashboard
    sudo chmod +x /usr/local/bin/linux-system-dashboard
    
    # Kopiere Desktop-Datei
    sudo cp linux-system-dashboard.desktop /usr/local/share/applications/
    
    # Aktualisiere Desktop-Datenbank
    sudo update-desktop-database /usr/local/share/applications
    
    print_success "Desktop-Shortcut erstellt"
}

# Erstelle Icon
create_icon() {
    print_info "Erstelle Icon..."
    
    sudo mkdir -p /usr/local/share/icons
    
    # Kopiere das vorhandene Icon
    if [ -f "assets/icon.png" ]; then
        sudo cp assets/icon.png /usr/local/share/icons/linux-system-dashboard.png
        print_success "Icon kopiert"
    else
        print_warning "Icon-Datei nicht gefunden - Icon wird übersprungen"
    fi
}

# Erstelle sudoers-Eintrag (optional)
setup_sudoers() {
    read -p "Möchten Sie sudo-Rechte für pacman einrichten? (y/N): " -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Richte sudo-Rechte ein..."
        echo "$USER ALL=(ALL) NOPASSWD: /usr/bin/pacman" | sudo tee -a /etc/sudoers.d/linux-dashboard
        print_success "Sudo-Rechte eingerichtet"
    fi
}

# Teste Installation
test_installation() {
    print_info "Teste Installation..."
    
    if command -v linux-system-dashboard &> /dev/null; then
        print_success "Installation erfolgreich!"
        echo
        echo "🎉 Linux System Dashboard wurde erfolgreich installiert!"
        echo
        echo "Sie können das Dashboard jetzt starten mit:"
        echo "  linux-system-dashboard"
        echo "  oder über das Anwendungsmenü"
        echo
        echo "Für Entwickler:"
        echo "  npm run dev"
        echo
        echo "Viel Spaß mit Ihrem neuen System-Dashboard! 🚀"
    else
        print_error "Installation fehlgeschlagen!"
        exit 1
    fi
}

# Hauptinstallation
main() {
    echo
    print_info "Starte Installation..."
    echo
    
    check_arch
    check_nodejs
    install_system_deps
    install_node_deps
    create_desktop_shortcut
    create_icon
    setup_sudoers
    test_installation
    
    echo
    print_success "Installation abgeschlossen!"
}

# Führe Installation aus
main "$@"
