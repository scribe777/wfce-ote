function setWceEditor(_id) {
	tinyMCE.baseURL= URI('js/').absoluteTo(gadgets.util.getUrlParameters()['url']);
	tinyMCE.baseURI = new tinyMCE.util.URI(tinyMCE.baseURL);
	tinyMCE.init({
		// General options
		mode : "exact", 
		elements : _id,
		theme : "advanced",
		skin : "wce",
		extended_valid_elements : 'span[class|wce_orig|style|wce]',
		forced_root_block : false,
		force_br_newlines : true,
		force_p_newlines : false,
		entity_encoding : "raw",
		theme_advanced_path : false,
		execcommand_callback : 'wceExecCommandHandler',

		// invalid_elements:'p',
		/*
		 * plugins : "wce,pagebreak,style,layer,advhr,advimage,emotions,iespell,inlinepopups,safari,preview,media,searchreplace,print,contextmenu,paste,directionality,fullscreen,noneditable,visualchars,nonbreaking,xhtmlxtras,template,wordcount,advlist,autosave",
		 */
		plugins : "wce,pagebreak,style,layer,safari,print,inlinepopups, contextmenu,paste,fullscreen,wordcount,autosave",

		init_instance_callback : "wceReload",

		// Theme options
		theme_advanced_buttons1 : "undo,redo,charmap,|,code,removeformat,|,print,contextmenu,paste,fullscreen,|,metadata,breaks,correction,illegible,decoration,abbreviation,paratext,note,|,xmloutput",
		theme_advanced_buttons2 : "",
		theme_advanced_toolbar_location : "top",
		theme_advanced_toolbar_align : "left",
		theme_advanced_statusbar_location : "bottom",
		theme_advanced_resizing : false
	});
	//oninit : function() {  // Once initialized, tell the editor to go fullscreen
	//	resizeHeight(115);
	//}
}

var user_id, user_text_name;

// wenn brower reload, set editor blank
function wceReload() {
	// setData('');
}

// get dirty-value of editor
function isEditorDirty() {
	return tinyMCE.activeEditor.isDirty();
}

// set editor dirty-value
function setEditorNotDirty(b) {
	tinyMCE.activeEditor.isNotDirty = b;
}

// set editor content
function setData(msg) {
	tinyMCE.activeEditor.setContent(msg);
}

// get editor content
function getData() {
	return tinyMCE.activeEditor.getContent();
}

// get xml from get_xml.php/mysql-database
function getXmlData() {
	if (typeof user_id == 'undefined' || typeof user_text_name == 'undefined') {
		alert('Error user_text_name / in user_id ');
		return;
	}

	window.open('php/get_xml.php?userid=' + user_id + '&textname=' + user_text_name, 'xml');
}


function saveDataToDB() {
	if (!tinyMCE.activeEditor.isDirty())
		return;

	// currently we grab the HTML span formatted data, but eventually we'd like to grab the TEI
	var transcriptionData = getData();


	// currently we store to the portal user's personal data store, but eventually we'd like to
	// store to the transcription repository
	var req = opensocial.newDataRequest();
	req.add(req.newUpdatePersonAppDataRequest("VIEWER", 'trans-'+lastPage.docid+'-'+lastPage.pageid, encodeURIComponent(transcriptionData)));
	req.send(function(data) {
		if (data.hadError()) {
			alert(data.getErrorMessage());
			return;
		}
		alert("Changes are saved.");
		if (gadgets.util.hasFeature('pubsub-2')) gadgets.Hub.publish("interedition.transcription.saved", null);
	});
}

// save editor-content to mysql-database

// function saveDataToDB(user_text_name, chapter, user_id) {
	// if (!tinyMCE.activeEditor.isDirty())
		// return;

	// for ( var i = 0; i < arguments.length; i++) {
		// if (typeof arguments[i] == 'undefined' || arguments[i] == '')
			// return;
	// }

	// $.ajax({
		// type : 'POST',
		// url : 'php/save.php',
		// data : {
			// 'filename' : user_text_name,
			// 'chapter' : chapter,
			// 'text' : getData(),
			// 'userid' : user_id,
			// 'metadata' : getMetaData()
		// },
		// success : function(msg) {
			// setEditorNotDirty(1);
			// alert(msg + "Changes are saved ");
		// }
	// });
// }

//
function setMetaData(msg) {
	tinyMCE.activeEditor.wceMetaData = msg;
}

//
function getMetaData() {
	return tinyMCE.activeEditor.wceMetaData;
}

function increaseLineHeight() {
	/*
	 * var lineheight = document.getElementById($(this)).style.lineHeight; alert(document.getElementsByTagName('textarea')[0].style.lineHeight); document.getElementByTagName('wce_editor').style.lineHeight = "30px";
	 */
}

function decreaseLineHeight() {

}

if ((typeof Range !== "undefined") && !Range.prototype.createContextualFragment) {
	Range.prototype.createContextualFragment = function(html) {
		var frag = document.createDocumentFragment(), div = document.createElement("div");
		frag.appendChild(div);
		div.outerHTML = html;
		return frag;
	};
}