tinyMCEPopup.requireLangPack();

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

// global counter for columns and lines
// var column_count = 0;
// var line_count;

// name of item, saved in Attribute wce.
// <span
// wce="__t=corr&amp;__n=othername&amp;reading=corr&amp;blank_firsthand=blank
// ......"> ....</span>
var type_in_uri;
var name_in_uri;
var wce_type;
var wceObj;

function setConstants() {
	selected_content = ed.selection.getContent();
	wce_node = ed.execCommand('getWceNode', false);
	add_new_wce_node = tinyMCEPopup.getWindowArg('add_new_wce_node');
	wceObj = tinyMCEPopup.getWindowArg('wceobj');
	type_in_uri = ed.wceTypeParamInClass;
	name_in_uri = ed.wceNameParamInClass;
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
			for ( var i = 0; i < al; i++) {
				astr = arr[i];
				if (astr.indexOf(type_in_uri + '=' + wce_type) != 0) {
					other_info_str += '@' + astr;
					continue;
				}
				item_counter++;
				info_arr['c' + item_counter] = arr[i];
			}
		}
	} else if (typeof selected_content != 'undefined' && selected_content != null) {
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
	newWceAttr += other_info_str;

	if (wce_node != null && newWceAttr == '') {
		ed.execCommand('wceDelNode', false);
		if (wceObj) {
			wceObj._setWCEVariable(ed);
			wceObj._redrawContols(ed);
		}
		tinyMCEPopup.close();
		return;
	} else if (newWceAttr == '') {
		tinyMCEPopup.close();
		return;
	}

	if (add_new_wce_node) {
		// default style
		// var style = "border: 1px dotted #f00; margin:0px 1px 0px 1px ; padding:0;";
		var wceClass;

		// new content
		var new_content;
		var original_text = ' wce_orig="' + selected_content + '" ';

		switch (wce_type) {
		case 'gap':
			var gap_text = "";
			wceClass = ' class="gap"';
			if (document.getElementById('mark_as_supplied').checked == true) {
				gap_text = '[' + selected_content + ']';
			} else {
				if (document.getElementById('unit').value == "char") {
					gap_text += '[' + document.getElementById('extent').value + ']';
				} else if (document.getElementById('unit').value == "line") {
					for ( var i = 0; i < document.getElementById('extent').value; i++) {
						gap_text += '<br/>&crarr;[...]';
					}
					ed.execCommand('addToCounter', 'lb', document.getElementById('extent').value);
				} else if (document.getElementById('unit').value == "page") {
					for ( var i = 0; i < document.getElementById('extent').value; i++) {
						gap_text += '<br/>PB<br/>[...]';
					}
					ed.execCommand('addToCounter', 'pb', document.getElementById('extent').value);
				} else if (document.getElementById('unit').value == "quire") {
					for ( var i = 0; i < document.getElementById('extent').value; i++) {
						gap_text += '<br/>QB<br/>[...]';
					}
					ed.execCommand('addToCounter', 'gb', document.getElementById('extent').value);
				} else {
					gap_text = '[...]';
				}
			}
			selected_content = gap_text;
			break;

		case 'brea':
			// style += 'color:#666';
			wceClass = ' class="brea"';
			selected_content = val;
			break;

		case 'corr':
			wceClass = ' class="corr"';
			// TODO: This just alters the selection to "T" which is not what we want. Instead the original first hand reading has to be saved.
			if (document.getElementById('blank_firsthand').checked) {
				selected_content = 'T';
				wceClass = ' class="corr_blank_firsthand"';
			}
			break;

		case 'supplied':
			wceClass = ' class="supplied"';
			break;

		case 'unclear':
			wceClass = ' class="unclear"';
			var unclear_text = "";
			for ( var i = 0; i < selected_content.length; i++) {
				if (selected_content.charAt(i) == ' ') {
					unclear_text += selected_content.charAt(i);
				} else {
					unclear_text += selected_content.charAt(i) + '&#x0323;';
				}
			}
			selected_content = unclear_text;
			break;

		case 'note':
			wceClass = ' class="note"';
			new_content = selected_content + '<span wce="' + newWceAttr + original_text + '"' + wceClass + '>Note</span>';
			break;

		case 'abbr':
			wceClass = ' class="abbr"';
			if (document.getElementById('add_overline').checked == true) {
				wceClass = ' class="abbr_add_overline"';
			}
			break;

		case 'spaces':
			// default
			wceClass = ' class="spaces"';
			selected_content = '&nbsp;';
			break;

		case 'paratext':
			// default
			wceClass = ' class="paratext"';
			selected_content = val;
			break;

		default:
			break;

		}

		if (new_content == null)
			new_content = '<span wce="' + newWceAttr + '"' + wceClass + original_text + '>' + selected_content + '</span>';

		ed.selection.setContent(new_content);
		if (wce_type == 'brea') {
			var new_pbcnt = 0;
			switch (document.getElementById('break_type').value) {
			case 'gb':
				ed.execCommand('setCounter', 'gb', document.getElementById('number').value);
				ed.execCommand('mceAdd_brea', 'pb', 0);
				ed.execCommand('mceAdd_brea', 'cb', '1');
				ed.execCommand('mceAdd_brea', 'lb', '1');
				break;
			case 'pb':
				if (document.getElementById('pb_type').value == "r")
					new_pbcnt = 2 * parseInt(document.getElementById('number').value) - 1;
				else if (document.getElementById('pb_type').value == "v")
					new_pbcnt = 2 * parseInt(document.getElementById('number').value);
				else
					new_pbcnt = document.getElementById('number').value;
				ed.execCommand('setCounter', 'pb', new_pbcnt);
				ed.execCommand('mceAdd_brea', 'cb', '1');
				ed.execCommand('mceAdd_brea', 'lb', '1');
				break;
			case 'cb':
				ed.execCommand('setCounter', 'cb', document.getElementById('number').value);
				ed.execCommand('mceAdd_brea', 'lb', '1');
				break;
			default: // LB
				ed.execCommand('setCounter', 'lb', document.getElementById('number').value);
			}
		}
		if (wce_type == 'gap') {
			if (document.getElementById('unit').value == "line")
				ed.execCommand('mceAdd_brea', 'lb', 0);
			else if (document.getElementById('unit').value == "page")
				ed.execCommand('mceAdd_brea', 'pb', 0);
		}

		// var wceObj=new ed.plugins.wce.WCEObj();
		if (wceObj) {
			wceObj._setWCEVariable(ed);
			wceObj._redrawContols(ed);
		}

	} else {
		// update wce
		if (wce_node != null) {
			if (wce_type == 'paratext') {
				// num or fw
				wce_node.innerHTML = val;
			} else if (wce_type == 'brea') {
				// break type
				wce_node.innerHTML = val;
			}
			wce_node.setAttribute('wce', newWceAttr);
		}
	}

	ed.isNotDirty = 0; 
	tinyMCEPopup.close();
}

/**
 * form unserialize
 * 
 * @param {String}
 *            attribute wce value of wce-node /*
 */
function formUnserialize(str) {
	$('input:checkbox').attr('checked', false);

	if (str == null || str == '')
		return;

	var arr = str.split('&');
	var kv, k, v;

	for ( var i = 2; i < arr.length; i++) {
		kv = arr[i].split('=');
		k = kv[0];
		v = kv[1] == null ? '' : kv[1];
		v = v.replace(/\+/g, ' ');

		if ($('#' + k).attr('type') == 'checkbox') {
			$('#' + k).attr('checked', true);
		} else {
			if (k == 'corrector_text' && corrector_text_editor) {
				corrector_text_editor.setContent(decodeURIComponent(v));
			}
			$('#' + k).val(decodeURIComponent(v));
		}
	}
}

/**
 * form serialize
 * 
 * @param {document-form}
 * @param {String}
 *            name of str, example: new corrector, firsthand, ....
 */
function formSerialize(f, wce_name) {
	if (f == null) {
		f = document.forms[0];
	}

	if (typeof wce_name == 'undefined' || wce_name == null) {
		wce_name = '';
	}

	var arr = $(f).find(':input[@id!=""][@type!="button"][@type!="reset"]');
	var s = type_in_uri + '=' + wce_type + '&' + name_in_uri + '=' + wce_name;
	var a;
	for ( var i = 0, l = arr.length; i < l; i++) {
		a = $(arr[i]);

		if (a.attr('type') == 'checkbox' && !a.attr('checked'))
			continue;

		if (a.attr('id') == 'corrector_text') {
			s += '&' + a.attr('id') + '=' + encodeURIComponent(corrector_text_editor.getContent());
		} else {
			s += '&' + a.attr('id') + '=' + encodeURIComponent(a.val());
		}
	}
	return s;
}

function arrayToString(arr) {
	var s = '';
	for ( var p in arr) {
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
