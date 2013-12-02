function setWceEditor(_id, rtl, finishCallback, lang, getWitness, getBook, myBaseURL, getManuscriptLang) {
	if (myBaseURL && typeof myBaseURL != "undefined" && myBaseURL !== '') {
		tinyMCE.baseURL = myBaseURL;
		tinyMCE.baseURI = new tinyMCE.util.URI(tinyMCE.baseURL);
	}
	  
	tinyMCE.init({
		// General options
		mode : "exact",
		elements : _id,
		theme : "advanced",
		skin : "wce",
		extended_valid_elements : 'span[class|wce_orig|style|wce|ext]',
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
	/*
	var testData='aaa <span class="abbr_add_overline" wce_orig="%3Cspan%20class%3D%22unclear%22%20wce_orig%3D%22bbbbbb%22%20wce%3D%22__t%3Dunclear%26amp%3B__n%3D%26amp%3Bunclear_text_reason%3D%26amp%3Bunclear_text_reason_other%3D%22%3E%3Cspan%20class%3D%22format_start%22%3E%E2%80%B9%3C%2Fspan%3Eb%CC%A3b%CC%A3b%CC%A3b%CC%A3b%CC%A3b%CC%A3%3Cspan%20class%3D%22format_end%22%3E%E2%80%BA%3C%2Fspan%3E%3C%2Fspan%3E" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;abbr_type=nomSac&amp;abbr_type_other=&amp;add_overline=overline@__t=unclear&amp;__n=&amp;unclear_text_reason=&amp;unclear_text_reason_other=" ext="inabbr"><span class="format_start">‹</span><span class="unclear" wce_orig="bbbbbb" wce="__t=unclear&amp;__n=&amp;unclear_text_reason=&amp;unclear_text_reason_other="><span class="format_start">‹</span>ḅḅ<span class="gap" wce_orig="b%CC%A3b%CC%A3" wce="__t=gap&amp;__n=&amp;original_gap_text=&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=lacuna%2Fillegible&amp;gap_reason=illegible&amp;unit=&amp;unit_other=&amp;extent=&amp;mark_as_supplied=supplied&amp;supplied_source=na28&amp;supplied_source_other=@__t=unclear&amp;__n=&amp;unclear_text_reason=&amp;unclear_text_reason_other=" ext="inabbr"><span class="format_start">‹</span>[ḅḅ]<span class="format_end">›</span></span>ḅḅ<span class="format_end">›</span></span><span class="format_end">›</span></span> ccc';
 	testData='aaa <span class="abbr_add_overline" wce_orig="%3Cspan%20class%3D%22unclear%22%20wce_orig%3D%22bbbbbb%22%20wce%3D%22__t%3Dunclear%26amp%3B__n%3D%26amp%3Bunclear_text_reason%3D%26amp%3Bunclear_text_reason_other%3D%22%3E%3Cspan%20class%3D%22format_start%22%3E%E2%80%B9%3C%2Fspan%3Eb%CC%A3b%CC%A3b%CC%A3b%CC%A3b%CC%A3b%CC%A3%3Cspan%20class%3D%22format_end%22%3E%E2%80%BA%3C%2Fspan%3E%3C%2Fspan%3E" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;abbr_type=nomSac&amp;abbr_type_other=&amp;add_overline=overline@__t=unclear&amp;__n=&amp;unclear_text_reason=&amp;unclear_text_reason_other=" ext="inabbr"><span class="format_start">‹</span><span class="unclear" wce_orig="bbbbbb" wce="__t=unclear&amp;__n=&amp;unclear_text_reason=&amp;unclear_text_reason_other="><span class="format_start">‹</span><span class="gap" wce_orig="b%CC%A3b%CC%A3" wce="__t=gap&amp;__n=&amp;original_gap_text=&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=lacuna%2Fillegible&amp;gap_reason=illegible&amp;unit=&amp;unit_other=&amp;extent=&amp;mark_as_supplied=supplied&amp;supplied_source=na28&amp;supplied_source_other=@__t=unclear&amp;__n=&amp;unclear_text_reason=&amp;unclear_text_reason_other=" ext="inabbr"><span class="format_start">‹</span>[ḅḅ]<span class="format_end">›</span></span><span class="format_end">›</span></span><span class="format_end">›</span></span> ccc';
 	setData(testData);*/
	//var sett=tinymce.get(tinyMCE.activeEditor.id).settings;
	//setTeiIndexData(sett.book,sett.witness,sett.manuscriptLang);
	
	//setTeiIndexData(tinymce.get(tinyMCE.activeEditor.id).settings.book, tinymce.get(tinyMCE.activeEditor.id).settings.witness, tinymce.get(tinyMCE.activeEditor.id).settings.manuscriptLang);
//setTEI('<?xml version="1.0" encoding="utf-8"?> <!DOCTYPE TEI [<!ENTITY om "">]> <?xml-model href="TEI-NTMSS.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?> <TEI xmlns="http://www.tei-c.org/ns/1.0"> <teiHeader> <fileDesc> <titleStmt> <title/> </titleStmt> <publicationStmt> <publisher/> </publicationStmt> <sourceDesc> <msDesc> <msIdentifier> </msIdentifier> </msDesc> </sourceDesc> </fileDesc> </teiHeader> <text> <body><ab n="B04K21V18"><gap extent="rest" unit="verse" reason="lacuna/illegible"/><gap extent="16" unit="char" reason="lacuna/illegible"/><w><gap extent="part" unit="word" reason="lacuna/illegible"/><unclear>νε</unclear>ι<supplied reason="lacuna/illegible">ς</supplied></w><lb xml:id="P1xC1L2-P109" n="2"/><w><supplied reason="lacuna/illegible">τας</supplied></w><w><supplied reason="lacuna/illegible">χειρας</supplied></w><w><supplied reason="lacuna/illegible"                   >σου</supplied></w><w><unclear>κ</unclear>αι</w><w>αλλοι</w><lb xml:id="P1xC1L3-P109" n="3"/><w><gap extent="12" unit="char" reason="lacuna/illegible"                                />ουσι<unclear>ν</unclear></w><w><unclear>σε</unclear></w><lb xml:id="P1xC1L4-P109" n="4"/><w><supplied reason="lacuna/illegible">οπου</supplied></w><w><supplied reason="lacuna/illegible"  >ου</supplied></w><w><supplied reason="lacuna/illegible">θελεις</supplied></w></ab></body> </text> </TEI>');
	//setTeiIndexData(getWitness(), getBook(), getManuscriptLang());
	//setTEI('<?xml version="1.0" encoding="utf-8"?> <!DOCTYPE TEI [<!ENTITY om "">]> <?xml-model href="TEI-NTMSS.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?> <TEI xmlns="http://www.tei-c.org/ns/1.0"> <teiHeader> <fileDesc> <titleStmt> <title/> </titleStmt> <publicationStmt> <publisher/> </publicationStmt> <sourceDesc> <msDesc> <msIdentifier> </msIdentifier> </msDesc> </sourceDesc> </fileDesc> </teiHeader> <text> <body><ab><w>ευαγγελ<supplied reason="lacuna/illegible">ιον</supplied></w><lb                          xml:id="P1yC1L4-P2" n="4"/></ab><ab n="B04K12V12"><seg subtype="lineleft" type="margin"                       ><pc>†</pc></seg><w>τη</w><w>επαυριον</w><w>οχλος</w><w><unclear>π</unclear><supplied reason="lacuna/illegible">ολυς</supplied></w><w><supplied                            reason="lacuna/illegible">ο</supplied></w><w><supplied reason="lacuna/illegible">ελθων</supplied></w><w><supplied                            reason="lacuna/illegible">εις</supplied></w><w><supplied reason="lacuna/illegible">την</supplied></w><lb xml:id="P1yC1L5-P2"                        n="5"/><w>εορτην</w><w>ακουσαν<unclear>τ</unclear><supplied reason="lacuna/illegible">ες</supplied></w><w><supplied                            reason="lacuna/illegible">οτι</supplied></w><w><supplied reason="lacuna/illegible">ερχεται</supplied></w><w><supplied                            reason="lacuna/illegible">ο</supplied></w><w><abbr type="nomSac"><supplied reason="lacuna/illegible"><hi rend="overline">ις</hi></supplied></abbr></w><lb xml:id="P1yC1L6-P2" n="6"   /><w>εις</w><w>ϊερου<supplied reason="lacuna/illegible">σαλ</supplied><unclear>ημ</unclear></w></ab><ab n="B04K12V13"><w><unclear>ε</unclear><supplied reason="lacuna/illegible"       >λαβον</supplied></w><w><supplied reason="lacuna/illegible">τα</supplied></w><w><supplied reason="lacuna/illegible">βαια</supplied></w><w><supplied reason="lacuna/illegible"                 >των</supplied></w><lb xml:id="P1yC1L7-P2" n="7"/><w>φοινικων</w><w>κ<supplied reason="lacuna/illegible">αι</supplied></w><w><supplied reason="lacuna/illegible"                       >εξηλθον</supplied></w><w><supplied reason="lacuna/illegible">εις</supplied></w><w><supplied reason="lacuna/illegible">υπαντησιν</supplied></w><w><supplied reason="lacuna/illegible"      >αυτω</supplied></w><lb xml:id="P1yC1L8-P2" n="8"/><w><supplied reason="lacuna/illegible">κα</supplied>ι</w><w>εκραυ<supplied                      reason="lacuna/illegible">γαζον</supplied></w><w><supplied reason="lacuna/illegible">ωσαννα</supplied></w><w><supplied                            reason="lacuna/illegible">ευλογημενος</supplied></w><lb xml:id="P1yC1L9-P2" n="9"/><w><supplied reason="lacuna/illegible">ο</supplied></w><w>ερχομε<supplied reason="lacuna/illegible"       >νος</supplied></w><w><supplied reason="lacuna/illegible">εν</supplied></w><w><supplied reason="lacuna/illegible">ονοματι</supplied></w><w><abbr type="nomSac"><supplied               reason="lacuna/illegible"><hi rend="overline">κυ</hi></supplied></abbr></w><w><supplied reason="lacuna/illegible">ο</supplied></w><w><supplied reason="lacuna/illegible"            >βασιλευς</supplied></w><lb xml:id="P1yC1L10-P2" n="10"/><w><supplied reason="lacuna/illegible">τ</supplied>ου</w><w><abbr type="nomSac"><hi                                rend="overline">ϊηλ</hi></abbr></w></ab></body></text></TEI>');
	//setTEI('<?xml version="1.0" encoding="utf-8"?><?xml-stylesheet type="text/xsl" href="NTPapyri.xsl"?><TEI xmlns="http://www.tei-c.org/ns/1.0"><teiHeader><fileDesc><titleStmt><title/></titleStmt><publicationStmt><publisher/></publicationStmt><sourceDesc><msDesc><msIdentifier></msIdentifier></msDesc></sourceDesc></fileDesc></teiHeader><text><body><pb n="001r" type="folio" xml:id="P001r-"/><cb n="1" xml:id="P001rC1-"/><lb n="1" xml:id="P001rC1L1-"/><div type="book" n="B01"><div type="chapter" n="B01K1"><ab n="B01K1V1"><w>βιβλος</w> <w>γενεσεως</w> <w><abbr type="nomSac"><hi rend="overline">ιυχυ</hi></abbr></w> <w>υιου</w> <w><abbr type="nomSac"><hi rend="overline">δαδ</hi></abbr></w> <w>υιου</w> <w>αβρααμ</w></ab> <ab n="B01K1V2"><w>αβρααμ</w> <w>εγεννησεν</w> <w>τον</w> <w>ισαακ</w> <w>ισαακ</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>ιακωβ</w> <w>ιακωβ</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>ιουδαν</w> <w>και</w> <w>τους</w> <w>αδελφους</w> <w>αυτου</w></ab> <ab n="B01K1V3"><app><rdg type="orig" hand="firsthand"><w>ιουδας</w></rdg><rdg type="corr" hand="corrector">&om;</rdg></app> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>φαρες</w> <w>και</w> <w>τον</w> <w>ζαρα</w> <w>εκ</w> <w>της</w> <w>θαμαρ</w> <w>φαρες</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>εσρωμ</w> <w>εσρωμ</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>αραμ</w></ab> <ab n="B01K1V4"><w>αραμ</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>αμιναδαβ</w> <w>αμιναδαβ</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>ναασσων</w> <w>ναασσων</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>σαλμων</w></ab> <ab n="B01K1V5"><w>σαλμων</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>βοες</w> <w>εκ</w> <w>της</w> <w>ραχαβ</w> <w>βοες</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>ιωβηδ</w> <w>εκ</w> <w>της</w> <w>ρουθ</w> <w>ιωβηδ</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>ιεσσαι</w></ab> <ab n="B01K1V6"><w>ιεσσαι</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w><abbr type="nomSac"><hi rend="overline">δαδ</hi></abbr></w> <w>τον</w> <w>βασιλεα</w> <w><abbr type="nomSac"><hi rend="overline">δαδ</hi></abbr></w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>σολομωνα</w> <w>εκ</w> <w>της</w> <w>του</w> <w>ουριου</w></ab> <ab n="B01K1V7"><w>σολομων</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>ροβοαμ</w> <w>ροβοαμ</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>αβια</w> <w>αβια</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>ασαφ</w></ab> <ab n="B01K1V8"><w>ασαφ</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>ιωσαφατ</w> <w>ιωσαφατ</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>ιωραμ</w> <w>ιωραμ</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>οζιαν</w></ab> <ab n="B01K1V9"><w>οζιας</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>ιωαθαμ</w> <w>ιωαθαμ</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>αχαζ</w> <w>αχαζ</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>εζεκιαν</w></ab> <ab n="B01K1V10"><w>εζεκιας</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>μανασση</w> <w>μανασσης</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>αμως</w> <w>αμως</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>ιωσιαν</w></ab> <ab n="B01K1V11"><w>ιωσιας</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>ιεχονιαν</w> <w>και</w> <w>τους</w> <w>αδελφους</w> <w>αυτου</w> <w>επι</w> <w>της</w> <w>μετοικεσιας</w> <w>βαβυλωνος</w></ab> <ab n="B01K1V12"><w>μετα</w> <w>δε</w> <w>την</w> <w>μετοικεσιαν</w> <w>βαβυλωνος</w> <w>ιεχονιας</w> <w>εγεννησεν</w> <w>τον</w> <w>σαλαθιηλ</w> <w>σαλαθιηλ</w> <w>δε</w> <w>εγεννησεν</w> <w>τον</w> <w>ζοροβαβελ</w></ab></div></div></body></text></TEI>');
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
/*
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
*/
// get TEI String from editor html content
function getTEI() {
	//teiIndexData[0] = tinymce.get(tinyMCE.activeEditor.id).settings.book;
	//teiIndexData[1] = tinymce.get(tinyMCE.activeEditor.id).settings.witness;
	//teiIndexData[2] = tinymce.get(tinyMCE.activeEditor.id).settings.manuscriptLang; 
	return getTeiByHtml(getData(), tinyMCE.activeEditor.settings);
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
	/*var teiIndexData = result['teiIndexData'];
	if (teiIndexData) {
		tinyMCE.activeEditor.teiIndexData = teiIndexData;
	}*/
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