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

    OTE wird in der Hoffnung, dass es nützlich sein wird, aber
    OHNE JEDE GEWÄHRLEISTUNG, bereitgestellt; sogar ohne die implizite
    Gewährleistung der MARKTFÄHIGKEIT oder EIGNUNG FÜR EINEN BESTIMMTEN ZWECK.
    Siehe die GNU Lesser General Public License für weitere Details.

    Sie sollten eine Kopie der GNU Lesser General Public License zusammen mit diesem
    Programm erhalten haben. Wenn nicht, siehe <http://www.gnu.org/licenses/>.
*/

function setWceEditor(_id, rtl, finishCallback, lang, myBaseURL, getWitness, getWitnessLang) {
	if (myBaseURL && typeof myBaseURL != "undefined" && myBaseURL !== '') {
		tinymce.baseURL = myBaseURL;
		tinymce.baseURI = new tinymce.util.URI(tinymce.baseURL);
	}
	
	tinymce.init({
		// General options
		mode : "exact",
		selector : '#'+_id,
		theme : "modern",
		menubar: false,
		skin_url: tinymce.baseURL + "../../../wce-ote/skin/",
		extended_valid_elements : 'span[class|wce_orig|style|wce|ext|id]',
		forced_root_block : false,
		force_br_newlines : true,
		force_p_newlines : false,
		entity_encoding : "raw",
		//entities : "62,diple,8224,obelus",
		theme_advanced_path : false,
		execcommand_callback : 'wceExecCommandHandler',
		save_onsavecallback : function() {
			if (saveDataToDB) saveDataToDB(true);
		},
		directionality : (rtl) ? "rtl" : "ltr",
		language : (lang) ? (lang.indexOf('de') == 0 ? "de" : "en") : "en",
		//book : (getBook) ? getBook : "",
		witness : (getWitness) ? getWitness : "",
		manuscriptLang : (getWitnessLang) ? getWitnessLang : "",
		// invalid_elements:'p',
		plugins : "pagebreak,save,layer,print,contextmenu,fullscreen,wordcount,autosave,paste,charmap,code,noneditable",
		contextmenu: 'cut copy paste',
		charmap : charmap_greek.concat(charmap_latin).concat(charmap_slavistic),
//		plugins : "compat3x,pagebreak,save,layer,print,contextmenu,fullscreen,wordcount,autosave,paste",
		external_plugins: {
			'wce' : '../../wce-ote/plugin/plugin.js'
		},
//		ignoreShiftNotEn: [188, 190],
		keyboardDebug: true,
		init_instance_callback : "wceReload",
		// Theme options
		toolbar : "undo redo charmap | code | save print contextmenu cut copy pastetext pasteword fullscreen | "+
		"breaks correction illegible decoration abbreviation paratext note punctuation versemodify | showTeiByHtml help | info showHtmlByTei",
		theme_advanced_buttons2 : "",
		theme_advanced_toolbar_location : "top",
		theme_advanced_toolbar_align : "left",
		theme_advanced_statusbar_location : "bottom",
		theme_advanced_resizing : false,
		setup : function(ed) {
			ed.on('change', wceOnContentsChange);
			ed.on('init', function(e) {// Once initialized, tell the editor to go fullscreen
				addMenuItems(tinyMCE.activeEditor);
				if (finishCallback)
					finishCallback();
			});
		}
	});
}

// wenn brower reload, set editor blank
function wceReload() {
	// for test
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

function wceOnContentsChange() {
	//alert(tinyMCE.activeEditor.getContent());
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

	var contextMenu = null;
	var staticMenuCount = 0;
	tinymce.ui.Menu.prototype.Mixins = [ { init : function() {
		if (this.settings.context == 'contextmenu') contextMenu = this;
	}} ];

	console.log('fix context menu');
	ed.on('contextmenu', function(event) {
		var ed = $(this)[0];
		var items = contextMenu.items();
		var menu = new tinymce.ui.Menu({
			items: contextMenu.items().toArray(),
			context: 'newcontextmenu',
			classes: 'contextmenu'
		}).renderTo();
	
		// added my options
		if (ed.selection.getNode().getAttribute('wce') != null && ed.selection.getNode().getAttribute('wce').substring(4, 16) == 'verse_number') {
			//wceAttr = ed.selection.getNode().getAttribute('wce');
			menu.add({ text : '|'});
			menu.add({
				text : tinymce.translate('initial_portion'),
				icon : '',
				onclick : function() {
					ed.execCommand('mce_partialI');
				}
			});
			menu.add({
				text : tinymce.translate('medial_portion'),
				icon : '',
				onclick : function() {
					ed.execCommand('mce_partialM');
				}
			});
			menu.add({
				text : tinymce.translate('final_portion'),
				icon : '',
				onclick : function() {
					ed.execCommand('mce_partialF');
				}
			});
			menu.add({
				text : tinymce.translate('remove_partial'),
				icon : '',
				onclick : function() {
					ed.execCommand('mce_partial_remove');
				}
			});
		} else if (ed.selection.getNode().getAttribute('wce') != null && ed.selection.getNode().getAttribute('wce').indexOf('break_type=pb') > -1 
			&& ed.selection.getNode().textContent.indexOf('PB') > -1) {
			isPreviousActive = (ed.selection.getNode().getAttribute('wce').indexOf('hasBreak=yes') > -1);
			menu.add({ text : '|'});
			menu.add({
				text : tinymce.translate('previous_hyphenation'),
				icon : '',
				onclick : function() {
					ed.execCommand('mce_previous_hyphenation', true);
				}
			});
			menu.items()[menu.items().length-1].disabled(isPreviousActive);
			menu.add({
				text : tinymce.translate('no_previous_hyphenation'),
				icon : '',
				onclick : function() {
					ed.execCommand('mce_previous_hyphenation', false);
				}
			});
			menu.items()[menu.items().length-1].disabled(!isPreviousActive);
		}
		menu.renderNew();
		menu.moveTo($(contextMenu.getEl()).position().left, $(contextMenu.getEl()).position().top);
		contextMenu.hide();
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
		var pos = oldwce.indexOf("number=");
		var newstring = oldwce.substring(pos+7);
		var num = newstring.substring(0,newstring.indexOf("&"));
		pos = oldwce.indexOf("rv=");
		newstring = oldwce.substring(pos+3);
		rv = newstring.substring(0,newstring.indexOf("&"));
		if (b == true) {
			ed.selection.getNode().setAttribute('wce', oldwce.replace("hasBreak=no", "hasBreak=yes"));
			ed.selection.getNode().innerHTML = ed.WCE_CON.startFormatHtml + '&#8208;<br />PB' + ' ' + num + '' + rv + ed.WCE_CON.endFormatHtml;
		} else {
			ed.selection.getNode().setAttribute('wce', oldwce.replace("hasBreak=yes", "hasBreak=no"));
			ed.selection.getNode().innerHTML = ed.WCE_CON.startFormatHtml + '<br />PB' + ' ' + num + '' + rv + ed.WCE_CON.endFormatHtml;
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
