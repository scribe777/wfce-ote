/*  
	Copyright (C) 2012-2016 Trier Center for Digital Humanities, Trier (Germany)
	
	This file is part of the Online Transcription Editor (OTE).

    OTE is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 2.1 of the License, or
    (at your option) any later version.

    OTE is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with OTE.  If not, see <http://www.gnu.org/licenses/>.

    Diese Datei ist Teil des Online-Transkriptions-Editor (OTE).

    OTE ist Freie Software: Sie können es unter den Bedingungen
    der GNU Lesser General Public License, wie von der Free Software Foundation,
    Version 2.1 der Lizenz oder (nach Ihrer Wahl) jeder späteren
    veröffentlichten Version, weiterverbreiten und/oder modifizieren.

    OTE wird in der Hoffnung, dass es nüzlich sein wird, aber
    OHNE JEDE GEWÄHRLEISTUNG, bereitgestellt; sogar ohne die implizite
    Gewährleistung der MARKTFÄHIGKEIT oder EIGNUNG FÜR EINEN BESTIMMTEN ZWECK.
    Siehe die GNU Lesser General Public License für weitere Details.

    Sie sollten eine Kopie der GNU Lesser General Public License zusammen mit diesem
    Programm erhalten haben. Wenn nicht, siehe <http://www.gnu.org/licenses/>.
*/

parent.tinymce.PluginManager.requireLangPack();

// active Editor
var ed;

// selected wce node
var wce_node;

// add new or only edit a wce node
var add_new_wce_node;

// selected Content
var selected_content;

// selected wce-node text / original text
var wce_node_text = '';

// wce-wce-name-array <span wce="wce_corr@%CE%BBdadffefadvfead" ....
var info_arr = [];

// infomation of other wce_type
var other_info_str = '';

// info arr counter
var item_counter = -1;

// current item ids
var curr_item_id;

var wce_type;
var wceUtils;

//for example: use the "corrections" menu if a whole word is highlighted as "gap"
var isCombination = false;

function setConstants(_type) {
	//wce_node = ed.execCommand('getWceNode', false);
	wce_node = ed.WCE_VAR.selectedNode;
	add_new_wce_node = parent.tinymce.activeEditor.windowManager.getParams().add_new_wce_node;
	wceUtils = ed.WCEUtils;

	//Bugfix Fehler #646 Impossible combination: Deficiency + Corrections
	//for other combination can use this
	if (wce_node && ed.WCE_VAR.isSelWholeNode) {
		ed.selection.select(wce_node);
	}
	selected_content = ed.selection.getContent();
}

/**
 *
 */
function wceInfoInit(wp) {

	wce_type = wp;

	if (wce_node) {
		wce_node_text = $(wce_node).text();
		var wceAttr = wce_node.getAttribute('wce');

		if (wceAttr) {
			var arr = wceAttr.split('@');
			var al = arr.length;
			var astr;
			for (var i = 0; i < al; i++) {
				astr = arr[i];
				if (astr.indexOf('__t' + '=' + wce_type) != 0) {
					other_info_str += '@' + astr;
					continue;
				}
				item_counter++;
				info_arr['c' + item_counter] = arr[i];
			}
		}
	} else if ( typeof selected_content != 'undefined' && selected_content != null) {
		wce_node_text = selected_content.replace(/<\/?[^>]+>/gi, '');
	}
}

/**
 * read Information from attribute 'wce' and fill the form
 */
function readWceNodeInfo() {
	if (!wce_node)
		return;

	// Information of attribute wce write to Form
	if (info_arr['c' + item_counter] != null) {
		formUnserialize(info_arr['c' + item_counter]);
	}
}

/**
 * @param {string}:
 *            type of wce node
 */
function writeWceNodeInfo(val) {
	if (typeof wce_type == 'undefined') {
		alert('wce_type error');
		return;
	}

	if (!wce_type.match(/corr/)) {
		info_arr = [];
		info_arr[0] = formSerialize();
	}

	var newWceAttr = arrayToString(info_arr);
	if (wce_type != 'note' || other_info_str != '@__t=verse_number') //exception
		newWceAttr += other_info_str;
	
	var wceID = '';

	if (wce_node != null && newWceAttr == '') {
		if (wceUtils) {
			wceUtils.wceDelNode(ed);
			wceUtils.setWCEVariable(ed);
			wceUtils.redrawContols(ed);
		}
		parent.tinymce.activeEditor.windowManager.close();
		return;
	} else if (newWceAttr == '') {
		parent.tinymce.activeEditor.windowManager.close();
		return;
	}

	var startFormatHtml = ed.WCE_CON.startFormatHtml;
	var endFormatHtml = ed.WCE_CON.endFormatHtml;

	if (add_new_wce_node) {
		// default style
		var wceClass = ' class="' + wce_type + '"';

		/*	if (isCombination) {
		$(wce_node).remove();
		}*/

		// new content
		var new_content;
		var original_text = ' wce_orig="' + encodeURIComponent(selected_content) + '" ';

		switch (wce_type) {
			case 'gap':
				var gap_text = "";
				var gap_unit;
				var gap_extent;
				var gap_id; 
				if (document.getElementById('mark_as_supplied').checked == true) {// supplied text
					gap_text = '[' + selected_content + ']';
					//test if in node abbr with overline 
					var gap_parent=wce_node;
					var gap_parent_name;
					while(gap_parent){
						gap_parent_name=gap_parent.nodeName.toLowerCase();
						if(gap_parent_name=='body' || gap_parent_name=='html'){
							break;
						}
						if(gap_parent_name=='span' && gap_parent.className=='abbr_add_overline'){
							gap_parent.setAttribute('ext','inabbr');
							wceClass=' ext="inabbr" '+wceClass;
							break;
						}
						gap_parent=gap_parent.parentNode;						
					}				
					 
				} else {
					gap_unit = document.getElementById('unit').value;
					gap_extent = document.getElementById('extent').value;
					if (gap_unit == "char") {
						if (gap_extent != '')
							gap_text += '[' + gap_extent + ']';
						else
							gap_text += '[...]';
					} else if (gap_unit == "line") {
						if (gap_extent == 'part' || gap_extent == 'unspecified') {
							gap_text += '[...]';
						} else {
							for (var i = 0; i < gap_extent; i++) {
								gap_text += '<br/>&crarr;[...]';
							}
							wceUtils.addToCounter(ed, 'lb', gap_extent);
						}
						gap_id = '_2_' + wceUtils.getRandomID(ed, '');
					} else if (gap_unit == "page") {
						for (var i = 0; i < gap_extent; i++) {
							gap_text += '<br/>PB<br/>[...]';
						}
						gap_id = '_4_' + wceUtils.getRandomID(ed, '');
						wceUtils.addToCounter(ed, 'pb', gap_extent);
					} else if (gap_unit == "quire") {
						for (var i = 0; i < gap_extent; i++) {
							gap_text += '<br/>QB<br/>[...]';
						}
						wceUtils.addToCounter(ed, 'gb', gap_extent);
					} else {
						gap_text = '[...]';
					}
				}
				if (gap_id) {
					wceID = 'id="gap' + gap_id + '" ';
				}

				selected_content = gap_text;
				break;

			case 'brea':
				if (break_type) {
					new_content = wceUtils.getBreakHtml(ed, break_type, break_lbpos, break_indention, 'wce="' + newWceAttr + '"', null);
				} else {
					new_content = 'Error:test'; //TODO: Add error message
				}
				break;

			case 'corr':
				if (document.getElementById('blank_firsthand').checked) {
					selected_content = 'T';
					wceClass = ' class="corr_blank_firsthand"';
				}
				break;

			case 'unclear':
				//if (selected_content.indexOf('span class="spaces"') == -1) { // take care of spaces element
				if (selected_content.indexOf('<span') == -1) { // take care of spaces element
					var unclear_text = "";
					for (var i = 0; i < selected_content.length; i++) {
						if (selected_content.charAt(i) == ' ') {
							unclear_text += selected_content.charAt(i);
						} else {
							unclear_text += selected_content.charAt(i) + '&#x0323;';
						}
					}
					selected_content = unclear_text;
				}
				break;

			case 'note':
				new_content = selected_content + '<span wce="' + newWceAttr + '"' + original_text + wceClass + '>' + startFormatHtml + 'Note' + endFormatHtml + '</span>';
				if (ed.WCE_VAR.isInBE) {
					// wceUtils.insertSpace(ed,32);
					//move cursor outside of BE
					wceUtils.insertSpace(ed);
				}
				break;

			case 'abbr':
				if (document.getElementById('add_overline').checked == true) {
					wceClass = ' class="abbr_add_overline"';
				}
				break;
			case 'part_abbr':
				selected_content = "(" + selected_content + ")";
				break;
			case 'spaces':
				// default
				//selected_content = '&nbsp;';
				new_content = '<span wce="' + newWceAttr + '"' + wceClass + '>' + startFormatHtml + 'sp' + endFormatHtml + '</span>';
				break;
			case 'paratext':
				// default
				if (document.getElementById('fw_type').value == "commentary") {
					selected_content = '';
					var cl = document.getElementById('covered').value;
					if (cl != '' && cl > 0) {
						for (var i = 0; i < cl; i++) {
							selected_content += '<br/>&crarr;[<span class="commentary" ' + 'wce="__t=paratext&__n=&fw_type=commentary&covered=' + cl + '">comm</span>]';
						}
						wceUtils.addToCounter(ed, 'lb', document.getElementById('covered').value);
					} else {// no value given for covered lines
						selected_content += '[<span class="commentary" ' + 'wce="__t=paratext&__n=&fw_type=commentary&covered=">comm</span>]';
					}
				} else if (document.getElementById('fw_type').value == "lectionary-other") {
					selected_content = '';
					var cl = document.getElementById('covered').value;
					if (cl != '' && cl > 0) {
						for (var i = 0; i < cl; i++) {
							selected_content += '<br/>&crarr;[<span class="lectionary-other" ' + 'wce="__t=paratext&__n=&fw_type=lectionary-other&covered=' + cl + '">lect</span>]';
						}
						wceUtils.addToCounter(ed, 'lb', document.getElementById('covered').value);
					} else {// no value given for covered lines
						selected_content += '[<span class="lectionary-other" ' + 'wce="__t=paratext&__n=&fw_type=lectionary-other&covered=">lect</span>]';
					}
				} else if (document.getElementById('fw_type').value == "ews") {
					selected_content = '[<span class="ews">ews</span>]';
				} else
					selected_content = val;

				// write original_text for breaks and paratext
				new_content = '<span wce="' + newWceAttr + '"' + wceClass + original_text + '>' + startFormatHtml + selected_content + endFormatHtml + '</span>';
				break;

			case 'formatting_capitals':
				//only for formatting_capitals needed
				wceClass = ' class="formatting_capitals"';
				break;
				
			case 'formatting_ornamentation_other': 
				wceClass = ' class="formatting_ornamentation_other"';
				break;

			default:
				break;

		}

		//if new_content is not defined, use default
		if (!new_content) {
			new_content = '<span wce="' + newWceAttr + '"' + wceID + wceClass + original_text + '>' + startFormatHtml + selected_content + endFormatHtml + '</span>';
		}

		//var marker = ed.dom.get('_marker'); //Does not work; intended for editing breaks
		//ed.selection.select(marker, false);

		//Fixed: if the selection range is collapsed and the caret is at the end of a element,
		//then the new element will appear inside of current element and not after the element 
		//when one adds a new element via the menu
		var wcevar = ed.WCE_VAR;
		if (wcevar.isc && wcevar.isInBE && wcevar.isCaretAtNodeEnd && 
			(wcevar.type == ed.WCE_CON.formatEnd || wcevar.type == 'chapter_number' || wcevar.type === 'book_number' || wcevar.type == 'verse_number' || wcevar.type == 'brea')) {
			var selNode = wcevar.selectedNode;
			if (wcevar.type == ed.WCE_CON.formatEnd) {
				$(new_content).insertAfter(selNode.parentNode);
				//do not know why after insert, a space will be generated after char '>',
				//Therefore format_end need to be reset
				selNode.innerHTML = '&rsaquo;';
			} else {
				$(new_content).insertAfter(selNode);
			}

		} else {
			wceUtils.setContent(ed, new_content);
		}

		if (wce_type == 'gap') {
			if (gap_unit == "line") {
				if (gap_extent !== 'part' && gap_extent !== 'unspecified') {
					wceUtils.updateBreakCounter(ed, 'lb', 0);
					ed.selection.setContent(wceUtils.getBreakHtml(ed, 'lb', null, null, null, gap_id));
				}
			} else if (gap_unit == "page") {
				wceUtils.updateBreakCounter(ed, 'pb', 0);
				ed.selection.setContent(wceUtils.getBreakHtml(ed, 'pb', null, null, null, gap_id));
			}

			/*if (document.getElementById('unit').value == "line")
			 ed.execCommand('mceAdd_brea', 'lb', 0);
			 else if (document.getElementById('unit').value == "page")
			 ed.execCommand('mceAdd_brea', 'pb', 0);*/
		}

		if (wceUtils) {
			wceUtils.setWCEVariable(ed);
			wceUtils.redrawContols(ed);
		}

	} else {//edit mode
		// update wce
		if (wce_node != null) {
			if (wce_type == 'paratext') {
				selected_content=wceUtils.wceDelNode(ed, true);
				add_new_wce_node = true;
				return writeWceNodeInfo(val);
			} else if (wce_type == 'corr') {
				if (document.getElementById('blank_firsthand').checked)
					wce_node.innerHTML = startFormatHtml + 'T' + endFormatHtml;
				else
					wceUtils.setInnerHTML(ed, wce_node, $('#original_firsthand_reading').val());
			} else if (wce_type == 'brea') {
				// break type
				//change type
				if (old_break_type != break_type) {
					selected_content=wceUtils.wceDelNode(ed, true);
					add_new_wce_node = true;
					return writeWceNodeInfo(val);
				} else {
					//edit default
					if (break_type == 'lb') {
						break_indention = wceUtils.getBreakHtml(ed, break_type, break_lbpos, break_indention, 'wce="' + newWceAttr + '"', null, true);
						wceUtils.setInnerHTML(ed, wce_node, break_indention);
					}
					wceUtils.updateBreakCounter(ed, break_type, document.breakinfo.number.value);
				}
			} else if (wce_type == 'abbr') {
				var abbrClass = 'abbr';
				if (document.getElementById('add_overline').checked == true) {
					abbrClass = 'abbr_add_overline';
				}
				wce_node.className = abbrClass;
			} else if (wce_type == 'gap') {// edit gap
				selected_content=wceUtils.wceDelNode(ed, true);
				add_new_wce_node = true;
				return writeWceNodeInfo(val);
				/*
				// TODO: Additional break at the end is still missing.
				if (document.getElementById('mark_as_supplied').checked == true) {// supplied text
					wce_node.textContent = '[' + wce_node.getAttribute('wce_orig') + ']';
				} else {
					wce_node.removeChild(wce_node.firstChild);
					// remove old content
					if (document.getElementById('unit').value == "char") {
						if (document.getElementById('extent').value != '')
							wce_node.textContent = '[' + document.getElementById('extent').value + ']';
						else
							wce_node.textContent = '[...]';
					} else if (document.getElementById('unit').value == "line") {
						for (var i = 0; i < document.getElementById('extent').value; i++) {// generate new content
							$br = document.createElement('br');
							wce_node.appendChild($br);
							$text = document.createTextNode('\u21B5[...]');
							wce_node.appendChild($text);
						}
						wceUtils.addToCounter(ed, 'lb', document.getElementById('extent').value);
					} else if (document.getElementById('unit').value == "page") {
						for (var i = 0; i < document.getElementById('extent').value; i++) {
							$br = document.createElement('br');
							wce_node.appendChild($br);
							$text = document.createTextNode('PB');
							wce_node.appendChild($text);
							$br = document.createElement('br');
							wce_node.appendChild($br);
							$text = document.createTextNode('[...]');
							wce_node.appendChild($text);
						}
						wceUtils.addToCounter(ed, 'pb', document.getElementById('extent').value);
					} else if (document.getElementById('unit').value == "quire") {
						for (var i = 0; i < document.getElementById('extent').value; i++) {
							$br = document.createElement('br');
							wce_node.appendChild($br);
							$text = document.createTextNode('QB');
							wce_node.appendChild($text);
							$br = document.createElement('br');
							wce_node.appendChild($br);
							$text = document.createTextNode('[...]');
							wce_node.appendChild($text);
						}
						wceUtils.addToCounter(ed, 'gb', document.getElementById('extent').value);
					} else {
						wce_node.textContent = '[...]';
					}
				}*/
			}
			wce_node.setAttribute('wce', newWceAttr);
		}
	}

	ed.isNotDirty = 0;
	parent.tinymce.activeEditor.windowManager.close();
}

/**
 * form unserialize
 *
 * @param {String}
 *            attribute wce value of wce-node /*
 */
function formUnserialize(str) {
	$('input:checkbox').prop('checked', false);

	if (str == null || str == '')
		return;

	var arr = str.split('&');
	var kv, k, v;

	for (var i = 2; i < arr.length; i++) {
		kv = arr[i].split('=');
		k = kv[0];
		v = kv[1] == null ? '' : kv[1];
		v = v.replace(/\+/g, ' ');

		if ($('#' + k).attr('type') == 'checkbox') {
			$('#' + k).prop('checked', true);
		} else {
			if (!v)
				continue;
			var dec_v = decodeURIComponent(v);
			if (k == 'corrector_text' && corrector_text_editor) {
				corrector_text_editor.setContent(dec_v);
			} else if (k == 'marginals_text' && marginals_text_editor) {
				marginals_text_editor.setContent(dec_v);
			}
			$('#' + k).val(dec_v);
		}
	}
}

/**
 * form serialize
 *
 * @param {document-form}
 * @param {String}
 *            name of str, example: new corrector, firsthand, ....
 *
 */
function formSerialize(f, wce_name) {
	if (f == null) {
		f = document.forms[0];
	}

	if ( typeof wce_name == 'undefined' || wce_name == null) {
		wce_name = '';
	}

	var arr = $(f).find(':input');
	var s = '__t' + '=' + wce_type + '&' + '__n' + '=' + wce_name;
	var a;
	var a_type, a_id;
	for (var i = 0, l = arr.length; i < l; i++) {
		a = $(arr[i]);
		a_type = a.attr('type');
		a_id = a.attr('id');

		if (!a_id || a_id == 'undefined' || a_type == 'reset' || a_id == 'insert' || a_id == 'cancel')
			continue;

		if (a.attr('type') == 'checkbox' && !a.is(':checked'))
			continue;

		if (a.attr('id') == 'corrector_text') {
			s += '&' + a.attr('id') + '=' + encodeURIComponent(corrector_text_editor.getContent());
		} else if (a.attr('id') == 'marginals_text') {
			s += '&' + a.attr('id') + '=' + encodeURIComponent(marginals_text_editor.getContent());
		} else {
			s += '&' + a.attr('id') + '=' + encodeURIComponent(a.val());
		}
	}
	return s;
}

function arrayToString(arr) {
	var s = '';
	for (var p in arr) {
		if (p == null || arr[p] == null || p == 'c-1')
			continue;

		if (s != '') {
			s += '@';
		}
		s += arr[p];
	}
	return s;
}

(function(window, document, undefined) {
	var XBTooltip = function(element, userConf, tooltip) {
		var config = {
			id : userConf.id || undefined,
			className : userConf.className || undefined,
			x : userConf.x || 20,
			y : userConf.y || 20,
			text : userConf.text || undefined
		};
		var over = function(event) {
			tooltip.style.display = "block";
		}, out = function(event) {
			tooltip.style.display = "none";
		}, move = function(event) {
			event = event ? event : window.event;
			if (event.pageX == null && event.clientX != null) {
				var doc = document.documentElement, body = document.body;
				event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
				event.pageY = event.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0);
			}
			tooltip.style.top = (event.pageY + config.y) + "px";
			tooltip.style.left = (event.pageX + config.x) + "px";
		}
		if (tooltip === undefined && config.id) {
			tooltip = document.getElementById(config.id);
			if (tooltip)
				tooltip = tooltip.parentNode.removeChild(tooltip)
		}
		if (tooltip === undefined && config.text) {
			tooltip = document.createElement("div");
			if (config.id)
				tooltip.id = config.id;
			tooltip.innerHTML = config.text;
		}
		if (config.className)
			tooltip.className = config.className;
		tooltip = document.body.appendChild(tooltip);
		tooltip.style.position = "absolute";
		element.onmouseover = over;
		element.onmouseout = out;
		element.onmousemove = move;
		over();
	};
	window.XBTooltip = window.XBT = XBTooltip;
})(this, this.document);

function comboBindReturnEvent(id1) {
	var entryEvent = function(e) {
		if (!e) {
			var e = window.event;
		}
		var keyCode = e.keyCode ? e.keyCode : e.charCode ? e.charCode : e.which;
		if (keyCode == 13) {
			$('#' + id1).click();
		}
	};

	//test in firefox, safari, chrome
	if (!parent.tinyMCE.isIE && !parent.tinyMCE.isOpera) {
		$('#' + id1).focus();
		$('select').keydown(function(e) {
			entryEvent(e)
		});
		$(':checkbox').click(function(e) {
			$('#' + id1).focus()
		});
	}
}

function wce_openWindow(txt)
{
    var smallwindow;
	if ((smallwindow == null)||(smallwindow.closed)) {
		if (parent.tinyMCE.activeEditor.settings.language == 'de')
			smallwindow = window.open(txt,"_blank",
				"width=800,height=600,resizable=yes,status=no,"+
                "menubar=no,location=no,scrollbars=yes,toolbar=no");
		else
			smallwindow = window.open(txt.replace('docu', 'docu_en'),"_blank",
				"width=800,height=600,resizable=yes,status=no,"+
                "menubar=no,location=no,scrollbars=yes,toolbar=no");
		smallwindow.opener = parent;
		smallwindow.focus(); 
    } else { 
		smallwindow.focus();
	}
}
