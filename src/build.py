"""Builds index.html (the whole app in one file) from src/app.css and src/app.js.
Run from the repo root:  python3 src/build.py
"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
read = lambda *p: open(os.path.join(HERE, *p), encoding='utf-8').read()
css, js = read('app.css'), read('app.js')
assert '</script' not in js.lower() and '</style' not in css.lower()
html = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<title>Anium.planning</title>\n'
        '<meta name="description" content="Plan your day hour by hour, keep a timeline of every task, and see what you got done.">\n'
        '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E%F0%9F%93%90%3C/text%3E%3C/svg%3E">\n'
        '<style>' + css + '</style>\n</head>\n<body>\n<div id="app"></div>\n'
        '<script>' + js + '</script>\n</body>\n</html>\n')
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(html)
print('built index.html', len(html.encode()) // 1024, 'KB')
