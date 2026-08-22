(function(){
  function fixBanners(){
    document.querySelectorAll('.banner-slices').forEach(function(b){
      b.style.setProperty('display','flex','important');
      b.style.setProperty('width','100%','important');
      b.style.setProperty('aspect-ratio','auto','important');
      b.style.setProperty('background','none','important');
      b.style.setProperty('overflow','hidden','important');
      b.style.setProperty('line-height','0','important');
      var imgs=b.querySelectorAll('img');
      imgs.forEach(function(img){
        img.style.setProperty('display','block','important');
        img.style.setProperty('width',(100/imgs.length)+'%','important');
        img.style.setProperty('height','auto','important');
        img.style.setProperty('flex','0 0 '+(100/imgs.length)+'%','important');
        img.style.setProperty('margin','0','important');
        img.style.setProperty('padding','0','important');
        img.style.setProperty('border','0','important');
      });
    });
    document.querySelectorAll('.jst-banner-slices').forEach(function(b){
      b.style.setProperty('display','flex','important');
      b.style.setProperty('width','100%','important');
      b.style.setProperty('aspect-ratio','auto','important');
      b.style.setProperty('background','none','important');
      b.style.setProperty('overflow','hidden','important');
      b.style.setProperty('line-height','0','important');
      var imgs=b.querySelectorAll('img');
      imgs.forEach(function(img){
        img.style.setProperty('display','block','important');
        img.style.setProperty('width',(100/imgs.length)+'%','important');
        img.style.setProperty('height','auto','important');
        img.style.setProperty('flex','0 0 '+(100/imgs.length)+'%','important');
        img.style.setProperty('margin','0','important');
        img.style.setProperty('padding','0','important');
        img.style.setProperty('border','0','important');
      });
    });
  }
  fixBanners();
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fixBanners);
  var me=document.currentScript && document.currentScript.src;
  var core=document.createElement('script');
  core.src=me?me.replace(/app\.js(?:\?.*)?$/,'app-core.js'):'assets/app-core.js';
  document.head.appendChild(core);
})();
