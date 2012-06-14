tinymce.getWceXml = function(inputString, gBookIndex) {

	// TODO:
	var gBookIndex = 1;
	var gPage = 0;
	var gColumn = 0;
	var gWit = '?';

	if (!inputString || $.trim(inputString) == '')
		return '';

	var index_s = 0;

	/*
	 * 返回xml的字符串
	 */
	var getXML = function() {
		inputString = '<TEMP><div><ab>' + inputString + '</ab></div></TEMP>';

		var $xml = loadXMLString(inputString);
		var $root = $xml.documentElement;
		setNodes($root);

		// DOM to String
		var str = xml2String($root);
		if (!str)
			return '';

		str = str.substring(6, str.length - 7);
		return str;
	};

	/*
	 * 导入文本内容生成DOM对象
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
	}

	/*
	 * 读取xml文件生成DOM 对象
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
	}

	/*
	 * DOM 转换成字符串
	 * 
	 */
	var xml2String = function(xmlNode) {
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
	 * 获取第一个符合名字的parentNode
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
	}

	/*
	 * 获取节点的所有Child的Liste, 用于遍历
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
	}

	/*
	 * 处理每个NODE节点
	 */
	var setNodes = function($root) {
		if ($root.nodeType == 3) {
			changeText($root);
			return;
		}

		$root = changeNode($root);
		if ($root == null) {
			return;
		}

		var nodeList = getChildNodeList($root);
		var curr;
		for ( var i = 0, l = nodeList.length; i < l; i++) {
			curr = nodeList[i];
			if (curr == null) {
				continue;
			}
			setNodes(curr);
		}
	};

	/*
	 * 处理文本节点
	 */
	var changeText = function($node) {
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
		var newIndex = -1;
		var a;
		for ( var i = 0, l = arr.length; i < l; i++) {
			a = arr[i];
			if (a == '')
				continue;

			var $w = $xml.createElement('w');

			// wenn davor unmittelbar ein node ist
			if (first == false && i == 0 && $node.previousSibling != null) {
				if (!$node.previousSibling.getAttribute('_s')) {
					index_s++;
					$node.previousSibling.setAttribute('_s', index_s);
				}

				$w.setAttribute('_s', index_s);
			}

			// wenn dahitern unmittelbar ein node ist
			var $next = $node.nextSibling;
			if (last == false && i == arr.length - 1 && $next != null
					&& $next.nodeType != 3) {
				if (!$w.getAttribute('_s')) {
					index_s++;
					$w.setAttribute('_s', index_s);
				}

				if (_isNodeToCompress($next)) {
					$next.setAttribute('_s', index_s);
				}
			}

			$w.appendChild($xml.createTextNode(a));
			$parent.insertBefore($w, $node);

		}
		$node.nodeValue = '';
	}

	var _isNodeToCompress = function($node) {

		// TODO
		return false;
	}

	/*
	 * 重命名节点
	 */
	var renameNodeName = function($oldNode, newName) {
		$xmlDoc = $oldNode.ownerDocument;
		var $newNode = $xmlDoc.createElement(newName);
		cloneChildren($oldNode, $newNode);
		$oldNode.parentNode.replaceChild($newNode, $oldNode);
		return $newNode;
	}

	/*
	 * 克隆子节点
	 */
	var cloneChildren = function($parent, $newParent) {
		var $chn = $parent.childNodes;
		var $curr, $nnn;
		for ( var i = 0, l = $chn.length; i < l; i++) {
			$curr = $chn.item(i);
			$nnn = $curr.cloneNode(true);
			$newParent.appendChild($nnn);
		}
	}

	/*
	 * 字符串转换成数组
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
	}

	var _insertElementW = function($span, $newNode) {
		var $xml = $span.ownerDocument;
		var $w = $xml.createElement('w');
		$w.appendChild($newNode);

		if ($span.getAttribute('_s')) {
			$w.setAttribute('_s', $span.getAttribute('_s'));
		}

		return $w;
	}

	/*
	 * 处理节点成TEI的元素
	 */
	var changeNode = function($node) {
		if ($node.nodeType == 3)
			return $node;

		var classValue = $node.getAttribute('class');
		if (classValue == null || classValue == '') {
			return $node;
		}

		/* type: chapter_number, verse_number, br */
		switch (classValue) {
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

		case 'br':
			$node.parentNode.removeChild($node);
			return null;
		}

		/* other type */
		var infoArr = strToArray(classValue);
		if (infoArr == null) {
			return $node;
		}

		var type = '';
		var $xml = $node.ownerDocument;
		var $clone = $node.cloneNode(true);
		var $newNode;
		var arr;
		for ( var i = 0, l = infoArr.length; i < l; i++) {
			
			// ******************** corr ********************
			// app und original einfügen
			arr = infoArr[i];
			if (arr['__t'] === 'corr') {
				if (type == '') {
					type = 'corr';
					// 新建<app>
					$newNode = $xml.createElement('app');
					$node.parentNode.replaceChild($newNode, $node);

					// 新建<rdg>
					// <rdg type="orig" hand="firsthand"><w
					// n="17">ατενιζεται</w>
					// <pc>?</pc></rdg>
					var $orig = $xml.createElement('rdg');
					$orig.setAttribute('type', 'orig');
					$orig.setAttribute('hand', 'firsthand');

					// all children拷贝到<rdg>
					// 排列<app><rdg>
					cloneChildren($clone, $orig);
					$newNode.appendChild($orig);
				}
				if ($newNode && type === 'corr') {
					// 新建<rdg>,添加到上面的<app>($newNode)里面
					var $rdg = $xml.createElement('rdg');
					$rdg.setAttribute('type', arr['reading']);
					$rdg.setAttribute('hand', arr['corrector_name']);

					// deletion
					var deletion = arr['deletion']; 
					if (deletion != 'null' && deletion != '') {
						$rdg.setAttribute('deletion', deletion
								.replace(',', '+'));
					}
					// editorial_note
					var editorial_note = arr['editorial_note'];
					if (editorial_note != '') {
						var $note = $xml.createElement('note');
						$note.setAttribute('type', 'transcriber');
						var _line = '';// TODO
						var xmlid = 'P' + gPage + 'C' + gColumn + 'L' + _line
								+ '-' + gWit + '-1';
						$note.setAttribute('xml:id', xmlid);// TODO:
						$note.appendChild($xml.createTextNode(editorial_note));

						$newNode.parentNode.insertBefore($note,
								$newNode.nextSibling);
					}
					
					cloneChildren($clone, $rdg);
					$newNode.appendChild($rdg);
				}
				continue;
			}

			// ******************** break ********************
			/*
			 * break_type= lb / cb /qb / pb number= pb_type= running_title=
			 * lb_alignment=
			 */
			if (type == '' && arr['__t'].match(/brea/)) {
				// $index['lb']++;//TODO: attribute n, hier nur fuer automatisch
				/*
				 * Page (Collate |P 121|): <pb n="121" type="page"
				 * xml:id="P121-wit" /> Folio (Collate |F 3v|): <pb n="3v"
				 * type="folio" xml:id="P3v-wit" /> Column (Collate |C 2|): <cb
				 * n="2" xml:id="P3vC2-wit" /> Line (Collate |L 37|): <lb n="37"
				 * xml:id="P3vC2L37-wit" />
				 */
				var hadBreak = false;
				var breakNodeText=$node.text; 
				if (breakNodeText && breakNodeText.substr(0,"&hyphen;".length) == "&hyphen;") {
					hadBreak = true;
				}

				var brea_page = brea_column = xml_id = brea_wit = '';
				if (arr['break_type'] == 'gb') {
					// special role of quire breaks
					$newNode = $xml.createElement('gb');
					$newNode.setAttribute('n', arr['number']);
				} else { // pb, cb, lb
					$newNode = $xml.createElement(arr['break_type']);
					switch (arr['break_type']) {
					case 'lb':
						$newNode.setAttribute('n', arr['number']);
						if (arr['lb_alignment'] != '') {
							$newNode.setAttribute('rend', arr['lb_alignment']);
						}
						xml_id = 'P' + brea_page + 'C' + brea_column + 'L'
								+ arr['number'] + '-' + brea_wit;
						break;
					case 'cb':
						brea_column = arr['number'];
						$newNode.setAttribute('n', brea_column);
						xml_id = 'P' + brea_page + 'C' + brea_column + '-'
								+ brea_wit;
						break;
					case 'pb':
						// Decide whether folio or page
						if (arr['pb_type'] != '' || arr['fibre_type'] != '') {
							// folio
							brea_page = arr['number'] + arr['pb_type']
									+ arr['fibre_type'];
							$newNode.setAttribute('n', brea_page);
							$newNode.setAttribute('type', 'folio');
						} else {
							// page
							brea_page = arr['number'];
							$newNode.setAttribute('n', brea_page);
							$newNode.setAttribute('type', 'page');
						}
						if (arr['facs'] != '') {
							// use URL for facs attribute
							$newNode.setAttribute('facs', arr['facs']);
						}
						xml_id = 'P' + brea_page + '-' + brea_wit;
						break;
					}
					$newNode.setAttribute('xml:id', xml_id);
					if (hadBreak)
						$newNode.setAttribute('break', 'no');
				}
				$node.parentNode.replaceChild($newNode, $node);

				if (arr['break_type'] == 'lb') {
					// for lb add newline
					$newNode.parentNode.insertBefore($xml.createTextNode("\n"),
							$newNode);
				} else if (arr['break_type'] == 'pb') {
					// for pb add fw elements
					if (arr['running_title'] != '') {
						$secNewNode = $xml.createElement('fw');
						$secNewNode.setAttribute('type', 'runTitle');
						$secNewNode.appendChild($xml
								.createTextNode(arr['running_title']));
						$newNode.parentNode.insertBefore($secNewNode,
								$newNode.nextSibling);
					}
					if (arr['page_number'] != '') {
						$secNewNode = $xml.createElement('fw');
						$secNewNode.setAttribute('type', 'PageNum');
						$secNewNode.appendChild($xml
								.createTextNode(arr['page_number']));
						$newNode.parentNode.insertBefore($secNewNode,
								$newNode.nextSibling); // TODO better use
						// function
						// appendSibling
					}
				}
				continue;
			}

			// ******************** formatting ********************
			/*
			 * __t=formatting_rubrication <hi rend="rubric">...</hi>
			 * __t=formatiing_gold <hi rend="gold">...</hi>
			 * __t=formatting_capitals <hi rend="cap" height="4">...</hi>
			 * __t=formatting_overlines <hi rend="ol">...</hi>
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

			// ******************** gap *******************
			/*
			 * wce_gap <gap OR <supplied source="STRING" _type_STRING
			 * type="STRING" _reason_STRING reason="STRING" _hand_STRING
			 * hand="STRING" _unit_STRING_extent_STRING unit="STRING"
			 * extent="STRING" />
			 */
			if (type == '' && arr['__t'] === 'gap') {
				if (arr['mark_as_supplied'] === 'supplied') {
					// <supplied>
					$newNode = $xml.createElement('supplied');
					if (arr['supplied_source'] != '') {
						if (arr['supplied_source'] == 'other')
							$newNode.setAttribute('source',
									arr['supplied_source_other']);
						else
							$newNode.setAttribute('source',
									arr['supplied_source']);
					}
				} else {
					// <gap>
					$newNode = $xml.createElement('gap');
				}
				// reason
				$newNode.setAttribute('reason', arr['gap_reason']);

				// unit
				if (arr['unit'] != '') {
					if (arr['unit'] == 'other')
						$newNode.setAttribute('unit', arr['unit_other']);
					else
						$newNode.setAttribute('unit', arr['unit']);
				}

				// extent
				if (arr['extent'] != '') {
					$newNode.setAttribute('extent', arr['extent']);
				}

				if ($newNode.nodeName === 'supplied') {
					// add text
					$newNode.appendChild($xml.createTextNode(substr(
							$node.nodeValue, 1, -1)));
					// $supp_words = explode(' ', $newNode.nodeValue);
					// $array_size = count($supp_words);
					// foreach($supp_word AS $w) {
					// for($i = 0; $i < $array_size; $i++) { //Split node value
					// into
					// words
					// $newNode.nodeValue = $w;
					// $newNode=_insertElementW($xml,$node,$newNode); //add <w>
					// $node.parentNode.replaceChild($newNode, $node);
					// }
					$newNode = _insertElementW($node, $newNode); // add <w>
					$node.parentNode.replaceChild($newNode, $node);
				} else {
					$node.parentNode.replaceChild($newNode, $node);
				}
				continue;
			}
			// for End
		}

		if ($newNode) {
			return $newNode;
		} else {
			return $node;
		}
	}

	return getXML();
}