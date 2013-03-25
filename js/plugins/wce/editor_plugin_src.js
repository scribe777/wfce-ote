/**
 * editor_plugin_src.js
 * 
 * Copyright 2009, Moxiecode Systems AB Released under LGPL License.
 * 
 * License: http://tinymce.moxiecode.com/license Contributing: http://tinymce.moxiecode.com/contributing
 */

(function() {
	//var qcnt = tinyMCE.activeEditor.teiIndexData['quireNumber']; // quire count
	var qcnt = 9;
	var pcnt = 9; // page count
	var ccnt = 1; // column count
	var lcnt = 1; // line count
	var rectoverso = 'true'; // counting as r/v

	// Load plugin specific language pack
	tinymce.PluginManager.requireLangPack('wce');

	/*
	 * WCEObj has variable and constants
	 */
	var WCEObj = {
		/*
		 * init wce constants: button name, element name ....
		 */
		_initWCEConstants : function(ed) {
			ed.WCE_CON = {};
			var w = ed.WCE_CON;

			// blocked elements :If the Caret is inside, this will prohibit the key operation
			w.blockedElements = new Array('gap', 'corr', 'chapter_number', 'verse_number', 'abbr', 'spaces', 'note', 'unclear', 'brea', 'paratext');

			// not blocked elements
			// w.normalElemente = new Array('unclear');

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
			w.control_PC = controls[ed_id + '_menu-punctuation'];
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
			w.isCollapsedAtNodeEnd = false; // is Caret at end of node?
			w.type = null; // Caret in welche wce type
			w.isInBE = false; // is Caret in blocked Element
			w.nextElem = null; // nextSibling
			w.isNextElemBE = false; // is nextSibling blocked Element
			w.isRedrawn = false;
			w.doAdaptivSel = false;
			w.inputDisable = false;
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
		 * As long as node is firstChild, find outmost Ancestor. Reverse of _getFirstTextNodeOfNode()
		 */
		_getAncestorIfFirstChild : function(ed, node) {
			var nodeName, parent;
			while (node) {
				nodeName = node.nodeName.toLowerCase();
				if (nodeName == ('body' || 'html')) {
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
		 * 
		 */
		_moveCaretToEndOfPreviousSibling : function(ed, rng, node) {
			var ancestor = WCEObj._getAncestorIfFirstChild(ed, node);
			if (ancestor) {
				var pre = ancestor.previousSibling;
				if (pre) {
					var preTextNode = WCEObj._getLastTextNodeOfNode(ed, pre);
					if (preTextNode) {
						var preTextNodeValue = preTextNode.nodeValue;
						var preTextNodeLength = preTextNodeValue.length;

						if (preTextNodeLength < 0) {
							preTextNodeLength = 0;
						}
						rng.setEnd(preTextNode, preTextNodeLength);
						WCEObj._setRNG(ed, rng);

						if (ed.WCE_VAR.doAdaptivSel) {
							return WCEObj._adaptiveSelection(ed, rng);
						}
					}
				}
			}

			return rng;
		},

		/*
		 * 
		 */
		_moveCaretToStartOfNextSibling : function(ed, rng, node) {
			var ancestor = WCEObj._getAncestorIfLastChild(ed, node);
			if (ancestor) {
				var next = ancestor.nextSibling;
				if (next) {
					var nextTextNode = WCEObj._getFirstTextNodeOfNode(ed, next);
					if (nextTextNode) {
						rng.setStart(nextTextNode, 0);
						WCEObj._setRNG(ed, rng);
						if (ed.WCE_VAR.doAdaptivSel) {
							return WCEObj._adaptiveSelection(ed, rng);
						}
					}
				}
			}

			return rng;
		},

		/*
		 * so lang as node is lastChild, find outmost Ancestor. Reverse of _getLastTextNodeOfNode()
		 */
		_getAncestorIfLastChild : function(ed, node) {
			var parent, nodeName;
			while (node) {
				nodeName = node.nodeName.toLowerCase();
				if (nodeName == "body" || nodeName == 'html') {
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
			w.not_P = b; // control M setActive?
			w.not_N = b; // control N setActive?
			w.not_PC = b; // control P setActive?
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
			if (w.control_PC) {
				w.control_PC.setDisabled(v.not_PC);
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

		// for IE
		_getSEL : function(ed) {
			var sel, win = ed.getWin();
			if (win.getSelection) {
				// IE 9
				sel = win.getSelection();
			} else {
				// IE <=8
				sel = rangy.getSelection(win);
			}
			return sel;
		},

		_getRNG : function(ed) {
			if (!tinyMCE.isIE) {
				return ed.selection.getRng(true);
			}

			// IE
			var sel = WCEObj._getSEL(ed);
			if (sel && sel.rangeCount > 0) {
				return sel.getRangeAt(0);
			}
			return null;
		},

		_setRNG : function(ed, rng) {
			if (!tinyMCE.isIE && !tinyMCE.isGecko) {
				ed.selection.setRng(rng);
			} else {
				var sel = WCEObj._getSEL(ed);
				if (sel.setSingleRange) {
					sel.setSingleRange(rng);
				} else {
					sel.removeAllRanges();
					sel.addRange(rng);
				}
			}
		},

		_selectionHasBlockElement : function(ed) {
			try {
				var elem = $('<div/>').html(ed.selection.getContent());
				var isWceBE = WCEObj._isWceBE;
				var testNode = function(node) {
					if (isWceBE(ed, node)) {
						return true;
					}
					var list = node.childNodes;
					if (!list) {
						return false;
					}

					for ( var i = 0, c, len = list.length; i < len; i++) {
						c = list[i];
						if (c.nodeType == 1) {
							return testNode(c);
						}
					}
					return false;
				};
				return testNode(elem[0]);
			} catch (e) {
				return false;
			}
		},

		/*
		 * update wce variable
		 */
		_setWCEVariable : function(ed) {
			// reset WCE_VAR
			WCEObj._resetWCEVariable(ed);

			// init
			var w = ed.WCE_VAR;
			var _isNodeTypeOf = WCEObj._isNodeTypeOf;
			var _setAllControls = WCEObj._setAllControls;
			var _getAncestorIfLastChild = WCEObj._getAncestorIfLastChild;
			var _getAncestorIfFirstChild = WCEObj._getAncestorIfFirstChild;
			var _moveCaretToEndOfPreviousSibling = WCEObj._moveCaretToEndOfPreviousSibling;
			var _moveCaretToStartOfNextSibling = WCEObj._moveCaretToStartOfNextSibling;
			var _adaptiveSelection = WCEObj._adaptiveSelection;
			var _getRNG = WCEObj._getRNG;
			// getRange
			var rng = WCEObj._getRNG(ed);
			if (!rng) {
				return;
			}

			var _isWceBE = WCEObj._isWceBE;
			var selectedNode;
			var startContainer = rng.startContainer;
			w.isc = ed.selection.isCollapsed();

			// delete in firefox can create empty element and startOffset==0
			if (startContainer.nodeType == 1 && !tinyMCE.isIE && startContainer.childNodes.length == 0 && rng.startOffset == 0 && startContainer.nodeName.toLowerCase != 'body' && startContainer.nodeName.toLowerCase != 'html') {
				startContainer.parentNode.removeChild(startContainer);
				return WCEObj._setWCEVariable(ed);
			}

			if (w.isc) {
				if (!WCEObj._canInsertCorrection(ed, rng))
					w.not_C = true; //Corrections should also be possible for single positions (blank first hand reading)
				w.not_A = true;

				// move caret to EndOfPreviousSibling, mainly for IE:
				if (rng.startOffset == 0) {
					rng = _moveCaretToEndOfPreviousSibling(ed, rng, startContainer);
				}
				startContainer = rng.startContainer;

				if (startContainer.nodeType == 3) {
					selectedNode = startContainer.parentNode;
					var startText = startContainer.nodeValue;
					if (startText && startText.length == rng.endOffset) {
						w.isCollapsedAtNodeEnd = true;
					}
				} else {
					selectedNode = startContainer;
				}

				if (!WCEObj._canInsertNote(ed, rng)) {
					w.not_N = true;
				}

				w.nextElem = WCEObj._getNextSiblingOfAncestor(ed, startContainer);
				w.isNextElemBE = _isWceBE(ed, w.nextElem);
			} else {
				// if text is selected
				w.not_B = true;
				w.not_N = true;

				var adaptiveCheckbox = tinymce.DOM.get(ed.id + '_adaptive_selection');
				if (adaptiveCheckbox && adaptiveCheckbox.checked) {
					w.doAdaptivSel = true;
					var tempRng = rng.cloneRange();
					rng = _adaptiveSelection(ed, rng);
					if (tempRng.startOffset == rng.startOffset && tempRng.endOffset == rng.endOffset) {
						// adaptiveCaret
						rng = WCEObj._adaptiveCaret(ed, rng);
					}
				} else {
					// adaptiveCaret
					rng = WCEObj._adaptiveCaret(ed, rng);
				}

				// w.inputDisable
				// find startNode,endNode
				var startNode, endNode, selectedNodeStart, selectedNodeEnd;
				var endContainer = rng.endContainer;

				startContainer = rng.startContainer;
				if (startContainer.parentNode === endContainer.parentNode) {
					startNode = startContainer.parentNode;
					endNode = startNode;
					selectedNodeStart = startNode;
					selectedNodeEnd = startNode;
				} else {
					if (startContainer.nodeType == 3) {
						selectedNodeStart = startContainer.parentNode;
						if (rng.startOffset == 0) {
							startNode = WCEObj._getAncestorIfFirstChild(ed, startContainer);
							if (startNode)
								startNode = startNode.parentNode;
						} else {
							startNode = startContainer.parentNode;
						}
					} else {
						startNode = startContainer;
						selectedNodeStart = startContainer;
					}
					if (endContainer.nodeType == 3) {
						selectedNodeEnd = endContainer.parentNode;
						var endText = endContainer.nodeValue;
						if (endText && rng.endOffset == endText.length) {
							endNode = WCEObj._getAncestorIfLastChild(ed, endContainer);
							if (endNode) {
								endNode = endNode.parentNode;
							}
						} else {
							endNode = endContainer.parentNode;
						}
					} else {
						endNode = endContainer;
						selectedNodeEnd = endContainer;
					}
				}

				if (startNode && startNode != endNode) {
					_setAllControls(ed, true);
					w.isInBE = true;
					w.type = null;
					w.inputDisable = true;
					return;
				}

				if (selectedNodeStart === selectedNodeEnd) {
					selectedNode = selectedNodeStart;
				} else {
					selectedNode = startNode;
				}

				if (WCEObj._selectionHasBlockElement(ed)) {
					w.inputDisable = true;
				}
			}

			w.isInBE = _isWceBE(ed, selectedNode);

			// get Type of wceNode
			if (_isNodeTypeOf(selectedNode, 'gap')) {
				_setAllControls(ed, true);
				w.not_D = false;
				if (WCEObj._canInsertNote(ed, rng)) {
					w.not_N = false;
				}
				w.type = 'gap';
			} else if (_isNodeTypeOf(selectedNode, 'corr')) {
				_setAllControls(ed, true);
				w.not_C = false;
				if (WCEObj._canInsertNote(ed, rng)) {
					w.not_N = false;
				}
				w.type = 'corr';
			} else if (_isNodeTypeOf(selectedNode, 'abbr')) {
				_setAllControls(ed, true);
				w.not_A = false;
				w.not_C = false;// Must be activated sometime, but the complete mechanism of combining elements is still a bit buggy
				if (WCEObj._canInsertNote(ed, rng)) {
					w.not_N = false;
				}
				w.type = 'abbr';
			} else if (_isNodeTypeOf(selectedNode, 'chapter_number')) {
				_setAllControls(ed, true);
				w.type = 'chapter_number';
			} else if (_isNodeTypeOf(selectedNode, 'verse_number')) {
				_setAllControls(ed, true);
				w.type = 'verse_number';
			} else if (_isNodeTypeOf(selectedNode, 'brea')) {
				_setAllControls(ed, true);
				w.not_B = false;
				w.type = 'break';
			} else if (_isNodeTypeOf(selectedNode, 'unclear')) {
				_setAllControls(ed, true);
				w.not_D = false;
				if (WCEObj._canInsertNote(ed, rng)) {
					w.not_N = false;
				}
				w.type = 'unclear';
			} else if (_isNodeTypeOf(selectedNode, 'spaces')) {
				_setAllControls(ed, true);
				w.not_O = false;
				if (WCEObj._canInsertNote(ed, rng)) {
					w.not_N = false;
				}
				w.type = 'spaces';
			} else if (_isNodeTypeOf(selectedNode, 'formatting_capitals')) {
				if (WCEObj._canInsertNote(ed, rng)) {
					w.not_N = false;
				}
				w.type = 'formatting_capitals';
			} else if (_isNodeTypeOf(selectedNode, 'paratext') || selectedNode.getAttribute('class') === 'commentary') { //special node for commentary note which is a paratextual element
				_setAllControls(ed, true);
				w.not_P = false;
				if (WCEObj._canInsertNote(ed, rng)) {
					w.not_N = false;
				}
				w.type = 'paratext';
			} else if (_isNodeTypeOf(selectedNode, 'note')) {
				_setAllControls(ed, true);
				w.not_N = false;
				w.type = 'note';
			}
		},

		// startCoantainer: if caret at end, move it to Beginn of nextSiling
		// endContainter: if caret at 0, move it to previousSibling
		_adaptiveCaret : function(ed, rng) {
			var startContainer = rng.startContainer;
			var startText = startContainer.nodeValue;
			if (startText) {
				if (rng.startOffset == startText.length) {
					rng = WCEObj._moveCaretToStartOfNextSibling(ed, rng, startContainer);
				}
			}

			if (rng.endOffset == 0) {
				rng = WCEObj._moveCaretToEndOfPreviousSibling(ed, rng, rng.endContainer);
			}

			return rng;
		},

		// only for mouseup
		_adaptiveSelection : function(ed, rng) {
			var startContainer = rng.startContainer; // #text
			var startOffset = rng.startOffset;

			var endContainer = rng.endContainer; // #text
			var endOffset = rng.endOffset;

			var startText = startContainer.nodeValue;
			var endText = endContainer.nodeValue;

			var newStartOffset, newEndOffset, rngIsChanged;

			if (startText) {
				var newStartOffset = WCEObj._getTextLeftPosition(startText, startOffset);
				if (newStartOffset != startOffset) {
					rng.setStart(startContainer, newStartOffset);
					rngIsChanged = true;
				}
			}

			if (endText) {
				var newEndOffset = WCEObj._getTextRightPosition(endText, endOffset);
				if (newEndOffset != endOffset) {
					rng.setEnd(endContainer, newEndOffset);
					rngIsChanged = true;
				}
			}

			if (rngIsChanged) {
				WCEObj._setRNG(ed, rng);
				WCEObj._adaptiveCaret(ed, rng);
			}
			return rng;
		},

		/*
		 * 
		 */
		_canInsertNote : function(ed, rng) {
			var endContainer = rng.endContainer;
			if (!endContainer) {
				return false;
			}
			var text = endContainer.nodeValue;
			if (text) {
				var endOffset = rng.endOffset;
				var len = text.length;

				if (endOffset == 0 && len > 0) {
					return false;
				}
				if (endOffset < len && endOffset > 0) {
					var c = text.charAt(endOffset - 1);
					var c1 = text.charAt(endOffset);
					if ((c != ' ' && c != '\xa0') && (c1 == ' ' || c1 == '\xa0')) {
						return true;
					}
				}
				if (endOffset == len && endOffset > 0) { //special case for first position after correction
					var c = text.charAt(endOffset - 1);
					var c1 = text.charAt(endOffset);
					if (c != ' ' && c != '\xa0' && !c1) {
						return true;
					}
				}
			}
			return false;
		},
		
		/*
		 * 
		 */
		_canInsertCorrection : function(ed, rng) {
			var startText = rng.startContainer.nodeValue;
			if (startText) {
				var startOffset = rng.startOffset;
				var indexOfEnd = WCEObj._getNextEnd(startText, startOffset);
			}
			if (rng.startOffset == indexOfEnd)
				return true;
			return false
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

				if (!k || k == 'undefined' || !v || v == 'undefined')
					continue;

				a[k] = decodeURIComponent(v);
			}
			return a;
		},

		/*
		 * insert space after Caret
		 */
		_insertSpace : function(ed, ek) {
			var w = ed.WCE_VAR;
			var next = w.nextElem;

			var sel = WCEObj._getSEL(ed);
			var rng = sel.getRangeAt(0);
			var rng1 = rng.cloneRange();
			var newText = document.createTextNode(" ");
			if (next) {
				next.parentNode.insertBefore(newText, next);
			} else {
				ed.getBody().appendChild(newText);
			}
			rng1.setStart(newText, 1);
			rng1.setEnd(newText, 1);

			if (sel.setSingleRange) {
				sel.setSingleRange(rng1);
			} else {
				sel.removeAllRanges();
				sel.addRange(rng1);
			}

			if (ek == 32) {
				return true;
			}
			return false;
		},

		_setInfoBoxOffset : function(ed, node) {
			var el = ed.getContentAreaContainer();
			var _x = 0;
			var _y = 0;
			while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
				_x += el.offsetLeft - el.scrollLeft;
				_y += el.offsetTop - el.scrollTop;
				el = el.offsetParent;
			}
			var nodeOffset = tinymce.DOM.getPos(node);
			var node_top = nodeOffset.y + _y;
			var node_left = nodeOffset.x + _x;

			var infoBox = ed.wceInfoBox;
			var infoBoxArrowTop = ed.wceInfoBoxArrowTop;
			var infoBoxArrowBottom = ed.wceInfoBoxArrowBottom;

			var node_w = parseInt($(node).outerWidth());
			var node_h = parseInt($(node).outerHeight());
			var infoBox_w = $(infoBox).outerWidth();
			var infoBox_h = $(infoBox).outerHeight();

			var infoBox_left = node_left;
			var infoBox_top = node_top + node_h;

			$(infoBoxArrowTop).css({
				'border-color' : 'transparent',
				'border-style' : 'solid',
				'border-width' : '6px',
				'height' : '0',
				'width' : '0'
			});

			$(infoBoxArrowBottom).css({
				'border-color' : 'transparent',
				'border-style' : 'solid',
				'border-width' : '6px',
				'height' : '0',
				'width' : '0'
			});

			var margin_left = '4px';
			if ((node_left + infoBox_w) > parseInt($(window).width())) {
				infoBox_left = node_left + node_w - infoBox_w;
				margin_left = (infoBox_w - 20) + 'px';
			}

			var arrowTop = false;
			if (node_top + node_h + infoBox_h > parseInt($(window).height() + $(window).scrollTop())) {
				var new_top = node_top - infoBox_h;
				if (new_top > 0) {
					infoBox_top = new_top;
					arrowTop = true;
				}
			}

			if (!arrowTop) {
				$(infoBoxArrowTop).css({
					'border-bottom-color' : 'rgb(25,25,25)',
					'border-bottom-color' : 'rgba(25,25,25,0.92)',
					'margin-left' : margin_left,
					'margin-right' : '4px'
				});
			} else {
				$(infoBoxArrowBottom).css({
					'border-top-color' : 'rgb(25,25,25)',
					'border-top-color' : 'rgba(25,25,25,0.92)',
					'margin-left' : margin_left,
					'margin-right' : '4px'
				});
			}

			tinymce.DOM.setStyles(infoBox, {
				'top' : infoBox_top,
				'left' : infoBox_left
			});
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

				if (ed.isInfoBoxDisplay && ed.infoBoxTargetNode === sele_node)
					return;

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
						case 'num':
							info_text = 'Numeral';
							break;
						case 'other':
							info_text = ar['abbr_type_other'];
							break;
						}
						break;
					case 'part': // part_abbr
						info_text = '<div>' + 'Editorial expansion' + '<div>';
						break;
					case 'brea':
						switch (ar['break_type']) {
						case 'lb':
							info_text = '<div>Number: ' + ar['number'] + '</div>';
							if (ar['lb_alignment']) {
								info_text += '<div>Alignment: ' + ar['lb_alignment'];
							}
							break;
						case 'pb':
							info_text = '<div>' + 'Page number (in sequence): ' + ar['number'];
							if (ar['pb_type'])
								info_text += ar['pb_type'];
							if (ar['fibre_type'])
								info_text += ar['fibre_type'];
							info_text += '</div>';
							if (ar['page_number']) {
								info_text += '<div>' + 'Page number (as written): ' + ar['page_number'] + '</div>';
							}
							if (ar['running_title']) {
								info_text += '<div>' + 'Running title: ' + ar['running_title'] + ' (';
								if (ar['paratext_position'] == 'other')
									info_text += ar['paratext_position_other'] + ')' + '</div>';
								else
									info_text += ar['paratext_position'] + ')' + '</div>';
							}
							if (ar['facs']) {
								info_text += '<div>' + 'URL to digital image: ' + ar['facs'] + '</div>';
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
						var nodeText = ar['note_text'];
						if (nodeText) {
							info_text += '<div style="margin-top:10px">' + nodeText + '</div>';
						}
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
						if (ar['blank_correction'] == 'on')
							corr_str += 'deleted' + '</div>';
						else
							corr_str += ar['corrector_text'] + '</div>';

						var deletionText = ar['deletion'].replace(/\,/g, ', ');
						if (deletionText && deletionText != 'null') {
							// information on deletion
							corr_str += '<div style="margin-top:5px">' + 'Method(s) of deletion: ' + deletionText + '</div>';
						}
						if (ar['editorial_note']) {
							corr_str += '<div style="margin-top:5px">Note: ' + ar['editorial_note'] + '</div>';
						}
						break;
					case 'paratext':
						info_text = '<div>' + 'Paratext type: ';
						switch (ar['fw_type']) {
						case 'commentary':
							info_text = '<div>' + 'This is untranscribed commentary text' + '</div>';
							if (ar['covered'])
								info_text += '<div style="margin-top:5px">' + ar['covered'] + ' line(s) covered.';
							break;
						case 'chapNum':
							info_text += 'Chapter number';
							break;
						case 'chapTitle':
							info_text += 'Chapter title';
							break;
						case 'colophon':
							info_text += 'Colophon';
							break;
						case 'quireSig':
							info_text += 'Quire signature';
							break;
						case 'AmmSec':
							info_text += 'Ammonian section';
							break;
						case 'EusCan':
							info_text += 'Eusebian canon';
							break;
						case 'euthaliana':
							info_text += 'Euthaliana';
							break;
						case 'gloss':
							info_text += 'Gloss';
							break;
						case 'lectTitle':
							info_text += 'Lectionary title';
							break;
						case 'stichoi':
							info_text += 'Stichoi';
							break;
						}
						info_text += '</div>';
						if (ar['fw_type'] != 'commentary') {
							info_text += '<div style="margin-top:10px">Value: ' + ar['text'] + '</div>';
							if (ar['paratext_position'] == 'other') {
								info_text += '<div style="margin-top:10px">Position: ' + ar['paratext_position_other'] + '</div>';
							} else {
								info_text += '<div style="margin-top:10px">Position: ' + ar['paratext_position'] + '</div>';
							}
							info_text += '<div style="margin-top:10px">Alignment: ' + ar['paratext_alignment'] + '</div>';
						}
						break;
					case 'gap':
						if (ar['unit'] == '' && ar['gap_reason'] == '') {
							info_text = 'No information about the reason and extension of the gap available';
							break;
						}
						info_text = '<div>' + 'Gap' + '</div><div style="margin-top:10px"> Reason: ';
						if (ar['gap_reason'] == 'lacuna') {
							info_text += 'Lacuna' + '</div>';
						} else if (ar['gap_reason'] == 'illegible') {
							info_text += 'Illegible text' + '</div>';
						} else {
							info_text += 'Absent text' + '</div>';
						}
						if (ar['extent'] && ar['extent'] != null) {
							info_text += '<div style="margin-top:10px">' + 'Extent: ' + ar['extent'] + ' ';
							if (ar['unit'] == 'other') {
								info_text += ar['unit_other'] + '</div>';
							} else {
								info_text += ar['unit'] + '(s)</div>';
							}
						}
						if (ar['mark_as_supplied'] == 'supplied') {
							info_text += '<div style="margin-top:10px">' + 'Supplied source: ';
							if (ar['supplied_source'] == 'other') {
								info_text += ar['supplied_source_other'] + '</div>';
							} else {
								info_text += ar['supplied_source'] + '</div>';
							}
						}
						break;
					case 'unclear':
						info_text = '<div>' + 'Uncertain letters' + '</div>';
						if (ar['unclear_text_reason'] != null) {
							info_text += '<div>' + 'Reason: ';
							if (ar['unclear_text_reason'] == 'other') {
								info_text += ar['unclear_text_reason_other'];
							} else {
								info_text += ar['unclear_text_reason'];
							}
							info_text += '</div>';
						}
						break;
					case 'spaces':
						info_text = '<div>' + 'Spaces</div><div style="margin-top:10px">Extent: ' + ar['sp_extent'] + ' ';
						if (ar['sp_unit'] == 'other') {
							info_text += ar['sp_unit_other'] + '(s)' + '</div>';
						} else {
							info_text += ar['sp_unit'] + '(s)</div>';
						}
						break;
					case 'formatting':
						if (ar['capitals_height'] != null) { // output only if capitals
							info_text = '<div>' + 'Capitals' + '</div><div style="margin-top:10px">' + 'Height: ' + ar['capitals_height'] + '</div>';
						} else { // all other formatting
							if (ar['__t'] === 'formatting_displaced-above')
								info_text = '<div>' + 'Displaced above' + '</div>';
							else if (ar['__t'] === 'formatting_displaced-below')
								info_text = '<div>' + 'Displaced below' + '</div>';
							else if (ar['__t'] === 'formatting_displaced-other')
								info_text = '<div>' + 'Displaced' + '</div>';
							else
								info_text = '<div>' + 'Highlighted text' + '</div>';
						}
						break;
					case 'pc':
						info_text = '<div>' + 'Punctuation mark' + '</div>';
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
				}

				if (type_name == 'corr') {
					info_text = corr_str;
				}

				// information display
				if (info_text != '') {
					// var new_top = e.clientY;
					// var new_left = e.clientX;
					// if (ed.getParam('fullscreen_is_enabled')) {
					// new_top = new_top + 30;
					// new_left = new_left + 30;
					// } else {
					// new_top = new_top + 80;
					// new_left = new_left + 80;
					// }

					WCEObj._setInfoBoxOffset(ed, sele_node);
					// info_box.innerHTML = '<div style="background-color: #eee; white-space:normal; padding:10px;border: 1px solid #ff0000">' + info_text + '</div>';
					ed.wceInfoBoxContent.html(info_text);
					$(info_box).show();
					ed.isInfoBoxDisplay = true;
					ed.infoBoxTargetNode = sele_node;
				}
			} else {
				$(info_box).hide();
				ed.isInfoBoxDisplay = false;
				ed.infoBoxTargetNode = null;
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
					title : 'Breaks (Ctrl+Alt+B)',
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
					title : 'Corrections (Ctrl+Alt+C)',
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
						title : 'Uncertain Letters (Ctrl+Alt+U)',
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
						title : 'Gap (Ctrl+Alt+G)',
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
						title : 'Highlight text',
						id : 'menu-decoration-highlight'
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
						title : 'Displaced text',
						id : 'menu-decoration-displaced'
					});
					
					sub.add({
						title : 'Above',
						onclick : function() {
							ed.execCommand('mceAdd_formatting', 'displaced-above');
						}
					});

					sub.add({
						title : 'Below',
						onclick : function() {
							ed.execCommand('mceAdd_formatting', 'displaced-below');
						}
					});

					sub.add({
						title : 'Other',
						onclick : function() {
							ed.execCommand('mceAdd_formatting', 'displaced-other');
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
						title : '\u003E (diple)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u003E');
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
				});

				// Return the new menu button instance
				return c;

			case 'abbreviation':
				var c = cm.createMenuButton('menu-abbreviation', {
					title : 'Abbreviated text (Ctrl+Alt+A)',
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
					title : 'Marginalia (Ctrl+Alt+M)',
					image : tinyMCE.baseURL + '/plugins/wce/img/button_M-new.png',
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
					title : 'Note (Ctrl+Alt+N)',
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

			case 'punctuation':
				var c = cm.createMenuButton('menu-punctuation', {
					title : 'Punctuation',
					image : tinyMCE.baseURL + '/plugins/wce/img/button_P-new.png',
					icons : false
				});

				c.onRenderMenu.add(function(c, m) {
					var sub;
					var w = ed.WCE_VAR;
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
						title : '\u02BC (modifier letter apostrophe)',
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
						id : 'menu-punctuation-blankspaces'
					});

					sub.add({
						title : 'add',
						id : 'menu-punctuation-blankspaces-add',
						icons : false,
						onclick : function() {
							ed.execCommand('mceAddSpaces');
						}
					});

					sub.add({
						title : 'edit',
						id : 'menu-punctuation-blankspaces-edit',
						onclick : function() {
							ed.execCommand('mceEditSpaces');
						}
					});

					sub.add({
						title : 'delete',
						id : 'menu-punctuation-blankspaces-delete',
						onclick : function() {
							ed.execCommand('wceDelNode');
						}
					});

					sub.onShowMenu.add(function(m) {
						var items = m.items;
						if (w.type == 'spaces') {
							items['menu-punctuation-blankspaces-add'].setDisabled(true);
							items['menu-punctuation-blankspaces-edit'].setDisabled(false);
							items['menu-punctuation-blankspaces-delete'].setDisabled(false);
						} else {
							items['menu-punctuation-blankspaces-add'].setDisabled(false);
							items['menu-punctuation-blankspaces-edit'].setDisabled(true);
							items['menu-punctuation-blankspaces-delete'].setDisabled(true);
						}
					});
				});

				return c;
			}
			
			return null;
		},

		_wceAdd : function(ed, url, htm, w, h, inline, add_new_wce_node) {
			var winH = $(window).height() - 100;
			var winW = $(window).width() - 60;
			w = winW > w ? w : winW;
			h = winH > h ? h : winH;

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
		_getTextLeftPosition : function(text, idx) {
			if (!text) {
				return idx;
			}

			var len = text.length;
			if (len <= 0) {
				return 0;
			}

			var c;
			for ( var i = idx; i > -1 && i < len; i--) {
				c = text.charAt(i);
				if (c == ' ' || c == '\xa0') {
					return i + 1;
				}
				idx--;
			}
			if (idx < 0) {
				idx = 0;
			}
			return idx;

		},

		// bei adaptive Selection
		_getTextRightPosition : function(text, idx) {
			if (!text) {
				return st;
			}

			var len = text.length;
			var c, pre_c;
			var nbsp = '\xa0';
			for ( var i = idx; i > -1; i--) {
				ch = text.charAt(i);

				// ende des Textes
				if (i == len && i > 0) {
					// 如果前一个不是空格
					pre_c = ch = text.charAt(i - 1);
					if (pre_c != ' ' && pre_c != nbsp)
						break;
				}

				ch = text.charAt(i);
				if (ch == ' ' || ch == nbsp) {
					pre_c = ch = text.charAt(i - 1);
					if (i > 0 && (pre_c != ' ' && pre_c != nbsp)) {
						break;
					}
				}
				idx--;
			}
			if (idx < 0) {
				idx = 0;
			}
			return idx;

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
				if (character == 'lb1' || character == 'lb2') {
					// line break at the end of a word
					if (number === 0) {
						// for a line break without an explicit number
						number = ++lcnt;
					}

					wceAttr = 'wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=' + number 
						+ '&amp;pb_type=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=&amp;insert=Insert&amp;cancel=Cancel" ';
					
					if (character == 'lb1') // add an extra space at the beginning
						ed.selection.setContent(' <span ' + wceAttr + wceClass + '>' + '<br/>&crarr;' + '</span>');
					else //lb2
						ed.selection.setContent('<span ' + wceAttr + wceClass + '>' + '<br/>&crarr;' + '</span> ');
					lcnt = number;

					// ed.selection.select(ed.getBody(), true); // select complete text
					//return;

					// ed.execCommand('printData');
				} else if (character == 'lb') {
					// page, quire or column break in the middle of a word; hyphen is already set
					if (number === 0) {
						// for a line break without an explicit number
						number = ++lcnt;
					}

					// set new wceAttr with hasBreak=yes
					wceAttr = 'wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=' + number +
						'&amp;pb_type=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=&amp;insert=Insert&amp;cancel=Cancel"';
					ed.selection.setContent('<span ' + wceAttr + wceClass + '>' + '<br/>&crarr;' + '</span>'); //&#8208; instead of &hyphen; because of IE9
					lcnt = number;
				} else if (character == 'lbm') {
					// line break in the middle of a word
					if (number === 0) {
						// for a line break without an explicit number
						number = ++lcnt;
					}

					// set new wceAttr with hasBreak=yes
					wceAttr = 'wce="__t=brea&amp;__n=&amp;hasBreak=yes&amp;break_type=lb&amp;number=' + number +
						'&amp;pb_type=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=&amp;insert=Insert&amp;cancel=Cancel"';
					ed.selection.setContent('<span ' + wceAttr + wceClass + '>' + '&#8208;<br/>&crarr;' + '</span>'); //&#8208; instead of &hyphen; because of IE9
					lcnt = number;
				} else if (character == 'cb') {
					// column break
					if (number === 0) {
						// for a line break without an explicit number
						number = ++ccnt;
					}

					wceAttr = 'wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=' + number 
						+ '&amp;pb_type=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=&amp;insert=Insert&amp;cancel=Cancel"';
					ed.selection.setContent('<br/><span ' + wceAttr + wceClass + '>' + 'CB' + '</span>');
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
					wceAttr = 'wce="__t=brea&amp;__n=&amp;break_type=pb&amp;number=' + new_number + '&amp;pb_type=' + new_pb_type 
						+ '&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=&amp;insert=Insert&amp;cancel=Cancel' + '"';
					ed.selection.setContent('<br/><span ' + wceAttr + wceClass + '>' + 'PB' + '</span>');

					// duplication cf. wce.js, line 215
					// ed.execCommand('mceAdd_brea', 'cb', '1');
					// ed.execCommand('mceAdd_brea', 'lb', '1');
				} else {
					// quire break
					if (number === 0) {
						// for a line break without an explicit number
						number = ++qcnt;
					}
					wceAttr = 'wce="__t=brea&amp;__n=&amp;break_type=gb&amp;number=' + number 
						+ '&amp;pb_type=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=&amp;insert=Insert&amp;cancel=Cancel' + '"';
					ed.selection.setContent('<br/><span ' + wceAttr + wceClass + '>' + 'QB' + '</span>');
					qcnt = number;
				}
				break;
			case 'part_abbr':
				// part-worded abbreviations
				var rng = WCEObj._getRNG(ed);
				wceClass = ' class="part_abbr"';
				var startContainer = rng.startContainer;

				if (startContainer.nodeType != 3)
					return;

				var startText = startContainer.nodeValue;
				var text = startText.substr(0, rng.startOffset);
				var li = text.lastIndexOf('(');
				if (li > -1) {
					var part_abbr = text.substr(li) + ')';
					rng.setStart(startContainer, li);
					WCEObj._setRNG(ed, rng);
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
			var _setWCEVariable = WCEObj._setWCEVariable;
			var _redrawContols = WCEObj._redrawContols;

			if (wcevar.inputDisable && !e.ctrlKey) {
				return _stopEvent(ed, e);
			}

			// press and hold to delete char prohibited
			if (!tinymce.isOpera && (ek == 46 || ek == 8)) {
				ed.keyDownDelCount++;
				if (ed.keyDownDelCount > 1) {
					_setWCEVariable(ed);
					_redrawContols(ed);
					wcevar.isRedrawn = true;
					return _stopEvent(ed, e);
				}
			}

			// TODO: if no short_cut B, C ,Z ,Y .....
			if (wcevar.isInBE && !e.ctrlKey) {
				// keydown for insert letter
				if (wcevar.isCollapsedAtNodeEnd && ek != 8 && ek != 46) {
					var isSpaceKey = WCEObj._insertSpace(ed, ek);
					_setWCEVariable(ed);
					_redrawContols(ed);
					ed.WCE_VAR.isRedrawn = true;
					if (isSpaceKey) {
						return _stopEvent(ed, e);
					}
				} else if (ek == 46 && wcevar.isCollapsedAtNodeEnd && !wcevar.isNextElemBE) {
				
				} else {
					return _stopEvent(ed, e);
				}
			}

			// key "entf"
			if (ek == 46 && wcevar.isNextElemBE && wcevar.isCollapsedAtNodeEnd) {
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
					var sel = WCEObj._getSEL(ed);
					// sel.modify("extend", "forward", "character");
					var rng = sel.getRangeAt(0);
					var startText = rng.startContainer.nodeValue;
					if (startText) {
						var startOffset = rng.startOffset;
						var indexOfEnd = WCEObj._getNextEnd(startText, startOffset);
						// at the end of a word
						if (indexOfEnd && indexOfEnd == startOffset) {
							//add an additional space
							_wceAddNoDialog(ed, 'brea', 'lb1', ++lcnt);
						} else if (startText.substr(startOffset - 1, 1) == " ") { //return after space
							_wceAddNoDialog(ed, 'brea', 'lb2', ++lcnt);
						} else { // return in the middle of a word
							_wceAddNoDialog(ed, 'brea', 'lbm', ++lcnt);
						}
					}
				}
				return _stopEvent(ed, e);
			}
			
			// Add <pc> for some special characters
			// We need a lot of cases, because of different kyeboard layouts, different browsers and different platforms
			if (ek == 59 && !e.shiftKey && !tinymce.isWebKit) { // ; en
				tinyMCE.activeEditor.execCommand('mceAdd_pc', ';');
				_stopEvent(ed, e);
			} else if (ek == 188 && e.shiftKey) {
				// ; dt < en
				tinyMCE.activeEditor.execCommand('mceAdd_pc', ';');
				_stopEvent(ed, e);
			} else if (ek == 188 && !e.shiftKey) {
				// ,
				tinyMCE.activeEditor.execCommand('mceAdd_pc', ',');
				_stopEvent(ed, e);
			} else if (ek == 190 && e.shiftKey) {
				// :
				tinyMCE.activeEditor.execCommand('mceAdd_pc', ':');
				_stopEvent(ed, e);
			} else if (ek == 190 && !e.shiftKey) {
				// .
				tinyMCE.activeEditor.execCommand('mceAdd_pc', '.');
				_stopEvent(ed, e);
			} else if (ek == 63 && e.shiftKey) { // for FF
				tinyMCE.activeEditor.execCommand('mceAdd_pc', '?');
				_stopEvent(ed, e);
			} else if (ek == 191 && e.shiftKey) {
				// ? en
				tinyMCE.activeEditor.execCommand('mceAdd_pc', '?');
				_stopEvent(ed, e);
			} else if (ek == 219 && e.shiftKey) {
				// ? dt
				tinyMCE.activeEditor.execCommand('mceAdd_pc', '?');
				_stopEvent(ed, e);
			} else if (ek == 56 && e.shiftKey) {
				// ( TODO?
			} else if (ek == 57 && e.shiftKey && e.altKey) { // For Mac OS X, Middledot
				tinyMCE.activeEditor.execCommand('mceAdd_pc', '\u0387');
				_stopEvent(ed, e);
			} else if (ek == 57 && e.shiftKey) {
				// Find corresponding ( and create substring
				_stopEvent(ed, e);
				// e.stopImmediatePropagation();
				_wceAddNoDialog(ed, 'part_abbr', '');
			}
		},
		
		_setKeyPressEvent : function(ed, e) {
			if (!e) {
				var e = window.event;
			}

			var ek = e.keyCode || e.charCode || 0;
			var _stopEvent = WCEObj._stopEvent;
			
			if (tinymce.isWebKit) { // for Chrome (on Linux and Mac) and Safari: ":" and ";" both give the same keydown code 186 (???). So we use keypress for them
				if (ek == 58) { // :
					tinyMCE.activeEditor.execCommand('mceAdd_pc', ':');
					_stopEvent(ed, e);
				} else if (ek == 59) { // ;
					tinyMCE.activeEditor.execCommand('mceAdd_pc', ';');
					_stopEvent(ed, e);
				}
			}
			
			if (ek == 123) {
				if (!ed.WCE_VAR.not_N)
					tinyMCE.activeEditor.execCommand('mceAddNote');
				_stopEvent(ed, e);
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

			ed.onKeyUp.addToTop(function(ed, e) {
				ed.keyDownDelCount = 0;

				// wenn redraw bei keyDown nicht gemacht
				if (!ed.WCE_VAR.isRedrawn) {
					WCEObj._setWCEVariable(ed);
					WCEObj._redrawContols(ed);
					ed.WCE_VAR.isRedrawn = true;
					return;
				}

				ed.WCE_VAR.isRedrawn = false;
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
							ed.WCE_VAR.isRedrawn = true;
							return WCEObj._stopEvent(ed, e);
						}
					}
				});
			}

			ed.onKeyDown.addToTop(WCEObj._setKeyDownEvent);
			ed.onKeyPress.addToTop(WCEObj._setKeyPressEvent); //needed for Chrome (Linux) :-(
			
			// class="__t=wce_type&__n=wce_name...."
			ed.wceTypeParamInClass = '__t';
			ed.wceNameParamInClass = '__n';

			// Information-box
			var infoBox = $('<div></div>');
			var infoBox_content = $('<div></div>');
			var infoBox_arrowTop = $('<div style="border: 6px solid #fff"><div></div></div>');
			var infoBox_arrowBottom = $('<div style="border: 6px solid #fff"><div></div></div>');

			$(infoBox).html(infoBox_arrowBottom);
			$(infoBox).prepend(infoBox_content);
			$(infoBox).prepend(infoBox_arrowTop);

			ed.wceInfoBox = infoBox;
			ed.wceInfoBoxContent = infoBox_content;
			ed.wceInfoBoxArrowTop = infoBox_arrowTop;
			ed.wceInfoBoxArrowBottom = infoBox_arrowBottom;

			tinymce.DOM.setStyles(infoBox, {
				'height' : 'auto',
				'font-size' : '12px',
				'width' : 'auto',
				'position' : 'absolute',
				'z-index' : '300000',
				'overflow' : 'auto',
				'display' : 'none',
			});
			tinymce.DOM.setStyles(infoBox_content, {
				'color' : '#fff',
				'text-shadow' : '0 0 2px #000',
				'padding' : '4px 8px',
				'background-color' : 'rgb(25,25,25)',
				'background-color' : 'rgba(25,25,25,0.92)',
				'background-image' : '-webkit-gradient(linear, 0% 0%, 0% 100%, from(transparent), to(#000))',
				'border-radius' : '3px',
				'-webkit-border-radius' : '3px',
				'-moz-border-radius' : '3px',
				'box-shadow' : '0 0 3px #555',
				'-webkit-box-shadow' : '0 0 3px #555',
				'-moz-box-shadow' : '0 0 3px #555',
				'top' : 0,
				'left' : 0
			});
			$(document.body).append(infoBox);

			// add adaptive selection checkbox
			ed.onPostRender.add(function(ed, cm) {
				var id = ed.id + '_adaptive_selection';
				var row = tinymce.DOM.get(ed.id + '_path_row');
				if (row) {
					tinymce.DOM.add(row.parentNode, 'div', {
						'style' : ''
					}, '<input type="checkbox" id="' + id + '"> Adaptive selection</input>');
				}
			});

			// html to tei
			ed.addCommand('mceHtml2Tei', function() {
				_wceAdd(ed, url, '/html2tei.htm', 580, 420, 1, true);

			});
			
			
			// add verse modify button
			ed.addButton('versemodify', {
				title : 'Modify verses (Ctrl+Alt+V)',
				cmd : 'mceVerseModify',
				image : url + '/img/button_V-new.png'
			});
			
			
			// add showTeiByHtml button
			ed.addButton('showTeiByHtml', {
				title : 'For test: \n set booknumber=00\nget TEI output from HTML',
				cmd : 'mceHtml2Tei',
				image : url + '/img/xml.jpg'
			});

			// tei to html only for Test
			ed.addCommand('mceTei2Html', function() {
				_wceAdd(ed, url, '/tei2html.htm', 580, 420, 1, true);
			});

			// add showHtmlByTei button
			ed.addButton('showHtmlByTei', {
				title : 'For test: \n  get HTML output from TEI',
				cmd : 'mceTei2Html',
				image : url + '/img/xmlinput.jpg'
			});
			
			ed.addCommand('mceReload', function(lang) {
				// TODO: implementation
			});
			
			ed.addButton('english', {
				title : 'Switch to English language (not implemented yet)',
				cmd : 'mceReload("en")',
				image : url + '/img/gb.png'
			});
			
			ed.addButton('german', {
				title : 'Switch to German language (not implemented yet)',
				cmd : 'mceReload("de")',
				image : url + '/img/de.png'
			});
			
			ed.addButton('version', {
				title : "Information about the editor's version",
				cmd : 'mceVersion',
			});
			
			ed.addCommand('mceVersion', function() {
				var http=new XMLHttpRequest();
				http.open('HEAD','http://ntvmr.uni-muenster.de/community/modules/transedit/version.txt',false);
				http.send(null);
				if (http.status!=200) return undefined;
				var wort = http.getResponseHeader('Last-modified');
				if(wort.length == 19)
					datum = wort.substring(11,15) + "-" + wort.substring(7,10) + "-" + wort.substring(5,7) + " " + wort.substring(16);
				if (wort.length == 29) {
					if (wort.search("Jan") != -1)monat = "01"; if(wort.search("Feb") != -1)monat = "02";
					if (wort.search("Mar") != -1)monat = "03"; if(wort.search("Apr") != -1)monat = "04";
					if (wort.search("May") != -1)monat = "05"; if(wort.search("Jun") != -1)monat = "06";
					if (wort.search("Jul") != -1)monat = "07"; if(wort.search("Aug") != -1)monat = "08";
					if (wort.search("Sep") != -1)monat = "09"; if(wort.search("Oct") != -1)monat = "10";
					if (wort.search("Nov") != -1)monat = "11"; if(wort.search("Dec") != -1)monat = "12";
					datum = wort.substring(12,16) + "-" + monat + "-" + wort.substring(5,7) + " " + wort.substring(18);
				}
				alert('This version of the transcription editor was last modified on: ' + datum);
			});
			
			/*
			 * onInit
			 * 
			 */
			ed.onInit.add(function() {
				WCEObj._initWCEConstants(ed);
				WCEObj._initWCEVariable(ed);
				//
				ed.teiIndexData = {
					'bookNumber' : '00',
					'pageNumber' : 0,
					'chapterNumber' : 0,
					'verseNumber' : 0,
					'wordNumber' : 0,
					'columnNumber' : 0,
					'lineNumber' : 0,
					'quireNumber' : 0,
					'witValue' : '0'
				}
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
				ed.addShortcut('ctrl+alt+b', 'Add break', 'mceAddBreak_Shortcut');
				ed.addShortcut('ctrl+alt+c', 'Add correction', 'mceAddCorrection_Shortcut');
				ed.addShortcut('ctrl+alt+u', 'Add unclear text', 'mceAddUnclearText_Shortcut');
				ed.addShortcut('ctrl+alt+g', 'Add gap', 'mceAddGap_Shortcut');
				ed.addShortcut('ctrl+alt+a', 'Add abbreviation', 'mceAddAbbr_Shortcut');
				ed.addShortcut('ctrl+alt+m', 'Add marginalia', 'mceAddParatext_Shortcut');
				ed.addShortcut('ctrl+alt+n', 'Add note', 'mceAddNote_Shortcut');
				ed.addShortcut('ctrl+alt+v', 'Modify verses', 'mceVerseModify_Shortcut');
				// ed.addShortcut('ctrl+p', 'Add punctuation', 'mceAddNote_Shortcut');

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
					var originalText = decodeURIComponent(wceNode.getAttribute('wce_orig'));
					
					/*
					 * // if tag to remove var node_to_remove = [ 'paratext', 'note', 'gap', 'brea' ]; var to_remove = false; for ( var i = 0; i < node_to_remove.length; i++) { if (wceAttr.indexOf(ed.wceTypeParamInClass + '=' + node_to_remove[i]) > -1) { to_remove = true; break; } }
					 * 
					 * if (to_remove) { $(wceNode).remove(); } else if (typeof originalText != 'undefined') { ed.selection.setContent(originalText);alert(originalText); }
					 */
					 
					if (wceNode.getAttribute('class') === 'commentary') // cursor is inside [comm]
						wceNode.parentNode.parentNode.removeChild(wceNode.parentNode);
					else
						wceNode.parentNode.removeChild(wceNode);

					if ((originalText) && originalText != 'null') //TODO: I am not sure why we still need the string 'null' (but it works)
						ed.selection.setContent(originalText);
					
					ed.isNotDirty = 0;
				}
			});

			// Add breaks
			ed.addCommand('mceAddBreak', function() {
				_wceAdd(ed, url, '/break.htm?mode=new&quire=' + ++qcnt + '&page=' + ++pcnt + '&column=' + ++ccnt + '&line=' + ++lcnt + '&rectoverso=' + rectoverso, 520, 320, 1, true);
			});
			// Edit breaks
			ed.addCommand('mceEditBreak', function() {
				_wceAdd(ed, url, '/break.htm?mode=edit&quire=' + ++qcnt + '&page=' + ++pcnt + '&column=' + ++ccnt + '&line=' + ++lcnt + '&rectoverso=' + rectoverso, 520, 320, 1, false);
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
					//Test for possible insertion of "blank first hand" correction
					var sel = WCEObj._getSEL(ed);
					var rng = sel.getRangeAt(0);
					if (!WCEObj._canInsertCorrection(ed, rng)) {
					/*var sel = WCEObj._getSEL(ed);
					var startText = rng.startContainer.nodeValue;
					if (startText) {
						var startOffset = rng.startOffset;
						var indexOfEnd = WCEObj._getNextEnd(startText, startOffset);
					}
					if (rng.startOffset != indexOfEnd) {*/
					if (!wceNode) {
						return;
					}
					if (!wceAttr || !wceAttr.match(/corr/)) {
						return;
					}
					}
					//_add_new_wce_node = false;
					_add_new_wce_node = true;
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
				var w = ed.WCE_VAR;
				if (w.not_D) {
					return;
				}
				if (w.type == 'gap') {
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
				var w = ed.WCE_VAR;
				if (w.not_D) {
					return;
				}

				if (w.type == 'unclear') {
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
				var w = ed.WCE_VAR;
				if (w.not_N) {
					return;
				}
				if (w.type == 'note') {
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
				var w = ed.WCE_VAR;
				if (w.not_A) {
					return;
				}
				if (w.type == 'abbr') {
					ed.execCommand('mceEditAbbr');
				} else {
					ed.execCommand('mceAddAbbr');
				}
			});

			// Add Spaces/*********/
			ed.addCommand('mceAddSpaces', function() {
				_wceAdd(ed, url, '/spaces.htm', 480, 320, 1, true);
			});

			// Edit Spaces/*********/
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
				var w = ed.WCE_VAR;
				if (w.not_P) {
					return;
				}

				if (w.type == 'paratext') {
					ed.execCommand('mceEditParatext');
				} else {
					ed.execCommand('mceAddParatext');
				}
			});

			/*
			 * ed.addCommand('mceAddPunctuation_Shortcut', function() { if (wcevar.not_PC) { return; }
			 * 
			 * if (wcevar.type == 'punctuation') { ed.execCommand('mceEditPunctuation'); } else { ed.execCommand('mceAddPunctuation'); } });
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
			
			// verse modify
			ed.addCommand('mceVerseModify', function() {
				_wceAdd(ed, url, '/verse.htm', 360, 750, 1, true);

			});
			
			ed.addCommand('mceVerseModify_Shortcut', function() {
				ed.execCommand('mceVerseModify');
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

				var rng = WCEObj._getRNG(ed);
				var rng2 = rng.cloneRange();

				// set start of range to begin at the marker
				rng2.setStartAfter($(ed.getBody()).find('span.marker').get(0)); // start selection at marker
				rng2.setEndBefore($(ed.getBody()).find('span.marker').get(1)); // end selection at the end of the text, TODO: limit to region affected, i.e. till the next higher-level break
				WCEObj._setRNG(ed, rng2);

				oldcontent = ed.selection.getContent(); // get content to be modified

				$(ed.getBody()).find('span.marker').remove(); // delete marker

				WCEObj._setRNG(ed, rng);

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