(function(){
  // Workspace bridge: connects this embedded template to the workspace app.
  // Replaces the template's localStorage with the workspace's shared save,
  // and lets the app control theme and font. The template code is otherwise untouched.
  var I = window.__WS_INIT || {};
  function post(m){ m.__ws = 1; m.mod = I.mod; try { window.parent.postMessage(m, '*'); } catch(e){} }

  window.__bridge = {
    load: function(){ return I.data ? JSON.stringify(I.data) : null; },
    save: function(o){ post({ type:'save', data: JSON.parse(JSON.stringify(o)) }); }
  };

  function setFont(f){
    var s = document.getElementById('__ws_font');
    if(!s){ s = document.createElement('style'); s.id = '__ws_font'; (document.head || document.documentElement).appendChild(s); }
    s.textContent = 'body,body input,body textarea,body button,body select{font-family:' + f + ' !important}';
  }
  function setTheme(dark){
    try {
      if(I.mod === 'gantt'){ S.theme = dark ? 'dark' : 'light'; applyTheme(); }
      else if(I.mod === 'moodboard'){
        S.theme = dark ? 'dark' : 'light';
        document.body.classList.toggle('dark', dark);
        var l = document.getElementById('theme-lbl'); if(l) l.textContent = dark ? 'Light' : 'Dark';
        world.querySelectorAll('.card.nc').forEach(function(c){ applyNoteColor(c, parseInt(c.dataset.ci || '0')); });
        updateTransform();
      }
    } catch(e){}
  }

  setFont(I.font || 'inherit');
  window.addEventListener('message', function(e){
    var m = e.data; if(!m || !m.__wsParent) return;
    if(m.type === 'theme') setTheme(!!m.dark);
    if(m.type === 'font') setFont(m.font);
    // The app saved its own copy of a web picture: show the copy instead of the link.
    if(m.type === 'img-swap') document.querySelectorAll('img').forEach(function(i){ if(i.getAttribute('src') === m.from) i.setAttribute('src', m.to); });
    // The app couldn't get a picture from that address: drop a card that was just added, otherwise mark it.
    if(m.type === 'img-failed') document.querySelectorAll('.card img').forEach(function(i){
      if(i.getAttribute('src') !== m.from) return;
      var card = i.closest('.card');
      if(m.remove){ card.remove(); try { save(); } catch(e){} }
      else { card.classList.remove('ws-pending'); card.classList.add('ws-missing'); }
    });
  });
  document.addEventListener('DOMContentLoaded', function(){ setTheme(!!I.dark); });
  document.addEventListener('keydown', function(e){
    if((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S')){ e.preventDefault(); post({ type:'save-shortcut' }); }
  }, true);

  if(I.mod === 'moodboard'){
    // When a web picture doesn't load, the template would remove it from its card, and the next save
    // would then lose the picture for good. Catch the error first (this runs before the template's own
    // handler) and show "Getting picture…" while the app saves its own copy.
    var st = document.createElement('style');
    st.textContent = '.card.ws-pending img,.card.ws-missing img{visibility:hidden}'
      + '.card.ws-pending::after,.card.ws-missing::after{position:absolute;inset:0;display:grid;place-items:center;padding:12px;text-align:center;font-size:12px;line-height:1.4;color:#8a8a8a;pointer-events:none}'
      + '.card.ws-pending::after{content:"Getting picture…"}.card.ws-missing::after{content:"This picture couldn’t be loaded. Drag the file in again."}';
    (document.head || document.documentElement).appendChild(st);
    document.addEventListener('error', function(e){
      var t = e.target, card = t && t.tagName === 'IMG' && t.closest && t.closest('.card');
      if(!card) return;
      e.stopPropagation();
      var src = t.getAttribute('src') || '', web = /^https?:/i.test(src);
      if(!card.classList.contains('ws-missing')) card.classList.add(web ? 'ws-pending' : 'ws-missing');
    }, true);
    document.addEventListener('load', function(e){
      var t = e.target, card = t && t.tagName === 'IMG' && t.closest && t.closest('.card');
      if(card) card.classList.remove('ws-pending', 'ws-missing');
    }, true);
    function addFiles(files, pos){
      files.filter(function(f){ return f.type.indexOf('image/') === 0; }).forEach(function(f, i){
        var r = new FileReader();
        r.onload = function(ev){
          var o = { src: ev.target.result, w: 240, h: 200 };
          if(pos) o.pos = { x: pos.x + i * 30, y: pos.y + i * 30 };
          makeCard('image', o);
        };
        r.readAsDataURL(f);
      });
    }
    var fileIn = document.createElement('input');
    fileIn.type = 'file'; fileIn.accept = 'image/*'; fileIn.multiple = true; fileIn.style.display = 'none';
    fileIn.addEventListener('change', function(){
      var files = Array.prototype.slice.call(fileIn.files || []);
      var cancel = document.getElementById('img-cancel'); if(cancel) cancel.click();
      addFiles(files); fileIn.value = '';
    });
    document.addEventListener('DOMContentLoaded', function(){
      document.body.appendChild(fileIn);
      // "Upload from computer" inside the existing Add Image dialog
      var url = document.getElementById('img-url');
      if(url){
        var up = document.createElement('button');
        up.type = 'button'; up.className = 'mdbtn p'; up.textContent = 'Upload from computer…';
        up.style.cssText = 'width:100%;padding:10px;font-size:13px;margin-bottom:10px;display:block';
        up.addEventListener('click', function(){ fileIn.click(); });
        var tip = document.createElement('div');
        tip.textContent = 'Paste a picture’s address, or right-click a picture → Copy image and paste it in the box (Ctrl/⌘+V).';
        tip.style.cssText = 'font-size:11.5px;color:var(--muted);line-height:1.45;margin:10px 0 2px';
        url.parentNode.insertBefore(up, url);
        url.parentNode.insertBefore(tip, url.nextSibling);
        url.placeholder = 'Paste a copied picture or image address…';
        var err = document.createElement('div');
        err.style.cssText = 'display:none;font-size:12px;line-height:1.45;color:#E56458;background:rgba(229,100,88,.1);border-radius:7px;padding:8px 10px;margin-top:8px';
        url.parentNode.insertBefore(err, url.nextSibling);
        var showErr = function(t){ err.textContent = t; err.style.display = t ? 'block' : 'none'; };
        url.addEventListener('input', function(){ showErr(''); });
        // Paste the picture itself into the box
        url.addEventListener('paste', function(e){
          var files = Array.prototype.slice.call((e.clipboardData && e.clipboardData.files) || []).filter(function(f){ return f.type.indexOf('image/') === 0; });
          if(!files.length) return;
          e.preventDefault(); showErr('');
          var cancel = document.getElementById('img-cancel'); if(cancel) cancel.click();
          addFiles(files);
        });
        // Picture or page addresses (e.g. a Pinterest pin) go straight in: the app fetches and keeps its own copy.
        var modal = document.getElementById('img-modal');
        if(modal) new MutationObserver(function(){ if(!modal.classList.contains('open')) showErr(''); }).observe(modal, { attributes:true, attributeFilter:['class'] });
      }
    });
    // Tell the app which picture was clicked (for the image info panel)
    document.addEventListener('click', function(e){
      var c = e.target.closest && e.target.closest('.card');
      if(c && c.dataset.type === 'image'){ var img = c.querySelector('img'); post({ type:'img-select', src: img ? img.src : '' }); }
      else if(e.target.closest && e.target.closest('#canvas') && !e.target.closest('#toolbar,#zoom-ctrl')) post({ type:'img-select', src: null });
    }, true);
    // Paste images from the clipboard straight onto the board
    document.addEventListener('paste', function(e){
      if(e.target.matches && e.target.matches('input,textarea,[contenteditable]')) return;
      var files = (e.clipboardData && e.clipboardData.files) || [];
      for(var i = 0; i < files.length; i++){
        (function(f){
          if(f.type.indexOf('image/') !== 0) return;
          e.preventDefault();
          var r = new FileReader();
          r.onload = function(ev){ makeCard('image', { src: ev.target.result, w: 240, h: 200 }); };
          r.readAsDataURL(f);
        })(files[i]);
      }
    });
  }
})();
