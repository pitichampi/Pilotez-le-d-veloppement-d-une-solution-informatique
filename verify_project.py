#!/usr/bin/env python3
"""
Script de vérification du projet
Vérifie que tous les fichiers nécessaires sont présents
"""

import os
import sys
from pathlib import Path
from typing import List, Tuple

class ProjectVerifier:
    def __init__(self, root_path: str):
        self.root = Path(root_path)
        self.errors = []
        self.warnings = []
        self.success = []

    def check_file(self, path: str, file_type: str = "fichier") -> bool:
        """Vérifier qu'un fichier existe"""
        full_path = self.root / path
        if full_path.exists():
            self.success.append(f"✅ {file_type}: {path}")
            return True
        else:
            self.errors.append(f"❌ MANQUANT - {file_type}: {path}")
            return False

    def check_dir(self, path: str) -> bool:
        """Vérifier qu'un dossier existe"""
        full_path = self.root / path
        if full_path.is_dir():
            self.success.append(f"✅ Dossier: {path}")
            return True
        else:
            self.errors.append(f"❌ MANQUANT - Dossier: {path}")
            return False

    def verify_all(self) -> bool:
        """Vérifier tous les fichiers critiques"""
        print("🔍 Vérification du projet en cours...\n")

        # Configuration racine
        print("📋 Configuration racine")
        self.check_file("README.md")
        self.check_file("QUICKSTART.md")
        self.check_file("ARCHITECTURE.md")
        self.check_file("API.md")
        self.check_file("CONTRIBUTING.md")
        self.check_file("docker-compose.yml")
        self.check_file(".env")
        self.check_file("Makefile")

        print("\n📁 Répertoires")
        self.check_dir("frontend")
        self.check_dir("backend")

        # Frontend
        print("\n🎨 Frontend")
        self.check_file("frontend/package.json")
        self.check_file("frontend/tsconfig.json")
        self.check_file("frontend/vite.config.ts")
        self.check_file("frontend/tailwind.config.js")
        self.check_file("frontend/index.html")
        self.check_file("frontend/Dockerfile")
        self.check_dir("frontend/src")
        self.check_file("frontend/src/main.tsx")
        self.check_file("frontend/src/App.tsx")
        self.check_dir("frontend/src/api")
        self.check_dir("frontend/src/components")
        self.check_dir("frontend/src/pages")
        self.check_dir("frontend/src/hooks")

        # Backend
        print("\n🖥️ Backend")
        self.check_file("backend/package.json")
        self.check_file("backend/tsconfig.json")
        self.check_file("backend/data-source.ts")
        self.check_file("backend/Dockerfile")
        self.check_file("backend/.env")
        self.check_dir("backend/src")
        self.check_file("backend/src/main.ts")
        self.check_file("backend/src/app.module.ts")
        self.check_dir("backend/src/modules")
        self.check_file("backend/src/modules/auth/auth.module.ts")
        self.check_file("backend/src/modules/auth/auth.controller.ts")
        self.check_file("backend/src/modules/auth/auth.service.ts")
        self.check_file("backend/src/modules/users/users.module.ts")
        self.check_file("backend/src/modules/users/users.controller.ts")
        self.check_file("backend/src/modules/users/users.service.ts")
        self.check_file("backend/src/modules/files/files.module.ts")
        self.check_file("backend/src/modules/files/files.controller.ts")
        self.check_file("backend/src/modules/files/files.service.ts")
        self.check_dir("backend/src/common")
        self.check_file("backend/src/common/guards/jwt.guard.ts")
        self.check_file("backend/src/common/tasks/tasks.service.ts")

        return len(self.errors) == 0

    def print_report(self) -> None:
        """Afficher le rapport de vérification"""
        print("\n" + "="*60)
        print("📊 RAPPORT DE VÉRIFICATION")
        print("="*60 + "\n")

        if self.success:
            print(f"✅ Éléments vérifiés ({len(self.success)}):")
            for item in self.success[:10]:
                print(f"   {item}")
            if len(self.success) > 10:
                print(f"   ... et {len(self.success) - 10} autres")

        if self.warnings:
            print(f"\n⚠️  Avertissements ({len(self.warnings)}):")
            for item in self.warnings:
                print(f"   {item}")

        if self.errors:
            print(f"\n❌ Erreurs ({len(self.errors)}):")
            for item in self.errors:
                print(f"   {item}")

        print("\n" + "="*60)
        if len(self.errors) == 0:
            print("✅ TOUS LES FICHIERS SONT EN PLACE !")
            print("🚀 Vous pouvez lancer : docker-compose up")
        else:
            print(f"❌ {len(self.errors)} fichier(s) manquant(s)")
            print("   Veuillez vérifier la structure du projet")
        print("="*60 + "\n")

        return len(self.errors) == 0

def main():
    """Point d'entrée du script"""
    # Déterminer le répertoire racine du projet
    script_dir = Path(__file__).parent.absolute()

    verifier = ProjectVerifier(str(script_dir))
    all_ok = verifier.verify_all()
    success = verifier.print_report()

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()

