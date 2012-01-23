tinyMCEPopup.requireLangPack();

//active Editor
var ed = tinyMCE.activeEditor;

//@@@@@ var curr_span_id;

//selected Wce Node
var curr_span = ed.execCommand('getWceNode', false);

//selected Content
var sele_content=ed.selection.getContent();

var alt_wce_arr = [];
var new_wce_arr = [];

var ed_sele='';



if(curr_span!=null){
	ed_sele=$(curr_span).text();
}else if(typeof sele_content!='undefined' && sele_content!=null){
	ed_sele=sele_content.replace(/<\/?[^>]+>/gi, '');
}


// Add new or only edit
var is_add = tinyMCEPopup.getWindowArg('is_add');

function readWceInfo(typ) {
	if (is_add)
		return;

	if (typeof (curr_span) == 'undefined' || curr_span == null)
		return;
	// selectContent in span element,
	// read span_arr

	//@@@@@ alt_wce_arr = getCurrWceArr();
	if (typ != 'wce_corr') {
		setArrToForm(alt_wce_arr['0']);
	}
}

//@@@@@ ≤ª π”√
function getCurrWceArr() {
	var span_arr = tinyMCEPopup.getWindowArg('span_arr');
	curr_span_id = $(curr_span).attr('class').replace(/\D*/, '');
	return span_arr[curr_span_id];
}

function setArrToForm(arr) {
	for ( var p in arr) {
		// radio in menu-abbreviation-highlighted
		if (p == 'overline') {
			$('input:checkbox[name="overline"]').filter('[value="' + arr[p] + '"]').attr('checked', true);
		} else {
			$('#' + p).val(arr[p]);
		}
	}
}

function addWceSpan(ed, sele, typ, val) {
	if (!is_add)
		return;

	curr_span_id = tinyMCEPopup.getWindowArg('span_id');

	var style = "border: 1px  dotted #f00; margin:0px; padding:0;";
	var content;

	switch (typ) {
	case 'wce_brea':
		content = '<span class="' + typ + '_' + curr_span_id + '">&crarr;<br/></span>';
		break;

	case 'wce_gap':
		sele = '[...]';
		break;

	case 'wce_supplied':
		// default
		// content = '<span class="' + typ + '_' + curr_span_id + '" >' + sele +
		// '</span>';
		break;

	case 'wce_unclear': 
		//sele=val;
		var unclear_text = "";
		for ( var i = 0; i < sele.length; i++) {
			unclear_text += sele.charAt(i) + '&#x0323;';
		}
		sele = "[" + unclear_text + "]";
		style += 'color:red';
		// default//
		// content = '<span class="' + typ + '_' + curr_span_id + '" >' + sele +
		// '</span>';
		break;

	/*
	 * case 'wce_numb': var number_value = $('#number_type').val(); if
	 * (number_value == 'chapternumbers') style = 'color:purple'; else if
	 * (number_value == 'ammonian') style = 'color:green'; break;
	 */

	case 'wce_corr':
		style += 'color:blue';
		break;

	case 'wce_note':
		content = sele + '<span style="vertical-align:super; color:blue; font-size:12px" class="' + typ + '_' + curr_span_id + '" >Note</span> ';
		break;

	case 'wce_abbr':
		// default
		// content = '<span class="' + typ + '_' + curr_span_id + '" >' + sele +
		// '</span>';
		if (document.getElementById('add_overline').checked == true) {
			style += "text-decoration:overline";
			content = '<span style="' + style + '" class="' + typ + '_' + curr_span_id + '" >' + sele + '</span> ';
		}
		break;

	case 'wce_spaces':
		// default
		sele='&nbsp;';
		break;

	case 'wce_paratext': 
		// default
		style += 'color:#666';
		sele=val;
		break;

	default:
		content = sele + '<span class=' + typ + '_' + curr_span_id + '</span>';
		break;
	}
 	 
	if (content == null)
		content = '<span style="'+style+'" class="' + typ + '_' + curr_span_id + '" >' + sele + '</span>';

	ed.selection.setContent(content);

	// span_id has been used and create new span_id
	//@@@@@ ed.execCommand('createNewSpanId', false);
}

function addWceInfo(typ, val) {
	var sele = ed.selection.getContent();
	
	addWceSpan(ed, sele, typ, val);
	var newSpan = [];
	newSpan['id'] = curr_span_id;
	var arr = [];
	if (typ == 'wce_corr') {
		arr = currWceArrSort();
		//keine Korrektur
		if(arr.length==0){
			ed.execCommand("wceDelNode");
		}
	} else {
		arr[0] = formToArr();
	}
	newSpan['arr'] = arr;
	ed.execCommand('mceAddInfoToLemma', false, newSpan);
	
	tinyMCEPopup.close();
}

function formToArr(_index) {
	var f = document.forms[0];
	var ai = [];
	var itemName;

	$(f).find(':input').each(function(i, p) {
		if ($(this).attr('type') == 'button' || $(this).attr('type')=='reset')
			return;
		
		itemName = $(this).attr('name');

		if ($(this).attr('type') == 'radio' || $(this).attr('type')=='checkbox') {
			if ($(this).attr('checked') == true)
				ai[itemName] = $(this).val();
		} else {
			ai[itemName] = $(this).val();
		}
	});
	return ai;
}

function currWceArrSort() {
	var temp = []; 
	var _index = 0;
	for ( var p in new_wce_arr) {
		if (new_wce_arr[p] == null)
			continue;
		temp[_index] = new_wce_arr[p];
		_index++;
	}
	return temp;
}