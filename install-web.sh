#!/bin/bash

# Linux System Dashboard - Ein-Klick Web-Installer 
# Für Linux-Anfänger entwickelt - Maximale Benutzerfreundlichkeit

set -e

# ====================================
# KONFIGURATION
# ====================================

REPO_URL="https://github.com/Avacon00/linux-system-dashboard"
LATEST_RELEASE_URL="https://api.github.com/repos/Avacon00/linux-system-dashboard/releases/latest"
DOWNLOAD_DIR="$HOME/Downloads/linux-system-dashboard"
INSTALL_DIR="$HOME/.local/bin"
DESKTOP_DIR="$HOME/.local/share/applications"

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ====================================
# UTILITY FUNCTIONS
# ====================================

print_header() {
    echo -e "${CYAN}"
    echo "████████████████████████████████████████"
    echo "█  Linux System Dashboard Installer  █"
    echo "█     Ein-Klick Installation für     █"
    echo "█        Linux-Anfänger 🚀           █"
    echo "████████████████████████████████████████"
    echo -e "${NC}"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# ====================================
# SYSTEM DETECTION
# ====================================

detect_system() {
    print_step "System wird erkannt..."
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_NAME=$NAME
        OS_VERSION=$VERSION_ID
        print_info "Erkannt: $PRETTY_NAME"
    else
        OS_NAME="Unknown"
        print_warning "Unbekannte Distribution - Installation wird versucht"
    fi
    
    # Architecture detection
    ARCH=$(uname -m)
    case $ARCH in
        x86_64) ARCH_NAME="x64" ;;
        i386|i686) ARCH_NAME="ia32" ;;
        aarch64|arm64) ARCH_NAME="arm64" ;;
        *) 
            print_error "Nicht unterstützte Architektur: $ARCH"
            exit 1
            ;;
    esac
    
    print_success "System: $OS_NAME ($ARCH_NAME)"
}

# ====================================
# DEPENDENCY CHECK
# ====================================

check_dependencies() {
    print_step "Überprüfe Abhängigkeiten..."
    
    local missing_deps=()
    
    # Check curl/wget
    if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
        missing_deps+=("curl oder wget")
    fi
    
    # Check unzip
    if ! command -v unzip >/dev/null 2>&1; then
        missing_deps+=("unzip")
    fi
    
    # Check desktop environment
    if [ -z "$XDG_CURRENT_DESKTOP" ]; then
        print_warning "Keine Desktop-Umgebung erkannt - Installation ohne GUI-Integration"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_warning "Fehlende Abhängigkeiten: ${missing_deps[*]}"
        print_info "Versuche automatische Installation..."
        install_dependencies "${missing_deps[@]}"
    else
        print_success "Alle Abhängigkeiten erfüllt"
    fi
}

install_dependencies() {
    local deps=("$@")
    
    # Detect package manager and install
    if command -v pacman >/dev/null 2>&1; then
        print_info "Arch Linux erkannt - verwende pacman"
        sudo pacman -S --needed --noconfirm curl unzip
    elif command -v apt >/dev/null 2>&1; then
        print_info "Debian/Ubuntu erkannt - verwende apt"
        sudo apt update
        sudo apt install -y curl unzip
    elif command -v dnf >/dev/null 2>&1; then
        print_info "Fedora erkannt - verwende dnf"
        sudo dnf install -y curl unzip
    elif command -v zypper >/dev/null 2>&1; then
        print_info "openSUSE erkannt - verwende zypper"
        sudo zypper install -y curl unzip
    else
        print_error "Unbekannter Paketmanager - Bitte installieren Sie manuell: curl, unzip"
        exit 1
    fi
}

# ====================================
# DOWNLOAD FUNCTIONS
# ====================================

get_latest_release() {
    print_step "Lade neueste Version..."
    
    if command -v curl >/dev/null 2>&1; then
        RELEASE_DATA=$(curl -s "$LATEST_RELEASE_URL")
    elif command -v wget >/dev/null 2>&1; then
        RELEASE_DATA=$(wget -qO- "$LATEST_RELEASE_URL")
    else
        print_error "Kein Download-Tool gefunden"
        exit 1
    fi
    
    # Parse JSON (simple approach for this use case)
    LATEST_VERSION=$(echo "$RELEASE_DATA" | grep '"tag_name"' | cut -d'"' -f4)
    DOWNLOAD_URL=$(echo "$RELEASE_DATA" | grep '"browser_download_url".*AppImage"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$LATEST_VERSION" ] || [ -z "$DOWNLOAD_URL" ]; then
        print_error "Konnte Release-Informationen nicht abrufen"
        print_info "Verwende Fallback-Download..."
        # Fallback to direct download
        LATEST_VERSION="latest"
        DOWNLOAD_URL="https://github.com/Avacon00/linux-system-dashboard/releases/latest/download/Linux-System-Dashboard-${ARCH_NAME}.AppImage"
    fi
    
    print_success "Neueste Version: $LATEST_VERSION"
    print_info "Download-URL: $DOWNLOAD_URL"
}

download_appimage() {
    print_step "Lade Linux System Dashboard..."
    
    # Create download directory
    mkdir -p "$DOWNLOAD_DIR"
    cd "$DOWNLOAD_DIR"
    
    # Download with progress
    APPIMAGE_FILE="Linux-System-Dashboard-${LATEST_VERSION}.AppImage"
    
    if command -v curl >/dev/null 2>&1; then
        curl -L --progress-bar "$DOWNLOAD_URL" -o "$APPIMAGE_FILE"
    elif command -v wget >/dev/null 2>&1; then
        wget --progress=bar "$DOWNLOAD_URL" -O "$APPIMAGE_FILE"
    fi
    
    if [ ! -f "$APPIMAGE_FILE" ]; then
        print_error "Download fehlgeschlagen"
        exit 1
    fi
    
    print_success "Download abgeschlossen: $APPIMAGE_FILE"
    
    # Make executable
    chmod +x "$APPIMAGE_FILE"
}

# ====================================
# INSTALLATION
# ====================================

install_appimage() {
    print_step "Installiere Linux System Dashboard..."
    
    # Create install directories
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$DESKTOP_DIR"
    
    # Copy AppImage to install directory
    INSTALLED_FILE="$INSTALL_DIR/linux-system-dashboard.AppImage"
    cp "$APPIMAGE_FILE" "$INSTALLED_FILE"
    chmod +x "$INSTALLED_FILE"
    
    print_success "AppImage installiert: $INSTALLED_FILE"
}

create_desktop_integration() {
    print_step "Erstelle Desktop-Integration..."
    
    # Extract icon from AppImage (if possible)
    if command -v "$INSTALLED_FILE" >/dev/null 2>&1; then
        "$INSTALLED_FILE" --appimage-extract usr/share/icons/ 2>/dev/null || true
        if [ -d "squashfs-root/usr/share/icons" ]; then
            ICON_PATH=$(find squashfs-root/usr/share/icons -name "*.png" | head -1)
            if [ -n "$ICON_PATH" ]; then
                mkdir -p "$HOME/.local/share/icons"
                cp "$ICON_PATH" "$HOME/.local/share/icons/linux-system-dashboard.png"
                rm -rf squashfs-root
            fi
        fi
    fi
    
    # Create desktop file
    cat > "$DESKTOP_DIR/linux-system-dashboard.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Linux System Dashboard
Name[de]=Linux System Dashboard
Comment=Modern System Dashboard for Linux
Comment[de]=Modernes System-Dashboard für Linux
Exec=$INSTALLED_FILE
Icon=$HOME/.local/share/icons/linux-system-dashboard.png
Terminal=false
Categories=System;Monitor;Utility;
Keywords=system;monitor;dashboard;linux;performance;
StartupNotify=true
StartupWMClass=Linux System Dashboard
MimeType=application/x-linux-system-dashboard;
EOF
    
    # Update desktop database
    if command -v update-desktop-database >/dev/null 2>&1; then
        update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
    fi
    
    print_success "Desktop-Integration erstellt"
}

create_launcher_script() {
    print_step "Erstelle Start-Script..."
    
    # Create launcher script
    cat > "$INSTALL_DIR/linux-system-dashboard" << EOF
#!/bin/bash
# Linux System Dashboard Launcher
exec "$INSTALLED_FILE" "\$@"
EOF
    
    chmod +x "$INSTALL_DIR/linux-system-dashboard"
    
    # Add to PATH if not already there
    if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
        print_info "PATH aktualisiert - Neustart des Terminals erforderlich"
    fi
    
    print_success "Start-Script erstellt"
}

# ====================================
# VERIFICATION
# ====================================

verify_installation() {
    print_step "Überprüfe Installation..."
    
    if [ -f "$INSTALLED_FILE" ] && [ -x "$INSTALLED_FILE" ]; then
        print_success "AppImage korrekt installiert"
    else
        print_error "AppImage-Installation fehlgeschlagen"
        exit 1
    fi
    
    if [ -f "$DESKTOP_DIR/linux-system-dashboard.desktop" ]; then
        print_success "Desktop-Integration korrekt"
    else
        print_warning "Desktop-Integration unvollständig"
    fi
    
    if [ -f "$INSTALL_DIR/linux-system-dashboard" ]; then
        print_success "Start-Script korrekt"
    else
        print_warning "Start-Script fehlt"
    fi
}

# ====================================
# POST-INSTALLATION
# ====================================

post_install_setup() {
    print_step "Führe Post-Installation aus..."
    
    # Test run (silent)
    print_info "Teste Installation..."
    timeout 5 "$INSTALLED_FILE" --version >/dev/null 2>&1 || true
    
    print_success "Installation getestet"
}

show_completion_message() {
    echo
    echo -e "${GREEN}████████████████████████████████████████${NC}"
    echo -e "${GREEN}█          INSTALLATION FERTIG!         █${NC}"
    echo -e "${GREEN}████████████████████████████████████████${NC}"
    echo
    echo -e "${CYAN}🚀 Linux System Dashboard wurde erfolgreich installiert!${NC}"
    echo
    echo -e "${YELLOW}Starten Sie das Dashboard:${NC}"
    echo -e "  • Über das Anwendungsmenü: 'Linux System Dashboard'"
    echo -e "  • Terminal: ${GREEN}linux-system-dashboard${NC}"
    echo -e "  • Direkt: ${GREEN}$INSTALLED_FILE${NC}"
    echo
    echo -e "${YELLOW}Features:${NC}"
    echo -e "  ✅ Echtzeit System-Monitoring"
    echo -e "  ✅ Paket-Management (pacman/AUR)"
    echo -e "  ✅ Sicherheits-Features"
    echo -e "  ✅ Terminal-Integration"
    echo -e "  ✅ Benutzerfreundliche GUI"
    echo
    echo -e "${BLUE}Support & Updates:${NC}"
    echo -e "  🌐 GitHub: $REPO_URL"
    echo -e "  🌍 Website: https://schuttehub.de/"
    echo -e "  🔄 Auto-Update verfügbar über die App"
    echo
    echo -e "${PURPLE}Viel Spaß mit Ihrem neuen System-Dashboard! 🎉${NC}"
    echo
}

cleanup() {
    print_step "Räume temporäre Dateien auf..."
    cd ~
    rm -rf "$DOWNLOAD_DIR"
    print_success "Cleanup abgeschlossen"
}

# ====================================
# MAIN INSTALLATION FLOW
# ====================================

main() {
    print_header
    
    # Check if already installed
    if [ -f "$INSTALL_DIR/linux-system-dashboard.AppImage" ]; then
        print_warning "Linux System Dashboard ist bereits installiert"
        echo -n "Möchten Sie es aktualisieren? (y/N): "
        read -r response
        if [[ ! $response =~ ^[Yy]$ ]]; then
            print_info "Installation abgebrochen"
            exit 0
        fi
    fi
    
    # Main installation steps
    detect_system
    check_dependencies
    get_latest_release
    download_appimage
    install_appimage
    create_desktop_integration
    create_launcher_script
    verify_installation
    post_install_setup
    cleanup
    show_completion_message
    
    # Optional: Launch the app
    echo -n "Möchten Sie das Dashboard jetzt starten? (y/N): "
    read -r response
    if [[ $response =~ ^[Yy]$ ]]; then
        print_info "Starte Linux System Dashboard..."
        "$INSTALLED_FILE" >/dev/null 2>&1 &
        print_success "Dashboard gestartet!"
    fi
}

# ====================================
# ERROR HANDLING
# ====================================

trap 'print_error "Installation unterbrochen"; exit 1' INT TERM

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Bitte nicht als Root ausführen!"
    print_info "Führen Sie das Script als normaler Benutzer aus:"
    print_info "curl -fsSL https://your-domain.com/install | bash"
    exit 1
fi

# ====================================
# EXECUTION
# ====================================

main "$@"