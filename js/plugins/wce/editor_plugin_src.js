/**
 * editor_plugin_src.js
 * 
 * Copyright 2009, Moxiecode Systems AB Released under LGPL License.
 * 
 * License: http://tinymce.moxiecode.com/license Contributing:
 * http://tinymce.moxiecode.com/contributing
 */

(function() {
	// Load plugin specific language pack
	tinymce.PluginManager.requireLangPack('wce');

	tinymce.create('tinymce.plugins.wcePlugin', {

		// Ueberpruefen, ob ausgewaehlter Text in Note ist
		_contentHasWceClass : function(ed, arr) {
			var se = ed.selection;
			var p, v;

			for ( var i = 0; i < arr.length; i++) {
				v = arr[i];
				p = new RegExp("__t=" + v, "g");

				if (se.getContent().match(p)) {
					return 1;
				}

				// Auswahl in note
				var node = se.getNode();
				if (typeof node != ' undefined' && typeof (node.className) != 'undefined' && node.className.match(p)) {
					return 1;
				}
			}
			return 0;
		},

		_setWceControls : function() {
			var ed = this;
			var _dirty = ed.isDirty();
			var hasVerse = ed.execCommand('wceContentHasVerse');
			if (_dirty) {
				ed.isNotDirty = 0;
			} else {
				ed.isNotDirty = 1;
			}
			var isc = ed.selection.isCollapsed();

			tinymce.each(ed.controlManager.controls, function(c) {
				if (c.id == ed.id + '_removeformat' && (hasVerse == 1 || isc))
					c.setDisabled(true);
				else
					c.setDisabled(false);
			});
		},
		
		
		_inClass: function(n, pattern){		
			if(typeof n=='undefined' || n==null ||typeof n.nodeName=='undefined' || n.nodeName=='' || n.nodeName.match(/body/i)) return false; 
		    
			var className=n.className;
			
			if(typeof className!='undefined' && className!=null && className!='' && className.match(pattern)) {
				return true;
			}else{
				return this._inClass(n.parentNode,pattern);
			} 	 
		},

		// ausgewaehlter Text automatisch filtern,
		// ergibt nur ein gueltiger Auswahlbereich
		_adaptiveSelection : function() {
			var _this = this;
			var ed = _this.editor;

			var _adaptive = tinymce.DOM.get(ed.id + '_adaptive_selection');
			if (typeof _adaptive != 'undefined' && !_adaptive.checked) {
				return;
			}

			if (ed.selection.isCollapsed())
				return;

			// Forces a compatible W3C range on IE.
			var rng = ed.selection.getRng(true);

			// Start
			var s_node = rng.startContainer;
			var s_text = s_node.data ? s_node.data : s_node.innerText;
			var s_index = rng.startOffset;

			// End
			var e_node = rng.endContainer;
			var e_text = e_node.data ? e_node.data : e_node.innerText;
			var e_index = rng.endOffset;

			// nach setRng wird editor unter firefox nicht aktualisiert. Bug
			// von Firefox?
			if (!$.browser.msie) {
				ed.selection.select(s_node);
			}

			/*
			 * if( arguments[1]){ //isDoubleClick s_index =
			 * _getStartNoBlank(s_text, s_index); e_index = _getNextEnd(s_text,
			 * s_index); rng.setStart(s_node, s_index); rng.setEnd(s_node,
			 * e_index); ed.selection.setRng(rng); return; }
			 */
			 
			 
			 //testen, ob verse_number oder chapter_number ausgewählt
			 var s_verse=_this._inClass(s_node,/verse_number/i);  
			 var e_verse=_this._inClass(e_node,/verse_number/i);
			 if(s_verse && !e_verse){
				//select e_node
				s_index = _this._getStartNoBlank(e_text, 0);
				e_index = _this._getEndNoBlank(e_text, e_index);
				rng.setStart(e_node, s_index);
				rng.setEnd(e_node, e_index);
				ed.selection.setRng(rng);
				return;
			 }else if(!s_verse && e_verse){
				//select s_node
				s_index = _this._getStartNoBlank(s_text, s_index);
				e_index = _this._getEndNoBlank(s_text, s_text.length);
				rng.setStart(s_node, s_index);
				rng.setEnd(s_node, e_index);
				ed.selection.setRng(rng);
				return; 
			 }else if(s_verse && e_verse) {
				rng.setStart(s_node, 0);
				rng.setEnd(s_node, 0);
				ed.selection.setRng(rng);	
				return;
			 }
			 

			// wenn s_node und e_node selbe Node sind
			if (s_node == e_node) {
				s_index = _this._getStartNoBlank(s_text, s_index);
				e_index = _this._getEndNoBlank(e_text, e_index);

				if (s_index < 0 || e_index < 0) {
					s_index = 0;
					e_index = 0;
				}
				if (s_index >= e_index) {
					e_index = s_index;
				}
				rng.setStart(s_node, s_index);
				rng.setEnd(e_node, e_index);
				ed.selection.setRng(rng);
				return;
			}

			// wenn s_node und e_node selbe Parent haben
			if (s_node.parentNode == e_node.parentNode) {
				s_index = _this._getStartNoBlank(s_text, s_index);
				e_index = _this._getEndNoBlank(e_text, e_index);

				if (s_index < 0) {
					s_index = 0;
				}
				if (e_index < 0) {
					//e_index = 0;
					e_index = _this._getEndNoBlank(s_text, s_text.length);
					e_node=s_node;
				}
				rng.setStart(s_node, s_index);
				rng.setEnd(e_node, e_index);
				ed.selection.setRng(rng);
				return;
			}

			// wenn s_node und e_node kein selbe parentNode haben, dann neue
			// Start /Ende Node suchen
			var n1 = s_node;
			var n2 = e_node;
			var p1, p2; // parent Node
			for (p1 = s_node.parentNode; typeof p1 != 'undefined' && !n1.nodeName.match(/body/i) && p1 != null; p1 = p1.parentNode) {
				if (p1 === p2)
					break;
				for (p2 = e_node.parentNode; typeof p2 != 'undefined' && !n2.nodeName.match(/body/i) && p2 != null; p2 = p2.parentNode) {
					if (p1 === p2 || p2.nodeName.match(/body/i))
						break;
					n2 = p2;
				}
				if (p1 === p2 || p1.nodeName.match(/body/i))
					break;
				n1 = p1;
			}
			var b1 = false;
			if (!n1.nodeName.match(/text/i) && !n1.nodeName.match(/body/i)) {
				b1 = true;
			}
			var b2 = false;
			if (!n2.nodeName.match(/text/i) && !n2.nodeName.match(/body/i)) {
				b2 = true;
			}

			if (b1 && b2) {
				ed.selection.select(n2);
				var rng2 = ed.selection.getRng(true);
				rng2.setStart(n1, 0);
				ed.selection.setRng(rng2);
				return;
			} else if (b1 && !b2) {
				ed.selection.select(n1);
				return;
			} else if (!b1 && b2) {
				ed.selection.select(n2);
				return;
			} else {
				rng.setEnd(s_node, 0);
				ed.selection.setRng(rng);
			}
		},

		_wceParamsToArray : function(str) {
			var a = [];
			var ar = str.split('&');
			var k, v, kv;
			for ( var i = 0; i < ar.length; i++) {
				kv = ar[i].split('=');
				k = kv[0];
				v = kv[1];
				a[k] = decodeURIComponent(v);
			}
			return a;
		},

		_showWceInfo : function(ed, e) {
			var info_box = ed.wceInfoBox;
			var sele_node = e.target;
			var wce_class_name = sele_node.className;
			var _dirty = ed.isDirty();

			var type_to_show = [ 'note', 'corr' ]; // TODO

			var info_arr;
			if (wce_class_name != '') {
				info_arr = wce_class_name.split('@');
			}
			if (info_arr != null && info_arr.length > 0 && wce_class_name.indexOf(ed.wceTypeParamInClass + '=') > -1) {
				var ar;
				var corr_str = '';
				var note_str = '';
				var paratext_str = '';
				var k, v, kv, kv_ar;
				for ( var i = 0; i < info_arr.length; i++) {
					ar = this._wceParamsToArray(info_arr[i]);
					var type_name = ar[ed.wceTypeParamInClass];

					switch (type_name) {
					case 'note':
						note_str += ar['note_text'];
						break;
					case 'corr':
						corr_str += '<div style="margin-top:5px">' + ar[ed.wceNameParamInClass] + ': ';
						if (ar['blank_correction'] == 'blank_correction')
							corr_str+= 'deleted';
						else
							corr_str+= ar['corrector_text'];
						corr_str+= '</div>';
						break;
					case 'paratext':
						paratext_str = '<div>' + 'Paratext type: ';
						switch (ar['fw_type'])
						{
						case 'num_chapternumber':
							paratext_str += 'Chapter number';
							break;
						case 'fw_chapertitle':
							paratext_str += 'Chapter title';
							break;
						case 'fw_colophon':
							paratext_str += 'Colophon';
							break;
						case 'num_quiresig':
							paratext_str += 'Quire signature';
							break;
						case 'num_ammonian':
							paratext_str += 'Ammonian section';
							break;
						case 'num_eusebian':
							paratext_str += 'Eusebian canon';
							break;
						case 'fw_euthaliana':
							paratext_str += 'Euthaliana';
							break;
						case 'fw_gloss':
							paratext_str += 'Gloss';
							break;
						case 'fw_lecttitle':
							paratext_str += 'Lectionary title';
							break;
						}
						paratext_str += '</div>';
						paratext_str += '<div style="margin-top:10px">Value: ' + ar['type_text'] + '</div>';
						paratext_str += '<div style="margin-top:10px">Position: ' + ar['paratext_position'] + '</div>';
						paratext_str += '<div style="margin-top:10px">Alignment: ' + ar['paratext_alignment'] + '</div>';
						break;
					case 'gap':
						if (ar['unit'] == '' && ar['gap_reason'] == '') {
							gap_str = 'No information about the reason and extension of the gap available';
							break;
						}	
						var gap_str = '<div>' + 'Reason:' + ar['gap_reason'] + '</div>';
						if (ar['extent'] != '')
						{
							gap_str += '<div>' + 'Extent: ' + ar['extent'] + ' ' + ar['unit'] + '(s)</div>';
						}
						if (ar['mark_as_supplied'] == 'supplied')
						{
							gap_str += '<div>' + 'Supplied source: ' + ar['supplied_source'] + '</div>';
						}
						break;

					default:
						info_text = wce_class_name;
						break;
					}

				}

				if (corr_str != '') {
					corr_str = '*: ' + $(sele_node).html() + corr_str;
				}

				if (type_name == 'paratext') {
					info_text = paratext_str;
				} else if (type_name == 'gap') {
					info_text = gap_str;
				} else {
					info_text = corr_str + note_str;
				}

				// information display
				if (info_text != '') {
					tinymce.DOM.setStyles(info_box, {
						'top' : e.clientY + 80,
						'left' : e.clientX + 80
					});
					info_box.innerHTML = '<div style="background-color: #eee; white-space:normal; padding:10px;border: 1px solid #ff0000">' + info_text + '</div>';
					$(info_box).show();
				}
			} else {
				$(info_box).hide();
			}
			// set isNotDirty back
			if (_dirty)
				ed.isNotDirty = 0;
			else
				ed.isNotDirty = 1;
		},

		_getWceMenuValStatus : function(_type, p) {
			var ed = tinyMCE.activeEditor;
			var _dirty = ed.isDirty();
			if (ed.execCommand('wceContentHasVerse'))
				return true;

			if (_dirty) {
				ed.isNotDirty = 0;
			} else {
				ed.isNotDirty = 1;
			}

			var se = ed.selection;
			var col = se.isCollapsed();

			var el = se.getNode() || ed.getBody();

			var className = $(el).attr('class');

			if (typeof className != 'undefined') {
				switch (_type) {
				case 'add':
					if (p == '/^_t=paratext/' && !col) {
						return true;
					}

					if (className.match(/_t=/))
						return true;
					else
						return false;
					break;

				case 'edit':
					if (className.match(p))
						return false;
					else
						return true;
					break;

				case 'delete':
					if (className.match(p))
						return false;
					else
						return true;
					break;
				}

			} else if (_type == 'edit' || _type == 'delete') {
				return true;
			}

			return false;
		},

		_setWceMenuStatus : function(ed, menuId, pattern, f, unterMenuId) {
			var control = ed.controlManager.controls[ed.id + '_' + menuId];
			var item;

			if (ed.execCommand('wceContentHasVerse') == 1) {
				control.setDisabled(true);
				return;
			}

			if (typeof pattern == 'undefined')
				return;

			if (control.isMenuRendered) {

				if (typeof unterMenuId == 'undefined' || unterMenuId == null) {
					item = control.menu.items[menuId + '-add'];
				} else {
					item = control.menu.items[menuId + '-' + unterMenuId].items[menuId + '-' + unterMenuId + '-add'];
				}

				if (f('add', pattern)) {
					item.setDisabled(true);
				} else
					item.setDisabled(false);

				if (typeof unterMenuId == 'undefined' || unterMenuId == null) {
					item = control.menu.items[menuId + '-edit'];
				} else {
					item = control.menu.items[menuId + '-' + unterMenuId].items[menuId + '-' + unterMenuId + '-edit'];
				}
				if (f('edit', pattern)) {
					item.setDisabled(true);
				} else
					item.setDisabled(false);

				if (typeof unterMenuId == 'undefined' || unterMenuId == null) {
					item = control.menu.items[menuId + '-delete'];
				} else {
					item = control.menu.items[menuId + '-' + unterMenuId].items[menuId + '-' + unterMenuId + '-delete'];
				}
				if (f('delete', pattern)) {
					item.setDisabled(true);
				} else
					item.setDisabled(false);
			}
		},

		createControl : function(n, cm) {
			var _getWceMenuValStatus = this._getWceMenuValStatus;
			var _setWceMenuStatus = this._setWceMenuStatus;
			switch (n) {

			case 'breaks':
				var c = cm.createMenuButton('menu-break', {
					title : 'Breaks',
					image : './js/plugins/wce/img/button_B.gif',
					onclick : function() {
						_setWceMenuStatus(tinyMCE.activeEditor, 'menu-break', /^__t=brea/, _getWceMenuValStatus);
					}
				});

				c.onRenderMenu.add(function(c, m) {
					var pattern = /^__t=brea/;
					var b = _getWceMenuValStatus('add', pattern);

					m.add({
						title : 'add',
						id : 'menu-break-add',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAddBreak');
						}
					}).setDisabled(b);

					b = _getWceMenuValStatus('edit', pattern);
					m.add({
						title : 'edit',
						id : 'menu-break-edit',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceEditBreak');
						}
					}).setDisabled(b);

					b = _getWceMenuValStatus('delete', pattern);
					m.add({
						title : 'delete',
						id : 'menu-break-delete',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('wceDelNode');
						}
					}).setDisabled(b);
				});

				return c;

			case 'correction':
				var c = cm.createButton('menu-correction', {
					title : 'Corrections',
					image : './js/plugins/wce/img/button_C.gif',
					onclick : function() {
						tinyMCE.activeEditor.execCommand('mceAddCorrection');
					}
				});

				return c;

			case 'illegible':
				var c = cm.createMenuButton('menu-illegable', {
					title : 'Deficiency',
					image : './js/plugins/wce/img/button_D.gif',
					onclick : function() {
						_setWceMenuStatus(tinyMCE.activeEditor, 'menu-illegable', /^__t=unclear/, _getWceMenuValStatus, 'uncleartext');
						//_setWceMenuStatus(tinyMCE.activeEditor, //'menu-illegable', /^__t=supplied/, //_getWceMenuValStatus, 'supplied');
						_setWceMenuStatus(tinyMCE.activeEditor, 'menu-illegable', /^__t=gap/, _getWceMenuValStatus, 'lacuna');
					}
				});

				c.onRenderMenu.add(function(c, m) {
					var sub, pattern, b;

					// Uncertain Letters
					sub = m.addMenu({
						title : 'Uncertain Letters',
						id : 'menu-illegable-uncleartext'
					});

					pattern = /^__t=unclear/;
					b = _getWceMenuValStatus('add', pattern);
					sub.add({
						title : 'add',
						id : 'menu-illegable-uncleartext-add',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAddUnclearText');
						}
					}).setDisabled(b);

					b = _getWceMenuValStatus('edit', pattern);
					sub.add({
						title : 'edit',
						id : 'menu-illegable-uncleartext-edit',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceEditUnclearText');
						}
					}).setDisabled(b);

					b = _getWceMenuValStatus('delete', pattern);
					sub.add({
						title : 'delete',
						id : 'menu-illegable-uncleartext-delete',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('wceDelNode');
						}
					}).setDisabled(b);

					// supplied
					/*pattern = /^__t=supplied/;
					sub = m.addMenu({
						title : 'Mark text as supplied',
						id : 'menu-illegable-supplied'
					});

					b = _getWceMenuValStatus('add', pattern);
					sub.add({
						title : 'add',
						id : 'menu-illegable-supplied-add',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAddSuppliedText');
						}
					}).setDisabled(b);

					b = _getWceMenuValStatus('edit', pattern);
					sub.add({
						title : 'edit',
						id : 'menu-illegable-supplied-edit',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceEditSuppliedText');
						}
					}).setDisabled(b);

					b = _getWceMenuValStatus('delete', pattern);
					sub.add({
						title : 'delete',
						id : 'menu-illegable-supplied-delete',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('wceDelNode');
						}
					}).setDisabled(b);*/

					// lacuna
					pattern = /^__t=gap/;
					sub = m.addMenu({
						title : 'Gap',
						id : 'menu-illegable-lacuna'
					});

					b = _getWceMenuValStatus('add', pattern);
					sub.add({
						title : 'add',
						id : 'menu-illegable-lacuna-add',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAddGap');
						}
					}).setDisabled(b);

					b = _getWceMenuValStatus('edit', pattern);
					sub.add({
						title : 'edit',
						id : 'menu-illegable-lacuna-edit',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceEditGap');
						}
					}).setDisabled(b);

					b = _getWceMenuValStatus('delete', pattern);
					sub.add({
						title : 'delete',
						id : 'menu-illegable-lacuna-delete',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('wceDelNode');
						}
					}).setDisabled(b);

				});

				// Return the new menu button instance
				return c;

			case 'decoration':
				var c = cm.createMenuButton('menu-decoration', {
					title : 'Ornamentation',
					image : './js/plugins/wce/img/button_O.gif',
					onclick : function() {
						_setWceMenuStatus(tinyMCE.activeEditor, 'menu-decoration');
						_setWceMenuStatus(tinyMCE.activeEditor, 'menu-decoration', /^__t=spaces/, _getWceMenuValStatus, 'blankspaces');
					}
				});

				c.onRenderMenu.add(function(c, m) {
					var sub;

					sub = m.addMenu({
						title : 'Highlight Text',
						image : './js/plugins/wce/img/button_O.gif'
					});

					sub.add({
						title : 'Rubrication',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_formatting', 'rubrication');
						}
					});

					sub.add({
						title : 'Gold',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_formatting', 'gold_ink');
						}
					});

					sub.add({
						title : 'Other colour',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceInsertContent', false, '');
						}
					});

					sub.add({
						title : 'Overline',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_formatting', 'overline');
						}
					});

					sub.add({
						title : 'Capitals',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_formatting', 'capitals');
						}
					});

					sub = m.addMenu({
						title : 'Insert special characters'
					});

					sub.add({
						title : '\u203B	(cross with dots)',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_pc', '\u203B');
						}
					});
					
					sub.add({
						title : '&gt;	(diple)',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_pc', '&gt;');
						}
					});
					
					sub.add({
						title : '\u2020	(obelus)',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_pc', '\u2020');
						}
					});

					sub.add({
						title : '\u00B6	(paragraphus)',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_pc', '\u00B6');
						}
					});

					sub.add({
						title : '\u03A1\u0336	(staurogram)',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_pc', '\u03A1\u0336');
						}
					});

					sub = m.addMenu({
						title : 'Add punctuation'
					});

					sub.add({
						title : ': (colon)',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_pc', ':');
						}
					});

					sub.add({
						title : ', (comma)',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_pc', ',');
						}
					});
					
					sub.add({
						title : '. (full stop)',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_pc', '.');
						}
					});

					sub.add({
						title : '\u0387 (Greek Ano Teleia)',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_pc', '\u0387');
						}
					});
					
					sub.add({
						title : '\u037E (Greek question mark)',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_pc', '\u037E');
						}
					});

					sub.add({
						title : '\u02D9 (high dot)',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_pc', '\u02D9');
						}
					});

					sub.add({
						title : '\u0387 (middle dot)',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_pc', '\u0387');
						}
					});

					sub.add({
						title : '\u02BC (modifier letter apostophe)',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_pc', '\u02BC');
						}
					});

					sub.add({
						title : '? (question mark)',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_pc', '?');
						}
					});					

					sub.add({
						title : '; (semicolon)',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_pc', '&semicolon;');
						}
					});

					sub = m.addMenu({
						title : 'Add blank spaces',
						id : 'menu-decoration-blankspaces',
						onclick : function() {

						}
					});

					var pattern = /^__t=spaces/;
					var b = _getWceMenuValStatus('add', pattern);
					sub.add({
						title : 'add',
						id : 'menu-decoration-blankspaces-add',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAddSpaces');
						}
					}).setDisabled(b);

					b = _getWceMenuValStatus('edit', pattern);
					sub.add({
						title : 'edit',
						id : 'menu-decoration-blankspaces-edit',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceEditSpaces');
						}
					}).setDisabled(b);

					b = _getWceMenuValStatus('delete', pattern);
					sub.add({
						title : 'delete',
						id : 'menu-decoration-blankspaces-delete',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('wceDelNode');
						}
					}).setDisabled(b);

				});

				// Return the new menu button instance
				return c;

			case 'abbreviation':
				var c = cm.createMenuButton('menu-abbreviation', {
					title : 'Abbreviated text',
					image : './js/plugins/wce/img/button_A.gif',
					onclick : function() {
						_setWceMenuStatus(tinyMCE.activeEditor, 'menu-abbreviation', /^__t=abbr/, _getWceMenuValStatus, 'highlighted');
						// _setWceMenuStatus(tinyMCE.activeEditor,
						// 'menu-abbreviation',
						// /^__t=spaces/,
						// _getWceMenuValStatus,
						// 'blankspaces');
					}
				});

				c.onRenderMenu.add(function(c, m) {
					var sub, sub2, sub3, sub4, sub5, sub6, sub7, sub8;

					sub = m.addMenu({
						title : 'Mark highlighted text as abbreviation',
						id : 'menu-abbreviation-highlighted'
					});

					var pattern = /^__t=abbr/;
					var b = _getWceMenuValStatus('add', pattern);
					sub.add({
						title : 'add',
						id : 'menu-abbreviation-highlighted-add',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAddAbbr');
						}
					}).setDisabled(b);

					b = _getWceMenuValStatus('edit', pattern);
					sub.add({
						title : 'edit',
						id : 'menu-abbreviation-highlighted-edit',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceEditAbbr');
						}
					}).setDisabled(b);

					b = _getWceMenuValStatus('delete', pattern);
					sub.add({
						title : 'delete',
						id : 'menu-abbreviation-highlighted-delete',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('wceDelNode');
						}
					}).setDisabled(b);

					// sub.add({title : 'Nomen sacrum',
					// onclick : function() {
					// tinyMCE.activeEditor.execCommand('mceAdd_abbr_nomSac');
					// }});
					//
					// sub.add({title : 'Numeral',
					// onclick : function() {
					// tinyMCE.activeEditor.execCommand('mceAdd_abbr_num');
					// }});
					//										
					// sub.add({title : 'Other',
					// onclick
					// : function() {
					// tinyMCE.activeEditor.execCommand('mceInsertContent',
					// false, '');
					// }});

					sub = m.addMenu({
						title : 'Add preformed abbreviations'
					});

					sub.add({
						title : '\u03D7 Kai compendium',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03D7');
						}
					});

					sub2 = sub.addMenu({
						title : '\u03B8'
					});

					sub2.add({
						title : '\u03B8\u03C2',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03B8\u03C2');
						}
					});

					sub2.add({
						title : '\u03B8\u03BD',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03B8\u03BD');
						}
					});

					sub2.add({
						title : '\u03B8\u03C5',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03B8\u03C5');
						}
					});
					sub2.add({
						title : '\u03B8\u03C9',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03B8\u03C9');
						}
					});

					sub3 = sub.addMenu({
						title : '\u03BA'
					});

					sub3.add({
						title : '\u03BA\u03C2',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03BA\u03C2');
						}
					});

					sub3.add({
						title : '\u03BA\u03BD',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03BA\u03BD');
						}
					});

					sub3.add({
						title : '\u03BA\u03C5',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03BA\u03C5');
						}
					});

					sub4 = sub.addMenu({
						title : '\u03C7'
					});

					sub4.add({
						title : '\u03C7\u03C2',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03C7\u03C2');
						}
					});

					sub4.add({
						title : '\u03C7\u03BD',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03C7\u03BD');
						}
					});

					sub4.add({
						title : '\u03C7\u03C5',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03C7\u03C5');
						}
					});

					sub4.add({
						title : '\u03C7\u03C9',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03C7\u03C9');
						}
					});

					sub5 = sub.addMenu({
						title : '\u03B9'
					});

					sub5.add({
						title : '\u03B9\u03C2',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03B9\u03C2');
						}
					});

					sub5.add({
						title : '\u03B9\u03BD',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03B9\u03BD');
						}
					});

					sub5.add({
						title : '\u03B9\u03C5',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03B9\u03C5');
						}
					});

					sub6 = sub.addMenu({
						title : '\u03C0\u03BD'
					});

					sub6.add({
						title : '\u03C0\u03BD\u03B1',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03C0\u03BD\u03B1');
						}
					});

					sub6.add({
						title : '\u03C0\u03BD\u03C2',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03C0\u03BD\u03C2');
						}
					});

					sub6.add({
						title : '\u03C0\u03BD\u03B9',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03C0\u03BD\u03B9');
						}
					});

					sub7 = sub.addMenu({
						title : '\u03C0\u03C1'
					});

					sub7.add({
						title : '\u03C0\u03C1',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03C0\u03C1');
						}
					});

					sub7.add({
						title : '\u03C0\u03C1\u03B1',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03C0\u03C1\u03B1');
						}
					});

					sub7.add({
						title : '\u03C0\u03C1\u03C2',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03C0\u03C1D\u03C2');
						}
					});

					sub7.add({
						title : '\u03C0\u03C1\u03B9',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03C0\u03C1\u03B9');
						}
					});

					sub.add({
						title : '\u03B9\u03B7\u03BB',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03B9\u03B7\u03BB');
						}
					});

					sub8 = sub.addMenu({
						title : '\u03B1\u03BD'
					});

					sub8.add({
						title : '\u03B1\u03BD\u03BF\u03C2',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03B1\u03BD\u03BF\u03C2');
						}
					});

					sub8.add({
						title : '\u03B1\u03BD\u03BF\u03BD',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03B1\u03BD\u03BF\u03BD');
						}
					});

					sub8.add({
						title : '\u03B1\u03BD\u03BF\u03C5',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03B1\u03BD\u03BF\u03C5');
						}
					});

					sub8.add({
						title : '\u03B1\u03BD\u03C9',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03B1\u03BD\u03C9');
						}
					});

					sub8.add({
						title : '\u03B1\u03BD\u03BF\u03B9',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03B1\u03BD\u03BF\u03B9');
						}
					});

					sub8.add({
						title : '\u03B1\u03BD\u03BF\u03C5\u03C2',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03B1\u03BD\u03BF\u03C5\u03C2');
						}
					});

					sub8.add({
						title : '\u03B1\u03BD\u03C9\u03BD',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03B1\u03BD\u03C9\u03BD');
						}
					});

					sub8.add({
						title : '\u03B1\u03BD\u03BF\u03C5',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03B1\u03BD\u03BF\u03C5');
						}
					});

					sub8.add({
						title : '\u03B1\u03BD\u03BF\u03B9\u03C2',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03B1\u03BD\u03BF\u03B9\u03C2');
						}
					});

					sub9 = sub.addMenu({
						title : '\u03BF\u03C5\u03BD'
					});

					sub9.add({
						title : '\u03BF\u03C5\u03BD\u03BF\u03C2',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03BF\u03C5\u03BD\u03BF\u03C2');
						}
					});

					sub9.add({
						title : '\u03BF\u03C5\u03BD\u03BF\u03BD',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03BF\u03C5\u03BD\u03BF\u03BD');
						}
					});

					sub9.add({
						title : '\u03BF\u03C5\u03BD\u03BF\u03C5',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03BF\u03C5\u03BD\u03BF\u03C5');
						}
					});

					sub9.add({
						title : '\u03BF\u03C5\u03BD\u03C9',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03BF\u03C5\u03BD\u03C9');
						}
					});

					sub9.add({
						title : '\u03BF\u03C5\u03BD\u03BF\u03B9',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03BF\u03C5\u03BD\u03BF\u03B9');
						}
					});

					sub9.add({
						title : '\u03BF\u03C5\u03BD\u03BF\u03C5\u03C2',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03BF\u03C5\u03BD\u03BF\u03C5\u03C2');
						}
					});

					sub9.add({
						title : '\u03BF\u03C5\u03BD\u03C9\u03BD',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03BF\u03C5\u03BD\u03C9\u03BD');
						}
					});

					sub9.add({
						title : '\u03BF\u03C5\u03BD\u03BF\u03B9\u03C2',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAdd_abbr', '\u03BF\u03C5\u03BD\u03BF\u03B9\u03C2');
						}
					});
				});

				return c;

			case 'paratext':
				var c = cm.createMenuButton('menu-paratext', {
					title : 'Paratext',
					image : './js/plugins/wce/img/button_P.gif',
					onclick : function() {
						_setWceMenuStatus(tinyMCE.activeEditor, 'menu-paratext', /^__t=paratext/, _getWceMenuValStatus);
					}
				});

				c.onRenderMenu.add(function(c, m) {
					var pattern = /^__t=paratext/;
					var b = _getWceMenuValStatus('add', pattern);

					m.add({
						title : 'add',
						id : 'menu-paratext-add',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAddParatext');
						}
					}).setDisabled(b);

					b = _getWceMenuValStatus('edit', pattern);
					m.add({
						title : 'edit',
						id : 'menu-paratext-edit',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceEditParatext');
						}
					}).setDisabled(b);

					b = _getWceMenuValStatus('delete', pattern);
					m.add({
						title : 'delete',
						id : 'menu-paratext-delete',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('wceDelNode');
						}
					}).setDisabled(b);
				});

				return c;

			case 'note':
				var c = cm.createMenuButton('menu-note', {
					title : 'Note',
					image : './js/plugins/wce/img/button_N.gif',
					onclick : function() {
						_setWceMenuStatus(tinyMCE.activeEditor, 'menu-note', /^__t=note/, _getWceMenuValStatus);
					}
				});

				c.onRenderMenu.add(function(c, m) {
					var pattern = /^__t=note/;
					var b = _getWceMenuValStatus('add', pattern);

					m.add({
						title : 'add',
						id : 'menu-note-add',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceAddNote');
						}
					}).setDisabled(b);

					b = _getWceMenuValStatus('edit', pattern);
					m.add({
						title : 'edit',
						id : 'menu-note-edit',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('mceEditNote');
						}
					}).setDisabled(b);

					b = _getWceMenuValStatus('delete', pattern);
					m.add({
						title : 'delete',
						id : 'menu-note-delete',
						onclick : function() {
							tinyMCE.activeEditor.execCommand('wceDelNode');
						}
					}).setDisabled(b);
				});

				return c;
			}

			return null;
		},

		_wceAdd : function(ed, url, htm, w, h, inline, add_new_wce_node) {
			ed.windowManager.open({
				file : url + htm,
				width : w + ed.getLang('example.delta_width', 0),
				height : h + ed.getLang('example.delta_height', 0),
				inline : inline
			}, {
				plugin_url : url,
				add_new_wce_node : add_new_wce_node
			});
		},

		// bei adptive Selection
		_getStartNoBlank : function(startText, startOffset) {
			if (typeof startText == 'undefined')
				return startOffset;

			var ch, pre_ch;
			var nbsp = '\xa0';
			var hasBlank = false;
			for ( var i = startOffset; i <= startText.length; i++) {
				ch = startText.charAt(i);

				if (ch == ' ' || ch == nbsp) {
					hasBlank = true;
				}
				if (ch != ' ' && ch != nbsp) {
					pre_ch = startText.charAt(i - 1);
					if (i == 0 || pre_ch == ' ' || pre_ch == nbsp || hasBlank) {
						return i;
					}
				}
				startOffset = i;
			}

			// Ende des String
			if (startOffset == startText.length) {
				return -2;
			}
			return startOffset;
		},

		_getNextEnd : function(endText, startOffset) {
			if (typeof endText == 'undefined')
				return startOffset;

			endText = endText.replace(/\xa0/gi, ' ');
			startOffset = endText.indexOf(' ', startOffset);
			if (startOffset < 0) {
				startOffset = endText.length;
			}
			return startOffset;
		},

		// bei adptive Selection
		_getEndNoBlank : function(endText, endOffset) {
			var ch;
			var nbsp = '\xa0';

			// Endespunkt der Auswahl
			for ( var i = endOffset; i > -1; i--) {
				// ende des Textes
				if (i == endText.length && i > 0 && endText.charAt(i - 1) != ' ' && endText.charAt(i - 1) != nbsp)
					break;

				ch = endText.charAt(i);

				if (ch == ' ' || ch == nbsp) {
					if (i > 0 && (endText.charAt(i - 1) != ' ' && endText.charAt(i - 1) != nbsp))
						break;
				}
				endOffset--;
			}

			return endOffset;
		},

		_getTextNode : function(_node) {
			var _child;
			if (!_node.nodeName)
				return _node;

			while (!_node.nodeName.match(/text/)) {
				_child = _node.childNodes[0];
				if (_child == null || typeof (_child) == 'undefined') {
					break;
				}
				_node = _child;
			}
			return _node;
		},

		_wceAddNoDialog : function(ed, className, character) {
			var content = ed.selection.getContent();
			var style = 'style="border: 1px  dotted #f00;  margin:0px; padding:0;"';
			switch (className) {
			case 'pc':
				ed.selection.setContent('<span class="' + ed.wceTypeParamInClass + '=' + className + '"' + style + '>' + character + '</span> ');
				break;
			case 'abbr':
				ed.selection.setContent('<span class="' + ed.wceTypeParamInClass + '=' + className + '"' + style + '>' + character + '</span> ');
				break;
			case 'brea':
				if (character == 'lb') { //line break at the end of a word
					ed.selection.setContent('<span class="' + ed.wceTypeParamInClass + '=' + className + '"' + style + '>' + '&crarr;' + '</span> ');
				} else if (character == 'lbm') { //line break in the middle of a word
					ed.selection.setContent('<span class="' + ed.wceTypeParamInClass + '=' + className + '"' + style + '>' + '&hyphen;&crarr;' + '</span> ');
				} else if (character == 'cb') { //column break
				
				} else if (character == 'pb') { //page break
				
				} else { //quire break
				}
				break;
			case 'part_abbr': //part-worded abbreviations
				var rng = ed.selection.getRng(true);
				var startNode = rng.startContainer;
				var startText = startNode.data ? startNode.data : startNode.innerText;
				var text = startText.substr(0,rng.startOffset);
				var li = text.lastIndexOf('(');
				if (li > -1)
				{
					var part_abbr = text.substr(li) + ')';
					startNode.data = startText.substr(rng.endOffset);
					ed.selection.setContent('<span class="' + ed.wceTypeParamInClass + '=' + className + '"' + style + '>' + part_abbr + '</span>');
					startNode.data += startText.substr(0,text.lastIndexOf('('));
				}
				else
				{
					alert("Error at part-worded abbreviation. Parentheses do not match or invalid nesting!");
				}
				break;
			default:
				ed.selection.setContent('<span class="' + ed.wceTypeParamInClass + '=' + className + '"' + style + '>' + content + '</span> ');
			}
		},

		/**
		 * Initializes the plugin,
		 * 
		 * @param {tinymce.Editor}
		 *            ed Editor instance that the plugin is initialized in.
		 * @param {string}
		 *            url Absolute URL to where the plugin is located.
		 */
		init : function(ed, url) {
			var _this = this;
			_this.editor = ed;

			var _wceAdd = _this._wceAdd;
			var _wceAddNoDialog = _this._wceAddNoDialog;

			var _getStartNoBlank = _this._getStartNoBlank;
			var _getNextEnd = _this._getNextEnd;
			var _getEndNoBlank = _this._getEndNoBlank;
			var _getTextNode = _this._getTextNode;

			ed.onKeyPress.addToTop(_this._setWceControls);
			ed.onMouseUp.addToTop(_this._setWceControls);
			ed.onKeyPress.addToTop(_this._setWceControls);
			ed.onKeyUp.addToTop(_this._setWceControls);

			// class="__t=wce_type&__n=wce_name...."
			ed.wceTypeParamInClass = '__t';
			ed.wceNameParamInClass = '__n';

			// Information-box
			ed.wceInfoBox = document.createElement("div");
			document.body.appendChild(ed.wceInfoBox);
			tinymce.DOM.setStyles(ed.wceInfoBox, {
				'height' : '300px',
				'font-size' : '12px',
				'width' : 'auto',
				'position' : 'absolute',
				'z-index' : '10',
				'overflow' : 'auto',
				'display' : 'none'
			});

			// add adaptive selection checkbox
			ed.onPostRender.add(function(ed, cm) {
				var id = ed.id + '_adaptive_selection';
				var row = tinymce.DOM.get(ed.id + '_path_row');
				if (row) {
					tinymce.DOM.add(row.parentNode, 'div', {
						'style' : ''
					}, '<input type="checkbox" checked="checked"  id="' + id + '"> Adaptive selection</input>');
				}
			});

			// TEST: //Nur wenn Tastate "Entf" aktiviert Ueberpruefen, ob Cursor
			// direkt vor oder nach Verse ist
			ed.addCommand("testVerseOrChapterBeforeDel", function(ek) {
				if (ek != 46)
					return 0;

				/*
				 * Löschen mit 'Entf' wird rng.startOffset in IE nicht richtig
				 * akutallisiert vorl?ufige L?sung mit Bookmark, nicht 100%
				 * funktioniert, /* if($.browser.msie){ var
				 * bm=ed.selection.getBookmark();
				 * ed.selection.moveToBookmark(bm); }
				 */
				var rng = ed.selection.getRng(true);
				var startNode = rng.startContainer;
				var startText = startNode.data ? startNode.data : startNode.innerText;
				var nodeSibling;

				if (ek == 8 && rng.startOffset == 0 && typeof (startText) != 'undefined') {
					nodeSibling = startNode.previousSibling;
				} else if (ek == 46 && ((typeof (startText) != 'undefined' && rng.startOffset >= startText.length) || (typeof (startText) == 'undefined' && typeof (startNode) != 'undefined'))) {
					nodeSibling = startNode.nextSibling;
				} else
					return 0;

				if (typeof (nodeSibling) != 'undefined' && nodeSibling != null) {
					return ed.execCommand('testNodeIsVerseOrChapter', nodeSibling);
				} else {
					return ed.execCommand('testNodeParentIsVerseOrChapter', startNode);
				}
				return 0;
			});

			// TEST: //Nur wenn Tastate "Entf" aktiviert
			ed.addCommand('testNodeParentIsVerseOrChapter', function(_node) {
				var _parentNode = _node.parentNode, _nextSibling;
				if (typeof (_parentNode) != 'undefined' && !_parentNode.nodeName.match(/body/i)) {
					_nextSibling = _parentNode.nextSibling;
					if (typeof (_nextSibling) != 'undefined' && _nextSibling != null) {
						return ed.execCommand('testNodeIsVerseOrChapter', _nextSibling);
					} else {
						return ed.execCommand('testNodeParentIsVerseOrChapter', _parentNode);
					}
				}
				return 0;
			});

			// Ueberpruefen: ob Node Verse oder Chapter
			ed.addCommand('testNodeIsVerseOrChapter', function(n) {
				var nc = n.className;
				if (nc == 'verse_number' || nc == 'chapter_number') {
					return 1;
				}
				return 0;
			});

			// Ueberpruefen: ob ParentNode Verse oder
			// Chapter
			ed.addCommand('testParentIsVereOrChapter', function(_node) {
				var _parent = _node.parentNode;
				var t = this;
				if (typeof (_parentNode) != 'undefined' && !_parentNode.nodeName.match(/body/i)) {
					return t(_parentNode);
					// return
					// ed.execCommand('testParentIsVereOrChapter',_parentNode);
				}
				return ed.execCommand('testNodeIsVerseOrChapter', _node);
			});

			// Ueberpruefen, ob ausgewaehlter
			// Text verse nummer hat
			ed.addCommand("wceContentHasVerse", function() {
				var _sel = ed.selection;

				// Auswahl hat verse
				if (_sel.getContent().match(/<span\s*class=\"verse_number"\s*>/) || _sel.getContent().match(/<span\s*class=\"chapter_number"\s*>/)) {
					return 1;
				}

				// Auswahl in verse
				var _selNode = _sel.getNode();
				if (typeof (_selNode) != 'undefined' && _selNode != null) {
					return ed.execCommand('testParentIsVereOrChapter', _selNode);
				}

				return 0;
			});

			/*
			 * onInit
			 * 
			 */
			ed.onInit.add(function() {
				tinymce.dom.Event.add(ed.getDoc(), 'dblclick', function(e) {
				});

				tinymce.dom.Event.add(ed.getDoc(), 'mousemove', function(e) {
					_this._showWceInfo(ed, e);
				});

				tinymce.dom.Event.add(ed.getDoc(), 'mouseup', function(e) {
					if (!ed.selection.isCollapsed()) {
						_this._adaptiveSelection();
					}
				});
				tinymce.dom.Event.add(ed.getDoc(), 'keyup', function(e) {
					if (!ed.wceKeydownBlock) {
						ed.isNotDirty = 0;
					}
				});

				// versernumber schuetzen
				// TODO: testen, ob Editor Focus hat
				tinymce.dom.Event.add(ed.getDoc(), 'keydown', function(e) {
					var ek = e.keyCode;
					var delBlock = false;
					ed.wceKeydownBlock = false;

					if (ek == 17 || (ek > 32 && ek < 41))
						return;

					if (ek == 13) // Enter
					{
						var rng = ed.selection.getRng(true);
						var startNode = rng.startContainer;
						var startText = startNode.data ? startNode.data : startNode.innerText;
						
						if (rng.startOffset == _getNextEnd(startText,rng.startOffset)) { //at the end of a word
							_wceAddNoDialog(ed, 'brea', 'lb');
						} else { //in the middle of a word
							_wceAddNoDialog(ed, 'brea', 'lbm');
						}
					}
					
					if (ek == 56 && e.shiftKey ) //(
					{
						
					}

					if (ek == 57 && e.shiftKey) //)
					{
						//Find corresponding ( and create substring
						e.preventDefault();
						e.stopPropagation();
						//e.stopImmediatePropagation();
						_wceAddNoDialog(ed, 'part_abbr', '');
					}
					// Tastate "Entf" deaktivieren
					// if(ek==46) delBlock=true;

					var delBlockArr = [ 'paratext', 'gap', 'note', 'spaces' ];
					if (_this._contentHasWceClass(ed, delBlockArr)) {
						delBlock = true;
					}

					// Browser außer IE
					if (!delBlock && !$.browser.msie && ek == 8) {
						var rng = ed.selection.getRng(true);
						var startNode = rng.startContainer;
						var startText = startNode.data ? startNode.data : startNode.innerText;

						if (rng.startOffset == 0 && typeof (startText) != 'undefined') {
							var nodeSibling = startNode.previousSibling;
							if (typeof (nodeSibling) != 'undefined' && nodeSibling != null) {
								if (ed.execCommand('testNodeIsVerseOrChapter', nodeSibling)) {
									delBlock = true;
								}
							} else if (ed.execCommand('testNodeParentIsVerseOrChapter', startNode)) {
								delBlock = true;
							}
						}
					}

					// TEST: Nur wenn Tastate "Entf" aktiviert
					if (!delBlock && ed.execCommand('testVerseOrChapterBeforeDel', ek) == 1) {
						delBlock = true;
					}

					// TEST: Tastate "Entf" aktiviert
					if (ed.execCommand('testVerseOrChapterBeforeDel', ek) == 1)
						delBlock = true;

					if (!delBlock && ed.execCommand('wceContentHasVerse') == 1) {
						delBlock = true;
					}

					if (delBlock) {
						ed.wceKeydownBlock = true;
						// if(!ed.selection.isCollapsed())
						if ($.browser.msie) {
							// Entfernen-Key deaktivieren
							if (ek == 46) {
								e.keyCode = 32;
							}
							e.returnValue = false;
						} else {
							e.preventDefault();
						}
					} else if (window.event) {
						e.returnValue = true;
					}
					return;
				});
			});

			// Get selected span node
			ed.addCommand('getWceNode', function() {
				var sele_node = ed.selection.getNode();
				if (typeof sele_node == 'undefined' || sele_node == null)
					return null;
				var className = sele_node.className;
				if (typeof className != 'undefined' && className != '' && className.indexOf(ed.wceTypeParamInClass) == 0) {
					return sele_node;
				}
				return null;
			});

			// delete nodeName
			ed.addCommand('wceDelNode', function() {
				var wceNode = ed.execCommand('getWceNode');
				if (wceNode != null) {
					ed.selection.select(wceNode);
					var wce_class_name = wceNode.className;
					var originalText = wceNode.innerText;

					// if tag to remove
					var node_to_remove = [ 'paratext', 'note', 'gap' ];
					var to_remove = false;
					for ( var i = 0; i < node_to_remove.length; i++) {
						if (wce_class_name.indexOf(ed.wceTypeParamInClass + '=' + node_to_remove[i]) > -1) {
							to_remove = true;
							break;
						}
					}

					if (to_remove) {
						$(wceNode).remove();
					} else if (typeof originalText != 'undefined') {
						ed.selection.setContent(originalText);
					}
					ed.isNotDirty = 0;
				}
			});

			// Add breaks
			ed.addCommand('mceAddBreak', function() {
				_wceAdd(ed, url, '/break.htm', 480, 320, 1, true);
			});
			// Edit breaks
			ed.addCommand('mceEditBreak', function() {
				_wceAdd(ed, url, '/break.htm', 480, 320, 1, false);
			});

			// Add corrections
			ed.addCommand('mceAddCorrection', function() {
				var _add_new_wce_node = true;
				var sele_node = ed.selection.getNode();
				var wceNode = ed.execCommand('getWceNode');

				// wenn cursor in wce_corr
				if (ed.selection.isCollapsed()) {
					if (wceNode == null || !wceNode.className.match(/corr/)) {
						return;
					}
					_add_new_wce_node = false;
				} else if (wceNode != null && wceNode.className.match(/corr/)) {
					alert('2');
					_add_new_wce_node = false;
				}
				_wceAdd(ed, url, '/correction.htm', 700, 400, 1, _add_new_wce_node);
			});
			// Edit corrections
			ed.addCommand('mceEditCorrection', function() {
				_wceAdd(ed, url, '/correction.htm', 480, 320, 1, false);
			});

			// Add gaps/*********/
			ed.addCommand('mceAddGap', function() {
				_wceAdd(ed, url, '/gap.htm', 480, 320, 1, true);
			});
			// Edit gaps and spacing
			ed.addCommand('mceEditGap', function() {
				_wceAdd(ed, url, '/gap.htm', 480, 320, 1, false);
			});

			// Add unclear text/*********/
			ed.addCommand('mceAddUnclearText', function() {
				_wceAdd(ed, url, '/unclear_text.htm', 480, 320, 1, true);
			});
			// Edit unclear text
			ed.addCommand('mceEditUnclearText', function() {
				_wceAdd(ed, url, '/unclear_text.htm', 480, 320, 1, false);
			});

			// Add supplied text/*********/
			ed.addCommand('mceAddSuppliedText', function() {
				_wceAdd(ed, url, '/supplied_text.htm', 480, 320, 1, true);
			});
			// Edit supplied text
			ed.addCommand('mceEditSuppliedText', function() {
				_wceAdd(ed, url, '/supplied_text.htm', 480, 320, 1, false);
			});

			// Add note/*********/
			ed.addCommand('mceAddNote', function() {
				_wceAdd(ed, url, '/note.htm', 480, 380, 1, true);
			});
			// Edit note
			ed.addCommand('mceEditNote', function() {
				_wceAdd(ed, url, '/note.htm', 480, 380, 1, false);
			});

			// Add abbreviation/*********/
			ed.addCommand('mceAddAbbr', function() {
				_wceAdd(ed, url, '/abbr.htm', 480, 320, 1, true);
			});
			// Edit abbreviation
			ed.addCommand('mceEditAbbr', function() {
				_wceAdd(ed, url, '/abbr.htm', 480, 320, 1, false);
			});

			// Add Spaces/*********/
			ed.addCommand('mceAddSpaces', function() {
				_wceAdd(ed, url, '/spaces.htm', 480, 320, 1, true);
			});

			// Add Spaces/*********/
			ed.addCommand('mceEditSpaces', function() {
				_wceAdd(ed, url, '/spaces.htm', 480, 320, 1, false);
			});

			// Add paratext/*********/
			ed.addCommand('mceAddParatext', function() {
				_wceAdd(ed, url, '/paratext.htm', 480, 320, 1, true);
			});
			// Edit paratext
			ed.addCommand('mceEditParatext', function() {
				_wceAdd(ed, url, '/paratext.htm', 480, 320, 1, false);
			});

			ed.addCommand('mceAdd_abbr', function(c) {
				_wceAddNoDialog(ed, 'abbr', c);
			});

			ed.addCommand('mceAdd_pc', function(c) {
				_wceAddNoDialog(ed, 'pc', c);
			});

			ed.addCommand('mceAdd_formatting', function(c) {
				_wceAddNoDialog(ed, 'formatting_' + c, '');
			});

		},

		/**
		 * Returns information about the plugin as a name/value array. The
		 * current keys are longname, author, authorurl, infourl and version.
		 * 
		 * @return {Object} Name/value array containing information about the
		 *         plugin.
		 */
		getInfo : function() {
			return {
				longname : 'WCE plugin',
				author : 'WCE',
				authorurl : 'http://wce',
				infourl : 'http://wce',
				version : "0.1"
			};
		}
	});

	// Register plugin
	tinymce.PluginManager.add('wce', tinymce.plugins.wcePlugin);
})();