<?xml version="1.0" encoding="UTF-8" ?>
<Module>
  <ModulePrefs
	title="Transcription Editor"
	author_email="workspace@jiscmail.ac.uk"
	author="Universität Trier"
	description="Transcription Editor"
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

<UserPref name="height" datatype="enum" display_name="Gadget Height" default_value="550">
	<EnumValue value="400" display_value="Short"/>
	<EnumValue value="550" display_value="Medium"/>
	<EnumValue value="700" display_value="Tall"/>
</UserPref>

<UserPref name="servicesBaseURL" datatype="string" display_name="Services Base URL" default_value="../../vmr/api" />
<UserPref name="basetextServiceURL" datatype="string" display_name="Base Text Service URL" default_value="http://crosswire.org/study/fetchdata.jsp" />

<Content type="html">
<![CDATA[
<!DOCTYPE html
     PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
     "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<!-- odd path on the include because we use index.jsp here, so if we don't specify the index.jsp on the URL, we are 1 level different on our .. -->

<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.6/jquery.min.js"></script>

<script type="text/javascript" src="http://ntvmr.uni-muenster.de/community/js/URI.min.js"></script>

<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jqueryui/1/jquery-ui.min.js"></script>
<script type="text/javascript" src="js/tiny_mce_src.js"></script>  
<script type="text/javascript" src="js/wce_editor.js"></script>
<script type="text/javascript" src="js/wce_tei.js"></script>
<script type="text/javascript" src="js/wce_callback.js"></script>
<script type="text/javascript" src="js/rangy-core.js"></script>
<link rel="stylesheet" type="text/css" href="http://ajax.googleapis.com/ajax/libs/jqueryui/1/themes/base/jquery-ui.css"/>

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
-->
</style>



<script type="text/javascript">

// if no index data for the page, then dialog to ask what content from base text to use
var verseRefDialog = null; 

// listen for page loaded events from portal and hold on to last page which as loaded
var lastPage = null;

// whoami
var viewer = null;

// default values.  These really are superfluous.  They get set in 'loaded()' by configuration parameters
// but we'll set them to something in case somehow our reading of config params fails miserably

// this is for future transcription repository data store and other VMR services.
// this is the base of where all services live.  We don't use them yet, but will soon
var servicesURL = '../../vmr/api';

// this is for retrieving base text data this URL will receive posted data params:
//	 mod : Base Text Name, currently either coptic or greek (CoptBasetext|PapBasetext)
//	 key : section of text to load, e.g., Rom 6:5-14; Rom 8:9-11
//	 format : the format in which the data should be returned. currently 'basetext', and means tinyMCE/WFCE/Trier/HTML spans
var baseTextServiceURL = 'http://crosswire.org/study/fetchdata.jsp';
</script>
</head>
<body>
		<div style="margin: -8px 0px 0px 0px">
			<textarea id="wce_editor" rows="28" cols="80" style="width: 100%;"></textarea>
		</div>
<span style="margin: 0 0 0 0; float:right; position:absolute;bottom:2px;right:2px;"><button style="vertical-align: middle;" id="plusOneButton" >+1 Verse From Basetext</button> <button style="vertical-align: middle;" id="populateButton" >Populate From Basetext</button>
<span id="discussButtonSpan"><a href="#" onclick="discussTranscription();return false;" title="Discuss This Transcription"><img style="margin: 0 0 0 0; vertical-align: middle;" src="../../images/discuss.png"/></a></span>
</span>
</body>

<script type="text/javascript">
	function resizeWidth() {
		document.getElementById(tinyMCE.activeEditor.id+'_tbl').style.width='100%';
	}

	//Resize TinyMCE Editor height to the browser height minus the amount of pixels specified by var heightEasement above.
	function resizeHeight(minus) {
		var height;
		if (typeof(window.innerHeight) == "number") //non-IE
			height = window.innerHeight;
		else if (document.documentElement && document.documentElement.clientHeight) //IE 6+ strict mode
			height = document.documentElement.clientHeight;
		else if (document.body && document.body.clientHeight) //IE 4 compatible / IE quirks mode
			height = document.body.clientHeight;

		document.getElementById(tinyMCE.activeEditor.id+'_tbl').style.height = (height - minus) + "px";
		document.getElementById(tinyMCE.activeEditor.id + '_ifr').style.height = (height - minus) + "px";
	}

$(document).ready(function(){

	if (parent && parent.Liferay) $('#discussButtonSpan').show();
	else $('#discussButtonSpan').hide();
	

	$('#populateButton').bind('click',function(event){ 
		populateForLastPageLoaded();
	});

	$('#plusOneButton').bind('click',function(event){ 
		plusFromBasetext(1);
	});

	verseRefDialog = $('#verseRefDialog').dialog({
		autoOpen: false,
		position: 'top',
		width: gadgets.window.getViewportDimensions().width-24,
		maxHeight: gadgets.window.getViewportDimensions().height-24,
		title: 'Provide Bible Verse Content'
	});
	verseRefDialog.append = false;

	$('#doSelectVerseRef').click(function() {
		verseRefDialog.dialog('close');
		if ($('#verseRef').val() != null && $('#verseRef').val().length > 0) {
			lastPage.indexcontent = $('#verseRef').val();
			if (verseRefDialog.append > 0) {
				plusFromBasetext(verseRefDialog.append);
			}
			else populateForLastPageLoaded();
		}
		return false;
	});
	
}); 


function handleRequestMyTranscription(data) {
	var mydata = data.get("viewer_data");
	viewer = data.get("viewer").getData();

	document.body.style.cursor = 'default';

	if (mydata.hadError()) {
		return;
	}
	setData(decodeURIComponent(mydata.getData()[viewer.getId()]['trans-'+lastPage.docid+'-'+lastPage.pageid]));
}


function page_select_callback(topic, data, subscriberData) {

	document.body.style.cursor = 'wait';

	lastPage = data;

	var req = opensocial.newDataRequest(); 
	var fields = [ 'trans-'+data.docid+'-'+data.pageid ]; 
	var p = {}; 

	p[opensocial.IdSpec.Field.USER_ID] = "VIEWER"; 
	var idSpec = opensocial.newIdSpec(p); 
	req.add(req.newFetchPersonRequest(opensocial.IdSpec.PersonId.VIEWER), "viewer"); 
	req.add(req.newFetchPersonAppDataRequest(idSpec, fields), "viewer_data"); 
	req.send(handleRequestMyTranscription);
}


function populateFromBasetext(key, append) {

	document.body.style.cursor = 'wait';

	if (!append) tinyMCE.get('wce_editor').setContent('<img src="'+tinyMCE.baseURL+'../../../images/loading.gif"/>');


	var params = {};
	var postData = {};
	if (lastPage.lang == 'sa') {
		postData.mod = 'CoptBasetext';
	}
	else {
		postData.mod = 'PapBasetext';
	}

	postData.key = key;
	postData.format = 'basetext';
	params[gadgets.io.RequestParameters.METHOD] = gadgets.io.MethodType.POST;
	params[gadgets.io.RequestParameters.POST_DATA] = gadgets.io.encodeValues(postData);
	gadgets.io.makeRequest(baseTextServiceURL, function (o) {
			document.body.style.cursor = 'default';
			var content = tinyMCE.get('wce_editor').getContent();   
			tinyMCE.get('wce_editor').setContent((append==true)?content+o.text:o.text);   
		}, params);
}


function populateForLastPageLoaded() {
	if (lastPage != null) {
		if (lastPage.indexcontent == null || lastPage.indexcontent.length < 2) {
			verseRefDialog.append = false;
                        verseRefDialog.dialog('open');
		}
		else populateFromBasetext(lastPage.indexcontent);
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
		if (lastPage.indexcontent == null || lastPage.indexcontent.length < 2) {
			verseRefDialog.append = count;
                        verseRefDialog.dialog('open');
		}
		else {
			var alpha = false;
			var i = 0;
			for (; i < lastPage.indexcontent.length; ++i) {
				if (alpha && !isAlpha(lastPage.indexcontent.substring(i,i+1))) {
					break;
				}
				else if (isAlpha(lastPage.indexcontent.substring(i,i+1))) {
					alpha = true;
				}
			}
			var book = lastPage.indexcontent.substring(0,i);
			var rest = lastPage.indexcontent.substring(i);

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

			var transcriptionData = tinyMCE.get('wce_editor').getContent();
			var xml = $.parseXML('<doc>'+transcriptionData+'</doc>');
			// find the last chapter
			$(xml).find('span[class="chapter_number"]').each(function() {
				chap = $(this).text();
			});
			// find the last verse
			$(xml).find('span[class="verse_number"]').each(function() {
				verse = $(this).text();
				atLeastOneVerse = true;
			});

			verse = parseInt(verse) + (atLeastOneVerse ? 1 : 0);

			populateFromBasetext(book+'.'+chap+'.'+verse, true);
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

	var pageCategoryName = 'Page '+lastPage.pageid + (lastPage.pagename && lastPage.pagename.length > 0 ? (' (folio '+lastPage.pagename+')') : '');
	var catID = assureCategory(0, 'Transcriptions', 'Manuscript Transcriptions');
	catID = assureCategory(catID, ''+lastPage.docid + ' ('+lastPage.docname+')', '');
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
			 + ' - ' + lastPage.docid + ' ('+lastPage.docname+') '
			 + pageCategoryName;

	var mID = -1;
	for (i = 0; messages && i < messages.length; ++i) {
		if (messages[i].subject == subject) {
			mID = messages[i].messageId;
			break;
		}
	}

	if (mID < 0) {

		var transcription = getData();

		var body = '<p><a href="http://ntvmr.uni-muenster.de/transcribing'
				+ '?docid='+lastPage.docid
				+ '&pageid='+lastPage.pageid
				+ '&userid='+viewer.getId()
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




// our initialization method
function loaded() {
	var prefs = new gadgets.Prefs();
	servicesURL = prefs.getString('servicesBaseURL');
	baseTextServiceURL = prefs.getString('basetextServiceURL');
	// if we haven't been given an absolute URL, assume we're relative to our gadget and resolve an absolute URL from the given relative URL.
	if (servicesURL.indexOf('http') != 0) {
		servicesURL = URI(servicesURL).absoluteTo(gadgets.util.getUrlParameters()['url']);
	}
	var preferredHeight = parseInt(prefs.getString('height'));
	if (gadgets.util.hasFeature('dynamic-height')) gadgets.window.adjustHeight(preferredHeight);
	setWceEditor('wce_editor');
	resizeWidth();
	resizeHeight(115);
}


if (gadgets.util.hasFeature('pubsub-2')) gadgets.HubSettings.onConnect = function(hum, suc, err) {
	subId = gadgets.Hub.subscribe("interedition.page.selected", page_select_callback);
	loaded();
};
else gadgets.util.registerOnLoadHandler(loaded);

</script>


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
