after upgrade, replace/copy the following files/dir

..\themes\advanced\charmap.htm
..\themes\advanced\charmap.js

..\langs
..\themes\advanced\langs
..\plugins\wce
..\themes\advanced\skins\wce


bug in ie: tiny_mce_src.js 
at events[id][evt.type].nativeHandler(evt);
add: var ttt=events[id][evt.type];if(!ttt) return;



add in tiny_mce_src.js
function removeFormat(...){
...
node.removeAttribute('wce');
node.removeAttribute('wce_orig');//todo: replace content with wce_orig
...

}