/**
 * editor_plugin_src.js
 * 
 * Copyright 2009, Moxiecode Systems AB Released under LGPL License.
 * 
 * License: http://tinymce.moxiecode.com/license Contributing: http://tinymce.moxiecode.com/contributing
 */
  
(function() {
	var qcnt = 1; // quire count
	var pcnt = 1; // page count
	var ccnt = 1; // column count
	var lcnt = 1; // line count
	var rectoverso = 'true'; // counting as r/v

	// Load plugin specific language pack
	tinymce.PluginManager.requireLangPack('wce');

	/*
	 * WCEObj hat variable and constants
	 */
	var WCEObj = {
		/*
		 * init wce constants: button name, element name ....
		 */
		_initWCEConstants : function(ed) {
			ed.WCE_CON = {};
			var w = ed.WCE_CON;

			// blocked elements :If the Caret is on the inside, will prohibit the key operation
			w.blockedElements = new Array('gap', 'corr', 'chapter_number', 'verse_number', 'abbr', 'spaces', 'note');

			// not blocked elements
			w.normalElemente = new Array('unclear');

			// WCE Buttons
			var controls = ed.controlManager.controls;
			var ed_id = ed.id;
			w.control_B = controls[ed_id + '_menu-break'];
			w.control_C = controls[ed_id + '_menu-correction'];
			w.control_D = controls[ed_id + '_menu-illegible'];
			w.control_O = controls[ed_id + '_menu-decoration'];
			w.control_A = controls[ed_id + '_menu-abbreviation'];
			w.control_P = controls[ed_id + '_menu-paratext'];
			w.control_N = controls[ed_id + '_menu-note'];
			w.control_CH = controls[ed_id + '_charmap']; // charmap
			w.control_RF = controls[ed_id + '_removeformat']; // Remove Format
			w.control_PA = controls[ed_id + '_paste']; // Paste
		},

		/*
		 * init wce variable
		 */
		_initWCEVariable : function(ed) {
			ed.WCE_VAR = {};
			WCEObj._resetWCEVariable(ed);
		},

		/*
		 * reset wce variable
		 */
		_resetWCEVariable : function(ed) {
			// wegen error unter firefox
			if (!ed.WCE_VAR) {
				WCEObj._initWCEConstants(ed);
				WCEObj._initWCEVariable(ed);
			}

			var w = ed.WCE_VAR;
			w.isc = true;// ist selection collapsed
			w.textNode = null;
			w.isAtNodeEnd = false; // is Caret at end of node?
			w.type = null; // Caret in welche wce type
			w.isInBE = false; // is Caret in blocked Element
			w.next = null; // nextSibling
			w.isNextBE = false; // is nextSibling blocked Element
			w.pre = null; // previousSibling
			w.isPreBE = false; // is previousSibling BE
			w.isRedraw = false;
			w.inputBlock = false;
			WCEObj._setAllControls(ed, false); // controls setActive?
		},

		/*
		 * is a node wcenode?
		 */
		_isNodeTypeOf : function(node, typeName) {
			var nodeName = node.nodeName;
			if (nodeName && nodeName.toLowerCase() == 'span') {
				// TODO
				if (typeName == 'verse_number' || typeName == 'chapter_number') {
					var className = node.className;
					if (className) {
						return className.indexOf(typeName) > -1;
					}
					return false;
				}

				var wceAttr = node.getAttribute('wce');
				if (wceAttr) {
					return wceAttr.indexOf("__t=" + typeName) > -1;
				}
			}

			return false;
		},

		/*
		 * is text node in blocked element?
		 */
		_isWceBE : function(ed, node) {
			if (!node || node.nodeType == 3 || !ed) {
				return false;
			}

			var arr = ed.WCE_CON.blockedElements;
			for ( var i = 0, len = arr.length; i < len; i++) {
				if (WCEObj._isNodeTypeOf(node, arr[i]))
					return true;
			}
			return false;
		},

		/*
		 * is a Ancestor of the node a blocked element?
		 */
		_isInWceBE : function(ed, node) {
			var _isWceBE = WCEObj._isWceBE;
			while (node && node.nodeName.toLowerCase() != 'body') {
				if (_isWceBE(ed, node)) {
					return true;
				}
				node = node.parentNode;
			}
			return false;
		},

		/*
		 * if a node is lastchild of parentnode, then find nextSibling of parentNode.
		 */
		_getNextSiblingOfAncestor : function(ed, node) {
			var curr = WCEObj._getAncestorIfLastChild(ed, node);
			if (curr && curr.nodeName.toLowerCase() == "body") {
				return null;
			}

			var next = curr.nextSibling;
			while (next && tinyMCE.isGecko && ed.selection.isCollapsed() && next.nodeType == 3 && next.nodeValue == "") {
				var _next = next;
				next = WCEObj._getNextSiblingOfAncestor(ed, next);
				_next.parentNode.removeChild(_next);
			}

			return next;

			// var parent, next;
			//
			// while (node) {
			// next = node.nextSibling;
			// if (node.nodeName.toLowerCase() == "body") {
			// return null;
			// }
			//
			// parent = node.parentNode;
			// if (parent && parent.lastChild != node) {
			// // Unter Firefox, nachdem "Del" ein Element wird ein #Text="" erzeugt
			// if (tinyMCE.isGecko && ed.selection.isCollapsed() && next.nodeType == 3 && next.nodeValue == "") {
			// var _next = next;
			// next = WCEObj._getNextSiblingOfAncestor(ed, next);
			// _next.parentNode.removeChild(_next);
			// }
			// return next;
			// }
			// node = parent;
			// }
			// return null;

		},

		/*
		 * get realy startContainer when startContainer.nodeType==1
		 */

		_getRealContainer : function(container, offset) {
			var childNodes = container.childNodes;
			var node;
			if (offset && childNodes) {
				node = childNodes[offset];
			}
			return node;
		},

		/*
		 * so lang as node is firstChild, find outmost Ancestor. Reverse of _getFirstTextNodeOfNode()
		 */
		_getAncestorIfFirstChild : function(ed, node) {
			var parent;
			while (node) {
				if (node.nodeName.toLowerCase() == "body") {
					return node;
				}
				parent = node.parentNode;
				if (parent && parent.firstChild != node) {
					return node;
				}
				node = parent;
			}
			return null;
		},

		/*
		 * return lastchild and is #text of a node. Reverse of _getAncestorIfFirstChild()
		 */
		_getFirstTextNodeOfNode : function(ed, n) {
			if (!n) {
				return null;
			}

			if (n.nodeType == 3) {
				return n;

			}

			if (n.childNodes.length == 0) {
				return null;
			}

			var firstChild = n.firstChild;
			if (firstChild) {
				if (firstChild.nodeType == 3) {
					return firstChild;
				}
				return WCEObj._getFirstTextNodeOfNode(ed, firstChild);
			}

		},

		/*
		 * so lang as node is lastChild, find outmost Ancestor. Reverse of _getLastTextNodeOfNode()
		 */
		_getAncestorIfLastChild : function(ed, node) {
			var parent;
			while (node) {
				if (node.nodeName.toLowerCase() == "body") {
					return node;
				}
				parent = node.parentNode;
				if (parent && parent.lastChild != node) {
					return node;
				}
				node = parent;
			}
			return null;
		},

		/*
		 * return lastchild and is #text of a node. Reverse of _getAncestorIfLastChild()
		 */
		_getLastTextNodeOfNode : function(ed, n) {
			if (!n) {
				return null;
			}

			if (n.nodeType == 3) {
				return n;

			}

			if (n.childNodes.length == 0) {
				return null;
			}

			var lastChild = n.lastChild;
			if (lastChild) {
				if (lastChild.nodeType == 3) {
					return lastChild;
				}
				return WCEObj._getLastTextNodeOfNode(ed, lastChild);
			}

		},

		/*
		 * set wce controls is active or not
		 */
		_setAllControls : function(ed, b) {
			var w = ed.WCE_VAR;
			w.not_CH = b; // control insert custom character
			w.not_RF = b; // control RemoveFormat setActive?
			w.not_PA = b; // control paste
			w.not_B = b; // control B setActive?
			w.not_C = b; // control C setActive?
			w.not_D = b; // control D setActive?
			w.not_O = b; // control O setActive?
			w.not_A = b; // control A setActive?
			w.not_P = b; // control P setActive?
			w.not_N = b; // control N setActive?
		},

		/*
		 * set wce controls status
		 */
		_redrawContols : function(ed) {
			var w = ed.WCE_CON;
			var v = ed.WCE_VAR;

			if (w.control_B) {
				w.control_B.setDisabled(v.not_B);
			}
			if (w.control_C) {
				w.control_C.setDisabled(v.not_C);
			}
			if (w.control_D) {
				w.control_D.setDisabled(v.not_D);
			}
			if (w.control_O) {
				w.control_O.setDisabled(v.not_O);
			}
			if (w.control_A) {
				w.control_A.setDisabled(v.not_A);
			}
			if (w.control_P) {
				w.control_P.setDisabled(v.not_P);
			}
			if (w.control_N) {
				w.control_N.setDisabled(v.not_N);
			}
			if (w.control_CH) {
				w.control_CH.setDisabled(v.not_CH);
			}
			if (w.control_RF) {
				w.control_RF.setDisabled(v.not_RF);
			}
			if (w.control_PA) {
				w.control_PA.setDisabled(v.not_PA);
			}
		},

		/*
		 * update wce variable
		 */
		_setWCEVariable : function(ed, isAdaptived) {
			var w = ed.WCE_VAR;

			// reset WCE_VAR
			WCEObj._resetWCEVariable(ed);

			var _getNextSiblingOfAncestor = WCEObj._getNextSiblingOfAncestor;
			var _isNodeTypeOf = WCEObj._isNodeTypeOf;
			var _setAllControls = WCEObj._setAllControls;
			var _getAncestorIfLastChild = WCEObj._getAncestorIfLastChild;
			var _getAncestorIfFirstChild = WCEObj._getAncestorIfFirstChild;

			var rng = ed.selection.getRng(true);
			var startContainer = rng.startContainer;
			var endContainer = rng.endContainer;
			var startOffset = rng.startOffset;
			var endOffset = rng.endOffset;
			var _isWceBE = WCEObj._isWceBE;

			var startNode;

			w.isc = ed.selection.isCollapsed();

			if (!startContainer) {
				return;
			}

			// if select a text
			if (!w.isc) {
				var endNode;

				w.not_B = true;
				w.not_N = true;

				// if run adaptive Selection
				if (!isAdaptived) {
					var adaptiveCheckbox = tinymce.DOM.get(ed.id + '_adaptive_selection');
					if (adaptiveCheckbox && adaptiveCheckbox.checked) {
						WCEObj._adaptiveSelection(ed);
						return WCEObj._setWCEVariable(ed, true);
					}
				}

				// after adaptive selection,in IE startContainer==node Caret muss be move
				if (isAdaptived && tinyMCE.isIE && startContainer.nodeType == 1) {
					startNode = WCEObj._getRealContainer(startContainer, startOffset);
				}

				var startText = startContainer.nodeValue;
				if (!startNode && startText && startText.length == startOffset) {
					// at #text end
					var _startContainer = WCEObj._getAncestorIfLastChild(ed, startContainer);
					if (_startContainer) {
						startNode = _startContainer.nextSibling;
					}
				}

				if (!startNode && startContainer.nodeType == 3) {
					var startText = startContainer.nodeValue;
					if (startText && startOffset == 0) {
						startNode = WCEObj._getAncestorIfFirstChild(ed, startContainer);
					} else {
						startNode = startContainer;
					}
				}

				// after adaptive selection,in IE startContainer==node Caret muss be move
				if (tinyMCE.isIE && endContainer.nodeType == 1) {
					endContainer = WCEObj._getRealContainer(endContainer, endOffset);
				}

				// in Firefox wird endContainer ein leer Element ausgewaehlt, trotz zwei span elemente hintereinander und nicht leer sind
				// in dem Fall soll endContainer auf Prevoius dieses Element sein.
				if (endOffset == 0 && tinyMCE.isGecko) {
					// return nodeType==1
					var _endContainer = _getAncestorIfFirstChild(ed, endContainer);
					if (_endContainer) {
						endNode = _endContainer.previousSibling;
					}

					if (endNode) {
						var endTextNode = WCEObj._getLastTextNodeOfNode(ed, endNode);
						if (endTextNode) {
							var endText = endTextNode.nodeValue;
							if (endText) {
								rng.setEnd(endTextNode, endText.length);
								ed.selection.setRng(rng);
							}
						}

					}
				}

				// Caret at textnode end?
				if (endContainer.nodeType == 3 && endContainer.nodeValue.length == endOffset) {
					// return nodeType==1
					w.isAtNodeEnd = true;
				}

				if (!endNode && endContainer.nodeType == 3) {
					if (w.isAtNodeEnd) {
						endNode = _getAncestorIfLastChild(ed, endContainer);
					} else {
						endNode = endContainer;
					}
				}

				if (startContainer == endContainer) {
					endNode = startNode;
				} else {
					w.inputBlock = true;
				}

				// w.next = endNode.nextSibling
				// w.isNextBE = _isWceBE(ed, w.next);
				w.pre = startNode.previousSibling;
				w.isPreBE = _isWceBE(ed, w.pre);

				// startContainer/endContainer kann type==1 oder type==3 sein
				if (!startNode || !endNode || startNode.parentNode != endNode.parentNode) {
					_setAllControls(ed, true);
					w.isInBE = true;
					w.type = null;
					return;
				}

				if (startNode != endNode) {
					_setAllControls(ed, true);
					w.not_C = false;
					w.not_D = false;
					w.not_P = false;
					w.not_A = false;
					return;
				}

				if (startNode.nodeType == 3) {
					startNode = startNode.parentNode;
				}

				w.isInBE = _isWceBE(ed, startNode);

				if (w.isInBE) {
					w.inputBlock = true;
				}

			} else {
				if (startContainer.nodeType != 3) {
					// In Firefox startOffSet==0, node is empty
					if (startOffset == 0 && tinyMCE.isGecko && w.isc && startContainer.childNodes.length == 0) {
						startContainer.parentNode.removeChild(startContainer);
					} else if (!tinyMCE.isIE) { // if (tinyMCE.isGecko)
						var startContainerNodeName = startContainer.nodeName;
						if (startContainerNodeName.toLowerCase() == "body") {
							startContainer = WCEObj._getRealContainer(startContainer, startOffset);
							if (startContainer) {
								startContainer = startContainer.previousSibling;
							}
							if (startContainer) {
								var lastTextNode = WCEObj._getLastTextNodeOfNode(ed, startContainer);
								if (lastTextNode) {
									var lastTextNodeValue = lastTextNode.nodeValue;
									if (lastTextNodeValue) {
										rng.setStart(lastTextNode, lastTextNodeValue.length);
										rng.setEnd(lastTextNode, lastTextNodeValue.length);
										ed.selection.setRng(rng);
										return WCEObj._setWCEVariable(ed);
									}
								}
							}

						}
					}

					// ganz anfang oder Ende
					w.not_C = true;
					w.not_A = true;

					// for IE
					if (tinyMCE.isIE && w.isc && startContainer) {
						var pre, next;
						var childNodes = startContainer.childNodes;
						if (startOffset && childNodes) {
							startNode = childNodes[startOffset - 1];
							w.isInBE = _isWceBE(ed, startNode);
							w.pre = startNode.previousSibling;
							w.next = _getNextSiblingOfAncestor(ed, startNode);
							w.isAtNodeEnd = true;
							w.isNextBE = _isWceBE(ed, w.next);
							w.isPreBE = _isWceBE(ed, w.pre);
						}
					}

					return;
				}

				// /if startContainer==textNode
				startNode = startContainer.parentNode;

				// if isCollapsed
				var text = startContainer.nodeValue;
				if (startOffset == text.length) {
					w.isAtNodeEnd = true;
				}
				w.not_C = true;
				w.not_A = true;

				// get currnode, nextSibling, privousSilbing in BE ?
				w.isInBE = _isWceBE(ed, startNode);
				w.next = _getNextSiblingOfAncestor(ed, startContainer);
				w.isNextBE = _isWceBE(ed, w.next);
				w.isPreBE = _isWceBE(ed, w.pre);
			}

			// get Type of wceNode
			if (_isNodeTypeOf(startNode, 'gap')) {
				_setAllControls(ed, true);
				w.not_D = false;
				w.type = 'gap';
			} else if (_isNodeTypeOf(startNode, 'corr')) {
				_setAllControls(ed, true);
				w.not_C = false;
				w.type = 'corr';
			} else if (_isNodeTypeOf(startNode, 'abbr')) {
				w.not_A = false;
				w.type = 'abbr';
			} else if (_isNodeTypeOf(startNode, 'chapter_number')) {
				_setAllControls(ed, true);
				w.type = 'chapter_number';
			} else if (_isNodeTypeOf(startNode, 'verse_number')) {
				_setAllControls(ed, true);
				w.type = 'verse_number';
			} else if (_isNodeTypeOf(startNode, 'brea')) {
				w.type = 'break';
			} else if (_isNodeTypeOf(startNode, 'unclear')) {
				w.type = 'unclear';
			} else if (_isNodeTypeOf(startNode, 'spaces')) {
				_setAllControls(ed, true);
				w.type = 'spaces';
				w.not_O = false;
			} else if (_isNodeTypeOf(startNode, 'formatting_capitals')) {
				w.type = 'formatting_capitals';
			} else if (_isNodeTypeOf(startNode, 'paratext')) {
				w.type = 'paratext';
			} else if (_isNodeTypeOf(startNode, 'note')) {
				_setAllControls(ed, true);
				w.not_N = false;
				w.type = 'note';
			} 
		},

		// only for mouseup
		_adaptiveSelection : function(ed) {
			var _getTextLeftPosition = WCEObj._getTextLeftPosition;
			var _getTextRightPosition = WCEObj._getTextRightPosition;

			var rng = ed.selection.getRng(true);

			var startContainer = rng.startContainer; // #text
			var startOffset = rng.startOffset;

			var endContainer = rng.endContainer; // #text
			var endOffset = rng.endOffset;

			var newStartOffset, newEndOffset;
			var startText = startContainer.nodeValue;
			var endText = endContainer.nodeValue;

			// if need move startContainer: only (a few) space after sartContainer
			if (startOffset != 0) {
				if (startText) {
					var subText = startText.substr(startOffset, startText.length);
					if (subText && tinymce.trim(subText) == "") {
						var moveStartToNext = true;
					}
				}
			}
			if (moveStartToNext) {
				var next = WCEObj._getNextSiblingOfAncestor(ed, startContainer);
				if (next) {
					var nextTextNode = WCEObj._getLastTextNodeOfNode(ed, next);
					if (nextTextNode) {
						var nextText = nextTextNode.nodeValue;
						if (nextText) {
							rng.setStart(nextTextNode, 0);
							ed.selection.setRng(rng);
							startContainer = rng.startContainer;
							startOffset = rng.startOffset;
							startText = startContainer.nodeValue;
							endContainer = rng.endContainer;
							endOffset = rng.endOffset;
							endText = endContainer.nodeValue;
						}
					}
				}
			}

			// if need move endContainer
			if (endContainer.nodeType != 3) {
				// in IE
				if (tinymce.isIE) {
					var moveEndToPrevious = true;
					endContainer = WCEObj._getRealContainer(endContainer, endOffset);
				} else if (tinymce.isGecko) {
					// in Firefox at end of BODY <br data-mce-bogus="1">
					var _endContainer = WCEObj._getRealContainer(endContainer, endOffset);
					if (_endContainer && _endContainer.getAttribute("data-mce-bogus")) {
						endContainer = _endContainer.previousSibling;
						var _text = endContainer.nodeValue;
						if (_text) {
							rng.setEnd(endContainer, _text.length);
							ed.selection.setRng(rng);
							startContainer = rng.startContainer;
							startOffset = rng.startOffset;
							startText = startContainer.nodeValue;
							endContainer = rng.endContainer;
							endOffset = rng.endOffset;
							endText = endContainer.nodeValue;
						}
					}
				}
			}

			if (endOffset == 0) {
				var moveEndToPrevious = true;
			} else {
				if (endText) {
					var subText = endText.substr(0, endOffset);
					if (subText && tinymce.trim(subText) == "") {
						var moveEndToPrevious = true;
					}
				}
			}
			if (moveEndToPrevious) {
				var pre = WCEObj._getAncestorIfLastChild(ed, endContainer);
				if (pre) {
					pre = pre.previousSibling;
					if (pre) {
						var preLastTextNode = WCEObj._getLastTextNodeOfNode(ed, pre);
						if (preLastTextNode) {
							var preText = preLastTextNode.nodeValue;
							if (preText) {
								rng.setEnd(preLastTextNode, preText.length);
								ed.selection.setRng(rng);
								// reload rng
								rng = ed.selection.getRng(true);
								startContainer = rng.startContainer;
								startOffset = rng.startOffset;
								startText = startContainer.nodeValue;
								endContainer = rng.endContainer;
								endOffset = rng.endOffset;
								endText = endContainer.nodeValue;
							}
						}
					}
				}
			}

			// startContainer == endContainer, return
			if (startContainer == endContainer) {
				startText = startContainer.nodeValue;
				if (startText && startText.indexOf(" ") < 0) {
					rng.setStart(startContainer, 0);
					var len = startText.length;
					rng.setEnd(startContainer, len);
					ed.selection.setRng(rng);
				} else if (startText) {
					newStartOffset = _getTextLeftPosition(startText, startOffset);
					newEndOffset = _getTextRightPosition(startText, endOffset);
					rng.setStart(startContainer, newStartOffset);
					rng.setEnd(endContainer, newEndOffset);
					ed.selection.setRng(rng);
				}
				return;
			}

			var startParent;
			if (startText && startOffset == 0) {
				// Caret at start
				startParent = WCEObj._getAncestorIfFirstChild(ed, startContainer);
				startParent = startParent.parentNode;
			} else {
				startParent = startContainer.parentNode;
			}

			var endParent;
			if (endText && endOffset == endText.length) {
				// Caret at end
				endParent = WCEObj._getAncestorIfLastChild(ed, endContainer);
				endParent = endParent.parentNode;
			} else {
				endParent = endContainer.parentNode;
			}

			// startParent == endParent
			if (startParent == endParent) {
				startText = startContainer.nodeValue;
				endText = endContainer.nodeValue;
				if (startText && endText) {
					newStartOffset = _getTextLeftPosition(startText, startOffset);
					newEndOffset = _getTextRightPosition(endText, endOffset);
					if (newEndOffset < 0) {
						rng.setEnd(endContainer, 0);
						ed.selection.setRng(rng);
						return WCEObj._adaptiveSelection(ed);
					}
					rng.setStart(startContainer, newStartOffset);
					rng.setEnd(endContainer, newEndOffset);
					ed.selection.setRng(rng);
				}
				return;
			}

			// startContainer!=endContainer;
			startText = endContainer.nodeValue;
			if (startText && endOffset == 1 && startText.indexOf(" ") == 0) {
				endContainer = endContainer.previousSibling;
				if (endContainer) {
					endContainer = WCEObj._getLastTextNodeOfNode(ed, endContainer);
					if (endContainer && endContainer.nodeType == 3) {
						rng.setEnd(endContainer, endContainer.nodeValue.length);
						ed.selection.setRng(rng);
					}
				}
			}
		},

		/*
		 * @param string from attribut "wce" in <span> @return array
		 */
		_stringToArray : function(str) {
			var a = [];
			var ar = str.split('&');
			var k, v, kv;
			for ( var i = 0; i < ar.length; i++) {
				kv = ar[i].split('=');
				k = kv[0];
				v = kv[1];
				
			//	if(!v || v=='undefined') continue;
				
				a[k] = decodeURIComponent(v);
			}
			return a;
		},

		/*
		 * insert space after Caret
		 */
		_insertSpace : function(ed, ek) {
			var w = ed.WCE_VAR;
			var next = w.next;
			ed.execCommand('mceAddUndoLevel');
			ed.WCE_VAR.stopUndo = true;

			var rng = ed.selection.getRng(true);

			// is space key?
			if (ek != 32) {
				var newText = document.createTextNode("_");
				if (next) {
					next.parentNode.insertBefore(newText, next);
				} else {
					ed.getBody().appendChild(newText);
				}
				rng.setStart(newText, 0);
				rng.setEnd(newText, 1);
				ed.selection.setRng(rng);
				return false;// not stopEvent();
			} else if (tinymce.isIE || tinymce.isGecko) {
				// TODO;
				return true;// stopEvent();
			} else {
				// TODO;
				// space key verhindern unter safari, chrome und opera
				return true; // stopEvent();
			}

		},

		/*
		 * wenn mouseover, show wce node info
		 */
		_showWceInfo : function(ed, e) {
			var info_box = ed.wceInfoBox;
			var sele_node = e.target;
			var wceAttr = sele_node.getAttribute('wce');
			var _dirty = ed.isDirty();

			var type_to_show = [ 'note', 'corr' ]; // TODO

			var info_arr;
			if (wceAttr && wceAttr != '') {
				info_arr = wceAttr.split('@');
			}
			if (info_arr != null && info_arr.length > 0 && wceAttr.indexOf(ed.wceTypeParamInClass + '=') > -1) {
				var ar;
				var corr_str = '';
				var info_text = '';
				var k, v, kv, kv_ar;
				for ( var i = 0; i < info_arr.length; i++) {
					ar = WCEObj._stringToArray(info_arr[i]);
					var type_name = ar[ed.wceTypeParamInClass];
					type_name = type_name.split('_');

					switch (type_name[0]) {
					case 'abbr':
						switch (ar['abbr_type']) {
						case 'nomSac':
							info_text = 'Nomen Sacrum';
							break;
						case 'numeral':
							info_text = 'Numeral';
							break;
						case 'other':
							info_text = ar['abbr_type_other'];
							break;
						}
						break;
					case 'brea':
						switch (ar['break_type']) {
						case 'lb':
							info_text = '<div>Number: ' + ar['number'] + '</div>';
							if (ar['lb_alignment'] != '') {
								info_text += '<div>Alignment: ' + ar['lb_alignment'];
							}
							break;
						case 'pb':
							info_text = '<div>' + 'Page number (in sequence): ' + ar['number'] + ar['pb_type'] + ar['fibre_type'] + '</div>';
							if (ar['page_number'] != '') {
								info_text += '<div>' + 'Page number (as written): ' + ar['page_number'] + '</div>';
							}
							if (ar['running_title'] != '') {
								info_text += '<div>' + 'Running title: ' + ar['running_title'] + '</div>';
							}
							break;
						default:
							info_text = '<div>Number: ' + ar['number'] + '</div>';
						}
						break;
					case 'note':
						info_text = '<div>';
						switch (ar['note_type']) {
						case 'editorial':
							info_text += 'Editorial Note</div>';
							break;
						case 'transcriberquery':
							info_text += 'Transcriber query</div>';
							break;
						case 'canonRef':
							info_text += 'Canon reference</div>';
							break;
						case 'changeOfHand':
							info_text += 'Change of Hand</div>';
							info_text += '<div>New hand: ' + ar['newHand'] + '</div>';
							break;
						default: // other
							info_text += ar['note_type_other'] + '</div>';
						}
						info_text += '<div style="margin-top:10px">' + ar['note_text'] + '</div>';
						break;
					case 'corr':
						corr_str += '<div style="margin-top:15px">';
						switch (ar['reading']) {
						case 'corr':
							corr_str += 'Correction';
							break;
						case 'comm':
							corr_str += 'Commentary reading';
							break;
						case 'alt':
							corr_str += 'Alternative reading';
							break;
						}
						corr_str += '</div>';
						corr_str += '<div style="margin-top:5px">' + ar[ed.wceNameParamInClass] + ': ';
						if (ar['blank_correction'] == 'blank_correction')
							corr_str += 'deleted' + '</div>';
						else
							corr_str += ar['corrector_text'] + '</div>';
						if (ar['deletion'] && ar['deletion']!='undefined') { 
							// information  on deletion
							corr_str += '<div style="margin-top:5px">' + 'Method of deletion: ' + ar['deletion'] + '</div>';
						}
						break;
					case 'paratext':
						info_text = '<div>' + 'Paratext type: ';
						switch (ar['fw_type']) {
						case 'commentary_text':
							info_text += 'Commentary text';
							break;
						case 'num_chapternumber':
							info_text += 'Chapter number';
							break;
						case 'fw_chaptertitle':
							info_text += 'Chapter title';
							break;
						case 'fw_colophon':
							info_text += 'Colophon';
							break;
						case 'fw_quiresig':
							info_text += 'Quire signature';
							break;
						case 'num_ammonian':
							info_text += 'Ammonian section';
							break;
						case 'num_eusebian':
							info_text += 'Eusebian canon';
							break;
						case 'fw_euthaliana':
							info_text += 'Euthaliana';
							break;
						case 'fw_gloss':
							info_text += 'Gloss';
							break;
						case 'fw_lecttitle':
							info_text += 'Lectionary title';
							break;
						case 'num_stichoi':
							info_text += 'Stichoi';
							break;
						}
						info_text += '</div>';
						info_text += '<div style="margin-top:10px">Value: ' + ar['text'] + '</div>';
						if (ar['paratext_position'] == 'other') {
							info_text += '<div style="margin-top:10px">Position: ' + ar['paratext_position_other'] + '</div>';
						} else {
							info_text += '<div style="margin-top:10px">Position: ' + ar['paratext_position'] + '</div>';
						}
						info_text += '<div style="margin-top:10px">Alignment: ' + ar['paratext_alignment'] + '</div>';
						break;
					case 'gap':
						if (ar['unit'] == '' && ar['gap_reason'] == '') {
							info_text = 'No information about the reason and extension of the gap available';
							break;
						}
						info_text = '<div>' + 'Reason: ';
						if (ar['gap_reason'] == 'lacuna') {
							info_text += 'Lacuna' + '</div>';
						} else if (ar['gap_reason'] == 'illegible') {
							info_text += 'Illegible text' + '</div>';
						} else {
							info_text += 'Absent text' + '</div>';
						}
						if (ar['extent'] && ar['extent'] != '') {
							info_text += '<div>' + 'Extent: ' + ar['extent'] + ' ';
							if (ar['unit'] == 'other') {
								info_text += ar['unit_other'] + '</div>';
							} else {
								info_text += ar['unit'] + '(s)</div>';
							}
						}
						if (ar['mark_as_supplied'] == 'supplied') {
							info_text += '<div>' + 'Supplied source: ';
							if (ar['supplied_source'] == 'other') {
								info_text += ar['supplied_source_other'] + '</div>';
							} else {
								info_text += ar['supplied_source'] + '</div>';
							}
						}
						break;
					case 'unclear':
						info_text = '<div>' + 'Uncertain letters' + '</div>';
						info_text += '<div>' + 'Reason: ';
						if (ar['unclear_text_reason'] == 'other') {
							info_text += ar['unclear_text_reason_other'];
						} else {
							info_text += ar['unclear_text_reason'];
						}
						info_text += '</div>';
						break;
					case 'spaces':
						info_text = '<div>' + 'Extent: ' + ar['sp_extent'] + ' ';
						if (ar['sp_unit'] == 'other') {
							info_text += ar['sp_unit_other'] + '(s)' + '</div>';
						} else {
							info_text += ar['sp_unit'] + '(s)</div>';
						}
						break;
					case 'formatting':
						if (ar['capitals_height'] != null) { // output only if capitals
							info_text = '<div>' + 'Height: ' + ar['capitals_height'] + '</div>';
						}
						break;
					default:
						info_text = '';
						break;
					}

				}

				if (corr_str != '') {
					if ($(sele_node).html() == 'T') // Blank first hand reading
						corr_str = '*: ' + 'Omission' + corr_str;
					else
						corr_str = '*: ' + $(sele_node).html() + corr_str;
					if (ar['editorial_note'] != '') {
						corr_str += '<div style="margin-top:5px">Note: ' + ar['editorial_note'] + '</div>';
					}
				}

				if (type_name == 'corr') {
					info_text = corr_str;
				}

				// information display
				if (info_text != '') {
					var new_top = e.clientY;
					var new_left = e.clientX;
					if (ed.getParam('fullscreen_is_enabled')) {
						new_top = new_top + 30;
						new_left = new_left + 30;
					} else {
						new_top = new_top + 80;
						new_left = new_left + 80;
					}

					tinymce.DOM.setStyles(info_box, {
						'top' : new_top,
						'left' : new_left
					});
					info_box.innerHTML = '<div style="background-color: #eee; white-space:normal; padding:10px;border: 1px solid #ff0000">' + info_text + '</div>';
					$(info_box).show();
				}
			} else {
				$(info_box).hide();
			}
			// set isNotDirty back
			if (_dirty)
				ed.isNotDirty = 0;
			else
				ed.isNotDirty = 1;
		},

		createControl : function(n, cm) {
			var ed = cm.editor;
			switch (n) {
			/*
			 * case 'metadata': var c = cm.createButton('menu-metadata', { title : 'Metadata', image : tinyMCE.baseURL+'/plugins/wce/img/button_meta.gif', onclick : function() { tinyMCE.activeEditor.execCommand('mceAddMetadata'); } }); return c;
			 */
			case 'breaks':
				var c = cm.createMenuButton('menu-break', {
					title : 'Breaks',
					image : tinyMCE.baseURL + '/plugins/wce/img/button_B-new.png',
					icons : false
				});

				c.onRenderMenu.add(function(c, m) {
					var w = ed.WCE_VAR;
					m.add({
						title : 'add',
						id : 'menu-break-add',
						onclick : function() {
							ed.execCommand('mceAddBreak');
						}
					});

					m.add({
						title : 'edit',
						id : 'menu-break-edit',
						onclick : function() {
							ed.execCommand('mceEditBreak');
						}
					});

					m.add({
						title : 'delete',
						id : 'menu-break-delete',
						onclick : function() {
							ed.execCommand('wceDelNode');
						}
					});

					m.onShowMenu.add(function(m) {
						var items = m.items;
						if (w.type == 'break') {
							items['menu-break-add'].setDisabled(true);
							items['menu-break-edit'].setDisabled(false);
							items['menu-break-delete'].setDisabled(false);
						} else {
							items['menu-break-add'].setDisabled(false);
							items['menu-break-edit'].setDisabled(true);
							items['menu-break-delete'].setDisabled(true);
						}
					});

				});

				return c;

			case 'correction':
				var c = cm.createButton('menu-correction', {
					title : 'Corrections',
					image : tinyMCE.baseURL + '/plugins/wce/img/button_C-new.png',
					icons : false,
					onclick : function() {
						ed.execCommand('mceAddCorrection');
					}
				});

				return c;

			case 'illegible':
				var c = cm.createMenuButton('menu-illegible', {
					title : 'Deficiency',
					image : tinyMCE.baseURL + '/plugins/wce/img/button_D-new.png',
					icons : false
				});

				c.onRenderMenu.add(function(c, m) {
					var sub;
					var w = ed.WCE_VAR;

					sub = m.addMenu({
						title : 'Uncertain Letters',
						id : 'menu-illegible-uncleartext'
					});

					sub.add({
						title : 'add',
						id : 'menu-illegible-uncleartext-add',
						onclick : function() {
							ed.execCommand('mceAddUnclearText');
						}
					});

					sub.add({
						title : 'edit',
						id : 'menu-illegible-uncleartext-edit',
						onclick : function() {
							ed.execCommand('mceEditUnclearText');
						}
					});

					sub.add({
						title : 'delete',
						id : 'menu-illegible-uncleartext-delete',
						onclick : function() {
							ed.execCommand('wceDelNode');
						}
					});

					sub.onShowMenu.add(function(m) {
						var items = m.items;
						if (w.type == 'unclear') {
							items['menu-illegible-uncleartext-add'].setDisabled(true);
							items['menu-illegible-uncleartext-edit'].setDisabled(false);
							items['menu-illegible-uncleartext-delete'].setDisabled(false);
						} else {
							items['menu-illegible-uncleartext-add'].setDisabled(false);
							items['menu-illegible-uncleartext-edit'].setDisabled(true);
							items['menu-illegible-uncleartext-delete'].setDisabled(true);
						}
					});

					sub = m.addMenu({
						title : 'Gap',
						id : 'menu-illegible-lacuna'
					});

					sub.add({
						title : 'add',
						id : 'menu-illegible-lacuna-add',
						onclick : function() {
							ed.execCommand('mceAddGap');
						}
					});

					sub.add({
						title : 'edit',
						id : 'menu-illegible-lacuna-edit',
						onclick : function() {
							ed.execCommand('mceEditGap');
						}
					});

					sub.add({
						title : 'delete',
						id : 'menu-illegible-lacuna-delete',
						onclick : function() {
							ed.execCommand('wceDelNode');
						}
					});

					sub.onShowMenu.add(function(m) {
						var items = m.items;
						if (w.type == 'gap') {
							items['menu-illegible-lacuna-add'].setDisabled(true);
							items['menu-illegible-lacuna-edit'].setDisabled(false);
							items['menu-illegible-lacuna-delete'].setDisabled(false);
						} else {
							items['menu-illegible-lacuna-add'].setDisabled(false);
							items['menu-illegible-lacuna-edit'].setDisabled(true);
							items['menu-illegible-lacuna-delete'].setDisabled(true);
						}
					});

					m.add({ // Ghost page
						title : 'Ghost page',
						id : 'menu-illegible-ghostpage',
						onclick : function() {
							ed.execCommand('mceAddGhostPage');
						}
					});
				});

				// Return the new menu button instance
				return c;

			case 'decoration':
				var c = cm.createMenuButton('menu-decoration', {
					title : 'Ornamentation',
					image : tinyMCE.baseURL + '/plugins/wce/img/button_O-new.png',
					icons : false
				});

				c.onRenderMenu.add(function(c, m) {
					var sub;
					var w = ed.WCE_VAR;
					sub = m.addMenu({
						title : 'Highlight Text',
						id : 'menu-decoration-highlight',
						image : tinyMCE.baseURL + '/plugins/wce/img/button_O-new.png'
					});

					sub.add({
						title : 'Rubrication',
						onclick : function() {
							ed.execCommand('mceAdd_formatting', 'rubrication');
						}
					});

					sub.add({
						title : 'Gold',
						onclick : function() {
							ed.execCommand('mceAdd_formatting', 'gold');
						}
					});

					var sub2 = sub.addMenu({
						title : 'Other colour'
					});

					sub2.add({
						title : 'Blue',
						onclick : function() {
							ed.execCommand('mceAdd_formatting', 'blue');
						}
					});

					sub2.add({
						title : 'Green',
						onclick : function() {
							ed.execCommand('mceAdd_formatting', 'green');
						}
					});

					sub2.add({
						title : 'Yellow',
						onclick : function() {
							ed.execCommand('mceAdd_formatting', 'yellow');
						}
					});

					sub2.add({
						title : 'Other',
						onclick : function() {
							ed.execCommand('mceAdd_formatting', 'other');
						}
					});

					sub.add({
						title : 'Overline',
						onclick : function() {
							ed.execCommand('mceAdd_formatting', 'overline');
						}
					});

					sub2 = sub.addMenu({
						title : 'Capitals',
						id : 'menu-decoration-highlight-capitals'
					});

					sub2.add({
						title : 'add',
						id : 'menu-decoration-highlight-capitals-add',
						icons : false,
						onclick : function() {
							ed.execCommand('mceAddCapitals');
						}
					});

					sub2.add({
						title : 'edit',
						id : 'menu-decoration-highlight-capitals-edit',
						onclick : function() {
							ed.execCommand('mceEditCapitals');
						}
					});

					sub2.add({
						title : 'delete',
						id : 'menu-decoration-highlight-capitals-delete',
						onclick : function() {
							ed.execCommand('wceDelNode');
						}
					});

					sub2.onShowMenu.add(function(m) {
						var items = m.items;
						if (w.type == 'formatting_capitals') {
							items['menu-decoration-highlight-capitals-add'].setDisabled(true);
							items['menu-decoration-highlight-capitals-edit'].setDisabled(false);
							items['menu-decoration-highlight-capitals-delete'].setDisabled(false);
						} else {
							items['menu-decoration-highlight-capitals-add'].setDisabled(false);
							items['menu-decoration-highlight-capitals-edit'].setDisabled(true);
							items['menu-decoration-highlight-capitals-delete'].setDisabled(true);
						}
					});

					sub = m.addMenu({
						title : 'Insert special characters'
					});

					sub.add({
						title : '\u203B	(cross with dots)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u203B');
						}
					});

					sub.add({
						title : '&gt;	(diple)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '&gt;');
						}
					});

					sub.add({
						title : '\u2020	(obelus)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u2020');
						}
					});

					sub.add({
						title : '\u00B6	(paragraphus)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u00B6');
						}
					});

					sub.add({
						title : '\u03A1\u0336	(staurogram)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u03A1\u0336');
						}
					});

					sub = m.addMenu({
						title : 'Add punctuation'
					});

					sub.add({
						title : ': (colon)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', ':');
						}
					});

					sub.add({
						title : ', (comma)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', ',');
						}
					});

					sub.add({
						title : '. (full stop)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '.');
						}
					});

					sub.add({ // alternatively
						// \u00B7
						title : '\u0387 (Greek Ano Teleia)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u0387');
						}
					});

					sub.add({ // alternatively
						// \u003B
						title : '\u037E (Greek question mark)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u037E');
						}
					});

					sub.add({
						title : '\u02D9 (high dot)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u02D9');
						}
					});

					sub.add({
						title : '\u0387 (middle dot)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u0387');
						}
					});

					sub.add({
						title : '\u02BC (modifier letter apostophe)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u02BC');
						}
					});

					sub.add({
						title : '? (question mark)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '?');
						}
					});

					sub.add({
						title : '; (semicolon)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '&semicolon;');
						}
					});

					sub = m.addMenu({
						title : 'Blank spaces',
						id : 'menu-decoration-blankspaces'
					});

					sub.add({
						title : 'add',
						id : 'menu-decoration-blankspaces-add',
						icons : false,
						onclick : function() {
							ed.execCommand('mceAddSpaces');
						}
					});

					sub.add({
						title : 'edit',
						id : 'menu-decoration-blankspaces-edit',
						onclick : function() {
							ed.execCommand('mceEditSpaces');
						}
					});

					sub.add({
						title : 'delete',
						id : 'menu-decoration-blankspaces-delete',
						onclick : function() {
							ed.execCommand('wceDelNode');
						}
					});

					sub.onShowMenu.add(function(m) {
						var items = m.items;
						if (w.type == 'spaces') {
							items['menu-decoration-blankspaces-add'].setDisabled(true);
							items['menu-decoration-blankspaces-edit'].setDisabled(false);
							items['menu-decoration-blankspaces-delete'].setDisabled(false);
						} else {
							items['menu-decoration-blankspaces-add'].setDisabled(false);
							items['menu-decoration-blankspaces-edit'].setDisabled(true);
							items['menu-decoration-blankspaces-delete'].setDisabled(true);
						}
					});

				});

				// Return the new menu button instance
				return c;

			case 'abbreviation':
				var c = cm.createMenuButton('menu-abbreviation', {
					title : 'Abbreviated text',
					image : tinyMCE.baseURL + '/plugins/wce/img/button_A-new.png',
					icons : false
				});

				c.onRenderMenu.add(function(c, m) {
					var w = ed.WCE_VAR;
					m.add({
						title : 'add',
						id : 'menu-abbreviation-add',
						onclick : function() {
							ed.execCommand('mceAddAbbr');
						}
					});

					m.add({
						title : 'edit',
						id : 'menu-abbreviation-edit',
						onclick : function() {
							ed.execCommand('mceEditAbbr');
						}
					});

					m.add({
						title : 'delete',
						id : 'menu-abbreviation-delete',
						onclick : function() {
							ed.execCommand('wceDelNode');
						}
					});

					m.onShowMenu.add(function(m) {
						var items = m.items;
						if (w.type == 'abbr') {
							items['menu-abbreviation-add'].setDisabled(true);
							items['menu-abbreviation-edit'].setDisabled(false);
							items['menu-abbreviation-delete'].setDisabled(false);
						} else {
							items['menu-abbreviation-add'].setDisabled(false);
							items['menu-abbreviation-edit'].setDisabled(true);
							items['menu-abbreviation-delete'].setDisabled(true);
						}
					});
				});

				return c;

			case 'paratext':
				var c = cm.createMenuButton('menu-paratext', {
					title : 'Paratext',
					image : tinyMCE.baseURL + '/plugins/wce/img/button_P-new.png',
					icons : false
				});

				c.onRenderMenu.add(function(c, m) {
					var w = ed.WCE_VAR;
					m.add({
						title : 'add',
						id : 'menu-paratext-add',
						onclick : function() {
							ed.execCommand('mceAddParatext');
						}
					});

					m.add({
						title : 'edit',
						id : 'menu-paratext-edit',
						onclick : function() {
							ed.execCommand('mceEditParatext');
						}
					});

					m.add({
						title : 'delete',
						id : 'menu-paratext-delete',
						onclick : function() {
							ed.execCommand('wceDelNode');
						}
					});

					m.onShowMenu.add(function(m) {
						var items = m.items;
						if (w.type == 'paratext') {
							items['menu-paratext-add'].setDisabled(true);
							items['menu-paratext-edit'].setDisabled(false);
							items['menu-paratext-delete'].setDisabled(false);
						} else {
							items['menu-paratext-add'].setDisabled(false);
							items['menu-paratext-edit'].setDisabled(true);
							items['menu-paratext-delete'].setDisabled(true);
						}
					});
				});

				return c;

			case 'note':
				var c = cm.createMenuButton('menu-note', {
					title : 'Note',
					image : tinyMCE.baseURL + '/plugins/wce/img/button_N-new.png',
					icons : false
				});

				c.onRenderMenu.add(function(c, m) {
					var w = ed.WCE_VAR;
					m.add({
						title : 'add',
						id : 'menu-note-add',
						onclick : function() {
							ed.execCommand('mceAddNote');
						}
					});

					m.add({
						title : 'edit',
						id : 'menu-note-edit',
						onclick : function() {
							ed.execCommand('mceEditNote');
						}
					});

					m.add({
						title : 'delete',
						id : 'menu-note-delete',
						onclick : function() {
							ed.execCommand('wceDelNode');
						}
					});

					m.onShowMenu.add(function(m) {
						var items = m.items;
						if (w.type == 'note') {
							items['menu-note-add'].setDisabled(true);
							items['menu-note-edit'].setDisabled(false);
							items['menu-note-delete'].setDisabled(false);
						} else {
							items['menu-note-add'].setDisabled(false);
							items['menu-note-edit'].setDisabled(true);
							items['menu-note-delete'].setDisabled(true);
						}
					});
				});

				return c;
			}

			return null;
		},

		_wceAdd : function(ed, url, htm, w, h, inline, add_new_wce_node) {
			ed.windowManager.open({
				file : url + htm,
				width : w + ed.getLang('example.delta_width', 0),
				height : h + ed.getLang('example.delta_height', 0),
				inline : inline
			}, {
				plugin_url : url,
				add_new_wce_node : add_new_wce_node,
				wceobj : WCEObj
			});

		},

		// bei adptive Selection
		_getTextLeftPosition : function(startText, startOffset) {
			if (typeof startText == 'undefined')
				return startOffset;

			var ch, pre_ch;
			var nbsp = '\xa0';
			var hasBlank = false;
			for ( var i = startOffset; i <= startText.length; i++) {
				ch = startText.charAt(i);

				if (ch == ' ' || ch == nbsp) {
					hasBlank = true;
				}
				if (ch != ' ' && ch != nbsp) {
					pre_ch = startText.charAt(i - 1);
					if (i == 0 || pre_ch == ' ' || pre_ch == nbsp || hasBlank) {
						return i;
					}
				}
				startOffset = i;
			}

			// Ende des String
			if (startOffset == startText.length) {
				return -2;
			}
			return startOffset;
		},

		_getNextEnd : function(endText, startOffset) {
			if (!endText) {
				return startOffset;
			}

			endText = endText.replace(/\xa0/gi, ' ');
			startOffset = endText.indexOf(' ', startOffset);
			if (startOffset < 0) {
				startOffset = endText.length;
			}
			return startOffset;
		},

		// bei adptive Selection
		_getTextRightPosition : function(endText, endOffset) {
			var ch;
			var nbsp = '\xa0';

			// Endespunkt der Auswahl
			for ( var i = endOffset; i > -1; i--) {
				// ende des Textes
				if (i == endText.length && i > 0 && endText.charAt(i - 1) != ' ' && endText.charAt(i - 1) != nbsp)
					break;

				ch = endText.charAt(i);

				if (ch == ' ' || ch == nbsp) {
					if (i > 0 && (endText.charAt(i - 1) != ' ' && endText.charAt(i - 1) != nbsp))
						break;
				}
				endOffset--;
			}

			return endOffset;
		},

		_getTextNode : function(_node) {
			var _child;
			if (!_node.nodeName)
				return _node;

			while (!_node.nodeName.match(/text/)) {
				_child = _node.childNodes[0];
				if (_child == null || typeof (_child) == 'undefined') {
					break;
				}
				_node = _child;
			}
			return _node;
		},

		_wceAddNoDialog : function(ed, wceType, character, number) {
			var content = ed.selection.getContent();
			// var style = 'style="border: 1px dotted #f00; margin:0px; padding:0;"';
			var wceClass, wceAttr, wceOrig;

			switch (wceType) {
			case 'pc':
				wceClass = ' class="pc"';
				wceAttr = ' wce="' + ed.wceTypeParamInClass + '=' + wceType + '"';  
				ed.selection.setContent('<span' + wceAttr + wceClass + '>' + character + '</span> ');
				break;
			case 'abbr':
				// style = 'style="border: 1px dotted #f00; margin:0px; padding:0;"';
				wceClass = ' class="abbr"';
				wceOrig = ' wce_orig="' + character + '"';
				wceAttr = '"wce=__t=abbr&amp;__n=&amp;original_abbr_text=&amp;abbr_type=nomSac&amp;abbr_type_other=&amp;add_overline=&amp;insert=Insert&amp;cancel=Cancel"';
				ed.selection.setContent('<span ' + wceAttr + wceOrig + wceClass + '>' + character + '</span> ');
				break;
			case 'brea':
				// style = 'style="border: 1px dotted #f00; margin:0px; padding:0; color:#666"';
				wceClass = ' class="brea"';
				wceAttr = 'wce="__t=brea&amp;__n=&amp;break_type=lb&amp;number=' + number + '&amp;pb_type=&amp;fibre_type=&amp;running_title=&amp;lb_alignment=&amp;insert=Insert&amp;cancel=Cancel" ';
				if (character == 'lb') {
					// line break at the end of a word
					if (number === 0) {
						// for a line break without an explicit number
						number = ++lcnt;
					}

					// var num = "";
					/*
					 * while (num == "") { num = prompt("Number of line break", ""); }
					 */
					ed.selection.setContent('<span ' + wceAttr + wceClass + '>' + '<br/>&crarr;' + '</span> ');
					lcnt = number;

					// ed.selection.select(ed.getBody(), true); // select complete text
					return;

					// ed.execCommand('printData');
				} else if (character == 'lbm') {
					// line break in the middle of a word
					if (number === 0) {
						// for a line break without an explicit number
						number = ++lcnt;
					}
					// var num = "";
					/*
					 * while (num == "") { num = prompt("Number of line break", ""); }
					 */

					wceAttr = 'wce="__t=brea&amp;__n=&amp;break_type=lb&amp;number=' + number + '&amp;pb_type=&amp;fibre_type=&amp;running_title=&amp;lb_alignment=&amp;insert=Insert&amp;cancel=Cancel" ';
					ed.selection.setContent('<span ' + wceAttr + wceClass + '>' + '&#45;<br/>&crarr;' + '</span> ');
					lcnt = number;
				} else if (character == 'cb') {
					// column break
					if (number === 0) {
						// for a line break without an explicit number
						number = ++ccnt;
					}

					wceAttr = 'wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=' + number + '&amp;pb_type=&amp;fibre_type=&amp;running_title=&amp;lb_alignment=&amp;insert=Insert&amp;cancel=Cancel" ';
					ed.selection.setContent('<br/><span ' + wceAttr + wceClass + '>' + 'CB' + '</span> ');
					ccnt = number;
				} else if (character == 'pb') {
					// page break
					var new_number = 0;
					var new_pb_type = "";
					if (number === 0) {
						// for a page break without an explicit number
						number = ++pcnt;
					}
					pcnt = number;
					new_number = number;

					if (rectoverso === 'true') {
						new_number = Math.ceil(number / 2);
						if (number % 2 == 0) {
							// verso page
							new_pb_type = "v";
						} else {
							// recto page
							new_pb_type = "r";
						}
					}
					wceAttr = 'wce="__t=brea&amp;__n=&amp;break_type=pb&amp;number=' + new_number + '&amp;pb_type=' + new_pb_type + '&amp;fibre_type=&amp;running_title=&amp;lb_alignment=&amp;insert=Insert&amp;cancel=Cancel' + '"';
					ed.selection.setContent('<br/><span ' + wceAttr + wceClass + '>' + 'PB' + '</span> ');

					// duplication cf. wce.js, line 215
					// ed.execCommand('mceAdd_brea', 'cb', '1');
					// ed.execCommand('mceAdd_brea', 'lb', '1');
				} else {
					// quire break
					if (number === 0) {
						// for a line break without an explicit number
						number = ++qcnt;
					}
					wceAttr = 'wce="__t=brea&amp;__n=&amp;break_type=gb&amp;number=' + number + '&amp;pb_type=&amp;fibre_type=&amp;running_title=&amp;lb_alignment=&amp;insert=Insert&amp;cancel=Cancel' + '" ';
					ed.selection.setContent('<br/><span ' + wceAttr + wceClass + '>' + 'QB' + '</span> ');
					qcnt = number;
				}
				break;
			case 'part_abbr':
				// part-worded abbreviations
				var rng = ed.selection.getRng(true);
				wceClass = ' class="part_abbr"';
				var startContainer = rng.startContainer; 
				
				if(startContainer.nodeType!=3) 
					return ;
				
				var startText = startContainer.nodeValue;
				var text = startText.substr(0, rng.startOffset);
				var li = text.lastIndexOf('(');
				if (li > -1) {				
					var part_abbr = text.substr(li) + ')'; 
					rng.setStart(startContainer,li);
					ed.selection.setRng(rng);
					wceAttr = 'wce="' + ed.wceTypeParamInClass + '=' + wceType + '" ';
					ed.selection.setContent('<span ' + wceAttr + wceClass + '>' + part_abbr + '</span>'); 
				} else {
					alert("Error at part-worded abbreviation. Parentheses do not match or invalid nesting!");
				}
				break;
			/*
			 * case 'formatting_capitals': //Capitals ed.selection.setContent('<span wce="' + ed.wceTypeParamInClass + '=' + wceType + '&amp;height=' + character + '"' + style + '>' + content + '</span>'); break;
			 */
			case 'unclear': // uncertain letters
				selection = ed.selection.getContent();
				var unclear_text = "";
				var newContent = "";
				var word = "";
				var unclear_text = "";
				wceClass = ' class="unclear"';
				for ( var i = 0; i < selection.length; i++) {
					// Divide input into words
					if (selection.charAt(i) == ' ') {
						// Space -> new word
						wceAttr = 'wce="__t=unclear&amp;__n=&amp;original_text=' + word + '&amp;insert=Insert&amp;cancel=Cancel"';
						newContent += '<span ' + wceAttr + wceClass + '>' + unclear_text + '</span> ';
						word = "";
						unclear_text = "";
					} else {
						word += selection.charAt(i);
						unclear_text += selection.charAt(i) + '&#x0323;';
					}
				}
				// add last part of selection
				newContent += '<span wce="__t=unclear&amp;__n=&amp;original_text=' + word + '&amp;insert=Insert&amp;cancel=Cancel" ' + wceClass + '>' + unclear_text + '</span>';
				ed.selection.setContent(newContent);
				break;
			case 'ghostpage':
				// Ghost page
				// style = 'style="border: 1px dotted #f00; margin:0px; padding:0; color:#666"';
				wceClass = ' class="ghostpage"';
				wceAttr = 'wce="__t=gap&amp;__n=&amp;original_gap_text=&amp;gap_reason=absent&amp;unit=page&amp;unit_other=&amp;extent=1&amp;supplied_source=na27&amp;supplied_source_other=&amp;insert=Insert&amp;cancel=Cancel" ';
				ed.selection.setContent('<span ' + wceAttr + wceClass + '>Ghost page</span>');
				break;
			default:
				wceClass = ' class="' + wceType + '"';
				wceAttr = 'wce="' + ed.wceTypeParamInClass + '=' + wceType + '" ';
				ed.selection.setContent('<span ' + wceAttr + wceClass + '>' + content + '</span>');
			}
		},

		_stopEvent : function(ed, e) {
			var evs = ed.dom.events;
			evs.prevent(e);
			evs.stop(e);
			return false;

			// if (e.stopPropagation) {
			// e.stopPropagation();
			// } else if (window.event) {
			// window.event.cancelBubble = true;
			// }
			// if (e.preventDefault) {
			// e.preventDefault();
			// }
			//			
			// e.returnValue = false;
			// return false;
		},

		/*
		 * 
		 */
		_moveCaretToPreviousSiblingEnd : function(ed, rng) {
			var startContainer = rng.startContainer;
			var pre = startContainer.previousSibling;

			if (!pre) {
				startContainer = startContainer.parentNode;
				pre = startContainer.previousSibling;
			}
			if (pre) {
				if (pre.nodeType == 1) {
					var preTextNode = WCEObj._getLastTextNodeOfNode(ed, pre);
					if (preTextNode) {
						var len = preTextNode.length;
						rng.setStart(preTextNode, len);
						rng.setEnd(preTextNode, len);
					}
					ed.selection.setRng(rng);
				} else if (pre.nodeType == 3) {
					// for not IE
					var len = pre.nodeValue.length;
					if (len > -1) {
						rng.setStart(pre, len);
						rng.setEnd(pre, len)
					}
				}

				WCEObj._setWCEVariable(ed);
				WCEObj._redrawContols(ed);
			}
		},

		_setKeyDownEvent : function(ed, e) {
			if (!e) {
				var e = window.event;
			}

			var ek = e.keyCode || e.charCode || 0;
			// allow all arrow key
			if (ek == 17 || (ek > 32 && ek < 41)) {
				return;
			}

			var wcevar = ed.WCE_VAR;
			var _stopEvent = WCEObj._stopEvent;
			var _wceAdd = WCEObj._wceAdd;
			var _wceAddNoDialog = WCEObj._wceAddNoDialog;

			// every keyDown only delete one char
			if (!tinymce.isOpera && (ek == 46 || ek == 8)) {
				ed.keyDownDelCount++;
				if (ed.keyDownDelCount > 1) {
					WCEObj._setWCEVariable(ed);
					WCEObj._redrawContols(ed);
					wcevar.isRedraw = true;
					return _stopEvent(ed, e);
				}
			}

			if (wcevar.inputBlock && !e.ctrlKey) {
				return (_stopEvent(ed, e))
			}

			// TODO: if no short_cut B, C ,Z ,Y .....
			if (wcevar.isInBE && !e.ctrlKey) {
				// keydown for insert letter
				if (wcevar.isc && wcevar.isAtNodeEnd && ek != 8 && ek != 46) {
					var isSpaceKey = WCEObj._insertSpace(ed, ek);
					WCEObj._setWCEVariable(ed);
					WCEObj._redrawContols(ed);
					ed.WCE_VAR.isRedraw = true;
					if (isSpaceKey) {
						return _stopEvent(ed, e);
					}
				} else if (ek == 46 && wcevar.isAtNodeEnd && !wcevar.isNextBE) {

				} else {
					return _stopEvent(ed, e);
				}
			}

			// key "entf"
			if (ek == 46 && wcevar.isNextBE && wcevar.isAtNodeEnd) {
				return _stopEvent(ed, e);
			}

			if (ek == 13 || ek == 10) {
				if (e.shiftKey) {
					// Shift+Enter -> break dialogue
					if (wcevar.type != 'break') {
						ed.execCommand('mceAddBreak');
					}

				} else {
					// Enter -> line break
					var rng = ed.selection.getRng(true);
					var startNode = rng.startContainer;
					var startText = startNode.nodeValue;
					var startOffset = rng.startOffset;
					var indexOfEnd = WCEObj._getNextEnd(startText, startOffset);

					if (indexOfEnd && indexOfEnd == startOffset) {
						// at the end of a word
						_wceAddNoDialog(ed, 'brea', 'lb', ++lcnt);
					} else {
						// in the middle of a word
						_wceAddNoDialog(ed, 'brea', 'lbm', ++lcnt);
					}

				}

				return _stopEvent(ed, e);
			}

			// Add <pc> for some special characters
			if (ek == 59 && !e.shiftKey) { // ; en
				tinyMCE.activeEditor.execCommand('mceAdd_pc', ';');
			} else if (ek == 188 && e.shiftKey) {
				// ; dt < en
				tinyMCE.activeEditor.execCommand('mceAdd_pc', ';');
			} else if (ek == 188 && !e.shiftKey) {
				// ,
				tinyMCE.activeEditor.execCommand('mceAdd_pc', ',');
			} else if (ek == 190 && !e.shiftKey) {
				// .
				tinyMCE.activeEditor.execCommand('mceAdd_pc', '.');
			} else if (ek == 191 && e.shiftKey) {
				// ? en
				tinyMCE.activeEditor.execCommand('mceAdd_pc', '?');
			} else if (ek == 219 && e.shiftKey) {
				// ? dt
				tinyMCE.activeEditor.execCommand('mceAdd_pc', '?');
			} else if (ek == 56 && e.shiftKey) {
				// TODO?
			} else if (ek == 57 && e.shiftKey) {
				// Find corresponding ( and create substring
				_stopEvent(ed, e);
				// e.stopImmediatePropagation();
				_wceAddNoDialog(ed, 'part_abbr', '');
			}
		},

		/**
		 * Initializes the plugin,
		 * 
		 * @param {tinymce.Editor}
		 *            ed Editor instance that the plugin is initialized in.
		 * @param {string}
		 *            url Absolute URL to where the plugin is located.
		 */
		init : function(ed, url) {
			var _wceAdd = WCEObj._wceAdd;
			var _wceAddNoDialog = WCEObj._wceAddNoDialog;

			ed.keyDownDelCount = 0;

			// setWCE_CONTROLS
			ed.onNodeChange.add(function(ed, cm, n) {
				WCEObj._setWCEVariable(ed);
				WCEObj._redrawContols(ed);
			});

			ed.onMouseUp.addToTop(function(ed, e) {
				// for IE, problem when startOffset==0
				if (tinyMCE.isIE && ed.selection.isCollapsed()) {
					var rng = ed.selection.getRng(true);
					if (rng.startOffset != 0) {
						return;
					}
					WCEObj._moveCaretToPreviousSiblingEnd(ed, rng);
				}

			});

			ed.onKeyUp.addToTop(function(ed, e) {
				ed.keyDownDelCount = 0;

				// wenn redraw bei keyDown nicht gemacht
				if (!ed.WCE_VAR.isRedraw) {
					WCEObj._setWCEVariable(ed);
					WCEObj._redrawContols(ed);
					ed.WCE_VAR.isRedraw = true;
					return;
				}

				ed.WCE_VAR.isRedraw = false;
			});

			if (tinymce.isOpera) {
				ed.onKeyPress.addToTop(function(ed, e) {
					if (!e) {
						var e = window.event;
					}
					var ek = e.keyCode || e.charCode || 0;
					if (ek == 46 || ek == 8) {
						ed.keyDownDelCount++;
						if (ed.keyDownDelCount > 1) {
							WCEObj._setWCEVariable(ed);
							WCEObj._redrawContols(ed);
							ed.WCE_VAR.isRedraw = true;
							return WCEObj._stopEvent(ed, e);
						}
					}
				});
			}

			ed.onKeyDown.addToTop(WCEObj._setKeyDownEvent);

			// class="__t=wce_type&__n=wce_name...."
			ed.wceTypeParamInClass = '__t';
			ed.wceNameParamInClass = '__n';

			// Information-box
			ed.wceInfoBox = document.createElement("div");
			document.body.appendChild(ed.wceInfoBox);
			tinymce.DOM.setStyles(ed.wceInfoBox, {
				'height' : '300px',
				'font-size' : '12px',
				'width' : 'auto',
				'position' : 'absolute',
				'z-index' : '300000',
				'overflow' : 'auto',
				'display' : 'none'
			});

			// add adaptive selection checkbox
			ed.onPostRender.add(function(ed, cm) {
				var id = ed.id + '_adaptive_selection';
				var row = tinymce.DOM.get(ed.id + '_path_row');
				if (row) {
					tinymce.DOM.add(row.parentNode, 'div', {
						'style' : ''
					}, '<input type="checkbox" checked="checked"  id="' + id + '"> Adaptive selection</input>');
				}
			});

			// html to tei
			ed.addCommand('mceHtml2Tei', function() {
				_wceAdd(ed, url, '/html2tei.htm', 580, 420, 1, true);

			});

			// add showTeiByHtml button
			ed.addButton('showTeiByHtml', {
				title : 'For test: \n get TEI output from HTML',
				cmd : 'mceHtml2Tei',
				image : url + '/img/xml.jpg'
			});
			
			
			// tei to html  only for Test
			ed.addCommand('mceTei2Html', function() {
				_wceAdd(ed, url, '/tei2html.htm', 580, 420, 1, true);

			});

			// add showHtmlByTei button
			ed.addButton('showHtmlByTei', {
				title : 'For test: \n  get HTML output from TEI',
				cmd : 'mceTei2Html',
				image : url + '/img/xmlinput.jpg'
			});

			/*
			 * onInit
			 * 
			 */
			ed.onInit.add(function() {
				WCEObj._initWCEConstants(ed);
				WCEObj._initWCEVariable(ed);

				var wcevar = ed.WCE_VAR;

				ed.undoManager.onAdd.add(function(um, level) {
					if (ed.WCE_VAR.stopUndo) {
						var i;
						for ( var p in um.data) {
							i = p;
						}
						ed.WCE_VAR.stopUndo = false;

						// um.data[i] = null; //because Error in IE
						um.data[i] = um.data[i - 1];
					}
				});

				// Add shortcuts for wce
				ed.addShortcut('ctrl+b', 'Add break', 'mceAddBreak_Shortcut');
				ed.addShortcut('ctrl+c', 'Add correction', 'mceAddCorrection_Shortcut');
				ed.addShortcut('ctrl+u', 'Add unclear text', 'mceAddUnclearText_Shortcut');
				ed.addShortcut('ctrl+g', 'Add gap', 'mceAddGap_Shortcut');
				ed.addShortcut('ctrl+a', 'Add abbreviation', 'mceAddAbbr_Shortcut');
				ed.addShortcut('ctrl+p', 'Add correction', 'mceAddParatext_Shortcut');
				ed.addShortcut('ctrl+n', 'Add correction', 'mceAddNote_Shortcut');

				tinymce.dom.Event.add(ed.getDoc(), 'mousemove', function(e) {
					WCEObj._showWceInfo(ed, e);
				});
			});

			// Get selected span node
			ed.addCommand('getWceNode', function() {
				var sele_node = ed.selection.getNode();
				if (!sele_node || sele_node.nodeType == 3) {
					return null;
				}
				var wceAttr = sele_node.getAttribute('wce');
				if (wceAttr && wceAttr.indexOf(ed.wceTypeParamInClass) == 0) {
					return sele_node;
				}
				return null;
			});

			// delete nodeName
			ed.addCommand('wceDelNode', function() {
				var wceNode = ed.execCommand('getWceNode');
				if (wceNode) {
					ed.selection.select(wceNode);
					var wceAttr = wceNode.getAttribute('wce');
					var originalText = wceNode.getAttribute('wce_orig');

					/*
					 * // if tag to remove var node_to_remove = [ 'paratext', 'note', 'gap', 'brea' ]; var to_remove = false; for ( var i = 0; i < node_to_remove.length; i++) { if (wceAttr.indexOf(ed.wceTypeParamInClass + '=' + node_to_remove[i]) > -1) { to_remove = true; break; } }
					 * 
					 * if (to_remove) { $(wceNode).remove(); } else if (typeof originalText != 'undefined') { ed.selection.setContent(originalText);alert(originalText); }
					 */
					wceNode.parentNode.removeChild(wceNode);

					if (originalText)
						ed.selection.setContent(originalText);

					ed.isNotDirty = 0;
				}
			});

			// Add breaks
			ed.addCommand('mceAddBreak', function() {
				_wceAdd(ed, url, '/break.htm?mode=new&quire=' + ++qcnt + '&page=' + ++pcnt + '&column=' + ++ccnt + '&line=' + ++lcnt + '&rectoverso=' + rectoverso, 480, 320, 1, true);
			});
			// Edit breaks
			ed.addCommand('mceEditBreak', function() {
				_wceAdd(ed, url, '/break.htm?mode=edit&quire=' + ++qcnt + '&page=' + ++pcnt + '&column=' + ++ccnt + '&line=' + ++lcnt + '&rectoverso=' + rectoverso, 480, 320, 1, false);
			});

			ed.addCommand('mceAddBreak_Shortcut', function() {
				var w = ed.WCE_VAR;
				if (w.not_B) {
					return;
				}
				if (w.type == 'break') {
					ed.execCommand('mceEditBreak');
				} else {
					ed.execCommand('mceAddBreak');
				}
			});

			// Add corrections
			ed.addCommand('mceAddCorrection', function() {

				var _add_new_wce_node = true;
				var sele_node = ed.selection.getNode();
				var wceNode = ed.execCommand('getWceNode');
				var wceAttr;
				if (wceNode) {
					wceAttr = wceNode.getAttribute('wce');
				}

				// wenn Caret in wce_corr
				if (ed.selection.isCollapsed()) {
					if (!wceNode) {
						return;
					}
					if (!wceAttr || !wceAttr.match(/corr/)) {
						return;
					}
					_add_new_wce_node = false;
				} else if (wceNode && wceAttr && wceAttr.match(/corr/)) {
					_add_new_wce_node = false;
				}
				_wceAdd(ed, url, '/correction.htm', 720, 560, 1, _add_new_wce_node);
			});

			// Edit corrections
			ed.addCommand('mceEditCorrection', function() {
				_wceAdd(ed, url, '/correction.htm', 720, 560, 1, false);
			});

			ed.addCommand('mceAddCorrection_Shortcut', function() {
				ed.execCommand('mceAddCorrection');
			});

			// Add gaps/*********/
			ed.addCommand('mceAddGap', function() {
				_wceAdd(ed, url, '/gap.htm', 480, 320, 1, true);
			});
			// Edit gaps and spacing
			ed.addCommand('mceEditGap', function() {
				_wceAdd(ed, url, '/gap.htm', 480, 320, 1, false);
			});

			ed.addCommand('mceAddGap_Shortcut', function() {
				if (wcevar.not_D) {
					return;
				}
				if (wcevar.type == 'gap') {
					ed.execCommand('mceEditGap');
				} else {
					ed.execCommand('mceAddGap');
				}
			});

			// Add unclear text/*********/
			ed.addCommand('mceAddUnclearText', function() {
				// _wceAddNoDialog(ed, 'unclear'); //option
				// without dialogue for reason
				_wceAdd(ed, url, '/unclear_text.htm', 480, 320, 1, true);
			});
			// Edit unclear text
			ed.addCommand('mceEditUnclearText', function() {
				_wceAdd(ed, url, '/unclear_text.htm', 480, 320, 1, false);
			});

			ed.addCommand('mceAddUnclearText_Shortcut', function() {
				if (wcevar.not_D) {
					return;
				}

				if (wcevar.type == 'unclear') {
					ed.execCommand('mceEditUnclearText');
				} else {
					ed.execCommand('mceAddUnclearText');
				}
			});

			ed.addCommand('mceAddGhostPage', function() {
				_wceAddNoDialog(ed, 'ghostpage');
			});

			// Add note/*********/
			ed.addCommand('mceAddNote', function() {
				_wceAdd(ed, url, '/note.htm', 480, 380, 1, true);
			});
			// Edit note
			ed.addCommand('mceEditNote', function() {
				_wceAdd(ed, url, '/note.htm', 480, 380, 1, false);
			});

			ed.addCommand('mceAddNote_Shortcut', function() {
				if (wcevar.not_N) {
					return;
				}
				if (wcevar.type == 'note') {
					ed.execCommand('mceEditNote');
				} else {
					ed.execCommand('mceAddNote');
				}
			});

			// Add abbreviation/*********/
			ed.addCommand('mceAddAbbr', function() {
				_wceAdd(ed, url, '/abbr.htm', 480, 320, 1, true);
			});
			// Edit abbreviation
			ed.addCommand('mceEditAbbr', function() {
				_wceAdd(ed, url, '/abbr.htm', 480, 320, 1, false);
			});

			ed.addCommand('mceAddAbbr_Shortcut', function() {
				if (wcevar.not_A) {
					return;
				}
				if (wcevar.type == 'abbr') {
					ed.execCommand('mceEditAbbr');
				} else {
					ed.execCommand('mceAddAbbr');
				}
			});

			// Add Spaces/*********/
			ed.addCommand('mceAddSpaces', function() {
				_wceAdd(ed, url, '/spaces.htm', 480, 320, 1, true);
			});

			// Add Spaces/*********/
			ed.addCommand('mceEditSpaces', function() {
				_wceAdd(ed, url, '/spaces.htm', 480, 320, 1, false);
			});

			// Add paratext/*********/
			ed.addCommand('mceAddParatext', function() {
				_wceAdd(ed, url, '/paratext.htm', 640, 480, 1, true);
			});
			// Edit paratext
			ed.addCommand('mceEditParatext', function() {
				_wceAdd(ed, url, '/paratext.htm', 640, 480, 1, false);
			});

			ed.addCommand('mceAddParatext_Shortcut', function() {
				if (wcevar.not_P) {
					return;
				}

				if (wcevar.type == 'paratext') {
					ed.execCommand('mceEditParatext');
				} else {
					ed.execCommand('mceAddParatext');
				}
			});

			// Edit Metadata
			/*
			 * ed.addCommand('mceAddMetadata', function() { _wceAdd(ed, url, '/metadata.htm', 600, 450, 1, false); });
			 */

			ed.addCommand('mceAdd_abbr', function(c) {
				_wceAddNoDialog(ed, 'abbr', c);
			});

			ed.addCommand('mceAdd_brea', function(c, number) {
				_wceAddNoDialog(ed, 'brea', c, number);
			});

			ed.addCommand('mceAdd_pc', function(c) {
				_wceAddNoDialog(ed, 'pc', c);
			});

			ed.addCommand('mceAddCapitals', function() {
				_wceAdd(ed, url, '/capitals.htm', 480, 320, 1, true);
			});

			ed.addCommand('mceEditCapitals', function() {
				_wceAdd(ed, url, '/capitals.htm', 480, 320, 1, false);
			});

			ed.addCommand('mceAdd_formatting', function(c) {
				_wceAddNoDialog(ed, 'formatting_' + c, '');
			});

			ed.addCommand('setCounter', function(bt, n) {
				// First reset counters
				qcnt--;
				pcnt--;
				ccnt--;
				lcnt--;
				// set only the one correct counter
				switch (bt) {
				case 'gb':
					qcnt = n;
					break;
				case 'pb':
					pcnt = n;
					break;
				case 'cb':
					ccnt = n;
					break;
				case 'lb':
					lcnt = n;
					break;
				}
			});

			ed.addCommand('resetCounter', function() {
				// reset counter values when pressing "Cancel" at the break dialog
				qcnt--;
				pcnt--;
				ccnt--;
				lcnt--;
			});

			ed.addCommand('addToCounter', function(bt, n) {
				switch (bt) {
				case 'gb':
					qcnt = parseInt(qcnt) + parseInt(n);
					break;
				case 'pb':
					pcnt = parseInt(pcnt) + parseInt(n);
					break;
				case 'cb':
					ccnt = parseInt(ccnt) + parseInt(n);
					break;
				case 'lb':
					lcnt = parseInt(lcnt) + parseInt(n);
					break;
				}
			});

			ed.addCommand('printData', function() { // Problem in IE
				var ed = tinyMCE.activeEditor;
				var oldcontent = "";
				var newcontent = "";
				var oldnumber = 0;
				var endNumber = 0;
				var level = "lb";
				var higherlevel = "";
				var searchString = "";

				searchString = "break_type=" + level + "&amp;number=";

				if (level === 'lb')
					higherlevel = 'cb';
				else if (level === 'cb')
					higherlevel = 'pb';
				else if (level === 'pb')
					higherlevel = 'gb';

				ed.execCommand('mceInsertContent', false, '<span class="marker">\ufeff</span>'); // set a marker for the start

				ed.selection.select(ed.getBody(), true); // select complete text

				// save oldcontent as it is ...
				oldcontent = ed.selection.getContent();
				// ... and put the unchanged part into the output variable
				newcontent = oldcontent.substring(0, oldcontent.search('<span class="marker">')); // get start of overall content to be used unchanged.

				tinymce.activeEditor.selection.collapse(false); // collapse to end of selection
				ed.execCommand('mceInsertContent', false, '<span class="marker">\ufeff</span>'); // set a marker for the end

				var rng = ed.selection.getRng(1);
				var rng2 = rng.cloneRange();

				// set start of range to begin at the marker
				rng2.setStartAfter($(ed.getBody()).find('span.marker').get(0)); // start selection at marker
				rng2.setEndBefore($(ed.getBody()).find('span.marker').get(1)); // end selection at the end of the text, TODO: limit to region affected, i.e. till the next higher-level break
				ed.selection.setRng(rng2);

				oldcontent = ed.selection.getContent(); // get content to be modified

				$(ed.getBody()).find('span.marker').remove(); // delete marker

				ed.selection.setRng(rng);

				var pos = oldcontent.search(searchString);

				while (pos > -1) {
					pos += searchString.length // add length of searchString to found pos
					newcontent += oldcontent.substring(0, pos);
					endNumber = oldcontent.indexOf("&", pos + 1); // look for next "&" after searchString
					oldnumber = oldcontent.substring(pos, endNumber);
					newcontent += parseInt(oldnumber) + 1;
					oldcontent = oldcontent.substring(endNumber); // work on String starting right after number with "&"
					pos = oldcontent.search(searchString);
				}
				newcontent += oldcontent // add the rest
				// TODO: adjust corresponding counter, if no higher-level break follows

				ed.setContent(newcontent);
			});
		},

		/**
		 * Returns information about the plugin as a name/value array. The current keys are longname, author, authorurl, infourl and version.
		 * 
		 * @return {Object} Name/value array containing information about the plugin.
		 */
		getInfo : function() {
			return {
				longname : 'WCE plugin',
				author : 'WCE',
				authorurl : 'http://wce',
				infourl : 'http://wce',
				version : "0.1"
			};
		}
	};
	tinymce.create('tinymce.plugins.WCEObj', WCEObj);
	// Register plugin
	tinymce.PluginManager.add('wce', tinymce.plugins.WCEObj);
})();