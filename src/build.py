"""Builds index.html (the whole app in one file) from the files in src/.
Run from the repo root:  python3 src/build.py
"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FONT_LINK = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
             '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=IBM+Plex+Mono:wght@400;500;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap">')
read = lambda *p: open(os.path.join(HERE, *p), encoding='utf-8').read()
bridge, css, js = read('bridge.js'), read('app.css'), read('app.js')

def wire(src, set_call):
    """Swap the template's localStorage for the workspace bridge; inject bridge + small overrides."""
    assert src.count('localStorage') == 2, 'template storage calls changed'
    src = src.replace(set_call[0], set_call[1], 1).replace('localStorage.getItem(SK)', '__bridge.load()', 1)
    assert 'localStorage' not in src
    src = src.replace('</head>', FONT_LINK + '<style>#btn-theme,#theme-btn,#saved{display:none!important}</style></head>', 1)
    i = src.index('<script>')
    return src[:i] + '<script>window.__WS_INIT=/*__WS_INIT__*/null;</script><script>' + bridge + '</script>' + src[i:]

tpl = {
    'moodboard': wire(read('templates', 'moodboard.html'), ('localStorage.setItem(SK,JSON.stringify(data))', '__bridge.save(data)')),
    'gantt': wire(read('templates', 'gantt.html'), ('localStorage.setItem(SK,JSON.stringify(S))', '__bridge.save(S)')),
}
safe = lambda x: json.dumps(x, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
assert '</script' not in js.lower() and '</style' not in css.lower()

html = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<title>Design workspace</title>\n'
        '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E%F0%9F%93%90%3C/text%3E%3C/svg%3E">\n'
        + FONT_LINK + '\n<style id="app-css">' + css + '</style>\n</head>\n<body>\n<div id="app"></div>\n'
        '<script src="config.js"></script>\n'
        '<script type="application/json" id="tpl-data">' + safe(tpl) + '</script>\n'
        '<script id="app-js">' + js + '</script>\n</body>\n</html>\n')
open(os.path.join(ROOT, 'index.html'), 'w', encoding='utf-8').write(html)
print('built index.html', len(html.encode()) // 1024, 'KB')
