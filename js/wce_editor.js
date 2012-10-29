function setWceEditor(_id) {
	tinyMCE.baseURL = URI('js/').absoluteTo(gadgets.util.getUrlParameters()['url']);
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
		save_onsavecallback : "saveDataToDB",
		// invalid_elements:'p',
		/*
		 * plugins : "wce,pagebreak,style,layer,advhr,advimage,emotions,iespell,inlinepopups,safari,preview,media,searchreplace,print,contextmenu,paste,directionality,fullscreen,noneditable,visualchars,nonbreaking,xhtmlxtras,template,wordcount,advlist,autosave",
		 */
		plugins : "wce,pagebreak,style,save,layer,safari,print,inlinepopups,contextmenu,paste,fullscreen,wordcount,autosave",

		init_instance_callback : "wceReload",

		// Theme options
		theme_advanced_buttons1 : "undo,redo,charmap,|,code,removeformat,|,save,print,contextmenu,cut,copy,paste,fullscreen,|,metadata,breaks,correction,illegible,decoration,abbreviation,paratext,note,|,showTeiByHtml,showHtmlByTei",
		theme_advanced_buttons2 : "",
		theme_advanced_toolbar_location : "top",
		theme_advanced_toolbar_align : "left",
		theme_advanced_statusbar_location : "bottom",
		theme_advanced_resizing : false
	});
	// oninit : function() { // Once initialized, tell the editor to go fullscreen
	// resizeHeight(115);
	// }
}

// wenn brower reload, set editor blank
function wceReload() {
	// for test
	/*var testData = '<span class="chapter_number"> 1</span> <span class="verse_number"> 1</span> βιβλος <span class="corr" wce_orig="γενεσεως" wce="__t=corr&amp;__n=new corrector&amp;undefined=New&amp;original_firsthand_reading=%CE%B3%CE%B5%CE%BD%CE%B5%CF%83%CE%B5%CF%89%CF%82&amp;reading=corr&amp;corrector_name=corrector&amp;corrector_name_other=&amp;place_corr=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_other=0&amp;deletion=null&amp;editorial_note=&amp;corrector_text=%CE%B3%CE%B5%CE%BD%CE%B5%CF%83%CE%B5%CF%89%CF%82&amp;corrector_text_adaptive_selection=on&amp;corr_reset=Reset&amp;undefined=Reset&amp;insert=Insert&amp;cancel=Cancel@__t=corr&amp;__n=new corrector&amp;undefined=New&amp;original_firsthand_reading=%CE%B3%CE%B5%CE%BD%CE%B5%CF%83%CE%B5%CF%89%CF%82&amp;reading=corr&amp;corrector_name=corrector&amp;corrector_name_other=&amp;place_corr=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_other=0&amp;deletion=null&amp;editorial_note=&amp;corrector_text=%CE%B3%CE%B5%CE%BD%CE%B5%CF%83%CE%B5%CF%89%CF%82&amp;corrector_text_adaptive_selection=on&amp;corr_reset=Reset&amp;undefined=Reset&amp;insert=Insert&amp;cancel=Cancel@__t=corr&amp;__n=corrector&amp;undefined=New&amp;original_firsthand_reading=%CE%B3%CE%B5%CE%BD%CE%B5%CF%83%CE%B5%CF%89%CF%82&amp;reading=corr&amp;corrector_name=corrector&amp;corrector_name_other=&amp;place_corr=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_other=0&amp;deletion=null&amp;editorial_note=&amp;corrector_text=%CE%B3%CE%B5%CE%BD%CE%B5%CF%83%CE%B5%CF%89%CF%82&amp;corrector_text_adaptive_selection=on&amp;corr_reset=Reset&amp;undefined=Reset&amp;insert=Insert&amp;cancel=Cancel">γενεσεως</span> ιησου χριστου υιου δαυιδ υιου αβρααμ <span class="verse_number"> 2</span> αβρααμ εγεννησεν τον ισαακ ισαακ δε εγεννησεν τον ιακωβ ιακωβ δε εγεννησεν τον ιουδαν και τους αδελφους αυτου <span class="verse_number"> 3</span> ιουδας δε εγεννησεν τον φαρες και τον ζαρα εκ της θαμαρ φαρες δε εγεννησεν τον εσρωμ εσρωμ δε εγεννησεν τον αραμ <span class="verse_number"> 4</span> αραμ δε εγεννησεν τον αμιναδαβ αμιναδαβ δε εγεννησεν τον ναασσων ναασσων δε εγεννησεν τον σαλμων <span class="verse_number"> 5</span> σαλμων δε εγεννησεν τον βοες εκ της ραχαβ βοες δε εγεννησεν τον ιωβηδ εκ της ρουθ ιωβηδ δε εγεννησεν τον ιεσσαι <span class="verse_number"> 6</span> ιεσσαι δε εγεννησεν τον δαυιδ τον βασιλεα δαυιδ δε εγεννησεν τον σολομωνα εκ της του ουριου <span class="verse_number"> 7</span> σολομων δε εγεννησεν τον ροβοαμ ροβοαμ δε εγεννησεν τον αβια αβια δε εγεννησεν τον ασαφ <span class="verse_number"> 8</span> ασαφ δε εγεννησεν τον ιωσαφατ ιωσαφατ δε εγεννησεν τον ιωραμ ιωραμ δε εγεννησεν τον οζιαν <span class="verse_number"> 9</span> οζιας δε εγεννησεν τον ιωαθαμ ιωαθαμ δε εγεννησεν τον αχαζ αχαζ δε εγεννησεν τον εζεκιαν <span class="verse_number"> 10</span> εζεκιας δε εγεννησεν τον μανασση μανασσης δε εγεννησεν τον αμως αμως δε εγεννησεν τον ιωσιαν <span class="verse_number"> 11</span> ιωσιας δε εγεννησεν τον ιεχονιαν και τους αδελφους αυτου επι της μετοικεσιας βαβυλωνος <span class="verse_number"> 12</span> μετα δε την μετοικεσιαν βαβυλωνος ιεχονιας εγεννησεν τον σαλαθιηλ σαλαθιηλ δε εγεννησεν τον ζοροβαβελ';
	 setData(testData);
	 setTeiIndexData('04');*/
}

// get dirty-value of editor
function isEditorDirty() {
	return tinyMCE.activeEditor.isDirty();
}

// set editor dirty-value
function setEditorNotDirty(b) {
	tinyMCE.activeEditor.isNotDirty = b;
}

// set editor html content
function setData(msg) {
	tinyMCE.activeEditor.setContent(msg);
}

// get editor html content
function getData() {
	return tinyMCE.activeEditor.getContent();
}

// The following parameters should be set before tei-output:
// @param {String} bookNumber: book number, default 00;
// @param {Number} pageNumber: page start number, default 0,
// @param {Number} chapterNumber: chapter number, default 0, only use the if htmlInput not start with chapter/verse;
// @param {Number} verseNumber: verseNumber, default 0, only use the if if htmlInput not start with chapter/verse;
// @param {Number} wordNumber: word start number for <w>, default 0, only use the if htmlInput not start with chapter/verse;
// @param {Number} columnNumber: column number, defualt 0
// @param {Number} witValue: value for wit, defualt 0
function setTeiIndexData(bookNumber, pageNumber, chapterNumber, verseNumber, wordNumber, columnNumber, witValue) {
	var wid = getTeiIndexData();
	if (bookNumber) {
		wid['bookNumber'] = bookNumber;
	}
	if (pageNumber) {
		wid['pageNumber'] = pageNumber;
	}
	if (chapterNumber) {
		wid['chapterNumber'] = chapterNumber;
	}
	if (verseNumber) {
		wid['verseNumber'] = verseNumber;
	}
	if (wordNumber) {
		wid['wordNumber'] = wordNumber;
	}
	if (columnNumber) {
		wid['columnNumber'] = columnNumber;
	}
	if (witValue) {
		wid['witValue'] = witValue;
	}
}

function getTeiIndexData() {
	return tinyMCE.activeEditor.teiIndexData;
}

// get TEI String from editor html content
function getTEI() {
	return getTeiByHtml(getData(), getTeiIndexData());
}

// set editor html content from tei input
// teiIndexData can be change
// @param {String} teiStringInput
function setTEI(teiStringInput) {
	var result = getHtmlByTei(teiStringInput);
	if (result) {
		var htmlContent = result['htmlString'];
		if (htmlContent)
			setData();
	}
	var teiIndexData = result['teiIndexData'];
	if (teiIndexData) {
		tinyMCE.activeEditor.teiIndexData = teiIndexData;
	}
}

function saveDataToDB() {
	if (!tinyMCE.activeEditor.isDirty())
		return;

	// currently we grab the HTML span formatted data, but eventually we'd like to grab the TEI
	var transcriptionData = getData();

	// currently we store to the portal user's personal data store, but eventually we'd like to
	// store to the transcription repository
	var req = opensocial.newDataRequest();
	req.add(req.newUpdatePersonAppDataRequest("VIEWER", 'trans-' + lastPage.docid + '-' + lastPage.pageid, encodeURIComponent(transcriptionData)));
	req.send(function(data) {
		if (data.hadError()) {
			alert(data.getErrorMessage());
			return;
		}
		alert("Changes are saved.");
		if (gadgets.util.hasFeature('pubsub-2'))
			gadgets.Hub.publish("interedition.transcription.saved", null);
	});
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