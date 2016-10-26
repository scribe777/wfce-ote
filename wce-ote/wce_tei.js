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
    OHNE JEDE GEWÄHELEISTUNG, bereitgestellt; sogar ohne die implizite
    Gewährleistung der MARKTFÄHIGKEIT oder EIGNUNG FÜR EINEN BESTIMMTEN ZWECK.
    Siehe die GNU Lesser General Public License für weitere Details.

    Sie sollten eine Kopie der GNU Lesser General Public License zusammen mit diesem
    Programm erhalten haben. Wenn nicht, siehe <http://www.gnu.org/licenses/>.
*/

// setTEIXml
//window.onerror = Fehlerbehandlung;

//pb, cb ,lb with break="no" defined in function html2Tei_mergeWNode();
var wceNodeInsideW=["hi","unclear","gap","supplied", "w", "abbr", "ex"];//TODO: more type?

function Fehlerbehandlung(Nachricht, Datei, Zeile) {
	Fehler = "Error:\n" + Nachricht + "\n" + Datei + "\n" + Zeile;
	zeigeFehler(Fehler);
	return true;
}

function zeigeFehler(Fehler) {
	alert(Fehler);
}

function getHtmlByTei(inputString) {
	var $newDoc, $newRoot, $newRoot;
	var $formatStart, $formatEnd;

	var teiIndexData = {
		'bookNumber' : '',
		'witValue' : '',
		'manuscriptLang' : ''
	};
	
	var gid = 0;
	var g_lineNumber;
	var g_columnNumber;
	var g_quireNumber;
	var g_verseNumber;
	var g_chapterNumber;
	var g_bookNumber;

	// As &om; can not be handled we go back to OMISSION
	inputString = inputString.replace(/([\r\n]|<w\s*\/\s*>)/g,''); 
	inputString=inputString.replace(/(\s+)/g,' ');
	inputString=inputString.replace(/>\s</g,'><');
	//inputString=inputString.replace(/<w\s*\/\s*>/g,'');
	inputString = inputString.replace(/&om;/g, "<w>OMISSION</w>"); //for existing transcripts
	inputString = inputString.replace(/&lac;/g, '<gap reason="lacuna" unit="unspecified" extent="unspecified"/>');
	inputString = inputString.replace(/&lacorom;/g, '<gap reason="unspecified" unit="unspecified" extent="unspecified"/>');
	inputString = inputString.replace(/lacuna\/illegible/g, 'unspecified');
	//Trick to solve problem without <w>...</w>
	inputString = inputString.replace('\u00a0', ' ');
	inputString = inputString.replace(/<\/abbr>\s*<abbr\s*/g, '</abbr><w> </w><abbr ');//Fixed #1972
	//inputString = inputString.replace(/<\/supplied><\/w><w><supplied.*?>/g, " ");
	//inputString = inputString.replace(/<\/hi><\/w><w><hi.*?>/g, " ");
	//24.10.2013 YG:funktioniert nicht wenn mehrere verschaltet sind z.B:
	//nicht nur <hi>, sondern <abbr type="nomSac"> muessen auch zusammengezogen werden
	/*<w>
		q
		<hi rend="rubric">
			q
			<abbr type="nomSac">
				<hi rend="overline">sdf</hi>
			</abbr>
		</hi>
	</w>
	<w>
		<hi rend="rubric">
			<abbr type="nomSac">
				<hi rend="overline">asdf</hi>
			</abbr>
		</hi>
		<hi rend="rubric">m</hi>m
	</w>*/

	var getHtmlString = function() {
		var $oldDoc = loadXMLString(inputString);
		if(!$oldDoc){
		 	//return '';
		}
		var $oldRoot = $oldDoc.documentElement;
		
		//validate xml
		if ($oldRoot && $oldRoot.firstChild){ 
			var first=$oldRoot.firstChild;
			var error;
			if(first.nodeType==3 && $oldRoot.nodeName && $oldRoot.nodeName.match(/parsererror/i)){
				error=first.textContent;
			}else if(first.nodeName && first.nodeName.match(/parsererror/i)){
				error=first.textContent; 
			}
			
			if(error){
				Fehlerbehandlung(' XML parser '+ error);
				//return '';
			}
		}

		$newDoc = loadXMLString("<TEMP></TEMP>");
		$newRoot = $newDoc.documentElement;
		 
		initTeiInput($oldRoot);
		
		var childList = $oldRoot.childNodes;
		for (var i = 0, $c, l = childList.length; i < l; i++) {
			$c = childList[i];
			if (!$c) {
				continue;
			} else {
				readAllChildrenOfTeiNode($newRoot, $c);
			}
		}
		addSpaceBeforeVerse($newRoot);
		// DOM to String
		var str = xml2String($newRoot);
		if (!str)
			return '';
		
		return str;
	};
	
	var addSpaceBeforeVerse =function($htmlNode){
		if (!$htmlNode || ($htmlNode.nodeType!=1 && $htmlNode.nodeType!=11)){ //nodeType==11 from createDocumentFragment
			return;	
		}
		var childList = $htmlNode.childNodes;
		for (var i = 0, $c, l = childList.length; i < l; i++) {
			$c = childList[i];
			if (!$c) {
				continue;
			} else {
				addSpaceBeforeVerse($c);
			}
		}
		
		if ($($htmlNode).hasClass('verse_number')) {
			var pre=$htmlNode.previousSibling;
			if(pre && pre.nodeType==3){
				var preText=pre.nodeValue;
				if(preText && !preText.match(/\s+$/)){ 
					 pre.nodeValue=preText+' ';
				}
			}					
		}		
		
	};
	
	//merge <w> which come from wceNodeInsideW
	var initTeiInput = function($parent){
		if (!$parent || ($parent.nodeType!=1 && $parent.nodeType!=11)){ //nodeType==11 from createDocumentFragment
			return;	
		}
		/*if($parent.nodeName=='ab'){
			var part=$parent.getAttribute('part');
			if(part && (part=='M' || part=='I') && $parent.lastChild){//Fixed #1896: Hyphen after supplied text
				var lb=$parent.ownerDocument.createElement('lb'); 
				lb.setAttribute('break', 'no');
				$parent.lastChild.appendChild(lb);
			}
		}*/
		var tNext=$parent.firstChild;
		while(tNext){
			initTeiInput(tNext);
			tNext=tNext.nextSibling;
		}
		Tei2Html_mergeWNode($parent); 
	}; 
	
	var Tei2Html_mergeWNode = function ($node){
		if(!$node || $node.nodeType==3 || $node.nodeName!='w'){
			return;
		}
		var lastChild=$node.lastChild;
		var startNode;
		var nextW=$node.nextSibling;
		var mergeAgain=false;
		
		if(lastChild && lastChild.nodeType!=3 && lastChild.nodeName!='abbr'){
			var toAppend=new Array();
			//get nodes to merge
			while(nextW){
				if(nextW.nodeType==3 || nextW.nodeName!='w'){
					break;
				}								
				var firstChildOfNextW=nextW.firstChild;
				if(compareNodes(lastChild, firstChildOfNextW)){
					if(!startNode){
						startNode=nextW.previousSibling;
					}					
					toAppend.push(nextW);
					if(firstChildOfNextW.nextSibling && !compareNodes(firstChildOfNextW,firstChildOfNextW.nextSibling)){
						mergeAgain=true;
						break;	
					}
					nextW=nextW.nextSibling;
				}else{
					break;
				}										
			}
			
			//merge
			if(startNode){
				for(var i=0, a, l=toAppend.length; i<l; i++){
					a=toAppend[i];
					var tempspace=startNode.ownerDocument.createElement('tempspace');  
					nodeAddText(tempspace, " ");
					startNode.appendChild(tempspace);
					while(a.firstChild){
						startNode.appendChild(a.firstChild);
					}
					a.parentNode.removeChild(a);
				}
				Tei2Html_mergeOtherNodes(startNode, true); 
				
				if(mergeAgain){
					Tei2Html_mergeWNode(startNode);
				}				
			}
			
		} 
	};
	
	var Tei2Html_mergeOtherNodes =function($node, isW){
		if(!$node){
			return;
		}
		
		if(!isW && $.inArray($node.nodeName,wceNodeInsideW)<0){	
			return;
		}
		
		var curr=$node.firstChild; 
		var next;
		var toAppend=new Array();
		var startNode;
		var tempspace;
		while(curr){
			tempspace=null;
			next=curr.nextSibling;
			if(next && next.nodeType==1 && next.nodeName=='tempspace'){
				tempspace=next;
				next=next.nextSibling;
			}
			if(compareNodes(curr,next)){
				if(!startNode){
					startNode=curr;
				}
				if(tempspace){
					toAppend.push(tempspace);
				}
				toAppend.push(next); 
			}
			curr=next;
		}
		if(startNode){
			for(var i=0, a, l=toAppend.length; i<l; i++){
				a=toAppend[i];
				if(a.nodeName=='tempspace'){
					startNode.appendChild(a);
				}else{
					while(a.firstChild){
						startNode.appendChild(a.firstChild);
					}
					a.parentNode.removeChild(a);
				}
			}
			Tei2Html_mergeOtherNodes(startNode, isW);
			//var wParent=getWParent(startNode);
			//if(wParent){ 
			//	Tei2Html_mergeWNode(wParent.previousSibling);
			//}
		}
	};	
	/*
	var getWParent = function ($node){
		var p=$node.parentNode;	
		while(p){
			if((p.nodeType==1 || p.nodeType==11) && p.nodeName=='w'){
				return p;
			}
			p=p.parentNode;
		}
		return null;
	};
	*/
	 
	/**
	 * add format_start format end into wce element
	 */
	var addFormatElement = function($node) {
		var $firstChild;
		if (!$node)
			return;
		if ($node.nodeType == 1 || $node.nodeType == 11) {
			if ($($node).hasClass('verse_number') || $($node).hasClass('chapter_number') || $($node).hasClass('book_number') || $($node).hasClass('lection_number')) {
				return;
			}
		}

		$firstChild = $node.firstChild;
		if (!$firstChild)
			return;

		var $start = $newDoc.createElement('span');
		$start.setAttribute('class', 'format_start mceNonEditable');
		nodeAddText($start, '\u2039');

		$node.insertBefore($start, $firstChild);

		var $end = $newDoc.createElement('span');
		$end.setAttribute('class', 'format_end mceNonEditable');
		nodeAddText($end, '\u203a');
		$node.appendChild($end);
	};
	
	/*
	 * add groupid for delete (pb, cb, lb)
	 */
	var addGroupID = function($teiNode, _id){
		if(!$teiNode){
			return;
		}
		var n=$teiNode.nodeName;
		var i;
		if(n=='pb'){
			i='_3_';
		}else if(n=='cb'){
			i='_2_';
		}else if(n=='lb' && _id){
			i='';
		}else{
			return;
		}
		
		if(!$teiNode.getAttribute('id')){
			if(!_id){
				 _id = i+new Date().getTime() + '' + Math.round(Math.random() * 1000);
			}
			$teiNode.setAttribute('id',n+_id);
			$teiNode=$teiNode.nextSibling;
			addGroupID($teiNode,_id);
		}
		
	};

	/*
	 * read all nodes of $node and change and add
	 */
	var readAllChildrenOfTeiNode = function($htmlParent, $teiNode) {
		if (!$teiNode) {
			return;
		}
		if ($teiNode.nodeType == 3) {
			Tei2Html_TEXT($htmlParent, $teiNode);
		} else if ($teiNode.nodeType == 1 || $teiNode.nodeType == 11) {
			//add GroupId to pb, cb lb
			addGroupID($teiNode);
			
			if ($teiNode.nodeName)
				var $newParent = getHtmlNodeByTeiNode($htmlParent, $teiNode);

			// stop to read $teiNode
			if (!$newParent) {
				// make sure that a *single* gap is followed by a space
				if ($teiNode.nodeName == 'gap' && $teiNode.nextSibling && $teiNode.nextSibling.nodeName !== 'unclear' && $teiNode.nextSibling.nodeValue == null)
					nodeAddText($htmlParent, ' ');
				return;
			}
			
			if ($newParent && $newParent.nodeName.toLowerCase() == 'span' && !$newParent.firstChild){
				var needAddFormat=true;
			} 

			var childList = $teiNode.childNodes;
			for (var i = 0, $c, l = childList.length; i < l; i++) {
				$c = childList[i];
				if (!$c) {
					continue;
				} else { 
					readAllChildrenOfTeiNode($newParent, $c);
				}
			} 
			
			if (needAddFormat) {
				addFormatElement($newParent);
			}
			
			
			if ($teiNode.nodeName == 'w' ) { //}|| $teiNode.nodeName == 'gap') { //TODO: check
				// Please note: There is *no* word numbering
				var $nextSibling = $teiNode.nextSibling;
				if ($nextSibling && $nextSibling.nodeName == 'note') {
					return;
				}
				var $lastChild = $teiNode.lastChild;
				if ($lastChild && $lastChild.nodeName == 'lb') {
					return;
				}
				nodeAddText($htmlParent, ' ');
			}
		}

	};

	/*
	 * @new parentNode @ oldNode
	 */
	var getHtmlNodeByTeiNode = function($htmlParent, $teiNode) {
		var teiNodeName = $teiNode.nodeName;
		// TODO: set wce_orig=""

		switch (teiNodeName) {
			case 'w':
				return $htmlParent;
				//return Tei2Html_w($htmlParent, $teiNode);
				
			case 'ex':
				return Tei2Html_ex($htmlParent, $teiNode);
			// ex

			case 'unclear':
				return Tei2Html_unclear($htmlParent, $teiNode);
			// unclear

			case 'div':
				return Tei2Html_div($htmlParent, $teiNode);
			// chapter, book

			case 'gap':
				return Tei2Html_gap_supplied($htmlParent, $teiNode, teiNodeName);
			// gap

			case 'supplied':
				return Tei2Html_gap_supplied($htmlParent, $teiNode, teiNodeName);
			// gap->supplied

			case 'abbr':
				return Tei2Html_abbr($htmlParent, $teiNode, teiNodeName);
			// abbreviation

			case 'comm':
				return Tei2Html_paratext($htmlParent, $teiNode, teiNodeName);
			// paratext

			case 'num':
				return Tei2Html_paratext($htmlParent, $teiNode, 'fw');
			// paratext

			case 'fw':
				return Tei2Html_paratext($htmlParent, $teiNode, teiNodeName);
			// paratext

			case 'ab':
				return Tei2Html_ab($htmlParent, $teiNode);
			// verse

			case 'pc':
				return Tei2Html_pc($htmlParent, $teiNode);
			// pc

			case 'hi':
				return Tei2Html_hi($htmlParent, $teiNode);
			// formatting

			case 'space':
				return Tei2Html_space($htmlParent, $teiNode);
			// spaces

			case 'qb':
				return Tei2Html_break($htmlParent, $teiNode, 'qb');
			// Quire break

			case 'pb':
				return Tei2Html_break($htmlParent, $teiNode, 'pb');
			// page break

			case 'cb':
				return Tei2Html_break($htmlParent, $teiNode, 'cb');
			// column break

			case 'lb':
				return Tei2Html_break($htmlParent, $teiNode, 'lb');
			// line break

			case 'note':
				return Tei2Html_note($htmlParent, $teiNode);
			// note

			case 'app':
				return Tei2Html_app($htmlParent, $teiNode);
			// correction

			case 'seg':	// marginal information
				if (($teiNode.firstChild && ($teiNode.firstChild.nodeName == 'fw'||$teiNode.firstChild.nodeName == 'num'))
					|| ($teiNode.parentNode && $teiNode.parentNode.nodeName == 'rdg')) 
					return $htmlParent;
				else
					return Tei2Html_paratext($htmlParent, $teiNode, 'fw');
			default:
				return $htmlParent;
		}

	};

	/*
	 *
	 *
	 */
	var getWceAttributeByTei = function($teiNode, mapping) {
		var wceAttr = '';

		var attribute, attrName, attrValue;
		for (var i = 0, obj, l = $teiNode.attributes.length; i < l; i++) {
			attribute = $teiNode.attributes[i];
			attrName = attribute.nodeName;
			attrValue = attribute.nodeValue;
			obj = mapping[attrName];
			if (!obj) {
				continue;
			}

			if (typeof obj == 'string') {
				wceAttr += obj + attrValue;
			} else if ( typeof obj == 'object') {
				if (obj['0'].indexOf('@' + attrValue) > -1) {
					wceAttr += obj['1'] + attrValue;
				} else {
					wceAttr += obj['2'] + attrValue;
				}
			}
		}

		return wceAttr;
	};

	/*
	 * create TEI by Html-TextNode
	 */
	var Tei2Html_TEXT = function($htmlParent, $teiNode) {
		var textValue = $teiNode.nodeValue;
		var oldNodeParentName = $teiNode.parentNode.nodeName;
		
		if (oldNodeParentName == 'ex') {
			// ex
			textValue = '(' + textValue + ')';
		} else if (oldNodeParentName == 'unclear') {
			// unclear
			var unclear_text = "";
			for (var i = 0, ch, l = textValue.length; i < l; i++) {
				ch = textValue.charAt(i);
				if (ch == ' ') {
					unclear_text += ch;
				} else {
					unclear_text += ch + '\u0323';
				}
			}
			textValue = unclear_text;
		}

		nodeAddText($htmlParent, textValue);
	};

	/*
	 * **** <w>
	delete a 13.11.2013 by YG, see initTeiInput() the code: if(part && (part=='M' || part=='I') && $parent.lastChild){.....
	var Tei2Html_w = function($htmlParent, $teiNode) {
		if ($teiNode.hasAttributes && $teiNode.getAttribute("part") == "I" && $teiNode.firstChild) {
			nodeAddText($htmlParent, $teiNode.firstChild.nodeValue);
			//add word part to HTML
			$teiNode.removeChild($teiNode.firstChild);
			//remove word part from XML

			var $newNode = $newDoc.createElement('span');
			// add line break for "page end"
			$newNode.setAttribute("class", "mceNonEditable brea");
			$newNode.setAttribute("wce", "__t=brea&__n=&hasBreak=yes&break_type=lb&number=&pb_type=&fibre_type=&facs=&lb_alignment=");
			nodeAddText($newNode, '\u2010');
			$br = $newDoc.createElement('br');
			$newNode.appendChild($br); 
			nodeAddText($newNode, '\u21B5');
			addFormatElement($newNode);
			$htmlParent.appendChild($newNode);
		}
		return $htmlParent;
	}; */
	/*
	 * **** <ex>
	 */
	var Tei2Html_ex = function($htmlParent, $teiNode) {
		var $newNode = $newDoc.createElement('span');
		$newNode.setAttribute('class', 'part_abbr');
		var wceAttr = '__t=part_abbr&__n=';
		var rend = $teiNode.getAttribute('rend');
		if (rend) {
			switch (rend) {
				case '̅': 
				case 'ę':
				case '÷':
				case 'ƕ':
				case '⧺':
				case 'ə':
				case '&':
				case 'ϗ':
				case '⁊':
				case '∸':
					wceAttr += '&exp_rend_other=&exp_rend=';
					break;
				default:
					wceAttr += '&exp_rend=other&exp_rend_other='; 
			}
			wceAttr += encodeURIComponent(rend);
		} else {
			wceAttr += '&exp_rend=&exp_rend_other='
		}
		$newNode.setAttribute('wce', wceAttr);
		addFormatElement($newNode);
		$htmlParent.appendChild($newNode);
		return $newNode;
	};
	/*
	 * **** <unclear>
	 */
	var Tei2Html_unclear = function($htmlParent, $teiNode) {
		var $newNode = $newDoc.createElement('span');
		$newNode.setAttribute('class', 'unclear');
		var wceAttr = '__t=unclear&__n=';

		$newNode.setAttribute('wce_orig', $teiNode.firstChild && $teiNode.firstChild.nodeValue ? $teiNode.firstChild.nodeValue : '');
		

		if (!$teiNode.getAttribute('reason')) {// no reason given
			wceAttr += '&unclear_text_reason=&unclear_text_reason_other=';
		} else {
			var mapping = {
				'reason' : {
					'0' : '@poor image@faded ink@damage to page',
					'1' : '&unclear_text_reason_other=&unclear_text_reason=',
					'2' : '&unclear_text_reason=other&unclear_text_reason_other='
				},
			};
			wceAttr += getWceAttributeByTei($teiNode, mapping);
		}
		$newNode.setAttribute('wce', wceAttr);
		addFormatElement($newNode); 
		
		//add wce_orig 28.10.2013 YG
		var s=getOriginalTextByTeiNode($teiNode);
		s=s.replace(/\%CC\%A3/g,'');
		$newNode.setAttribute('wce_orig',s);
		
		$htmlParent.appendChild($newNode);
		return $newNode;
	};

	/*
	 * *** <div>
	 */
	var Tei2Html_div = function($htmlParent, $teiNode) {
		// <div type="chapter" n="1">
		var divType = $teiNode.getAttribute('type');
		if (!divType)
			return $htmlParent;

		if (divType == 'lection') {
			var $newNode = $newDoc.createElement('span');
			$newNode.setAttribute('class', 'lection_number mceNonEditable');
			$newNode.setAttribute('wce', '__t=lection_number&number=' + $teiNode.getAttribute('n'));
			$newNode.setAttribute('id', ++gid);
			nodeAddText($newNode, 'Lec');
		} else if (divType == 'book') {
			var $newNode = $newDoc.createElement('span');
			$newNode.setAttribute('class', 'book_number mceNonEditable');
			$newNode.setAttribute('wce', '__t=book_number');
			$newNode.setAttribute('id', ++gid);
			var $booknumber = $teiNode.getAttribute('n').substring(1);
			// get rid of the "B"
			if ($booknumber.charAt(0) == '0')
				$booknumber = $booknumber.substring(1);
			// get rid of "0"
			nodeAddText($newNode, $booknumber);
		} else if (divType == 'chapter') {
			var $newNode = $newDoc.createElement('span');
			$newNode.setAttribute('class', 'chapter_number mceNonEditable');
			$newNode.setAttribute('wce', '__t=chapter_number');
			$newNode.setAttribute('id', ++gid);
			var nValue = $teiNode.getAttribute('n');
			// BXXK(Y)Y
			if (nValue && nValue != '') {
				var indexK = nValue.indexOf('K');
				var indexB = nValue.indexOf('B');
				if (indexB + 1 > -1 && indexK - 1 > 0) {//TODO: Do we need this, if the book number is passed to the editor at run-time? Maybe just a fallback?
					var bookValue = nValue.substr(indexB + 1, indexK - 1);
					// we store the book number as it is, maybe with leading "0"
					//if (bookValue.length == 2 && bookValue.charAt(0) == '0' //if bookValue is a two-digit number and starts with "0"
					//	bookValue = bookValue.substring(1);
					g_bookNumber = bookValue;
				}
				indexK++;
				if (indexK > 0 && indexK < nValue.length) {
					nValue = nValue.substr(indexK);
					g_chapterNumber = nValue;
					nodeAddText($newNode, g_chapterNumber);
				}
			}
		} else { //incipit or explicit
			var $newNode = $newDoc.createElement('span');
			$newNode.setAttribute('class', 'chapter_number mceNonEditable');
			$newNode.setAttribute('wce', '__t=chapter_number');
			if ($teiNode.getAttribute("type") === "incipit")
				nodeAddText($newNode, "Inscriptio");
			else if ($teiNode.getAttribute("type") === "explicit")
				nodeAddText($newNode, "Subscriptio");
		}
		addFormatElement($newNode);
		var pre=$htmlParent.previousSibling;
		if(!pre || (!pre.nodeType==3 && pre.nodeName!='w')){ //add a space before book number
			nodeAddText($htmlParent, ' ');
		}
		$htmlParent.appendChild($newNode);
		nodeAddText($htmlParent, ' ');
		return $htmlParent;
	};
	/*
	 * <ab>
	 */
	var Tei2Html_ab = function($htmlParent, $teiNode) {
		var $newNode = $newDoc.createElement('span');
		$newNode.setAttribute('class', 'verse_number mceNonEditable');
		var nValue = $teiNode.getAttribute('n');
		if (nValue && nValue != '') {
			var indexV = nValue.indexOf('V');
			indexV++;
			if (indexV > 0 && indexV < nValue.length) {
				nValue = nValue.substr(indexV);
				g_verseNumber = nValue;
				nodeAddText($newNode, g_verseNumber);
			}
		}
		var partValue = $teiNode.getAttribute('part');
		if (partValue && (partValue === 'F' || partValue === 'M')){
			nodeAddText($newNode, ' Cont.');
		}
		if (partValue) 
		 	$newNode.setAttribute('wce', '__t=verse_number&partial=' + partValue);
		else
			$newNode.setAttribute('wce', '__t=verse_number');
		addFormatElement($newNode);
		$htmlParent.appendChild($newNode);
		nodeAddText($htmlParent, ' ');
		return $htmlParent;
	};

	/*
	 * <pc>
	 */
	var Tei2Html_pc = function($htmlParent, $teiNode) {
		var $newNode = $newDoc.createElement('span');
		$newNode.setAttribute('class', 'pc');
		$newNode.setAttribute('wce', '__t=pc');
		addFormatElement($newNode);
		$htmlParent.appendChild($newNode);
		nodeAddText($htmlParent, ' ');
		return $newNode;
	};

	/*
	 * <gap> / <supplied>
	 */
	var Tei2Html_gap_supplied = function($htmlParent, $teiNode, teiNodeName) {
		// <gap reason="lacuna" unit="char" />
		var $newNode = $newDoc.createElement('span');
		
		var extAttr = $teiNode.getAttribute('ext');
		if (extAttr) { //supplied text in abbr
			$newNode.setAttribute('ext', extAttr);
		}
		
		if ($teiNode.getAttribute("reason") === 'witnessEnd') {// Witness end
			nodeAddText($htmlParent, ' '); //add space before <span>
			$newNode.setAttribute('class', 'witnessend');
			wceAttr = '__t=gap&__n=&original_gap_text=&gap_reason=witnessEnd&unit=&unit_other=&extent=&supplied_source=na28&supplied_source_other=&insert=Insert&cancel=Cancel';
			$newNode.setAttribute('wce', wceAttr);
			nodeAddText($newNode, "Witness End");
		} else {
			$newNode.setAttribute('class', 'gap');
			// for gap *and* supplied

			var wceAttr = '__t=gap&__n=&gap_reason_dummy_lacuna=lacuna&gap_reason_dummy_illegible=illegible&gap_reason_dummy_unspecified=unspecified&gap_reason_dummy_inferredPage=inferredPage';
			var mapping = {
				'reason' : '&gap_reason=',
				'unit' : {
					'0' : '@char@line@page@quire@book@chapter@verse@word@unspecified',
					'1' : '&unit_other=&unit=',
					'2' : '&unit=other&unit_other='
				},
				'extent' : '&extent=',
				'source' : {
					'0' : '@na28@transcriber@tr',
					'1' : '&supplied_source_other=&supplied_source=',
					'2' : '&supplied_source=other&&supplied_source_other='
				}
			};
			wceAttr += getWceAttributeByTei($teiNode, mapping);
			// In case there is no unit given, we have to fix that. Otherwise we'll get a lot of "undefined" values
			if (!$teiNode.getAttribute('unit'))
				wceAttr += '&unit_other=&unit=';
			if (teiNodeName == 'supplied') {
				wceAttr += '&mark_as_supplied=supplied';
				$newNode.setAttribute('wce_orig', $teiNode.firstChild ? $teiNode.firstChild.nodeValue : '');
				// get the content and save it as original
				// for an empty source we have to add the "none" value
				if (!$teiNode.getAttribute('source'))
					wceAttr += '&supplied_source_other=&supplied_source=none';
			}

			$newNode.setAttribute('wce', wceAttr);

			if (teiNodeName == 'supplied') {// supplied 
				var $tempParent = $newDoc.createElement('t'); 
				var cList = $teiNode.childNodes;
				for (var i = 0, c, l = cList.length; i < l; i++) {
					c = cList[i];
					if (!c) {
						break;
					}
					if (c.nodeType == 3)
						nodeAddText($tempParent, c.nodeValue);
					else
						readAllChildrenOfTeiNode($tempParent, c);
				}

				if ($tempParent) {
					nodeAddText($newNode, '[');
					while($tempParent.hasChildNodes()){
						$newNode.appendChild($tempParent.firstChild);
					}
					nodeAddText($newNode, ']');
				}
			} else { // gap
				//if ($htmlParent.nodeName !== 't'){
				gap_text = '';
				if (wceAttr.indexOf('unit=char') > -1) {
					if ($teiNode.getAttribute('extent'))
						nodeAddText($newNode, '[' + decodeURIComponent($teiNode.getAttribute('extent')) + ']');
					else
						nodeAddText($newNode, '[...]');
				} else if (wceAttr.indexOf('unit=line') > -1) {
					// TODO: numbering
					if ($teiNode.getAttribute('extent') == 'part' || $teiNode.getAttribute('extent') == 'unspecified')
						nodeAddText($newNode, '[...]');
					else {
						for (var i = 0; i < $teiNode.getAttribute('extent'); i++) {
							$br = $newDoc.createElement('br');
							$newNode.appendChild($br);
							nodeAddText($newNode, '\u21B5[...]');
						}
					}
				} else if (wceAttr.indexOf('unit=page') > -1) {
					// TODO: numbering
					for (var i = 0; i < $teiNode.getAttribute('extent'); i++) {
						$br = $newDoc.createElement('br');
						$newNode.appendChild($br);
						nodeAddText($newNode, 'PB');
						$br = $newDoc.createElement('br');
						$newNode.appendChild($br);
						nodeAddText($newNode, '[...]');
					}
				} else if (wceAttr.indexOf('unit=quire') > -1) {
					// TODO: numbering
					for (var i = 0; i < $teiNode.getAttribute('extent'); i++) {
						$br = $newDoc.createElement('br');
						$newNode.appendChild($br);
						nodeAddText($newNode, 'QB');
						$newNode.appendChild($br);
						nodeAddText($newNode, '[...]');
					}
				} else {
					nodeAddText($newNode, '[...]');
				}
			}
			//}
		}
		
		addFormatElement($newNode);
		//var s=getOriginalTextByTeiNode($teiNode); alert(s);
		//$newNode.setAttribute('wce_orig', s);//TODO: test wce_orig
		$htmlParent.appendChild($newNode);
		return null;
	};

	/*
	 * <hi>
	 */
	var Tei2Html_hi = function($htmlParent, $teiNode) {
		var className, wceValue;
		var $newNode = $newDoc.createElement('span');
		var rendValue = $teiNode.getAttribute('rend');
		if (!rendValue) {
			return null;
		}

		switch (rendValue) {
			case 'rubric':
				className = 'formatting_rubrication';
				break;
			case 'gold':
				className = 'formatting_gold';
				break;
			case 'blue':
				className = 'formatting_blue';
				break;
			case 'green':
				className = 'formatting_green';
				break;
			case 'yellow':
				className = 'formatting_yellow';
				break;
			case 'other':
				className = 'formatting_other';
				break;
			case 'cap':
				className = 'formatting_capitals';
				var height = $teiNode.getAttribute('height');
				break;
			case 'ol':
				// for compatibility
				className = 'formatting_overline';
				break;
			case 'overline':
				// recent option
				className = 'formatting_overline';
				break;
			case 'displaced-above':
				className = 'formatting_displaced-above';
				break;
			case 'displaced-below':
				className = 'formatting_displaced-below';
				break;
			case 'displaced-other':
				className = 'formatting_displaced-other';
				break;
				
			default:
				className = 'formatting_ornamentation_other';
				wceValue='__t=formatting_ornamentation_other&__n=&formatting_ornamentation_other='+rendValue;
				break;
		}
		if (!className)
			return null;

		$newNode.setAttribute('class', className);
		wceValue=wceValue?wceValue:'__t=' + className;
		if (height)
			wceValue += '&__n=&capitals_height=' + height;
		$newNode.setAttribute('wce', wceValue);
		$newNode.setAttribute('wce_orig', getOriginalTextByTeiNode($teiNode));
		addFormatElement($newNode);
		$htmlParent.appendChild($newNode);
		return $newNode;
	};

	/*
	 * <abbr> /
	 */
	var Tei2Html_abbr = function($htmlParent, $teiNode, teiNodeName) {
		var $newNode = $newDoc.createElement('span');

		// <abbr type="nomSac"> <hi rend="ol">aaa</hi> </abbr>
		// <span class="abbr_add_overline"
		// wce_orig="aaa" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;abbr_type=nomSac&amp;abbr_type_other=&amp;add_overline=overline">aaa</span>
		//var cList = $teiNode.childNodes;
		var className = teiNodeName;

		//var overlineCheckboxValue = '';
		var startlist,cList;
		var wceAttr = '__t=abbr&__n=&original_abbr_text=';
		var mapping = {
			'type' : {
				'0' : '@nomSac@num',
				'1' : '&abbr_type_other=&abbr_type=',
				'2' : '&abbr_type=other&abbr_type_other='
			}
		};
		var toMerge;
		var _moveSuplied=function (_supp){
			var _hi=_supp.firstChild;
			if(_supp.nodeName!='supplied' || !_hi || _hi.nodeName!='hi' || !_hi.getAttribute('rend') || _hi.getAttribute('rend')!='overline' || _supp.nodeName!='unclear') {
				return;
			} 
			_supp.setAttribute('ext', 'inabbr');
			toMerge=true;
			var _deep,_temp=_hi; 
			while(_temp){
				if(_temp.nodeType==3){
					break;
				}
				_deep=_temp;
				_temp=_temp.firstChild; 
			} 
			_supp.parentNode.insertBefore(_hi,_supp);
			while(_deep.firstChild){
				_supp.appendChild(_deep.firstChild);
			}
			_deep.appendChild(_supp);
			
		};	
		
		var cList=$teiNode.childNodes;
		//test if supplied under overline hi
		for (var i = 0, c, l = cList.length; i < l; i++) {
			c = cList[i];
			if (!c) {
				continue; 
			}
			_moveSuplied(c);
		}
		if(toMerge){
			className = 'abbr_add_overline';
			wceAttr += '&add_overline=overline';
			$newNode.setAttribute('ext', 'inabbr');
			Tei2Html_mergeOtherNodes($teiNode);
			cList = $teiNode.firstChild.childNodes;
		}else if ($teiNode.firstChild && $teiNode.childNodes.length==1 && $teiNode.firstChild.nodeName == 'hi' 
			&& ($teiNode.firstChild.getAttribute("rend") == "overline" 
			|| $teiNode.firstChild.getAttribute("rend") == "ol")) {
				// Check if first child of <abbr> is an overline highlighting (=> nomen sacrum)
			className = 'abbr_add_overline';
			wceAttr += '&add_overline=overline';
			cList = $teiNode.firstChild.childNodes; 
		}/* else {
			cList = $teiNode.childNodes;
			startlist = 1;
		}*/

		$newNode.setAttribute('class', className);

		wceAttr += getWceAttributeByTei($teiNode, mapping);
		$newNode.setAttribute('wce', wceAttr);
		
		var $tempParent = $newDoc.createElement('t'); 
		for (var i = 0, c, l = cList.length; i < l; i++) {
			c = cList[i];
			if (!c) {
				break; 
			}
			if (c.nodeType == 3)
				nodeAddText($tempParent, c.nodeValue);
			else
				readAllChildrenOfTeiNode($tempParent, c);
		}
 
		if ($tempParent) {
			while($tempParent.firstChild){
			  $newNode.appendChild($tempParent.firstChild);
			}
		} 
		
		addFormatElement($newNode);
		//28.10.2013 YG
		if(className=='abbr_add_overline'){
			$teiNode=$teiNode.firstChild;
		}
		$newNode.setAttribute('wce_orig',getOriginalTextByTeiNode($teiNode));
		$htmlParent.appendChild($newNode);
		return null;
	};

	/*
	 * <space>
	 */
	var Tei2Html_space = function($htmlParent, $teiNode) {

		var $newNode = $newDoc.createElement('span');
		$newNode.setAttribute('class', 'spaces');
		// set span attribute wce
		var wceAttr = '__t=spaces&__n=';
		var mapping = {
			'unit' : {
				'0' : '@char@line',
				'1' : '&sp_unit_other=&sp_unit=',
				'2' : '&sp_unit=other&sp_unit_other='
			},
			'extent' : '&sp_extent='
		};
		wceAttr += getWceAttributeByTei($teiNode, mapping);
		$newNode.setAttribute('wce', wceAttr);
		nodeAddText($newNode, 'sp');
		addFormatElement($newNode);
		$htmlParent.appendChild($newNode);

		return null;
	};

	/*
	 * <lb>
	 */
	var Tei2Html_break = function($htmlParent, $teiNode, type) {
		//
		// <span class="mceNonEditable brea" wce="__t=brea&amp;__n=&amp;break_type=lb&amp;number=2&amp;pb_type=&amp;fibre_type=&amp;running_title=&amp;lb_alignment=&amp;insert=Insert&amp;cancel=Cancel"> - <br /> </span>
		//
		var $newNode = $newDoc.createElement('span');
		var cl = 0;
		var paratexttype;
		var $temp;
		
		while ($teiNode && $teiNode.nodeName == 'lb' && $teiNode.nextSibling && $teiNode.nextSibling.nodeName == 'note' && ($teiNode.nextSibling.getAttribute('type') == 'lectionary-other'
			|| $teiNode.nextSibling.getAttribute('type') == 'commentary')) { // ignore <lb/> added for untranscribed text
			cl++; //step counter
			paratexttype = $teiNode.nextSibling.getAttribute('type'); // remember latest type for correct value below
			$temp = ($teiNode.nextSibling.nextSibling) ? $teiNode.nextSibling.nextSibling : null;
			$teiNode.parentNode.removeChild($teiNode.nextSibling);
			$teiNode.parentNode.removeChild($teiNode);
			$teiNode = $temp;
		}
		if (cl > 0) {
			if ($teiNode) { //if note is last element do nothing
				$teiNode.parentNode.insertBefore($teiNode.cloneNode(true), $teiNode.nextSibling); // add latest teiNode to the tree
			}
			$newNode.setAttribute('class', 'paratext');
			
			var wceAttr = '__t=paratext&__n=&fw_type=' + paratexttype + '&covered=' + cl + '&text=&number=&edit_number=on&paratext_position=pagetop&paratext_position_other=&paratext_alignment=left';
			$newNode.setAttribute('wce', wceAttr);
			for (var i = 0; i < cl; i++) {
				$newNode.appendChild($newDoc.createElement('br'));
				nodeAddText($newNode, '\u21b5[');
				$span = $newDoc.createElement('span');
				$span.setAttribute('class', paratexttype);
				$span.setAttribute('wce', '__t=paratext&__n=&fw_type=' + paratexttype + '&covered=' + cl);
				if (paratexttype == "commentary")
					nodeAddText($span, 'comm');
				else
					nodeAddText($span, 'lect');
				$newNode.appendChild($span);
				nodeAddText($newNode, ']');
			}
			addFormatElement($newNode);
			$htmlParent.appendChild($newNode);

			if ($teiNode && $teiNode.nodeName === 'w') { // add space only if new word follows
				nodeAddText($htmlParent, ' ');
			}
			return null;
		}
			
		$newNode.setAttribute('class', 'mceNonEditable brea');
		var _id = $teiNode.getAttribute('id');
		if (_id) {
			$newNode.setAttribute('id', _id);
		}
		
		// For all types of breaks
		var wceAttr = '__t=brea&__n=&break_type=' + type + '';
		
		switch (type) {
			case 'pb':
				// page break
				//pb n="2rx" type="folio" facs="edfwe" xml:id="P2rx-0" break="no"/><fw type="runTitle"
				var number = $teiNode.getAttribute('n');
				var n = '';
				if (number) {
					n = number.substring(1,number.lastIndexOf("-"));
					number = removeArrows(number); // Replace arrows for fibre type by "x" and "y" resp. => use for "xml:id"
					number = number.substring(1,number.lastIndexOf("-"));
				} else
					number = '';
				var page_type = $teiNode.getAttribute('type');
				if (page_type) {
					if (page_type == "page") {
						if (number.match("[0-9]$")) {// ends with a digit => no fibre type
							wceAttr += '&number=' + number + '&rv=' + '&fibre_type=';
						} else {
							wceAttr += '&number=' + number.substring(0, number.length - 1) + '&rv=' + '&fibre_type=' + number.substring(number.length - 1);
						}
					} else { //folio
						if (number.match("[rv]$")) {// ends with r|v => no fibre type
							wceAttr += '&number=' + number.substring(0, number.length - 1) + '&rv=' + number.substring(number.length - 1) + '&fibre_type=';
						} else {
							wceAttr += '&number=' + number.substring(0, number.length - 2) + '&rv=' + number.substring(number.length - 2, number.length - 1) + '&fibre_type=' + number.substring(number.length - 1);
						}
					}
				}
				wceAttr += '&facs=';
				if ($teiNode.getAttribute('facs'))
					wceAttr += $teiNode.getAttribute('facs');
				wceAttr += '&lb_alignment=';
				break;
			case 'cb':
				wceAttr += '&number=';
				var n = '';
				if ($teiNode.getAttribute('n')) {
					var ntemp = $teiNode.getAttribute('n');
					var start = ntemp.lastIndexOf("C");
					var end = ntemp.lastIndexOf("-");
					if (end-start > 1)
						n = parseInt($teiNode.getAttribute('n').substring(start+1,end));
				}
				wceAttr += n;
				g_columnNumber = n;
				wceAttr += '&lb_alignment=';
				if ($teiNode.getAttribute('rend'))
					wceAttr += $teiNode.getAttribute('rend');
				wceAttr += '&rv=&fibre_type=&facs=';
				break;
			case 'lb':
				wceAttr += '&number=';
				var n = '';
				if ($teiNode.getAttribute('n')) {
					var ntemp = $teiNode.getAttribute('n');
					var start = ntemp.lastIndexOf("L");
					var end = ntemp.lastIndexOf("-");
					if (end-start > 1)
						n = parseInt($teiNode.getAttribute('n').substring(start+1,end));
				}
				wceAttr += n;
				g_lineNumber = n;
				wceAttr += '&lb_alignment=';
				if ($teiNode.getAttribute('rend'))
					wceAttr += $teiNode.getAttribute('rend');
				wceAttr += '&rv=&fibre_type=&facs=';
				break;
			case 'gb':
				wceAttr += '&number=';
				var n = '';
				if ($teiNode.getAttribute('n')) {
					n = parseInt($teiNode.getAttribute('n'));
				}
				wceAttr += n;
				g_quireNumber = n;
				wceAttr += '&lb_alignment=';
				if ($teiNode.getAttribute('rend'))
					wceAttr += $teiNode.getAttribute('rend');
				wceAttr += '&rv=&fibre_type=&facs=';
				break;
		}

		var hasBreak = false;
		var breakValue = $teiNode.getAttribute('break');
		if (breakValue && breakValue == 'no') {// attribute break="no" exists
			wceAttr += '&hasBreak=yes';
			hasBreak = true;
			nodeAddText($newNode, '\u002D');
		} else {
			wceAttr += '&hasBreak=no';
		}

		$newNode.setAttribute('wce', wceAttr);
		
		switch (type) {
			case 'qb':
				var $br = $newDoc.createElement('br');
				$newNode.appendChild($br);
				nodeAddText($newNode, 'QB');
				break;
			case 'pb':
				// page break
				var $br = $newDoc.createElement('br');
				$newNode.appendChild($br);
				nodeAddText($newNode, 'PB' + ' ' + n);
				break;
			case 'cb':
				// column break
				var $br = $newDoc.createElement('br');
				$newNode.appendChild($br);
				nodeAddText($newNode, 'CB' + ' ' + n);
				break;
			case 'lb':
				// line break
				var $br = $newDoc.createElement('br');
				$newNode.appendChild($br);
				if ($teiNode.getAttribute("rend") && $teiNode.getAttribute("rend") === "indent")
					nodeAddText($newNode, '\u21B5\u2192' + ' ' + n);
				else if ($teiNode.getAttribute("rend") && $teiNode.getAttribute("rend") === "hang")
					nodeAddText($newNode, '\u21B5\u2190' + ' ' + n);
				else
					nodeAddText($newNode, '\u21B5' + ' ' + n);

				//
				//test, if the textnode after lb hat a space, if not, add a space 
				if (!hasBreak) {
					//test previous pb/qb/cb;
					var pre=$teiNode.previousSibling;
					while (pre) {
						if (pre.nodeType!=3) {
							if (pre.getAttribute('break') && pre.getAttribute('break') == 'no') {
							hasBreak=true;
							break;
							}
						}
						pre=pre.previousSibling;
					}
					if (!hasBreak) {
						var $nextNode = $teiNode.nextSibling;
						if ($nextNode && $nextNode.nodeType == 3) {
							var nextText = $nextNode.nodeValue;
							if (nextText && !startHasSpace(nextText)) {
								$nextNode.nodeValue = ' ' + nextText;
							}
						}
					}
				}
				break;
		}
		addFormatElement($newNode);
		$htmlParent.appendChild($newNode);

		if ($teiNode.nextSibling && $teiNode.nextSibling.nodeName === 'w') {
			// add space only if new word follows
			nodeAddText($htmlParent, ' ');
		}
		return null;
	};

	/*
	 * <com> / <fw> / <num
	 */
	var Tei2Html_paratext = function($htmlParent, $teiNode, teiNodeName) {
		// <comm type="commentary" place="pagetop" rend="left">ddd</comm>

		var $newNode = $newDoc.createElement('span');
		$newNode.setAttribute('class', 'paratext');

		var wceAttr = '__t=paratext&__n='; //marginals_text is content of editor in editor, 	 
		var cs = $teiNode.childNodes;
		var marginals_text="";
		for (var i = 0, c, l = cs.length; i < l; i++) {
			c = cs[i];
			if(!c){
				break;
			}
			
			//var $tempParent = $newDoc.createElement('t');
			var $tempParent = $newDoc.createDocumentFragment();
			// <t>...</t> 
			readAllChildrenOfTeiNode($tempParent, c); 
			var tempText= xml2String($tempParent);// at tei element "<app>" too
			if (tempText && tempText.length > 0) {
				//tempText = tempText.substr(3, tempText.length - 7);
				marginals_text+=tempText;
			}
			
		}
		wceAttr += '&marginals_text=' + encodeURIComponent(marginals_text);

		if ($teiNode.nodeName == 'seg') {
			var mapping = {
				'n' : '&number=',
				'rend' : '&paratext_alignment='
			};
			
			wceAttr += getWceAttributeByTei($teiNode, mapping) + '&fw_type=isolated&fw_type_other=';
			var $next = $teiNode;
		} else {
			var mapping = {
				'n' : '&number=',
				'rend' : '&paratext_alignment=',
				'type' : {
					'0' : '@commentary@ews@runTitle@chapNum@chapTitle@lectTitle@lectionary-other@colophon@quireSig@AmmSec@EusCan@euthaliana@gloss@stichoi@pageNum@andrew@orn',
					'1' : '&fw_type=',
					'2' : '&fw_type=other&fw_type_other='
				}
			};
			
			wceAttr += getWceAttributeByTei($teiNode, mapping);

			var $next = $teiNode.parentNode;
		}
		
		if ($next != null && $next.nodeName == 'seg') {// seg element as parent node (has to be that way, testing anyway); as well used for isolated marginals
			wceAttr += '&paratext_position=';
			if ($next.getAttribute('type') === 'margin' || $next.getAttribute('type') === 'line')//standard values
				wceAttr += $next.getAttribute('subtype') + '&paratext_position_other=';
			else // type="other"
				wceAttr += 'other&paratext_position_other=' + $next.getAttribute('subtype');
		} else {
			wceAttr += '&paratext_position=&paratext_position_other=';
		}
		$newNode.setAttribute('wce', wceAttr);
		nodeAddText($newNode, teiNodeName);

		addFormatElement($newNode);
		$htmlParent.appendChild($newNode);
		return null;
	};

	/*
	 * <note>
	 */
	var Tei2Html_note = function($htmlParent, $teiNode) {
		// <note type="$ note_type" n="$newHand" xml:id="_TODO_" > $note_text </note>

		var $newNode = $newDoc.createElement('span');

		if ($teiNode.getAttribute('type') === 'commentary') {// commentary text without <lb/> => old document (compatibility mode) or no covered lines
			$newNode.setAttribute('class', 'paratext');
			var cl = ($teiNode.getAttribute('rend')) ? $teiNode.getAttribute('rend') : 0; //if new document, but no covered lines set cl=0
			
			var wceAttr = '__t=paratext&__n=&fw_type=commentary&covered=' + cl + '&text=&number=&edit_number=on&paratext_position=pagetop&paratext_position_other=&paratext_alignment=left';
			$newNode.setAttribute('wce', wceAttr);
			if (cl > 0) {
				for (var i = 0; i < cl; i++) {
					$newNode.appendChild($newDoc.createElement('br'));
					nodeAddText($newNode, '\u21b5[');
					$span = $newDoc.createElement('span');
					$span.setAttribute('class', 'commentary');
					$span.setAttribute('wce', '__t=paratext&__n=&fw_type=commentary&covered=' + cl);
					nodeAddText($span, 'comm');
					$newNode.appendChild($span);
					nodeAddText($newNode, ']');
				}
			} else {
				nodeAddText($newNode, '[');
				$span = $newDoc.createElement('span');
				$span.setAttribute('class', 'commentary');
				$span.setAttribute('wce', '__t=paratext&__n=&fw_type=commentary&covered=0');
				nodeAddText($span, 'comm');
				$newNode.appendChild($span);
				nodeAddText($newNode, ']');
			}
		} else if ($teiNode.getAttribute('type') === 'lectionary-other') {// other lections without <lb/> => old document, compatibility mode
			$newNode.setAttribute('class', 'paratext');
			var cl = ($teiNode.getAttribute('rend')) ? $teiNode.getAttribute('rend') : 1;
			
			/*var cl = 0;
			//default value for old documents
			if ($teiNode.getAttribute('rend'))
				cl = $teiNode.getAttribute('rend');
			if (cl == 0)
				cl = '';*/
				
			var wceAttr = '__t=paratext&__n=&fw_type=lectionary-other&covered=' + cl + '&text=&number=&edit_number=on&paratext_position=pagetop&paratext_position_other=&paratext_alignment=left';
			$newNode.setAttribute('wce', wceAttr);
			//if (cl != '') {
				for (var i = 0; i < cl; i++) {
					$newNode.appendChild($newDoc.createElement('br'));
					nodeAddText($newNode, '\u21b5[');
					$span = $newDoc.createElement('span');
					$span.setAttribute('class', 'lectionary-other');
					$span.setAttribute('wce', '__t=paratext&__n=&fw_type=lectionary-other&covered=' + cl);
					nodeAddText($span, 'lect');
					$newNode.appendChild($span);
					nodeAddText($newNode, ']');
				}
			/*} else {
				nodeAddText($newNode, '[');
				$span = $newDoc.createElement('span');
				$span.setAttribute('class', 'lectionary-other');
				$span.setAttribute('wce', '__t=paratext&__n=&fw_type=lectionary-other&covered=');
				nodeAddText($span, 'lect');
				$newNode.appendChild($span);
				nodeAddText($newNode, ']');
			}*/
		} else if ($teiNode.getAttribute('subtype') === 'ews') {
			$newNode.setAttribute('class', 'paratext');
			var wceAttr = '__t=paratext&__n=&marginals_text=' + getDomNodeText($teiNode) + '&fw_type=ews&covered=&text=&number=&edit_number=on&paratext_position=pagetop&paratext_position_other=&paratext_alignment=left';
			$newNode.setAttribute('wce', wceAttr);
			nodeAddText($newNode, '[');
			$span = $newDoc.createElement('span');
			$span.setAttribute('class', 'ews');
			nodeAddText($span, 'ews');
			$newNode.appendChild($span);
			nodeAddText($newNode, ']');
			$teiNode.parentNode.removeChild($teiNode.nextSibling);
		} else {
			$newNode.setAttribute('class', 'note');

			var wceAttr = '__t=note&__n=&note_text=' + encodeURIComponent(getDomNodeText($teiNode)) + '';
			if ($teiNode.firstChild && $teiNode.firstChild.nodeName === 'handshift') {// child node <handshift/> => note_type=changeOfHand
				wceAttr += '&note_type=changeOfHand&note_type_other=';
				if ($teiNode.firstChild.getAttribute('scribe')) //scribe is optional
					wceAttr += '&newHand=' + encodeURIComponent($teiNode.firstChild.getAttribute('scribe'));
				else if ($teiNode.firstChild.getAttribute('n')) // for compatibility
					wceAttr += '&newHand=' + encodeURIComponent($teiNode.firstChild.getAttribute('n'));
				else // write empty entry
					wceAttr += '&newHand=';
			} else {
				var mapping = {
					'xml:id' : null,
					'type' : {
						'0' : '@editorial@local@canonRef',
						'1' : '&note_type=',
						'2' : '&note_type=other&note_type_other='
					}
				};
				wceAttr += getWceAttributeByTei($teiNode, mapping) + '&newhand=';
			}
			$newNode.setAttribute('wce', wceAttr);
			nodeAddText($newNode, 'Note');
		}
		addFormatElement($newNode);
		$htmlParent.appendChild($newNode);
		// Do not add a space if there is a break after the note
		if ($teiNode.nextSibling && $teiNode.nextSibling.nodeName !== 'lb' && $teiNode.nextSibling.nodeName !== 'cb' 
			&& $teiNode.nextSibling.nodeName !== 'pb' && $teiNode.nextSibling.nodeName !== 'gb')
			nodeAddText($htmlParent, ' ');
		return null;
	};
	
	var getOriginalTextByTeiNode = function($node){ 
		var origText = '';
		var origNode = $newDoc.createElement('t');
		var list=$node.childNodes;
		for (var i = 0, cl, l = list.length; i < l; i++) {
			cl=list[i];
			if(!cl){
				break;
			}
			readAllChildrenOfTeiNode(origNode, cl); 
		}
		
		//remove textNode with space ' '. It come from function readAllChildrenOfTeiNode::nodeAddText($htmlParent, ' ');
		var oLast=origNode.lastChild;
		if(oLast && oLast.nodeType==3 && oLast.nodeValue==' '){
			origNode.removeChild(oLast);
		}
		var _oText=xml2String(origNode);
		if(_oText && _oText.length>6){
			_oText=_oText.substring(3,_oText.length-4); 
			origText += _oText;
		}		 
		origText = origText.trim();
		origText = encodeURIComponent(origText);
		return origText;
	};

	/*
	 * <app>
	 */
	var Tei2Html_app = function($htmlParent, $teiNode) {
		// <span class="corr" wce_orig="..."
		var $newNode = $newDoc.createElement('span');
		//$newNode.setAttribute('class', 'corr');

		// <rdg type="orig" hand="firsthand" />
		// <rdg type="corr" hand="corrector1">
		var rdgs = $teiNode.childNodes;
		var $rdg, typeValue, handValue, deletionValue, partialValue, firsthandPartialValue;
		var wceAttr = '';
		var origText = '';
		var rdgAttr;
		var $origRdg = $newDoc.createElement('t');
		var utvf = '';
		var utv = '';

		var collection = rdgs[0].childNodes; 
		for (var i = 0, cl, l = collection.length; i < l; i++) {
			cl=collection[i];
			if(!cl){
				break;
			}
			readAllChildrenOfTeiNode($origRdg, collection[i]); 
		}
		
		//remove textNode with space ' '. It come from function readAllChildrenOfTeiNode::nodeAddText($htmlParent, ' ');
		var oLast=$origRdg.lastChild;
		if(oLast && oLast.nodeType==3 && oLast.nodeValue==' '){
			$origRdg.removeChild(oLast);
		}
		var _oText=xml2String($origRdg);
		if(_oText && _oText.length>6){
			_oText=_oText.substring(3,_oText.length-4); 
			origText += _oText;
		}		 
		origText = origText.trim();

		if (origText === '')
			origText = 'OMISSION';
		if (origText === 'OMISSION') //blank first hand
			$newNode.setAttribute('class', 'corr_blank_firsthand');
		else {
			$newNode.setAttribute('class', 'corr');
			$newNode.setAttribute('wce_orig', encodeURIComponent(origText));
		}
		
		if (rdgs[0].getAttribute('hand') == 'firsthandV') {
			utvf = '&ut_videtur_firsthand=on';
		}
		
		origText = decodeURIComponent(origText);

		for (var i = 1, l = rdgs.length; i < l; i++) {// [0] is always original => no extra output
			utv = '';
			$rdg = rdgs[i];
			if(!$rdg || $rdg.nodeType==3){
				break;
			}
			typeValue = $rdg.getAttribute('type');
			if (!typeValue) typeValue = '';
			handValue = $rdg.getAttribute('hand');
			if (!handValue) handValue = '';
			deletionValue = $rdg.getAttribute('rend');
			if ($rdg.getAttribute('part'))
				partialValue = $rdg.getAttribute('part');
			else
				partialValue = '';

			if (i == 1) {
				wceAttr += '__t=corr';
				firsthandPartialValue = partialValue;
			} else
				wceAttr += '@__t=corr';

			//Test whether handValue ends with "V" -> ut videtur	
			if (handValue.charAt(handValue.length-1) == 'V') {
				handValue = handValue.substring(0,handValue.length-1);
				utv = '&ut_videtur_corr=on';
			}
			if ('@corrector@firsthand@corrector1@corrector2@corrector3'.indexOf(handValue) > -1) {
				wceAttr += '&__n=' + handValue + utvf + '&corrector_name_other=&corrector_name=' + handValue + utv;
			} else {//other corrector
				wceAttr += '&__n=' + handValue + utvf + '&corrector_name=other&corrector_name_other=' + handValue + utv;
			}

			wceAttr += '&reading=' + typeValue;
			if (origText != 'OMISSION')
				wceAttr += '&original_firsthand_reading=' + encodeURIComponent(origText);
			else
				wceAttr += '&original_firsthand_reading=&blank_firsthand=on';

			wceAttr += '&common_firsthand_partial=';
			if (deletionValue) {
				// deletion="underline%2Cunderdot%2Cstrikethrough"
				// &deletion_erased=0
				// &deletion_underline=1
				// &deletion_underdot=1
				// &deletion_strikethrough=1
				// &deletion_vertical_line=0
				// &deletion_other=0
				var deletionstr = '';
				var deletionArr = new Array('erased', 'underline', 'underdot', 'strikethrough', 'vertical_line', 'other');
				for (var d = 0; d < deletionArr.length; d++) {
					var deletionItem = deletionArr[d];
					if (deletionValue.indexOf(deletionItem) > -1) {
						wceAttr += '&deletion_' + deletionItem + '=1';
						deletionstr += ',' + deletionItem;
					} else {
						wceAttr += '&deletion_' + deletionItem + '=0';
					}
				}
				wceAttr += '&deletion=' + encodeURIComponent(deletionstr.substring(1));
				// to get rid of very first ","
			} else {// no deletion given
				wceAttr += '&deletion_erased=0&deletion_underline=0&deletion_underdot=0&deletion_strikethrough=0&deletion_vertical_line=0&deletion_other=0&deletion=null';
			}
			wceAttr += '&firsthand_partial=' + firsthandPartialValue + '&partial=' + partialValue;

			// &correction_text Contain:
			// <note>nnn</note><w n="2">aaa</w><w n="3"> c<hi rend="gold">a</hi> b<hi rend="green">c</hi></w><w n="4">bbb</w>
			var $tempParent = $newDoc.createDocumentFragment();
			// <t>...</t>
			readAllChildrenOfTeiNode($tempParent, $rdg); 
			var corrector_text = xml2String($tempParent);
			
			if (corrector_text && corrector_text.length > 0) {
				//corrector_text = corrector_text.substr(3, corrector_text.length - 7);
				if (corrector_text == 'OMISSION') { //Total deletion
					wceAttr += '&corrector_text=&blank_correction=on';
				} else
					wceAttr += '&corrector_text=' + encodeURIComponent(corrector_text);
			} else { //Omission
				corrector_text = 'OMISSION';
				wceAttr += '&corrector_text=&blank_correction=on';
			}

			wceAttr += '&place_corr=';
			var $test = $rdg.firstChild;
			if ($test != null && $test.nodeName == 'seg') {//seg element ahead -> place of correction
				if ($test.getAttribute('type') == 'line') {
					wceAttr += $test.getAttribute('subtype');
					//overwritten, above, below
				} else if ($test.getAttribute('type') == 'margin') {
					wceAttr += $test.getAttribute('subtype');
					//pagetop, pagebottom, pageleft, pageright, coltop, colbottom, colleft, colright, lineleft, lineright
				} else {//type="other"
					wceAttr += 'other&place_corr_other=' + encodeURIComponent($test.getAttribute('subtype'));
				}
				$rdg.removeChild($test);
				//remove this child from the list
			}
		}

		if (origText != '') {
			if (origText === 'OMISSION')
				nodeAddText($newNode, "T");
			else {  
			 	while($origRdg.hasChildNodes()){
				 $newNode.appendChild($origRdg.firstChild);
			 	}
			}
		}

		if (wceAttr != '') {
			$newNode.setAttribute('wce', wceAttr);
		}

		addFormatElement($newNode);
		$htmlParent.appendChild($newNode);
		if ($teiNode.nextSibling && ($teiNode.nextSibling.nodeName === 'w' || $teiNode.nextSibling.nodeName === 'app')) {
			nodeAddText($htmlParent, ' ');
			// add space only if new word or new apparatus follows
		}
		return null;
	};
	
	return {
		'htmlString' : getHtmlString(),
		'teiIndexData' : teiIndexData//TODO if we need it 
	};
}

/**
 * ************************************************************************ ************************************************************************ ************************************************************************
 * ************************************************************************ ************************************************************************ ************************************************************************
 * ************************************************************************ ************************************************************************ ************************************************************************
 */

// getTEIXml
function getTeiByHtml(inputString, args) {

	if (!inputString || $.trim(inputString) == '') {
		return '';
	}

	if (!args) {
		return '';
	}

	// arguments:
	// g_bookNumber, g_pageNumber, g_chapterNumber, g_verseNumber, g_wordNumber, g_columnNumber, g_witValue,
	//TODO: Check, if those values really have to be stored in an array. Aren't they just coming from the export routine directly (except for book, witness and manuscript language)
	var g_bookNumber = '';
	var g_witValue = args.witness;
	var g_manuscriptLang = args.manuscriptLang;
		
	/*if(g_bookNumber && (g_bookNumber instanceof Function || typeof g_bookNumber == "function" || typeof g_bookNumber == "Function")){
		g_bookNumber=g_bookNumber();
	}*/
	if(g_witValue && (g_witValue instanceof Function || typeof g_witValue == "function" || typeof g_witValue == "Function")){
		g_witValue=g_witValue();
	}
	if(g_manuscriptLang && (g_manuscriptLang instanceof Function || typeof g_manuscriptLang == "function" || typeof g_manuscriptLang == "Function")){
		g_manuscriptLang=g_manuscriptLang();
	}
	
	var g_quireNumber = '';
	var g_pageNumber = '';
	var g_pageNumber_id = '';
	var g_columnNumber = '';
	var g_chapterNumber = '';
	var g_verseNumber = '';
	var g_lineNumber = '';
	//var g_wordNumber = '';

	// node for TEI
	var g_lectionNode;
	var g_bookNode;
	var g_chapterNode;
	var g_verseNode; 

	var old_chapterNumber = 0;

	var gIndex_s = 0;

	//var startCompressionWord = false;

	var $newDoc;
	var $newRoot;
	var g_currentParentNode;

	//var found_ab = false;
	//var final_w_found = false;
	var final_w_set = false;

	var nodec = 0;
	
	var w_start='{@@{';
	var w_end='}@@}';
	var w_start_s='{@@@{';
	var w_end_s='}@@@}';
	
	var isSeg = false;
	var note = 1;
	
	var idSet = new Set();
	
	//var global_id=0; //only for test
	/*
	 * Main Method <br /> return String of TEI-Format XML
	 *
	 */
	var getTeiString = function() {
		inputString = inputString.replace(/>\s+</g, '> <');//after initHtmlContent get <w before="1" after="1" />
		inputString = '<TEI>' + inputString + '</TEI>';

		var $oldDoc = loadXMLString(inputString);

		var $oldRoot = $oldDoc.documentElement; 
		$oldRoot=initHtmlContent($oldRoot);
		
		$newDoc = loadXMLString('<TEI></TEI>'); 
		// <TEMP>
		$newRoot = $newDoc.documentElement;

		if (!g_currentParentNode) {
			g_currentParentNode = $newRoot;
		}
	 
		//get tei node from htmlNode
		var childList = $oldRoot.childNodes;
		for (var i = 0, $c, l = childList.length; i < l; i++) {
			$c = childList[i];
			if (!$c) {
				continue;
			} else {
				readAllHtmlNodes(g_currentParentNode, $c, false);
			}
		}
 
	 	html2Tei_mergeNodes($newRoot, true); 	 
	 	html2Tei_removeBlankW_addAttributePartI($newRoot);
		
		// DOM to String
		var str = xml2String($newRoot);
		if (!str)
			return '';

		//
		// add an required header to get a valid XML
		str = str.replace('<TEI>', '<?xml  version="1.0" encoding="utf-8"?><!DOCTYPE TEI [<!ENTITY om ""><!ENTITY lac ""><!ENTITY lacorom "">]><?xml-model href="TEI-NTMSS.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?><TEI xmlns="http://www.tei-c.org/ns/1.0"><teiHeader><fileDesc><titleStmt><title/></titleStmt><publicationStmt><publisher/></publicationStmt><sourceDesc><msDesc><msIdentifier></msIdentifier></msDesc></sourceDesc></fileDesc></teiHeader><text><body>');
		if (g_manuscriptLang && g_manuscriptLang != '')// set manuscript language if there are information
			str = str.replace("<text>", '<text xml:lang="' + g_manuscriptLang + '">');
		str = str.replace("</TEI>", "</body></text></TEI>");
		str = str.replace(/OMISSION/g, "");
		return str;
	};
	
	//remove elements format_start /format_end
	//add <w> for each textNode
	var initHtmlContent = function($node){
		removeFormatNode($node);
		//add <w> for each textNode
	 	$node=addWElement2Html($node); 
	 	return $node;
	};
	
	/*
	 * test if previousSibling pb/cb/lb with break="no" is,
	 */
	var html2Tei_addAttributePartF = function($htmlNode){
		if(!$htmlNode){
			return;
		}
		var firstNextW;
		var _first=$htmlNode.nextSibling;
		while(_first){
		  if(_first.nodeType==3){
		  	break;
		  } 
		  if(_first.nodeName=='w'){
		  	if(!_first.firstChild){
		  		//<w> from a space, without nodeText
		  		//<w before="1" after="1"/>
		  		_first=_first.nextSibling;
		  		continue;
		  	}
		  	firstNextW=_first;
		  	break;
		  }
		  _first=_first.firstChild;
		}
		
		if(!firstNextW){
			return;
		}
		
		var preChild=$htmlNode.previousSibling;
		var wceAttr;
		var isBreak=false;
		while(preChild){
			if((preChild.nodeName=='w' && !preChild.firstChild)){
				preChild=preChild.previousSibling;
				continue;
			}
			
			if ($(preChild).hasClass('chapter_number') || $(preChild).hasClass('verse_number') || $(preChild).hasClass('book_number')) {
				preChild=preChild.previousSibling;
				continue;
			}
			if ($(preChild).hasClass('brea')) {
				wceAttr = preChild.getAttribute('wce');
				if (wceAttr.match(/hasBreak=yes/) && wceAttr.match(/break_type=pb/)) {//only page break with hasBreak=yes
					isBreak=true;
					break;
				}
				preChild=preChild.previousSibling;
				continue;
			} else {
				break;
			}
		}
		if (isBreak){ 
			$htmlNode.setAttribute('part', 'auto_F');
		}
	};
	
	var html2Tei_mergeNodes = function($teiNode, removeAttr) {
		if (!$teiNode || ($teiNode.nodeType != 1 && $teiNode.nodeType != 11)) { //nodeType==11: createDocumentFragment
			return;	
		}
	 	
	 	var tNext=$teiNode.firstChild;
	 	/*if (tNext && tNext.nodeName == 'gap' && tNext.getAttribute("unit") != "word"
			&& $teiNode.childNodes.length == 1) // special case for isolated gaps. The word marker is removed
			$teiNode.parentNode.replaceChild(tNext, $teiNode);
		*/		
		while (tNext) {
			html2Tei_mergeNodes(tNext, removeAttr);
	 		tNext=tNext.nextSibling;
	 	}	 
	 	/*24.10.2013 same as above
		var childList = $teiNode.childNodes;
		for (var i = 0, l = childList.length, c; i < l; i++) {
			c = childList[i];
			if (!c) {
				continue;
			} else {
				html2Tei_mergeNodes(c, removeAttr);
			} 
		}*/  
		html2Tei_mergeWNode($teiNode, removeAttr);
	};
	
	var html2Tei_mergeWNode = function ($w, removeAttr){
		if (!$w || $w.nodeName != 'w') {
			return;
		}
		
		var toAppend = new Array(); 
		if ($w.getAttribute('after') == '0') {//$w is start
			var ns = $w.nextSibling;
			var lastChildOfW = $w.lastChild;
			var isNextBreak=false;
			while (ns) {
				if (ns.nodeName == 'w') {
					if (ns.getAttribute('before') == '1' ||  ns.getAttribute('after') == '1' || ns === ns.parentNode.lastChild) {
						if(ns.getAttribute('before') == '0'){
							toAppend.push(ns);
						}
						break;
					}
				}
				var _nodeName=ns.nodeName;
				if ((_nodeName == 'pb' || _nodeName == 'cb' || _nodeName == 'lb') && (isNextBreak || ns.getAttribute('break') == 'no')){		
					 if (_nodeName=='lb') {
					 	isNextBreak=false;
					 } 
					 else {
					 	isNextBreak=true;
					 }
				} else if ($.inArray(_nodeName, wceNodeInsideW) < 0) { 
					break;
				}
				toAppend.push(ns);
				ns = ns.nextSibling;
			}
		}
		
		//merge
		for (var i = 0, c, l = toAppend.length; i < l; i++) {
			c = toAppend[i];
			if (c.nodeName == 'w') {
				//move all children of c to w;
				
				while (c.firstChild) {
					$w.appendChild(c.firstChild);
				}
				c.parentNode.removeChild(c);
			} else
				$w.appendChild(c);
		}
		if (removeAttr) {
			removeAllAttribute($w);
		}
	//	if(toAppend.length>0){
			html2Tei_mergeOtherNodes($w); 
	//	}
	};
	
	var html2Tei_mergeOtherNodes = function ($node){
		if(!$node){
			return;
		}
		
		if ($.inArray($node.nodeName,wceNodeInsideW)<0) {	
			return;
		}
		
		var curr=$node.firstChild; 
		var next;
		var toAppend=new Array();
		var startNode; 
		while (curr) {
			var tempspace = null;
			next = curr.nextSibling; 
			if (compareNodes(curr, next)) {
				if (!startNode) {
					startNode=curr;
				} 
				toAppend.push(next); 
			} else if (startNode) {//merge which we have
				html2Tei_addNodeArrayToNode(startNode, toAppend);			
				startNode=null;
				toAppend=new Array();	
			}
			curr = next;
		}
		if (startNode) {
			html2Tei_addNodeArrayToNode(startNode,toAppend);	
			/*for(var i=0, a, l=toAppend.length; i<l; i++){
				a=toAppend[i];
				while(a.firstChild){
					startNode.appendChild(a.firstChild);
				}
				a.parentNode.removeChild(a);				 
			}
			html2Tei_mergeOtherNodes(startNode); */
		}
	};
	
	var html2Tei_addNodeArrayToNode = function(startNode, toAppend){
		for(var i=0, a, l=toAppend.length; i<l; i++){
				a=toAppend[i];
				while(a.firstChild){
					startNode.appendChild(a.firstChild);
				}
				a.parentNode.removeChild(a); 
		}
		html2Tei_mergeOtherNodes(startNode); 
	};
		
	var removeAllAttribute = function($wn){
		 var as=$wn.attributes; 
		 var a;
		 var names=new Array();
		 for (var i=0, l=as.length; i<l; i++) {
		 	a=as[i];
		 	if(a && a.nodeName!='part'){
		 		names.push(a.nodeName);
		 	}		 		 
		 }
		 for (var x=0, y=names.length; x<y; x++) {
		 	$wn.removeAttribute(names[x]);
		 }
	};

	/*
	 *remove elements "format_start" and "format_end"
	 */
	var removeFormatNode = function($r) {
		if ($r.nodeType != 1 && $r.nodeType != 11)
			return;

		if ($($r).hasClass('format_start') || $($r).hasClass('format_end')) {
			$r.parentNode.removeChild($r);
			return;
		}

		var tempList=$r.childNodes; 
		var childList = new Array();
		 
		for (var x=0, y=tempList.length; x<y; x++) {
			childList.push(tempList[x]);
		} 		
		for (var i = 0, l = childList.length, $c; i < l; i++) {
			$c = childList[i];
			if (!$c) {
				continue;
			} else {
				removeFormatNode($c);
			}
		}
	};
	
	/*
	 *remove blank <w/>  and set Attribute Part
	 */
	var html2Tei_removeBlankW_addAttributePartI = function($r) {
		if ($r.nodeType != 1 && $r.nodeType != 11)
			return;

		var nName = $r.nodeName; 
		if (nName=='w' && !$r.firstChild) {
			$r.parentNode.removeChild($r);
			return;
		}

		var tempList=$r.childNodes; 
		var childList = new Array();
		 
		for(var x=0, y=tempList.length; x<y; x++){
			childList.push(tempList[x]);
		} 		
		for (var i = 0, l = childList.length, $c; i < l; i++) {
			$c = childList[i];
			if (!$c) {
				continue;
			} else {
				html2Tei_removeBlankW_addAttributePartI($c);
			}
		}
		
		
		if (nName=='ab') {
			var firstW, lastW, lastLB;

			var part = $r.getAttribute('part');//
			if (part) {
				//get first <W>
				var _first = $r.firstChild;
				while (_first && _first.nodeType != 3) {
					if (_first.nodeName == 'w') {
						firstW=_first;					
						break;
					} else {
						_first = _first.firstChild;
					}
				}
			}
			
			//get last <w>			
			if ($r === $r.parentNode.lastChild || (part && part == 'I')){ //if it is last <ab>
				var _last=$r.lastChild;
				while(_last){
					if (_last.nodeType==3) {
						break;
					}
					
					if (_last.nodeName == 'w') {
						lastW=_last;
					} else if (_last.nodeName == 'lb' && _last.getAttribute('break') && _last.getAttribute('break')==='no'){
						lastLB=_last;
						break;
					}
					_last=_last.lastChild;
				}
			} 
			 
			if (!part) {
				if (lastLB && lastW) { //Automatically generate part="I"
					lastW.setAttribute('part', 'I'); 
					$r.setAttribute('part', 'I'); 
					lastLB.parentNode.removeChild(lastLB);////remove last <lb>
				}
				return;
			}
			
			if (part == 'auto_F' && firstW) {//Automatically generated part="F"
				$r.setAttribute('part', 'F');   
				firstW.setAttribute('part', 'F');
				if (lastLB) {
					$r.setAttribute('part', 'M');
					if (lastW===firstW) {
						lastW.setAttribute('part', 'M');
					} else {
						lastW.setAttribute('part', 'I');
					}
					lastLB.parentNode.removeChild(lastLB);////remove last <lb>					
				}				 
			/*} else if (part == 'F' && firstW) { //manually set or from import
				firstW.setAttribute('part', 'F');
			} else if (part == 'I' && lastW) { //manually set or from import
				lastW.setAttribute('part', 'I');
			} else if (part == 'M') { //manually set or from import
				if (firstW && lastW && firstW === lastW) {
					lastW.setAttribute('part', 'M');
				} else if (firstW) {
					firstW.setAttribute('part', 'F'); 
					if(lastW){
						lastW.setAttribute('part', 'I');
						if(lastLB)
							lastLB.parentNode.removeChild(lastLB);////remove last <lb>	
					}
				}
			*/} 		
		}
	};
	
	/*
	 * 
	 */
	var addWMark1 = function($htmlNode){
		if (!$htmlNode){
			return;
		}
		if ($htmlNode.nodeType==3){
			var textValue=$htmlNode.nodeValue;
			
			var addStart,addEnd;
			
			if(textValue){ 
				if(startHasSpace(textValue)){
					addStart=w_start_s;
				}else{
					addStart=w_start;
				}
				if(endHasSpace(textValue)){
					addEnd=w_end_s;
				}else{
					addEnd=w_end;
				}
				textValue=addStart+$.trim(textValue)+addEnd;  
				
				//add into middle
				textValue=textValue.replace(/\s+/g, w_end_s+w_start_s);
				$htmlNode.nodeValue=textValue;
			}
		} else if ($htmlNode.nodeType==1 || $htmlNode.nodeType == 11) {
			var childList = $htmlNode.childNodes;
			for (var i = 0, $c, l = childList.length; i < l; i++) {
				$c = childList[i];
				if (!$c) {
					continue;
				} else {
					 addWMark1($c);
				}
			} 
		} 
	};
	
	var addWMark2 = function($htmlNode){
		if(!$htmlNode){
			return;
		} 
		if ($htmlNode.nodeType==1 || $htmlNode.nodeType==11) {
			//only for test
			//if($htmlNode.nodeName=='w'){
				//$htmlNode.setAttribute('id',global_id++);
			//}
			var childList = $htmlNode.childNodes;
			for (var i = 0, $c, l = childList.length; i < l; i++) {
				$c = childList[i];
				if (!$c) {
					continue;
				} else {
					 addWMark2($c);
				}
			}
			var last=$htmlNode.lastChild;
			if(last && last.nodeName=='x'){
				$htmlNode.removeChild(last);
				$htmlNode.setAttribute('after','1');
			}	
		} 
	};
	
	 
	var addWElement2Html=function($node, str){ 
		var childList = $node.childNodes;
		for (var i = 0, $c, l = childList.length; i < l; i++) {
			$c = childList[i];
			if (!$c) {
				continue;
			} else {
				addWMark1($c);
			}
		}
		str= xml2String($node); 
		str=str.replace(/{@@{/g,'<w before="0" after="0">');//no space before
		str=str.replace(/}@@}/g,'</w>');//no space after
		str=str.replace(/{@@@{/g,'<w before="1" after="0">'); //has space before 
		str=str.replace(/}@@@}/g,'<x>t</x></w>'); //has space after
		 
		var $doc = loadXMLString(str);
		$node=$doc.documentElement; 
		
		childList = $node.childNodes;
		for (var i = 0, $c, l = childList.length; i < l; i++) {
			$c = childList[i];
			if (!$c) {
				continue;
			} else {
				addWMark2($c); 
			}
		}
		return $node;
	};
	
	var readAllHtmlNodes = function($teiParent, $htmlNode){ 
		if (!$htmlNode) {
			return;
		} 
		
		if ($htmlNode.nodeType == 1 || $htmlNode.nodeType == 11){
			if ($htmlNode.nodeName == 'w') { 
				//$htmlNode.setAttribute('id',++global_id);//only for test
				$teiParent.appendChild($htmlNode.cloneNode(true)); 
				return;
			}   
			var arr = getTeiNodeByHtmlNode($teiParent, $htmlNode);  
			if (arr == null || arr[1]) {
				return;
			} 
			var newParent=arr[0];
			
			var childList = $htmlNode.childNodes;
			for (var i = 0, c, l = childList.length; i < l; i++) {
				c = childList[i];
				if (!c) {
					continue;
				} else {  
						readAllHtmlNodes(newParent, c);
				}
			}
		}
		
	};
	
	/*
	 * append wce node into <w>, only for supplied, unclear,  highlight etc.
	 */
	var appendNodeInW = function($teiParent, $teiNode, $htmlNode){
		var childList = $htmlNode.childNodes;  
		var w;  
		var wrapNode;
		var tempParent = $newDoc.createDocumentFragment();
		
		for (var i = 0, c, l = childList.length; i < l; i++) {
			w = null; 
			c = childList[i];
			if (!c) {
				continue;
			} else {
				if (c.nodeName == 'w') {
					w = c.cloneNode(true); 
					tempParent.appendChild(w);
				} else {
					var temp = $newDoc.createDocumentFragment();
					getTeiNodeByHtmlNode(temp, c);//TODO: if not initHtmlContent, may be c.nodeType==3, what should to do?
				  	while (temp.firstChild) {
				 		tempParent.appendChild(temp.firstChild);
				 		/*
				 		tFirst=temp.firstChild; 
				 		if(tFirst.nodeName=='w'){
				 			tempParent.appendChild(wrapChildNode(tFirst, wrapNode)); 
				 			temp.removeChild(tFirst);	
				 		}else{
				 			// for example:
				 			//<gap hat not parent <w>
				 			//<w before="0" after="0" id="0">
    						//<hi rend="rubric">a</hi>
						   	//</w>
						   	//<gap reason="witnessEnd"/>
						   	//<w before="0" after="0" id="3">
						   	//<hi rend="rubric">bc</hi>
						  	//</w> 
				 			tempParent.appendChild(tFirst);
				 		}*/		 	
				 	} 
				} 
			}
		}
		html2Tei_mergeNodes(tempParent, false);
		var tFirst=tempParent.firstChild;
		var currentParentIsTeiNode=false; 
		var currentParent=$teiParent;
		while (tFirst) { 
			if (tFirst.nodeName == 'w') {
				if (!tFirst.firstChild) {
					//if w is <w/>, this means that no content for $teiNode, then add only <w/> 
					//in order to show there is a space and <w> stop.
					$teiParent.appendChild(tFirst);
				} else {
					wrapNode=$teiNode.cloneNode(true);
					var n=wrapChildNode(tFirst, wrapNode); 
					$teiParent.appendChild(n);
					tempParent.removeChild(tFirst);//remove tFirst
				}
				
				currentParentIsTeiNode=false;
				currentParent=$teiParent;
			} else {
				if (!currentParentIsTeiNode){
					var clone=$teiNode.cloneNode(true);
					clone.appendChild(tempParent.firstChild);//move tFirst
					$teiParent.appendChild(clone);
					currentParentIsTeiNode=true;
					currentParent=clone;					
				} else {
					currentParent.appendChild(tempParent.firstChild);//move tFirst
				}
				
			}
			tFirst=tempParent.firstChild;
		}
	};
	
	
	var wrapChildNode = function ($parent, $wrapNode){
		var deepChild=$wrapNode;
		while(deepChild.firstChild){
			deepChild=deepChild.firstChild;
		}
		
		while($parent.hasChildNodes()){
			deepChild.appendChild($parent.firstChild);
		}
		
		//supplied in abbr //ticket #1762
		if($wrapNode.nodeName=='abbr' && $wrapNode.getAttribute('ext')){  
			$wrapNode.removeAttribute('ext');
			$wrapNode=handleSupliedInAbbr($wrapNode, $newDoc.createDocumentFragment(), true);
			//$wrapNode=handleSupliedInAbbr2($wrapNode);// both function do well
		} 
		//fixed #1772
		if($wrapNode.getAttribute('removeText')){
			while($wrapNode.firstChild){
				$wrapNode.removeChild($wrapNode.firstChild);
			}
			$wrapNode.removeAttribute('removeText');
		}
		
		//use node name and attribute
		var newParent=$parent.cloneNode(false);
		newParent.appendChild($wrapNode);
		return newParent;
	};
	
	//or use function handleSupliedInAbbr2
	//supplied in abbr //ticket #1762
	var handleSupliedInAbbr = function ($node, $currNewNode, end){
		if(!$node){
			return; 
		} 
		
		var nextNewParent=$node.cloneNode(false);   
		if(nextNewParent.nodeType==3){ 
			$currNewNode.appendChild(nextNewParent); 
			return;
		}
		
		//if it is <supplied>
		if($node.nodeType!=3 && $node.nodeName!='abbr' && $node.getAttribute('ext')){   
			//find <hi ovlerline>
			var treeArr=new Array(); 
			var cp=$currNewNode,hi; 
			while(cp){
				if(cp.nodeName=='abbr'){
					break;
				}
				treeArr.push(cp); 
				hi=cp;
				cp=cp.parentNode;
			}
			var abbr=hi.parentNode; 
			
			var supplied=$node.cloneNode(true); //supplied from copy of original teinode		
			supplied.removeAttribute('ext'); 
			abbr.appendChild(supplied);//abbr append supplied
			
			var tempNode=$newDoc.createDocumentFragment();
			while(supplied.firstChild){
				tempNode.appendChild(supplied.firstChild);
			}  
			 
			for(var c, l=treeArr.length, i=l-1; i>=0; i--){
				c=treeArr[i].cloneNode(false); 
				supplied.appendChild(c);
				supplied=c;
			}
			while(tempNode.firstChild){
				supplied.appendChild(tempNode.firstChild);
			}	 
			nextNewParent=abbr; 
				for(var c, l=treeArr.length, i=l-1; i>=0; i--){
					c=treeArr[i].cloneNode(false); 
					nextNewParent.appendChild(c);
					nextNewParent=c;
				} 
			return nextNewParent;			
		} 
		$currNewNode.appendChild(nextNewParent); 
		
		var next=$node.firstChild;
		var newp;
		while(next){
			newP=handleSupliedInAbbr(next, nextNewParent);
			if(newP){
				nextNewParent=newP;
			}
			next=next.nextSibling;
		}		
		if(end){ 
			return removeBlankNode($currNewNode.firstChild); 
		}	
	};
	
	//or use function handleSupliedInAbbr
	//supplied in abbr //ticket #1762
	var handleSupliedInAbbr2 = function ($node){
		if(!$node || $node.nodeType==3){
			return;
		}
		
		if($node.nodeName!='abbr' && $node.getAttribute('ext')){
			var s1='',s2='';
			var parent=$node.parentNode;
			var next=$node.nextSibling;
			var str;
			while(parent && parent.nodeName!='abbr'){ 
				s1+='@{@/'+parent.nodeName+'@}@';
				s2='@{@'+getNameAndAttributeAsString(parent)+'@}@'+s2;
				parent=parent.parentNode;
			}
			$node.parentNode.insertBefore($node.ownerDocument.createTextNode(s1),$node);
			$node.insertBefore($node.ownerDocument.createTextNode(s2),$node.firstChild);
			$node.appendChild($node.ownerDocument.createTextNode(s1));
			if(next){
				$node.parentNode.insertBefore($node.ownerDocument.createTextNode(s2),next);
			}else{
				$node.parentNode.appendChild($node.ownerDocument.createTextNode(s2));
			}
			$node.removeAttribute('ext');
			return;
		}
		
		var  temp=$node.childNodes;
		var childList=new Array();		
		
		for(var i=0, l=temp.length; i<l; i++){
			childList.push(temp[i]);
		} 
		
		for(var x=0, y=childList.length; x<y; x++){ 
			handleSupliedInAbbr2(childList[x]);
		}
		
		if($node.nodeName=='abbr'){
			$node.removeAttribute('ext');
			var xmlstr=xml2String($node);
			xmlstr=xmlstr.replace(/@{@/g,'<');
			xmlstr=xmlstr.replace(/@}@/g,'>');
			$node= loadXMLString(xmlstr);
			$node=$node.documentElement;
			removeBlankNode($node);
			return $node;
		}
	}; 
	
	var getNameAndAttributeAsString = function ($node){
		 var s='';
		 var attrs=$node.attributes;  
		 for(var i=0,attr,an, l=attrs.length; i<l; i++){
		 	attr=attrs[i];
		 	an=attr.nodeName;
		 	s=an+'="'+$node.getAttribute(an)+'" '; 
		 } 
		 return $node.nodeName+" "+s; 
	};

	/*
	 * read all nodes of $node and change and add
	 */
	/*var readAllChildrenOfHtmlNode = function($teiParent, $htmlNode, stopAddW) {
		//nodec++;
		//alert(nodec + ' ' + $htmlNode.nodeValue);
		if (!$htmlNode) {
			return;
		}
		//if ($htmlNode.nodeType == 3)
		//	alert($htmlNode.nodeName + ' ' +$htmlNode.nodeValue);
		//else
		//	alert($htmlNode.nodeName + ' ' +$htmlNode.nodeValue + ' ' + $htmlNode.getAttribute("class"));
		if ($htmlNode.nodeType == 3) {
			// Generate new tei node according to the html-textNode
			html2Tei_TEXT($teiParent, $htmlNode, stopAddW);
		} else if ($htmlNode.nodeType == 1) {
			//alle Informationen fuer xml Export enthalten in Attribute. InnerHTML ist nur fuer HTML darstellung und nicht fuer xmlExport noetig.
			if ($htmlNode.getAttribute('class') == 'corr') {
				$($htmlNode).empty();
				// remove all childNodes
			}

			// Generate new tei-node according to the html-Node
			// then add the childNode to the tei-node
			var arr = getTeiNodeByHtmlNode($teiParent, $htmlNode, stopAddW);
			if (!arr) {
				return;
			}

			//
			var $newParent = arr[0];
			if (!stopAddW) {
				stopAddW = arr[1];
			}

			//
			var childList = $htmlNode.childNodes;
			for (var i = 0, $c, l = childList.length; i < l; i++) {
				$c = childList[i];
				if (!$c) {
					continue;
				} else {
					// For <span class="abbr..."> we use a special treatment (see HTML2TEI_abbr);
					// TODO: Think about a general solution
					if ($htmlNode.getAttribute('class').indexOf('abbr') == -1
						&& $htmlNode.getAttribute('wce').indexOf("mark_as_supplied=supplied") == -1) 
						readAllChildrenOfHtmlNode($newParent, $c, stopAddW);
				}
			}

			// Check the next Element
			if (!startCompressionWord) {
				var $htmlNodeNext = $htmlNode.nextSibling;
				while ($htmlNodeNext) {
					var oldNodeNextType = $htmlNodeNext.nodeType;
					// get next sibling of next node
					var $nnext = $htmlNodeNext.nextSibling;
					if (oldNodeNextType == 3) {
						var oldNodeNextText = $htmlNodeNext.nodeValue;
						if ($.trim(oldNodeNextText) == '') {
							$htmlNodeNext.parentNode.removeChild($htmlNodeNext);
							break;
						}
						// if text begins not with a space, then merge
						if (!startHasSpace(oldNodeNextText)) {
							startCompressionWord = true;
							var ind = oldNodeNextText.indexOf(" ");
							// read content before the first space
							if (ind > 0) {
								var subStr1 = oldNodeNextText.substr(0, ind);
								var subStr2 = oldNodeNextText.substr(ind, oldNodeNextText.length);
								// Add first word to actual node
								nodeAddText($newParent.parentNode, subStr1);
								// Add rest to next node
								$htmlNodeNext.nodeValue = subStr2;
							} else {
								//if ($htmlNodeNext != $htmlNodeNext.parentNode.lastChild)//avoid doubling last part of word
									html2Tei_TEXT($newParent.parentNode, $htmlNodeNext, stopAddW);
									$htmlNodeNext.parentNode.removeChild($htmlNodeNext);
							}
							startCompressionWord = false;
						} else {
							// start with space, stop
							break;
						}

						if (endHasSpace(oldNodeNextText)) {
							// end with space, stop
							break;
						}

					} else if (oldNodeNextType == 1) {
						startCompressionWord = true;
						readAllChildrenOfHtmlNode($newParent.parentNode, $htmlNodeNext, stopAddW);
						startCompressionWord = false;
						$htmlNodeNext.parentNode.removeChild($htmlNodeNext);//See below
					}
					// Remove $htmlNodeNext from tree; what happens to the rest words???
					// TODO: Check, whether there is any reason for this line; there is ... :-(
					// if (oldNodeNextType == 1) { //
						// $htmlNodeNext.parentNode.removeChild($htmlNodeNext);//See above
					// }
					if ($nnext) {
						// The following condition is REALLY important.
						// Otherwise pieces of text (substr2) will be added as firstChild to a node (e.g. a linebreak) 
						//and thus end up after this break in the export
						 
						if (oldNodeNextType == 1) { 
							$htmlNodeNext = $nnext;
							continue;
						}
					}
					$htmlNodeNext = null;
				}
			}
		}

	};*/

	/*
	 * read html-node, create tei-node and return
	 */
	var getTeiNodeByHtmlNode = function($teiParent, $htmlNode) {
		if ($htmlNode.nodeType != 1 && $htmlNode.nodeType != 11) { 
			return null;
		}
		var wceAttrValue, wceType, htmlNodeName, infoArr, arr;
		
		// If there is no special <div type="book"> element, the passed number from the Workspace is used.
		// We check, if it is in the correct format.
		if (g_bookNumber.length == 1) {// add "0"
			g_bookNumber = '0' + g_bookNumber;
		}
		
		wceAttrValue = $htmlNode.getAttribute('wce'); 
		if (!wceAttrValue) {
			if ($($htmlNode).hasClass('verse_number')) {
				wceAttrValue = 'verse_number';
			} else if ($($htmlNode).hasClass('chapter_number')) {
				wceAttrValue = 'chapter_number';
			} else if ($($htmlNode).hasClass('book_number')) {
				wceAttrValue = 'book_number';
			} else if ($($htmlNode).hasClass('lection_number')) {
				wceAttrValue = 'lection_number';
			}
		}

		// ******************* verse *******************
		if (wceAttrValue != null && wceAttrValue.match(/verse_number/)) { 
			if (wceAttrValue && !wceAttrValue.match(/partial/)){ //automatic set attribute "part"
				html2Tei_addAttributePartF($htmlNode);
			}
			var partial_index = -1;
				//just a workaround until Troy has fixed the append method
			if (wceAttrValue)
				partial_index = wceAttrValue.indexOf('partial');
					
			var textNode = $htmlNode.firstChild;
			if (textNode) {
				// TODO: This could maybe removed as the part handling has been changed.
				/*if ($.trim(textNode.nodeValue) === "Cont.") { // special kind of verse TODO: Check, if still necessary
				 found_ab = true;
				 g_verseNode = $newDoc.createElement('ab');
				 g_verseNode.setAttribute('part', 'F');

				 // test, if last page ended with an hyphenation
				 if (!final_w_found && $teiParent.lastChild && $teiParent.lastChild.previousSibling && $teiParent.lastChild.previousSibling.previousSibling &&
				 $teiParent.lastChild.previousSibling.previousSibling.nodeName === 'pb' && $teiParent.lastChild.previousSibling.previousSibling.getAttribute("break") === "no")
				 final_w_found = true;
				 } else {*/
				textNode=textNode.firstChild;// because <w>
				g_verseNumber = textNode.nodeValue;
				var cont_index = g_verseNumber.indexOf('Cont.');
				if (cont_index > -1)
					g_verseNumber = g_verseNumber.substring(0, cont_index);
				g_verseNumber = $.trim(g_verseNumber);
				g_verseNode = $newDoc.createElement('ab');
				g_verseNode.setAttribute('n', 'B' + g_bookNumber + 'K' + g_chapterNumber + 'V' + g_verseNumber);
				
				if (partial_index > -1){// node contains information about partial
					g_verseNode.setAttribute('part', wceAttrValue.substring(partial_index + 8, partial_index + 9));
				}
				if (g_chapterNode)
					g_chapterNode.appendChild(g_verseNode);
				else
					$newRoot.appendChild(g_verseNode);
				g_currentParentNode = g_verseNode;
				//g_wordNumber = 0;
			} else { //empty verse
				g_verseNode = $newDoc.createElement('ab');
				if (partial_index > -1){// node contains information about partial
					g_verseNode.setAttribute('part', wceAttrValue.substring(partial_index + 8, partial_index + 9));
				}
				if (g_chapterNode)
					g_chapterNode.appendChild(g_verseNode);
				else
					$newRoot.appendChild(g_verseNode);
				g_currentParentNode = g_verseNode;
				//g_wordNumber = 0;
			}
			var partAttr=$htmlNode.getAttribute('part');
			if (partAttr) {
				g_verseNode.setAttribute('part',partAttr);
			}
			note = 0; //reset note counter
			return null;

		} else if (wceAttrValue != null && wceAttrValue.match(/chapter_number/)) {
			// ******************* chapter *******************
			var textNode = $htmlNode.firstChild;
			if (textNode) {
				textNode=textNode.firstChild;
				g_chapterNumber = textNode.nodeValue;
				g_chapterNumber = $.trim(g_chapterNumber);
				//if (g_chapterNumber != old_chapterNumber) {//ignore repeated chapter numbers; TODO: still needed?
					old_chapterNumber = g_chapterNumber;
					g_chapterNode = $newDoc.createElement('div');
					if (g_chapterNumber === 'Inscriptio') {
						g_chapterNode.setAttribute('type', 'incipit');
						g_chapterNode.setAttribute('n', 'B' + g_bookNumber + 'incipit');
					} else if (g_chapterNumber === 'Subscriptio') {
						g_chapterNode.setAttribute('type', 'explicit');
						g_chapterNode.setAttribute('n', 'B' + g_bookNumber + 'explicit');
					} else {
						g_chapterNode.setAttribute('type', 'chapter');
						g_chapterNode.setAttribute('n', 'B' + g_bookNumber + 'K' + g_chapterNumber);
					}
					
					if (g_bookNode) 
						g_bookNode.appendChild(g_chapterNode);
					//else if (g_lectionNode) //attach node to lection if there is no book node (important for multiple lections)
					//	g_lectionNode.appendChild(g_chapterNode);
					else
						$newRoot.appendChild(g_chapterNode);
					g_currentParentNode = g_chapterNode;
			//	}
			}
			return null;
		} else if (wceAttrValue != null && wceAttrValue.match(/book_number/)) {
			var textNode = $htmlNode.firstChild;
			if (textNode) {
			    textNode=textNode.firstChild;
				g_bookNumber = textNode.nodeValue;
				g_bookNumber = $.trim(g_bookNumber);
				g_bookNode = $newDoc.createElement('div');
				g_bookNode.setAttribute('type', 'book');
				if (g_bookNumber.length == 1)// add "0" if necessary
					g_bookNumber = '0' + g_bookNumber;
				g_bookNode.setAttribute('n', 'B' + g_bookNumber);
				if (g_lectionNode)
					g_lectionNode.appendChild(g_bookNode);
				else
					$newRoot.appendChild(g_bookNode);
				g_currentParentNode = g_bookNode;
			}
			return null;
		} else if (wceAttrValue != null && wceAttrValue.match(/lection_number/)) {
			var textNode = $htmlNode.firstChild;
			if (textNode) {
			    //textNode=textNode.firstChild;
				g_lectionNode = $newDoc.createElement('div');
				g_lectionNode.setAttribute('type', 'lection');
				g_lectionNode.setAttribute('n', wceAttrValue.substring(wceAttrValue.lastIndexOf("=")+1));
				$newRoot.appendChild(g_lectionNode);
				g_currentParentNode = g_lectionNode;
				//g_bookNode = null; // reset book node as chapter can also be attached to a lection directly (see line 2737)
			}
			return null;
		} else {
			htmlNodeName = $htmlNode.nodeName;
		}

		// <br>
		if (htmlNodeName == 'br') {
			return null;
		}

		// for other type
		infoArr = strToArray(wceAttrValue);
		if (!infoArr) {
			return null;
		}

		// get attribute of wce "<span class="" wce="">, determination wce type
		arr = infoArr[0];
		if (!arr) {
			return null;
		}

		wceType = arr['__t'];
		
		// formatting
		if (wceType.match(/formatting/)) {
			return html2Tei_formating(arr, $teiParent, $htmlNode);
		}

		// gap
		if (wceType == 'gap') {
			return html2Tei_gap(arr, $teiParent, $htmlNode);
			
			/*
			var text = getDomNodeText($htmlNode).split(" ");
			if (text == '') // fix for #1796
				return;
			// split up content at word boundaries
			if (text[0] === "Witness")// Witness End
				return html2Tei_gap(arr, $teiParent, $htmlNode, true);
			//do not add <w> around <gap>
			else {
				if (text.length > 1) {
					var $parent = $htmlNode.parentNode;
					$htmlNode.removeChild($htmlNode.firstChild);
					// remove text from node
					for (var i = text.length - 1; i > 0; i--) {// clone node and modify content; descending to get the correct order in the XML
						$addNode = $htmlNode.cloneNode(true);
						nodeAddText($addNode, text[i].replace(/[\[\]]/g, ""));
						// replace brackets
						$parent.insertBefore($addNode, $htmlNode.nextSibling);
					}
					// Information about first one (i=0) are put into old htmlNode
					nodeAddText($htmlNode, text[0].replace("[", ""));
					//remove "["
					return html2Tei_gap(arr, $teiParent, $htmlNode);
					// get result from first part and return to main routine
				} else {//no word boundaries
					if ($htmlNode.getAttribute('wce').indexOf("mark_as_supplied=supplied") > -1){// supplied text => surrounding <w>
						return html2Tei_gap(arr, $teiParent, $htmlNode);
					}
					else { // gap; check, whether this is a single gap or part of a word
						var _nextSibling=$htmlNode.nextSibling;						
						if (_nextSibling && _nextSibling.nodeType==3 && _nextSibling.nodeValue && _nextSibling.nodeValue.indexOf(' ') == 0) {//=> no surrounding <w> needed
							return html2Tei_gap(arr, $teiParent, $htmlNode, true);
						} else
							return html2Tei_gap(arr, $teiParent, $htmlNode);
					}
				}
			}*/
		}

		// correction
		if (wceType === 'corr') {
			return html2Tei_correction(infoArr, $teiParent, $htmlNode);
		}

		// break
		if (wceType.match(/brea/)) {
			return html2Tei_break(arr, $teiParent, $htmlNode);
		}

		// abbr
		if (wceType == 'abbr') {
			return html2Tei_abbr(arr, $teiParent, $htmlNode);
		}

		// spaces
		if (wceType == 'spaces') {
			return html2Tei_spaces(arr, $teiParent, $htmlNode);
		}

		// note
		if (wceType == 'note') {
			return html2Tei_note(arr, $teiParent, $htmlNode);
		}

		// pc
		if (wceType == 'pc') {
			return html2Tei_pc(arr, $teiParent, $htmlNode);
		}

		// paratext
		if (wceType == 'paratext') {
			return html2Tei_paratext(arr, $teiParent, $htmlNode);
		}

		// unclear
		if (wceType == 'unclear') {
			return html2Tei_unclear(arr, $teiParent, $htmlNode);
			/*23.10.2013 YG
			// split up content at word boundaries*/
			/*var text = getDomNodeText($htmlNode).split(" ");
			if (text == 'sp') // take care of spaces element
				return html2Tei_unclear(arr, $teiParent, $htmlNode, stopAddW);
			
			// split up original text attribute
			var orig_text = $htmlNode.getAttribute('wce_orig').split("%20");
			if (text.length > 1) {
				var $parent = $htmlNode.parentNode;
				$htmlNode.removeChild($htmlNode.firstChild);
				// remove text from node
				for (var i = text.length - 1; i > 0; i--) {// clone node and modify content; descending to get the correct order in the XML
					$addNode = $htmlNode.cloneNode(true);
					$addNode.setAttribute('wce_orig', orig_text[i]);
					// set attribute wce_orig
					nodeAddText($addNode, text[i]);
					$parent.insertBefore($addNode, $htmlNode.nextSibling);
				}
				// Information about first one (i=0) are put into old htmlNode
				$htmlNode.setAttribute('wce_orig', orig_text[0]);
				// set attribute wce_orig
				nodeAddText($htmlNode, text[0]);
				return html2Tei_unclear(arr, $teiParent, $htmlNode);
				// get result from first part and return to main routine
			} else {//no word boundaries
				return html2Tei_unclear(arr, $teiParent, $htmlNode);
			}*/
		}

		// part_abbr
		if (wceType == 'part_abbr') {
			return html2Tei_partarr(arr, $teiParent, $htmlNode);
		}

		// other
		var $e = $newDoc.createElement("-TEMP-" + htmlNodeName);
		$teiParent.appendChild($e);
		return {
			0 : $e,
			1 : false
		};

	};

	/*
	 * type formating, return <hi>
	 */
	var html2Tei_formating = function(arr, $teiParent, $htmlNode) {
		var $hi = $newDoc.createElement('hi');
		var formatting_rend = '', formatting_height = '';
		switch (arr['__t']) {
			case 'formatting_rubrication':
				formatting_rend = 'rubric';
				break;
			case 'formatting_gold':
				formatting_rend = 'gold';
				break;
			case 'formatting_blue':
				formatting_rend = 'blue';
				break;
			case 'formatting_green':
				formatting_rend = 'green';
				break;
			case 'formatting_yellow':
				formatting_rend = 'yellow';
				break;
			case 'formatting_other':
				formatting_rend = 'other';
				break;
			case 'formatting_capitals':
				formatting_rend = 'cap';
				formatting_height = arr['capitals_height'];
				break;
			case 'formatting_overline':
				formatting_rend = 'overline';
				break;
			case 'formatting_displaced-above':
				formatting_rend = 'displaced-above';
				break;
			case 'formatting_displaced-below':
				formatting_rend = 'displaced-below';
				break;
			case 'formatting_displaced-other':
				formatting_rend = 'displaced-other';
				break;
			case 'formatting_ornamentation_other':
				formatting_rend = decodeURIComponent(arr['formatting_ornamentation_other']);
				break;
		}

		if (formatting_rend != '') {
			$hi.setAttribute('rend', formatting_rend);
		}
		if (formatting_height != '') {
			$hi.setAttribute('height', formatting_height);
		}
		appendNodeInW($teiParent, $hi, $htmlNode); 
		return {
			0 : $teiParent,
			1 : true
		};

		/*
		// add a element <w>
		if (!stopAddW) {
			var $w = createNewWElement();
			$w.appendChild($hi);
			$teiParent.appendChild($w);
		} else {
			$teiParent.appendChild($hi);
		}

		 
		// stop add element a <w>
		return {
			0 : $hi,
			1 : true
		};
		*/
	};

	/*
	 * type gap, return <gap> or <supplied>
	 */
	var html2Tei_gap = function(arr, $teiParent, $htmlNode) {
		// wce_gap <gap OR <supplied source="STRING" _type_STRING type="STRING" _reason_STRING reason="STRING" _hand_STRING hand="STRING" _unit_STRING_extent_STRING unit="STRING" extent="STRING" />
		var $newNode;

		if (arr['mark_as_supplied'] == 'supplied') {
			// <supplied>
			$newNode = $newDoc.createElement('supplied');
			var _supplied_source = arr['supplied_source'];
			if (_supplied_source && _supplied_source != '') {
				if (_supplied_source == 'other' && arr['supplied_source_other'])
					$newNode.setAttribute('source', arr['supplied_source_other']);
				else if (_supplied_source != 'none')
					$newNode.setAttribute('source', _supplied_source);
			}
		} else {
			$newNode = $newDoc.createElement('gap');
			// <gap>
		}
		// reason
		if (arr['gap_reason']) {
			$newNode.setAttribute('reason', decodeURIComponent(arr['gap_reason']));
		}
		
		if (arr['mark_as_supplied'] !== 'supplied') {
			// unit
			var unitValue = arr['unit'];
			if (unitValue != '') {
				if (unitValue == 'other' && arr['unit_other']) {
					$newNode.setAttribute('unit', arr['unit_other']);
				} else {
					$newNode.setAttribute('unit', unitValue);
				}
			}
			// extent
			if (arr['extent']) {
				$newNode.setAttribute('extent', arr['extent']);
			}
		}	
		var extAttr = $htmlNode.getAttribute('ext');
		if (extAttr) {
			$newNode.setAttribute('ext', extAttr);
		}
		
		if ($newNode.nodeName === 'supplied'){
			$htmlNode = removeBracketOfSupplied($htmlNode);
		 	appendNodeInW($teiParent, $newNode, $htmlNode); 
		} else {
			var finished;
			//if ($newNode.getAttribute('unit') == 'word') {
			//	$newNode.setAttribute('removeText','true');
			//	if ($htmlNode.firstChild.firstChild)
			//		$htmlNode.firstChild.firstChild.nodeValue = ''; // remove content [...] etc. //TODO: This should be removeChild etc. Did not work.
			//	appendNodeInW($teiParent, $newNode, $htmlNode); 
			//	finished=1;
			// } else
			//
			
			//test if gap exist independent
			if ($newNode.getAttribute('unit') != 'word') {
			 	var pre=$htmlNode.previousSibling;
			 	var next=$htmlNode.nextSibling;
			 	 
			 	while(pre){
			 		if(pre.nodeName=='w'){
			 			var lastAfter=pre.getAttribute('after');  
			 			break;
			 		}
			 		pre=pre.lastChild;
			 	}  
			 	 
			 	while(next){
			 		if(next.nodeName=='w'){
			 			var nextBefore=next.getAttribute('before');  
			 			break;
			 		}
			 		next=next.firstChild;
			 	} 
			 	
			 	if(((lastAfter && lastAfter=="1") || !lastAfter) && (!nextBefore || (nextBefore && nextBefore=="1"))){
			 		$teiParent.appendChild($newNode);
			 		finished=1;
			 	} 		 	
			 }
			 
			 if(!finished){// gap in <w>: in/before/after/ word fixed: #1772
			 	$newNode.setAttribute('removeText','true');
			 	appendNodeInW($teiParent, $newNode, $htmlNode); 
			 }
		}
	 
		return {
		 	 	0 : $teiParent,
		 	 	1 : true
		};
		
		/*	 
		if ($newNode.nodeName === 'supplied') {
			// add text
			var $innerNode = $newDoc.createDocumentFragment();
			var childList = $htmlNode.childNodes; 
			for (var i = 0, c, l = childList.length; i < l; i++) {// iterate through children of abbr
				c=childList[i];
				if (!c) {
					break;
				}
				if (c.nodeType == 3){ // TextNode
					nodeAddText($innerNode, c.nodeValue);
				}
				else { // element node 
					readAllHtmlNodes($innerNode, c, true);
				}
			}
			 
			$innerNode.firstChild.nodeValue=$innerNode.firstChild.nodeValue.replace(/[\[\]]/g, "");
			$innerNode.lastChild.nodeValue=$innerNode.lastChild.nodeValue.replace(/[\[\]]/g, "");
			$newNode.appendChild($innerNode); //MS 
			// var newNodeText = getDomNodeText($htmlNode);
			// if (newNodeText) {
			// 	removeFormatNode($htmlNode);
				// $htmlNode.removeChild($htmlNode.firstChild);
				 
				//  If the text starts with "[", an abbreviation is inside. 
				//  This means, that there is an extra "]" after the <abbr>, which has to be removed as well.
				
				// if (newNodeText.indexOf("[") == 0)
				// 	$htmlNode.removeChild($htmlNode.lastChild);
				
				// newNodeText = newNodeText.replace(/[‹›\[\]]/g, "");
				//get rid of brackets [...]  and format markers ‹...›
				// nodeAddText($newNode, newNodeText);
			// }
		}
  
	 	if (!stopAddW) {
			var $w = createNewWElement();
			$w.appendChild($newNode);
			$teiParent.appendChild($w);
		} else {
			$teiParent.appendChild($newNode);
		}

		return {
			0 : $newNode,
			1 : true
		};
		*/
	};
	
	
	/*
	 * remove text "[" and "]" of <supplied>
	 */
	var removeBracketOfSupplied = function($htmlNode){
		var firstW = $htmlNode.firstChild;
		if (firstW) {
			var firstTextNode = firstW.firstChild;
			if (firstTextNode && firstTextNode.nodeType == 3) {
				firstTextNode.nodeValue=firstTextNode.nodeValue.replace(/^\[/, "");
			}
		} 
		var lastW = $htmlNode.lastChild;
		if (lastW) {
			var lastTextNode = lastW.lastChild;
			if(lastTextNode && lastTextNode.nodeType==3){
				lastTextNode.nodeValue=lastTextNode.nodeValue.replace(/\]$/, "");
			}
		}
		return $htmlNode; 
	};
	
	/*
	 * type correction, return <app><rdg> ....
	 */
	var html2Tei_correction = function(infoArr, $teiParent, $htmlNode) {
		var $app, $seg;
		var xml_id;
		//var startWordNumberInCorrection = g_wordNumber;
		var notecount;
		//to determine the correct position of the <note> insertion
		var rdgcount;

		for (var i = 0, arr, l = infoArr.length; i < l; i++) {
			arr = infoArr[i];
			if (arr['__t'] !== 'corr'){
				// make sure, we are really dealing with a correction (problems existed with abbr + corr)
				continue;
			}
			//g_wordNumber = startWordNumberInCorrection;

			var firsthand_partial = arr['firsthand_partial'];
			var partial = arr['partial'];
			if (!$app) {
				notecount = 0;
				rdgcount = 0;
				// new Element <app>
				$app = $newDoc.createElement('app');
				if (firsthand_partial != '')
					$app.setAttribute('part', firsthand_partial);
				$teiParent.appendChild($app);

				// new Element <rdg> for original
				// <rdg type="orig" hand="firsthand"><w n="17">���ӦŦͦɦƦŦӦ���</w> <pc>?</pc></rdg>
				var $orig = $newDoc.createElement('rdg');
				if (firsthand_partial != '')
					$orig.setAttribute('part', firsthand_partial);
				$orig.setAttribute('type', 'orig');
				if (arr['ut_videtur_firsthand'] === 'on')
					$orig.setAttribute('hand', 'firsthandV');
				else
					$orig.setAttribute('hand', 'firsthand');
				if (arr['blank_firsthand'] === 'on') {//Blank first hand reading
					var origText = 'OMISSION'; //this is later replaced by "" DO NOT ADD <w> HERE
					nodeAddText($orig, origText);
				} else {
					var origText = $htmlNode.getAttribute('wce_orig');
					if (origText) {
						html2Tei_correctionAddW($orig, origText);
					}
				}
				$app.appendChild($orig);
			}
			// new Element<rdg>,child of <app>($newNode)
			rdgcount++;
			var $rdg = $newDoc.createElement('rdg');
			if (partial != '')
				$rdg.setAttribute('part', partial);
			$rdg.setAttribute('type', arr['reading']);
			var corrector_name = arr['corrector_name'];
			if (corrector_name == 'other') {
				if (arr['ut_videtur_corr'] === 'on')
					corrector_name = arr['corrector_name_other'] + 'V';
				else
					corrector_name = arr['corrector_name_other'];
			}
			if (arr['ut_videtur_corr'] === 'on')	
				$rdg.setAttribute('hand', decodeURIComponent(corrector_name) + 'V');
			else
				$rdg.setAttribute('hand', decodeURIComponent(corrector_name));

			// deletion
			var deletion = decodeURIComponent(arr['deletion']);
			if (deletion && deletion != 'null' && deletion != '') {
				$rdg.setAttribute('rend', deletion.replace(/\,/g, ' '));
			}

			var place = arr['place_corr'];
			var corrector_text = arr['corrector_text'];
			if (arr['blank_correction'] == 'on') {
				corrector_text = 'OMISSION'; //this is later replaced by ""
			}

			// Define value for "n" attribute. This depends on the type of marginal material

			if (place === 'pageleft' || place === 'pageright' || place === 'pagetop' || place === 'pagebottom') {//define <seg> element for marginal material
				$seg = $newDoc.createElement('seg');
				isSeg = true;
				$seg.setAttribute('type', 'margin');
				$seg.setAttribute('subtype', place);
				$seg.setAttribute('n', '@' + 'P' + g_pageNumber + '-' + g_witValue);
				if (corrector_text) {//add to <seg>
					html2Tei_correctionAddW($seg, corrector_text);
				}
				$rdg.appendChild($seg);
			} else if (place === 'coltop' || place === 'colbottom' || place === 'colleft' || place === 'colright') {
				$seg = $newDoc.createElement('seg');
				isSeg = true;
				$seg.setAttribute('type', 'margin');
				$seg.setAttribute('subtype', place);
				$seg.setAttribute('n', '@' + 'P' + g_pageNumber + 'C' + g_columnNumber + '-' + g_witValue);
				if (corrector_text) {//add to <seg>
					html2Tei_correctionAddW($seg, corrector_text);
				}
				$rdg.appendChild($seg);
			} else if (place === 'lineleft' || place === 'lineright') {
				$seg = $newDoc.createElement('seg');
				isSeg = true;
				$seg.setAttribute('type', 'margin');
				$seg.setAttribute('subtype', place);
				$seg.setAttribute('n', '@' + 'P' + g_pageNumber + 'C' + g_columnNumber + 'L' + g_lineNumber + '-' + g_witValue);
				if (corrector_text) {//add to <seg>
					html2Tei_correctionAddW($seg, corrector_text);
				}
				$rdg.appendChild($seg);
			} else if (place === 'overwritten' || place === 'above' || place === 'below') {
				$seg = $newDoc.createElement('seg');
				isSeg = true;
				$seg.setAttribute('type', 'line');
				$seg.setAttribute('subtype', place);
				$seg.setAttribute('n', '@' + 'P' + g_pageNumber + 'C' + g_columnNumber + 'L' + g_lineNumber + '-' + g_witValue);
				if (corrector_text) {//add to <seg>
					html2Tei_correctionAddW($seg, corrector_text);
				}
				$rdg.appendChild($seg);
			} else if (place) {//other
				$seg = $newDoc.createElement('seg');
				isSeg = true;
				$seg.setAttribute('type', 'other');
				$seg.setAttribute('subtype', decodeURIComponent(arr['place_corr_other']));
				$seg.setAttribute('n', '@' + 'P' + g_pageNumber + 'C' + g_columnNumber + 'L' + g_lineNumber + '-' + g_witValue);
				if (corrector_text) {//add to <seg>
					html2Tei_correctionAddW($seg, corrector_text);
				}
				$rdg.appendChild($seg);
			} else {//non-marginal material
				if (corrector_text) {//add to <rdg>
					if (corrector_text === 'OMISSION') { //we don't want <w> around here
						nodeAddText($rdg, corrector_text);
					}
					else
						html2Tei_correctionAddW($rdg, corrector_text);
				}
			}
			isSeg = false;
			$app.appendChild($rdg);
		}
	 
	 	return {
			0 : $app,
			1 : true
		};
	};

	//text from editor in editor
	var html2Tei_correctionAddW = function($newNode, text) {
		text = decodeURIComponent(text);
		var $corrXMLDoc = loadXMLString('<TEMP>' + text + '</TEMP>');
		var $corrRoot = $corrXMLDoc.documentElement;
		$corrRoot=initHtmlContent($corrRoot);
		var childList = $corrRoot.childNodes;
		for (var x = 0, $c, y = childList.length; x < y; x++) {
			$c = childList[x];
			if (!$c) {
				continue;
			} else {
				readAllHtmlNodes($newNode, $c);
			}
		}
	};
	//text from editor in editor
	var html2Tei_paratextAddChildren = function($newNode, text) {
		html2Tei_correctionAddW($newNode, text);
		if ($newNode.nodeName === 'num')
			html2Tei_paratextRemoveWNode($newNode);
		return;
	};
	
	var html2Tei_paratextRemoveWNode = function($node){
		if(!$node || $node.nodeType==3 || $node.nodeName=='w'){
			return;
		} 
		var tempList=$node.childNodes; 
		var childList = new Array();
		 
		for(var x=0, y=tempList.length; x<y; x++){
			childList.push(tempList[x]);
		} 		
		
		var w;
		for(var i=0, l=childList.length; i<l; i++){
			w=childList[i]; 
			if (w.nodeType==3) continue;
			
			if (w.nodeName == 'w') { 
				while (w.hasChildNodes()) {
					$node.insertBefore(w.firstChild, w);
				}
				w.parentNode.removeChild(w);
				
			} else {
				html2Tei_paratextRemoveWNode(w);
			} 
		} 
	};
	
	var isLastNodeOf = function ($node,nName){
		var parent=$node.ParentNode;
		while(parent){
			if(parent.nodeName==nName){
				return true;
			}
			parent=parent.ParentNode;
		}
		return false;
	};
	/*
	* type break,
	*/
	// break_type= lb / cb /qb / pb number= pb_type= running_title= lb_alignment, Page (Collate |P 121|): <pb n="121" type="page" xml:id="P121-wit" /> Folio (Collate |F 3v|): <pb n="3v" type="folio" xml:id="P3v-wit" /> Column (Collate |C 2|): <cb n="2" xml:id="P3vC2-wit" />
	// Line (Collate |L 37|): <lb n="37" xml:id="P3vC2L37-wit" />
	var html2Tei_break = function(arr, $teiParent, $htmlNode) {
		var xml_id;
		var breakNodeText = getDomNodeText($htmlNode);
		var break_type = arr['break_type'];
		var $newNode;

		if (break_type == 'gb') {
			// special role of quire breaks
			$newNode = $newDoc.createElement('gb');
			$newNode.setAttribute('n', arr['number']);
		} else if (break_type) {
			/*
			// pb, cb, lb
			if (break_type == 'lb' && !$htmlNode.nextSibling && arr['hasBreak'] === 'yes' && isLastNodeOf($teiParent,'ab')) {//if this is the last element on a page, then it is only a marker
				if($teiParent.getAttribute('part')){
					$teiParent.setAttribute('part', 'M');
				}else{
					$teiParent.setAttribute('part', 'I');
				}
				return;
			}*/
			$newNode = $newDoc.createElement(break_type);
			switch (break_type) {
				case 'lb':
					g_lineNumber = arr['number'];
					if (!isSeg)
						$newNode.setAttribute('n', g_lineNumber);
					if (arr['lb_alignment'] != '') {
						$newNode.setAttribute('rend', arr['lb_alignment']);
					}
					xml_id = 'P' + g_pageNumber_id + 'C' + g_columnNumber + 'L' + g_lineNumber + '-' + g_witValue;
					break;
				case 'cb':
					g_columnNumber = arr['number'];
					if (!isSeg)
						$newNode.setAttribute('n', g_columnNumber);
					xml_id = 'P' + g_pageNumber_id + 'C' + g_columnNumber + '-' + g_witValue;
					break;
				case 'pb':
					var breaPage = '';
					// Set page number and decide which type (folio|page)
					if (arr['rv'] != '') { //recto or verso
						// folio
						g_pageNumber = arr['number'] + arr['rv'] + arr['fibre_type'];
						g_pageNumber = addArrows(g_pageNumber);
						g_pageNumber_id = removeArrows(g_pageNumber);
						if (!isSeg)
							$newNode.setAttribute('n', g_pageNumber);
						$newNode.setAttribute('type', 'folio');
					} else {
						// page
						g_pageNumber = arr['number'] + arr['fibre_type'];
						g_pageNumber = addArrows(g_pageNumber);
						g_pageNumber_id = removeArrows(g_pageNumber);
						if (!isSeg)
							$newNode.setAttribute('n', g_pageNumber);
						$newNode.setAttribute('type', 'page');
					}
					//}
					if (arr['facs'] != '') {
						// use URL for facs attribute
						$newNode.setAttribute('facs', decodeURIComponent(arr['facs']));
					}
					xml_id = 'P' + g_pageNumber_id + '-' + g_witValue;
					break;
			}
			if (!isSeg) //no ID for breaks inside <seg>
				//$newNode.setAttribute("xml:id", xml_id);
				$newNode.setAttribute("n", xml_id);
			//IE gets confused here
			if (arr['hasBreak'] && arr['hasBreak'] === 'yes') {
				$newNode.setAttribute('break', 'no'); //This has to be "no" due to the TEI standard
			}
		}
		// Move the break one level up, if at the end of an not hyphenated word #1714
		if ($teiParent.nodeName == 'w' && !$newNode.getAttribute('break')) { //Complete word
			switch ($newNode.nodeName) {
				case 'lb':
					if ($teiParent.lastChild.nodeName != 'cb') // no cb above lb
						$teiParent = $teiParent.parentNode;
					break;
				case 'cb':
					if ($teiParent.lastChild.nodeName != 'pb') // no pb above cb
						$teiParent = $teiParent.parentNode;
					break;
				case 'pb':
					if ($teiParent.lastChild.nodeName != 'gb') // no gb above pb
						$teiParent = $teiParent.parentNode;
					break;
				case 'gb':
					$teiParent = $teiParent.parentNode;
					break;
			}
		}
		$teiParent.appendChild($newNode);
		// TODO
		if (break_type == 'lb') {
			// TODO why add \n?
			// for lb add newline
			// $newNode.parentNode.insertBefore($newDoc.createTextNode("\n"), $newNode);
		} else if (break_type == 'pb') {
			//found_ab = false;
			final_w_set = false;
		}

		//return null; //TODO: IS THIS CORRECT?
		return {
			0 : $newNode,
			1 : true
		};
	};

	/*
	 * type abbr, return <abbr>
	 */
	var html2Tei_abbr = function(arr, $teiParent, $htmlNode) {
		var $abbr = $newDoc.createElement('abbr');
		var extAttr = $htmlNode.getAttribute('ext');
		if(extAttr){
			$abbr.setAttribute('ext', extAttr);
		}
		
		// type
		var abbr_type = arr['abbr_type'];
		if (abbr_type && abbr_type != '') {
			if (abbr_type == 'other')
				$abbr.setAttribute('type', arr['abbr_type_other']);
			else
				$abbr.setAttribute('type', abbr_type);
		}

		//var hText = getDomNodeText($htmlNode); //TODO: we need a more complex method here to get nested elements as well

		//if (hText && hText.indexOf('\u2039') == 0) // if marker is still active (e.g. at combinations)
		//	hText = hText.substring(1, hText.length-1);

		var $innerNode = $newDoc.createDocumentFragment();
		var childList = $htmlNode.childNodes; 
		
		if (arr['add_overline'] === 'overline') {
			var $hi = $newDoc.createElement('hi');
			$hi.setAttribute('rend', 'overline');
			$abbr.appendChild($hi); 
		} 
		
		appendNodeInW($teiParent, $abbr, $htmlNode);
				
		return{
			0: $teiParent,
			1: true
		};
		
		
		 /* 22.10.2013 YG
		for (var i = 0, c, l = childList.length; i < l; i++) {// iterate through children of abbr
			c=childList[i];
			if (!c) {
				break;
			}
			if (c.nodeType == 3){// TextNode
				nodeAddText($innerNode, c.nodeValue);
			}
			else {// element node 
				readAllHtmlNodes($innerNode, c, true);
				//nodeAddText($innerNode, "TEST");
				//alert($htmlNode.lastChild.nodeValue);
				//$htmlNode.parentNode.removeChild($htmlNode);
				//$innerNode.appendChild(arr[0]);
				//alert($htmlNode.getAttribute("class"));
			}
		}

		// if "overline"��add <hi>
		if (arr['add_overline'] === 'overline') {
			var $hi = $newDoc.createElement('hi');
			$hi.setAttribute('rend', 'overline');
			//html2Tei_TEXT($hi, $htmlNode, false);
			if ($innerNode)
				$hi.appendChild($innerNode);
			//if (hText) {
			//	nodeAddText($hi, hText);
			//}
			$abbr.appendChild($hi);
		} else {
			//nodeAddText($abbr, hText);
			$abbr.appendChild($innerNode);
			//html2Tei_TEXT($abbr, $htmlNode, false);
		}
		  
		
		if (!stopAddW) {
			var $w = createNewWElement();
			$w.appendChild($abbr);
			$teiParent.appendChild($w);
		} else {
			$teiParent.appendChild($abbr);
		}
		return {
			 0 : $abbr,
			 1 : true
		}*/
	};

	/*
	 * type note, return <note>
	 */
	var html2Tei_note = function(arr, $teiParent, $htmlNode) {
		var $note = $newDoc.createElement('note');
		var note_type_value = arr['note_type'];
		if (note_type_value == 'other') {
			var other_value = arr['note_type_other'];
			if (other_value != '') {
				note_type_value = other_value;
			}
		}
		if (note_type_value != '') {
			if (note_type_value === 'changeOfHand') {
				$note.setAttribute('type', 'editorial');
			} else {
				$note.setAttribute('type', note_type_value);
			}
		}

		var $lastNode = $teiParent.lastChild;
		if ($lastNode) {
			note++;
			/*var text = $lastNode.innerText || $lastNode.textContent;
			if ($lastNode.nodeName === 'note' 
				|| ($lastNode.nodeName === 'w' && text === '')) //note is immediately preceded by another note
				note++;
			else 
				note = 1;*/
		} else // this is important for notes being inserted directly after the verse number
			note = 1;
		var xml_id = 'B' + g_bookNumber + 'K' + g_chapterNumber + 'V' + g_verseNumber + '-' + g_witValue + '-' + note;
		var temp='';
		var i=65;
		while (idSet.has(xml_id + temp)) {
			temp = String.fromCharCode(i).toLowerCase();
			i++;
		}
		$note.setAttribute('xml:id', xml_id + temp);
		idSet.add(xml_id + temp);
		
		// add <handshift/> if necessary
		if (note_type_value === "changeOfHand") {
			var $secNewNode = $newDoc.createElement('handshift');
			if (arr['newHand'].trim() != '')
				$secNewNode.setAttribute('scribe', decodeURIComponent(arr['newHand']));
			$note.appendChild($secNewNode);
		}
		
		nodeAddText($note, decodeURIComponent(arr['note_text'])); // add text to node
		
		/*23.10.2013 YG
		// Note has to be moved after the current word; Caveat: If there is a break following the note, a special treatment has to be applied
		if ($teiParent.nodeName == 'w') {
			$teiParent = $teiParent.parentNode;
			if ($htmlNode.nextSibling && $htmlNode.nextSibling.nodeType == 1
				&& $($htmlNode.nextSibling).hasClass('brea')) { // break following the note => insert space (don't forget to reverse that at import
				var $tempNode = $newDoc.createTextNode(" ");
				$htmlNode.parentNode.insertBefore($tempNode, $htmlNode.nextSibling);
			}	
		}*/
				
		$teiParent.appendChild($note); //add node to tree 
		 
		return {
			0 : $note,
			1 : true
		};
	};

	/*
	 * type space, return <space>
	 */
	var html2Tei_spaces = function(arr, $teiParent, $htmlNode) {
		var $space = $newDoc.createElement('space');

		var sp_unit_value = arr['sp_unit'];
		if (sp_unit_value == 'other' && arr['sp_unit_other'] != '') {
			sp_unit_value = arr['sp_unit_other'];
		}
		if (sp_unit_value != '') {
			$space.setAttribute('unit', sp_unit_value);
		}

		sp_unit_value = arr['sp_extent'];
		if (sp_unit_value) {
			$space.setAttribute('extent', sp_unit_value);
		}
		$teiParent.appendChild($space);

		return {
			0 : $space,
			1 : true
		};
	};

	/*
	 * type pc, return <pc>
	 */
	var html2Tei_pc = function(arr, $teiParent, $htmlNode) {
		//Fixed #1766
		var pre=$htmlNode.previousSibling;
		var next=$htmlNode.nextSibing;
		if(pre && pre.nodeName=='w'){
			pre.setAttribute('after','1');
		}
		if(next && next.nodeName=='w'){
			next.setAttribute('before','1');
		}
		
		var pc = $newDoc.createElement('pc');
		nodeAddText(pc,getDomNodeText($htmlNode));
		$teiParent.appendChild(pc);
		//appendNodeInW($teiParent, pc, $htmlNode);
		return {
			0 : pc,
			1 : true
		};
	};

	/*
	* type paratext, return <fw>, <num> or <note>
	*/
	// <fw type="STRING" place="STRING" rend="align(STRING)">...</fw> <num type="STRING" n="STRING" place="STRING" rend="align(STRING)">...</num> <div type="incipit"><ab>...</ab></div> <div type="explicit"><ab>...</ab></div>
	var html2Tei_paratext = function(arr, $teiParent, $htmlNode) {
		var newNodeName, fwType = arr['fw_type'];
			
		if (fwType == 'commentary' || fwType == 'ews' || fwType == 'lectionary-other') {
			newNodeName = 'note';
		} else if (fwType == 'chapNum' || fwType == 'AmmSec' || fwType == 'EusCan' || fwType == 'stichoi' || fwType == 'andrew') {
			newNodeName = 'num';
		} else if (fwType == 'runTitle' || fwType == 'chapTitle' || fwType == 'lectTitle' || fwType == 'colophon' 
			|| fwType == 'quireSig' || fwType == 'euthaliana' || fwType == 'gloss' || fwType == 'pageNum' 
			|| fwType == 'orn' || fwType == 'other') {
			newNodeName = 'fw';
		}
		if (fwType !== 'isolated') {
			var $paratext = $newDoc.createElement(newNodeName);
			fwType = (fwType == 'other') ? arr['fw_type_other'] : fwType;
			$paratext.setAttribute('type', fwType);
		}
		if (fwType == 'commentary' || fwType == 'lectionary-other') {
			if (arr['covered'] != '' && arr['covered'] > 0) { //Value of 0 handles as empty value
				for (var i = 0; i < arr['covered']; i++) {
					var $lb = $newDoc.createElement('lb');
					$teiParent.appendChild($lb);
					var $paratext = $newDoc.createElement(newNodeName);
					$paratext.setAttribute('type', fwType);
					if (fwType == 'commentary')
						nodeAddText($paratext, "One line of untranscribed commentary text");
					else
						nodeAddText($paratext, "One line of untranscribed lectionary text");
					$teiParent.appendChild($paratext);
				}
				//$paratext.setAttribute('rend', arr['covered']);
			} else { //no value for covered lines given
				var $paratext = $newDoc.createElement(newNodeName);
				$paratext.setAttribute('type', fwType);
				if (fwType == 'commentary')
					nodeAddText($paratext, "Untranscribed commentary text within the line");
				else
					nodeAddText($paratext, "Untranscribed lectionary text within the line");
				$teiParent.appendChild($paratext);
				//$paratext.setAttribute('rend', '0');
			}
			isSeg = false;
			return null;
		}
		
		// n
		// write attribute n only for certain values
		var numberValue = arr['number'];
		if (numberValue && (fwType == 'chapNum' || fwType == 'quireSig' || fwType == 'AmmSec' || fwType == 'EusCan' || fwType == 'stichoi' || fwType == 'andrew')) {
			$paratext.setAttribute('n', numberValue);
		}

		// place
		var placeValue = arr['paratext_position'];
		if (placeValue == 'other') {
			placeValue = arr['paratext_position_other'];
		}

		var rendValue = arr['paratext_alignment'];
		if (fwType != 'commentary' && fwType != 'ews' && fwType != 'lectionary-other'
			&& fwType != 'isolated' && rendValue && rendValue != '') {
			$paratext.setAttribute('rend', rendValue);
		}
		
		if (fwType == 'commentary') {
			nodeAddText($paratext, "One line of untranscribed commentary text");
			$teiParent.appendChild($paratext);
		} else if (fwType == 'lectionary-other') {
			nodeAddText($paratext, "One line of untranscribed lectionary text");
			$teiParent.appendChild($paratext);
		} else if (fwType == 'ews') {
			$paratext.setAttribute('type', 'editorial');
			$paratext.setAttribute('subtype', 'ews');
			nodeAddText($paratext, decodeURIComponent(arr['marginals_text']));
			$teiParent.appendChild($paratext);
			var $gap = $newDoc.createElement('gap');
			$gap.setAttribute('unit', 'verse');
			$gap.setAttribute('extent', 'rest');
			$teiParent.appendChild($gap);
		} else if (fwType == 'isolated') {
			var $seg;
			isSeg = true;
			if (placeValue === 'pageleft' || placeValue === 'pageright' || placeValue === 'pagetop' || placeValue === 'pagebottom') {//define <seg> element for marginal material
				$seg = $newDoc.createElement('seg');
				$seg.setAttribute('type', 'margin');
				$seg.setAttribute('subtype', placeValue);
				html2Tei_paratextAddChildren($seg, arr['marginals_text']);			
				$teiParent.appendChild($seg);
			} else if (placeValue === 'coltop' || placeValue === 'colbottom' || placeValue === 'colleft' || placeValue === 'colright') {
				$seg = $newDoc.createElement('seg');
				$seg.setAttribute('type', 'margin');
				$seg.setAttribute('subtype', placeValue);
				html2Tei_paratextAddChildren($seg, arr['marginals_text']);			
				$teiParent.appendChild($seg);
			} else if (placeValue === 'lineleft' || placeValue === 'lineright') {
				$seg = $newDoc.createElement('seg');
				$seg.setAttribute('type', 'margin');
				$seg.setAttribute('subtype', placeValue);
				html2Tei_paratextAddChildren($seg, arr['marginals_text']);			
				$teiParent.appendChild($seg);
			} else if (placeValue === 'above' || placeValue === 'below' || placeValue === 'here' || placeValue === 'overwritten') {
				$seg = $newDoc.createElement('seg');
				$seg.setAttribute('type', 'line');
				$seg.setAttribute('subtype', placeValue);
				html2Tei_paratextAddChildren($seg, arr['marginals_text']);			
				$teiParent.appendChild($seg);
			} else { // other
				$seg = $newDoc.createElement('seg');
				$seg.setAttribute('type', 'other');
				$seg.setAttribute('subtype', placeValue);
				html2Tei_paratextAddChildren($seg, arr['marginals_text']);			
				$teiParent.appendChild($seg);
			}
		} else { // only if not commentary nor other lections nor ews nor isolated
			isSeg = true;
			html2Tei_paratextAddChildren($paratext, arr['marginals_text']);			
			//nodeAddText($paratext, decodeURIComponent(arr['marginals_text']));
			var $seg;
			if (placeValue === '') {
				$teiParent.appendChild($paratext);
			} else if (placeValue === 'pageleft' || placeValue === 'pageright' || placeValue === 'pagetop' || placeValue === 'pagebottom') {//define <seg> element for marginal material
				$seg = $newDoc.createElement('seg');
				$seg.setAttribute('type', 'margin');
				$seg.setAttribute('subtype', placeValue);
				$seg.setAttribute('n', '@' + 'P' + g_pageNumber + '-' + g_witValue);
				$seg.appendChild($paratext);
				$teiParent.appendChild($seg);
			} else if (placeValue === 'coltop' || placeValue === 'colbottom' || placeValue === 'colleft' || placeValue === 'colright') {
				$seg = $newDoc.createElement('seg');
				$seg.setAttribute('type', 'margin');
				$seg.setAttribute('subtype', placeValue);
				$seg.setAttribute('n', '@' + 'P' + g_pageNumber + 'C' + g_columnNumber + '-' + g_witValue);
				$seg.appendChild($paratext);
				$teiParent.appendChild($seg);
			} else if (placeValue === 'lineleft' || placeValue === 'lineright') {
				$seg = $newDoc.createElement('seg');
				$seg.setAttribute('type', 'margin');
				$seg.setAttribute('subtype', placeValue);
				$seg.setAttribute('n', '@' + 'P' + g_pageNumber + 'C' + g_columnNumber + 'L' + g_lineNumber + '-' + g_witValue);
				$seg.appendChild($paratext);
				$teiParent.appendChild($seg);
			} else if (placeValue === 'above' || placeValue === 'below' || placeValue === 'here' || placeValue === 'overwritten') {
				$seg = $newDoc.createElement('seg');
				$seg.setAttribute('type', 'line');
				$seg.setAttribute('subtype', placeValue);
				$seg.setAttribute('n', '@' + 'P' + g_pageNumber + 'C' + g_columnNumber + 'L' + g_lineNumber + '-' + g_witValue);
				$seg.appendChild($paratext);
				$teiParent.appendChild($seg);
			} else {// other
				$seg = $newDoc.createElement('seg');
				$seg.setAttribute('type', 'other');
				$seg.setAttribute('subtype', placeValue);
				$seg.setAttribute('n', '@' + 'P' + g_pageNumber + 'C' + g_columnNumber + 'L' + g_lineNumber + '-' + g_witValue);
				$seg.appendChild($paratext);
				$teiParent.appendChild($seg);
			}
		}
		isSeg = false;
		return null;
	};

	/*
	 * type unclear, return <unclear_reason_STRING reason="STRING">...</unclear>
	 */
	var html2Tei_unclear = function(arr, $teiParent, $htmlNode) {
		//remove Dot Below
		var str=xml2String($htmlNode);
		str=str.replace(/\u0323/g,'');
		$htmlNode=loadXMLString(str).documentElement;
		
		var $unclear = $newDoc.createElement('unclear');
		var reasonValue = arr['unclear_text_reason'];
		if (reasonValue == 'other') {
			reasonValue = arr['unclear_text_reason_other'];
		}
		if (reasonValue && reasonValue != '') {
			$unclear.setAttribute('reason', decodeURIComponent(reasonValue));
		}
		/*var wce_orig=$htmlNode.getAttribute('wce_orig');
		if (wce_orig) {
			if (decodeURIComponent(wce_orig).indexOf('<span class="spaces"') == 0) // take care of spaces element
				//nodeAddText($unclear, decodeURIComponent(wce_orig));
				html2Tei_spaces(arr, $unclear, $htmlNode);
		}*/

		//if(wce_orig){  
		 //  	var tempDoc=loadXMLString("<temp>"+decodeURIComponent(wce_orig)+"</temp>");
		 //  	var	tempRoot=initHtmlContent(tempDoc.documentElement); 
		 //   appendNodeInW($teiParent, $unclear, tempRoot);
		//}else{
		appendNodeInW($teiParent, $unclear, $htmlNode);
	//}
		
		return {
			0 : $unclear,
		 	1 : true
		};
	};
	
	/*
	 * change text to TEI Node. Determine if the text with other nodes belonging to a word
	 */
	/*
	var html2Tei_TEXT = function($teiParent, $htmlNode, stopAddW) {
		var teiParentNodeName = $teiParent.nodeName;
		// text to ignore
		// text of unclear setup by html2Tei_unclear
		var nodeTextToIgnore = new Array('gap', 'app', 'gb', 'lb', 'cb', 'pb', 'abbr', 'unclear', 'ex', 'note');
		for (var i = 0, l = nodeTextToIgnore.length; i < l; i++) {
			if (teiParentNodeName == nodeTextToIgnore[i]) {
				return;
			}
		}

		var text = $htmlNode.nodeValue;
		
		// The spaces between the elements
		if ($.trim(text) == '@@@')
			return;

		if (stopAddW) {
			nodeAddText($teiParent, text);
			return;
		}

		// Text node is followed by a normal node
		var endIsSpace = endHasSpace(text);
		var arr = text.split(' ');

		for (var i = 0, str, l = arr.length; i < l; i++) {
			str = arr[i];
			if (!str || str == '') {
				continue;
			}

			// before create <w>,analyze the elements of the previousSibling
			var $w = createNewWElement();

			// we hit a text and check if there is an element at the third-last position in the tree with break="no"
			if (!final_w_set && (($teiParent && $teiParent.parentNode && $teiParent.parentNode.parentNode && $teiParent.parentNode.parentNode.previousSibling && $teiParent.parentNode.parentNode.previousSibling.previousSibling && $teiParent.parentNode.parentNode.previousSibling.previousSibling.previousSibling && $teiParent.parentNode.parentNode.previousSibling.previousSibling.previousSibling.nodeName === 'pb' && $teiParent.parentNode.parentNode.previousSibling.previousSibling.previousSibling.getAttribute("break") === "no"))) {
				// check if first string is the first word on a page after a hyphenation; final_w_found not needed
				$w.setAttribute("part", "F");
				final_w_set = true;
				// set attribute for corresponding <ab>
				$teiParent.setAttribute('part', 'F');
			}// check if this is the last word on a page and hyphenated
			else if ($htmlNode.parentNode.lastChild && $htmlNode.parentNode.lastChild.nodeType == 1 && !$htmlNode.nextSibling.nextSibling && $htmlNode.parentNode.lastChild.getAttribute("wce") && $htmlNode.parentNode.lastChild.getAttribute("wce").indexOf("break_type=lb") > -1 && $htmlNode.parentNode.lastChild.getAttribute("wce").indexOf("hasBreak=yes") > -1 && i == arr.length - 1) { //only valid for _last_ word of the last line
				$w.setAttribute("part", "I");
				// set part attribute for <w>
				if ($teiParent.nodeName == 'ab')// now set same attribute to parent <ab>; Check just for sure
					$teiParent.setAttribute('part', 'I');
			}
			nodeAddText($w, str.trim());
			//trim to avoid spurious blanks
			$teiParent.appendChild($w);

			// If it is the last element, and there are no spaces
			// To find the back of all connected elements, combined, and delete these elements
			// qqq aaa<b>bbb</b>cc c
			// result:... <w>aaa<h>bbb</h>ccc</w>
			// "aaabbbccc" is a word
			if (i == l - 1 && !endIsSpace && !startCompressionWord) {
				var $next = $htmlNode.nextSibling;
				startCompressionWord = true;
				while ($next) {
					// If it is the next normal node
					if ($next.nodeType == 1) {
						readAllHtmlNodes($w, $next, true);
						var $nnext = $next.nextSibling;
						// Delete elements to prevent re-added to the newDoc
						$next.parentNode.removeChild($next);
						if ($nnext) {
							$next = $nnext;
							continue;
						}
						$next = null;
					} else {
						// If it is a text node, get Content before spaces
						var nextText = $next.nodeValue;
						var ind = nextText.indexOf(" ");
						// If there are spaces, does not belong to the previous node, stop
						if (ind == 0) {
							break;
						}

						// add content before space, keep content after space
						if (ind > 0) {
							var subStr1 = nextText.substr(0, ind);
							var subStr2 = nextText.substr(ind, nextText.length);
							nodeAddText($w, subStr1);
							$next.nodeValue = subStr2;
							break;
						} else {
							// If there is no space in the middle, add all the content to the <w>
							nodeAddText($w, nextText);
						}

						// if end with space, stop
						if (endHasSpace(nextText)) {
							$next.parentNode.removeChild($next);
							break;
						} else {
							var $nnext = $next.nextSibling;
							$next.parentNode.removeChild($next);
							if ($nnext) {
								$next = $nnext;
								continue;
							}
							$next = null;
						}
					}
				}
				startCompressionWord = false;
			}
		}
	};*/

	/*
	 * type part_abbr, return <ex>
	 */
	var html2Tei_partarr = function(arr, $teiParent, $htmlNode) {
		var $ex = $newDoc.createElement('ex');
		var rend = arr['exp_rend'];
		if (rend == 'other') {
			rend = arr['exp_rend_other'];
		}
		if (rend && rend != '') {
			$ex.setAttribute('rend', decodeURIComponent(rend));
		}
		var textValue = getDomNodeText($htmlNode);
		if (textValue) {
			textValue = textValue.substr(1, textValue.length - 2);
			nodeAddText($ex, textValue);
		}
		$teiParent.appendChild($ex);
		return {
			0 : $ex,
			1 : true
		};
		
		/*
		if (!stopAddW) {
			var $w = createNewWElement();
			$w.appendChild($ex);
			$teiParent.appendChild($w);
		} else {
			$teiParent.appendChild($ex);
		}

		return {
			0 : $ex,
			1 : true
		}*/
	};

	/*
	 *
	 */
	var getType = function($htmlNode) {

	};

	/*
	 *
	 
	var createNewWElement = function() {
		var $w = $newDoc.createElement('w');
		//word number not needed as it is generated automatically later
		 //g_wordNumber++;
		 //$w.setAttribute('n', g_wordNumber);
		  
		return $w;
	};*/

	/*
	 * String converted into an array
	 */
	var strToArray = function(str) {
		if (!str)
			return null;
		var outArr = new Array();

		var arr0 = str.split('@');
		var p1, k0, v0, k1, v, v1, k2, v2, arr1, arr2;
		for (k0 in arr0) {
			v = arr0[k0];
			outArr[k0] = new Array();
			arr1 = v.split('&');
			for (p1 in arr1) {
				v1 = arr1[p1];
				arr2 = v1.split('=');
				if (arr2.length > 0) {
					k2 = arr2[0];
					v2 = arr2[1];
					try {
						outArr[k0][k2] = v2;
					} catch (e) {
						alert(e);
					}
				}
			}
		}
		return outArr;
	};

	return getTeiString();

};

/*
 * Compare two node by nodeName and attribute, but not textContent
 */
var compareNodes =function ($n1, $n2){
		if(!$n1 || !$n2){
			return false;
		}
		if($n1.nodeType==3 || $n2.nodeType==3){
			return false;
		}
		if($n1.nodeName!=$n2.nodeName){
			return false;
		}
		
		var atts1=$n1.attributes;
		var atts2=$n2.attributes;
		if(!atts1 && !atts2){
			return true;
		}
		
		if((atts1 && !atts2) || (!atts1 && atts2)){
			return false;
		}		 
		if(atts1.length!=atts2.length){
			return false;
		}
		
		for(var b, i=0, l=atts1.length; i<l; i++){
			b=false;
			for(var x=0,y=atts2.length;x<y; x++){
				if(atts1[i].nodeName==atts2[x].nodeName && atts1[i].value==atts2[x].value){
					b=true;
					continue;
				}
			}
			if(!b){
				return false;
			}
		}
		return true;
};	

/*
 * Is the string begins with a space
 */
var startHasSpace = function(str) {
	if (str.match(/^\s+/)) {
		return true;
	}
};

/*
 * Is the string end with a space
 */
var endHasSpace = function(str) {
	if (str.match(/\s+$/)) {
		return true;
	}
};

/*
 * load txt and generate DOM object
 */
function loadXMLString(txt) {
	var xmlDoc;
	if (window.DOMParser) {
		var parser = new DOMParser();
	 	try{
			xmlDoc = parser.parseFromString(txt, "text/xml");
		}catch(err){
		 	Fehlerbehandlung("XML error\n"+err);
		}
	} else {
		// Internet Explorer
		xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
		xmlDoc.async = false;
		xmlDoc.loadXML(txt);
	}
	return xmlDoc;
}

/*
 * Read xml file to generate the DOM object
 */
function loadXMLDoc(dname) {
	var xhttp;
	if (window.XMLHttpRequest) {
		xhttp = new XMLHttpRequest();
	} else {
		xhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xhttp.open("GET", dname, false);
	xhttp.send();
	return xhttp.responseXML;
}

/*
 * converted DOM into a string
 *
 */
function xml2String(xmlNode) {
	try {
		// Gecko- and Webkit-based browsers (Firefox, Chrome), Opera.
		return (new XMLSerializer()).serializeToString(xmlNode);
	} catch (e) {
		try {
			// Internet Explorer.
			return xmlNode.xml;
		} catch (e) {
			// Other browsers without XML Serializer
			alert('Xmlserializer not supported');
		}
	}
	return false;
}

/*
 * text or textContent
 */
function getDomNodeText($node) {
	var text = $node.text;
	if (!text) {
		text = $node.textContent;
	}
	return text;
}

/*
 * add text to a node
 */
function nodeAddText($node, str) {
	if (str) {
		$node.appendChild($node.ownerDocument.createTextNode(str));
	}
};

function addArrows(str) {
	var out = str;
	if (str.indexOf("x") == str.length-1)
		out = str.substring(0, str.length-1)+"→";
	else if (str.indexOf("y") == str.length-1)
		out = str.substring(0, str.length-1)+"↓";
	return out;
};

function removeArrows(str) {
	var out = str;
	if (str.indexOf("→") == str.length-1)
		out = str.substring(0, str.length-1) + "x";
	else if (str.indexOf("↓") == str.length-1 || str.indexOf("↑") == str.length-1) // Second one is just for compatibility
		out = str.substring(0, str.length-1) + "y";
	return out;
};

var removeBlankNode=function ($root){//remove blank node,
		var _remove=function($node){ 
			var nodeName=$node.nodeName;
			var notNames=['lb','pb','qb','cb','gap'];
			if($node.nodeType!=3 && !$node.firstChild && $.inArray(nodeName,notNames)<0){
				var parent=$node.parentNode;
				if (parent) {
					parent.removeChild($node);
					if(parent!=$root){
						_remove(parent); 
					}
				}
				return; 
			}  
			var temp = $node.childNodes;
			var childList=new Array(); 
			for (var i = 0, c, l = temp.length; i < l; i++) {
				c = temp[i];
				if (!c) {
					continue;
				} else {
					childList.push(c);
				}
			}
			for (var i = 0, c, l = childList.length; i < l; i++) {
				c = childList[i];
				if (!c) {
					continue;
				} else {
					_remove(c);
				}
			} 
				return; 
		}
		
		//read all child of $root
		var te = $root.childNodes;
		var cl=new Array(); 
		for (var i = 0, c, l = te.length; i < l; i++) {
			c = te[i];
			if (!c) {
				continue;
			} else {
				cl.push(c);
			}
		}
		for (var i = 0, c, l = cl.length; i < l; i++) {
				c = cl[i];
				if (!c) {
					continue;
				} else {
					_remove(c);
				}
		}  
		return $root;
	};
	
var removeSpaceAfterLb=function ($node){ 
		var nodeName=$node.nodeName;  
		if(nodeName && nodeName=='lb'){
			var toTrim=$node.getAttribute('break') && $node.getAttribute('break')=='no';
			if(!toTrim){
				var pre=$node.previousSibling;
				while(pre){
					if(pre.nodeType!=3){
						if(pre.getAttribute('break')&& pre.getAttribute('break')=='no'){
						toTrim=true;
						break;
						}
					}
					pre=pre.previousSibling;
				}
			}
			if(toTrim){
				var next=$node.nextSibling;
				if(next && next.nodeType==3){
					next.nodeValue=$.trim(next.nodeValue);
				}
			}
		}
		var temp = $node.childNodes;
		var childList=new Array(); 
		
		for (var i = 0, $c, l = temp.length; i < l; i++) {
			$c = temp[i];
			if (!$c) {
				continue;
			} else {
				childList.push($c);
			}
		}
		for (var i = 0, $c, l = childList.length; i < l; i++) {
			$c = childList[i];
			if (!$c) {
				continue;
			} else {
				removeSpaceAfterLb($c);
			}
		}
	};
