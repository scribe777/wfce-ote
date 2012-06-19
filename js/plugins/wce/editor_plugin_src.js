/**
 * editor_plugin_src.js
 * 
 * Copyright 2009, Moxiecode Systems AB Released under LGPL License.
 * 
 * License: http://tinymce.moxiecode.com/license Contributing:
 * http://tinymce.moxiecode.com/contributing
 */

(function() {

	var qcnt = 1; // quire count
	var pcnt = 1; // page count
	var ccnt = 1; // column count
	var lcnt = 1; // line count
	var rectoverso = 'true'; // counting as r/v

	// Load plugin specific language pack
	tinymce.PluginManager.requireLangPack('wce');
	// wcePlugin
	var _wpl = {
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
				if (typeof node != ' undefined'
						&& typeof (node.className) != 'undefined'
						&& node.className.match(p)) {
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

		_inClass : function(n, pattern) {
			if (typeof n == 'undefined' || n == null
					|| typeof n.nodeName == 'undefined' || n.nodeName == ''
					|| n.nodeName.match(/body/i))
				return false;

			var className = n.className;

			if (typeof className != 'undefined' && className != null
					&& className != '' && className.match(pattern)) {
				return true;
			} else {
				return this._inClass(n.parentNode, pattern);
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

			// nach setRng wird editor unter firefox nicht
			// aktualisiert. Bug
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

			// testen, ob verse_number oder chapter_number
			// ausgewählt
			var s_verse = _this._inClass(s_node, /verse_number/i);
			var e_verse = _this._inClass(e_node, /verse_number/i);
			if (s_verse && !e_verse) {
				// select e_node
				s_index = _this._getStartNoBlank(e_text, 0);
				e_index = _this._getEndNoBlank(e_text, e_index);
				rng.setStart(e_node, s_index);
				rng.setEnd(e_node, e_index);
				ed.selection.setRng(rng);
				return;
			} else if (!s_verse && e_verse) {
				// select s_node
				s_index = _this._getStartNoBlank(s_text, s_index);
				e_index = _this._getEndNoBlank(s_text, s_text.length);
				rng.setStart(s_node, s_index);
				rng.setEnd(s_node, e_index);
				ed.selection.setRng(rng);
				return;
			} else if (s_verse && e_verse) {
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
					// e_index = 0;
					e_index = _this._getEndNoBlank(s_text, s_text.length);
					e_node = s_node;
				}
				rng.setStart(s_node, s_index);
				rng.setEnd(e_node, e_index);
				ed.selection.setRng(rng);
				return;
			}

			// wenn s_node und e_node kein selbe parentNode
			// haben, dann neue
			// Start /Ende Node suchen
			var n1 = s_node;
			var n2 = e_node;
			var p1, p2; // parent Node
			for (p1 = s_node.parentNode; typeof p1 != 'undefined'
					&& !n1.nodeName.match(/body/i) && p1 != null; p1 = p1.parentNode) {
				if (p1 === p2)
					break;
				for (p2 = e_node.parentNode; typeof p2 != 'undefined'
						&& !n2.nodeName.match(/body/i) && p2 != null; p2 = p2.parentNode) {
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

			var type_to_show = ['note', 'corr']; // TODO

			var info_arr;
			if (wce_class_name != '') {
				info_arr = wce_class_name.split('@');
			}
			if (info_arr != null
					&& info_arr.length > 0
					&& wce_class_name.indexOf(ed.wceTypeParamInClass + '=') > -1) {
				var ar;
				var corr_str = '';
				var info_text = '';
				var k, v, kv, kv_ar;
				for ( var i = 0; i < info_arr.length; i++) {
					ar = this._wceParamsToArray(info_arr[i]);
					var type_name = ar[ed.wceTypeParamInClass];
					type_name = type_name.split('_');

					switch (type_name[0]) {
						case 'abbr' :
							switch (ar['abbr_type']) {
								case 'nomSac' :
									info_text = 'Nomen Sacrum';
									break;
								case 'numeral' :
									info_text = 'Numeral';
									break;
								case 'other' :
									info_text = ar['abbr_type_other'];
									break;
							}
							break;
						case 'brea' :
							switch (ar['break_type']) {
								case 'lb' :
									info_text = '<div>Number: ' + ar['number']
											+ '</div>';
									if (ar['lb_alignment'] != '') {
										info_text += '<div>Alignment: '
												+ ar['lb_alignment'];
									}
									break;
								case 'pb' :
									info_text = '<div>'
											+ 'Page number (in sequence): '
											+ ar['number'] + ar['pb_type']
											+ ar['fibre_type'] + '</div>';
									if (ar['page_number'] != '') {
										info_text += '<div>'
												+ 'Page number (as written): '
												+ ar['page_number'] + '</div>';
									}
									if (ar['running_title'] != '') {
										info_text += '<div>'
												+ 'Running title: '
												+ ar['running_title']
												+ '</div>';
									}
									break;
								default :
									info_text = '<div>Number: ' + ar['number']
											+ '</div>';
							}
							break;
						case 'note' :
							info_text = '<div>';
							switch (ar['note_type']) {
								case 'editorial' :
									info_text += 'Editorial Note</div>';
									break;
								case 'transcriberquery' :
									info_text += 'Transcriber query</div>';
									break;
								case 'canonRef' :
									info_text += 'Canon reference</div>';
									break;
								case 'changeOfHand' :
									info_text += 'Change of Hand</div>';
									info_text += '<div>New hand: '
											+ ar['newHand'] + '</div>';
									break;
								default : // other
									info_text += ar['note_type_other']
											+ '</div>';
							}
							info_text += '<div style="margin-top:10px">'
									+ ar['note_text'] + '</div>';
							break;
						case 'corr' :
							corr_str += '<div style="margin-top:15px">';
							switch (ar['reading']) {
								case 'corr' :
									corr_str += 'Correction';
									break;
								case 'comm' :
									corr_str += 'Commentary reading';
									break;
								case 'alt' :
									corr_str += 'Alternative reading';
									break;
							}
							corr_str += '</div>';
							corr_str += '<div style="margin-top:5px">'
									+ ar[ed.wceNameParamInClass] + ': ';
							if (ar['blank_correction'] == 'blank_correction')
								corr_str += 'deleted' + '</div>';
							else
								corr_str += ar['corrector_text'] + '</div>';
							if (ar['deletion'] != 'null') // information
								// on
								// deletion
								corr_str += '<div style="margin-top:5px">'
										+ 'Method of deletion: '
										+ ar['deletion'] + '</div>';
							break;
						case 'paratext' :
							info_text = '<div>' + 'Paratext type: ';
							switch (ar['fw_type']) {
								case 'num_chapternumber' :
									info_text += 'Chapter number';
									break;
								case 'fw_chaptertitle' :
									info_text += 'Chapter title';
									break;
								case 'fw_colophon' :
									info_text += 'Colophon';
									break;
								case 'fw_quiresig' :
									info_text += 'Quire signature';
									break;
								case 'num_ammonian' :
									info_text += 'Ammonian section';
									break;
								case 'num_eusebian' :
									info_text += 'Eusebian canon';
									break;
								case 'fw_euthaliana' :
									info_text += 'Euthaliana';
									break;
								case 'fw_gloss' :
									info_text += 'Gloss';
									break;
								case 'fw_lecttitle' :
									info_text += 'Lectionary title';
									break;
								case 'num_stichoi' :
									info_text += 'Stichoi';
									break;
							}
							info_text += '</div>';
							info_text += '<div style="margin-top:10px">Value: '
									+ ar['text'] + '</div>';
							if (ar['paratext_position'] == 'other') {
								info_text += '<div style="margin-top:10px">Position: '
										+ ar['paratext_position_other']
										+ '</div>';
							} else {
								info_text += '<div style="margin-top:10px">Position: '
										+ ar['paratext_position'] + '</div>';
							}
							info_text += '<div style="margin-top:10px">Alignment: '
									+ ar['paratext_alignment'] + '</div>';
							break;
						case 'gap' :
							if (ar['unit'] == '' && ar['gap_reason'] == '') {
								info_text = 'No information about the reason and extension of the gap available';
								break;
							}
							info_text = '<div>' + 'Reason: ';
							if (ar['gap_reason'] == 'lacuna') {
								info_text += 'Lacuna' + '</div>';
							} else if (ar['gap_reason'] == 'illegible') {
								info_text += 'Illegible text' + '</div>';
							} else {
								info_text += 'Absent text' + '</div>';
							}
							if (ar['extent'] != '') {
								info_text += '<div>' + 'Extent: '
										+ ar['extent'] + ' ';
								if (ar['unit'] == 'other') {
									info_text += ar['unit_other'] + '</div>';
								} else {
									info_text += ar['unit'] + '(s)</div>';
								}
							}
							if (ar['mark_as_supplied'] == 'supplied') {
								info_text += '<div>' + 'Supplied source: ';
								if (ar['supplied_source'] == 'other') {
									info_text += ar['supplied_source_other']
											+ '</div>';
								} else {
									info_text += ar['supplied_source']
											+ '</div>';
								}
							}
							break;
						case 'unclear' :
							info_text = '<div>' + 'Uncertain letters'
									+ '</div>';
							info_text += '<div>' + 'Reason: ';
							if (ar['unclear_text_reason'] == 'other') {
								info_text += ar['unclear_text_reason_other'];
							} else {
								info_text += ar['unclear_text_reason'];
							}
							info_text += '</div>';
							break;
						case 'spaces' :
							info_text = '<div>' + 'Extent: ' + ar['sp_extent']
									+ ' ';
							if (ar['sp_unit'] == 'other') {
								info_text += ar['sp_unit_other'] + '(s)'
										+ '</div>';
							} else {
								info_text += ar['sp_unit'] + '(s)</div>';
							}
							break;
						case 'formatting' : // it is
							// "formatting_capitals",
							// but is truncated
							info_text = '<div>' + 'Height: '
									+ ar['capitals_height'] + '</div>';
							break;
						default :
							info_text = '';
							break;
					}

				}

				if (corr_str != '') {
					corr_str = '*: ' + $(sele_node).html() + corr_str;
					if (ar['editorial_note'] != '') {
						corr_str += '<div style="margin-top:5px">Note: '
								+ ar['editorial_note'] + '</div>';
					}
				}

				if (type_name == 'corr') {
					info_text = corr_str;
				}

				// information display
				if (info_text != '') {
					var new_top = e.clientY;
					var new_left = e.clientX;
					if (ed.getParam('fullscreen_is_enabled')) {
						new_top = new_top + 30;
						new_left = new_left + 30;
					} else {
						new_top = new_top + 80;
						new_left = new_left + 80;
					}

					tinymce.DOM.setStyles(info_box, {
						'top' : new_top,
						'left' : new_left
					});
					info_box.innerHTML = '<div style="background-color: #eee; white-space:normal; padding:10px;border: 1px solid #ff0000">'
							+ info_text + '</div>';
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
					case 'add' :
						if (p == '/^_t=paratext/' && !col) {
							return true;
						}

						if (className.match(/_t=/))
							return true;
						else
							return false;
						break;

					case 'edit' :
						if (className.match(p))
							return false;
						else
							return true;
						break;

					case 'delete' :
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
					item = control.menu.items[menuId + '-' + unterMenuId].items[menuId
							+ '-' + unterMenuId + '-add'];
				}

				if (f('add', pattern)) {
					item.setDisabled(true);
				} else
					item.setDisabled(false);

				if (typeof unterMenuId == 'undefined' || unterMenuId == null) {
					item = control.menu.items[menuId + '-edit'];
				} else {
					item = control.menu.items[menuId + '-' + unterMenuId].items[menuId
							+ '-' + unterMenuId + '-edit'];
				}
				if (f('edit', pattern)) {
					item.setDisabled(true);
				} else
					item.setDisabled(false);

				if (typeof unterMenuId == 'undefined' || unterMenuId == null) {
					item = control.menu.items[menuId + '-delete'];
				} else {
					item = control.menu.items[menuId + '-' + unterMenuId].items[menuId
							+ '-' + unterMenuId + '-delete'];
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
				/*
				 * case 'metadata': var c = cm.createButton('menu-metadata', {
				 * title : 'Metadata', image :
				 * tinyMCE.baseURL+'/plugins/wce/img/button_meta.gif', onclick :
				 * function() {
				 * tinyMCE.activeEditor.execCommand('mceAddMetadata'); } });
				 * return c;
				 */
				case 'breaks' :
					var c = cm.createMenuButton('menu-break', {
						title : 'Breaks',
						image : tinyMCE.baseURL
								+ '/plugins/wce/img/button_B-new.png',
						icons : false,
						onclick : function() {
							_setWceMenuStatus(tinyMCE.activeEditor,
									'menu-break', /^__t=brea/,
									_getWceMenuValStatus);
						}
					});

					c.onRenderMenu.add(function(c, m) {
						var pattern = /^__t=brea/;
						var b = _getWceMenuValStatus('add', pattern);

						m.add(
								{
									title : 'add',
									id : 'menu-break-add',
									onclick : function() {
										tinyMCE.activeEditor
												.execCommand('mceAddBreak');
									}
								}).setDisabled(b);

						b = _getWceMenuValStatus('edit', pattern);
						m.add(
								{
									title : 'edit',
									id : 'menu-break-edit',
									onclick : function() {
										tinyMCE.activeEditor
												.execCommand('mceEditBreak');
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

				case 'correction' :
					var c = cm.createButton('menu-correction', {
						title : 'Corrections',
						image : tinyMCE.baseURL
								+ '/plugins/wce/img/button_C-new.png',
						icons : false,
						onclick : function() {
							tinyMCE.activeEditor
									.execCommand('mceAddCorrection');
						}
					});

					return c;

				case 'illegible' :
					var c = cm.createMenuButton('menu-illegable', {
						title : 'Deficiency',
						image : tinyMCE.baseURL
								+ '/plugins/wce/img/button_D-new.png',
						icons : false,
						onclick : function() {
							_setWceMenuStatus(tinyMCE.activeEditor,
									'menu-illegable', /^__t=unclear/,
									_getWceMenuValStatus, 'uncleartext');
							_setWceMenuStatus(tinyMCE.activeEditor,
									'menu-illegable', /^__t=gap/,
									_getWceMenuValStatus, 'lacuna');
						}
					});

					c.onRenderMenu
							.add(function(c, m) {
								var sub, pattern, b;

								// Uncertain Letters
								m
										.add({
											title : 'Uncertain letters',
											id : 'menu-illegable-uncleartext',
											onclick : function() {
												tinyMCE.activeEditor
														.execCommand('mceAddUnclearText');
											}
										});

								sub = m.addMenu({
									title : 'Uncertain Letters',
									id : 'menu-illegable-uncleartext'
								});

								pattern = /^__t=unclear/;
								b = _getWceMenuValStatus('add', pattern);
								sub
										.add(
												{
													title : 'add',
													id : 'menu-illegable-uncleartext-add',
													onclick : function() {
														tinyMCE.activeEditor
																.execCommand('mceAddUnclearText');
													}
												}).setDisabled(b);

								b = _getWceMenuValStatus('edit', pattern);
								sub
										.add(
												{
													title : 'edit',
													id : 'menu-illegable-uncleartext-edit',
													onclick : function() {
														tinyMCE.activeEditor
																.execCommand('mceEditUnclearText');
													}
												}).setDisabled(b);

								b = _getWceMenuValStatus('delete', pattern);
								sub
										.add(
												{
													title : 'delete',
													id : 'menu-illegable-uncleartext-delete',
													onclick : function() {
														tinyMCE.activeEditor
																.execCommand('wceDelNode');
													}
												}).setDisabled(b);

								// gap/supplied
								pattern = /^__t=gap/;
								sub = m.addMenu({
									title : 'Gap',
									id : 'menu-illegable-lacuna'
								});

								b = _getWceMenuValStatus('add', pattern);
								sub
										.add(
												{
													title : 'add',
													id : 'menu-illegable-lacuna-add',
													onclick : function() {
														tinyMCE.activeEditor
																.execCommand('mceAddGap');
													}
												}).setDisabled(b);

								b = _getWceMenuValStatus('edit', pattern);
								sub
										.add(
												{
													title : 'edit',
													id : 'menu-illegable-lacuna-edit',
													onclick : function() {
														tinyMCE.activeEditor
																.execCommand('mceEditGap');
													}
												}).setDisabled(b);

								b = _getWceMenuValStatus('delete', pattern);
								sub
										.add(
												{
													title : 'delete',
													id : 'menu-illegable-lacuna-delete',
													onclick : function() {
														tinyMCE.activeEditor
																.execCommand('wceDelNode');
													}
												}).setDisabled(b);

								m
										.add({ // Ghost page
											title : 'Ghost page',
											id : 'menu-illegable-ghostpage',
											onclick : function() {
												tinyMCE.activeEditor
														.execCommand('mceAddGhostPage');
											}
										});
							});

					// Return the new menu button instance
					return c;

				case 'decoration' :
					var c = cm.createMenuButton('menu-decoration', {
						title : 'Ornamentation',
						image : tinyMCE.baseURL
								+ '/plugins/wce/img/button_O-new.png',
						icons : false,
						onclick : function() {
							_setWceMenuStatus(tinyMCE.activeEditor,
									'menu-decoration');
							_setWceMenuStatus(tinyMCE.activeEditor,
									'menu-decoration', /^__t=spaces/,
									_getWceMenuValStatus, 'blankspaces');
						}
					});

					c.onRenderMenu
							.add(function(c, m) {
								var sub;

								sub = m
										.addMenu({
											title : 'Highlight Text',
											id : 'menu-decoration-highlight',
											image : tinyMCE.baseURL
													+ '/plugins/wce/img/button_O-new.png',
											onclick : function() {
												_setWceMenuStatus(
														tinyMCE.activeEditor,
														'menu-decoration-highlight');
												_setWceMenuStatus(
														tinyMCE.activeEditor,
														'menu-decoration-highlight',
														/^__t=formatting_capitals/,
														_getWceMenuValStatus,
														'capitals');
											}
										});

								sub.add({
									title : 'Rubrication',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_formatting',
												'rubrication');
									}
								});

								sub.add({
									title : 'Gold',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_formatting', 'gold');
									}
								});

								sub2 = sub.addMenu({
									title : 'Other colour'
								});

								sub2.add({
									title : 'Blue',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_formatting', 'blue');
									}
								});

								sub2.add({
									title : 'Green',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_formatting', 'green');
									}
								});

								sub2.add({
									title : 'Yellow',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_formatting', 'yellow');
									}
								});

								sub2.add({
									title : 'Other',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_formatting', 'other');
									}
								});

								sub.add({
									title : 'Overline',
									onclick : function() {
										tinyMCE.activeEditor
												.execCommand(
														'mceAdd_formatting',
														'overline');
									}
								});

								sub2 = sub.addMenu({
									title : 'Capitals',
									id : 'menu-decoration-highlight-capitals',
									onclick : function() {

									}
								});

								var pattern = /^__t=formatting_capitals/;
								var b = _getWceMenuValStatus('add', pattern);
								sub2
										.add(
												{
													title : 'add',
													id : 'menu-decoration-highlight-capitals-add',
													icons : false,
													onclick : function() {
														tinyMCE.activeEditor
																.execCommand('mceAddCapitals');
													}
												}).setDisabled(b);

								b = _getWceMenuValStatus('edit', pattern);
								sub2
										.add(
												{
													title : 'edit',
													id : 'menu-decoration-highlight-capitals-edit',
													onclick : function() {
														tinyMCE.activeEditor
																.execCommand('mceEditCapitals');
													}
												}).setDisabled(b);

								b = _getWceMenuValStatus('delete', pattern);
								sub2
										.add(
												{
													title : 'delete',
													id : 'menu-decoration-highlight-capitals-delete',
													onclick : function() {
														tinyMCE.activeEditor
																.execCommand('wceDelNode');
													}
												}).setDisabled(b);

								sub = m.addMenu({
									title : 'Insert special characters'
								});

								sub.add({
									title : '\u203B	(cross with dots)',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_pc', '\u203B');
									}
								});

								sub.add({
									title : '&gt;	(diple)',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_pc', '&gt;');
									}
								});

								sub.add({
									title : '\u2020	(obelus)',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_pc', '\u2020');
									}
								});

								sub.add({
									title : '\u00B6	(paragraphus)',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_pc', '\u00B6');
									}
								});

								sub.add({
									title : '\u03A1\u0336	(staurogram)',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_pc', '\u03A1\u0336');
									}
								});

								sub = m.addMenu({
									title : 'Add punctuation'
								});

								sub.add({
									title : ': (colon)',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_pc', ':');
									}
								});

								sub.add({
									title : ', (comma)',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_pc', ',');
									}
								});

								sub.add({
									title : '. (full stop)',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_pc', '.');
									}
								});

								sub.add({ // alternatively
									// \u00B7
									title : '\u0387 (Greek Ano Teleia)',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_pc', '\u0387');
									}
								});

								sub.add({ // alternatively
									// \u003B
									title : '\u037E (Greek question mark)',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_pc', '\u037E');
									}
								});

								sub.add({
									title : '\u02D9 (high dot)',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_pc', '\u02D9');
									}
								});

								sub.add({
									title : '\u0387 (middle dot)',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_pc', '\u0387');
									}
								});

								sub
										.add({
											title : '\u02BC (modifier letter apostophe)',
											onclick : function() {
												tinyMCE.activeEditor
														.execCommand(
																'mceAdd_pc',
																'\u02BC');
											}
										});

								sub.add({
									title : '? (question mark)',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_pc', '?');
									}
								});

								sub.add({
									title : '; (semicolon)',
									onclick : function() {
										tinyMCE.activeEditor.execCommand(
												'mceAdd_pc', '&semicolon;');
									}
								});

								sub = m.addMenu({
									title : 'Blank spaces',
									id : 'menu-decoration-blankspaces',
									onclick : function() {

									}
								});

								var pattern = /^__t=spaces/;
								var b = _getWceMenuValStatus('add', pattern);
								sub
										.add(
												{
													title : 'add',
													id : 'menu-decoration-blankspaces-add',
													icons : false,
													onclick : function() {
														tinyMCE.activeEditor
																.execCommand('mceAddSpaces');
													}
												}).setDisabled(b);

								b = _getWceMenuValStatus('edit', pattern);
								sub
										.add(
												{
													title : 'edit',
													id : 'menu-decoration-blankspaces-edit',
													onclick : function() {
														tinyMCE.activeEditor
																.execCommand('mceEditSpaces');
													}
												}).setDisabled(b);

								b = _getWceMenuValStatus('delete', pattern);
								sub
										.add(
												{
													title : 'delete',
													id : 'menu-decoration-blankspaces-delete',
													onclick : function() {
														tinyMCE.activeEditor
																.execCommand('wceDelNode');
													}
												}).setDisabled(b);

							});

					// Return the new menu button instance
					return c;

				case 'abbreviation' :
					var c = cm.createMenuButton('menu-abbreviation', {
						title : 'Abbreviated text',
						image : tinyMCE.baseURL
								+ '/plugins/wce/img/button_A-new.png',
						icons : false,
						onclick : function() {
							_setWceMenuStatus(tinyMCE.activeEditor,
									'menu-abbreviation', /^__t=abbr/,
									_getWceMenuValStatus);
							// _setWceMenuStatus(tinyMCE.activeEditor,
							// 'menu-abbreviation',
							// /^__t=spaces/,
							// _getWceMenuValStatus,
							// 'blankspaces');
						}
					});

					c.onRenderMenu.add(function(c, m) {
						var pattern = /^__t=abbr/;
						var b = _getWceMenuValStatus('add', pattern);

						m.add({
							title : 'add',
							id : 'menu-abbreviation-add',
							onclick : function() {
								tinyMCE.activeEditor.execCommand('mceAddAbbr');
							}
						}).setDisabled(b);

						b = _getWceMenuValStatus('edit', pattern);
						m.add(
								{
									title : 'edit',
									id : 'menu-abbreviation-edit',
									onclick : function() {
										tinyMCE.activeEditor
												.execCommand('mceEditAbbr');
									}
								}).setDisabled(b);

						b = _getWceMenuValStatus('delete', pattern);
						m.add({
							title : 'delete',
							id : 'menu-abbreviation-delete',
							onclick : function() {
								tinyMCE.activeEditor.execCommand('wceDelNode');
							}
						}).setDisabled(b);
					});

					return c;

				case 'paratext' :
					var c = cm.createMenuButton('menu-paratext', {
						title : 'Paratext',
						image : tinyMCE.baseURL
								+ '/plugins/wce/img/button_P-new.png',
						icons : false,
						onclick : function() {
							_setWceMenuStatus(tinyMCE.activeEditor,
									'menu-paratext', /^__t=paratext/,
									_getWceMenuValStatus);
						}
					});

					c.onRenderMenu
							.add(function(c, m) {
								var pattern = /^__t=paratext/;
								var b = _getWceMenuValStatus('add', pattern);

								m
										.add(
												{
													title : 'add',
													id : 'menu-paratext-add',
													onclick : function() {
														tinyMCE.activeEditor
																.execCommand('mceAddParatext');
													}
												}).setDisabled(b);

								b = _getWceMenuValStatus('edit', pattern);
								m
										.add(
												{
													title : 'edit',
													id : 'menu-paratext-edit',
													onclick : function() {
														tinyMCE.activeEditor
																.execCommand('mceEditParatext');
													}
												}).setDisabled(b);

								b = _getWceMenuValStatus('delete', pattern);
								m
										.add(
												{
													title : 'delete',
													id : 'menu-paratext-delete',
													onclick : function() {
														tinyMCE.activeEditor
																.execCommand('wceDelNode');
													}
												}).setDisabled(b);
							});

					return c;

				case 'note' :
					var c = cm.createMenuButton('menu-note', {
						title : 'Note',
						image : tinyMCE.baseURL
								+ '/plugins/wce/img/button_N-new.png',
						icons : false,
						onclick : function() {
							_setWceMenuStatus(tinyMCE.activeEditor,
									'menu-note', /^__t=note/,
									_getWceMenuValStatus);
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
						m.add(
								{
									title : 'edit',
									id : 'menu-note-edit',
									onclick : function() {
										tinyMCE.activeEditor
												.execCommand('mceEditNote');
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
				if (i == endText.length && i > 0
						&& endText.charAt(i - 1) != ' '
						&& endText.charAt(i - 1) != nbsp)
					break;

				ch = endText.charAt(i);

				if (ch == ' ' || ch == nbsp) {
					if (i > 0
							&& (endText.charAt(i - 1) != ' ' && endText
									.charAt(i - 1) != nbsp))
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

		_wceAddNoDialog : function(ed, className, character, number) {
			var content = ed.selection.getContent();
			var style = 'style="border: 1px  dotted #f00;  margin:0px; padding:0;"';

			switch (className) {
				case 'pc' :
					ed.selection.setContent('<span class="'
							+ ed.wceTypeParamInClass + '=' + className + '"'
							+ style + '>' + character + '</span> ');
					break;
				case 'abbr' :
					style = 'style="border: 1px  dotted #f00;  margin:0px; padding:0;"';
					ed.selection
							.setContent('<span class="'
									+ '__t=abbr&amp;__n=&amp;original_abbr_text=&amp;abbr_type=nomSac&amp;abbr_type_other=&amp;add_overline=&amp;insert=Insert&amp;cancel=Cancel" wce_orig="'
									+ character + '"' + style + '>' + character
									+ '</span> ');
					break;
				case 'brea' :
					style = 'style="border: 1px  dotted #f00;  margin:0px; padding:0; color:#666"';
					if (character == 'lb') { // line break at
						// the end of a
						// word
						if (number === 0) { // for a line break
							// without an
							// explicit number
							number = ++lcnt;
						}
						// var num = "";
						/*
						 * while (num == "") { num = prompt("Number of line
						 * break", ""); }
						 */
						ed.selection
								.setContent('<span class="'
										+ '__t=brea&amp;__n=&amp;break_type=lb&amp;number='
										+ number
										+ '&amp;pb_type=&amp;fibre_type=&amp;running_title=&amp;lb_alignment=&amp;insert=Insert&amp;cancel=Cancel'
										+ '"' + style + '>' + '<br/>'
										+ '&crarr;' + '</span> ');
						lcnt = number;
					} else if (character == 'lbm') { // line
						// break
						// in
						// the
						// middle
						// of a
						// word
						if (number === 0) { // for a line break
							// without an
							// explicit number
							number = ++lcnt;
						}
						// var num = "";
						/*
						 * while (num == "") { num = prompt("Number of line
						 * break", ""); }
						 */
						ed.selection
								.setContent('<span class="'
										+ '__t=brea&amp;__n=&amp;break_type=lb&amp;number='
										+ number
										+ '&amp;pb_type=&amp;fibre_type=&amp;running_title=&amp;lb_alignment=&amp;insert=Insert&amp;cancel=Cancel'
										+ '"' + style + '>'
										+ '&hyphen;<br/>&crarr;' + '</span> ');
						lcnt = number;
					} else if (character == 'cb') { // column
						// break
						if (number === 0) { // for a line break
							// without an
							// explicit number
							number = ++ccnt;
						}
						ed.selection
								.setContent('<br/><span class="'
										+ '__t=brea&amp;__n=&amp;break_type=cb&amp;number='
										+ number
										+ '&amp;pb_type=&amp;fibre_type=&amp;running_title=&amp;lb_alignment=&amp;insert=Insert&amp;cancel=Cancel'
										+ '"' + style + '>' + 'CB' + '</span> ');
						ccnt = number;
					} else if (character == 'pb') { // page
						// break
						var new_number = 0;
						var new_pb_type = "";
						if (number === 0) { // for a page break
							// without an
							// explicit number
							number = ++pcnt;
						}
						pcnt = number;
						new_number = number;

						if (rectoverso === 'true') {
							new_number = Math.ceil(number / 2);
							if (number % 2 == 0) // verso
								// page
								new_pb_type = "v";
							else
								// recto page
								new_pb_type = "r";
						}

						ed.selection
								.setContent('<br/><span class="'
										+ '__t=brea&amp;__n=&amp;break_type=pb&amp;number='
										+ new_number
										+ '&amp;pb_type='
										+ new_pb_type
										+ '&amp;fibre_type=&amp;running_title=&amp;lb_alignment=&amp;insert=Insert&amp;cancel=Cancel'
										+ '"' + style + '>' + 'PB' + '</span> ');

						ed.execCommand('mceAdd_brea', 'cb', '1');
						ed.execCommand('mceAdd_brea', 'lb', '1');
					} else {
						// quire break
						if (number === 0) { // for a line break
							// without an
							// explicit number
							number = ++qcnt;
						}
						ed.selection
								.setContent('<br/><span class="'
										+ '__t=brea&amp;__n=&amp;break_type=gb&amp;number='
										+ number
										+ '&amp;pb_type=&amp;fibre_type=&amp;running_title=&amp;lb_alignment=&amp;insert=Insert&amp;cancel=Cancel'
										+ '"' + style + '>' + 'QB' + '</span> ');
						qcnt = number;
					}
					break;
				case 'part_abbr' : // part-worded abbreviations
					var rng = ed.selection.getRng(true);
					var startNode = rng.startContainer;
					var startText = startNode.data
							? startNode.data
							: startNode.innerText;
					var text = startText.substr(0, rng.startOffset);
					var li = text.lastIndexOf('(');
					if (li > -1) {
						var part_abbr = text.substr(li) + ')';
						startNode.data = startText.substr(rng.endOffset);
						ed.selection.setContent('<span class="'
								+ ed.wceTypeParamInClass + '=' + className
								+ '"' + style + '>' + part_abbr + '</span>');
						startNode.data += startText.substr(0, text
								.lastIndexOf('('));
					} else {
						alert("Error at part-worded abbreviation. Parentheses do not match or invalid nesting!");
					}
					break;
				/*
				 * case 'formatting_capitals': //Capitals
				 * ed.selection.setContent('<span class="' +
				 * ed.wceTypeParamInClass + '=' + className + '&amp;height=' +
				 * character + '"' + style + '>' + content + '</span>'); break;
				 */
				case 'unclear' : // uncertain letters
					selection = ed.selection.getContent();
					var unclear_text = "";
					var newContent = "";
					var word = "";
					var unclear_text = "";
					for ( var i = 0; i < selection.length; i++) { // Divide
						// input
						// into
						// words
						if (selection.charAt(i) == ' ') { // Space
							// ->
							// new
							// word
							newContent += '<span class="__t=unclear&amp;__n=&amp;original_text='
									+ word
									+ '&amp;insert=Insert&amp;cancel=Cancel"'
									+ 'style="border: 1px  dotted #f00; margin: 0px 1px 0px 1px; padding: 0;">'
									+ unclear_text + '</span> ';
							word = "";
							unclear_text = "";
						} else {
							word += selection.charAt(i);
							unclear_text += selection.charAt(i) + '&#x0323;';
						}
					}
					// add last part of selection
					newContent += '<span class="__t=unclear&amp;__n=&amp;original_text='
							+ word
							+ '&amp;insert=Insert&amp;cancel=Cancel"'
							+ 'style="border: 1px  dotted #f00; margin: 0px 1px 0px 1px; padding: 0;">'
							+ unclear_text + '</span>';
					ed.selection.setContent(newContent);
					break;
				case 'ghostpage' : // Ghost page
					style = 'style="border: 1px  dotted #f00;  margin:0px; padding:0; color:#666"';
					ed.selection
							.setContent('<span class="__t=gap&amp;__n=&amp;original_gap_text=&amp;gap_reason=absent&amp;unit=page&amp;unit_other=&amp;extent=1&amp;supplied_source=na27&amp;supplied_source_other=&amp;insert=Insert&amp;cancel=Cancel"'
									+ style + '>Ghost page</span>');
					break;
				default :
					ed.selection.setContent('<span class="'
							+ ed.wceTypeParamInClass + '=' + className + '"'
							+ style + '>' + content + '</span>');
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
			var _getWceMenuValStatus = this._getWceMenuValStatus;

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
				'z-index' : '300000',
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
					}, '<input type="checkbox" checked="checked"  id="' + id
							+ '"> Adaptive selection</input>');
				}
			});

			// TEST: //Nur wenn Tastate "Entf" aktiviert
			// Ueberpruefen, ob Cursor
			// direkt vor oder nach Verse ist
			ed
					.addCommand(
							"testVerseOrChapterBeforeDel",
							function(ek) {
								if (ek != 46)
									return 0;

								/*
								 * Löschen mit 'Entf' wird rng.startOffset in IE
								 * nicht richtig akutallisiert vorl?ufige L?sung
								 * mit Bookmark, nicht 100% funktioniert, /*
								 * if($.browser.msie){ var
								 * bm=ed.selection.getBookmark();
								 * ed.selection.moveToBookmark(bm); }
								 */
								var rng = ed.selection.getRng(true);
								var startNode = rng.startContainer;
								var startText = startNode.data
										? startNode.data
										: startNode.innerText;
								var nodeSibling;

								if (ek == 8 && rng.startOffset == 0
										&& typeof (startText) != 'undefined') {
									nodeSibling = startNode.previousSibling;
								} else if (ek == 46
										&& ((typeof (startText) != 'undefined' && rng.startOffset >= startText.length) || (typeof (startText) == 'undefined' && typeof (startNode) != 'undefined'))) {
									nodeSibling = startNode.nextSibling;
								} else
									return 0;

								if (typeof (nodeSibling) != 'undefined'
										&& nodeSibling != null) {
									return ed.execCommand(
											'testNodeIsVerseOrChapter',
											nodeSibling);
								} else {
									return ed.execCommand(
											'testNodeParentIsVerseOrChapter',
											startNode);
								}
								return 0;
							});

			// TEST: //Nur wenn Tastate "Entf" aktiviert
			ed.addCommand('testNodeParentIsVerseOrChapter', function(_node) {
				var _parentNode = _node.parentNode, _nextSibling;
				if (typeof (_parentNode) != 'undefined'
						&& !_parentNode.nodeName.match(/body/i)) {
					_nextSibling = _parentNode.nextSibling;
					if (typeof (_nextSibling) != 'undefined'
							&& _nextSibling != null) {
						return ed.execCommand('testNodeIsVerseOrChapter',
								_nextSibling);
					} else {
						return ed.execCommand('testNodeParentIsVerseOrChapter',
								_parentNode);
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
				if (typeof (_parentNode) != 'undefined'
						&& !_parentNode.nodeName.match(/body/i)) {
					return t(_parentNode);
					// return
					// ed.execCommand('testParentIsVereOrChapter',_parentNode);
				}
				return ed.execCommand('testNodeIsVerseOrChapter', _node);
			});

			// Ueberpruefen, ob ausgewaehlter
			// Text verse nummer hat
			ed
					.addCommand(
							"wceContentHasVerse",
							function() {
								var _sel = ed.selection;

								// Auswahl hat verse
								if (_sel.getContent().match(
										/<span\s*class=\"verse_number"\s*>/)
										|| _sel
												.getContent()
												.match(
														/<span\s*class=\"chapter_number"\s*>/)) {
									return 1;
								}

								// Auswahl in verse
								var _selNode = _sel.getNode();
								if (typeof (_selNode) != 'undefined'
										&& _selNode != null) {
									return ed.execCommand(
											'testParentIsVereOrChapter',
											_selNode);
								}

								return 0;
							});

			// TEI xmloutput
			ed.addCommand('mceXmloutput', function() {
				_wceAdd(ed, url, '/xmloutput.htm', 580, 620, 1, true);

			});

			// add TEI xmloutput button
			ed.addButton('xmloutput', {
				title : 'XML Output',
				cmd : 'mceXmloutput',
				image : url + '/img/xml.jpg'
			});

			/*
			 * onInit
			 * 
			 */
			ed.onInit
					.add(function() {
						tinymce.dom.Event.add(ed.getDoc(), 'dblclick',
								function(e) {
								});

						tinymce.dom.Event.add(ed.getDoc(), 'mousemove',
								function(e) {
									_this._showWceInfo(ed, e);
								});

						tinymce.dom.Event.add(ed.getDoc(), 'mouseup', function(
								e) {
							if (!ed.selection.isCollapsed()) {
								_this._adaptiveSelection();
							}
						});
						tinymce.dom.Event.add(ed.getDoc(), 'keyup',
								function(e) {
									if (!ed.wceKeydownBlock) {
										ed.isNotDirty = 0;
									}
								});

						tinymce.dom.Event
								.add(
										ed.getDoc(),
										'keypress',
										function(e) {
											if (!e)
												var e = window.event;
											var ek = e.keyCode || e.charCode
													|| 0;

											if (ek == 13 || ek == 10) { // Enter
												// e.stopPropagation
												// works only in
												// Firefox.
												if (e.stopPropagation) {
													e.stopPropagation();
													e.preventDefault();
												}
												if (e.shiftKey) {// Shift+Enter
													// ->
													// break
													// dialogue
													if (!_getWceMenuValStatus(
															'add',
															'/^__t=brea/'))
														tinyMCE.activeEditor
																.execCommand('mceAddBreak');
												} else { // Enter
													// ->
													// line
													// break
													var rng = ed.selection
															.getRng(true);
													var startNode = rng.startContainer;
													var startText = startNode.data
															? startNode.data
															: startNode.innerText;

													if (rng.startOffset == _getNextEnd(
															startText,
															rng.startOffset)) { // at
														// the
														// end
														// of a
														// word
														_wceAddNoDialog(ed,
																'brea', 'lb',
																++lcnt);
													} else { // in
														// the
														// middle
														// of a
														// word
														_wceAddNoDialog(ed,
																'brea', 'lbm',
																++lcnt);
													}
												}
											}
											return;
										});

						// versernumber schuetzen
						// TODO: testen, ob Editor Focus hat
						tinymce.dom.Event
								.add(
										ed.getDoc(),
										'keydown',
										function(e) {
											if (!e)
												var e = window.event;
											var ek = e.keyCode || e.charCode
													|| 0;
											var delBlock = false;
											ed.wceKeydownBlock = false;

											if (ek == 17
													|| (ek > 32 && ek < 41))
												return;

											// Add <pc> for some
											// special
											// characters
											if (ek == 59 && !e.shiftKey) { // ; en
												tinyMCE.activeEditor
														.execCommand(
																'mceAdd_pc',
																';');
												e.preventDefault();
												e.stopPropagation();
											} else if (ek == 188 && e.shiftKey) { // ; dt
												// < en
												tinyMCE.activeEditor
														.execCommand(
																'mceAdd_pc',
																';');
												e.preventDefault();
												e.stopPropagation();
											} else if (ek == 188 && !e.shiftKey) { // ,
												tinyMCE.activeEditor
														.execCommand(
																'mceAdd_pc',
																',');
												e.preventDefault();
												e.stopPropagation();
											} else if (ek == 190 && !e.shiftKey) { // .
												tinyMCE.activeEditor
														.execCommand(
																'mceAdd_pc',
																'.');
												e.preventDefault();
												e.stopPropagation();
											} else if (ek == 191 && e.shiftKey) { // ? en
												tinyMCE.activeEditor
														.execCommand(
																'mceAdd_pc',
																'?');
												e.preventDefault();
												e.stopPropagation();
											} else if (ek == 219 && e.shiftKey) { // ? dt
												tinyMCE.activeEditor
														.execCommand(
																'mceAdd_pc',
																'?');
												e.preventDefault();
												e.stopPropagation();
											}

											if (ek == 56 && e.shiftKey) // (
											{

											}

											if (ek == 57 && e.shiftKey) // )
											{
												// Find
												// corresponding
												// ( and create
												// substring
												e.preventDefault();
												e.stopPropagation();
												// e.stopImmediatePropagation();
												_wceAddNoDialog(ed,
														'part_abbr', '');
											}
											// Tastate "Entf"
											// deaktivieren
											// if(ek==46)
											// delBlock=true;

											var delBlockArr = ['paratext',
													'gap', 'note', 'spaces',
													'brea'];
											if (_this._contentHasWceClass(ed,
													delBlockArr)) {
												delBlock = true;
											}

											if (ek == 46) {
												if ((_this._contentHasWceClass(
														ed, ['brea']) && _getWceMenuValStatus(
														'delete', '/^__t=brea/'))
														|| (_this
																._contentHasWceClass(
																		ed,
																		['paratext']) && _getWceMenuValStatus(
																'delete',
																'/^__t=paratext/'))
														|| (_this
																._contentHasWceClass(
																		ed,
																		['gap']) && _getWceMenuValStatus(
																'delete',
																'/^__t=gap/'))
														|| (_this
																._contentHasWceClass(
																		ed,
																		['note']) && _getWceMenuValStatus(
																'delete',
																'/^__t=note/'))
														|| (_this
																._contentHasWceClass(
																		ed,
																		['spaces']) && _getWceMenuValStatus(
																'delete',
																'/^__t=spaces/'))) {
													tinyMCE.activeEditor
															.execCommand('wceDelNode');
												}
											}

											// Browser außer IE
											if (!delBlock && !$.browser.msie
													&& ek == 8) {
												var rng = ed.selection
														.getRng(true);
												var startNode = rng.startContainer;
												var startText = startNode.data
														? startNode.data
														: startNode.innerText;

												if (rng.startOffset == 0
														&& typeof (startText) != 'undefined') {
													var nodeSibling = startNode.previousSibling;
													if (typeof (nodeSibling) != 'undefined'
															&& nodeSibling != null) {
														if (ed
																.execCommand(
																		'testNodeIsVerseOrChapter',
																		nodeSibling)) {
															delBlock = true;
														}
													} else if (ed
															.execCommand(
																	'testNodeParentIsVerseOrChapter',
																	startNode)) {
														delBlock = true;
													}
												}
											}

											// TEST: Nur wenn
											// Tastate "Entf"
											// aktiviert
											if (!delBlock
													&& ed
															.execCommand(
																	'testVerseOrChapterBeforeDel',
																	ek) == 1) {
												delBlock = true;
											}

											// TEST: Tastate
											// "Entf" aktiviert
											if (ed
													.execCommand(
															'testVerseOrChapterBeforeDel',
															ek) == 1)
												delBlock = true;

											if (!delBlock
													&& ed
															.execCommand('wceContentHasVerse') == 1) {
												delBlock = true;
											}

											if (delBlock) {
												ed.wceKeydownBlock = true;
												// if(!ed.selection.isCollapsed())
												if ($.browser.msie) {
													// Entfernen-Key
													// deaktivieren
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
				if (typeof className != 'undefined' && className != ''
						&& className.indexOf(ed.wceTypeParamInClass) == 0) {
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
					var originalText = wceNode.getAttribute('wce_orig');

					/*
					 * // if tag to remove var node_to_remove = [ 'paratext',
					 * 'note', 'gap', 'brea' ]; var to_remove = false; for ( var
					 * i = 0; i < node_to_remove.length; i++) { if
					 * (wce_class_name.indexOf(ed.wceTypeParamInClass + '=' +
					 * node_to_remove[i]) > -1) { to_remove = true; break; } }
					 * 
					 * if (to_remove) { $(wceNode).remove(); } else if (typeof
					 * originalText != 'undefined') {
					 * ed.selection.setContent(originalText);alert(originalText); }
					 */
					wceNode.parentNode.removeChild(wceNode);

					if (originalText)
						ed.selection.setContent(originalText);

					ed.isNotDirty = 0;
				}
			});

			// Add breaks
			ed.addCommand('mceAddBreak', function() {
				_wceAdd(ed, url, '/break.htm?mode=new&quire=' + ++qcnt
						+ '&page=' + ++pcnt + '&column=' + ++ccnt + '&line='
						+ ++lcnt + '&rectoverso=' + rectoverso, 480, 320, 1,
						true);
			});
			// Edit breaks
			ed.addCommand('mceEditBreak', function() {
				_wceAdd(ed, url, '/break.htm?mode=edit&quire=' + ++qcnt
						+ '&page=' + ++pcnt + '&column=' + ++ccnt + '&line='
						+ ++lcnt + '&rectoverso=' + rectoverso, 480, 320, 1,
						false);
			});

			ed.addCommand('mceAddBreak_Shortcut', function() {
				if (!_getWceMenuValStatus('add', '/^__t=brea/'))
					ed.execCommand('mceAddBreak');
				else if (_getWceMenuValStatus('edit', '/^__t=brea/'))
					ed.execCommand('mceEditBreak');
			});

			// Add corrections
			ed.addCommand('mceAddCorrection', function() {
				if (ed.execCommand('wceContentHasVerse'))
					return true;

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
				_wceAdd(ed, url, '/correction.htm', 800, 600, 1,
						_add_new_wce_node);
			});
			// Edit corrections
			ed.addCommand('mceEditCorrection', function() {
				_wceAdd(ed, url, '/correction.htm', 480, 320, 1, false);
			});

			ed.addCommand('mceAddCorrection_Shortcut', function() {
				ed.execCommand('mceAddCorrection');
			});

			// Add gaps/*********/
			ed.addCommand('mceAddGap', function() {
				_wceAdd(ed, url, '/gap.htm', 480, 320, 1, true);
			});
			// Edit gaps and spacing
			ed.addCommand('mceEditGap', function() {
				_wceAdd(ed, url, '/gap.htm', 480, 320, 1, false);
			});

			ed.addCommand('mceAddGap_Shortcut', function() {
				if (!_getWceMenuValStatus('add', '/^__t=gap/'))
					ed.execCommand('mceAddGap');
				else if (_getWceMenuValStatus('edit', '/^__t=gap/'))
					ed.execCommand('mceEditGap');
			});

			// Add unclear text/*********/
			ed.addCommand('mceAddUnclearText', function() {
				// _wceAddNoDialog(ed, 'unclear'); //option
				// without dialogue for reason
				_wceAdd(ed, url, '/unclear_text.htm', 480, 320, 1, true);
			});
			// Edit unclear text
			ed.addCommand('mceEditUnclearText', function() {
				_wceAdd(ed, url, '/unclear_text.htm', 480, 320, 1, false);
			});

			ed.addCommand('mceAddUnclearText_Shortcut', function() {
				if (!_getWceMenuValStatus('add', '/^__t=unclear/'))
					ed.execCommand('mceAddUnclearText');
				else if (_getWceMenuValStatus('edit', '/^__t=unclear/'))
					ed.execCommand('mceEditUnclearText');
			});

			ed.addCommand('mceAddGhostPage', function() {
				_wceAddNoDialog(ed, 'ghostpage');
			});

			// Add note/*********/
			ed.addCommand('mceAddNote', function() {
				_wceAdd(ed, url, '/note.htm', 480, 380, 1, true);
			});
			// Edit note
			ed.addCommand('mceEditNote', function() {
				_wceAdd(ed, url, '/note.htm', 480, 380, 1, false);
			});

			ed.addCommand('mceAddNote_Shortcut', function() {
				if (!_getWceMenuValStatus('add', '/^__t=note/'))
					ed.execCommand('mceAddNote');
				else if (_getWceMenuValStatus('edit', '/^__t=note/'))
					ed.execCommand('mceEditNote');
			});

			// Add abbreviation/*********/
			ed.addCommand('mceAddAbbr', function() {
				_wceAdd(ed, url, '/abbr.htm', 480, 320, 1, true);
			});
			// Edit abbreviation
			ed.addCommand('mceEditAbbr', function() {
				_wceAdd(ed, url, '/abbr.htm', 480, 320, 1, false);
			});

			ed.addCommand('mceAddAbbr_Shortcut', function() {
				if (!_getWceMenuValStatus('add', '/^__t=abbr/'))
					ed.execCommand('mceAddAbbr');
				else if (_getWceMenuValStatus('edit', '/^__t=abbr/'))
					ed.execCommand('mceEditAbbr');
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

			ed.addCommand('mceAddParatext_Shortcut', function() {
				if (!_getWceMenuValStatus('add', '/^__t=paratext/'))
					ed.execCommand('mceAddParatext');
				else if (_getWceMenuValStatus('edit', '/^__t=paratext/'))
					ed.execCommand('mceEditParatext');
			});

			// Edit Metadata
			/*
			 * ed.addCommand('mceAddMetadata', function() { _wceAdd(ed, url,
			 * '/metadata.htm', 600, 450, 1, false); });
			 */

			ed.addCommand('mceAdd_abbr', function(c) {
				_wceAddNoDialog(ed, 'abbr', c);
			});

			ed.addCommand('mceAdd_brea', function(c, number) {
				_wceAddNoDialog(ed, 'brea', c, number);
			});

			ed.addCommand('mceAdd_pc', function(c) {
				_wceAddNoDialog(ed, 'pc', c);
			});

			ed.addCommand('mceAddCapitals', function() {
				_wceAdd(ed, url, '/capitals.htm', 480, 320, 1, true);
			});

			ed.addCommand('mceEditCapitals', function() {
				_wceAdd(ed, url, '/capitals.htm', 480, 320, 1, false);
			});

			ed.addCommand('mceAdd_formatting', function(c) {
				_wceAddNoDialog(ed, 'formatting_' + c, '');
			});

			ed.addCommand('setCounter', function(bt, n) {
				// First reset counters
				qcnt--;
				pcnt--;
				ccnt--;
				lcnt--;
				// set only the one correct counter
				switch (bt) {
					case 'gb' :
						qcnt = n;
						break;
					case 'pb' :
						pcnt = n;
						break;
					case 'cb' :
						ccnt = n;
						break;
					case 'lb' :
						lcnt = n;
						break;
				}
			});

			ed.addCommand('resetCounter', function() { // reset
				// counter
				// values
				// when
				// pressing
				// "Cancel"
				// at
				// the
				// break
				// dialog
				qcnt--;
				pcnt--;
				ccnt--;
				lcnt--;
			});

			ed.addCommand('addToCounter', function(bt, n) {
				switch (bt) {
					case 'gb' :
						qcnt = parseInt(qcnt) + parseInt(n);
						break;
					case 'pb' :
						pcnt = parseInt(pcnt) + parseInt(n);
						break;
					case 'cb' :
						ccnt = parseInt(ccnt) + parseInt(n);
						break;
					case 'lb' :
						lcnt = parseInt(lcnt) + parseInt(n);
						break;
				}
			});
			/*
			 * *****************************************************************************
			 * *****************************************************************************
			 * ******************************************************************************
			 * ***************************** XML OUTPUT
			 * ************************************
			 * ******************************************************************************
			 * ******************************************************************************
			 * ******************************************************************************
			 */
			// getTEIXml
			var _gtx = function(inputString, gBookIndex) {
				if (!inputString || $.trim(inputString) == '')
					return '';

				var nodeNamesToSkip = ['pc', 'fw', 'num', 'note', 'unclear',
						'supllied', 'abbr', 'w'];

				var nodeNamesToCompress = ['unclear', 'gap', 'supplied',
						'abbr', 'part_abbr', 'ex'];

				var nodesToCompress = [];

				// TODO:
				var gBookIndex = 1;
				var gPage = 0;
				var gColumn = 0;
				var gWit = '?';

				var gIndex_s = 0;

				/*
				 * return String of TEI-Format XML
				 */
				var getXML = function() {
					inputString = '<TEMP><div><ab>' + inputString
							+ '</ab></div></TEMP>';

					var $xml = loadXMLString(inputString);
					var $root = $xml.documentElement;
					transformNodes($root);
					compressNodes($root);

					// DOM to String
					var str = xml2String($root);
					if (!str)
						return '';

					str = str.substring(6, str.length - 7);
					return str;
				};

				/*
				 * load txt and generate DOM object
				 */
				var loadXMLString = function(txt) {
					if (window.DOMParser) {
						parser = new DOMParser();
						xmlDoc = parser.parseFromString(txt, "text/xml");
					} else {
						// Internet Explorer
						xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
						xmlDoc.async = false;
						xmlDoc.loadXML(txt);
					}
					return xmlDoc;
				};

				/*
				 * Read xml file to generate the DOM object
				 */
				var loadXMLDoc = function(dname) {
					if (window.XMLHttpRequest) {
						xhttp = new XMLHttpRequest();
					} else {
						xhttp = new ActiveXObject("Microsoft.XMLHTTP");
					}
					xhttp.open("GET", dname, false);
					xhttp.send();
					return xhttp.responseXML;
				};

				/*
				 * converted DOM into a string
				 * 
				 */
				var xml2String = function(xmlNode) {
					try {
						// Gecko- and Webkit-based browsers
						// (Firefox,
						// Chrome), Opera.
						return (new XMLSerializer()).serializeToString(xmlNode);
					} catch (e) {
						try {
							// Internet Explorer.
							return xmlNode.xml;
						} catch (e) {
							// Other browsers without XML
							// Serializer
							alert('Xmlserializer not supported');
						}
					}
					return false;
				};

				/*
				 * Get the first parentNode by name
				 */
				var getParentByName = function($node, na) {
					var $parent = $node.parentNode;
					while ($parent) {
						if ($parent.tagName == na) {
							return $parent;
						}
						$parent = $parent.parentNode;
					}
					return null;
				};

				/*
				 * Get node List of all Child
				 */
				var getChildNodeList = function(node) {
					var nodeList = node.childNodes;
					var curr;
					var temp = new Array();
					for ( var i = 0, l = nodeList.length; i < l; i++) {
						curr = nodeList.item(i);
						temp.push(curr);
					}

					return temp;
				};

				/*
				 * change all Node nodes
				 */
				var transformNodes = function($node) {
					if ($node.nodeType == 3) {
						transformText($node);
						return;
					}

					$node = changeNode($node);
					if ($node == null) {
						return;
					}
					if ($.inArray($node.nodeName, nodeNamesToSkip) > -1) {
						return;
					}

					var nodeList = getChildNodeList($node);
					var curr;
					for ( var i = 0, l = nodeList.length; i < l; i++) {
						curr = nodeList[i];
						if (curr == null) {
							continue;
						}
						transformNodes(curr);
					}
				};

				/*
				 * change text nodes
				 */
				var transformText = function($node) {
					var $xml = $node.ownerDocument;
					var str = $node.nodeValue;
					var first = last = false;
					if (str.match(/^\s+/)) {
						first = true;
					}
					if (str.match(/\s+$/)) {
						last = true;
					}

					var $parent = $node.parentNode;
					var arr = str.split(' ');
					var a;
					for ( var i = 0, l = arr.length; i < l; i++) {

						a = arr[i];
						if (a == '')
							continue;

						var $w = $xml.createElement('w');

						// wenn davor unmittelbar ein node ist
						if (first == false && i == 0
								&& $node.previousSibling != null) {
							if (!$node.previousSibling.getAttribute('_s')) {
								gIndex_s++;
								$node.previousSibling.setAttribute('_s',
										gIndex_s);
							}

							$w.setAttribute('_s', gIndex_s);
						}

						// wenn dahitern unmittelbar ein node
						// ist
						var $next = $node.nextSibling;
						if (last == false && i == l - 1 && $next
								&& $next.nodeType != 3) {
							if (!$w.getAttribute('_s')) {
								gIndex_s++;
								$w.setAttribute('_s', gIndex_s + " a");
							}

							if (isNodeToCompress($next)) {
								$next.setAttribute('_s', gIndex_s);
							}
						}
						nodeAddText($w, a);
						$parent.insertBefore($w, $node);
					}
					$node.nodeValue = '';
				};

				/*
				 * 
				 */
				var isNodeToCompress = function($node) {
					if (!$node)
						return false;
					var _classText = $node.getAttribute('class');
					if (_classText) {
						var _name;
						for ( var i = 0, l = nodeNamesToCompress.length; i < l; i++) {
							_name = nodeNamesToCompress[i];
							if (_classText.indexOf('__t=' + _name) > -1) {
								return true;
							}
						}
					}
					return false;
				};

				/*
				 * rename Node name
				 */
				var renameNodeName = function($oldNode, newName) {
					$xmlDoc = $oldNode.ownerDocument;
					var $newNode = $xmlDoc.createElement(newName);
					cloneChildren($oldNode, $newNode);
					$oldNode.parentNode.replaceChild($newNode, $oldNode);
					return $newNode;
				};

				/*
				 * Clone the child nodes
				 */
				var cloneChildren = function($parent, $newParent) {
					var $chn = $parent.childNodes;
					var $curr, $cc;
					for ( var i = 0, l = $chn.length; i < l; i++) {
						$curr = $chn.item(i);
						$cc = $curr.cloneNode(true);
						$newParent.appendChild($cc);
					}
				};

				var nodeAddText = function($node, str) {
					if (str) {
						$node.appendChild($node.ownerDocument
								.createTextNode(str));
					}
				};

				/*
				 * String converted into an array
				 */
				var strToArray = function(str) {
					var outArr = new Array();
					var arr0 = str.split('@');
					var k0, v0, k1, v1, k2, v2, arr1, arr2;
					for (k0 in arr0) {
						v = arr0[k0];
						outArr[k0] = new Array();
						arr1 = v.split('&');
						for (p1 in arr1) {
							v1 = arr1[p1];
							arr2 = v1.split('=');
							if (arr2.length > 0) {
								k2 = arr2[0];
								v2 = arr2[1];
								try {
									outArr[k0][k2] = v2;
								} catch (e) {
									alert(e);
								}
							}
						}
					}
					return outArr;
				};

				// wenn node unclear gap supplied ... ist, set <w>
				var insertElementW = function($span, $newNode) {
					var $xml = $span.ownerDocument;
					var $w = $xml.createElement('w');
					$w.appendChild($newNode);

					if ($span.getAttribute('_s')) {
						$w.setAttribute('_s', $span.getAttribute('_s'));
					}

					return $w;
				};

				/*
				 * Element inside a word
				 */
				var compressNodes = function($node) {
					// alle w-node, die type-node integrieren
					if (!$node)
						return;

					$xml = $node.ownerDocument;

					getNodesToCompress($node);
					return;

					var s = 0, _s;
					var $n, $startNode;
					for ( var i = 0; i < nodesToCompress.length; i++) {
						$n = nodesToCompress[i];
						_s = $n.getAttribute('_s');
						$n.removeAttribute('_s');
						if (_s != s) {
							if ($n.nodeName == 'w') {
								$startNode = $n;
							} else {
								$startNode = null;
							}
							s = _s;
						} else if (_s > 0 && $startNode) {
							if ($n.nodeName == 'w') {
								removeChildFromTo($n, $startNode);
								$n.parentNode.removeChild($n);
							} else {
								// $startNode.appendChild($n);
							}
						}
					}
				};

				/*
				 * move all child nodes from x to y
				 */
				var removeChildFromTo = function($from, $to) {
					var list = $from.childNodes;
					var $curr;
					for ( var i = 0, l = list.length; i < l; i++) {
						$curr = list.item(i);
						$to.appendChild($c);
					}
				};

				/* Find all the nodes to be compress */
				var getNodesToCompress = function($node) {
					if ($node.nodeType != 3) {
						if ($node.getAttribute('_s'))
							nodesToCompress.push($node);
					}
					var list = $node.childNodes;
					var $curr;
					for ( var i = 0, l = list.length; i < l; i++) {
						$curr = list.item(i);
						getNodesToCompress($curr);
					}

				};

				/*
				 * html-node to TEI-XML-node
				 */
				var changeNode = function($node) {
					if ($node.nodeType == 3)
						return $node;

					var classValue = $node.getAttribute('class');
					if (classValue == null || classValue == '') {
						return $node;
					}

					/* type: chapter_number, verse_number */
					switch (classValue) {
						case 'chapter_number' :
							// <div type="chapter" n="B4K1">
							var $div = getParentByName($node, 'div');
							if ($div != null) {
								$div.setAttribute('type', 'chapter');
								var chapter_number = $node.childNodes[0].nodeValue;
								$div.setAttribute('n', 'B' + gBookIndex + 'K'
										+ chapter_number);
							}

							var $ab = getParentByName($node, 'ab');
							if ($ab != null) {
								$ab.removeChild($node);
							}
							return null;

						case 'verse_number' :
							var $ab = getParentByName($node, 'ab');
							if ($ab != null) {
								var verse_number = $node.childNodes[0].nodeValue;
								$ab.setAttribute('n', '???' + verse_number);
								$ab.removeChild($node);
							}
							return null;

					}

					// ******************** br
					// ********************
					if ($node.nodeName == 'br') {
						$node.parentNode.removeChild($node);
						return null;
					}

					/* other type */
					var infoArr = strToArray(classValue);
					if (infoArr == null) {
						return $node;
					}

					var type = '';
					var $xml = $node.ownerDocument;
					var $clone = $node.cloneNode(true);
					var $newNode;
					var arr;
					var xml_id;

					for ( var i = 0, l = infoArr.length; i < l; i++) {

						// ******************** corr
						// ********************
						// app und original einfügen
						arr = infoArr[i];
						xml_id = null;

						if (arr['__t'] === 'corr') {
							if (type == '') {
								type = 'corr';
								// 新建<app>
								$newNode = $xml.createElement('app');
								$node.parentNode.replaceChild($newNode, $node);

								// 新建<rdg>
								// <rdg type="orig"
								// hand="firsthand"><w
								// n="17">ατενιζεται</w>
								// <pc>?</pc></rdg>
								var $orig = $xml.createElement('rdg');
								$orig.setAttribute('type', 'orig');
								$orig.setAttribute('hand', 'firsthand');

								// all children拷贝到<rdg>
								// 排列<app><rdg>
								cloneChildren($clone, $orig);
								$newNode.appendChild($orig);
							}
							if ($newNode && type === 'corr') {
								// 新建<rdg>,添加到上面的<app>($newNode)里面
								var $rdg = $xml.createElement('rdg');
								$rdg.setAttribute('type', arr['reading']);
								$rdg
										.setAttribute('hand',
												arr['corrector_name']);

								// deletion
								var deletion = arr['deletion'];
								if (deletion != 'null' && deletion != '') {
									$rdg.setAttribute('deletion', deletion
											.replace(',', '+'));
								}
								// editorial_note
								var editorial_note = arr['editorial_note'];
								if (editorial_note != '') {
									var $note = $xml.createElement('note');
									$note.setAttribute('type', 'transcriber');
									var _line = '';// TODO
									xml_id = 'P' + gPage + 'C' + gColumn + 'L'
											+ _line + '-' + gWit + '-1';
									$note.setAttribute('xml:id', xml_id);// TODO:
									nodeAddText($note, editorial_note);

									$newNode.parentNode.insertBefore($note,
											$newNode.nextSibling);
								}

								cloneChildren($clone, $rdg);
								$newNode.appendChild($rdg);
							}
							continue;
						}

						// ******************** break
						// ********************
						/*
						 * break_type= lb / cb /qb / pb number= pb_type=
						 * running_title= lb_alignment=
						 */
						if (type == '' && arr['__t'].match(/brea/)) {
							// $index['lb']++;//TODO: attribute
							// n, hier nur
							// fuer automatisch
							/*
							 * Page (Collate |P 121|): <pb n="121" type="page"
							 * xml:id="P121-wit" /> Folio (Collate |F 3v|): <pb
							 * n="3v" type="folio" xml:id="P3v-wit" /> Column
							 * (Collate |C 2|): <cb n="2" xml:id="P3vC2-wit" />
							 * Line (Collate |L 37|): <lb n="37"
							 * xml:id="P3vC2L37-wit" />
							 */
							var hadBreak = false;
							var breakNodeText = $node.text;
							if (breakNodeText
									&& breakNodeText.substr(0,
											"&hyphen;".length) == "&hyphen;") {
								hadBreak = true;
							}

							var break_type = arr['break_type'];
							if (break_type == 'gb') {
								// special role of quire breaks
								$newNode = $xml.createElement('gb');
								$newNode.setAttribute('n', arr['number']);
							} else if (break_type) {
								// pb, cb, lb
								$newNode = $xml.createElement(break_type);
								switch (break_type) {
									case 'lb' :
										$newNode.setAttribute('n',
												arr['number']);
										if (arr['lb_alignment'] != '') {
											$newNode.setAttribute('rend',
													arr['lb_alignment']);
										}
										xml_id = 'P' + gPage + 'C' + gColumn
												+ 'L' + arr['number'] + '-'
												+ gWit;
										break;
									case 'cb' :
										var brea_column = arr['number'];
										$newNode.setAttribute('n', brea_column);
										xml_id = 'P' + gPage + 'C'
												+ brea_column + '-' + gWit;
										break;
									case 'pb' :
										// Decide whether folio
										// or page
										if (arr['pb_type'] != ''
												|| arr['fibre_type'] != '') {
											// folio
											brea_page = arr['number']
													+ arr['pb_type']
													+ arr['fibre_type'];
											$newNode.setAttribute('n',
													brea_page);
											$newNode.setAttribute('type',
													'folio');
										} else {
											// page
											brea_page = arr['number'];
											$newNode.setAttribute('n',
													brea_page);
											$newNode.setAttribute('type',
													'page');
										}
										if (arr['facs'] != '') {
											// use URL for facs
											// attribute
											$newNode.setAttribute('facs',
													arr['facs']);
										}
										xml_id = 'P' + brea_page + '-' + gWit;
										break;
								}
								$newNode.setAttribute('xml:id', xml_id);
								if (hadBreak)
									$newNode.setAttribute('break', 'no');
							}
							$node.parentNode.replaceChild($newNode, $node);

							if (break_type == 'lb') {
								// for lb add newline
								$newNode.parentNode.insertBefore($xml
										.createTextNode("\n"), $newNode);
							} else if (break_type == 'pb') {
								// for pb add fw elements
								if (arr['running_title'] != '') {
									$secNewNode = $xml.createElement('fw');
									$secNewNode
											.setAttribute('type', 'runTitle');
									nodeAddText($secNewNode,
											arr['running_title']);
									$newNode.parentNode.insertBefore(
											$secNewNode, $newNode.nextSibling);
								}
								if (arr['page_number'] != '') {
									$secNewNode = $xml.createElement('fw');
									$secNewNode.setAttribute('type', 'PageNum');
									nodeAddText($secNewNode, arr['page_number']);
									$newNode.parentNode.insertBefore(
											$secNewNode, $newNode.nextSibling); // TODO
									// better
									// use
									// function
									// appendSibling
								}
							}
							continue;
						}

						// ******************** formatting
						// ********************
						/*
						 * __t=formatting_rubrication <hi rend="rubric">...</hi>
						 * __t=formatiing_gold <hi rend="gold">...</hi>
						 * __t=formatting_capitals <hi rend="cap" height="4">...</hi>
						 * __t=formatting_overlines <hi rend="ol">...</hi>
						 */
						if (type == '' && arr['__t'].match(/formatting/)) {
							$newNode = $xml.createElement('w');
							$hi = $xml.createElement('hi');
							$newNode.appendChild($hi);
							cloneChildren($clone, $hi);
							$formatting_rend = $formatting_height = '';

							var formatting_rend = '', formatting_height = '';
							switch (arr['__t']) {
								case 'formatting_rubrication' :
									formatting_rend = 'rubric';
									break;

								case 'formatting_gold' :
									formatting_rend = 'gold';
									break;

								case 'formatting_blue' :
									formatting_rend = 'blue';
									break;

								case 'formatting_green' :
									formatting_rend = 'green';
									break;

								case 'formatting_yellow' :
									formatting_rend = 'yellow';
									break;

								case 'formatting_other' :
									formatting_rend = 'other';
									break;

								case 'formatting_capitals' :
									formatting_rend = 'cap';
									formatting_height = arr['capitals_height'];
									break;
								case 'formatting_overline' :
									formatting_rend = 'ol';
							}

							if (formatting_rend != '')
								$hi.setAttribute('rend', formatting_rend);

							if (formatting_height != '')
								$hi.setAttribute('height', formatting_height);

							$node.parentNode.replaceChild($newNode, $node);
							continue;
						}

						// ******************** gap
						// *******************
						/*
						 * wce_gap <gap OR <supplied source="STRING"
						 * _type_STRING type="STRING" _reason_STRING
						 * reason="STRING" _hand_STRING hand="STRING"
						 * _unit_STRING_extent_STRING unit="STRING"
						 * extent="STRING" />
						 */
						if (type == '' && arr['__t'] == 'gap') {
							if (arr['mark_as_supplied'] == 'supplied') {
								// <supplied>
								$newNode = $xml.createElement('supplied');
								var _supplied_source = arr['supplied_source'];
								if (_supplied_source && _supplied_source != '') {
									if (_supplied_source == 'other'
											&& arr['supplied_source_other'])
										$newNode.setAttribute('source',
												arr['supplied_source_other']);
									else
										$newNode.setAttribute('source',
												_supplied_source);
								}
							} else {
								// <gap>
								$newNode = $xml.createElement('gap');
							}
							// reason
							if (arr['gap_reason']) {
								$newNode.setAttribute('reason',
										arr['gap_reason']);
							}

							// unit
							var _unit = arr['unit'];
							if (_unit != '') {
								if (_unit == 'other' && arr['unit_other']) {
									$newNode.setAttribute('unit',
											arr['unit_other']);
								} else {
									$newNode.setAttribute('unit', _unit);
								}
							}

							// extent
							if (arr['extent']) {
								$newNode.setAttribute('extent', arr['extent']);
							}

							if ($newNode.nodeName === 'supplied') {
								// add text
								var _nodeText = $node.text;
								if (_nodeText) {
									_nodeText = _nodeText.substr(1,
											_nodeText.length - 2);

									nodeAddText($newNode, _nodeText);

								}
								// $supp_words = explode(' ',
								// $newNode.nodeValue);
								// $array_size =
								// count($supp_words);
								// foreach($supp_word AS $w) {
								// for($i = 0; $i < $array_size;
								// $i++) {
								// //Split node value
								// into
								// words
								// $newNode.nodeValue = $w;
								// $newNode=insertElementW($xml,$node,$newNode);
								// //add <w>
								// $node.parentNode.replaceChild($newNode,
								// $node);
								// }
								$newNode = insertElementW($node, $newNode); // add
								// <w>
								$node.parentNode.replaceChild($newNode, $node);
							} else {
								$node.parentNode.replaceChild($newNode, $node);
							}
							continue;
						}

						// ******************** abbr
						// ********************
						/*
						 * abbr_nomenSacrum <abbr type="nomSac">...</abbr>
						 * abbr_nomenSacrum_Overline <abbr type="nomSac"><hi
						 * rend="ol">...</hi></abbr> abbr_numeral <abbr
						 * type="numeral">...</abbr> abbr_numeral_Overline
						 * <abbr type="numeral"><hi rend="ol">...</hi></abbr>
						 * abbr_STRING <abbr type="STRING">...</abbr>
						 * abbr_STRING_Overline <abbr type="STRING"><hi
						 * rend="ol">...<hi></abbr>
						 */
						if (type == '' && arr['__t'] === 'abbr') {

							$abbr = $xml.createElement('abbr');
							// type
							var _abbr_type = arr['abbr_type'];
							if (_abbr_type && _abbr_type != '') {
								if (_abbr_type == 'other')
									$abbr.setAttribute('type',
											arr['abbr_type_other']);
								else
									$abbr.setAttribute('type', _abbr_type);
							}

							if (arr['add_overline'] == 'overline') {
								$hi = $xml.createElement('hi');
								$hi.setAttribute('rend', 'ol');
								nodeAddText($hi, $node.text);
								$abbr.appendChild($hi);
							} else {
								nodeAddText($abbr, $node.text);
							}

							$newNode = insertElementW($node, $abbr);

							$node.parentNode.replaceChild($newNode, $node);
							continue;
						}

						// ******************** part_abbr
						// ******************
						/*
						 * <part_abbr> <ex>...</ex>
						 */
						if (type == '' && arr['__t'] === 'part_abbr') {
							var $part_abbr = $xml.createElement('ex');
							var _nodeText = $node.text;
							if (_nodeText) {
								_nodeText = _nodeText.substr(1,
										_nodeText.length - 2);

								nodeAddText($part_abbr, _nodeText);
							}
							$newNode = insertElementW($node, $part_abbr);

							$node.parentNode.replaceChild($newNode, $node);
							continue;
						}

						// ******************** unclear
						// ********************
						/*
						 * <unclear_reason_STRING reason="STRING">...</unclear>
						 */
						if (type == '' && arr['__t'] === 'unclear') {
							var $unclear = $xml.createElement('unclear');
							var _unclear_reason = arr['unclear_text_reason'];
							if (_unclear_reason == 'other') {
								_unclear_reason = arr['unclear_text_reason_other'];
							}
							if (_unclear_reason != '') {
								$unclear
										.setAttribute('reason', _unclear_reason);
							}
							if (arr['original_text']) {
								$unclear.text = arr['original_text'];
							}
							$newNode = insertElementW($node, $unclear);

							$node.parentNode.replaceChild($newNode, $node);
							continue;

						}

						// ******************** paratext
						// ********************
						/*
						 * <fw type="STRING" place="STRING"
						 * rend="align(STRING)">...</fw> <num type="STRING"
						 * n="STRING" place="STRING" rend="align(STRING)">...</num>
						 * <div type="incipit"><ab>...</ab></div> <div
						 * type="explicit"><ab>...</ab></div>
						 */
						if (type == '' && arr['__t'] === 'paratext') {

							var attr = '', paratextNodeName;
							if (arr['fw_type'].match(/num_/)) {
								// $paratextNodeName = 'fw';
								// //Fehler #85
								paratextNodeName = 'num';
								// attr = $currInfo['number'];
							} else {
								paratextNodeName = 'fw';
							}

							$newNode = $xml.createElement(paratextNodeName);

							switch (arr['fw_type']) {
								case 'fw_pagenumber' :
									type = 'pageNum';
									break;
								case 'num_chapternumber' :
									type = 'chapNum';
									break;
								case 'fw_lecttitle' :
									type = 'lectTitle';
									break;
								case 'fw_chaptertitle' :
									type = 'chapTitle';
									break;
								case 'fw_colophon' :
									type = 'colophon';
									break;
								case 'fw_quiresig' :
									type = 'quireSig';
									break;
								case 'num_ammonian' :
									type = 'AmmSec';
									break;
								case 'num_eusebian' :
									type = 'EusCan';
									break;
								case 'fw_euthaliana' :
									type = 'euthaliana';
									break;
								case 'fw_gloss' :
									type = 'gloss';
									break;
								case 'num_stichoi' :
									type = 'stichoi';
									break;
							}
							$newNode.setAttribute('type', type);

							attr = arr['number'];

							// write attribute n only for
							// certain values
							if (attr
									&& (type == 'pageNum' || type == 'chapNum'
											|| type == 'quireSig'
											|| type == 'AmmSec'
											|| type == 'EusCan' || type == 'stichoi')) {
								$newNode.setAttribute('n', attr);
							}

							// if ($newNode.nodeName === 'fw') {
							attr = arr['paratext_position'];
							attr_other = arr['paratext_position_other'];
							if (attr == 'other' && attr_other != '') {
								attr = attr_other;
							}
							if (attr) {
								$newNode.setAttribute('place', attr);
							}
							// }

							attr = arr['paratext_alignment'];
							if (attr) {
								$newNode.setAttribute('rend', attr);
							}

							nodeAddText($newNode, arr['text']);

							$node.parentNode.replaceChild($newNode, $node);
							continue;
						}

						// ******************** pc
						// ********************
						/*
						 * <pc>...</pc>
						 */
						// ohne w
						if (type == '' && arr['__t'] === 'pc') {
							$newNode = $xml.createElement('pc');
							nodeAddText($newNode, $node.text);
							$node.parentNode.replaceChild($newNode, $node);
							continue;
						}

						// ******************** space
						// ********************
						/*
						 * <space unit="STRING" extent="STRING" />
						 */
						// ohne w
						if (type == '' && arr['__t'] === 'spaces') {
							$newNode = $xml.createElement('space');

							var _attr = arr['sp_unit'];
							var _attr_other = arr['sp_unit_other'];
							if (_attr == 'other') {
								_attr = _attr_other;
							}
							if (_attr != '') {
								$newNode.setAttribute('unit', _attr);
							}

							_attr = arr['sp_extent'];
							if (_attr) {
								$newNode.setAttribute('extent', _attr);
							}

							$node.parentNode.replaceChild($newNode, $node);
							continue;
						}

						// ******************** supplied
						// ********************
						/*
						 * <supplied source="STRING" reason="STRING"
						 * agent="STRING>...</supplied> // ohne w if (type == '' &&
						 * arr['__t'] === 'supplied') { continue; //TODO wie
						 * unclear in <w> $newNode =
						 * $xml.createElement('supplied'); $attr =
						 * arr['supplied_source']; $attr_other =
						 * arr['supplied_source_other']; if ($attr == 'other') {
						 * $attr = $attr_other; }
						 * 
						 * if ($attr != '') { $newNode.setAttribute('source',
						 * $attr); } // $attr = substr(arr['gap_reason'], 4);
						 * //to get just damage, hole etc. $attr_other =
						 * arr['gap_reason_other']; if ($attr == 'other') { //no
						 * sup_ because of substring $attr = $attr_other; } if
						 * ($attr != '') { $newNode.setAttribute('reason',
						 * $attr); }
						 * 
						 * _copyChild($xml, $newNode, $clone);
						 * 
						 * $newNode=insertElementW($xml,$node,$newNode);
						 * 
						 * $node.parentNode.replaceChild($newNode, $node);
						 * continue; }
						 */

						// note
						/*
						 * 
						 */
						if (type == '' && arr['__t'] === 'note') {
							$newNode = $xml.createElement('note');
							var _attr = arr['note_type'];
							var _attr_other = arr['note_type_other'];
							if (_attr == 'other' && $attr_other != '') {
								_attr = _attr_other;
							}
							if (_attr != '') {
								$newNode.setAttribute('type', _attr);
							}

							/*
							 * // TODO: // numbering var _xml_id = $value['B'] +
							 * $value['K'] + $value['V'] + '-' + gWit + '-1';
							 * 
							 */
							var _xml_id = '_TODO_';

							$newNode.setAttribute('xml:id', _xml_id);

							nodeAddText($node, arr['note_text']);

							$node.parentNode.replaceChild($newNode, $node);

							// add <handshift/>
							if (arr['note_type'] == "changeOfHand") {
								var $secNewNode = $xml
										.createElement('handshift');
								$secNewNode.setAttribute('n', arr['newHand']);
								$newNode.parentNode.insertBefore($secNewNode,
										$newNode.nextSibling); // TODO
								// better use function
								// appendSibling
							}
							continue;
						} 
					}
					// *** End for*/

					if ($newNode) {
						return $newNode;
					} else {
						return $node;
					}
				};

				return getXML();

			};

			ed.addCommand('getTEIxml', _gtx);
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
	};
	tinymce.create('tinymce.plugins.wcePlugin', _wpl);
	// Register plugin
	tinymce.PluginManager.add('wce', tinymce.plugins.wcePlugin);
})();