function setWceEditor(_id, rtl, finishCallback, lang, getWitness, getBook, myBaseURL, getManuscriptLang) {
	if (typeof myBaseURL != "undefined" && myBaseURL !== '') {
		tinyMCE.baseURL = myBaseURL;
		tinyMCE.baseURI = new tinyMCE.util.URI(tinyMCE.baseURL);
	}
	tinyMCE.init({
		// General options
		mode : "exact",
		elements : _id,
		theme : "advanced",
		skin : "wce",
		extended_valid_elements : 'span[class|wce_orig|style|wce|id]',
		forced_root_block : false,
		force_br_newlines : true,
		force_p_newlines : false,
		entity_encoding : "raw",
		//entities : "62,diple,8224,obelus",
		theme_advanced_path : false,
		execcommand_callback : 'wceExecCommandHandler',
		save_onsavecallback : "saveDataToDB",
		directionality : (rtl) ? "rtl" : "ltr",
		language : (lang) ? lang : "en",
		book : (getBook) ? getBook : "",
		witness : (getWitness) ? getWitness : "",
		manuscriptLang : (getManuscriptLang) ? getManuscriptLang : "",
		
		// invalid_elements:'p',
		plugins : "wce,pagebreak,style,save,layer,safari,print,inlinepopups,contextmenu,fullscreen,wordcount,autosave",

		init_instance_callback : "wceReload",

		// Theme options
		theme_advanced_buttons1 : "undo,redo,charmap,|,code,|,save,print,contextmenu,cut,copy,paste,fullscreen,|,breaks,correction,illegible,decoration,abbreviation,paratext,note,punctuation,versemodify,|,showTeiByHtml,showHtmlByTei,|,version",
		theme_advanced_buttons2 : "",
		theme_advanced_toolbar_location : "top",
		theme_advanced_toolbar_align : "left",
		theme_advanced_statusbar_location : "bottom",
		theme_advanced_resizing : false,
		oninit : function() {// Once initialized, tell the editor to go fullscreen
			addMenuItems(tinyMCE.activeEditor);
			if (finishCallback)
				finishCallback();
		}
	});
}

// wenn brower reload, set editor blank
function wceReload() {
	// for test
	/*var testData = '<span class="chapter_number"> 1</span> <span class="verse_number"> 1</span> βιβλο? <span class="corr" wce_orig="γενεσεω?" wce="__t=corr&amp;__n=new corrector&amp;undefined=New&amp;original_firsthand_reading=%CE%B3%CE%B5%CE%BD%CE%B5%CF%83%CE%B5%CF%89%CF%82&amp;reading=corr&amp;corrector_name=corrector&amp;corrector_name_other=&amp;place_corr=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_other=0&amp;deletion=null&amp;editorial_note=&amp;corrector_text=%CE%B3%CE%B5%CE%BD%CE%B5%CF%83%CE%B5%CF%89%CF%82&amp;corrector_text_adaptive_selection=on&amp;corr_reset=Reset&amp;undefined=Reset&amp;insert=Insert&amp;cancel=Cancel@__t=corr&amp;__n=new corrector&amp;undefined=New&amp;original_firsthand_reading=%CE%B3%CE%B5%CE%BD%CE%B5%CF%83%CE%B5%CF%89%CF%82&amp;reading=corr&amp;corrector_name=corrector&amp;corrector_name_other=&amp;place_corr=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_other=0&amp;deletion=null&amp;editorial_note=&amp;corrector_text=%CE%B3%CE%B5%CE%BD%CE%B5%CF%83%CE%B5%CF%89%CF%82&amp;corrector_text_adaptive_selection=on&amp;corr_reset=Reset&amp;undefined=Reset&amp;insert=Insert&amp;cancel=Cancel@__t=corr&amp;__n=corrector&amp;undefined=New&amp;original_firsthand_reading=%CE%B3%CE%B5%CE%BD%CE%B5%CF%83%CE%B5%CF%89%CF%82&amp;reading=corr&amp;corrector_name=corrector&amp;corrector_name_other=&amp;place_corr=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_other=0&amp;deletion=null&amp;editorial_note=&amp;corrector_text=%CE%B3%CE%B5%CE%BD%CE%B5%CF%83%CE%B5%CF%89%CF%82&amp;corrector_text_adaptive_selection=on&amp;corr_reset=Reset&amp;undefined=Reset&amp;insert=Insert&amp;cancel=Cancel">γενεσεω?</span> ιησου χριστου υιου δαυιδ υιου αβρααμ <span class="verse_number"> 2</span> αβρααμ εγεννησεν τον ισαακ ισαακ δε εγεννησεν τον ιακωβ ιακωβ δε εγεννησεν τον ιουδαν και του? αδελφου? αυτου <span class="verse_number"> 3</span> ιουδα? δε εγεννησεν τον φαρε? και τον ζαρα εκ τη? θαμαρ φαρε? δε εγεννησεν τον εσρωμ εσρωμ δε εγεννησεν τον αραμ <span class="verse_number"> 4</span> αραμ δε εγεννησεν τον αμιναδαβ αμιναδαβ δε εγεννησεν τον ναασσων ναασσων δε εγεννησεν τον σαλμων <span class="verse_number"> 5</span> σαλμων δε εγεννησεν τον βοε? εκ τη? ραχαβ βοε? δε εγεννησεν τον ιωβηδ εκ τη? ρουθ ιωβηδ δε εγεννησεν τον ιεσσαι <span class="verse_number"> 6</span> ιεσσαι δε εγεννησεν τον δαυιδ τον βασιλεα δαυιδ δε εγεννησεν τον σολομωνα εκ τη? του ουριου <span class="verse_number"> 7</span> σολομων δε εγεννησεν τον ροβοαμ ροβοαμ δε εγεννησεν τον αβια αβια δε εγεννησεν τον ασαφ <span class="verse_number"> 8</span> ασαφ δε εγεννησεν τον ιωσαφατ ιωσαφατ δε εγεννησεν τον ιωραμ ιωραμ δε εγεννησεν τον οζιαν <span class="verse_number"> 9</span> οζια? δε εγεννησεν τον ιωαθαμ ιωαθαμ δε εγεννησεν τον αχαζ αχαζ δε εγεννησεν τον εζεκιαν <span class="verse_number"> 10</span> εζεκια? δε εγεννησεν τον μανασση μανασση? δε εγεννησεν τον αμω? αμω? δε εγεννησεν τον ιωσιαν <span class="verse_number"> 11</span> ιωσια? δε εγεννησεν τον ιεχονιαν και του? αδελφου? αυτου επι τη? μετοικεσια? βαβυλωνο? <span class="verse_number"> 12</span> μετα δε την μετοικεσιαν βαβυλωνο? ιεχονια? εγεννησεν τον σαλαθιηλ σαλαθιηλ δε εγεννησεν τον ζοροβαβελ';
	
	testData='<span class="corr" wce_orig="T%3Cspan%20class%3D%22unclear%22%20wce_orig%3D%22e%22%20wce%3D%22__t%3Dunclear%26amp%3B__n%3D%26amp%3Bunclear_text_reason%3D%26amp%3Bunclear_text_reason_other%3D%22%3E%3Cspan%20class%3D%22format_start%22%3E%E2%80%B9%3C%2Fspan%3Ee%CC%A3%3Cspan%20class%3D%22format_end%22%3E%E2%80%BA%3C%2Fspan%3E%3C%2Fspan%3Est" wce="__t=corr&amp;__n=corrector&amp;original_firsthand_reading=T%3Cspan%20class%3D%22unclear%22%20wce_orig%3D%22e%22%20wce%3D%22__t%3Dunclear%26amp%3B__n%3D%26amp%3Bunclear_text_reason%3D%26amp%3Bunclear_text_reason_other%3D%22%3E%3Cspan%20class%3D%22format_start%22%3E%E2%80%B9%3C%2Fspan%3Ee%CC%A3%3Cspan%20class%3D%22format_end%22%3E%E2%80%BA%3C%2Fspan%3E%3C%2Fspan%3Est&amp;common_firsthand_partial=&amp;reading=corr&amp;corrector_name=corrector&amp;corrector_name_other=&amp;place_corr=&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_other=0&amp;deletion=null&amp;firsthand_partial=&amp;partial=&amp;corrector_text=Test"><span class="format_start">‹</span>T<span class="unclear" wce_orig="e" wce="__t=unclear&amp;__n=&amp;unclear_text_reason=&amp;unclear_text_reason_other="><span class="format_start">‹</span>ẹ<span class="format_end">›</span></span>st<span class="format_end">›</span></span>';
	testData='abc def';
	setData(testData);
	*/
	setTeiIndexData(tinymce.get(tinyMCE.activeEditor.id).settings.book, tinymce.get(tinyMCE.activeEditor.id).settings.witness, tinymce.get(tinyMCE.activeEditor.id).settings.manuscriptLang);
//setTEI('<?xml version="1.0" encoding="utf-8"?> <!DOCTYPE TEI [<!ENTITY om "">]> <?xml-model href="TEI-NTMSS.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?> <TEI xmlns="http://www.tei-c.org/ns/1.0"> <teiHeader> <fileDesc> <titleStmt> <title/> </titleStmt> <publicationStmt> <publisher/> </publicationStmt> <sourceDesc> <msDesc> <msIdentifier> </msIdentifier> </msDesc> </sourceDesc> </fileDesc> </teiHeader> <text> <body><ab n="B04K21V18"><gap extent="rest" unit="verse" reason="lacuna/illegible"/><gap extent="16" unit="char" reason="lacuna/illegible"/><w><gap extent="part" unit="word" reason="lacuna/illegible"/><unclear>νε</unclear>ι<supplied reason="lacuna/illegible">ς</supplied></w><lb xml:id="P1xC1L2-P109" n="2"/><w><supplied reason="lacuna/illegible">τας</supplied></w><w><supplied reason="lacuna/illegible">χειρας</supplied></w><w><supplied reason="lacuna/illegible"                   >σου</supplied></w><w><unclear>κ</unclear>αι</w><w>αλλοι</w><lb xml:id="P1xC1L3-P109" n="3"/><w><gap extent="12" unit="char" reason="lacuna/illegible"                                />ουσι<unclear>ν</unclear></w><w><unclear>σε</unclear></w><lb xml:id="P1xC1L4-P109" n="4"/><w><supplied reason="lacuna/illegible">οπου</supplied></w><w><supplied reason="lacuna/illegible"  >ου</supplied></w><w><supplied reason="lacuna/illegible">θελεις</supplied></w></ab></body> </text> </TEI>');
	//setTeiIndexData(getWitness(), getBook(), getManuscriptLang());
	//setTEI('<?xml version="1.0" encoding="utf-8"?> <!DOCTYPE TEI [<!ENTITY om "">]> <?xml-model href="TEI-NTMSS.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?> <TEI xmlns="http://www.tei-c.org/ns/1.0"> <teiHeader> <fileDesc> <titleStmt> <title/> </titleStmt> <publicationStmt> <publisher/> </publicationStmt> <sourceDesc> <msDesc> <msIdentifier> </msIdentifier> </msDesc> </sourceDesc> </fileDesc> </teiHeader> <text> <body><ab><w>ευαγγελ<supplied reason="lacuna/illegible">ιον</supplied></w><lb                          xml:id="P1yC1L4-P2" n="4"/></ab><ab n="B04K12V12"><seg subtype="lineleft" type="margin"                       ><pc>†</pc></seg><w>τη</w><w>επαυριον</w><w>οχλος</w><w><unclear>π</unclear><supplied reason="lacuna/illegible">ολυς</supplied></w><w><supplied                            reason="lacuna/illegible">ο</supplied></w><w><supplied reason="lacuna/illegible">ελθων</supplied></w><w><supplied                            reason="lacuna/illegible">εις</supplied></w><w><supplied reason="lacuna/illegible">την</supplied></w><lb xml:id="P1yC1L5-P2"                        n="5"/><w>εορτην</w><w>ακουσαν<unclear>τ</unclear><supplied reason="lacuna/illegible">ες</supplied></w><w><supplied                            reason="lacuna/illegible">οτι</supplied></w><w><supplied reason="lacuna/illegible">ερχεται</supplied></w><w><supplied                            reason="lacuna/illegible">ο</supplied></w><w><abbr type="nomSac"><supplied reason="lacuna/illegible"><hi rend="overline">ις</hi></supplied></abbr></w><lb xml:id="P1yC1L6-P2" n="6"   /><w>εις</w><w>ϊερου<supplied reason="lacuna/illegible">σαλ</supplied><unclear>ημ</unclear></w></ab><ab n="B04K12V13"><w><unclear>ε</unclear><supplied reason="lacuna/illegible"       >λαβον</supplied></w><w><supplied reason="lacuna/illegible">τα</supplied></w><w><supplied reason="lacuna/illegible">βαια</supplied></w><w><supplied reason="lacuna/illegible"                 >των</supplied></w><lb xml:id="P1yC1L7-P2" n="7"/><w>φοινικων</w><w>κ<supplied reason="lacuna/illegible">αι</supplied></w><w><supplied reason="lacuna/illegible"                       >εξηλθον</supplied></w><w><supplied reason="lacuna/illegible">εις</supplied></w><w><supplied reason="lacuna/illegible">υπαντησιν</supplied></w><w><supplied reason="lacuna/illegible"      >αυτω</supplied></w><lb xml:id="P1yC1L8-P2" n="8"/><w><supplied reason="lacuna/illegible">κα</supplied>ι</w><w>εκραυ<supplied                      reason="lacuna/illegible">γαζον</supplied></w><w><supplied reason="lacuna/illegible">ωσαννα</supplied></w><w><supplied                            reason="lacuna/illegible">ευλογημενος</supplied></w><lb xml:id="P1yC1L9-P2" n="9"/><w><supplied reason="lacuna/illegible">ο</supplied></w><w>ερχομε<supplied reason="lacuna/illegible"       >νος</supplied></w><w><supplied reason="lacuna/illegible">εν</supplied></w><w><supplied reason="lacuna/illegible">ονοματι</supplied></w><w><abbr type="nomSac"><supplied               reason="lacuna/illegible"><hi rend="overline">κυ</hi></supplied></abbr></w><w><supplied reason="lacuna/illegible">ο</supplied></w><w><supplied reason="lacuna/illegible"            >βασιλευς</supplied></w><lb xml:id="P1yC1L10-P2" n="10"/><w><supplied reason="lacuna/illegible">τ</supplied>ου</w><w><abbr type="nomSac"><hi                                rend="overline">ϊηλ</hi></abbr></w></ab></body></text></TEI>');
	
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
function setTeiIndexData(bookNumber, witValue, manuscriptLang) {
	var wid = getTeiIndexData();
	if (bookNumber) {
		wid['bookNumber'] = bookNumber;
	}
	if (witValue) {
		wid['witValue'] = witValue;
	}
	if (manuscriptLang) {
		wid['manuscriptLang'] = manuscriptLang;
	}
}

function getTeiIndexData() {
	return tinyMCE.activeEditor.teiIndexData;
}

// get TEI String from editor html content
function getTEI() {
	teiIndexData[0] = tinymce.get(tinyMCE.activeEditor.id).settings.book;
	teiIndexData[1] = tinymce.get(tinyMCE.activeEditor.id).settings.witness;
	teiIndexData[2] = tinymce.get(tinyMCE.activeEditor.id).settings.manuscriptLang;
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
			setData(htmlContent);
	}
	var teiIndexData = result['teiIndexData'];
	if (teiIndexData) {
		tinyMCE.activeEditor.teiIndexData = teiIndexData;
	}
	resetCounter(); //for resetting the counter each time this method is called
	return 0;
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

function setPreferredFontFamily(fontFamily) {
	$('#wce_editor_ifr').contents().find('#tinymce').css('font-family', fontFamily);
}

function increaseLineHeight() {
	/*
	 * var lineheight = document.getElementById($(this)).style.lineHeight; alert(document.getElementsByTagName('textarea')[0].style.lineHeight); document.getElementByTagName('wce_editor').style.lineHeight = "30px";
	 */
}

function decreaseLineHeight() {

}

function resetCounter() {
	var v = tinyMCE.activeEditor.WCE_VAR;
	if (!v)
		return false;
	// quire count
	v.qcnt = 0;
	// page count
	v.pcnt = 0;
	// column count
	v.ccnt = 1; //Because of the predefined part from the NTVMR
	// line count
	v.lcnt = 1; //Because of the predefined part from the NTVMR
	// counting as r/v
	v.rectoverso = 'true';
	return true;
}

function addMenuItems(ed) {
	//var wceAttr = '';
	var isPreviousActive = false;
	var b = false;
	ed.plugins.contextmenu.onContextMenu.add(function(th, menu, event) {
		// added my options
		if (ed.selection.getNode().getAttribute('wce') != null && ed.selection.getNode().getAttribute('wce').substring(4, 16) == 'verse_number') {
			//wceAttr = ed.selection.getNode().getAttribute('wce');
			menu.addSeparator();
			menu.add({
				title : ed.getLang('wce.initial_portion'),
				icon : '',
				cmd : 'mce_partialI'
			});
			menu.add({
				title : ed.getLang('wce.medial_portion'),
				icon : '',
				cmd : 'mce_partialM'
			});
			menu.add({
				title : ed.getLang('wce.final_portion'),
				icon : '',
				cmd : 'mce_partialF'
			});
			menu.add({
				title : ed.getLang('wce.remove_partial'),
				icon : '',
				cmd : 'mce_partial_remove'
			});
		} else if (ed.selection.getNode().getAttribute('wce') != null && ed.selection.getNode().getAttribute('wce').indexOf('break_type=pb') > -1 
			&& ed.selection.getNode().textContent.indexOf('PB') > -1) {
			isPreviousActive = (ed.selection.getNode().getAttribute('wce').indexOf('hasBreak=yes') > -1);
			menu.add({
				title : ed.getLang('wce.previous_hyphenation'),
				icon : '',
				onclick : function() {
					ed.execCommand('mce_previous_hyphenation', true);
					}
			}).setDisabled(isPreviousActive);
			menu.add({
				title : ed.getLang('wce.no_previous_hyphenation'),
				icon : '',
				onclick : function() {
					ed.execCommand('mce_previous_hyphenation', false);
					}
			}).setDisabled(!isPreviousActive);
		}
	});

	ed.addCommand('mce_partialI', function() {
		ed.selection.getNode().setAttribute('wce', '__t=verse_number' + '&partial=I');
	});
	ed.addCommand('mce_partialM', function() {
		ed.selection.getNode().setAttribute('wce', '__t=verse_number' + '&partial=M');
	});
	ed.addCommand('mce_partialF', function() {
		ed.selection.getNode().setAttribute('wce', '__t=verse_number' + '&partial=F');
	});
	ed.addCommand('mce_partial_remove', function() {
		ed.selection.getNode().setAttribute('wce', '__t=verse_number');
	});
	ed.addCommand('mce_previous_hyphenation', function(b) {
		var oldwce = ed.selection.getNode().getAttribute('wce');
		if (b == true) {
			ed.selection.getNode().setAttribute('wce', oldwce.replace("hasBreak=no", "hasBreak=yes"));
			ed.selection.getNode().innerHTML = ed.WCE_CON.startFormatHtml + '&#8208;<br />PB' + ed.WCE_CON.endFormatHtml;
		} else {
			ed.selection.getNode().setAttribute('wce', oldwce.replace("hasBreak=yes", "hasBreak=no"));
			ed.selection.getNode().innerHTML = ed.WCE_CON.startFormatHtml + '<br />PB' + ed.WCE_CON.endFormatHtml;
		}
	});
}

if (( typeof Range !== "undefined") && !Range.prototype.createContextualFragment) {
	Range.prototype.createContextualFragment = function(html) {
		var frag = document.createDocumentFragment(), div = document.createElement("div");
		frag.appendChild(div);
		div.outerHTML = html;
		return frag;
	};
}
/*
function getWitness() {
	return 'witnessPlaceholder';
}


function getBook() {
	return 'bookPlaceholder';
}

function getManuscriptLang() {
	return 'whatever';
}
*/