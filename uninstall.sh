#!/bin/bash

# Linux System Dashboard - Uninstaller
# Saubere Deinstallation

set -e

echo "🗑️  Linux System Dashboard - Uninstaller"
echo "========================================"

# Farben
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

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

# Bestätigung
confirm_uninstall() {
    echo
    print_warning "Dies wird das Linux System Dashboard vollständig entfernen!"
    echo
    read -p "Sind Sie sicher? (y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deinstallation abgebrochen."
        exit 0
    fi
}

# Entferne Desktop-Integration
remove_desktop_integration() {
    print_info "Entferne Desktop-Integration..."
    
    # Entferne Symlink
    if [ -L "/usr/local/bin/linux-system-dashboard" ]; then
        sudo rm -f /usr/local/bin/linux-system-dashboard
        print_success "Symlink entfernt"
    fi
    
    # Entferne Desktop-Datei
    if [ -f "/usr/local/share/applications/linux-system-dashboard.desktop" ]; then
        sudo rm -f /usr/local/share/applications/linux-system-dashboard.desktop
        print_success "Desktop-Datei entfernt"
    fi
    
    # Entferne Icon
    if [ -f "/usr/local/share/icons/linux-system-dashboard.png" ]; then
        sudo rm -f /usr/local/share/icons/linux-system-dashboard.png
        print_success "Icon entfernt"
    fi
    
    # Aktualisiere Desktop-Datenbank
    sudo update-desktop-database /usr/local/share/applications
}

# Entferne sudoers-Eintrag
remove_sudoers() {
    print_info "Entferne sudoers-Eintrag..."
    
    if [ -f "/etc/sudoers.d/linux-dashboard" ]; then
        sudo rm -f /etc/sudoers.d/linux-dashboard
        print_success "Sudoers-Eintrag entfernt"
    fi
}

# Entferne Node.js Abhängigkeiten
remove_node_deps() {
    print_info "Entferne Node.js Abhängigkeiten..."
    
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        print_success "node_modules entfernt"
    fi
    
    if [ -f "package-lock.json" ]; then
        rm -f package-lock.json
        print_success "package-lock.json entfernt"
    fi
}

# Entferne Build-Dateien
remove_build_files() {
    print_info "Entferne Build-Dateien..."
    
    if [ -d "dist" ]; then
        rm -rf dist
        print_success "dist-Verzeichnis entfernt"
    fi
    
    if [ -d "build" ]; then
        rm -rf build
        print_success "build-Verzeichnis entfernt"
    fi
}

# Entferne Logs
remove_logs() {
    print_info "Entferne Logs..."
    
    find . -name "*.log" -type f -delete 2>/dev/null || true
    print_success "Logs entfernt"
}

# Prüfe ob noch andere Installationen existieren
check_remaining() {
    print_info "Prüfe verbleibende Dateien..."
    
    local remaining=false
    
    if [ -L "/usr/local/bin/linux-system-dashboard" ]; then
        print_warning "Symlink existiert noch"
        remaining=true
    fi
    
    if [ -f "/usr/local/share/applications/linux-system-dashboard.desktop" ]; then
        print_warning "Desktop-Datei existiert noch"
        remaining=true
    fi
    
    if [ -f "/usr/local/share/icons/linux-system-dashboard.png" ]; then
        print_warning "Icon existiert noch"
        remaining=true
    fi
    
    if [ -f "/etc/sudoers.d/linux-dashboard" ]; then
        print_warning "Sudoers-Eintrag existiert noch"
        remaining=true
    fi
    
    if [ "$remaining" = false ]; then
        print_success "Alle Dateien erfolgreich entfernt"
    else
        print_warning "Einige Dateien konnten nicht entfernt werden"
        echo "Bitte entfernen Sie diese manuell."
    fi
}

# Hauptdeinstallation
main() {
    echo
    confirm_uninstall
    echo
    
    remove_desktop_integration
    remove_sudoers
    remove_node_deps
    remove_build_files
    remove_logs
    check_remaining
    
    echo
    print_success "Deinstallation abgeschlossen!"
    echo
    echo "Das Linux System Dashboard wurde erfolgreich entfernt."
    echo "Sie können das Projektverzeichnis manuell löschen, wenn gewünscht."
}

# Führe Deinstallation aus
main "$@"
