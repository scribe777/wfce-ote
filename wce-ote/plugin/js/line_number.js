/**
 * plugin.js
 *
 * Released under LGPL License.
 * Copyright (c) 1999-2015 Ephox Corp. All rights reserved
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/*global tinymce:true */

tinymce.PluginManager.add('wcelinenumber', function(ed) {
	var lineheight = 0;
	var sidebar;

	function _initSidebar() {
		var ct = ed.getContentAreaContainer();
		ct.style.display = "flex";
		var iframe = ct.childNodes[0];
		var bd = ed.dom.select('body');
		var fontsize = parseInt($(bd).css('font-size'));
		lineheight = fontsize * 1.6;
		sidebar = document.createElement("div");
		sidebar.classList.add("wce-linenumber-sidebar");
		sidebar.style.width = "30px";
		sidebar.style.borderRight = "1px solid #aaa";
		sidebar.style.backgroundColor = "rgb(223, 234, 223)";
		sidebar.style.position = "relative";
		sidebar.style.overflow = "hidden";
		ct.insertBefore(sidebar, iframe);
		$(ed.getWin()).scroll(function(e) {
			_drawLineNumber();
		});
		$(ed.getWin()).resize(function() {
			_drawLineNumber();
		});
		ed.on("ResizeEditor", function(e) {
			iframe.style.height = null;
		});

		ed.on('change', function() {
			_drawLineNumber();
		});
		ed.on('keyup', function() {
			_drawLineNumber();
		});
		ed.on('setContent', function() {
			_drawLineNumber();
		});
	}

	ed.addCommand('wceShowLineNumber', function(b) {
		if(!sidebar) {
			_initSidebar();
		}
		sidebar.style.display = b ? 'block' : 'none';
	});

	function getType(node) {
		var wceAttr = node.getAttribute('wce');
		if(wceAttr) {
			var arr = wceAttr.split('&');
			for(var i = 0, ai; i < arr.length; i++) {
				ai = arr[i];
				if(ai && ai.indexOf('break_type=') > -1) {
					return ai.replace('break_type=', '');
				}
			}
		}
	}

	function _drawLineNumber() {
		var i = 1;
		$(sidebar).empty();
		var scrollY = ed.getWin().scrollY;
		var bottom = 0;
		var spans = ed.dom.select('span.brea');
		var list = [];

		spans.forEach(function(n) {
			var ty = getType(n);
			if(ty == 'lb') {
				var end = n.querySelector('.format_end');
				var y = $(end).offset().top - 0 + lineheight / 4 - scrollY;
				var div = document.createElement('div');
				div.innerHTML = i;
				div.style.position = "absolute";
				div.style.width = "100%";
				div.style.textAlign = "center";
				div.style.top = y + 'px';
				sidebar.appendChild(div);
				bottom = y;
				i++;

			} else if(ty) {
				i = 1;
			}
		});
	}
});