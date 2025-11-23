#!/usr/bin/env python3
"""
Script para analisar dependências de arquivos TSX/TS e gerar documentação consolidada.
Uso: python build_docs.py src/pages/Products.tsx
"""

import os
import re
import sys
import json
from pathlib import Path
from typing import Set, List, Tuple, Dict


class TSXAnalyzer:
    def __init__(self, root_dir: str = "src"):
        self.root_dir = Path(root_dir)
        self.project_root = Path.cwd()
        self.visited_files: Set[Path] = set()
        self.file_contents: List[Tuple[Path, str]] = []
        self.path_aliases = self._load_path_aliases()
        
    def _load_path_aliases(self) -> Dict[str, str]:
        """Carrega os aliases de caminho do tsconfig.json."""
        aliases = {}
        tsconfig_paths = [
            self.project_root / "tsconfig.json",
            self.project_root / "tsconfig.app.json",
        ]
        
        for tsconfig_path in tsconfig_paths:
            if not tsconfig_path.exists():
                continue
                
            try:
                with open(tsconfig_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Remove comentários /* */ e //
                    content = re.sub(r'/\*[\s\S]*?\*/|//.*', '', content)
                    config = json.loads(content)
                
                paths = config.get('compilerOptions', {}).get('paths', {})
                base_url = config.get('compilerOptions', {}).get('baseUrl', '.')
                
                for alias, targets in paths.items():
                    if targets:
                        clean_alias = alias.rstrip('/*')
                        clean_target = targets[0].rstrip('/*')
                        
                        if base_url:
                            target_path = self.project_root / base_url / clean_target
                        else:
                            target_path = self.project_root / clean_target
                        
                        aliases[clean_alias] = str(target_path.resolve())
                        
                if aliases:
                    print(f"Aliases carregados do {tsconfig_path.name}: {aliases}")
                    return aliases
                    
            except Exception as e:
                print(f"Aviso: Erro ao carregar {tsconfig_path}: {e}", file=sys.stderr)
                continue
        
        # Fallback: assume @ = src
        default_src = str((self.project_root / "src").resolve())
        print(f"⚠️  Nenhum alias encontrado no tsconfig. Usando padrão: @ -> {default_src}")
        return {"@": default_src}
    
    def resolve_alias(self, import_path: str) -> str | None:
        """Resolve aliases de caminho como @/ para o caminho real."""
        # Tenta cada alias configurado
        for alias, real_path in self.path_aliases.items():
            if import_path.startswith(alias + '/'):
                resolved = import_path.replace(alias + '/', real_path + '/', 1)
                return resolved
            elif import_path == alias:
                return real_path
        
        # Fallback: se começar com @, tenta src/
        if import_path.startswith('@/'):
            return str(self.project_root / 'src' / import_path[2:])
        
        return None
    
    def find_file(self, import_path: str, current_file: Path) -> Path | None:
        """Encontra o arquivo correspondente ao import."""
        original_import = import_path
        import_path = import_path.strip('\'" ')
        
        # Debug: mostra o que está tentando resolver
        print(f"    🔍 Resolvendo: {import_path}")
        
        # Ignora imports de node_modules
        if not import_path.startswith('.') and not import_path.startswith('/') and not import_path.startswith('@'):
            print(f"    ⏭️  Ignorando (node_modules): {import_path}")
            return None
        
        # Tenta resolver aliases
        if import_path.startswith('@'):
            resolved = self.resolve_alias(import_path)
            if resolved:
                resolved_path = Path(resolved)
                print(f"    🔄 Alias resolvido para: {resolved_path}")
            else:
                print(f"    ❌ Não conseguiu resolver alias: {import_path}")
                return None
        elif import_path.startswith('.'):
            # Caminho relativo
            base_dir = current_file.parent
            resolved_path = (base_dir / import_path).resolve()
            print(f"    🔄 Caminho relativo resolvido: {resolved_path}")
        else:
            print(f"    ❌ Tipo de import desconhecido: {import_path}")
            return None
        
        # Tenta diferentes extensões
        extensions = ['', '.tsx', '.ts', '/index.tsx', '/index.ts']
        for ext in extensions:
            candidate = Path(str(resolved_path) + ext)
            if candidate.exists() and candidate.is_file():
                print(f"    ✅ Encontrado: {candidate}")
                return candidate
        
        print(f"    ❌ Arquivo não existe: {resolved_path} (tentou: {extensions})")
        return None
    
    def extract_imports(self, content: str) -> List[str]:
        """Extrai todos os imports de um arquivo."""
        import_patterns = [
            # import type { X } from "path"
            r'import\s+type\s+{[^}]*}\s+from\s+[\'"]([^\'"]+)[\'"]',
            # import { X } from "path"
            r'import\s+{[^}]*}\s+from\s+[\'"]([^\'"]+)[\'"]',
            # import * as X from "path"
            r'import\s+\*\s+as\s+\w+\s+from\s+[\'"]([^\'"]+)[\'"]',
            # import X from "path"
            r'import\s+\w+\s+from\s+[\'"]([^\'"]+)[\'"]',
            # import X, { Y } from "path"
            r'import\s+\w+\s*,\s*{[^}]*}\s+from\s+[\'"]([^\'"]+)[\'"]',
            # import "path"
            r'import\s+[\'"]([^\'"]+)[\'"]',
        ]
        
        imports = []
        for pattern in import_patterns:
            matches = re.finditer(pattern, content, re.MULTILINE)
            for match in matches:
                import_path = match.group(1)
                if import_path not in imports:
                    imports.append(import_path)
        
        return imports
    
    def analyze_file(self, file_path: Path, depth: int = 0) -> None:
        """Analisa um arquivo e seus imports recursivamente."""
        # Normaliza o caminho
        file_path = file_path.resolve()
        
        # Verifica se já foi visitado
        if file_path in self.visited_files:
            return
        
        # Verifica se o arquivo existe
        if not file_path.exists():
            return
        
        # Marca como visitado ANTES de processar para evitar loops
        self.visited_files.add(file_path)
        
        # Mostra progresso
        try:
            rel_path = file_path.relative_to(self.project_root)
        except ValueError:
            rel_path = file_path
        print(f"\n{'  ' * depth}📄 Processando: {rel_path}")
        
        try:
            # Lê o conteúdo do arquivo
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Armazena o conteúdo
            self.file_contents.append((file_path, content))
            
            # Extrai imports
            imports = self.extract_imports(content)
            
            if imports:
                print(f"{'  ' * depth}  📦 {len(imports)} imports encontrados")
                
                # Processa cada import
                for import_path in imports:
                    imported_file = self.find_file(import_path, file_path)
                    if imported_file and depth < 15:  # Limita profundidade
                        self.analyze_file(imported_file, depth + 1)
            else:
                print(f"{'  ' * depth}  ℹ️  Nenhum import local encontrado")
                    
        except Exception as e:
            print(f"{'  ' * depth}❌ Erro ao processar: {e}", file=sys.stderr)
            import traceback
            traceback.print_exc()
    
    def generate_markdown(self, output_file: str, original_filename: str) -> str:
        """Gera o markdown consolidado."""
        base_name = Path(original_filename).stem
        
        md_lines = [f"# Fluxo de {base_name}\n"]
        
        for file_path, content in self.file_contents:
            try:
                rel_path = file_path.relative_to(self.project_root)
            except ValueError:
                rel_path = file_path
            
            rel_path_str = str(rel_path).replace('\\', '/')
            
            md_lines.append(f"\n## {rel_path_str}\n")
            md_lines.append("```tsx")
            md_lines.append(content)
            md_lines.append("```\n")
        
        markdown = "\n".join(md_lines)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(markdown)
        
        return markdown


def main():
    if len(sys.argv) < 2:
        print("Uso: python build_docs.py <arquivo.tsx>")
        print("Exemplo: python build_docs.py src/pages/Products.tsx")
        sys.exit(1)
    
    input_file = sys.argv[1]
    base_name = Path(input_file).stem
    output_file = f"review_{base_name}.md"
    
    print("\n" + "="*70)
    print("🔍 TSX Dependency Analyzer")
    print("="*70)
    
    analyzer = TSXAnalyzer()
    
    initial_path = Path(input_file)
    if not initial_path.exists():
        print(f"\n❌ Erro: Arquivo não encontrado: {input_file}")
        sys.exit(1)
    
    print(f"\n📄 Arquivo inicial: {input_file}")
    print(f"📝 Arquivo de saída: {output_file}")
    
    # Analisa recursivamente
    analyzer.analyze_file(initial_path)
    
    print(f"\n{'='*70}")
    print(f"✅ Total de arquivos processados: {len(analyzer.visited_files)}")
    print(f"{'='*70}")
    
    # Lista todos os arquivos encontrados
    print(f"\n📋 Arquivos incluídos no MD:")
    for i, (file_path, _) in enumerate(analyzer.file_contents, 1):
        try:
            rel_path = file_path.relative_to(analyzer.project_root)
        except ValueError:
            rel_path = file_path
        print(f"  {i}. {rel_path}")
    
    # Gera o markdown
    analyzer.generate_markdown(output_file, input_file)
    print(f"\n💾 Documentação salva em: {output_file}\n")


if __name__ == "__main__":
    main()