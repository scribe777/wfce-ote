tinyMCEPopup.requireLangPack();
 
// active Editor
var ed = tinyMCE.activeEditor;

// selected wce node
var wce_node = ed.execCommand('getWceNode', false);

// add new or only edit a wce node
var add_new_wce_node = tinyMCEPopup.getWindowArg('add_new_wce_node');

// selected Content
var selected_content = ed.selection.getContent();

// selected wce-node text / original text
var wce_node_text = '';

// wce-class-name-array <span class="wce_corr@%CE%BBdadffefadvfead" ....
var info_arr = [];

// infomation of other wce_type
var other_info_str = '';

// info arr counter
var item_counter = -1;

// current item ids
var curr_item_id;

// name of item, saved in class.
// <span
// class="__t=corr&amp;__n=othername&amp;reading=corr&amp;blank_firsthand=blank
// ......"> ....</span>
var type_in_uri = ed.wceTypeParamInClass;
var name_in_uri = ed.wceNameParamInClass;

var wce_type;

/**
 * 
 */
function wceInfoInit(wp) {
	wce_type = wp;

	if (wce_node != null) {
		wce_node_text = $(wce_node).text();
		var className = wce_node.className;

		if (typeof className != 'undefined' && className != null) {
			var arr = className.split('@');
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
 * read Information from className and fill the form
 */
function readWceNodeInfo() {
	if (typeof (wce_node) == 'undefined' || wce_node == null)
		return;

	// Information of class write to Form
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

	var new_class = arrayToString(info_arr);
	new_class += other_info_str;   

	if (wce_node != null && new_class == '') {
		ed.execCommand('wceDelNode', false);
		tinyMCEPopup.close();
		return;
	}else if(new_class==''){
		tinyMCEPopup.close();
		return;
	}

	if (add_new_wce_node) {
		// default style
		var style = "border: 1px  dotted #f00; margin:0px 1px 0px 1px ; padding:0;";

		// new content
		var new_content;
		var original_text=' wce_orig="'+selected_content+'" ';

		switch (wce_type) {
		case 'gap':
			var gap_text = "";
			if (document.getElementById('mark_as_supplied').checked == true) {
				gap_text = '[' + selected_content + ']';
				style += 'color:red';
			} else {
				gap_text = '[...]';
				style += 'color:red';
			}
			selected_content = gap_text;
			break;

		case 'brea':
			style += 'color:#666';
			/*
			switch (document.getElementById('break_type').value) {
				case 'lb':
					if (val == 'lb') {
						new_content = '<br/><span style="' + style + '" '+original_text+' class="' + new_class + '">&crarr;</span> ';
					} else { //lbm
						new_content = '<span style="' + style + '" '+original_text+' class="' + new_class + '">&hyphen;<br/>&crarr;</span> ';
					}
				break;
				
				case 'cb':
					new_content = '<br/><span style="' + style + '" '+original_text+' class="' + new_class + '">CB</span><br/>';
					new_content += '<span style="' + style + '" '+original_text+' class="' + '__t=brea&amp;__n=&amp;break_type=lb&amp;number=1&amp;pb_type=&amp;fibre_type=&amp;running_title=&amp;lb_alignment=&amp;insert=Insert&amp;cancel=Cancel' + '">&crarr;</span> ';
				break;
				
				case 'pb':
					new_content = '<br/><span style="' + style + '" '+original_text+' class="' + new_class + '">PB</span><br/>';
				break;
			
				case 'qb':
					new_content = '<br/><span style="' + style + '" '+original_text+' class="' + new_class + '">QB</span><br/>';
				break;
			}
			*/
			selected_content = val;
			break;

		case 'corr':
			//TODO: This just alters the selection to "T" which is not what we want. Instead the original first hand reading has to be saved.
			if (document.getElementById('blank_firsthand').checked) {
				selected_content = 'T';
				style += 'vertical-align:super;font-size:10px;';
			}
			style += 'color:blue';
			break;

		case 'supplied':
			break;

		case 'unclear':
			var unclear_text = "";
			for ( var i = 0; i < selected_content.length; i++) {
				unclear_text += selected_content.charAt(i) + '&#x0323;';
			}
			selected_content = unclear_text;
			break;

		case 'note':
			new_content = selected_content + '<span style="vertical-align:super; color:blue; font-size:12px; margin-right:2px" '+original_text +' class="' + new_class + '" >Note</span>';
			break;

		case 'abbr':
			if (document.getElementById('add_overline').checked == true) {
				style += "text-decoration:overline";
			}
			break;

		case 'spaces':
			// default
			selected_content = '&nbsp;';
			break;

		case 'paratext':
			// default
			style += 'color:#666';
			selected_content = val;
			break;

		default:
			break;

		}

		if (new_content == null)
			new_content = '<span style="' + style + '" '+original_text+' class="' + new_class + '" >' + selected_content + '</span>';
		 
		ed.selection.setContent(new_content);

	} else {
		// update class
		if (wce_node != null) {
			if (wce_type == 'paratext') {
				// num or fw
				wce_node.innerHTML = val;
			} 
			else if (wce_type == 'brea') {
				//break type
				wce_node.innerHTML = val;
			}
			wce_node.className = new_class;
		}
	}

	ed.isNotDirty = 0;
	tinyMCEPopup.close();
}

/**
 * form unserialize
 * 
 * @param {String}
 *            class name of wce-node /*
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
	for ( var i = 0; i < arr.length; i++) {
		a = $(arr[i]);
		if (a.attr('type') == 'checkbox' && !a.attr('checked'))
			continue;

		s += '&' + a.attr('id') + '=' + encodeURIComponent(a.val());
	}
	return s;
}

function arrayToString(arr) {
	var s = '';
	for ( var p in arr) {
		if (p == null || arr[p] == null || p=='c-1')
			continue;

		if (s != '') {
			s += '@';
		}
		s += arr[p];
	}
	return s;
}
