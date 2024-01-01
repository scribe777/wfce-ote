/*
	Copyright (C) 2012-2017 Trier Center for Digital Humanities, Trier (Germany)

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



/** Initialises the editor

@param {string} _id - The html id value of the text area to transform into the editor.
@param {clientOptions} clientOptions - The client settings to use when initialising the editor.
@param {string} clientOptions.language - The language to use for the interface (en|de). The default is English.
@param {boolean} clientOptions.rtl - This should be set to true for transcribing right to left languages. The default is false.
@param {function|string} clientOptions.getWitness - An optional function to get the value of the current witness. If the witnesses is already known when the editor is initialised it can be provided as a string.
@param {function|string} clientOptions.getWitnessLang - An optional function to get the ISO language code of the current witness. If the language is known when the editor is intialised it can be provided as a string.
@param {function} clientOptions.getBookNameFromBKV - A function to switch BKV references to OSIS (only used for book and chapter)
@param {array} clientOptions.bookNames - A list of OSIS book abbreviations to use in the select of the V menu. If this list is not supplied the form will have a text box for manual entry.
@param {boolean} clientOptions.addLineBreaks - Add line breaks in the XML before every pb, cb and lb in the transcription. Default is false.
@param {boolean} clientOptions.addSpaces - Add spaces into the XML of the transcription between tags to make the text readable if all the tags are removed. Default is false.
@param {string} clientOptions.defaultReasonForUnclearText - The default option in the reason box for unclear text. Default pre-selects nothing.
@param {number} clientOptions.defaultHeightForCapitals - If a number is supplied with this settings then it is used to prepopulate the height box in the O > capitals submenu. If it is not supplied then the box is not prepopulated.
@param {defaultValuesForSpaceMenu} clientOptions.defaultValuesForSpaceMenu - The default settings to use to pre-poulate the spaces menu. Default does not pre-populate anything but does select first option on the unit list.
@param {string} clientOptions.defaultValuesForSpaceMenu.unit - The unit value to preselect.
@param {number} clientOptions.defaultValuesForSpaceMenu.extent - The extent number to preselect.
@param {boolean} clientOptions.showMultilineNotesAsSingleEntry - If set to true this combines multiline untranscribed commentary and lectionary notes into a single line (does not change the XML output). Default is false.
@param {boolean} clientOptions.checkOverlineForAbbr - If set to true this will check the 'add overline' option in the abbreviation form when it is loaded. Default is false.
@param {optionsForGapMenu} clientOptions.optionsForGapMenu - The options used to create and to set defaults in the gap menu.
@param {string} clientOptions.optionsForGapMenu.reason - The option to select by default for the reason for the gap (illegible|lacuna|unspecified|inferredPage).
@param {string} clientOptions.optionsForGapMenu.suppliedSource - The option to use for the source of the supplied text.
@param {Array.<sourceOptions>} clientOptions.optionsForGapMenu.sourceOptions - An optional list of sources to use for the supplied source dropdown. None and other are always present and cannot be changed by this setting the remaining default are most relevant to Greek New Testament.
@param {string} clientOptions.optionsForGapMenu.sourceOptions.value - The value to record in the XML for this supplied source.
@param {string} clientOptions.optionsForGapMenu.sourceOptions.labelEn - The visible label to use for this entry in the English interface.
@param {string} clientOptions.optionsForGapMenu.sourceOptions.labelDe - The visible label to use for this entry in the German interface.
@param {optionsForMarginaliaMenu} clientOptions.optionsForMarginaliaMenu - The options used to create and to set defaults in the marginalia menu.
@param {string} clientOptions.optionsForMarginaliaMenu.type - The option to select by default for the fw_type dropdown for the marginalia.
@param {string} clientOptions.transcriptionLanguage - The css to use for the transcription in the editor. Choices are currently coptic and greek. Default is greek.
@param {boolean} clientoptions.showLineNumberSidebarOnLoading - A boolean to determine if the line number sidebar should be shown on loading or not. Default is True
@param {string} clientOptions.toolbar - The string to use to configure the toolbar. It should be a subset of the default provided, | puts a divider at that point in the toolbar.
@param {baseURL} string - Explicitly sets TinyMCE's base URL.
@param {callback} function - The function to call once the editor is loaded.

*/
function setWceEditor(_id, clientOptions, baseURL, callback) {
	let toolbar;
	if (typeof clientOptions === 'undefined') {
		clientOptions = {};
	}

	if (baseURL && typeof baseURL != "undefined" && baseURL !== '') {
		tinymce.baseURL = baseURL;
		tinymce.baseURI = new tinymce.util.URI(tinymce.baseURL);
	}

	if (!clientOptions.getWitness) {
		clientOptions.getWitness = "";
	}

	if (!clientOptions.getWitnessLang) {
		clientOptions.getWitnessLang = "";
	}

	if (!clientOptions.getBookNameFromBKV) {
		clientOptions.getBookNameFromBKV = getBookNameFromBKV;
	}

	if (!clientOptions.showMultilineNotesAsSingleEntry) {
		clientOptions.showMultilineNotesAsSingleEntry = false;
	}

	if (!clientOptions.includePageNumbersInDeleteMenu) {
		clientOptions.includePageNumbersInDeleteMenu = false;
	}
	
	if (!clientOptions.hasOwnProperty('optionsForGapMenu')) {
		clientOptions.optionsForGapMenu = {'reason': 'illegible', 'suppliedSource': 'na28'};
	}
	if (!clientOptions.optionsForGapMenu.hasOwnProperty('sourceOptions')) {
		clientOptions.optionsForGapMenu.sourceOptions = [{'value': 'transcriber','labelEn': 'Transcriber', 'labelDe': 'Vorschlag des Transkribenten'},
														 {'value': 'na28','labelEn': 'NA28', 'labelDe': 'NA28'},
														 {'value': 'tr','labelEn': 'Textus Receptus', 'labelDe': 'Textus Receptus'}];
	}
	if (!clientOptions.hasOwnProperty('showLineNumberSidebarOnLoading')) {
		clientOptions.showLineNumberSidebarOnLoading = true;
	}
	
	if (clientOptions.toolbar) {
		toolbar = clientOptions.toolbar;
	} else {
		toolbar = 'undo redo wcecharmap | code | save print contextmenu cut copy paste fullscreen | ' +
				  'breaks correction illegible decoration abbreviation paratext note punctuation versemodify | ' +
				  'showTeiByHtml help | info showHtmlByTei';
	}

	tinymce.init({
		// General options
		clientOptions: clientOptions,
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
		theme_advanced_path : false,
		execcommand_callback : 'wceExecCommandHandler',
		content_css: (clientOptions.transcriptionLanguage == 'coptic') ? tinymce.baseURL + '../../../wce-ote/custom-css/coptic.css' : tinymce.baseURL + '../../../wce-ote/custom-css/greek.css',
		save_onsavecallback : function() {
			if (saveDataToDB) saveDataToDB(true);
		},
		directionality : (clientOptions.rtl) ? "rtl" : "ltr",
		language : (clientOptions.language) ? (clientOptions.language.indexOf('de') == 0 ? "de" : "en") : "en",
		plugins : "pagebreak,save,print,contextmenu,fullscreen,wordcount,autosave,paste,code,noneditable",
		paste_as_text: true,
		contextmenu: 'cut copy paste',
		external_plugins: {
			'wce' : '../../wce-ote/plugin/plugin.js',
			'wcelinenumber': '../../wce-ote/plugin/js/line_number.js',
			'wcecharmap': '../../wce-ote/plugin/js/wce_charmap.js'
		},
		ignoreShiftNotEn: (clientOptions.transcriptionLanguage == 'coptic') ? [] : [188, 190],
		keyboardDebug: true,
		init_instance_callback : "wceReload",
		// Theme options
		toolbar : toolbar,
		theme_advanced_buttons2 : "",
		theme_advanced_toolbar_location : "top",
		theme_advanced_toolbar_align : "left",
		theme_advanced_statusbar_location : "bottom",
		theme_advanced_resizing : false,
		setup : function(ed) {
			
			ed.on('change', wceOnContentsChange);
			ed.on('init', function(e) {  // Once initialized, tell the editor to go fullscreen
				addMenuItems(tinyMCE.activeEditor);
				if (callback) {
					callback();
				}
			});
		}	
	});
}

function getBookNameFromBKV(ref) {
	let bookRef;
	let NTLookup = {"B01": "Matt", "B02": "Mark", "B03": "Luke", "B04": "John", "B05": "Acts",
					"B06": "Rom", "B07": "1Cor", "B08": "2Cor", "B09": "Gal", "B10": "Eph", "B11": "Phil", "B12": "Col",
					"B13": "1Thess", "B14": "2Thess", "B15": "1Tim", "B16": "2Tim", "B17": "Titus", "B18": "Phlm",
					"B19": "Heb", "B20": "Jas", "B21": "1Pet", "B22": "2Pet", "B23": "1John", "B24": "2John",
					"B25": "3John", "B26": "Jude", "B27": "Rev"};
	bookRef = ref.split('K')[0];
	return NTLookup[bookRef];
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

/** Get TEI String from editor html content
*/
function getTEI() {
	//teiIndexData[0] = tinymce.get(tinyMCE.activeEditor.id).settings.book;
	//teiIndexData[1] = tinymce.get(tinyMCE.activeEditor.id).settings.witness;
	//teiIndexData[2] = tinymce.get(tinyMCE.activeEditor.id).settings.manuscriptLang;
	return getTeiByHtml(getData(), tinyMCE.activeEditor.settings.clientOptions);
}

/** Set editor html content from tei input

 @param {String} teiStringInput - the xml string to display for editing
*/
function setTEI(teiStringInput) {
	var result = getHtmlByTei(teiStringInput, tinyMCE.activeEditor.settings.clientOptions);
	if (result) {
		var htmlContent = result['htmlString'];
		if (htmlContent)
			setData(htmlContent);
	}
	resetCounter(); //for resetting the counter each time this method is called
	return 0;
}


/**
	Set the font family to use for the editor contents

	@param {string} fontFamily - the name of the font family to use
*/
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

/**
Reset the counters which provide automatic page, quire, column and line counts

*/
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

try {
	module.exports = {
		getBookNameFromBKV
	};
} catch (e) {
	// nodejs is not available which is fine as long as we are not running tests.
}
