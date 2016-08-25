<%@ page language="java" contentType="text/xml; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page trimDirectiveWhitespaces="true" %>
<%@ page import="org.crosswire.utils.HTTPUtils" %>
<%@ page import="org.crosswire.xml.XMLBlock" %>
<%@ page import="org.crosswire.xml.XMLTag" %>
<%@ page import="org.crosswire.xml.XMLDataElement" %>
<?xml version="1.0" encoding="UTF-8" ?>
<Module>
  <ModulePrefs
	title="Transcription Editor 2.0beta"
	author_email="workspace@jiscmail.ac.uk"
	author="Universität Trier"
	description="Transcription Editor 2.0beta"
	screenshot="http://www.uni-trier.de/fileadmin/templates/inc/logo_universitaet-trier.gif"
	thumbnail="http://www.uni-trier.de/fileadmin/templates/inc/logo_universitaet-trier.gif"
        scrolling="false"
   >
<Optional feature="pubsub-2">
  <Param name="topics">
    <![CDATA[ 
    <Topic title="Transcription Saved" name="interedition.transcription.saved"
            description="Transcription has been saved" type="void"
            subscribe="true"/>
    ]]>
  </Param>
</Optional>
<Optional feature="dynamic-height"/>
<Require feature="opensocial-0.8"/>
</ModulePrefs>

<UserPref name="transcriptionOwner" datatype="enum" display_name="Transcription Owner" default_value="user">
	<EnumValue value="user" display_value="Current User"/>
	<EnumValue value="project" display_value="Current Project"/>
</UserPref>

<UserPref name="height" datatype="enum" display_name="Gadget Height" default_value="550">
	<EnumValue value="400" display_value="Short"/>
	<EnumValue value="550" display_value="Medium"/>
	<EnumValue value="700" display_value="Tall"/>
</UserPref>
<UserPref name="baseText" datatype="enum" display_name="Base Text" default_value="Language Dependent">
<EnumValue value="Language Dependent" display_value="Language Dependent"/>
<%
	String modListURL = "http://www.crosswire.org/study/fetchdata.jsp";
	StringBuffer result = HTTPUtils.postURL(modListURL, null);
	XMLBlock modules = XMLBlock.createXMLBlock(result.toString());
	for (XMLDataElement module : modules.getElements("module")) {
		if ("Biblical Texts".equals(module.getAttribute("category"))) {
%><EnumValue value="<%= module.getAttribute("id") %>" display_value="<%= HTTPUtils.canonize(module.getText()) %>"/><%
		}
     }
%>
</UserPref>
<UserPref name="baseTextDocID" datatype="string" display_name="Base Text DocID" default_value="" />
<UserPref name="direction" datatype="bool" display_name="Right to Left" default_value="false"/>


<UserPref name="servicesBaseURL" datatype="string" display_name="Services Base URL" default_value="../../vmr/api" />
<UserPref name="baseTextServiceURL" datatype="string" display_name="Base Text Service URL" default_value="http://crosswire.org/study/fetchdata.jsp" />

<UserPref name="announceChanges" datatype="bool" display_name="Announce Changes" default_value="false"/>
<UserPref name="autoSave" datatype="bool" display_name="Autosave" default_value="true"/>

<UserPref name="reconciler" datatype="enum" display_name="Reconciler" default_value="../reconciler/reconciler.jsp">
	<EnumValue value="../reconciler/reconciler.jsp" display_value="Cat-tastic Reconciler"/>
	<EnumValue value="mergely_reconciler.jsp" display_value="Mergely"/>
</UserPref>

<Content type="html">
<![CDATA[
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<!-- odd path on the include because we use index.jsp here, so if we don't specify the index.jsp on the URL, we are 1 level different on our .. -->

<link rel="stylesheet" type="text/css" href="/community/js/jquery-ui/jquery-ui.css"/>

<script type="text/javascript" src="/community/js/jquery/jquery.min.js"></script>
<script type="text/javascript" src="/community/js/URI.min.js"></script>
<script type="text/javascript" src="/community/js/jquery/jquery.cookie.js"></script>
<script type="text/javascript" src="/community/js/jquery-ui/jquery-ui.min.js"></script>
<script type="text/javascript" src="js/tinymce/tinymce.js"></script>  
<script type="text/javascript" src="wce-ote/wce_editor.js"></script>
<script type="text/javascript" src="wce-ote/wce_charmap.js"></script>
<script type="text/javascript" src="wce-ote/wce_tei.js"></script>
<script type="text/javascript" src="/community/js/jquery.blockUI.js"></script>

<title>Workspace for Collaborative Editing</title>

<style type="text/css">
<!--
body {
	margin-left: auto;
	margin-right: auto;
	background-color: #666;
	font-family: Verdana, Arial, Helvetica, sans-serif;
	font-size: 14px;
}

table {
	border-collapse: collapse;
}

table#historyTable {
	border-collapse: collapse;
	width: 100%;
}

td, th {
	padding: 5px 4px;
	border: 1px solid #CCC;
	/*overflow: hidden;*/
}

.vDate {
	white-space: nowrap;
}

thead, tfoot {
	background-color: #CCC;
}

tr.rowodd {
	background-color: #FFF;
}

tr.roweven {
	background-color: #F2F2F2;
}

/* seems this has trouble loading a background image via opensocial proxy or something, so we'll just set it to white */
.ui-widget-content {
	background: white !important;
}
-->
</style>



<script type="text/javascript">

// reset error handling to browser default
window.onerror = window.parent.onerror;

// record last direction set for editor, this is used to determine if we need to re-initialize editor to switch directions
var lastRTL = false;

// if no index data for the page, then dialog to ask what content from base text to use
var verseRefDialog = null; 

// listen for page loaded events from portal and hold on to last page which as loaded
var lastPage = null;
var workingTranscription = '';
var lastVersion = null;

// whoami
var viewer = null;

// default values.  These really are superfluous.  They get set in 'loaded()' by configuration parameters
// but we'll set them to something in case somehow our reading of config params fails miserably

// this is for future transcription repository data store and other VMR services.
// this is the base of where all services live.  We don't use them yet, but will soon
var servicesURL = '../../vmr/api';

// this is for retrieving base text data this URL will receive posted data params:
//	 mod : Base Text Name, currently either coptic or greek (SahidicBible|PapBasetext)
//	 key : section of text to load, e.g., Rom 6:5-14; Rom 8:9-11
//	 format : the format in which the data should be returned. currently 'basetext', and means tinyMCE/WFCE/Trier/HTML spans
var baseTextServiceURL = 'http://crosswire.org/study/fetchdata.jsp';
var baseTextDocID = null;
var baseText = "WHNU";
var transcriptionOwner = "user";
var rtl = false;
var announceChanges = false;
var autoSave = true;

var reconciler = '../reconciler/reconciler.jsp';

// where or not this user is a VMR Administrator
var isAdmin = false;
var siteName = '';
var ignoreUpdateMessages = 0;

</script>
</head>
<body>
		<div style="margin: 0px 0px 0px 0px">
			<textarea id="wce_editor" rows="28" cols="80" style="width: 100%;"></textarea>
		</div>

<span style="margin: 0 0 0 0; float:left; position:absolute;bottom:2px;left:2px;">
	<button style="vertical-align: middle;" id="versionHistoryControl" >Version History</button>
	<img id="chirho" height="32" style="margin: 0 0 0 0; vertical-align: middle;" src="/community/images/chirho.png"/><input id="palInput" size="8" />
	<button style="vertical-align: middle;color:red;" id="publishButton" >Publish</button>
	<button style="vertical-align: middle;color:red;" id="previewButton" >Preview Last Saved</button>
</span>
<span style="margin: 0 0 0 0; float:right; position:absolute;bottom:2px;right:2px;">
<!--
	<button style="vertical-align: middle;" id="plusOneBeforeButton" >Prepend +1</button>
-->
	<button style="vertical-align: middle;" id="populateButton" >From Basetext</button>
<!--
	<button style="vertical-align: middle;" id="plusOneAfterButton" >Append +1</button>
-->
	<span id="discussButtonSpan"><a href="#" onclick="discussTranscription();return false;" title="Discuss This Transcription"><img style="margin: 0 0 0 0; vertical-align: middle;" src="../../images/discuss.png"/></a></span>
</span>
</body>

<script type="text/javascript">


	function previewPage() {
		var url = servicesURL + '/transcript/show/';
		window.open(url+'?docID='+lastPage.docID+'&pageID='+lastPage.pageID+'&userName='+(transcriptionOwner == 'user' ? viewer.getDisplayName() : siteName),'transcription',
                  'titlebar=no,toolbar=no,status=no,scrollbars=yes,resizable=yes,menubar=no,location=yes,directories=no,'
                + 'width=900,height=768');

	}

	function publishPage() {
		saveDataToDB(false, false, '', true);
	}

	function saveDataToDB(saveButtonPressed, callback, userName, force) {
		if (force || saveButtonPressed) {
		}
		else if (!tinyMCE.activeEditor.isDirty()) {
			if (callback) callback();
			return;
		}

		$.blockUI({ message: '<h3><img src="/community/images/fuzzball.gif" /> Saving, please wait...</h3>' });

		// currently we grab the HTML span formatted data, but eventually we'd like to grab the TEI
		var transcriptionData = getTEI();

		var params = {};
		var postData = {
			sessionHash : $.cookie('ntvmrSession'),
			docID : lastPage.docID,
			pageID: lastPage.pageID,
			userName: (typeof userName != 'undefined' ? userName : transcriptionOwner == 'user' ? viewer.getDisplayName() : siteName),
			transcript: transcriptionData
		};
		var url = servicesURL + '/transcript/put/';
		params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.POST;
		params[gadgets.io.RequestParameters.POST_DATA] = gadgets.io.encodeValues(postData);
		gadgets.io.makeRequest(url, function (o) {
			$.unblockUI();
			var xml = $.parseXML(o.text);
			if ($(xml).children('error').length) {
				alert($(xml).children('error').attr('message'));
			}
			if ($(xml).children('success').length) {
				if (gadgets.util.hasFeature('pubsub-2')) gadgets.Hub.publish("interedition.transcription.saved", null);
				if ($('#historyDialog').dialog('isOpen')) {
					showVersionHistory();
				}
			}
			tinymce.activeEditor.isNotDirty = 1;
			
			if (callback) callback();
		}, params);
	}


function showVersionHistory() {

	if (lastPage) {
		$.blockUI({ message: '<h4><img src="/community/images/fuzzball.gif" /> Loading history...</h4>' });

		var params = {};
		var postData = {
			docID : lastPage.docID,
			pageID: lastPage.pageID,
			userName: transcriptionOwner == 'user' ? viewer.getDisplayName() : siteName,
			history: true,
			allUsers: isAdmin,
		};

		var url = servicesURL + '/transcript/get/';
		params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.POST;
		params[gadgets.io.RequestParameters.POST_DATA] = gadgets.io.encodeValues(postData);
		gadgets.io.makeRequest(url, function (o) {
			$.unblockUI();
			document.body.style.cursor = 'default';
			var xml = $.parseXML(o.text);
			var h = '<table id="historyTable"><thead><th class="selectionCell"><th>Date</th><th>Author</th><th style="width:100%;">Comments</th></thead><tbody>';
			var rownum = 1;
			h += '<tr class="'+(rownum%2?'rowodd':'roweven')+'" style="cursor:pointer;">';
			h += '<td height="24" onclick="loadTranscription(\'workingTranscription\');" id="sel_workingTranscription" class="selectionCell">*</td>';
			h += '<td onclick="loadTranscription(\'workingTranscription\');" class="vDate">working copy</td>';
			h += '<td onclick="loadTranscription(\'workingTranscription\');">'+viewer.getDisplayName()+'</td>';
			h += '<td onclick="loadTranscription(\'workingTranscription\');"></td>';
			h += '<td><span class="mergeControl" style="display:none;"><a href="#" onclick="compareCurrentTo(\'workingTranscription\');return false;"><img height="24" src="/community/images/merge.png"/></a></span></td>';
			h += '<td class="versionHash" style="display:none;">workingTranscription</td>';
			h += '</tr>';
			$(xml).find('history').each(function() {
				++rownum;
				h += '<tr class="'+(rownum%2?'rowodd':'roweven')+'" style="cursor:pointer;">';
				h += '<td height="24" onclick="loadTranscription(\''+$(this).attr('versionHash')+'\');" id="sel_'+$(this).attr('versionHash')+'_'+$(this).attr('author')+'" class="selectionCell">&nbsp;</td>';
				h += '<td onclick="loadTranscription(\''+$(this).attr('versionHash')+'\', \''+$(this).attr('author')+'\');" class="vDate">'+$(this).attr('date')+'</td>';
				h += '<td onclick="loadTranscription(\''+$(this).attr('versionHash')+'\', \''+$(this).attr('author')+'\');">'+$(this).attr('author')+'</td>';
				h += '<td onclick="loadTranscription(\''+$(this).attr('versionHash')+'\', \''+$(this).attr('author')+'\');">'+$(this).find('comment').text()+'</td>';
				h += '<td><span class="mergeControl"><a href="#" onclick="compareCurrentTo(\''+$(this).attr('versionHash')+'\', \''+$(this).attr('author')+'\');return false;"><img height="24" src="/community/images/merge.png"/></a></span></td>';
				h += '<td class="versionHash" style="display:none;">'+$(this).attr('versionHash')+'</td>';
				h += '</tr>';
			});
			h += '</tbody></table>';
			$('#historyDialogContent').html(h);

			if (lastVersion) {
				$('.selectionCell').text('');
				$('#sel_'+lastVersion).text('*');
				$('.mergeControl').show('');
				$('#sel_'+lastVersion).parent().find('.mergeControl').hide();
			}
			
			$('#historyDialog').dialog('open');
		}, params);
	}
}


function onTranscriptionReadOnly(topic, data, subscriberData) {
	tinymce.activeEditor.setMode(data?'readonly':'design');
}

function onTranscriptionScrolled(topic, data, subscriberData) {
	$(tinymce.activeEditor.getBody()).find('.brea').css('background', '');
	
	if (data.break > 0) data.break -= 1;
	if (data.break < $(tinymce.activeEditor.getBody()).find('.brea').length) {
		var b = $(tinymce.activeEditor.getBody()).find('.brea')[data.break];
		$(b).css('background', 'white');
		b.parentNode.scrollTop = b.offsetTop;
	}
}
function onTranscriptionUpdate(topic, data, subscriberData) {

	if (data.sender == document || ignoreUpdateMessages) return; // assert we didn't publish event

	lastVersion = null;
	lastPage = data;
	workingTranscription = lastPage.transcriptionBody;
	loadEditorWithTEI(workingTranscription);
}


function page_select_callback(topic, data, subscriberData) {
	var pageSelect = function () {

		document.body.style.cursor = 'wait';

		lastPage = data;

		$('#historyDialog').dialog('close');

		lastVersion = null;
		workingTranscription = '';

		loadTranscription(null, data.userID);
	}
	if (autoSave) {
		saveDataToDB(null, function () {
			pageSelect();
		});
	}
	else pageSelect();
}


function getTranscription(versionHash, userName, callback) {
	var params = {};
	if (userName && !isAdmin && userName != 'PUBLISHED') userName = null;
	var postData = {
		docID : lastPage.docID,
		pageID: lastPage.pageID,
		userName: (userName ? userName : transcriptionOwner == 'user' ? viewer.getDisplayName() : siteName),
		format: 'rawtei',
		briefTEIHeader : 'true'
	};

	if (versionHash && versionHash.length > 0 && versionHash != 'HEAD') postData.versionHash = versionHash;

	var url = servicesURL + '/transcript/get/';
	params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.POST;
	params[gadgets.io.RequestParameters.POST_DATA] = gadgets.io.encodeValues(postData);
	gadgets.io.makeRequest(url, function (o) {
		// silliness when sometimes stuff is returned as mime type XML it is stored in 'data' instead of 'text'.  stupid
		var transText = (!o.text || o.text.length < 1) ? o.data : o.text;
		if (transText.indexOf("<?xml") > 0) transText = transText.substring(transText.indexOf('>', transText.indexOf("<?xml"))+1);

		if (callback) callback(transText);
	}, params);
}

function loadTranscription(versionHash, userName) {

	tinymce.activeEditor.isNotDirty = 1;
	if (versionHash == 'workingTranscription' && $('#sel_'+versionHash+'_'+userName).text() == '*')	return;

	if (versionHash) {
		$('.selectionCell').text('');
		$('#sel_'+versionHash+'_'+userName).text('*');
		$('.mergeControl').show('');
		$('#sel_'+versionHash+'_'+userName).parent().find('.mergeControl').hide();
	}

	if (versionHash == 'workingTranscription') {
		lastVersion = null;
		loadEditorWithTEI(workingTranscription);
		return;
	}

	getTranscription(versionHash, userName, function(transText) {
		var xml = $.parseXML(transText);
		if ($(xml).children('error').length) {
			loadEditorWithTEI('<TEI></TEI>');
//			loadEditorWithTEI('<?xml  version="1.0" encoding="utf-8"?><TEI xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.tei-c.org/ns/1.0 http://urts173.uni-trier.de/~gany2d01/test/TEI-NTMSS.xsd" xmlns="http://www.tei-c.org/ns/1.0" ><teiHeader><fileDesc><titleStmt><title/> </titleStmt><publicationStmt><p/></publicationStmt><sourceDesc><msDesc><msIdentifier></msIdentifier></msDesc></sourceDesc></fileDesc></teiHeader><text><body></body></text></TEI>');
		}
		else {
			if (!lastVersion) {
				workingTranscription = getTEI();
			}
			loadEditorWithTEI(transText);
			lastVersion = versionHash+'_'+userName;
		}
		document.body.style.cursor = 'default';
	});

}


// appendWhere 0 - don't append, overwrite; 1 - append after; -1 - prepend
function populateFromBasetext(key, appendWhere) {

	document.body.style.cursor = 'wait';

	if (!appendWhere) tinymce.get('wce_editor').setContent('<img src="'+tinymce.baseURL+'../../../images/loading.gif"/>');


	var params = {};
	var postData = {};
	var url = baseTextServiceURL;

	postData.mod = getBaseText();

	if (baseTextDocID == null || (postData.mod !='PapBasetext' && baseText == 'Language Dependent')) {

		postData.key = key;
		postData.format = (appendWhere?'basetext':'tei');
	}
	else {
		url = servicesURL + '/transcript/get/';
		postData.docID = baseTextDocID;
		postData.indexContent = key;
		postData.format = 'teiraw';
		postData.briefTEIHeader = 'true';
	}

	params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.POST;
	params[gadgets.io.RequestParameters.POST_DATA] = gadgets.io.encodeValues(postData);

	gadgets.io.makeRequest(url, function (o) { 
		if (appendWhere) {
			var content = tinymce.get('wce_editor').getContent();   
			tinymce.get('wce_editor').setContent((appendWhere>0)?content+o.text:o.text+content);   
		}
		else {
			var type = 'page';
			if (lastPage.pageName && lastPage.pageName.length > 0) {
				p = lastPage.pageName;
				type = 'folio';
			}
			else p = lastPage.pageID;
			var wit = lastPage.docID;
			var header = '<pb n="'+p+'" type="'+type+'" xml:id="P'+p+'-'+wit+'"/><cb n="1" xml:id="P'+p+'C1-'+wit+'"/><lb n="1" xml:id="P'+p+'C1L1-'+wit+'"/>';
			var headerInsertOffset = o.text.indexOf('>', o.text.indexOf('<TEI'))+1;
			var content = o.text.substring(0, headerInsertOffset);
			content += header;
			content += o.text.substring(headerInsertOffset);
			loadEditorWithTEI(content);
		}
	}, params);
}


function getManuscriptInfo() {
	var mi = {
		rtl : lastRTL,
		font : 'Gentium',
		baseText : baseText
	}
	if (lastPage.lang == 'sa') {
		if (baseText == 'Language Dependent') {
			mi.baseText = 'SahidicBible';
			mi.rtl = false;
		}
		mi.font = 'Antinoou, AntinoouWeb';
	}
	else if (lastPage.lang == 'chu') {
		if (baseText == 'Language Dependent') {
			mi.baseText = 'CSlElizabeth';
			mi.rtl = false;
		}
		mi.font = 'BukyvedeWeb';
	}
	else if (lastPage.lang == 'la') {
		if (baseText == 'Language Dependent') {
			mi.baseText = 'Vulgate';
			mi.rtl = true;
		}
	}
	else if (lastPage.lang == 'syc') {
		if (baseText == 'Language Dependent') {
			mi.baseText = 'Peshitta';
			mi.rtl = true;
		}
		mi.font = 'Estrangelo Edessa, EstreWeb';
	}
	else {
		if (baseText == 'Language Dependent') {
			mi.baseText = 'PapBasetext';
			mi.rtl = false;
		}
	}
	return mi;
}


function getBaseText() {
	return getManuscriptInfo().baseText;
}


function isRTL() {
	return getManuscriptInfo().rtl;
}

function getPreferredFont() {
	return getManuscriptInfo().font;
}

function loadEditorWithTEI(teiBlob) {
	document.body.style.cursor = 'default';
	// change text direction of editor if isRTL is different than last RTL set
	var rtl = isRTL();
	if (rtl != lastRTL) {
		lastRTL = rtl;
		tinymce.execCommand(rtl?'mceDirectionRTL':'mceDirectionLTR');
		tinymce.get('wce_editor').settings.directionality = rtl?'rtl':'ltr';
	}
	setTEI(teiBlob);   
	setPreferredFontFamily(getPreferredFont());
}


function populateForLastPageLoaded() {
	if (lastPage != null) {
		if (lastPage.indexContent == null || lastPage.indexContent.length < 2) {
			verseRefDialog.append = false;
                        verseRefDialog.dialog('open');
		}
		else populateFromBasetext(lastPage.indexContent);
	}
}


// this is all the +1 from base text logic.  This probably needs to be re-thought.
// this assumes a very strict "Book Chapter:Verse" format.
// we now have a verse parsing service we should use instead

function isAlpha(val)
{
	var re = /^([a-zA-Z])$/;
	var retVal = (re.test(val));
	return retVal;
}

function isNumeric(val)
{
	var re = /^([0-9])$/;
	return (re.test(val));
}

function plusFromBasetext(count) {
	if (lastPage != null) {
		if (lastPage.indexContent == null || lastPage.indexContent.length < 2) {
			verseRefDialog.append = count;
                        verseRefDialog.dialog('open');
		}
		else {
			var alpha = false;
			var i = 0;
			for (; i < lastPage.indexContent.length; ++i) {
				if (alpha && !isAlpha(lastPage.indexContent.substring(i,i+1))) {
					break;
				}
				else if (isAlpha(lastPage.indexContent.substring(i,i+1))) {
					alpha = true;
				}
			}
			var book = lastPage.indexContent.substring(0,i);
			var rest = lastPage.indexContent.substring(i);

			var numeric = false;
			i = 0;
			var chap = '';
			for (; i < rest.length; ++i) {
				if (numeric && !isNumeric(rest.substring(i,i+1))) {
					break;
				}
				else if (isNumeric(rest.substring(i,i+1))) {
					numeric = true;
					chap += rest.substring(i,i+1);
				}
			}
			var rest = rest.substring(i);

			var numeric = false;
			i = 0;
			var verse = '';
			for (; i < rest.length; ++i) {
				if (numeric && !isNumeric(rest.substring(i,i+1))) {
					break;
				}
				else if (isNumeric(rest.substring(i,i+1))) {
					numeric = true;
					verse += rest.substring(i,i+1);
				}
			}

			var atLeastOneVerse = false;
			var atLeastOneChapter = false;

			var transcriptionData = tinymce.get('wce_editor').getContent();
			var xml = $.parseXML('<doc>'+transcriptionData+'</doc>');
			// find the last chapter
			$(xml).find('span[class="chapter_number"]').each(function() {
				if (count > 0 || !atLeastOneChapter) {
					chap = $(this).text();
					atLeastOneChapter = true;
				}
			});
			// find the last verse
			$(xml).find('span[class="verse_number"]').each(function() {
				if (count > 0 || !atLeastOneVerse) {
					verse = $(this).text();
					atLeastOneVerse = true;
				}
			});

			verse = parseInt(verse) + (atLeastOneVerse ? count : 0);

			populateFromBasetext(book+'.'+chap+'.'+verse, count);
		}
	}
}

// end of ugly +1 from base text logic



// start of ugly 'discuss this transcription page' logic.
// this is highly dependent on liferay being the portal
// we should simply not show the discuss button if liferay is not detected

function assureCategory(parentCategoryId, name, description) {
	var catID = -1;
	var themeDisplay = parent.Liferay.ThemeDisplay;

	var params = {
		groupId          : themeDisplay.getScopeGroupId(),
		parentCategoryId : parentCategoryId,
		start            : -1,
		end              : -1,
		serviceParameterTypes : JSON.stringify([ 'long', 'long', 'int', 'int' ])
	};

	var categories = parent.Liferay.Service.MB.MBCategory.getCategories(params);

	var i = 0;
	if (categories) {
		for (i = 0; i < categories.length; ++i) {
			if (categories[i].name == name) {
				catID = categories[i].categoryId;
				break;
			}
		}
	}
	if (catID == -1) {
		params = {
			parentCategoryId    : parentCategoryId,
			name                : name,
			description         : description,
			displayStyle        : 'default',
			emailAddress        : '',
			inProtocol          : '',
			inServerName        : '',
			inServerPort        : 0,
			inUseSSL            : false,
			inUserName          : '',
			inPassword          : '',
			inReadInterval      : 0,
			outEmailAddress     : '',
			outCustom           : false,
			outServerName       : '',
			outServerPort       : 0,
			outUseSSL           : false,
			outUserName         : '',
			outPassword         : '',
			mailingListActive   : false,
			allowAnonymousEmail : false,

			serviceContext : JSON.stringify({
				scopeGroupId        : themeDisplay.getScopeGroupId(),
				userId              : themeDisplay.getUserId(),
				addGroupPermissions : true,
				addGuestPermissions : true})
		};
		var annCat = parent.Liferay.Service.MB.MBCategory.addCategory(params);
		catID = annCat.categoryId;

	}
	return catID;
}

function discussTranscription() {
	if (!lastPage) return;	// assert we've loaded a page

	var pageCategoryName = 'Page '+lastPage.pageID + (lastPage.pageName && lastPage.pageName.length > 0 ? (' (folio '+lastPage.pageName+')') : '');
	var catID = assureCategory(0, 'Transcriptions', 'Manuscript Transcriptions');
	catID = assureCategory(catID, ''+lastPage.docID + ' ('+lastPage.docName+')', '');
	catID = assureCategory(catID, pageCategoryName, '');

	var themeDisplay = parent.Liferay.ThemeDisplay;
	var params = {
		groupId          : themeDisplay.getScopeGroupId(),
		categoryId       : catID,
		status           : -1,
		start            : -1,
		end              : -1,
		serviceParameterTypes : JSON.stringify([ 'long', 'long', 'int', 'int', 'int' ])
	};

	var landingPoint = 'category/'+catID;

	var messages = parent.Liferay.Service.MB.MBMessage.getCategoryMessages(params);

	var subject = '' + viewer.getDisplayName()
			 + ' - ' + lastPage.docID + ' ('+lastPage.docName+') '
			 + pageCategoryName;

	var mID = -1;
	for (i = 0; messages && i < messages.length; ++i) {
		if (messages[i].subject == subject) {
			mID = messages[i].messageId;
			break;
		}
	}

	if (mID < 0) {

		var transcription = getTEI();

		var body = '<p><a href="http://ntvmr.uni-muenster.de/transcribing'
				+ '?docID='+lastPage.docID
				+ '&pageID='+lastPage.pageID
				+ '&userName='+viewer.getDisplayName()
				+ '" target="_blank">Jump To Artifact</a></p>'
				+ '<br/>'
				+ '<b>Transcription Text:</b>'
				+ '<div style="margins: 5px 20px 5px 20px;">'+transcription+'</div><br/>'
				+ '<p> You should: <b>Edit this message.</b> '
				+ 'Be sure to leave the above link, and delete this line.</p>';

		params = {
			groupId          : themeDisplay.getScopeGroupId(),
			categoryId       : catID,
			subject          : subject,
			body             : body,
			format           : 'html',
			inputStreamOVPs  : JSON.stringify([]),
			anonymous        : false,
			priority         : 0.0,
			allowPingbacks   : true,
			serviceContext   : JSON.stringify({
				scopeGroupId        : themeDisplay.getScopeGroupId(),
				userId              : themeDisplay.getUserId(),
				addGroupPermissions : true,
				addGuestPermissions : true,
				workflowAction      : 0
			})
		};
		var message = parent.Liferay.Service.MB.MBMessage.addMessage(params);
		landingPoint = 'message/'+message.messageId;
	}
	else {
		landingPoint = 'message/'+mID;
	}

	var discussURL = '';
	if (themeDisplay.getLayoutURL().substr(0,'http://'.length) !='http://') {
		discussURL = 'http://'+parent.window.location.href.split('/')[2];
	}
	discussURL	+= themeDisplay.getLayoutURL()
			+ '/../forum/-/message_boards/'+landingPoint;

	window.open(discussURL,'Discuss',
		  'titlebar=no,toolbar=no,status=no,scrollbars=yes,resizable=yes,menubar=no,location=yes,directories=no,'
		+ 'width=1024,height=768');
}


function xml2str(xmlNode) {
   try {
      // Gecko- and Webkit-based browsers (Firefox, Chrome), Opera.
      return (new XMLSerializer()).serializeToString(xmlNode);
  }
  catch (e) {
     try {
        // Internet Explorer.
        return xmlNode.xml;
     }
     catch (e) {  
        //Other browsers without XML Serializer
        alert('Xmlserializer not supported');
     }
   }
   return false;
}


function simplifyTEI(tei) {
	var xml = $.parseXML(tei);


/*
	$(xml).find('w').contents().unwrap();
	$(xml).find('lb').removeAttr('xml:id');
	$(xml).find('supplied[reason="undefined"]').removeAttr('reason');
	$(xml).find('supplied[unit="undefined"]').removeAttr('unit');
*/


	return xml2str(xml);
}


function compareCurrentTo(versionHash, userName) {

	var reconcilerURL = URI(reconciler).absoluteTo(gadgets.util.getUrlParameters()['url']);
	var form = document.createElement("form");
	form.setAttribute("method", "post");
	form.setAttribute("action", reconcilerURL);
	form.setAttribute("target", "reconcile");

	var hiddenField = document.createElement("input");              
	hiddenField.setAttribute("type", "hidden");
	hiddenField.setAttribute("name", "lhs");
	var tei = getTEI();
	tei = simplifyTEI(tei);
	hiddenField.setAttribute("value", encodeURIComponent(tei));
	form.appendChild(hiddenField);

	hiddenField = document.createElement("input");              
	hiddenField.setAttribute("type", "hidden");
	hiddenField.setAttribute("name", "rhs");

	if (versionHash == 'workingTranscription') {
		hiddenField.setAttribute("value", encodeURIComponent(simplifyTEI(workingTranscription)));
		form.appendChild(hiddenField);

		document.body.appendChild(form);
		reconcilerWindow = window.open('/community/images/blank.png', 'reconcile', 'scrollbars=yes,menubar=yes,height=600,width=800,resizable=yes,toolbar=yes,status=yes');
		form.submit();
		handleReconcilerWindow();
	}
	else {
		getTranscription(versionHash, userName, function(transText) {
			hiddenField.setAttribute("value", encodeURIComponent(simplifyTEI(transText)));
			form.appendChild(hiddenField);

			document.body.appendChild(form);
			reconcilerWindow = window.open('/community/images/blank.png', 'reconcile', 'scrollbars=yes,menubar=yes,height=600,width=800,resizable=yes,toolbar=yes,status=yes');
			form.submit();
			handleReconcilerWindow();
		});
	}
}


function handleReconcilerWindow() {
	if (reconcilerWindow) {
		if (reconcilerWindow.updateBuffer && reconcilerWindow.updateBuffer.length > 0) {
			loadEditorWithTEI(reconcilerWindow.updateBuffer);
		}
		if (reconcilerWindow.closed) {
			reconcilerWindow = null;
			return;
		}
		setTimeout('handleReconcilerWindow()', 1000);
	}
}


function loadPal(match) {
	var params = {};
	var postData = {
		sessionHash : $.cookie('ntvmrSession'),
		featureCode : 'Grapheme',
		likeMatch   : '%'+match+'%',
		limit       : 10
	};
	params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.POST;
	params[gadgets.io.RequestParameters.POST_DATA] = gadgets.io.encodeValues(postData);
	var url = servicesURL + '/feature/definition/getvalues/';
	gadgets.io.makeRequest(url, function(o) {
		var h1 = '<table><thead></thead><tbody>';
		h1 += '<tr style="cursor:pointer;">';
		var h = '';
		var total = 0;
		$(o.text).find('value').each( function() {
			var count = $(this).attr('score');
			h += '<td class="palVal" id="pv'+$(this).text()+'" onclick="showPalVal(\''+$(this).text()+'\');">'+$(this).text()+' ('+count+')</td>';
			total += parseInt(count);
		});
		h1 += '<td class="palVal" id="pv_'+match+'_" onclick="showPalVal(\'%'+match+'%\');">* '+match+' * ('+total+')</td>';
		h += '</tr>';
		h += '</tbody></table>';
		$('#palResultList').html(h1+h);
		$('#palResultImages').html('');
		showPalVal('%'+match+'%');
	}, params);
}


function showPalVal(match) {
	$('#palResultImages').html('<img src="/community/images/loading.gif"/>');
	var params = {};
	var postData = {
		sessionHash : $.cookie('ntvmrSession'),
		detail : 'page',
		featureCode : 'Grapheme%='+match,
		featureCodeClipString : 'Grapheme%='+match
	};
	params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.POST;
	params[gadgets.io.RequestParameters.POST_DATA] = gadgets.io.encodeValues(postData);
	var url = servicesURL + '/metadata/liste/search/';
	gadgets.io.makeRequest(url, function(o) {
		var h = '<table style=""><thead></thead><tbody>';
		h += '<tr style="cursor:pointer;">';
		$(o.text).find('feature').each( function() {
			var docID = $(this).parent().parent().parent().attr('docID');
			var gaNum = $(this).parent().parent().parent().attr('gaNum');
			var pageID = $(this).parent().attr('pageID');
			var folio = $(this).parent().attr('folio');
			var val = $(this).find('stringVal1').text();
			var featureID = $(this).attr('featureID');
			h += '<td onclick="showDocument('+docID+','+pageID+','+featureID+');"><img title="document: '+gaNum+' ('+docID+')\npage: '+folio + ' ('+pageID+')\nGrapheme: '+val+'" height="48" src="'+$(this).find('regionbox').attr('cacheThumbURL')+'"/></td>';
		});
		h += '</tr>';
		h += '</tbody></table>';
		$('#palResultImages').html(h);
		$('.palVal').css('background-color', '#FFF');
		$('#pv'+match.replace(/%/g, '_')).css('background-color', '#E2E2E2');
	}, params);
}


function showDocument(docID, pageID, featureID) {
	window.open('http://ntvmr.uni-muenster.de/manuscript-workspace?docID='+docID+((pageID)?('&pageID='+pageID):'')+((featureID)?('&featureID='+featureID):''),'workspace',
		  'titlebar=no,toolbar=no,status=no,scrollbars=yes,resizable=yes,menubar=no,location=yes,directories=no,'
		+ 'width=1024,height=768');
}

var lang = null;

// our initialization method
function loaded() {
	var prefs = new gadgets.Prefs();
	servicesURL = prefs.getString('servicesBaseURL');
	reconciler = prefs.getString('reconciler');
	baseTextServiceURL = prefs.getString('baseTextServiceURL');
	baseTextDocID = prefs.getString('baseTextDocID');
	if (baseTextDocID != null && baseTextDocID.length < 1) baseTextDocID = null;
	baseText = prefs.getString('baseText');
	transcriptionOwner = prefs.getString('transcriptionOwner');
	rtl = prefs.getBool('direction');
	announceChanges = prefs.getBool('announceChanges');
	autoSave = prefs.getBool('autoSave');
	// if we haven't been given an absolute URL, assume we're relative to our gadget and resolve an absolute URL from the given relative URL.
	if (servicesURL.indexOf('http') != 0) {
		servicesURL = URI(servicesURL).absoluteTo(gadgets.util.getUrlParameters()['url']);
	}
	var preferredHeight = parseInt(prefs.getString('height'));
	if (gadgets.util.hasFeature('dynamic-height')) gadgets.window.adjustHeight(preferredHeight);

	var req = opensocial.newDataRequest();
	req.add(req.newFetchPersonRequest('VIEWER'), 'viewer');
	req.send(function(data) {
		viewer = data.get('viewer').getData();

		$('#publishButton').hide();
		for (i = 0; i < 3; ++i) {
			var url = servicesURL+'/auth/hasrole/';
			var params = {};
			var postData = {
				sessionHash : $.cookie('ntvmrSession'),
				role        : (i==1 ? 'VMR Administrator' : i==2 ? 'Transcription Manager' : 'Site Administrator')
			};
			if (i == 0) postData.userGroupID = parent.Liferay.ThemeDisplay.getScopeGroupId();
			params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.POST;
			params[gadgets.io.RequestParameters.POST_DATA] = gadgets.io.encodeValues(postData);
			gadgets.io.makeRequest(url, function(o) {
				var xml = $.parseXML(o.text);
				if ($(xml).find('role').attr('hasRole') == 'true') {
					isAdmin = true;
					$('#publishButton').show();
				}
				var sn = $(xml).find('role').attr('userGroupName');
				if (sn != null && sn.length > 0) siteName = sn;
			}, params);
		}
	});

	lastRTL = rtl;
	setupEditor(rtl, function() {
		if (parent && parent.Liferay) $('#discussButtonSpan').show();
		else $('#discussButtonSpan').hide();
		

		$('#populateButton').bind('click',function(event){ 
			populateForLastPageLoaded();
		});

		$('#versionHistoryControl').bind('click',function(event){ 
			showVersionHistory();
		});

		$('#plusOneBeforeButton').bind('click',function(event){ 
			plusFromBasetext(-1);
		});

		$('#plusOneAfterButton').bind('click',function(event){ 
			plusFromBasetext(1);
		});

		$('#publishButton').bind('click',function(event){ 
			publishPage();
		});

		$('#previewButton').bind('click',function(event){ 
			previewPage();
		});

		verseRefDialog = $('#verseRefDialog').dialog({
			autoOpen: false,
			position: 'top',
			width: Math.min(gadgets.window.getViewportDimensions().width-24, 300),
			maxHeight: gadgets.window.getViewportDimensions().height-24,
			title: 'Provide Bible Verse Content'
		});
		verseRefDialog.append = false;

		$('#doSelectVerseRef').click(function() {
			verseRefDialog.dialog('close');
			if ($('#verseRef').val() != null && $('#verseRef').val().length > 0) {
				lastPage.indexContent = $('#verseRef').val();
				if (verseRefDialog.append > 0 || verseRefDialog.append < 0) {
					plusFromBasetext(verseRefDialog.append);
				}
				else populateForLastPageLoaded();
			}
			return false;
		});

		$('#historyDialog').dialog({
			autoOpen: false,
			position: 'top',
			width: Math.min(gadgets.window.getViewportDimensions().width-10, 730),
			maxHeight: gadgets.window.getViewportDimensions().height-24,
			title: 'Transcription History'
		});

		$('#palDialog').dialog({
			autoOpen: false,
			width: gadgets.window.getViewportDimensions().width-24,
			height: 156,
			title: 'Paleography',
			open: function() {
				$("#palDialog").dialog("widget").position({
					my: 'bottom',
					at: 'top',
					of: '#chirho',
					offset: '0 0',
					collision: 'fit'
				});
			}
		});

		$('#palInput').bind('input', function(e) {
			var text = $('#palInput').val();
			if (text && text.length > 0) {
				// odd bug in firefox: if we don't let keystroke event drop through before opening the dialog we get double greek characters (some, e.g., beta)
				setTimeout(function () {
					$('#palDialog').dialog('open');
					$('#palInput').focus();
				}, 100);
				loadPal($('#palInput').val());
			}
			else $('#palDialog').dialog('close');
		});
		expandFillPageClients();
		setTimeout(expandFillPageClients, 1000);
		setTimeout(expandFillPageClients, 1200);
		setTimeout(expandFillPageClients, 1400);
		$(window).resize(function() {
			expandFillPageClients();
		});
//		tinymce.activeEditor.contentCSS.push(URI('content-extra.css').absoluteTo(gadgets.util.getUrlParameters()['url']));
		var extraCSS = URI('content-extra.css').absoluteTo(gadgets.util.getUrlParameters()['url']);
		$('#wce_editor_ifr').contents().find('head').append('<link rel="stylesheet" href="'+extraCSS+'" type="text/css" />');
		tinymce.get('wce_editor').on('keyup', function() {
			if (announceChanges) {
				var html = getData();
				var tei = getTeiByHtml(html, tinymce.get('wce_editor').settings);
				tei = getTEI();
				var endHeaderOffset = tei.indexOf('<body>');
				if (endHeaderOffset > -1) tei = tei.substring(endHeaderOffset+6);
				endHeaderOffset = tei.lastIndexOf('</body>');
				if (endHeaderOffset > -1) tei = tei.substring(0, endHeaderOffset);
				if (lastPage.lang == 'g') lastPage.lang = 'grc';
				tei = '<?xml version="1.0" encoding="utf-8"?><?xml-model href="TEI-NTMSS.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?><TEI xmlns="http://www.tei-c.org/ns/1.0"><text'+(lastPage.lang?' xml:lang="'+lastPage.lang+'"' : '')+'><body>'+tei+'</body></text></TEI>';
				var params = {};
				var postData = {
					sessionHash : $.cookie('ntvmrSession'),
					text: tei,
					docID : lastPage.docID,
					pageID: lastPage.pageID,
				};
				var url = servicesURL + '/transcript/clean/';
				params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.POST;
				params[gadgets.io.RequestParameters.POST_DATA] = gadgets.io.encodeValues(postData);
				gadgets.io.makeRequest(url, function (o) {
					if (o.text.match('^<TEI')) {
						o.text = '<?xml version="1.0" encoding="utf-8"?><?xml-model href="TEI-NTMSS.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>' + o.text;
					}
					lastPage.transcriptionBody = o.text;
					lastPage.sender = document;
					++ignoreUpdateMessages; setTimeout(function() { --ignoreUpdateMessages; }, 500);
					if (gadgets.util.hasFeature('pubsub-2')) gadgets.Hub.publish("interedition.transcription.updated", lastPage);
				}, params);
			}
		});
	});

	document.getElementById(tinymce.activeEditor.id+'_tbl').style.width='100%';
}


var MARGIN=40;
function expandFillPageClients() {
	$('.fillPage').each(function () {
		$(this).height(gadgets.window.getViewportDimensions().height - $(this).offset().top - MARGIN);
	});
	$('.fillPageAlmost').each(function () {
		$(this).height(gadgets.window.getViewportDimensions().height - $(this).offset().top - MARGIN - 10);
	});
	resizeEditor();
}

function resizeEditor() {
	var height = gadgets.window.getViewportDimensions().height;
	var toolbarHeight = $(tinymce.activeEditor.iframeElement.parentElement.parentElement).children('.mce-toolbar-grp').height();
	var statusbarHeight = $(tinymce.activeEditor.iframeElement.parentElement.parentElement).children('.mce-statusbar').height();
	tinymce.DOM.setStyle(tinymce.activeEditor.iframeElement, 'height', (height - toolbarHeight - statusbarHeight - 8 - MARGIN) + 'px');
}


function setupEditor(rtl, callback) {
	var lang = (parent && parent.Liferay) ? parent.Liferay.ThemeDisplay.getLanguageId() : 'en';
	setWceEditor('wce_editor', rtl,
		function() {
			if (callback) callback();
		},
		lang, URI('js/tinymce').absoluteTo(gadgets.util.getUrlParameters()['url']),
		function () {
			return lastPage.docName;
		},
		function() {
			return (lastPage.lang == 'g') ? 'grc' : lastPage.lang;
		});
}


function getFolio() {
	return lastPage.pageName;
}


if (gadgets.util.hasFeature('pubsub-2')) gadgets.HubSettings.onConnect = function(hum, suc, err) {
	subId = gadgets.Hub.subscribe("interedition.page.selected", page_select_callback);
	subId = gadgets.Hub.subscribe("interedition.transcription.updated", onTranscriptionUpdate);
	subId = gadgets.Hub.subscribe("interedition.transcription.scrolled", onTranscriptionScrolled);
	subId = gadgets.Hub.subscribe("interedition.transcription.readonly", onTranscriptionReadOnly);
	loaded();
};
else gadgets.util.registerOnLoadHandler(loaded);



</script>


<div style="font-size: small;" id="historyDialog">
<div id="historyDialogContent">
</div>
</div>

<div style="font-size: small;" id="palDialog">
<div id="palResultImages" style="width:100%; overflow:auto;">
</div>
<div id="palResultList" style="margin: 0 0 0 0; float:left; position:absolute;bottom:2px;left:2px;"></div>
</div>

<div style="font-size: small;" id="verseRefDialog">
<p style="margin:0px 1px 0px 1px;">
You have selected an image which has not yet been indexed.  With what Biblical content would you like me to populate the editor?  You can be creative; I'm pretty bright.
</p>
<p style="margin:0px 1px 0px 1px;">
e.g., Jn 18:1-5
</p>
<p>
<input id="verseRef" name="verseRef" />
</p>
<p>
<button id="doSelectVerseRef">Populate</button>
</p>
</div>

</html>
]]>
</Content>
</Module>
