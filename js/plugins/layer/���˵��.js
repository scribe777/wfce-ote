/**
 * editor_plugin_src.js
 *
 * Copyright 2009, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 * Contributing: http://tinymce.moxiecode.com/contributing
 */

(function() {
	tinymce.create('tinymce.plugins.Layer', {
	
		//初始化，只执行1次
		init : function(ed, url) {
			var t = this;
			t.editor = ed;
			
			// Register commands 注册这个插件使用命令，和这个类的函数相连,然后可以通过execCommand或 cmd: 调用
			ed.addCommand('mceInsertLayer', t._insertLayer, t);
			ed.addCommand('mceMoveForward', function() {
				t._move(1);
			});
			ed.addCommand('mceMoveBackward', function() {
				t._move(-1);
			});
			ed.addCommand('mceMakeAbsolute', function() {
				t._toggleAbsolute();
			});

			// Register buttons  注册按钮，使用上面的命令 layer.forward_desc 是在总的语言文件.js里面的定义
			ed.addButton('moveforward', {title : 'layer.forward_desc', cmd : 'mceMoveForward'});
			ed.addButton('movebackward', {title : 'layer.backward_desc', cmd : 'mceMoveBackward'});
			ed.addButton('absolute', {title : 'layer.absolute_desc', cmd : 'mceMakeAbsolute'});
			ed.addButton('insertlayer', {title : 'layer.insertlayer_desc', cmd : 'mceInsertLayer'});
		
			//本插件初始化话完成后 执行
			ed.onInit.add(function() {
				if (tinymce.isIE)
					ed.getDoc().execCommand('2D-Position', false, true);
			});

			ed.onNodeChange.add(t._nodeChange, t);
			ed.onVisualAid.add(t._visualAid, t);
		},

		getInfo : function() {
			return {
				longname : 'Layer',
				author : 'Moxiecode Systems AB',
				authorurl : 'http://tinymce.moxiecode.com',
				infourl : 'http://wiki.moxiecode.com/index.php/TinyMCE:Plugins/layer',
				version : tinymce.majorVersion + "." + tinymce.minorVersion
			};
		},

		// Private methods

		_nodeChange : function(ed, cm, n) {
			var le, p;

			le = this._getParentLayer(n);
			p = ed.dom.getParent(n, 'DIV,P,IMG');

			if (!p) {
				cm.setDisabled('absolute', 1);
				cm.setDisabled('moveforward', 1);
				cm.setDisabled('movebackward', 1);
			} else {
				cm.setDisabled('absolute', 0);
				cm.setDisabled('moveforward', !le);
				cm.setDisabled('movebackward', !le);
				cm.setActive('absolute', le && le.style.position.toLowerCase() == "absolute");
			}
		},

		// Private methods

		_visualAid : function(ed, e, s) {
			var dom = ed.dom;

			tinymce.each(dom.select('div,p', e), function(e) {
				if (/^(absolute|relative|static)$/i.test(e.style.position)) {
					if (s)
						dom.addClass(e, 'mceItemVisualAid');
					else
						dom.removeClass(e, 'mceItemVisualAid');	
				}
			});
		},

		_move : function(d) {
			var ed = this.editor, i, z = [], le = this._getParentLayer(ed.selection.getNode()), ci = -1, fi = -1, nl;

			nl = [];
			tinymce.walk(ed.getBody(), function(n) {
				if (n.nodeType == 1 && /^(absolute|relative|static)$/i.test(n.style.position))
					nl.push(n); 
			}, 'childNodes');

			// Find z-indexes
			for (i=0; i<nl.length; i++) {
				z[i] = nl[i].style.zIndex ? parseInt(nl[i].style.zIndex) : 0;

				if (ci < 0 && nl[i] == le)
					ci = i;
			}

			if (d < 0) {
				// Move back

				// Try find a lower one
				for (i=0; i<z.length; i++) {
					if (z[i] < z[ci]) {
						fi = i;
						break;
					}
				}

				if (fi > -1) {
					nl[ci].style.zIndex = z[fi];
					nl[fi].style.zIndex = z[ci];
				} else {
					if (z[ci] > 0)
						nl[ci].style.zIndex = z[ci] - 1;
				}
			} else {
				// Move forward

				// Try find a higher one
				for (i=0; i<z.length; i++) {
					if (z[i] > z[ci]) {
						fi = i;
						break;
					}
				}

				if (fi > -1) {
					nl[ci].style.zIndex = z[fi];
					nl[fi].style.zIndex = z[ci];
				} else
					nl[ci].style.zIndex = z[ci] + 1;
			}

			ed.execCommand('mceRepaint');
		},

		_getParentLayer : function(n) {
			return this.editor.dom.getParent(n, function(n) {
				return n.nodeType == 1 && /^(absolute|relative|static)$/i.test(n.style.position);
			});
		},

		_insertLayer : function() {
			var ed = this.editor, p = ed.dom.getPos(ed.dom.getParent(ed.selection.getNode(), '*'));

			ed.dom.add(ed.getBody(), 'div', {
				style : {
					position : 'absolute',
					left : p.x,
					top : (p.y > 20 ? p.y : 20),
					width : 100,
					height : 100
				},
				'class' : 'mceItemVisualAid'
			}, ed.selection.getContent() || ed.getLang('layer.content'));
		},

		_toggleAbsolute : function() {
			var ed = this.editor, le = this._getParentLayer(ed.selection.getNode());

			if (!le)
				le = ed.dom.getParent(ed.selection.getNode(), 'DIV,P,IMG');

			if (le) {
				if (le.style.position.toLowerCase() == "absolute") {
					ed.dom.setStyles(le, {
						position : '',
						left : '',
						top : '',
						width : '',
						height : ''
					});

					ed.dom.removeClass(le, 'mceItemVisualAid');
				} else {
					if (le.style.left == "")
						le.style.left = 20 + 'px';

					if (le.style.top == "")
						le.style.top = 20 + 'px';

					if (le.style.width == "")
						le.style.width = le.width ? (le.width + 'px') : '100px';

					if (le.style.height == "")
						le.style.height = le.height ? (le.height + 'px') : '100px';

					le.style.position = "absolute";
					ed.addVisual(ed.getBody());
				}

				ed.execCommand('mceRepaint');
				ed.nodeChanged();
			}
		}
	});

	// Register plugin
	tinymce.PluginManager.add('layer', tinymce.plugins.Layer);
})();