import os

OUTPUT_FILE = "src_files.md"
SRC_DIR = "src"

def collect_ts_files(src_dir):
    """Percorre recursivamente e coleta todos os arquivos .ts ou .tsx."""
    ts_files = []
    for root, _, files in os.walk(src_dir):
        for file in files:
            if file.endswith((".ts", ".tsx")):
                full_path = os.path.join(root, file)
                ts_files.append(full_path)
    return ts_files

def generate_markdown(ts_files):
    """Gera o conteúdo Markdown a partir dos arquivos TypeScript."""
    md_blocks = []
    for path in ts_files:
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if not content:
                    continue  # ignora arquivos vazios

                rel_path = os.path.relpath(path, os.getcwd())
                block = f"# {rel_path}\n\n\"\"\"\n{content}\n\"\"\"\n"
                md_blocks.append(block)
        except Exception as e:
            print(f"⚠️ Erro ao ler {path}: {e}")

    return "\n".join(md_blocks)

def main():
    ts_files = collect_ts_files(SRC_DIR)
    markdown_content = generate_markdown(ts_files)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        out.write(markdown_content)

    print(f"✅ Arquivo '{OUTPUT_FILE}' gerado com sucesso ({len(ts_files)} arquivos verificados).")

if __name__ == "__main__":
    main()
