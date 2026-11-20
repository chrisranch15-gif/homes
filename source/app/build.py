import sys
url = sys.argv[1] if len(sys.argv) > 1 else '__ARTIFACT_URL__'
css = open('src/styles.css').read()
js = [open('vendor/node_modules/qrcode-generator/qrcode.js').read(), open('src/engine.js').read(), open('src/tests.js').read(), open('src/app.js').read().replace('/* ---------- start ---------- */', open('src/extras.js').read() + '\n/* ---------- start ---------- */').replace('__ARTIFACT_URL__', url)]
html = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>19917 145th St E · Tehaleh</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Inter:wght@300;400;500;600&family=Cormorant+Garamond:wght@400;500&family=Manrope:wght@400;500&display=swap" rel="stylesheet">
<style>{css}</style></head>
<body><main id="app" aria-live="polite"></main>
''' + ''.join(f'<script>\n{j}\n</script>\n' for j in js) + '</body></html>'
open('index.html','w').write(html)
print(len(html))
