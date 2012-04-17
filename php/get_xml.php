<?php
error_reporting(E_ALL);
require_once('db.php');
//require_once('FirePHPCore/FirePHP.class.php');
//ob_start();
//$_GET['textname'] = '04-TRns-Unicode_test';
//$_GET['userid']=1;

if (!isset($_GET['textname']) || !isset($_GET['userid']))
die("no user and chapter number");

$sql = "SELECT * FROM `$user_tablname` WHERE `filename` LIKE '"
. $_GET['textname'] . "' AND `userid` LIKE '" . $_GET['userid']
. "' ORDER BY id ASC";
$res = dbRes($sql);

//create XML
$dom = new DOMDocument('1.0', 'UTF-8');
$dom->formatOutput = true;

//add root Node
$teiNode = $dom->createElement("TEI");
$teiNode->setAttribute('xmlns','http://www.tei-c.org/ns/1.0');
$teiNode->setAttribute('xmlns:xml','http://www.w3.org/XML/1998/namespace'); $teiNode->setAttribute('xmlns:xsi','http://www.w3.org/2001/XMLSchema-instance');
$teiNode->setAttribute('xsi:schemaLocation','http://www.tei-c.org/ns/1.0 tei-ntmss.xsd');
$dom->appendChild($teiNode);

$index = array();
$nodeNameToCompress=array('unclear','gap','supplied','abbr','part_abbr','ex');

$index['lb'] = -1;

while ($row = mysql_fetch_array($res)) {
	$bookIndex = $row['b'];
	$chapterIndex = $row['k'];
	$hadBreak = false;
	
	//Informationen von Korrekturen, Note ... usw

	$chapterContent = str_replace('&nbsp;', ' ', $row['text']);
	$chapterContent = str_replace('&om;', '', $chapterContent);
	$chapterContent = str_replace(chr(194).chr(160), ' ', $chapterContent);
	//$chapterContent = str_replace('&om;', '̄', $chapterContent);

	if ($row['head'] != '') { 
		$teiHeaderNode = $dom->createElement('teiHeader');

		$fileDesc = $dom->createElement('fileDesc');

		$titleStmt = $dom->createElement('titleStmt');
		$title = $dom->createElement('title');
		$titleStmt->appendChild($title);
		$fileDesc->appendChild($titleStmt);

		$editionStmt = $dom->createElement('editionStmt');
		$edition = $dom->createElement('edition');
		$editionStmt->appendChild($edition);
		$fileDesc->appendChild($editionStmt);

		$publicationStmt = $dom->createElement('publicationStmt');
		$publisher = $dom->createElement('publisher');
		$name = $dom->createElement('name');

		$date = $dom->createElement('date');
		$availability = $dom->createElement('availability');
		$p = $dom->createElement('p');

		$publisher->appendChild($name);
		$publicationStmt->appendChild($publisher);
		$publicationStmt->appendChild($date);
		$availability->appendChild($p);
		$publicationStmt->appendChild($availability);
		$fileDesc->appendChild($publicationStmt);

		$sourceDesc = $dom->createElement('sourceDesc');
		$msDesc = $dom->createElement('msDesc');
		$msIdentifier = $dom->createElement('msIdentifier');

		$msDesc->appendChild($msIdentifier);
		$sourceDesc->appendChild($msDesc);
		$fileDesc->appendChild($sourceDesc);

		$teiHeaderNode->appendChild($fileDesc);

		$encodingDesc = $dom->createElement('encodingDesc');
		$projectDesc = $dom->createElement('projectDesc');
		$p = $dom->createElement('p');
		$projectDesc->appendChild($p);
		$encodingDesc->appendChild($projectDesc);

		$editorialDecl = $dom->createElement('editorialDecl');
		$p = $dom->createElement('p');
		$editorialDecl->appendChild($p);

		$encodingDesc->appendChild($editorialDecl);
		$teiHeaderNode->appendChild($encodingDesc);

		$revisionDesc = $dom->createElement('revisionDesc');
		$change= $dom->createElement('change');
		$revisionDesc->appendChild($change);
		$teiHeaderNode->appendChild($revisionDesc);

		//$teiHeaderNode->appendChild($dom->createTextNode($row['head']));
		$teiNode->appendChild($teiHeaderNode);

		//the meta data export was removed
		/*
		$headXml = new DOMDocument();
	 	$headXml->loadXML($row['head']); 
		$headDoc= $headXml->documentElement;
		$teiHeader=$headXml->getElementsByTagName('teiHeader');
		if($teiHeader->length>0){  
			$header= $teiHeader->item(0);   
			$teiHeaderNode=$dom->importNode($header,true); 
			$teiNode->appendChild($teiHeaderNode); 
		}
		*/
		//text Node
		$textNode = $dom->createElement('text');
		$teiNode->appendChild($textNode);

		//body Node
		$bodyNode = $dom->createElement('body');
		$textNode->appendChild($bodyNode);

		//first pb Node
		$pbNode = $dom->createElement('pb');
		$bodyNode->appendChild($pbNode);

		//book Node
		$value['B'] = 'B' . $bookIndex;
		$bookNode = $dom->createElement('div');
		$bookNode = _addAttrNode($dom, $bookNode, 'type', 'book');
		/*if(trim($row['b'])!=''){
			$bookNode = _addAttrNode($dom, $bookNode, 'n', $row['b']);
		}*/
		$bookNode = _addAttrNode($dom, $bookNode, 'n', $value['B']);
		$bodyNode->appendChild($bookNode);
	} else {
		$chapterNode = $dom->importNode(_getChapterNode($chapterContent), true);
		$bookNode->appendChild($chapterNode);
	}

	/* 3 Stücke testen

	if ($count > 5)
	break;
	$count++; */
}
//Ein Element mit Attribute als KinderNote hinzufügen
function _addAttrNode($xml, $parentNode, $attrName, $attrValue) {
	$attrNode = $xml->createAttribute($attrName);
	$attrNode->appendChild($xml->createTextNode($attrValue));
	$parentNode->appendChild($attrNode);
	return $parentNode;
}
function _addText($xml, $parentNode, $text) {
	$parentNode->appendChild($xml->createTextNode($text));
	return $parentNode;
}

function _getChapterNode($str) {
	global $nodeNameToCompress;

	$xml = new DOMDocument();
	$str = str_replace('<span class="verse_number">',
			'</ab><ab><span class="verse_number">', $str);
	$str = '<div><ab>' . $str . '</ab></div>';
	$xml->loadXML($str);
	$chapterDivNode = $xml->documentElement;
	_setNodes($xml, $chapterDivNode);
	_compressNodes($xml,$chapterDivNode);

	_insertWordIndex($xml,false);

	return $chapterDivNode;
}

function _setNodes($xml, $node) {
	global $index;

	//wenn textNode
	if ($node->nodeType === XML_TEXT_NODE) {
		_changeText($xml, $node);
		return;
	}

	//wenn normale Node, ändern; keine Zerlegung in <w>...</w>
	$node = _changeNode($xml, $node);
	$notName=array('pc','fw','num','note','unclear','supplied','abbr','w');
	if ($node == null || in_array($node->nodeName,$notName))
	return;


	//alle childNode bearbeiten
	$temp_arr = array();
	foreach ($node->childNodes AS $c) {
		array_push($temp_arr, $c);
	}
	foreach ($temp_arr AS $c) {
		_setNodes($xml, $c);
	}
}

function _changeNode($xml, $node) {
	global $index,$value;
	/*
	 * wenn <span  class="chapter_number">id</span>
	* attribute von parentNode <div> definieren: type, n, xml:id ...
	* dann <span> entfernen
	*/
	$class = $node->getAttribute('class');
	if ($class === 'chapter_number') {
		//<div type="chapter"  n="B4K1">
		$ab = $node->parentNode;
		$div = $ab->parentNode;
		$div->setAttribute('type', 'chapter');
		$value['K'] = 'K' . trim($node->nodeValue);
		//$div->setAttribute('n', trim($node->nodeValue));
		$div->setAttribute('n', $value['B'] . $value['K']);
		$div->removeChild($ab);
		return null;
	}

	if ($class === 'verse_number') {
		//<ab n="B5K1V1">
		$ab = $node->parentNode;
		$value['V'] = 'V' . trim($node->firstChild->nodeValue);
		//$ab->setAttribute('n', trim($node->firstChild->nodeValue));
		$ab->setAttribute('n', $value['B'] . $value['K'] . $value['V']); //TODO
		$ab->removeChild($node);
		return null;
	}

	if ($node->nodeName === 'br') {
		$node->parentNode->removeChild($node);
		return null;
	}

	return _readOtherClass($xml, $node);

}

function _readOtherClass($xml, $node) {
	global $index, $value, $page, $column, $hadBreak;

	$arr = _classNameToArray($node);
	if ($arr == null)
	return $node;

	$type = '';
	$newNode = '';
	$clone = _cloneNode($xml, $node);
	foreach ($arr AS $a) {

		//******************** corr ********************
		//app und original einfügen
		if ($a['__t'] === 'corr') {
			if ($type == '') {
				$type = 'corr';
				$newNode = $xml->createElement('app');
				$node->parentNode->replaceChild($newNode, $node);
				//<rdg type="orig" hand="firsthand"><w n="17">ατενιζεται</w> <pc>?</pc></rdg>
				$orig = $xml->createElement('rdg');
				$orig->setAttribute('type', 'orig');
				$orig->setAttribute('hand', 'firsthand');
				_copyChild($xml, $orig, $clone);
				$newNode->nodeValue = '';
				$newNode->appendChild($orig);
					
				$temp_arr = array();
				foreach ($orig->childNodes AS $c) {
					array_push($temp_arr, $c);
				}
				foreach ($temp_arr AS $c) {
					if($c->nodeType===XML_TEXT_NODE)
					_changeText($xml,$c);
				}

			}
			if ($newNode != '' && $type === 'corr') {
				$rdg = $xml->createElement('rdg');
				$rdg->setAttribute('type', $a['reading']);
				$rdg->setAttribute('hand', $a['corrector_name']);
				/*if ($a['deletion'] != '')
					$rdg->setAttribute('deletion', $a['deletion']);
				*/
				if ($a['editorial_note'] != '') {
					$note = $xml->createElement('note');
					$note->setAttribute('type', 'transcriber');
					$note->nodeValue = $a['editorial_note'];
					$rdg->appendChild($note);
				}
				
				_copyChild($xml, $rdg, $clone);
				$newNode->appendChild($rdg);

				$temp_arr = array();
				foreach ($rdg->childNodes AS $c) {
					//set corrector_text as node value
					if ($c->nodeType===XML_TEXT_NODE)
						$c->nodeValue=$a['corrector_text'];
					array_push($temp_arr, $c);
				}
				foreach ($temp_arr AS $c) {
					if($c->nodeType===XML_TEXT_NODE)
					_changeText($xml,$c);
				}
					
			}
			continue;
		}

		//******************** break ********************
		/*
		 break_type= lb / cb /qb / pb
		number=
		pb_type=
		running_title=
		lb_alignment=
		*/
		if ($type == '' && preg_match('/brea/', $a['__t'])) {
			//$index['lb']++;//TODO: attribute n, hier nur fuer automatisch
			/*
			 Page (Collate |P 121|): <pb n="121" type="page" xml:id="P121-wit" />
			Folio (Collate |F 3v|): <pb n="3v" type="folio" xml:id="P3v-wit" />
			Column (Collate |C 2|): <cb n="2" xml:id="P3vC2-wit" />
			Line (Collate |L 37|): <lb n="37" xml:id="P3vC2L37-wit" />
			*/
			if (substr($node->nodeValue, 0, strlen('&hyphen;')) == "&hyphen;")
				$hadBreak=true;
			else
				$hadBreak=false;
			
			if ($a['break_type'] == 'gb') { //special role of quire breaks
				$newNode = $xml->createElement('gb');
				$newNode->setAttribute('n', $a['number']);
			}
			else { // pb, cb, lb
				$newNode = $xml->createElement($a['break_type']);
				switch ($a['break_type']) {
					case 'lb':
						$newNode->setAttribute('n', $a['number']);
						$xml_id='P'.$page.'C'.$column.'L'.$a['number'];
					break;
					case 'cb':
						$column=$a['number'];
						$newNode->setAttribute('n', $column);
						$xml_id='P'.$page.'C'.$column;
					break;
					case 'pb':
						//Decide whether folio or page
						if ($a['pb_type']!='' || $a['fibre_type']!='') { //folio
							$page=$a['number'].$a['pb_type'].$a['fibre_type'];
							$newNode->setAttribute('n', $page);
							$newNode->setAttribute('type', 'folio');
						} else { //page
							$page=$a['number'];
							$newNode->setAttribute('n', $page);
							$newNode->setAttribute('type', 'page');
						}
						$xml_id='P'.$page;
					break;
				}
				$newNode->setAttribute('xml:id', $xml_id);
				if (hadBreak)
					$newNode->setAttribute('break', 'no');
			}
			$node->parentNode->replaceChild($newNode, $node);
			continue;
		}


		//******************** formatting ********************
		/*
		__t=formatting_rubrication	<hi rend="rubric">...</hi>
		__t=formatiing_gold		<hi rend="gold">...</hi>
		__t=formatting_capitals		<hi rend="cap" height="4">...</hi>
		__t=formatting_overlines	<hi rend="ol">...</hi>
		*/
		if ($type == '' && preg_match('/formatting/', $a['__t'])) {
			$newNode = $xml->createElement('w');
			$hi = $xml->createElement('hi');
			$newNode->appendChild($hi);
			_copyChild($xml, $hi, $clone);
			$formatting_rend = $formatting_height = '';

			switch ($a['__t']) {
				case 'formatting_rubrication':
					$formatting_rend = 'rubric';
					break;

				case 'formatting_gold':
					$formatting_rend = 'gold';
					break;
				
				case 'formatting_blue':
					$formatting_rend = 'blue';
					break;
				
				case 'formatting_green':
					$formatting_rend = 'green';
					break;
				
				case 'formatting_yellow':
					$formatting_rend = 'yellow';
					break;
				
				case 'formatting_other':
					$formatting_rend = 'other';
					break;
							
				case 'formatting_capitals':
					$formatting_rend = 'cap';
					$formatting_height = $a['height'];
					break;
				case 'formatting_overline':
					$formatting_rend = 'ol';
			}

			if ($formatting_rend != '')
			$hi->setAttribute('rend', $formatting_rend);

			if ($formatting_height != '')
			$hi->setAttribute('height', $formatting_height);

			$node->parentNode->replaceChild($newNode, $node);
			continue;
		}

		//******************** gap *******************
		/*
		 wce_gap							<gap OR <supplied source="STRING"
		_type_STRING				  type="STRING"
		_reason_STRING			      reason="STRING"
		_hand_STRING			      hand="STRING"
		_unit_STRING_extent_STRING	  unit="STRING" extent="STRING"
		/>
		*/
		if ($type == '' && $a['__t'] === 'gap') {
			if ($a['mark_as_supplied'] === 'supplied') {
				//<supplied>
				$newNode = $xml->createElement('supplied');
				if ($a['supplied_source'] != '') {
					if ($a['supplied_source'] == 'other')
					$newNode->setAttribute('source', $a['supplied_source_other']);
					else
					$newNode->setAttribute('source', $a['supplied_source']);
				}
			} else { //<gap>
				$newNode = $xml->createElement('gap');
			}
			//reason
			if ($a['gap_reason'] != '') {
				if ($a['gap_reason'] == 'other')
					$newNode->setAttribute('reason', $a['gap_reason_other']);
				else
					$newNode->setAttribute('reason', $a['gap_reason']);
			}
			//unit
			if ($a['unit'] != '') {
				if ($a['unit'] == 'other')
				$newNode->setAttribute('unit', $a['unit_other']);
				else
				$newNode->setAttribute('unit', $a['unit']);
			}
			//extent
			if ($a['extent'] != '') {
				$newNode->setAttribute('extent', $a['extent']);
			}

			if ($newNode->nodeName === 'supplied') {
				//add text
				$newNode->nodeValue = substr($node->nodeValue, 1, -1);
			}

			$newNode=_insertElementW($xml,$node,$newNode);

			$node->parentNode->replaceChild($newNode, $node);
			continue;
		}

		//******************** abbr ********************
		/*  abbr_nomenSacrum		<abbr type="nomSac">...</abbr>
		 abbr_nomenSacrum_Overline	<abbr type="nomSac"><hi rend="ol">...</hi></abbr>
		abbr_numeral		<abbr type="numeral">...</abbr>
		abbr_numeral_Overline	<abbr type="numeral"><hi rend="ol">...</hi></abbr>
		abbr_STRING			<abbr type="STRING">...</abbr>
		abbr_STRING_Overline	<abbr type="STRING"><hi rend="ol">...<hi></abbr>
		*/
		if ($type == '' && $a['__t'] === 'abbr') {

			$abbr = $xml->createElement('abbr');
			//type
			if ($a['abbr_type'] != '') {
				if ($a['abbr_type'] == 'other')
					$abbr->setAttribute('type', $a['abbr_type_other']);
				else
					$abbr->setAttribute('type', $a['abbr_type']);
			}

			if ($a['add_overline'] == 'overline') {
				$hi = $xml->createElement('hi');
				$hi->setAttribute('rend', 'ol');
				$hi->nodeValue = $node->nodeValue;
				$abbr->appendChild($hi);
			} else {
				$abbr->nodeValue = $node->nodeValue;
			}

			$newNode=_insertElementW($xml,$node,$abbr);

			$node->parentNode->replaceChild($newNode, $node);
			continue;
		}

		//******************** part_abbr ******************
		/*
		 <part_abbr>					<ex>...</ex>
		*/
		if ($type == '' && $a['__t'] === 'part_abbr') {
			$part_abbr = $xml->createElement('ex');
			$part_abbr->nodeValue = substr($node->nodeValue, 1, -1);
				
			$newNode=_insertElementW($xml, $node,$part_abbr);
				
			$node->parentNode->replaceChild($newNode, $node);
			continue;
		}

		//******************** unclear ********************
		/*
		 <unclear_reason_STRING			 reason="STRING">...</unclear>
		*/
		if ($type == '' && $a['__t'] === 'unclear') {
			$unclear = $xml->createElement('unclear');
			$unclear_reason = $a['unclear_text_reason'];
			if ($unclear_reason == 'other') {
				$unclear_reason = $a['unclear_text_reason_other'];
			}
			if ($unclear_reason != '') {
				$unclear->setAttribute('reason', $unclear_reason);
			}
			$unclear->nodeValue = $a['original_text'];

			$newNode=_insertElementW($xml, $node,$unclear);

			$node->parentNode->replaceChild($newNode, $node);
			continue;

		}

		//******************** paratext ********************
		/*
		 <fw type="STRING"	 place="STRING" rend="align(STRING)">...</fw>
		<num type="STRING" n="STRING" place="STRING" rend="align(STRING)">...</num>
		<div type="incipit"><ab>...</ab></div>
		<div type="explicit"><ab>...</ab></div>
		*/
		if ($type == '' && $a['__t'] === 'paratext') {

			$attr = '';
			if (preg_match('/num_/', $a['fw_type'])) {
				//$paratextNodeName = 'fw'; //Fehler #85
				$paratextNodeName = 'num'; 
				//$attr = $currInfo['number'];
			} else {
				$paratextNodeName = 'fw';
			}
			
			$newNode = $xml->createElement($paratextNodeName);

			switch ($a['fw_type']) {
				case 'fw_pagenumber':
					$type = 'pageNum';
					break;
				case 'num_chapternumber':
					$type = 'chapNum';
					break;
				case 'fw_lecttitle':
					$type = 'lectTitle';
					break;
				case 'fw_chaptertitle':
					$type = 'chapTitle';
					break;
				case 'fw_colophon':
					$type = 'colophon';
					break;
				case 'fw_quiresig':
					$type = 'quireSig';
					break;
				case 'num_ammonian':
					$type = 'AmmSec';
					break;
				case 'num_eusebian':
					$type = 'EusCan';
					break;
				case 'fw_euthaliana':
					$type = 'euthaliana';
					break;
				case 'fw_gloss':
					$type = 'gloss';
					break;
			}
			$newNode->setAttribute('type', $type);
			
			$attr = $a['number'];
			
			// write attribute n only for certain values
			if ($attr != '' && ($type == 'pageNum' || $type == 'chapNum' || $type == 'quireSig' || $type == 'AmmSec' || $type == 'EusCan')) {
				$newNode->setAttribute('n', $attr);
			}

			if ($newNode->nodeName === 'fw') {
				$attr = $a['paratext_position'];
				$attr_other = $a['paratext_position_other'];
				if ($attr == 'other' && $attr_other != '') {
					$attr = $attr_other;
				}
				if ($attr != '') {
					$newNode->setAttribute('place', $attr);
				}
			}

			$attr = $a['paratext_alignment'];
			if ($attr != '') {
				$newNode->setAttribute('rend', $attr);
			}

			$attr = $a['text'];
			if ($attr != '') {
				//_addText($xml, $newNode, $attr);
				$newNode->nodeValue = $attr;
			}

			$node->parentNode->replaceChild($newNode, $node);
			continue;
		}

		//******************** pc ********************
		/*
		 <pc>...</pc>
		*/
		// ohne w
		if ($type == '' && $a['__t'] === 'pc') {
			$newNode = $xml->createElement('pc');
			_addText($xml, $newNode, $node->nodeValue);
			$node->parentNode->replaceChild($newNode, $node);
			continue;
		}

		//******************** space ********************
		/*
		 <space unit="STRING" extent="STRING" />
		*/
		// ohne w
		if ($type == '' && $a['__t'] === 'spaces') {
			$newNode = $xml->createElement('space');

			$attr = $a['sp_unit'];
			$attr_other = $a['sp_unit_other'];
			if ($attr == 'other') {
				$attr = $attr_other;
			}
			if ($attr != '') {
				$newNode->setAttribute('unit', $attr);
			}

			$attr = $a['sp_extent'];
			if ($attr != '') {
				$newNode->setAttribute('extent', $attr);
			}

			$node->parentNode->replaceChild($newNode, $node);
			continue;
		}

		//******************** supplied ********************
		/*
		 <supplied source="STRING"  reason="STRING"  agent="STRING>...</supplied>
		// ohne w
		if ($type == '' && $a['__t'] === 'supplied') {
			continue; //TODO wie unclear in <w>
			$newNode = $xml->createElement('supplied');
			$attr = $a['supplied_source'];
			$attr_other = $a['supplied_source_other'];
			if ($attr == 'other') {
				$attr = $attr_other;
			}

			if ($attr != '') {
				$newNode->setAttribute('source', $attr);
			}

			//
			$attr = substr($a['gap_reason'], 4); //to get just damage, hole etc.
			$attr_other = $a['gap_reason_other'];
			if ($attr == 'other') {
				//no sup_ because of substring
				$attr = $attr_other;
			}
			if ($attr != '') {
				$newNode->setAttribute('reason', $attr);
			}

			_copyChild($xml, $newNode, $clone);

			$newNode=_insertElementW($xml,$node,$newNode);

			$node->parentNode->replaceChild($newNode, $node);
			continue;
		}
		*/
		
		// note
		/*

		*/
		if ($type == '' && $a['__t'] === 'note') {
			$newNode = $xml->createElement('note');
			$attr = $a['note_type'];
			$attr_other = $a['note_type_other'];
			if ($attr == 'other' && $attr_other != '') {
				$attr = $attr_other;
			}
			if ($attr != '') {
				$newNode->setAttribute('type', $attr);
			}

			$newNode->setAttribute('xml:id', $value['B'] . $value['K'] . $value['V'] . '-wit-1'); //TODO

			$attr = $a['note_text'];
			if ($attr != '') {
				$newNode->nodeValue = $attr;
			}
			$node->parentNode->replaceChild($newNode, $node);
			continue;
		}

	}//foreach ende

	if ($newNode != '')
	return $newNode;
	else
	return $node;
}

function _changeText($xml, $node) {
	global $index, $nodeNameToCompress;

	$str = $node->nodeValue;
	if(preg_match('/^\s+/',$str)){
		$first=true;
	}
	if(preg_match('/\s+$/',$str)){
		$last=true;
	}

	$parent = $node->parentNode;
	$arr = explode(' ', ($str));
	$newIndex=-1;
	for($i=0; $i<count($arr); $i++) {
		$a=$arr[$i];
		if ($a == '')
		continue;

		$w = $xml->createElement('w');

		//wenn davor unmittelbar ein node ist
		if($first==false  && $i==0 && $node->previousSibling!=null){
			if(!$node->previousSibling->hasAttribute('_s')){
				$index['s']++;
				$node->previousSibling->setAttribute('_s',$index['s']);
			}

			$w->setAttribute('_s', $index['s']);
		}

		//wenn dahitern unmittelbar ein node ist
		$next=$node->nextSibling;
		if($last==false && $i==count($arr)-1 && $next!=null && $next->nodeType!=XML_TEXT_NODE) {
			if(!$w->hasAttribute('_s')){
				$index['s']++;
				$w->setAttribute('_s', $index['s']);
			}
				
			if(_isNodeToCompress($next) ){
				$next->setAttribute('_s', $index['s']);
			}
		}

		_addText($xml, $w, $a);
		$parent->insertBefore($w, $node);

	}
	$node->nodeValue = '';
}

function _copyChild($xml, $new, $old) {
	if ($new == null) {
		$new = $xml->createElement($old->nodeName);
		foreach ($old->attributes as $value)
		$new->setAttribute($value->nodeName, $value->value);
	}

	foreach ($old->childNodes AS $c) {
		if ($c->nodeType == XML_TEXT_NODE) {
			$new->appendChild($xml->createTextNode($c->nodeValue));
		} else {
			$new->appendChild(_copyChild($xml, null, $c));
		}
	}
	return $new;
}

function _classNameToArray($node) {
	if ($node->nodeType === XML_TEXT_NODE)
	return null;

	$class = $node->getAttribute('class');
	if ($class == '' || $class == 'chapter_number' || $class == 'verse_number')
	return null;

	$out = array();
	$arr0 = explode('@', $class);
	foreach ($arr0 AS $i => $v0) {
		$arr1 = explode('&', $v0);
		foreach ($arr1 AS $v1) {
			$arr2 = explode('=', $v1);
			if (count($arr2) > 0) {
				$out[$i][$arr2[0]] = urldecode($arr2[1]);
			}
		}
	}
	return $out;
}

function _cloneNode($xml, $node) {
	$nd = $xml->createElement($node->nodeName);

	foreach ($node->attributes as $value)
	$nd->setAttribute($value->nodeName, $value->value);

	if (!$node->childNodes)
	return $nd;

	foreach ($node->childNodes as $child) {
		if ($child->nodeName == "#text")
		$nd->appendChild($xml->createTextNode($child->nodeValue));
		else
		$nd->appendChild(_cloneNode($xml, $child));
	}

	return $nd;
}


function _isNodeToCompress($node){
	global $nodeNameToCompress;
	if($node!=null && $node->getAttribute('class')!=null){
		foreach($nodeNameToCompress AS $name){
			if(preg_match('/^__t='.$name.'/',$node->getAttribute('class'))){
				return true;
			}
		}
	}

	return false;
}

function _compressNodes($xml,$node){
	//alle w-node, die type-node integrieren
	global $nodesToCompress;
	$nodesToCompress=array();
	_getNodesToCompress($node);

	$s=0;
	$start=false;

	foreach($nodesToCompress AS $n){
		$t=$n->getAttribute('_s');
		$n->removeAttribute('_s');
		if($t!=$s){
			if($n->nodeName=='w'){
				$startNode=$n;
			}else{
				$startNode=null;
			}
			$s=$t;
		}else if($t>0 && $startNode!=null){
			if($n->nodeName==='w'){
				_removeChild($n,$startNode);
				$n->parentNode->removeChild($n);
			}else  {
				//$startNode->appendChild($n);
			}
		}

	}
}

function _insertWordIndex($node,$isRdg){
	global $index;

	if($node->nodeType===XML_TEXT_NODE)
	return;

	$name=$node->nodeName;

	if($name==='w'){
		if(!$isRdg){
			$index['w']=$index['w']+$index['rdg_w'];
			$index['rdg_w']=0;
			$index['w']++;
			/* Word counting temporarly disabled
			$node->setAttribute('n',$index['w']);
			*/
		}else{
			$index['rdg_w']++;
			/* Word counting temporarly disabled
			$node->setAttribute('n',$index['rdg_w']+$index['w']);
			*/
		}

	}else if($name=='ab'){
		$index['w']=0;
	}else if($name=='rdg'){
		$index['rdg_w']=0;
		$isRdg=true;
	}

	foreach($node->childNodes AS $n){
		/* Word counting temporarly disabled
		_insertWordIndex($n,$isRdg); 
		*/
	}
}

function _removeChild($from,$to){
	foreach($from->childNodes AS $c){
		$to->appendChild($c);
	}
}

//wenn node unclear gap supplied ... ist,  set <w>
function _insertElementW($xml, $span,$newNode){
	$w = $xml->createElement('w');
	$w->appendChild($newNode);

	if($span->hasAttribute('_s')){
		$w->setAttribute('_s', $span->getAttribute('_s'));
	}

	return $w;
}

//
function _getNodesToCompress($node){
	global $nodesToCompress;
	if($node->nodeType!=XML_TEXT_NODE){
		if($node->hasAttribute('_s'))
		array_push($nodesToCompress,$node);
	}

	foreach ($node->childNodes AS $c) {
		_getNodesToCompress($c);
	}
}


//Ausgabe als XML-Datei
function xmlExport($xml) {
	ob_start();
	$today = date("Y_m_d_H_i_s");
	header("Content-Type: application/octet-stream ; charset=UTF-8");
	header("Content-Disposition: attachment; filename=wce_" . $today . ".xml");
	echo $xml->saveXML();
	ob_end_flush();
}



/* Ausgabe im Browser anzeigen */
//  echo $dom->saveXML();

/* Ausgabe als XML-Datei */
xmlExport($dom);

?>