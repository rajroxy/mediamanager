/* media-import.js — Import button: left-click = audio, right-click = video */
(function(){
  function pick(kind){
    const isVid = kind === 'video';
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = isVid ? 'video/*' : 'audio/*';
    input.onchange = function(ev){
      const files = Array.prototype.slice.call(ev.target.files || []);
      if(!files.length) return;
      files.forEach(function(f){
        const url  = URL.createObjectURL(f);
        const name = f.name.replace(/\.[^.]+$/, '');
        if(isVid){
          if(typeof videoPlaylistAdd === 'function') videoPlaylistAdd(url, name, 'file', f.name);
          else S.config.videoPlaylist.push({ url:url, name:name, source:'file', added:Date.now() });
        } else {
          Music.playlist.push({ name:name, url:url, source:'file', mime:f.type });
          S.config.musicPlaylist = Music.playlist;
        }
      });
      save();
      if(typeof renderVideoPlaylist === 'function') renderVideoPlaylist();
      if(typeof renderMusicPlayer  === 'function') renderMusicPlayer();
      if(typeof renderMusicMini    === 'function') renderMusicMini();
      toast(files.length + (isVid ? ' video' : ' track') + (files.length > 1 ? 's' : '') + ' added');
      goPage('overview');          // jump to Manager so you see the new cards
    };
    input.click();
  }

  function grab(e){
    if(!e.target.closest || !e.target.closest('#floatingImport')) return;
    e.preventDefault();
    e.stopImmediatePropagation();   // app.js's own button handlers never run
    pick(e.type === 'contextmenu' ? 'video' : 'audio');
  }

  window.addEventListener('click',       grab, true);
  window.addEventListener('contextmenu', grab, true);

  console.log('✓ media-import.js loaded');
})();
