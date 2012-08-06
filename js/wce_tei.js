// getTEIXml
function getWceTei(inputString, gBookIndex) {
	if (!inputString || $.trim(inputString) == '')
		return '';

	var nodeNamesToSkip = [ 'pc', 'fw', 'num', 'note', 'unclear', 'supllied', 'abbr', 'w' ];

	var nodeNamesToCompress = [ 'unclear', 'gap', 'supplied', 'abbr', 'part_abbr', 'ex' ];

	var nodesToCompress = [];

	// TODO:
	var gBookIndex = 1;
	var gPage = 0;
	var gColumn = 0;
	var gWit = '?';

	var gIndex_s = 0;

	/*
	 * return String of TEI-Format XML
	 */
	var getXML = function() {
		inputString = '<TEMP><div><ab>' + inputString + '</ab></div></TEMP>';

		var $xml = loadXMLString(inputString);
		var $root = $xml.documentElement;
		transformNodes($root);
		compressNodes($root);

		// DOM to String
		var str = xml2String($root);
		if (!str)
			return '';

		str = str.substring(6, str.length - 7);
		return str;
	};

	/*
	 * load txt and generate DOM object
	 */
	var loadXMLString = function(txt) {
		if (window.DOMParser) {
			parser = new DOMParser();
			xmlDoc = parser.parseFromString(txt, "text/xml");
		} else {
			// Internet Explorer
			xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.async = false;
			xmlDoc.loadXML(txt);
		}
		return xmlDoc;
	};

	/*
	 * Read xml file to generate the DOM object
	 */
	var loadXMLDoc = function(dname) {
		if (window.XMLHttpRequest) {
			xhttp = new XMLHttpRequest();
		} else {
			xhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
		xhttp.open("GET", dname, false);
		xhttp.send();
		return xhttp.responseXML;
	};

	/*
	 * converted DOM into a string
	 * 
	 */
	var xml2String = function(xmlNode) {
		try {
			// Gecko- and Webkit-based browsers
			// (Firefox,
			// Chrome), Opera.
			return (new XMLSerializer()).serializeToString(xmlNode);
		} catch (e) {
			try {
				// Internet Explorer.
				return xmlNode.xml;
			} catch (e) {
				// Other browsers without XML
				// Serializer
				alert('Xmlserializer not supported');
			}
		}
		return false;
	};

	/*
	 * Get the first parentNode by name
	 */
	var getParentByName = function($node, na) {
		var $parent = $node.parentNode;
		while ($parent) {
			if ($parent.tagName == na) {
				return $parent;
			}
			$parent = $parent.parentNode;
		}
		return null;
	};

	/*
	 * Get node List of all Child
	 */
	var getChildNodeList = function(node) {
		var nodeList = node.childNodes;
		var curr;
		var temp = new Array();
		for ( var i = 0, l = nodeList.length; i < l; i++) {
			curr = nodeList.item(i);
			temp.push(curr);
		}

		return temp;
	};

	/*
	 * change all Node nodes
	 */
	var transformNodes = function($node) {
		if ($node.nodeType == 3) {
			transformText($node);
			return;
		}

		$node = changeNode($node);
		if ($node == null) {
			return;
		}
		if ($.inArray($node.nodeName, nodeNamesToSkip) > -1) {
			return;
		}

		var nodeList = getChildNodeList($node);
		var curr;
		for ( var i = 0, l = nodeList.length; i < l; i++) {
			curr = nodeList[i];
			if (curr == null) {
				continue;
			}
			transformNodes(curr);
		}
	};

	/*
	 * change text nodes
	 */
	var transformText = function($node) {
		var $xml = $node.ownerDocument;
		var str = $node.nodeValue;
		var first = last = false;
		if (str.match(/^\s+/)) {
			first = true;
		}
		if (str.match(/\s+$/)) {
			last = true;
		}

		var $parent = $node.parentNode;
		var arr = str.split(' ');
		var a;
		for ( var i = 0, l = arr.length; i < l; i++) {

			a = arr[i];
			if (a == '')
				continue;

			var $w = $xml.createElement('w');

			// wenn davor unmittelbar ein node ist
			if (first == false && i == 0 && $node.previousSibling != null) {
				if (!$node.previousSibling.getAttribute('_s')) {
					gIndex_s++;
					$node.previousSibling.setAttribute('_s', gIndex_s);
				}

				$w.setAttribute('_s', gIndex_s);
			}

			// wenn dahitern unmittelbar ein node
			// ist
			var $next = $node.nextSibling;
			if (last == false && i == l - 1 && $next && $next.nodeType != 3) {
				if (!$w.getAttribute('_s')) {
					gIndex_s++;
					$w.setAttribute('_s', gIndex_s + " a");
				}

				if (isNodeToCompress($next)) {
					$next.setAttribute('_s', gIndex_s);
				}
			}
			nodeAddText($w, a);
			$parent.insertBefore($w, $node);
		}
		$node.nodeValue = '';
	};

	/*
	 * 
	 */
	var isNodeToCompress = function($node) {
		if (!$node)
			return false;
		var _classText = $node.getAttribute('wce');
		if (_classText) {
			var _name;
			for ( var i = 0, l = nodeNamesToCompress.length; i < l; i++) {
				_name = nodeNamesToCompress[i];
				if (_classText.indexOf('__t=' + _name) > -1) {
					return true;
				}
			}
		}
		return false;
	};

	/*
	 * rename Node name
	 */
	var renameNodeName = function($oldNode, newName) {
		$xmlDoc = $oldNode.ownerDocument;
		var $newNode = $xmlDoc.createElement(newName);
		cloneChildren($oldNode, $newNode);
		$oldNode.parentNode.replaceChild($newNode, $oldNode);
		return $newNode;
	};

	/*
	 * Clone the child nodes
	 */
	var cloneChildren = function($parent, $newParent) {
		var $chn = $parent.childNodes;
		var $curr, $cc;
		for ( var i = 0, l = $chn.length; i < l; i++) {
			$curr = $chn.item(i);
			$cc = $curr.cloneNode(true);
			$newParent.appendChild($cc);
		}
	};

	var nodeAddText = function($node, str) {
		if (str) {
			$node.appendChild($node.ownerDocument.createTextNode(str));
		}
	};

	/*
	 * String converted into an array
	 */
	var strToArray = function(str) {
		var outArr = new Array();
		var arr0 = str.split('@');
		var k0, v0, k1, v1, k2, v2, arr1, arr2;
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

	// wenn node unclear gap supplied ... ist, set <w>
	var insertElementW = function($span, $newNode) {
		var $xml = $span.ownerDocument;
		var $w = $xml.createElement('w');
		$w.appendChild($newNode);

		if ($span.getAttribute('_s')) {
			$w.setAttribute('_s', $span.getAttribute('_s'));
		}

		return $w;
	};

	/*
	 * Element inside a word
	 */
	var compressNodes = function($node) {
		// alle w-node, die type-node integrieren
		if (!$node)
			return;

		$xml = $node.ownerDocument;

		getNodesToCompress($node);
		return;

		var s = 0, _s;
		var $n, $startNode;
		for ( var i = 0; i < nodesToCompress.length; i++) {
			$n = nodesToCompress[i];
			_s = $n.getAttribute('_s');
			$n.removeAttribute('_s');
			if (_s != s) {
				if ($n.nodeName == 'w') {
					$startNode = $n;
				} else {
					$startNode = null;
				}
				s = _s;
			} else if (_s > 0 && $startNode) {
				if ($n.nodeName == 'w') {
					removeChildFromTo($n, $startNode);
					$n.parentNode.removeChild($n);
				} else {
					// $startNode.appendChild($n);
				}
			}
		}
	};

	/*
	 * move all child nodes from x to y
	 */
	var removeChildFromTo = function($from, $to) {
		var list = $from.childNodes;
		var $curr;
		for ( var i = 0, l = list.length; i < l; i++) {
			$curr = list.item(i);
			$to.appendChild($c);
		}
	};

	/* Find all the nodes to be compress */
	var getNodesToCompress = function($node) {
		if ($node.nodeType != 3) {
			if ($node.getAttribute('_s'))
				nodesToCompress.push($node);
		}
		var list = $node.childNodes;
		var $curr;
		for ( var i = 0, l = list.length; i < l; i++) {
			$curr = list.item(i);
			getNodesToCompress($curr);
		}

	};

	/*
	 * html-node to TEI-XML-node
	 */
	var changeNode = function($node) {
		if ($node.nodeType == 3)
			return $node;

		var wceAttrValue = $node.getAttribute('wce');
		if (wceAttrValue == null || wceAttrValue == '') {
			return $node;
		}

		/* type: chapter_number, verse_number */
		switch (wceAttrValue) {
		case 'chapter_number':
			// <div type="chapter" n="B4K1">
			var $div = getParentByName($node, 'div');
			if ($div != null) {
				$div.setAttribute('type', 'chapter');
				var chapter_number = $node.childNodes[0].nodeValue;
				$div.setAttribute('n', 'B' + gBookIndex + 'K' + chapter_number);
			}

			var $ab = getParentByName($node, 'ab');
			if ($ab != null) {
				$ab.removeChild($node);
			}
			return null;

		case 'verse_number':
			var $ab = getParentByName($node, 'ab');
			if ($ab != null) {
				var verse_number = $node.childNodes[0].nodeValue;
				$ab.setAttribute('n', '???' + verse_number);
				$ab.removeChild($node);
			}
			return null;

		}

		// ******************** br
		// ********************
		if ($node.nodeName == 'br') {
			$node.parentNode.removeChild($node);
			return null;
		}

		/* other type */
		var infoArr = strToArray(wceAttrValue);
		if (infoArr == null) {
			return $node;
		}

		var type = '';
		var $xml = $node.ownerDocument;
		var $clone = $node.cloneNode(true);
		var $newNode;
		var arr;
		var xml_id;

		for ( var i = 0, l = infoArr.length; i < l; i++) {

			// ******************** corr
			// ********************
			// app und original einf¨¹gen
			arr = infoArr[i];
			xml_id = null;

			if (arr['__t'] === 'corr') {
				if (type == '') {
					type = 'corr';
					// new Element <app>
					$newNode = $xml.createElement('app');
					$node.parentNode.replaceChild($newNode, $node);

					// new Element <rdg>
					// <rdg type="orig"
					// hand="firsthand"><w
					// n="17">¦Á¦Ó¦Å¦Í¦É¦Æ¦Å¦Ó¦Á¦É</w>
					// <pc>?</pc></rdg>
					var $orig = $xml.createElement('rdg');
					$orig.setAttribute('type', 'orig');
					$orig.setAttribute('hand', 'firsthand');

					// all children to <rdg>
					// order <app><rdg>
					cloneChildren($clone, $orig);
					$newNode.appendChild($orig);
				}
				if ($newNode && type === 'corr') {
					// new Element<rdg>,child of <app>($newNode)
					var $rdg = $xml.createElement('rdg');
					$rdg.setAttribute('type', arr['reading']);
					$rdg.setAttribute('hand', arr['corrector_name']);

					// deletion
					var deletion = arr['deletion'];
					if (deletion != 'null' && deletion != '') {
						$rdg.setAttribute('deletion', deletion.replace(',', '+'));
					}
					// editorial_note
					var editorial_note = arr['editorial_note'];
					if (editorial_note != '') {
						var $note = $xml.createElement('note');
						$note.setAttribute('type', 'transcriber');
						var _line = '';// TODO
						xml_id = 'P' + gPage + 'C' + gColumn + 'L' + _line + '-' + gWit + '-1';
						$note.setAttribute('xml:id', xml_id);// TODO:
						nodeAddText($note, editorial_note);

						$newNode.parentNode.insertBefore($note, $newNode.nextSibling);
					}

					cloneChildren($clone, $rdg);
					var corrector_text = arr['corrector_text'];
					if (corrector_text) {
						// alert(decodeURIComponent(corrector_text));
						/*
						 * var nodeList = getChildNodeList($rdg); var curr; for(var j=0, k=nodeList.length; j<k; j++){ curr=nodeList[j]; if(curr.nodeType==3){ curr.nodeValue=corrector_text; } }
						 */
					}
					$newNode.appendChild($rdg);
				}
				continue;
			}

			// ******************** break
			// ********************
			/*
			 * break_type= lb / cb /qb / pb number= pb_type= running_title= lb_alignment=
			 */
			if (type == '' && arr['__t'].match(/brea/)) {
				// $index['lb']++;//TODO: attribute
				// n, hier nur
				// fuer automatisch
				/*
				 * Page (Collate |P 121|): <pb n="121" type="page" xml:id="P121-wit" /> Folio (Collate |F 3v|): <pb n="3v" type="folio" xml:id="P3v-wit" /> Column (Collate |C 2|): <cb n="2" xml:id="P3vC2-wit" /> Line (Collate |L 37|): <lb n="37" xml:id="P3vC2L37-wit" />
				 */
				var hadBreak = false;
				var breakNodeText = $node.text;
				if (breakNodeText && breakNodeText.substr(0, "&#45;".length) == "&#45;") {
					hadBreak = true;
				}

				var break_type = arr['break_type'];
				if (break_type == 'gb') {
					// special role of quire breaks
					$newNode = $xml.createElement('gb');
					$newNode.setAttribute('n', arr['number']);
				} else if (break_type) {
					// pb, cb, lb
					$newNode = $xml.createElement(break_type);
					switch (break_type) {
					case 'lb':
						$newNode.setAttribute('n', arr['number']);
						if (arr['lb_alignment'] != '') {
							$newNode.setAttribute('rend', arr['lb_alignment']);
						}
						xml_id = 'P' + gPage + 'C' + gColumn + 'L' + arr['number'] + '-' + gWit;
						break;
					case 'cb':
						var brea_column = arr['number'];
						$newNode.setAttribute('n', brea_column);
						xml_id = 'P' + gPage + 'C' + brea_column + '-' + gWit;
						break;
					case 'pb':
						// Decide whether folio
						// or page
						if (arr['pb_type'] != '' || arr['fibre_type'] != '') {
							// folio
							brea_page = arr['number'] + arr['pb_type'] + arr['fibre_type'];
							$newNode.setAttribute('n', brea_page);
							$newNode.setAttribute('type', 'folio');
						} else {
							// page
							brea_page = arr['number'];
							$newNode.setAttribute('n', brea_page);
							$newNode.setAttribute('type', 'page');
						}
						if (arr['facs'] != '') {
							// use URL for facs
							// attribute
							$newNode.setAttribute('facs', arr['facs']);
						}
						xml_id = 'P' + brea_page + '-' + gWit;
						break;
					}
					$newNode.setAttribute('xml:id', xml_id);
					if (hadBreak)
						$newNode.setAttribute('break', 'no');
				}
				$node.parentNode.replaceChild($newNode, $node);

				if (break_type == 'lb') {
					// for lb add newline
					$newNode.parentNode.insertBefore($xml.createTextNode("\n"), $newNode);
				} else if (break_type == 'pb') {
					// for pb add fw elements
					if (arr['running_title'] != '') {
						$secNewNode = $xml.createElement('fw');
						$secNewNode.setAttribute('type', 'runTitle');
						nodeAddText($secNewNode, arr['running_title']);
						$newNode.parentNode.insertBefore($secNewNode, $newNode.nextSibling);
					}
					if (arr['page_number'] != '') {
						$secNewNode = $xml.createElement('fw');
						$secNewNode.setAttribute('type', 'PageNum');
						nodeAddText($secNewNode, arr['page_number']);
						$newNode.parentNode.insertBefore($secNewNode, $newNode.nextSibling); // TODO
						// better
						// use
						// function
						// appendSibling
					}
				}
				continue;
			}

			// ******************** formatting
			// ********************
			/*
			 * __t=formatting_rubrication <hi rend="rubric">...</hi> __t=formatiing_gold <hi rend="gold">...</hi> __t=formatting_capitals <hi rend="cap" height="4">...</hi> __t=formatting_overlines <hi rend="ol">...</hi>
			 */
			if (type == '' && arr['__t'].match(/formatting/)) {
				$newNode = $xml.createElement('w');
				$hi = $xml.createElement('hi');
				$newNode.appendChild($hi);
				cloneChildren($clone, $hi);
				$formatting_rend = $formatting_height = '';

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
					formatting_rend = 'ol';
				}

				if (formatting_rend != '')
					$hi.setAttribute('rend', formatting_rend);

				if (formatting_height != '')
					$hi.setAttribute('height', formatting_height);

				$node.parentNode.replaceChild($newNode, $node);
				continue;
			}

			// ******************** gap
			// *******************
			/*
			 * wce_gap <gap OR <supplied source="STRING" _type_STRING type="STRING" _reason_STRING reason="STRING" _hand_STRING hand="STRING" _unit_STRING_extent_STRING unit="STRING" extent="STRING" />
			 */
			if (type == '' && arr['__t'] == 'gap') {
				if (arr['mark_as_supplied'] == 'supplied') {
					// <supplied>
					$newNode = $xml.createElement('supplied');
					var _supplied_source = arr['supplied_source'];
					if (_supplied_source && _supplied_source != '') {
						if (_supplied_source == 'other' && arr['supplied_source_other'])
							$newNode.setAttribute('source', arr['supplied_source_other']);
						else
							$newNode.setAttribute('source', _supplied_source);
					}
				} else {
					// <gap>
					$newNode = $xml.createElement('gap');
				}
				// reason
				if (arr['gap_reason']) {
					$newNode.setAttribute('reason', arr['gap_reason']);
				}

				// unit
				var _unit = arr['unit'];
				if (_unit != '') {
					if (_unit == 'other' && arr['unit_other']) {
						$newNode.setAttribute('unit', arr['unit_other']);
					} else {
						$newNode.setAttribute('unit', _unit);
					}
				}

				// extent
				if (arr['extent']) {
					$newNode.setAttribute('extent', arr['extent']);
				}

				if ($newNode.nodeName === 'supplied') {
					// add text
					var _nodeText = $node.text;
					if (_nodeText) {
						_nodeText = _nodeText.substr(1, _nodeText.length - 2);

						nodeAddText($newNode, _nodeText);

					}
					// $supp_words = explode(' ',
					// $newNode.nodeValue);
					// $array_size =
					// count($supp_words);
					// foreach($supp_word AS $w) {
					// for($i = 0; $i < $array_size;
					// $i++) {
					// //Split node value
					// into
					// words
					// $newNode.nodeValue = $w;
					// $newNode=insertElementW($xml,$node,$newNode);
					// //add <w>
					// $node.parentNode.replaceChild($newNode,
					// $node);
					// }
					$newNode = insertElementW($node, $newNode); // add
					// <w>
					$node.parentNode.replaceChild($newNode, $node);
				} else {
					$node.parentNode.replaceChild($newNode, $node);
				}
				continue;
			}

			// ******************** abbr
			// ********************
			/*
			 * abbr_nomenSacrum <abbr type="nomSac">...</abbr> abbr_nomenSacrum_Overline <abbr type="nomSac"><hi rend="ol">...</hi></abbr> abbr_numeral <abbr type="numeral">...</abbr> abbr_numeral_Overline <abbr type="numeral"><hi rend="ol">...</hi></abbr> abbr_STRING
			 * <abbr type="STRING">...</abbr> abbr_STRING_Overline <abbr type="STRING"><hi rend="ol">...<hi></abbr>
			 */
			if (type == '' && arr['__t'] === 'abbr') {

				$abbr = $xml.createElement('abbr');
				// type
				var _abbr_type = arr['abbr_type'];
				if (_abbr_type && _abbr_type != '') {
					if (_abbr_type == 'other')
						$abbr.setAttribute('type', arr['abbr_type_other']);
					else
						$abbr.setAttribute('type', _abbr_type);
				}

				if (arr['add_overline'] == 'overline') {
					$hi = $xml.createElement('hi');
					$hi.setAttribute('rend', 'ol');
					nodeAddText($hi, $node.text);
					$abbr.appendChild($hi);
				} else {
					nodeAddText($abbr, $node.text);
				}

				$newNode = insertElementW($node, $abbr);

				$node.parentNode.replaceChild($newNode, $node);
				continue;
			}

			// ******************** part_abbr
			// ******************
			/*
			 * <part_abbr> <ex>...</ex>
			 */
			if (type == '' && arr['__t'] === 'part_abbr') {
				var $part_abbr = $xml.createElement('ex');
				var _nodeText = $node.text;
				if (_nodeText) {
					_nodeText = _nodeText.substr(1, _nodeText.length - 2);

					nodeAddText($part_abbr, _nodeText);
				}
				$newNode = insertElementW($node, $part_abbr);

				$node.parentNode.replaceChild($newNode, $node);
				continue;
			}

			// ******************** unclear
			// ********************
			/*
			 * <unclear_reason_STRING reason="STRING">...</unclear>
			 */
			if (type == '' && arr['__t'] === 'unclear') {
				var $unclear = $xml.createElement('unclear');
				var _unclear_reason = arr['unclear_text_reason'];
				if (_unclear_reason == 'other') {
					_unclear_reason = arr['unclear_text_reason_other'];
				}
				if (_unclear_reason != '') {
					$unclear.setAttribute('reason', _unclear_reason);
				}
				if (arr['original_text']) {
					$unclear.text = arr['original_text'];
				}
				$newNode = insertElementW($node, $unclear);

				$node.parentNode.replaceChild($newNode, $node);
				continue;

			}

			// ******************** paratext
			// ********************
			/*
			 * <fw type="STRING" place="STRING" rend="align(STRING)">...</fw> <num type="STRING" n="STRING" place="STRING" rend="align(STRING)">...</num> <div type="incipit"><ab>...</ab></div> <div type="explicit"><ab>...</ab></div>
			 */
			if (type == '' && arr['__t'] === 'paratext') {

				var attr = '', paratextNodeName;
				if (arr['fw_type'].match(/num_/)) {
					// $paratextNodeName = 'fw';
					// //Fehler #85
					paratextNodeName = 'num';
					// attr = $currInfo['number'];
				} else if (arr['fw_type'].match(/fw_/)) {
					paratextNodeName = 'fw';
				} else {
					paratextNodeName = 'comm';
				}

				$newNode = $xml.createElement(paratextNodeName);

				switch (arr['fw_type']) {
				case 'commentary_text':
					type = 'commentary';
					break;
				case 'fw_pagenumber':
					type = 'pageNum';
					break;
				case 'num_chapternumber':
					type = 'chapNum';
					break;
				case 'fw_lecttitle':
					type = 'lectTitle';
					break;
				case 'fw_chaptertitle':
					type = 'chapTitle';
					break;
				case 'fw_colophon':
					type = 'colophon';
					break;
				case 'fw_quiresig':
					type = 'quireSig';
					break;
				case 'num_ammonian':
					type = 'AmmSec';
					break;
				case 'num_eusebian':
					type = 'EusCan';
					break;
				case 'fw_euthaliana':
					type = 'euthaliana';
					break;
				case 'fw_gloss':
					type = 'gloss';
					break;
				case 'num_stichoi':
					type = 'stichoi';
					break;
				}
				$newNode.setAttribute('type', type);

				attr = arr['number'];

				// write attribute n only for
				// certain values
				if (attr && (type == 'pageNum' || type == 'chapNum' || type == 'quireSig' || type == 'AmmSec' || type == 'EusCan' || type == 'stichoi')) {
					$newNode.setAttribute('n', attr);
				}

				// if ($newNode.nodeName === 'fw') {
				attr = arr['paratext_position'];
				attr_other = arr['paratext_position_other'];
				if (attr == 'other' && attr_other != '') {
					attr = attr_other;
				}
				if (attr) {
					$newNode.setAttribute('place', attr);
				}
				// }

				attr = arr['paratext_alignment'];
				if (attr) {
					$newNode.setAttribute('rend', attr);
				}

				nodeAddText($newNode, arr['text']);

				$node.parentNode.replaceChild($newNode, $node);
				continue;
			}

			// ******************** pc
			// ********************
			/*
			 * <pc>...</pc>
			 */
			// ohne w
			if (type == '' && arr['__t'] === 'pc') {
				$newNode = $xml.createElement('pc');
				nodeAddText($newNode, $node.text);
				$node.parentNode.replaceChild($newNode, $node);
				continue;
			}

			// ******************** space
			// ********************
			/*
			 * <space unit="STRING" extent="STRING" />
			 */
			// ohne w
			if (type == '' && arr['__t'] === 'spaces') {
				$newNode = $xml.createElement('space');

				var _attr = arr['sp_unit'];
				var _attr_other = arr['sp_unit_other'];
				if (_attr == 'other') {
					_attr = _attr_other;
				}
				if (_attr != '') {
					$newNode.setAttribute('unit', _attr);
				}

				_attr = arr['sp_extent'];
				if (_attr) {
					$newNode.setAttribute('extent', _attr);
				}

				$node.parentNode.replaceChild($newNode, $node);
				continue;
			}

			// ******************** supplied
			// ********************
			/*
			 * <supplied source="STRING" reason="STRING" agent="STRING>...</supplied> // ohne w if (type == '' && arr['__t'] === 'supplied') { continue; //TODO wie unclear in <w> $newNode = $xml.createElement('supplied'); $attr = arr['supplied_source']; $attr_other =
			 * arr['supplied_source_other']; if ($attr == 'other') { $attr = $attr_other; }
			 * 
			 * if ($attr != '') { $newNode.setAttribute('source', $attr); } // $attr = substr(arr['gap_reason'], 4); //to get just damage, hole etc. $attr_other = arr['gap_reason_other']; if ($attr == 'other') { //no sup_ because of substring $attr = $attr_other; } if ($attr !=
			 * '') { $newNode.setAttribute('reason', $attr); }
			 * 
			 * _copyChild($xml, $newNode, $clone);
			 * 
			 * $newNode=insertElementW($xml,$node,$newNode);
			 * 
			 * $node.parentNode.replaceChild($newNode, $node); continue; }
			 */

			// note
			/*
			 * 
			 */
			if (type == '' && arr['__t'] === 'note') {
				$newNode = $xml.createElement('note');
				var _attr = arr['note_type'];
				var _attr_other = arr['note_type_other'];
				if (_attr == 'other' && $attr_other != '') {
					_attr = _attr_other;
				}
				if (_attr != '') {
					$newNode.setAttribute('type', _attr);
				}

				/*
				 * // TODO: // numbering var _xml_id = $value['B'] + $value['K'] + $value['V'] + '-' + gWit + '-1';
				 * 
				 */
				var _xml_id = '_TODO_';

				$newNode.setAttribute('xml:id', _xml_id);

				nodeAddText($node, arr['note_text']);

				$node.parentNode.replaceChild($newNode, $node);

				// add <handshift/>
				if (arr['note_type'] == "changeOfHand") {
					var $secNewNode = $xml.createElement('handshift');
					$secNewNode.setAttribute('n', arr['newHand']);
					$newNode.parentNode.insertBefore($secNewNode, $newNode.nextSibling); // TODO
					// better use function
					// appendSibling
				}
				continue;
			}
		}
		// *** End for*/

		if ($newNode) {
			return $newNode;
		} else {
			return $node;
		}
	};

	return getXML();

};

