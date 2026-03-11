import sys

with open(r'c:\Users\WitronVentas\Desktop\Aplicaciones\Alex\edge-reportes\features\resultados\components\file-upload-panel.tsx', 'rb') as f:
    content = f.read()

try:
    content.decode('utf-8')
    print("Success: File is valid UTF-8")
except UnicodeDecodeError as e:
    print(f"Error: {e}")
    print(f"Byte at index {e.start}: {hex(content[e.start])}")
    # Show some context
    start = max(0, e.start - 20)
    end = min(len(content), e.start + 20)
    print(f"Context (bytes): {content[start:end]}")
