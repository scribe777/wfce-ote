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

(function() {
	var wfce_editor = "2.0.1beta (2016-10-25)";

	// Load plugin specific language pack
	tinymce.PluginManager.requireLangPack('wce');

	/*
	 * WCEUtils provide additional functions for Editor/WCEPlugin
	 */
	var WCEUtils = {
		/*
		 * init constants of wce for editor: button name, element name ....
		 */
		initWCEConstants : function(ed) {
			var c = ed.WCE_CON;

			//extra elements for each wce Format.
			c.formatStart = 'format_start mceNonEditable';
			c.formatEnd = 'format_end mceNonEditable';
			c.startFormatHtml = '<span class="'+c.formatStart+'">' + '\u2039' + '</span>';
			//c.endFormatHtml = '<span class="format_end">&rsaquo;</span>';

			c.endFormatHtml = '<span class="'+c.formatEnd+'">' + '\u203a' + '</span>';
			//c.endFormatHtml = '<span class="format_end">&rsaquo;</span>';

			//blocked elements :If the Caret is inside, this will prohibit the key operation
			c.blockedElements = new Array('gap', 'corr', 'lection_number', 'book_number', 
				'chapter_number', 'verse_number', 'abbr', 'spaces', 'note', 'unclear', 'brea', 'paratext', 'pc');
 	 
			// not blocked elements
			// c.normalElemente = new Array('unclear');


/* TODO: these were not mapped by us


			ed.WCE_CON.control_CH = controls[ed_id + '_charmap'];
			// Remove Format
			ed.WCE_CON.control_RF = controls[ed_id + '_removeformat'];
			// Paste
			ed.WCE_CON.control_PA = controls[ed_id + '_paste'];
*/
		},

		/*
		 *
		 */
		setBreakCounterByContent : function(ed, content) {
			var v = ed.WCE_VAR;
			if (!v)
				return false;

			//TODO:
			content = null;

			//each Editor hat its own variable
			if (!content) {
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
			} else {
				//analyse html content and set counter
				//TODO:
			}
			return true;
		},

		/**
		 * compare current value and n, use large number
		 */
		updateBreakCounter : function(ed, bt, n) {
			// First reset counters
			var c = ed.WCE_VAR;

			// set only the one correct counter
			switch (bt) {
				case 'gb':
					c.qcnt = n >= c.qcnt ? n : c.qcnt;
					break;
				case 'pb':
					c.pcnt = n >= c.pcnt ? n : c.pcnt;
					break;
				case 'cb':
					c.ccnt = n >= c.ccnt ? n : c.ccnt;
					break;
				case 'lb':
					c.lcnt = n >= c.lcnt ? n : c.lcnt;
					break;
			}
		},
		  

		/*
		 *
		 */
		addToCounter : function(ed, bt, n) {
			var c = ed.WCE_VAR;
			switch (bt) {
				case 'gb':
					c.qcnt = parseInt(c.qcnt) + parseInt(n);
					break;
				case 'pb':
					c.pcnt = parseInt(c.pcnt) + parseInt(n);
					break;
				case 'cb':
					c.ccnt = parseInt(c.ccnt) + parseInt(n);
					break;
				case 'lb':
					c.lcnt = parseInt(c.lcnt) + parseInt(n);
					break;
			}
		},

		/*
		 * init wce variable
		 */
		initWCEVariable : function(ed) {
			ed.WCE_VAR = {};
			WCEUtils.resetWCEVariable(ed);
		},

		/*
		 * reset wce variable
		 */
		resetWCEVariable : function(ed) {
			// for error in firefox
			if (!ed.WCE_VAR) {
				WCEUtils.initWCEConstants(ed);
				WCEUtils.initWCEVariable(ed);
			}

			var v = ed.WCE_VAR;

			// ist selection collapsed?
			v.isc = true;

			// is Caret at end of node?
			v.isCaretAtNodeEnd = false;

			// Caret in which wce type
			v.type = null;

			//Caret in which wce node
			v.selectedNode = null;

			v.isSelWholeNode = false;

			// is Caret in blocked Element?
			v.isInBE = false;

			// nextSibling
			v.nextElem = null;

			// is nextSibling blocked Element?
			v.isNextElemBE = false;

			v.isRedrawn = false;

			// adaptive selections
			v.doAdaptivSel = false;

			//all input disable
			v.inputDisable = false;

			//set all controls active?
			WCEUtils.disableAllControls(ed, false);

			//Cursor at begin of formatStart i.e. range startOffset==0
			v.isCaretAtFormatStart = false;
			v.isCaretAtFormatEnd = false;
			v.selectedStartNode = null;
			v.selectedEndNode = null;
			v.rng = null;
		},

		/*
		 * is a node wcenode?
		 */
		isNodeTypeOf : function(node, typeName) {
			var nodeName = node.nodeName;
			if (nodeName && nodeName.toLowerCase() == 'span') {
				// TODO
				if (typeName == 'verse_number' || typeName == 'chapter_number' || typeName == 'book_number' || typeName == 'lection_number') {
					return $(node).hasClass(typeName);
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
		isWceBE : function(ed, node) {
			if (!node || node.nodeType == 3 || !ed) {
				return false;
			}
			if (node.nodeName.toLowerCase() == 'span') {
				if (!ed.selection.isCollapsed() && node.getAttribute("class") && 
					(node.getAttribute("class").indexOf("format_") == 0 || node.getAttribute("class").indexOf("abbr") == 0))
					return false;
				return true;
			}
			return false;

			//TODO: At the moment all <span> elements are "blocked elements". The array ed.WCE_CON.blockedElements is not used. This has to be discussed.
			/*
			 var arr = ed.WCE_CON.blockedElements;
			 for (var i = 0, len = arr.length; i < len; i++) {
			 if (WCEUtils.isNodeTypeOf(node, arr[i]))
			 return true;
			 }
			 return false;*/
		},

		/*
		 * is a Ancestor of the node a blocked element?
		 */
		isInWceBE : function(ed, node) {
			var _isWceBE = WCEUtils.isWceBE;
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
		getNextSiblingOfAncestor : function(ed, node) {
			var curr = WCEUtils.getAncestorIfLastChild(ed, node);
			if (curr && curr.nodeName.toLowerCase() == "body") {
				return null;
			}

			var next = curr.nextSibling;
			while (next && tinyMCE.isGecko && ed.selection.isCollapsed() && next.nodeType == 3 && next.nodeValue == "") {
				var _next = next;
				next = WCEUtils.getNextSiblingOfAncestor(ed, next);
				_next.parentNode.removeChild(_next);
			}
			return next;
		},

		/*
		 * get real startContainer when startContainer.nodeType==1
		 */

		getRealContainer : function(container, offset) {
			var childNodes = container.childNodes;
			var node;
			if (offset && childNodes) {
				node = childNodes[offset];
			}
			return node;
		},

		getRandomID : function(ed, c) {
			while (true) {
				var id = c + new Date().getTime() + '' + Math.round(Math.random() * 1000);
				if (!ed.dom.get(id)) {
					return id;
				}
				/*
				 if (!$(ed.getBody()).find('span[gid="+' + id + '"]').get(0)) {
				 return id;
				 }*/
			}
		},
		/*
		 * As long as node is firstChild, find outmost Ancestor. Reverse of _getFirstTextNodeOfNode()
		 */
		getAncestorIfFirstChild : function(ed, node) {
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

		isCaretAtBeginOfEditor : function(ed) {
			var rng = WCEUtils.getRNG(ed);
			if (rng.startOffset != 0) {
				return null;
			}
			var startContainer = rng.startContainer;
			var ancestor = WCEUtils.getAncestorIfFirstChild(ed, startContainer);
			var editorBody = ed.getBody();

			if (editorBody === ancestor) {
				return editorBody.firstChild;
			}
			if (ed.getBody().firstChild === ancestor) {
				return ancestor;
			}
			return null;
		},

		/*
		 * return lastchild and is #text of a node. Reverse of _getAncestorIfFirstChild()
		 */
		getFirstTextNodeOfNode : function(ed, n) {
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
				return WCEUtils.getFirstTextNodeOfNode(ed, firstChild);
			}
		},

		/*
		 *
		 */
		moveCaretToEndOfPreviousSibling : function(ed, rng, node) {
			var ancestor = WCEUtils.getAncestorIfFirstChild(ed, node);
			if (ancestor) {
				var pre = ancestor.previousSibling;
				if (pre) {
					var preTextNode = WCEUtils.getLastTextNodeOfNode(ed, pre);
					if (preTextNode) {
						var preTextNodeValue = preTextNode.nodeValue;
						var preTextNodeLength = preTextNodeValue.length;

						if (preTextNodeLength < 0) {
							preTextNodeLength = 0;
						}
						rng.setEnd(preTextNode, preTextNodeLength);
						WCEUtils.setRNG(ed, rng);

						if (ed.WCE_VAR.doAdaptivSel) {
							return WCEUtils.adaptiveSelection(ed, rng);
						}
					}
				}
			}

			return rng;
		},

		/*
		 *
		 */
		moveCaretToStartOfNextSibling : function(ed, rng, node) {
			var ancestor = WCEUtils.getAncestorIfLastChild(ed, node);
			if (ancestor) {
				var next = ancestor.nextSibling;
				if (next) {
					var nextTextNode = WCEUtils.getFirstTextNodeOfNode(ed, next);
					if (nextTextNode) {
						rng.setStart(nextTextNode, 0);
						WCEUtils.setRNG(ed, rng);
						if (ed.WCE_VAR.doAdaptivSel) {
							return WCEUtils.adaptiveSelection(ed, rng);
						}
					}
				}
			}

			return rng;
		},

		/*
		 * so lang as node is lastChild, find outmost Ancestor. Reverse of _getLastTextNodeOfNode()
		 */
		getAncestorIfLastChild : function(ed, node) {
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
		 * when caret after a space, move it to front of the space
		 */
		modifyBreakPosition : function(ed) {
			//TODO: muss noch getestet werden, da zwei textnode hintereinander stehen k?nnen
			var rng = WCEUtils.getRNG(ed);
			var startNode = rng.startContainer;
			if (startNode.nodeType != 3) {
				return;
			}

			var startText = startNode.nodeValue;
			if (!startText) {
				return;
			}

			var startOffset = rng.startOffset;
			var preNode = startNode.previousSibling;
			var preNodeText;

			var newStartText = startText;
			var newStartOffset = startOffset;
			var newStartNode = startNode;

			var c0, c1;

			var testPreChar, textNextChar;
			if (startOffset == 0) {
				/***
				 *** in the middle of a word
				 ***/
				//is preNode textNode and Endletter a space?
				if (preNode && preNode.nodeType == 3) {
					preText = preNode.nodeValue;
					c0 = preText.charAt(preText.length);
					if (c0 != ' ' && c0 != '\xa0') {
						testPreChar = true;
					}
				}

				c1 = startText.charAt(0);
				if (c1 != ' ' && c1 != '\xa0') {
					textNextChar = true;
				}
				if (testPreChar && textNextChar) {
					return 'lbm';
				}

			} else if (startOffset == startText.length) {

			} else {
				c0 = startText.charAt(startOffset - 1);
				c1 = startText.charAt(startOffset);
				if (c0 != ' ' && c0 != '\xa0' && c1 != ' ' && c1 != '\xa0' && c0 != '\u21B5') { // added last condition for #1616
					return 'lbm';
				}
			}

			/***
			 *** at beginn or end of a word
			 ***/
			//caret go to last no-space-letter
			var c;
			for (var i = startOffset; i > 0; i--) {
				c = newStartText.charAt(i - 1);
				if (c != ' ' && c != '\xa0') {
					break;
				}
				newStartOffset = i - 1;
				if (newStartOffset == 0) {
					if (preNode && preNode.nodeType == 3) {
						preNodeText = preNode.nodeValue;
						if ($.trim(preNodeText) == '') {
							var _preNode = preNode.previousSibling;
							$(preNode).remove();
							preNode = _preNode;
						}
						if (!preNode || preNode.nodeType != 3) {
							break;
						}
						newStartOffset = preNodeText.length;
						i = newStartOffset;
						newStartNode = preNode;
						newStartText = preNodeText;
						preNode = preNode.previousSibling;

						continue;
					} else {
						break;
					}
				}
			}

			//remove spaces after newStartOffset and add a space
			var newStartText = newStartNode.nodeValue;
			var text1 = newStartText.substring(0, newStartOffset);
			text2 = newStartText.substring(newStartOffset);
			if (text2) {
				text2 = text2.replace(/^\s+/, '');
				newStartNode.nodeValue = text1 + ' ' + text2;
			} else {
				newStartNode.nodeValue = newStartText + ' ';
			}

			//if caret at end of word, test next text-node
			if (newStartNode.nodeValue.length == newStartOffset + 1) {
				var nextNode = newStartNode.nextSibling, nextNodeText;
				while (nextNode) {
					if (nextNode.nodeType == 3) {
						nextNodeText = nextNode.nodeValue;
						if ($.trim(nextNodeText) == '') {
							var _nextNode = nextNode.nextSibling;
							$(nextNode).remove();
							nextNode = _nextNode;
							continue;
						} else {
							nextNode.nodeValue = nextNodeText.replace(/\s+$/, '');
							break;
						}
					} else {
						break;
					}
				}
			}

			rng.setStart(newStartNode, newStartOffset);
			rng.setEnd(newStartNode, newStartOffset);
			WCEUtils.setRNG(ed, rng);
			return '';
		},

		/*
		 * couter calculate
		 */
		counterCalc : function(str, i) {
			var n = parseInt(str);
			return n + i;
		},

		/*
		 * get break format html content
		 * @attr : attribute from dialog-form of break.htm
		 * @_id: group id for beak
		 */
		getBreakHtml : function(ed, bType, lbpos, indention, attr, _id, getOnlyIndention) {
			var _this = WCEUtils.getBreakHtml;

			if (lbpos === undefined || lbpos === null)
				lbpos = WCEUtils.modifyBreakPosition(ed);
			//lbpos = lbpos ? lbpos : WCEUtils.modifyBreakPosition(ed);
			
			var wceClass = 'class="mceNonEditable brea"', wceAttr;

			//how many member does a group have
			var groupCount;
			var str = '';
			var v = ed.WCE_VAR;
			var out = '';
			var indention = (indention) ? indention : "";
			var num = '', pos;
			var newstring = '', rv = '';

			if (bType == 'lb') {
				if (lbpos === 'lbm') {
					// line break in the middle of a word
					//v.lcnt = WCEUtils.counterCalc(v.lcnt, 1);
					// set new wceAttr with hasBreak=yes
					wceAttr = attr ? attr : 'wce="__t=brea&amp;__n=&amp;hasBreak=yes&amp;break_type=lb&amp;number=' + '&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment="';
					if (attr) {
						pos = attr.indexOf("number=");
						newstring = attr.substring(pos+7);
						num = newstring.substring(0,newstring.indexOf("&"));
						str = '&#8208;<br />'+'&crarr;'+indention + " " + num;
					}
					else
						str = '&#8208;<br />'+'&crarr;'+indention;
				} else {
					// line break at the end of a word
					//v.lcnt = WCEUtils.counterCalc(v.lcnt, 1);
					wceAttr = attr ? attr : 'wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=' + '&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" ';
					if (attr) {
						pos = attr.indexOf("number=");
						newstring = attr.substring(pos+7);
						num = newstring.substring(0,newstring.indexOf("&"));
						str = '<br />'+'&crarr;'+indention + " " + num;
					}
					else 
						str = '<br />'+'&crarr;'+indention;
				}
				if (getOnlyIndention){
					return str;
				}
			} else if (bType == 'cb') {
				// column break
				groupCount = 2;
				v.ccnt = WCEUtils.counterCalc(v.ccnt, 1);
				v.lcnt = '';
				if (lbpos == 'lbm') {
					wceAttr = attr ? attr : 'wce="__t=brea&amp;__n=&amp;hasBreak=yes&amp;break_type=cb&amp;number=' + v.ccnt + '&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment="';
					if (attr) {
						pos = attr.indexOf("number=");
						newstring = attr.substring(pos+7);
						num = newstring.substring(0,newstring.indexOf("&"));
						str = '&#8208;<br />CB' + " " + num;
					}
					else 
						str = '&#8208;<br />CB' + " " + v.ccnt;
				} else {
					wceAttr = attr ? attr : 'wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=' + v.ccnt + '&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment="';
					if (attr) {
						pos = attr.indexOf("number=");
						newstring = attr.substring(pos+7);
						num = newstring.substring(0,newstring.indexOf("&"));
						str = '<br />CB' + " " + num;
					}
					else 
						str = '<br />CB' + " " + v.ccnt;
				}
			} else if (bType == 'pb') {
				// page break
				groupCount = 3;
				var new_number, number;
				var new_rv = "";
				v.pcnt = WCEUtils.counterCalc(v.pcnt, 1);
				v.ccnt = 0;
				v.lcnt = '';
				number = v.pcnt;
				new_number = number;
				if (v.rectoverso === 'true') {
					new_number = Math.ceil(number / 2);
					if (number % 2 == 0) {
						// verso page
						new_rv = "v";
					} else {
						// recto page
						new_rv = "r";
					}
				}
				if (lbpos == 'lbm') {
					wceAttr = attr ? attr : 'wce="__t=brea&amp;__n=&amp;hasBreak=yes&amp;break_type=pb&amp;number=' + new_number + '&amp;rv=' + new_rv + '&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=' + '"';
					if (attr) {
						pos = attr.indexOf("number=");
						newstring = attr.substring(pos+7);
						num = newstring.substring(0,newstring.indexOf("&"));
						pos = attr.indexOf("rv=");
						newstring = attr.substring(pos+3);
						rv = newstring.substring(0,newstring.indexOf("&"));
						pos = attr.indexOf("fibre_type=");
						newstring = attr.substring(pos+11);
						fibre = newstring.substring(0,newstring.indexOf("&"));
						str = '&#8208;<br />PB' + " " + num + "" + rv + "" + fibre;
					}
					else 
						str = '&#8208;<br />PB' + " " + new_number + "" + new_rv;
				} else {
					wceAttr = attr ? attr : 'wce="__t=brea&amp;__n=&amp;break_type=pb&amp;number=' + new_number + '&amp;rv=' + new_rv + '&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=' + '"';
					if (attr) {
						pos = attr.indexOf("number=");
						newstring = attr.substring(pos+7);
						num = newstring.substring(0,newstring.indexOf("&"));
						pos = attr.indexOf("rv=");
						newstring = attr.substring(pos+3);
						rv = newstring.substring(0,newstring.indexOf("&"));
						pos = attr.indexOf("fibre_type=");
						newstring = attr.substring(pos+11);
						fibre = newstring.substring(0,newstring.indexOf("&"));
						str = '<br />PB' + " " + num + "" + rv + "" + fibre;
					}
					else 
						str = '<br />PB' + " " + new_number + "" + new_rv;
				}
			} else {
				// quire break
				bType = 'qb';
				groupCount = 4;
				v.qcnt = WCEUtils.counterCalc(v.qcnt, 1);
				v.pcnt = 0;
				v.ccnt = 0;
				v.lcnt = '';
				if (lbpos == 'lbm') {
					wceAttr = attr ? attr : 'wce="__t=brea&amp;__n=&amp;hasBreak=yes&amp;break_type=gb&amp;number=' + v.qcnt + '&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=' + '"';
					str = '&#8208;<br />QB';
				} else {
					wceAttr = attr ? attr : 'wce="__t=brea&amp;__n=&amp;break_type=gb&amp;number=' + v.qcnt + '&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=' + '"';
					str = '<br />QB';
				}
			}

			//a group hat same baseID, but each element hat different id,
			//id= bType+baseID
			var wceID, baseID;
			if (bType == 'lb' && !_id) {
				wceID = '';
			} else {
				baseID = _id ? _id : WCEUtils.getRandomID(ed, '');
				if (groupCount && !_id) {
					baseID = '_' + groupCount + '_' + baseID;
				}
				wceID = 'id="' + bType + baseID + '"';
			}

			var out = '<span ' + wceAttr + wceClass + wceID + '>' + ed.WCE_CON.startFormatHtml + str + ed.WCE_CON.endFormatHtml + '</span>';

			if (bType == 'qb') {
				//cb,pb und lb unter qb sind eine Gruppe, die alle haben gleich Attribute von qb
				//also z.B. hier lb editieren wird popup von qb angezeigt
				out = out + _this(ed, 'pb', 'ignore', indention, null, baseID);
				v.pcnt = 1;
			} else if (bType == 'pb') {
				out = out + _this(ed, 'cb', 'ignore', indention, null, baseID);
				v.ccnt = 1;
			} else if (bType == 'cb') {
				out = out + _this(ed, 'lb', 'ignore', indention, null, baseID);
				v.lcnt = 1;
			} else if (bType == 'lb'&& lbpos != 'lbm') {
				out += '&nbsp;';	
			}
			return out;
		},

		/*
		 * return lastchild and is #text of a node. Reverse of _getAncestorIfLastChild()
		 */
		getLastTextNodeOfNode : function(ed, n) {
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
				return WCEUtils.getLastTextNodeOfNode(ed, lastChild);
			}

		},

		/*
		 * set wce controls is active or not
		 */
		disableAllControls : function(ed, b) {
			var w = ed.WCE_VAR;

			// control insert custom character
			w.not_CH = b;
			// control RemoveFormat setActive?
			w.not_RF = b;
			// control paste
			w.not_PA = b;
			// control B setActive?
			w.not_B = b;
			// control C setActive?
			w.not_C = b;
			// control D setActive?
			w.not_D = b;
			// control O setActive?
			w.not_O = b;
			// control A setActive?
			w.not_A = b;
			// control M setActive?
			w.not_P = b;
			// control N setActive?
			w.not_N = b;
			// control P setActive?
			w.not_PC = b;
		},

		/*
		 * set wce controls status
		 */
		redrawContols : function(ed) {
			var w = ed.WCE_CON;
			var v = ed.WCE_VAR;

			if (w.buttons['breaks']) {
				w.buttons['breaks'].disabled(v.not_B);
			}
			if (w.buttons['correction']) {
				w.buttons['correction'].disabled(v.not_C);
			}
			if (w.buttons['illegible']) {
				w.buttons['illegible'].disabled(v.not_D);
			}
			if (w.buttons['decoration']) {
				w.buttons['decoration'].disabled(v.not_O);
			}
			if (w.buttons['abbreviation']) {
				w.buttons['abbreviation'].disabled(v.not_A);
			}
			if (w.buttons['paratext']) {
				w.buttons['paratext'].disabled(v.not_P);
			}
			if (w.buttons['note']) {
				w.buttons['note'].disabled(v.not_N);
			}
			if (w.buttons['punctuation']) {
				w.buttons['punctuation'].disabled(v.not_PC);
			}

// TODO: What are these?
			if (w.control_CH) {
				w.control_CH.disabled(v.not_CH);
			}
			if (w.control_RF) {
				w.control_RF.disabled(v.not_RF);
			}
			if (w.control_PA) {
				w.control_PA.disabled(v.not_PA);
			}
		},

		/*
		 * getSelection special for IE
		 */
		getSEL : function(ed) {
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

		/*
		 * get range
		 */
		getRNG : function(ed) {
			if (!tinyMCE.isIE) {
				return (ed.selection) ? ed.selection.getRng(true) : null;
			}

			// IE
			var sel = WCEUtils.getSEL(ed);
			if (sel && sel.rangeCount > 0) {
				return sel.getRangeAt(0);
			}
			return null;
		},

		/*
		 * set range
		 */
		setRNG : function(ed, rng) {
			if (!tinyMCE.isIE && !tinyMCE.isGecko) {
				ed.selection.setRng(rng);
			} else {
				var sel = WCEUtils.getSEL(ed);
				if (sel.setSingleRange) {
					sel.setSingleRange(rng);
				} else {
					sel.removeAllRanges();
					sel.addRange(rng);
				}
			}
		},

		/*
		 * selected content has block element?
		 */
		selectionHasBlockElement : function(ed) {
			try {
				var elem = $('<div/>').html(ed.selection.getContent());
				var isWceBE = WCEUtils.isWceBE;
				var testNode = function(node) {
					if (isWceBE(ed, node)) {
						return true;
					}
					var list = node.childNodes;
					if (!list) {
						return false;
					}

					for (var i = 0, c, len = list.length; i < len; i++) {
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
		 * selected content has space?
		 */
		selectionHasSpace : function(ed) {
			var c = ed.WCE_CON;
			var fs=c.formatStart;
			var fe=c.formatEnd;
			try {
				var elem = $('<div/>').html(ed.selection.getContent()); 
				var testNode = function(node) {
					if (node.nodeType == 3){
						// TODO: this looks very suspicious.  nodeName will never be formatStart or formatEnd; those are classes not names
						var pName=node.parentNode.nodeName;
						if (pName == fs || pName== fe) {
							return false;
						}
						var nv=node.nodeValue;
						if (nv && nv.match(/\s/)) {
							return true;
						} else {
							return false;
						}
					}
					
					var list = node.childNodes;
					if (!list) {
						return false;
					}

					for (var i = 0, c, len = list.length; i < len; i++) {
						c = list[i]; 
						if(c && testNode(c)){ 
							return true;
						} 
					}
					return false;
				};
				return testNode(elem[0]);
			} catch (e) {
				return false;
			}
		},
		
		selectionContainsVerseNumber : function(ed) {
			try {
				var elem = $('<div/>').html(ed.selection.getContent());
				var testNode = function(node) {
					if (node.nodeType == 3){
						return $(node).hasClass('verse_number');
					}
					
					var list = node.childNodes;
					if (!list) {
						return false;
					}

					for (var i = 0, c, len = list.length; i < len; i++) {
						c = list[i]; 
						if (c && testNode(c)) { 
							return true;
						} 
					}
					return false;
				};
				return testNode(elem[0]);
			} catch (e) {
				//alert("PECJ");
				return false;
			}
		},
		
		//if start and end of selection both are wce node
		setContent : function (ed, new_content){
			var wcevar=ed.WCE_VAR;
			if(wcevar.isCaretAtFormatEnd && wcevar.isCaretAtFormatStart){
				var sNode=wcevar.selectedStartNode;
				var eNode=wcevar.selectedEndNode;
				if(sNode && eNode && sNode!=eNode){
					ed.insertContent("");
					sNode.parentNode.removeChild(sNode);
					eNode.parentNode.removeChild(eNode); 
				}
			};
			ed.insertContent(new_content);
		},

		/*
		 * update wce variable
		 */
		setWCEVariable : function(ed) {
			// reset WCE_VAR
			WCEUtils.resetWCEVariable(ed);

			// init
			var w = ed.WCE_VAR;
			var _isNodeTypeOf = WCEUtils.isNodeTypeOf;
			var _disableAllControls = WCEUtils.disableAllControls;
			var _getAncestorIfLastChild = WCEUtils.getAncestorIfLastChild;
			var _getAncestorIfFirstChild = WCEUtils.getAncestorIfFirstChild;
			var _moveCaretToEndOfPreviousSibling = WCEUtils.moveCaretToEndOfPreviousSibling;
			var _moveCaretToStartOfNextSibling = WCEUtils.moveCaretToStartOfNextSibling;
			var _adaptiveSelection = WCEUtils.adaptiveSelection;
			var _getRNG = WCEUtils.getRNG;
			// getRange
			var rng = WCEUtils.getRNG(ed);
			if (!rng) {
				return;
			}

			var _isWceBE = WCEUtils.isWceBE;
			var selectedNode;
			var startContainer = rng.startContainer;
			var endContainer;
			var selection=ed.selection;
			w.isc = selection.isCollapsed();

			// delete in firefox can create empty element and startOffset==0
			if (startContainer.nodeType == 1 && !tinyMCE.isIE && startContainer.childNodes.length == 0 && rng.startOffset == 0 && startContainer.nodeName.toLowerCase() != 'body' && startContainer.nodeName.toLowerCase() != 'html') {
				startContainer.parentNode.removeChild(startContainer);
				return WCEUtils.setWCEVariable(ed);
			}

			if (w.isc) {
				//Corrections should also be possible for single positions (blank first hand reading)
				if (WCEUtils.canInsertCorrection(ed, rng))
					w.not_C = false;
				else
					w.not_C = true;
				w.not_A = true;
				w.not_O = true;

				// move caret to EndOfPreviousSibling, mainly for IE:
				/* TODO: What the frick is this? puts us in the wrong span when we are at the start of a text node
				if (rng.startOffset == 0) {
					rng = _moveCaretToEndOfPreviousSibling(ed, rng, startContainer);
				}
				*/
				startContainer = rng.startContainer;

				if (startContainer.nodeType == 3) {
					selectedNode = startContainer.parentNode;
					var startText = startContainer.nodeValue;
					//wenn neuen Text in textNode hinzugefuegt, wird neue textNode erstellt.
					if (startText) {
						if ($(selectedNode).hasClass('format_end')) {
							w.isCaretAtNodeEnd = true;
							w.type = 'format_end';
						} else if ($(selectedNode).hasClass('format_start')) {
							selectedNode = selectedNode.parentNode;
							w.type = 'format_start';
						} else if (startText.length == rng.endOffset && (!startContainer.nextSibling || (startContainer.nextSibling && startContainer.nextSibling.nodeType != 3))) {
							//mehrere txtNode koenen hintereinander stehen
							//wenn startConatiner.nextSibling ein textNode ist ,dann ist nicht "at node Ende"
							w.isCaretAtNodeEnd = true;
						}
					}
				} else {
					selectedNode = startContainer;
					//normalweis ist das body

					//wenn ein Element das letztes Element von Body ist und cursor steht am body End, wird body als startContainer ausgewaehlt.
					//Von daher muss das Element gefunden werden
					if (!tinymce.isIE && startContainer === ed.getBody() && rng && rng.endOffset > 0) {
						startContainer = startContainer.childNodes[rng.endOffset - 1];
					}
				}

				w.nextElem = WCEUtils.getNextSiblingOfAncestor(ed, startContainer);
				w.isNextElemBE = _isWceBE(ed, w.nextElem);
			} else {
				// if text is selected
				w.not_B = true;
				w.not_N = true;
				w.not_C = true;
					
				var adaptiveCheckbox = tinymce.DOM.get(ed.id + '_adaptive_selection');
				if (adaptiveCheckbox && adaptiveCheckbox.checked) {
					w.doAdaptivSel = true;
					var tempRng = rng.cloneRange();
					rng = _adaptiveSelection(ed, rng);
					if (tempRng.startOffset == rng.startOffset && tempRng.endOffset == rng.endOffset) {
						// adaptiveCaret
						rng = WCEUtils.adaptiveCaret(ed, rng);
					}
				} else {
					// adaptiveCaret
					rng = WCEUtils.adaptiveCaret(ed, rng);
				}

				// w.inputDisable
				// find startNode,endNode
				var startNode, endNode, selectedNodeStart, selectedNodeEnd;
				endContainer = rng.endContainer;

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
							startNode = WCEUtils.getAncestorIfFirstChild(ed, startContainer);
							if (startNode && startNode.nodeName.toLowerCase()!='body')
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
							endNode = WCEUtils.getAncestorIfLastChild(ed, endContainer);
							if (endNode && endNode.nodeName.toLowerCase()!='body') {
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
					_disableAllControls(ed, true);
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

				if (WCEUtils.selectionHasBlockElement(ed)) {
					w.inputDisable = true;
				}
				
				/*if (WCEUtils.selectionContainsVerseNumber(ed)) {
					alert("TEST");	
					_disableAllControls(ed, true);
				}*/
				
				var selHasSpace=WCEUtils.selectionHasSpace(ed);
			}

			startContainer = rng.startContainer;
			if (startContainer && $(startContainer.parentNode).hasClass('format_start') && rng.startOffset == 0) {
				w.isCaretAtFormatStart = true;
				w.selectedStartNode = startContainer.parentNode.parentNode;
			}
			endContainer = rng.endContainer;
			if (endContainer && $(endContainer.parentNode).hasClass('format_end') && rng.endOffset == 1) {
				w.isCaretAtFormatEnd = true;
				w.selectedEndNode = endContainer.parentNode.parentNode;
			}

			//select whole format?
			var wholeSelect = w.isc ? false : WCEUtils.isSelectedWholeNode(rng);
			if (wholeSelect) {
				selectedNode = rng.startContainer.parentNode.parentNode;
				//selectedNode = ed.selection.getNode();
			}
			var canMakeCorrection = WCEUtils.canMakeCorrection(rng,ed);

			//set other variable
			w.isInBE = _isWceBE(ed, selectedNode);
			w.isSelWholeNode = wholeSelect;
			w.selectedNode = selectedNode;

			if ($(selectedNode).hasClass('commentary')  || $(selectedNode).hasClass('ews') || $(selectedNode).hasClass('lectionary-other')) {
				w.type = 'paratext';
			} else {
				w.type = WCEUtils.getNodeTypeName(selectedNode);
			}

			var canInsertNode = !w.isc ? false : WCEUtils.canInsertNote(ed, rng);
			w.not_N = !canInsertNode;

			//highlighting red, blue, yellow .....
			if (w.type && w.type != "formatting_capitals" && w.type.match(/formatting/)) {
				w.type = 'formatting';
			}
			
			if (canMakeCorrection) {
				w.not_C = false;
			} 
			
			w.not_P = !w.isc;   
			switch (w.type) {
				case 'gap':
					_disableAllControls(ed, true);
					w.not_D = false;
					w.not_O = !wholeSelect;
					//when select whole gap, can add corr.
					w.not_C = !wholeSelect;
					w.not_A = !wholeSelect;
					break;

				case 'corr':
					_disableAllControls(ed, true);
					w.not_C = false;
					//w.not_O = false; //does not solve the request, that users want to add ornamentation *after* having corrected the first hand reading
					break;

				case 'abbr':
					_disableAllControls(ed, true);
					w.not_A = false;
					w.not_C = !wholeSelect;
					w.not_D = !wholeSelect;
					if (!wholeSelect) {
						//abbreviations+line break [+ Highlight text]...
						//abbreviations+highlight text ...
						w.not_B = false;
						w.not_O = false;
						w.not_D = false;
					}
					break;
				
				case 'lection_number':
					_disableAllControls(ed, true);
					break;

				case 'book_number':
					_disableAllControls(ed, true);
					break;
					
				case 'chapter_number':
					_disableAllControls(ed, true);
					break;

				case 'verse_number':
					_disableAllControls(ed, true);
					var canInsertNode = !w.isc ? false : WCEUtils.canInsertNote(ed, rng);
					w.not_N = !canInsertNode;
					break;

				case 'brea':
					if (wholeSelect) {
						//when only select CB, PB, QB inhibit input, but can edit
						WCEUtils.inhibitInput(ed, selectedNode);
					} else {
						_disableAllControls(ed, true);
						w.not_C = !wholeSelect;
					}
					w.not_B = false;
					break;

				case 'unclear':
					_disableAllControls(ed, true);
					w.not_D = false;
					w.not_C = !wholeSelect;
					w.not_A = !wholeSelect;
					break;

				case 'spaces':
					_disableAllControls(ed, true);
					w.not_O = true;
					w.not_C = !wholeSelect;
					w.not_D = !wholeSelect;
					w.not_A = !wholeSelect;
					w.not_PC = false;
					break;

				case 'formatting_capitals':
					w.not_C = !wholeSelect;
					break;

				case 'paratext':
					_disableAllControls(ed, true);
					w.not_P = false;
					w.not_C = !wholeSelect;
					break;

				case 'note':
					_disableAllControls(ed, true);
					w.not_N = false;
					break;

				case 'format_end mceNonEditable':
					var pn = selectedNode.parentNode;
					if (pn && WCEUtils.isNodeTypeOf(pn, 'brea')) {
						WCEUtils.inhibitInput(ed, pn);
					} 
					break;
					
				default: 
					break;			
			};
			
			if(selHasSpace){
			 	w.not_A =true;
			}
		},

		/*
		 * 
		 */
		hasWceParentNode: function (node){
			var p=node.parentNode;
			while(p){
				if(p.nodeName.toLowerCase()=='span'){
					return true;
				}
				p=p.parentNode;
			}
			return false;
		},
		 
		/**
		 *
		 */
		inhibitInput : function(ed, node) {
			var attr = node.getAttribute('wce');
			if (attr) {
				//when caret at end of CB, PB and QB (or only select them), inhibit input
				if (attr.match(/break_type=cb/) || attr.match(/break_type=pb/) || attr.match(/break_type=qb/)) {
					WCEUtils.disableAllControls(ed, true);
					ed.WCE_VAR.inputDisable = true;
				}
			}
		},

		/*
		 * start at startFormat element and end at endFormat element
		 */
		isSelectedWholeNode : function(rng) {
			var sf = rng.startContainer;
			var ef = rng.endContainer;

			if (sf && ef && sf.nodeType == 3) {
				var sfParent = sf.parentNode;
				var efParent = ef.parentNode;
				if (sfParent && efParent && sfParent.parentNode === efParent.parentNode && sf.nodeValue.charCodeAt(0) == 8249 && ef.nodeValue.charCodeAt(0) == 8250) {
					return true;
				}
			}
			return false;
		},
		
		
		canMakeCorrection :function (rng, ed){
			var sc = rng.startContainer;
			var ec = rng.endContainer;
			var w=ed.WCE_VAR;

			if (sc && ec && sc.nodeType == 3 && ec.nodeValue && ec.nodeValue.length>0) {
				var scParent = sc.parentNode;
				if(w.isCaretAtFormatStart){
					scParent=scParent.parentNode.parentNode;
				}
			 
				var ecParent = ec.parentNode;
				if(w.isCaretAtFormatEnd){
					ecParent=ecParent.parentNode.parentNode;
				}
				
				if (scParent && ecParent && scParent.parentNode == ecParent.parentNode ) {
					var startOffset=rng.startOffset;
					var endOffset=rng.endOffset;		
					var a=sc.nodeValue.charAt(startOffset-1);			
					var b=ec.nodeValue.charAt(endOffset);
					if(startOffset>0 && a!=' '){
						return false;
					}
					if(endOffset<ec.nodeValue.length && b!=' '){
						return false;
					} 
					return true;
				}
			}
			return false;
		},

		// startCoantainer: if caret at end, move it to Beginn of nextSiling
		// endContainter: if caret at 0, move it to previousSibling
		adaptiveCaret : function(ed, rng) {
			var startContainer = rng.startContainer;
			var startText = startContainer.nodeValue;
			if (startText) {
				if (rng.startOffset == startText.length) {
					rng = WCEUtils.moveCaretToStartOfNextSibling(ed, rng, startContainer);
				}
			}

			if (rng.endOffset == 0) {
				rng = WCEUtils.moveCaretToEndOfPreviousSibling(ed, rng, rng.endContainer);
			}

			return rng;
		},

		// only for mouseup
		adaptiveSelection : function(ed, rng) {
			var startContainer = rng.startContainer;
			// #text
			var startOffset = rng.startOffset;

			var endContainer = rng.endContainer;
			// #text
			var endOffset = rng.endOffset;

			var startText = startContainer.nodeValue;
			var endText = endContainer.nodeValue;

			var newStartOffset, newEndOffset, rngIsChanged;

			if (startText) {
				var newStartOffset = WCEUtils.getTextLeftPosition(startText, startOffset);
				if (newStartOffset != startOffset) {
					rng.setStart(startContainer, newStartOffset);
					rngIsChanged = true;
				}
			}

			if (endText) {
				var newEndOffset = WCEUtils.getTextRightPosition(endText, endOffset);
				if (newEndOffset != endOffset) {
					rng.setEnd(endContainer, newEndOffset);
					rngIsChanged = true;
				}
			}

			if (rngIsChanged) {
				WCEUtils.setRNG(ed, rng);
				WCEUtils.adaptiveCaret(ed, rng);
			}
			return rng;
		},

		/*
		 *
		 */
		canInsertNote : function(ed, rng) {
			var endContainer = rng.endContainer;

			if (!endContainer) {
				return false;
			}
			var text;

			//caret at formatEnd
			var ep = endContainer.parentNode;
			if ($(ep).hasClass('format_end')) {
				if (ep.parentNode.parentNode != ed.getBody()) {
					return false;
				}
				var nextTextNode = ep.parentNode.nextSibling;
				if (nextTextNode) {
					if (nextTextNode.nodeType != 3) {
						return false;
					}
					text = nextTextNode.nodeValue;
					var ch = text.charAt(0);
					if (ch != ' ' && ch != '\xa0') {
						return false;
					}
				}

			} else if (endContainer.parentNode != ed.getBody()) {
				if (!$(endContainer.parentNode).hasClass('verse_number')) // for verses go to next check
					return false;
			}

			text = endContainer.nodeValue;
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
				if (endOffset == len && endOffset > 0) {//special case for first position after correction
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
		canInsertCorrection : function(ed, rng) {
			var startText = rng.startContainer.nodeValue;
			if (startText) {
				var startOffset = rng.startOffset;
				var indexOfEnd = WCEUtils.getNextEnd(startText, startOffset);
			}
			
			if (rng.startOffset == indexOfEnd && startText.charAt(indexOfEnd - 1).trim() == '')
				return true;
			return false;
		},

		/*
		 * @param string from attribut "wce" in <span> @return array
		 */
		stringToArray : function(str) {
			var a = [];
			var ar = str.split('&');
			var k, v, kv;
			for (var i = 0; i < ar.length; i++) {
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
		insertSpace : function(ed, ek, str) {
			var w = ed.WCE_VAR;
			var next = w.nextElem;

			ed.undoManager.add();
			ed.hasTempText = true;

			var sel = WCEUtils.getSEL(ed);
			var rng = sel.getRangeAt(0);
			var rng1 = rng.cloneRange();

			var newNodeText = ' ';
			//if(tinyMCE.isGecko || tinyMCE.isIE || tinyMCE.isOpera){
			newNodeText = '\u00a0';
			//}

			var newNode = document.createTextNode(newNodeText);
			if (next) {
				next.parentNode.insertBefore(newNode, next);
			} else {
				ed.getBody().appendChild(newNode);
			}

			if (ek == 32) {
				rng1.setStart(newNode, 1);
			} else {
				rng1.setStart(newNode, 0);
			}

			rng1.setEnd(newNode, 1);

			if (sel.setSingleRange) {
				sel.setSingleRange(rng1);
			} else {
				sel.removeAllRanges();
				sel.addRange(rng1);
			}

			if (ek == 32) {
				ed.undoManager.add();
				return true;
			}

			return false;
		},

		/*
		 * insert space at begin of the node
		 */
		insertSpaceAtBegin : function(ed, node, ek) {
			ed.undoManager.add();
			ed.hasTempText = true;

			var sel = WCEUtils.getSEL(ed);
			var rng = sel.getRangeAt(0);
			var rng1 = rng.cloneRange();

			var newNode = document.createTextNode('\u00a0');
			node.parentNode.insertBefore(newNode, node);

			if (ek == 32) {
				rng1.setStart(newNode, 1);
			} else {
				rng1.setStart(newNode, 0);
			}

			rng1.setEnd(newNode, 1);

			if (sel.setSingleRange) {
				sel.setSingleRange(rng1);
			} else {
				sel.removeAllRanges();
				sel.addRange(rng1);
			}

			if (ek == 32) {
				ed.undoManager.add();
				return true;
			}

			return false;
		},
		setInfoBoxOffset : function(ed, node) {
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
		showWceInfo : function(ed, e) {
			var info_box = ed.wceInfoBox;
			var sele_node = e.target;
			var wceAttr = sele_node.getAttribute('wce');
			var _dirty = ed.isDirty();
			var useParent = false;
			var type_to_show = ['note', 'corr'];
			// TODO: make better

			var info_arr;
			if (wceAttr && wceAttr != '') {
				info_arr = wceAttr.split('@');
			}
			if (info_arr != null && info_arr.length > 0 && wceAttr.indexOf('__t' + '=') > -1) {

				if (ed.isInfoBoxDisplay && ed.infoBoxTargetNode === sele_node)
					return;

				var ar;
				var corr_str = '';
				var info_text = '';
				var k, v, kv, kv_ar;
				var type_name;
				var switchvar;
				var pNode;
				for (var i = 0; i < info_arr.length; i++) {
					ar = WCEUtils.stringToArray(info_arr[i]);
					type_name = ar['__t'];
					type_name = type_name.split('_');
					switchvar = type_name[0];
					
					/*
					// We test if there is a correction on top of another structure. If so, we have to use the correction for the mouse over. i=0 is the original meaning, i>1 consists of all corrections
					*/
					if (switchvar === 'abbr' || switchvar === 'gap' || switchvar === 'formatting') {
						pNode = sele_node.parentNode;
						if (i == 0 && pNode && pNode.getAttribute('class') === 'corr') { //check parent node
							useParent = true;
							wceAttr = pNode.getAttribute('wce');
							info_arr = wceAttr.split('@');
							ar = WCEUtils.stringToArray(info_arr[0]);
							switchvar = 'corr';
							type_name = 'corr';
							corr_str = '';
							for (var j = 1; j < info_arr.length; j++) {
								var temparray = WCEUtils.stringToArray(info_arr[j]);
								if (temparray['__t'] === 'corr') { //can it be anything different?
									Array.prototype.push.apply(ar,temparray)
								}
							}
						}
						else if (i == 1) { // check ancestor
							ar = WCEUtils.stringToArray(info_arr[0]);
							if (ar['__t'] === 'corr') {
								switchvar = 'corr';
								type_name = 'corr';
								corr_str = '';
							} else
								ar = WCEUtils.stringToArray(info_arr[i]);
						}
					}
					
					switch (switchvar) {
						case 'abbr':
							switch (ar['abbr_type']) {
								case 'nomSac':
									info_text = 'Nomen Sacrum';
									break;
								case 'num':
									info_text = tinymce.translate('infotext_numeral');
									break;
								case 'other':
									info_text = ar['abbr_type_other'];
									break;
							}
							break;
						case 'part':
							// part_abbr
							info_text = '<div>' + tinymce.translate('infotext_editorial_expansion') + '<div>';
							if (ar['exp_rend'] == 'other') {
								info_text += '<div>' + tinymce.translate('infotext_rendition') + ': ' + ar['exp_rend_other'] + '</div>';
							} else {
								if (ar['exp_rend'] != null)
									info_text += '<div>' + tinymce.translate('infotext_rendition') + ': ' + ar['exp_rend'] + '</div>';
							}
							break;
						case 'brea':
							switch (ar['break_type']) {
								case 'lb':
									if (ar['number']) {
										info_text = '<div>' + tinymce.translate('infotext_number') + ': ' + ar['number'] + '</div>';
										if (ar['lb_alignment']) {
											info_text += '<div>' + tinymce.translate('infotext_alignment') + ': ' + ar['lb_alignment'];
										}
									}
									break;
								case 'pb':
									info_text = '<div>' + tinymce.translate('infotext_page_number_sequence') + ': ' + ar['number'];
									if (ar['rv'])
										info_text += ar['rv'];
									if (ar['fibre_type'])
										info_text += (ar['fibre_type'] === 'x') ? "\u2192" : "\u2193";
									info_text += '</div>';
									if (ar['facs']) {
										info_text += '<div>' + tinymce.translate('infotext_url') + ': ' + ar['facs'] + '</div>';
									}
									break;
								default:
									info_text = '<div>' + tinymce.translate('infotext_number') + ': ' + ar['number'] + '</div>';
							}
							break;
						case 'note':
							info_text = '<div>';
							switch (ar['note_type']) {
								case 'editorial':
									info_text += tinymce.translate('infotext_editorial_note') + '</div>';
									break;
								case 'local':
									info_text += tinymce.translate('infotext_local_note') + '</div>';
									break;
								case 'canonRef':
									info_text += tinymce.translate('infotext_canon_reference') + '</div>';
									break;
								case 'changeOfHand':
									info_text += tinymce.translate('infotext_change_of_hand') + '</div>';
									if (ar['newHand'] != null && ar['newHand'].trim() != '')
										info_text += '<div>' + tinymce.translate('infotext_new_hand') + ': ' + ar['newHand'] + '</div>';
									break;
								default:
									// other
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
									corr_str += tinymce.translate('correction');
									break;
								case 'comm':
									corr_str += tinymce.translate('commentary');
									break;
								case 'alt':
									corr_str += tinymce.translate('alternative');
									break;
							}
							corr_str += '</div>';
							corr_str += '<div style="margin-top:5px">' + ar['__n'] + ': ';
							if (ar['blank_correction'] && ar['blank_correction'] === 'on')
								corr_str += tinymce.translate('infotext_deleted') + '</div>';
							else
								corr_str += ar['corrector_text'].replace(/<span class="abbr_add_overline"/g, 
										'<span class="abbr_add_overline" style="text-decoration:overline"') + '</div>';
							if (ar['ut_videtur_corr'] && ar['ut_videtur_corr'] === 'on')
								corr_str += '(ut videtur corr)';
							var deletionText = ar['deletion'].replace(/\,/g, ', ');
							if (deletionText && deletionText != 'null') {
								// information on deletion
								corr_str += '<div style="margin-top:5px">' + tinymce.translate('infotext_method_of_deletion') + ': ' + deletionText + '</div>';
							}
							if (ar['place_corr'] === 'other') {
								corr_str += '<div style="margin-top:10px">' + tinymce.translate('infotext_position') + ': ' + ar['place_corr_other'] + '</div>';
							} else if (ar['place_corr'] != null) {
								corr_str += '<div style="margin-top:10px">' + tinymce.translate('infotext_position') + ': ' + ar['place_corr'] + '</div>';
							}
							if (ar['editorial_note']) {
								corr_str += '<div style="margin-top:5px">Note: ' + ar['editorial_note'] + '</div>';
							}
							break;
						case 'paratext':
							info_text = '<div>' + tinymce.translate('infotext_paratext_type') + ': ';
							switch (ar['fw_type']) {
								case 'commentary':
									info_text = '<div>' + tinymce.translate('infotext_untranscribed_text');
									if (ar['covered']) {
										if (ar['covered'] > 0)
											info_text += '</div><div style="margin-top:5px">' + ar['covered'] + ' ' + tinymce.translate('infotext_lines_covered') + '.';
										else
											info_text += ' ' + tinymce.translate('infotext_within_line') + '.</div>';
									}
									break;
								case 'ews':
									info_text += tinymce.translate('fw_ews');
									break;
								case 'runTitle':
									info_text += tinymce.translate('fw_running_title');
									break;
								case 'chapNum':
									info_text += tinymce.translate('fw_chapter_number');
									break;
								case 'chapTitle':
									info_text += tinymce.translate('fw_chapter_title');
									break;
								case 'colophon':
									info_text += tinymce.translate('fw_colophon');
									break;
								case 'quireSig':
									info_text += tinymce.translate('fw_quiresignature');
									break;
								case 'AmmSec':
									info_text += tinymce.translate('fw_ammonian');
									break;
								case 'EusCan':
									info_text += tinymce.translate('fw_eusebian');
									break;
								case 'euthaliana':
									info_text += tinymce.translate('fw_euthaliana');
									break;
								case 'gloss':
									info_text += tinymce.translate('fw_gloss');
									break;
								case 'lectTitle':
									info_text += tinymce.translate('fw_lectionary_title');
									break;
								case 'lectionary-other':
									info_text = '<div>' + tinymce.translate('infotext_untranscribed_other_lections') + '</div>';
									if (ar['covered'])
										info_text += '<div style="margin-top:5px">' + ar['covered'] + ' ' + tinymce.translate('infotext_lines_covered') + '.';
									break;
								case 'stichoi':
									info_text += tinymce.translate('fw.stichoi');
									break;
								case 'pageNum':
									info_text += tinymce.translate('fw_pagenumber');
									break;
								case 'isolated':
									info_text += tinymce.translate('fw_isolated');
									break;
								case 'andrew':
									info_text += tinymce.translate('fw_andrew');
									break;
								case 'orn':
									info_text += tinymce.translate('fw_ornament');
									break;
								default:
									info_text += ar['fw_type_other'];
							}
							info_text += '</div>';
							if (ar['fw_type'] != 'commentary' && ar['fw_type'] != 'lectionary-other') {
								info_text += '<div style="margin-top:10px">' + tinymce.translate('infotext_value') + ': ' + ar['marginals_text'] + '</div>';
								if (ar['paratext_position'] == 'other') {
									info_text += '<div style="margin-top:10px">' + tinymce.translate('infotext_position') + ': ' + ar['paratext_position_other'] + '</div>';
								} else {
									info_text += '<div style="margin-top:10px">' + tinymce.translate('infotext_position') + ': ' + ar['paratext_position'] + '</div>';
								}
								info_text += '<div style="margin-top:10px">' + tinymce.translate('infotext_alignment') + ': ' + ar['paratext_alignment'] + '</div>';
							}
							break;
						case 'gap':
							if (ar['unit'] == '' && ar['gap_reason'] == '') {
								info_text = tinymce.translate('infotext_no_information_reason');
								break;
							}
							info_text = '<div>' + tinymce.translate('gap') + '</div><div style="margin-top:10px"> ' + tinymce.translate('reason') + ': ';
							if (ar['gap_reason'] == 'lacuna') {
								info_text += tinymce.translate('infotext_lacuna') + '</div>';
							} else if (ar['gap_reason'] == 'illegible') {
								info_text += tinymce.translate('infotext_illegible') + '</div>';
							} else if (ar['gap_reason'] == 'inferredPage') {
								info_text += tinymce.translate('inferredPage') + '</div>';
							} else if (ar['gap_reason'] == 'witnessEnd') {
								info_text += tinymce.translate('witnessEnd') + '</div>';
							} else {
								info_text += tinymce.translate('unspecified') + '</div>';
							}
							
							if (ar['mark_as_supplied'] == 'supplied') {
								info_text += '<div style="margin-top:10px">' + tinymce.translate('suppliedsource') + ': ';
								if (ar['supplied_source'] == 'none')
									info_text += tinymce.translate('none')  + '</div>';
								else if (ar['supplied_source'] == 'other')
									info_text += ar['supplied_source_other'] + '</div>';
								else
									info_text += ar['supplied_source'] + '</div>';
							} else {
								if (ar['extent'] && ar['extent'] != null) {
									info_text += '<div style="margin-top:10px">' + tinymce.translate('extent') + ': ' + ar['extent'] + ' ';
									if (ar['unit'] == 'other') {
										info_text += ar['unit_other'] + '</div>';
									} else if (ar['unit'] != 'unspecified') {
										var str_unit = "wce.unit_"+ar['unit'];
										info_text += tinymce.translate(str_unit) + (tinyMCE.activeEditor.settings.language == 'de' ? '(e)' : '(s)') + '</div>';
									}
								}
							}
							break;
						case 'unclear':
							info_text = '<div>' + tinymce.translate('menu_uncertain') + '</div>';
							if (ar['unclear_text_reason'] != null) {
								info_text += '<div>' + tinymce.translate('reason') + ': ';
								if (ar['unclear_text_reason'] == 'other') {
									info_text += ar['unclear_text_reason_other'];
								} else {
									info_text += ar['unclear_text_reason'];
								}
								info_text += '</div>';
							}
							break;
						case 'spaces':
							info_text = '<div>' + tinymce.translate('space') + '</div><div style="margin-top:10px">' + tinymce.translate('extent') + ': ' + ar['sp_extent'] + ' ';
							if (ar['sp_unit'] == 'other') {
								info_text += ar['sp_unit_other'] + (tinyMCE.activeEditor.settings.language == 'de' ? '' : '(s)') + '</div>';
							} else {
								var str_unit = "wce.unit_"+ar['sp_unit'];
								info_text += tinymce.translate(str_unit) + (tinyMCE.activeEditor.settings.language == 'de' ? '(e)' : '(s)') + '</div>';
							}
							break;
						case 'formatting':
							var foo=ar['formatting_ornamentation_other'];
							if (foo != null) {//  another type of ornamentation
								info_text = '<div>' + foo + '</div>';
							} else if (ar['capitals_height'] != null) {// output only if capitals
								info_text = '<div>' + tinymce.translate('menu_hl_capitals') + '</div><div style="margin-top:10px">' + tinymce.translate('capitals_height') + ': ' + ar['capitals_height'] + '</div>';
							} else {// all other formatting
								if (ar['__t'] === 'formatting_displaced-above')
									info_text = '<div>' + tinymce.translate('infotext_dt_above') + '</div>';
								else if (ar['__t'] === 'formatting_displaced-below')
									info_text = '<div>' + tinymce.translate('infotext_dt_below') + '</div>';
								else if (ar['__t'] === 'formatting_displaced-other')
									info_text = '<div>' + tinymce.translate('infotext_dt_other') + '</div>';
								else
									info_text = '<div>' + tinymce.translate('infotext_highlighted_text') + '</div>';
							}
							break;
						case 'pc':
							info_text = '<div>' + tinymce.translate('infotext_punctuation_mark') + '</div>';
							break;
						case 'verse':
							info_text = '<div>' + 'Verse';
							if (ar['partial']) {
								if (ar['partial'] == 'I')
									info_text += ' (initial portion)';
								if (ar['partial'] == 'M')
									info_text += ' (medial portion)';
								if (ar['partial'] == 'F')
									info_text += ' (final portion)';
							}
							info_text += '</div>';
							break;
						case 'chapter':
							info_text = '<div>' + 'Chapter number' + '</div>';
							break;
						case 'book':
							info_text = '<div>' + 'Book number' + '</div>';
							break;
						case 'lection':
							info_text = '<div>' + 'Lection ' + ar['number'] + '</div>';
							break;
						default:
							info_text = '';
							break;
					}
				}

				if (corr_str != '') {
					if (ar['blank_firsthand'] == 'on')// Blank first hand reading
						corr_str = '*: ' + tinymce.translate('infotext_omission') + corr_str;
					else {
						var fs = new RegExp(ed.WCE_CON.startFormatHtml, 'g');
						var fe = new RegExp(ed.WCE_CON.endFormatHtml, 'g');
						if (ar['ut_videtur_firsthand'] && ar['ut_videtur_firsthand'] === 'on') {
							if (useParent)
								corr_str = '*: ' + ar['original_firsthand_reading'] + ' (ut videtur)' +  corr_str;
							else
								corr_str = '*: ' + $(sele_node).html() + ' (ut videtur)' +  corr_str;
						} else {
							if (useParent)
								corr_str = '*: ' + ar['original_firsthand_reading'] + corr_str;
							else
								corr_str = '*: ' + $(sele_node).html() + corr_str;
						}
						corr_str = corr_str.replace(fs, "").replace(fe, "");
					}
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

					WCEUtils.setInfoBoxOffset(ed, sele_node);
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
		getNextEnd : function(endText, startOffset) {
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
		getTextLeftPosition : function(text, idx) {
			if (!text) {
				return idx;
			}

			var len = text.length;
			if (len <= 0) {
				return 0;
			}

			var c;
			for (var i = idx; i > -1 && i < len; i--) {
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

		/*
		 * wrap content with startFormatHtml and endFormatHtml
		 */
		getFullHTML : function(ed, str) {

		},

		/*
		 * get wceNode innerHTML without start- and endFromat
		 */
		getInnerHTML : function(node) {
			if (!node)
				return '';
			var n = node.cloneNode(true);
			$(n).find('span[sf]').remove();
			$(n).find('span[ef]').remove();
			return $(n).html();
		},

		/*
		 * set innerHTML of wce node with new content
		 */
		setInnerHTML : function(ed, node, newStr) {
			if (!node)
				return '';

			node.innerHTML = ed.WCE_CON.startFormatHtml + newStr + ed.WCE_CON.endFormatHtml;
		},

		// bei adaptive Selection
		getTextRightPosition : function(text, idx) {
			if (!text) {
				return st;
			}

			var len = text.length;
			var c, pre_c;
			var nbsp = '\xa0';
			for (var i = idx; i > -1; i--) {
				ch = text.charAt(i);

				// ende des Textes
				if (i == len && i > 0) {
					// ?????????????
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

		getNodeTypeName : function(node) {
			var nodeName = node.nodeName;
			if (nodeName && nodeName.toLowerCase() == 'span') {
				var class_types = ['verse_number', 'chapter_number', 'format_start', 'format_end'];
				for (var i = 0; i < class_types.length; ++i) {
					if ($(node).hasClass(class_types[i])) return class_types[i];
				}

				var wceAttr = node.getAttribute('wce');
				if (wceAttr) {
					var arr = wceAttr.split('&');
					var arr0 = arr[0];
					if (arr0 && arr0.indexOf('__t=') > -1) {
						return arr0.replace('__t=', '');
					}
				}
			}
			return;
		},

		getTextNode : function(_node) {
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
		
		getTextWithoutFormat : function(_node, ed){ 
			if (_node.nodeType != 1 && _node.nodeType != 11)
				return;
	
			if ($(node).hasClass('format_start') || $(node).hasClass('format_end')) {
				_node.parentNode.removeChild(_node);
				return;
			}
	
			var childList = _node.childNodes;
			for (var i = 0, l = childList.length, c; i < l; i++) {
				c = childList[i];
				if (!c) {
					continue;
				} else {
					WCEUtils.getTextWithoutFormat(c, ed);
				}
			}  
			return $(_node).html();
		},

		doWithDialog : function(ed, url, htm, w, h, inline, add_new_wce_node, title) {
			var winH = $(window).height() - 100;
			var winW = $(window).width() - 60;
			w = winW > w ? w : winW;
			h = winH > h ? h : winH;

			ed.windowManager.open({
				title : title,
				url : url + htm,
				width : w + tinymce.translate('example.delta_width', 0),
				height : h + tinymce.translate('example.delta_height', 0),
				inline : inline
			}, {
				plugin_url : url,
				add_new_wce_node : add_new_wce_node
			});

		},

		doWithoutDialog : function(ed, wceType, character, number) {
			var selNode = ed.WCE_VAR.selectedNode;
			if (selNode && ed.WCE_VAR.isSelWholeNode) {
				ed.selection.select(selNode);
			}
			var content = ed.selection.getContent();
			var wceClass, wceAttr, wceOrig;
			var startFormatHtml = ed.WCE_CON.startFormatHtml;
			var endFormatHtml = ed.WCE_CON.endFormatHtml;
			var _setContent=WCEUtils.setContent;
			switch (wceType) {
				case 'pc':
					wceClass = ' class="pc"';
					wceAttr = ' wce="' + '__t' + '=' + wceType + '" wce_orig=""';
					_setContent(ed, '<span' + wceAttr + wceClass + '>' + startFormatHtml + character + endFormatHtml + '</span> ');
					break;
				case 'abbr':
					// style = 'style="border: 1px dotted #f00; margin:0px; padding:0;"';
					wceClass = ' class="abbr"';
					wceOrig = ' wce_orig="' + encodeURIComponent(character);
					+'"';
					wceAttr = '"wce=__t=abbr&amp;__n=&amp;original_abbr_text=&amp;abbr_type=nomSac&amp;abbr_type_other=&amp;add_overline="';
					_setContent(ed, '<span ' + wceAttr + wceOrig + wceClass + '>' + startFormatHtml + character + endFormatHtml + '</span> ');
					break;
				case 'brea':
					_setContent(ed, WCEUtils.getBreakHtml(ed, 'lb'));
					break;
				case 'part_abbr':
					// part-worded abbreviations
					var rng = WCEUtils.getRNG(ed);
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
						WCEUtils.setRNG(ed, rng);
						wceAttr = 'wce="' + '__t' + '=' + wceType + '&exp_rend=&exp_rend_other=' + '" ';
						_setContent(ed, '<span ' + wceAttr + wceClass + '>' + startFormatHtml + part_abbr + endFormatHtml + '</span>');
					} else {
						alert(tinymce.translate('error_part_abbr'));
					}
					break;
				/*
				 * case 'formatting_capitals': //Capitals ed.insertContent('<span wce="' + '__t' + '=' + wceType + '&amp;height=' + character + '"' + style + '>' + content + '</span>'); break;
				 */
				case 'unclear':
					// uncertain letters
					selection = ed.selection.getContent();
					var unclear_text = "";
					var newContent = "";
					var word = "";
					var unclear_text = "";
					wceClass = ' class="unclear"';
					for (var i = 0; i < selection.length; i++) {//TODO: +endFormatHtml +startFormatHtml
						// Divide input into words
						if (selection.charAt(i) == ' ') {
							// Space -> new word
							wceAttr = 'wce="__t=unclear&amp;__n=&amp;original_text=' + word + '"';
							newContent += '<span ' + wceAttr + wceClass + '>' + unclear_text + '</span> ';
							word = "";
							unclear_text = "";
						} else {
							word += selection.charAt(i);
							unclear_text += selection.charAt(i) + '&#x0323;';
						}
					}
					// add last part of selection
					newContent += '<span wce="__t=unclear&amp;__n=&amp;original_text=' + word + '" ' + wceClass + '>' + startFormatHtml + unclear_text + endFormatHtml + '</span>';
					_setContent(ed, newContent);
					break;
				case 'witnessend':
					wceClass = ' class="witnessend"';
					wceAttr = 'wce="__t=gap&amp;__n=&amp;original_gap_text=&amp;gap_reason=witnessEnd&amp;unit=&amp;unit_other=&amp;extent=&amp;supplied_source=na28&amp;supplied_source_other=&amp;insert=Insert&amp;cancel=Cancel" ';
					_setContent(ed, '<span ' + wceAttr + wceClass + '>' + startFormatHtml + 'Witness End' + endFormatHtml + '</span>');
					break;

				default:
					wceClass = ' class="' + wceType + '"';
					wceAttr = 'wce="' + '__t' + '=' + wceType + '" ';
					wceOrig = ' wce_orig="' + encodeURIComponent(content) + '"';
					_setContent(ed, '<span ' + wceAttr + wceClass + ' ' + wceOrig + '>' + startFormatHtml + content + endFormatHtml + '</span>');
			}
		},

		stopEvent : function(ed, e) {
			var evs = ed.dom.events;
			evs.cancel(e);
			return false;
		},

		setKeyDownEvent : function(e) {
			var ed = this;
			if (!e) {
				var e = window.event;
			}
			
			// be sure WCE_VAR is up to date
			WCEUtils.setWCEVariable(ed);

			var language = window.navigator.userLanguage || window.navigator.language;

			var ek = e.keyCode || e.charCode || 0;

			// allow all arrow key
			if (ek == 17 || (ek > 32 && ek < 41)) {
				return;
			}

			var wcevar = ed.WCE_VAR;
			var stopEvent = WCEUtils.stopEvent;

			//mousedown and keydown cannot at the same time
			if (wcevar.isMouseDown) {
				return stopEvent(ed, e);
			}
			var doWithDialog = WCEUtils.doWithDialog;
			var doWithoutDialog = WCEUtils.doWithoutDialog;
			var setWCEVariable = WCEUtils.setWCEVariable;
			var redrawContols = WCEUtils.redrawContols;
			var doInsertSpace = false;

			if (wcevar.inputDisable && (!e.ctrlKey || (tinymce.isMac && !e.metaKey))) {
				return stopEvent(ed, e);
			}

			// press and hold to delete char prohibited in some cases
			if (!tinymce.isOpera && (ek == 46 || ek == 8)) {
				ed.keyDownDelCount++;
				if (ed.keyDownDelCount > 1) {
					setWCEVariable(ed);
					redrawContols(ed);
					wcevar.isRedrawn = true;
					if ((wcevar.isCaretAtNodeEnd && wcevar.isNextElemBE) || (wcevar.isInBE)) {//allow deletion if no special element is concerned
						return stopEvent(ed, e);
					}
				}
			}
			if (((tinymce.isMac && e.metaKey) || (e.ctrlKey)) && !e.altKey && (ek == 48 || ek == 66 || ek == 73)) {
				return stopEvent(ed, e);
			}

			if (((tinymce.isMac && e.metaKey) || (e.ctrlKey)) && e.altKey && ek == 65) {
				ed.execCommand('mceAddAbbr_Shortcut');
				return stopEvent(ed, e);
				//Ctrl+Shift+A
			}

			if (((tinymce.isMac && e.metaKey) || (e.ctrlKey)) && e.altKey && ek == 86) {
				//Ctrl+Shift+V
			}
			
			// TODO: if no short_cut B, C ,Z ,Y .....
			if (wcevar.isInBE && ((!tinymce.isMac && !e.ctrlKey) || (tinymce.isMac && !e.metaKey))) {
				// keydown for insert letter
				if (wcevar.isCaretAtNodeEnd && ek != 8 && ek != 46
					&& (wcevar.type == ed.WCE_CON.formatEnd || wcevar.type == 'chapter_number' 
						|| wcevar.type === 'book_number' || wcevar.type == 'verse_number'|| wcevar.type == 'lection_number')
				) {
					//wenn selectednode in andere BlockElement
					if (WCEUtils.isWceBE(ed, wcevar.selectedNode.parentNode.parentNode)) {
						return stopEvent(ed, e);
					}
					// we have to check for some special keys and skip them, one could maybe ask for a range of a-z
					if (e.altKey || ek == 16 || ek == 17 || ek == 20 || ek == 27 )
						return stopEvent(ed, e);
					//nur wenn cursor am Ende von formatEnd
					var isSpaceKey = WCEUtils.insertSpace(ed, ek);
					doInsertSpace = true;
					setWCEVariable(ed);
					redrawContols(ed);
					ed.WCE_VAR.isRedrawn = true;
					if (isSpaceKey) {
						return stopEvent(ed, e);
					}
				}

				 else
				if (ek == 46 && wcevar.selectedNode && ($(wcevar.selectedNode).hasClass('commentary') || $(wcevar.selectedNode).hasClass('ews') || $(wcevar.selectedNode).hasClass('lectionary-other'))) {
					WCEUtils.wceDelNode(ed);
					return stopEvent(ed, e);
				} else if (ek == 46 && wcevar.isCaretAtNodeEnd && !wcevar.isNextElemBE) {

				} else if (ek == 46 && wcevar.isCaretAtNodeEnd && wcevar.isNextElemBE && !$(wcevar.nextElem).hasClass('commentary') && !$(wcevar.nextElem).hasClass('ews') && !$(wcevar.nextElem).hasClass('lectionary-other')) {
					//caret in the middle of two elements
					return stopEvent(ed, e);
				} else if ((ek == 46 && !wcevar.isCaretAtFormatStart) || (ek == 8 && wcevar.type != ed.WCE_CON.formatEnd && !wcevar.isCaretAtFormatStart)) {
					WCEUtils.wceDelNode(ed);
					return stopEvent(ed, e);
				} else if (wcevar.isc) {
					//Allow text input at begin of the editor #1362
					var ancestor = WCEUtils.isCaretAtBeginOfEditor(ed);
					if (ancestor) {
						var isSpaceKey = WCEUtils.insertSpaceAtBegin(ed, ancestor, ek);
						setWCEVariable(ed);
						redrawContols(ed);
						ed.WCE_VAR.isRedrawn = true;
						if (isSpaceKey) {
							return stopEvent(ed, e);
						}
					} else if (ek == 13 || ek == 10) { // do not return if "enter" is pressed
						;
					} else {
						return stopEvent(ed, e);
					}
				} else
					return stopEvent(ed, e);
			}
			
			// key "entf"
			if (ek == 46 && wcevar.isCaretAtNodeEnd) {
				if (wcevar.isNextElemBE) {
					return stopEvent(ed, e);
				}
				if (wcevar.nextElem && wcevar.nextElem.nodeType == 1) {
					return stopEvent(ed, e);
				}
			}
				
			if (ek == 13 || ek == 10) {
				if (e.shiftKey) {
					// Shift+Enter -> break dialogue
					if (wcevar.type != 'break' && !wcevar.not_B) {
						ed.execCommand('mceAddBreak');
					}
				} else if ((wcevar.isc && !wcevar.not_B) || doInsertSpace) {
					doWithoutDialog(ed, 'brea');
				}
				return stopEvent(ed, e);
			}

			var langEn = language.substring(0, 2) == "en";
			var ignoreShiftNotEn = tinyMCE.activeEditor.settings.ignoreShiftNotEn ? tinyMCE.activeEditor.settings.ignoreShiftNotEn : [];
			var keyboardDebug = tinyMCE.activeEditor.settings.keyboardDebug;
			// Add <pc> for some special characters
			// We need a lot of cases, because of different kyeboard layouts, different browsers and different platforms
			if (keyboardDebug) console.log('ek: ' + ek + '; shiftKey: ' + e.shiftKey + '; altKey: ' + e.altKey + '; langEn: ' + langEn);
			if (ek == 59 && !e.shiftKey && langEn && !tinymce.isWebKit) {// ; en
				tinyMCE.activeEditor.execCommand('mceAdd_pc', ';');
				stopEvent(ed, e);
			} else if (ignoreShiftNotEn.indexOf[188] < 0 && ek == 188 && !langEn && e.shiftKey) {
				// ; dt < en
				tinyMCE.activeEditor.execCommand('mceAdd_pc', ';');
				stopEvent(ed, e);
			} else if (ignoreShiftNotEn.indexOf[190] < 0 && ek == 190 && e.shiftKey && !langEn) {
				// :
				tinyMCE.activeEditor.execCommand('mceAdd_pc', ':');
				stopEvent(ed, e);
			} else if (ek == 188 && !e.shiftKey) {
				// ,
				tinyMCE.activeEditor.execCommand('mceAdd_pc', ',');
				stopEvent(ed, e);
			} else if (ek == 190 && !e.shiftKey) {
				// .
				tinyMCE.activeEditor.execCommand('mceAdd_pc', '.');
				stopEvent(ed, e);
			} else if (ek == 189 && !e.shiftKey) {
				// .
				tinyMCE.activeEditor.execCommand('mceAdd_pc', '\u00B7');
				stopEvent(ed, e);

			} else if (ek == 63 && e.shiftKey) {// for FF
				tinyMCE.activeEditor.execCommand('mceAdd_pc', '?');
				stopEvent(ed, e);
			} else if (ek == 191 && e.shiftKey && langEn) {
				// ? en
				tinyMCE.activeEditor.execCommand('mceAdd_pc', '?');
				stopEvent(ed, e);
			} else if (ek == 219 && e.shiftKey && !langEn) {
				// ? dt
				tinyMCE.activeEditor.execCommand('mceAdd_pc', '?');
				stopEvent(ed, e);
			} else if (ek == 56 && e.shiftKey) {
				// ( TODO?
			} else if (ek == 57 && e.shiftKey && e.altKey) {// For Mac OS X, Middledot
				tinyMCE.activeEditor.execCommand('mceAdd_pc', '\u0387');
				stopEvent(ed, e);
			} else if (ek == 48 && e.shiftKey && e.altKey) {// Three Dot Punctuation
				tinyMCE.activeEditor.execCommand('mceAdd_pc', '\u2056');
				stopEvent(ed, e);
			} else if (ignoreShiftNotEn.indexOf[57] < 0 && ek == 57 && e.shiftKey && !langEn) {// special handling for English keyboards
				stopEvent(ed, e);
				doWithoutDialog(ed, 'part_abbr', '');
			} else if (ek == 48 && langEn) {//special handling for English keyboard
				stopEvent(ed, e);
				doWithoutDialog(ed, 'part_abbr', '');
			}
		},

		setKeyPressEvent : function(e) {
			var ed = this;
			if (!e) {
				var e = window.event;
			}

			var ek = e.keyCode || e.charCode || 0;
			var stopEvent = WCEUtils.stopEvent;

			if (tinymce.isWebKit) {// for Chrome (on Linux and Mac) and Safari: ":" and ";" both give the same keydown code 186 (???). So we use keypress for them
				if (ek == 58) {// :
					tinyMCE.activeEditor.execCommand('mceAdd_pc', ':');
					stopEvent(ed, e);
				} else if (ek == 59) {// ;
					tinyMCE.activeEditor.execCommand('mceAdd_pc', ';');
					stopEvent(ed, e);
				}
			}

			if (ek == 123) {
				if (!ed.WCE_VAR.not_N)
					tinyMCE.activeEditor.execCommand('mceAddNote');
				stopEvent(ed, e);
			}
		},
		// delete nodeName
		wceDelNode : function(ed, notAddOriginal) {
			var wceNode = WCEPlugin.getWceNode(ed);
			if (wceNode) {
				if (WCEUtils.hasWceParentNode(wceNode)) {
					alert(tinymce.translate('warning_deletion_inner_Node'));//TODO: 				
					return;
				}
				//verse chapter
				if ($(wceNode).hasClass('verse_number') || $(wceNode).hasClass('chapter_number') || $(wceNode).hasClass('book_number') || $(wceNode).hasClass('lection_number')) {
					return;
				}

				ed.selection.select(wceNode);

				var wceAttr = wceNode.getAttribute('wce');
				var originalText = decodeURIComponent(wceNode.getAttribute('wce_orig'));
					
				//TODO: after import some node have no wce_orig, we can set wce_orig at import, or don't use 'wce_orig'?
				// originalText=WCEUtils.getTextWithoutFormat(wceNode, ed);
					
				var isDel;
				if ($(wceNode).hasClass('brea') || $(wceNode).hasClass('gap')) {
					//We need a marker here similar to the one for deleting non-breaks. Otherwise there are problems under Safari!
					//Fixed:  we do not use function remove
					var bID = wceNode.getAttribute('id');
					if (!bID) {
						ed.selection.select(wceNode);
						ed.insertContent("");
						//$(wceNode).remove();
					} else {
						//delete group
						var bArr = bID.split('_');
						// for example: qb_4_6413132132121
						//break type
						var bt = bArr[0];
						//group count
						var bc = bArr[1];
						//id index
						var bb = bArr[2];
						if (bb && bc && bt) {
							if (bt == 'lb' && bc == '2') {	// cb followed by lb => special case to be able to add missing line in a column (>1)
								elem=ed.dom.get('lb' + '_' + bc + '_' + bb);
								if (elem) {									
									ed.selection.select(elem);
									ed.insertContent("");
									ed.WCE_VAR.lcnt = 0;
								}
								
							} else { // normal case
								var arr = new Array('gap','lb', 'cb', 'pb', 'qb');
								//for (var i = parseInt(bc) - 1; i > -1; i--) {
								for(var i=0,elem,l=arr.length; i<l; i++){
									elem=ed.dom.get(arr[i] + '_' + bc + '_' + bb);
									if (elem) {									
										ed.selection.select(elem);
										ed.insertContent("");
									}
									//$(ed.dom.get(arrItem + '_' + bc + '_' + bb)).remove();
								}
							}
						}
					}
					isDel=true;
				}

				/* else {
				 if (wceNode !== null) {
				 // Node is replaced by marker (which is then replaced by original text) => solution for problems with removing nodes under Safari (#1398)
				 ed.insertContent('<span id="_math_marker">&nbsp;</span>');
				 }
				 }*/

				if ((originalText && originalText != 'null') || originalText=='') {
					if(notAddOriginal){ 
					}else{
						 ed.insertContent(originalText);
					}
					ed.focus(); 
					ed.isNotDirty = 0;
					return originalText;
				} else if(!isDel){
					if(wceNode){
						ed.selection.select(wceNode);
					}
					ed.insertContent("");
				}
				ed.focus();

				ed.isNotDirty = 0;
			}
		},
	};

	/**
	 *
	 * WCE Plugin (Object) definition
	 *
	 *
	 */
	var WCEPlugin = {

		/**
		 * Initializes the plugin,
		 *
		 * @param {tinymce.Editor}
		 *            ed Editor instance that the plugin is initialized in.
		 * @param {string}
		 *            url Absolute URL to where the plugin is located.
		 */
		init : function(ed, url) {
			var doWithDialog = WCEUtils.doWithDialog;
			var doWithoutDialog = WCEUtils.doWithoutDialog;
			ed.WCEUtils = WCEUtils;
			ed.WCE_VAR = {};
			ed.WCE_CON = {};
			ed.WCE_CON.buttons = {};

			ed.keyDownDelCount = 0;
			ed.isCounterInited = false;

			// setWCE_CONTROLS
			ed.on('NodeChange', function(e, cm, n) {
				var ed = this;
				WCEUtils.setWCEVariable(ed);
				WCEUtils.redrawContols(ed);
			});

			// TODO: check. Was addToTop
			ed.on('keyup', function(e) {
				var ed = this;
				if (ed.hasTempText) {
					var dataList = ed.undoManager.data;
					if (dataList) {
						var l = dataList.length;
						dataList[l - 1] = null;
						dataList.length = l - 1;
						dataList[l - 2].beforeBookmark = null;
						//dataList[l-1]=dataList[l-2];
						ed.hasTempText = false;
					}
				}
				ed.keyDownDelCount = 0;

				// wenn redraw bei keyDown nicht gemacht
				if (!ed.WCE_VAR.isRedrawn) {
					WCEUtils.setWCEVariable(ed);
					WCEUtils.redrawContols(ed);
					ed.WCE_VAR.isRedrawn = true;
					return;
				}

				ed.WCE_VAR.isRedrawn = false;
			});

			if (tinymce.isOpera) {
				// TODO: check. was addToTop
				ed.on('keypress', function(e) {
					var ed = this;
					if (!e) {
						var e = window.event;
					}
					var ek = e.keyCode || e.charCode || 0;
					if (ek == 46 || ek == 8) {
						ed.keyDownDelCount++;
						if (ed.keyDownDelCount > 1) {
							WCEUtils.setWCEVariable(ed);
							WCEUtils.redrawContols(ed);
							ed.WCE_VAR.isRedrawn = true;
							return WCEUtils.stopEvent(ed, e);
						}
					}
				});
			}

			// TODO: check. all 4 of these were addToTop
			ed.on('keydown', WCEUtils.setKeyDownEvent);
			ed.on('keypress', WCEUtils.setKeyPressEvent);
			//needed for Chrome (Linux) :-(

			ed.on('mousedown', function(e) {
				this.WCE_VAR.isMouseDown = true;
			});
			ed.on('mouseup', function(e) {
				this.WCE_VAR.isMouseDown = false;
			});

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
			ed.on('postRender', function() {
				var ed = $(this)[0];
				var id = ed.id + '_adaptive_selection';
				var statusbar= $(tinymce.activeEditor.iframeElement.parentElement.parentElement).children('.mce-statusbar').children('div');
				if (statusbar) {
					tinymce.DOM.insertAfter(
						tinymce.DOM.add(statusbar, 'div', {
								'class' : 'mce-flow-layout-item',
								'style' : 'padding:8px;'
							}, '<input type="checkbox" id="' + id + '"> Adaptive selection</input><span style="margin: 0 100px">Version: ' + wfce_editor +'</span><span style="">Transcription Editor by <img style="height:2em;margin-top:-0.5em;" src="'+url+'/trier-logo-TCDH.png"/></span>', true
						),
						$(statusbar).find('.mce-first')[0]
					);
				}
			});

			// html to tei
			ed.addCommand('mceHtml2Tei', function() {
				doWithDialog(ed, url, '/html2tei.htm', 580, 420, 1, true, 'XML Output');

			});

			// add verse modify button
			ed.addButton('versemodify', {
				title : tinymce.translate('menu_verses') + ' (Ctrl+Alt+V)',
				cmd : 'mceVerseModify',
				image : url + '/img/button_V.png',
				onPostRender : function() { ed.WCE_CON.buttons[this.settings.icon] = this; },
			});

			// add showTeiByHtml button
			ed.addButton('showTeiByHtml', {
				title : 'Show XML format',
				cmd : 'mceHtml2Tei',
				image : url + '/img/button_XML.png',
				onPostRender : function() { ed.WCE_CON.buttons[this.settings.icon] = this; },
			});

			// tei to html only for Test
			ed.addCommand('mceTei2Html', function() {
				doWithDialog(ed, url, '/tei2html.htm', 580, 420, 1, true, 'TEI to HTML');
			});

			// add showHtmlByTei button
			ed.addButton('showHtmlByTei', {
				title : 'For test: \n  get HTML output from TEI',
				cmd : 'mceTei2Html',
				image : url + '/img/xmlinput.jpg',
				onPostRender : function() { ed.WCE_CON.buttons[this.settings.icon] = this; },
			});
			
			ed.addCommand('mceShowHelp', function() {
				if (tinyMCE.activeEditor.settings.language == 'de') 
					window.open(url + "/docu.htm","_blank",
						"width=800,height=600,resizable=yes,status=no,"+
						"menubar=no,location=no,scrollbars=yes,toolbar=no");
				else
					window.open(url + "/docu_en.htm","_blank",
						"width=800,height=600,resizable=yes,status=no,"+
						"menubar=no,location=no,scrollbars=yes,toolbar=no");
			});

			// add showHtmlByTei button
			ed.addButton('help', {
				title : 'Open the documentation',
				cmd : 'mceShowHelp',
				image : url + '/img/button_Help.png',
				onPostRender : function() { ed.WCE_CON.buttons[this.settings.icon] = this; },
			});
			
			ed.addCommand('mceShowInfo', function() {
				window.open(url + "/changelog.htm","_blank",
						"width=800,height=600,resizable=yes,status=no,"+
						"menubar=no,location=no,scrollbars=yes,toolbar=no");
				//alert(tinymce.translate('menu_info')+wfce_editor);
			});

			// add showHtmlByTei button
			ed.addButton('info', {
				title : 'Information about the editor',
				cmd : 'mceShowInfo',
				image : url + '/img/button_Info.png',
				onPostRender : function() { ed.WCE_CON.buttons[this.settings.icon] = this; },
			});

			ed.addCommand('mceReload', function(lang) {
				// TODO: implementation
			});

			ed.addButton('english', {
				title : 'Switch to English language (not implemented yet)',
				cmd : 'mceReload("en")',
				image : url + '/img/gb.png',
				onPostRender : function() { ed.WCE_CON.buttons[this.settings.icon] = this; },
			});

			ed.addButton('german', {
				title : 'Switch to German language (not implemented yet)',
				cmd : 'mceReload("de")',
				image : url + '/img/de.png',
				onPostRender : function() { ed.WCE_CON.buttons[this.settings.icon] = this; },
			});





				/*
				 * case 'metadata': var c = cm.createButton('menu-metadata', { title : 'Metadata', image : tinyMCE.baseURL+'/plugins/wce/img/button_meta.gif', onclick : function() { tinyMCE.activeEditor.execCommand('mceAddMetadata'); } }); return c;
				 */
			ed.addButton('breaks', {
				title : tinymce.translate('menu_break') + ' (Ctrl+Alt+B)',
				image : url + '/img/button_B.png',
				type : 'menubutton',
				icons : false,
				onPostRender : function() { ed.WCE_CON.buttons[this.settings.icon] = this; },
				onshow : function(a) {
					var items = a.control.items();
					var w = ed.WCE_VAR;
					if (w.type == 'brea') {
						items[0].disabled(true);
						items[1].disabled(false);
						items[2].disabled(false);
					} else {
						items[0].disabled(false);
						items[1].disabled(true);
						items[2].disabled(true);
					}
				},
				menu : [
				{ text : tinymce.translate('menu_add'),
					id : 'menu-break-add',
					onclick : function() {
						ed.execCommand('mceAddBreak');
					}
				},
				{ text : tinymce.translate('menu_edit'),
					id : 'menu-break-edit',
					onclick : function() {
						ed.execCommand('mceEditBreak');
					}
				},
				{ text : tinymce.translate('menu_delete'),
					id : 'menu-break-delete',
					onclick : function() {
						WCEUtils.wceDelNode(ed);
					}
				}]
			});

			ed.addButton('correction', {
				title : tinymce.translate('menu_corrections') + ' (Ctrl+Alt+C)',
				image : url + '/img/button_C.png',
				icons : false,
				onPostRender : function() { ed.WCE_CON.buttons[this.settings.icon] = this; },
				onclick : function() {
					ed.execCommand('mceAddCorrection');
				}
			});

			ed.addButton('illegible', {
				title : tinymce.translate('menu_deficiency'),
				image : url + '/img/button_D.png',
				icons : false,
				type : 'menubutton',
				onPostRender : function() { ed.WCE_CON.buttons[this.settings.icon] = this; },
				menu : [
				{ text : tinymce.translate('menu_uncertain') + ' (Ctrl+Alt+U)',
					id : 'menu-illegible-uncleartext',
					menu : [
					{ text : tinymce.translate('menu_add'),
						id : 'menu-illegible-uncleartext-add',
						onclick : function() {
							ed.execCommand('mceAddUnclearText');
						}
					},
					{ text : tinymce.translate('menu_edit'),
						id : 'menu-illegible-uncleartext-edit',
						onclick : function() {
							ed.execCommand('mceEditUnclearText');
						}
					},
					{ text : tinymce.translate('menu_delete'),
						id : 'menu-illegible-uncleartext-delete',
						onclick : function() {
							WCEUtils.wceDelNode(ed);
						}
					}],
					onshow : function(a) {
						var items = a.control.items();
						var w = ed.WCE_VAR;
						if (ed.selection.isCollapsed() && w.type != 'unclear') {
							items[0].disabled(true);
							items[1].disabled(true);
							items[2].disabled(true);
							return;
						}
						var b = false;
						if (w.type == 'unclear') {
							b = true;
						}
						items[0].disabled(b);
						items[1].disabled(!b);
						items[2].disabled(!b);
					}
				},
				{ text : tinymce.translate('menu_gap') + ' (Ctrl+Alt+G)',
					id : 'menu-illegible-lacuna',
					menu : [
					{ text : tinymce.translate('menu_add'),
						id : 'menu-illegible-lacuna-add',
						onclick : function() {
							ed.execCommand('mceAddGap');
						}
					},
					{ text : tinymce.translate('menu_edit'),
						id : 'menu-illegible-lacuna-edit',
						onclick : function() {
							ed.execCommand('mceEditGap');
						}
					},
					{ text : tinymce.translate('menu_delete'),
						id : 'menu-illegible-lacuna-delete',
						onclick : function() {
							WCEUtils.wceDelNode(ed);
						}
					}],
					onshow : function(a) {
						var items = a.control.items();
						var b = false;
						var w = ed.WCE_VAR;
						if (w.type == 'gap') {
							b = true;
						}
						items[0].disabled(b);
						items[1].disabled(!b);
						items[2].disabled(!b);
					}
				},
				{ text : tinymce.translate('menu_witnessend'),
					id : 'menu-illegible-witnessend',
					onclick : function() {
						ed.execCommand('mceAddWitnessend');
					}
				}]
			});


			ed.addButton('decoration', {
				title : tinymce.translate('menu_ornamentation'),
				image : url + '/img/button_O.png',
				icons : false,
				type  : 'menubutton',
				onPostRender : function() { ed.WCE_CON.buttons[this.settings.icon] = this; },
				onshow: function(a) {
						var sub;
						var w = ed.WCE_VAR;
				},
				menu : [
				{ text : tinymce.translate('menu_highlight_text'),
					id : 'menu-decoration-highlight',
					menu : [
					{ text : tinymce.translate('menu_hl_rubrication'),
						id : 'menu-decoration-highlight-rubrication',
						onclick : function() {
							ed.execCommand('mceAdd_formatting', 'rubrication');
						}
					},
					{ text : tinymce.translate('menu_hl_gold'),
						id : 'menu-decoration-highlight-gold',
						onclick : function() {
							ed.execCommand('mceAdd_formatting', 'gold');
						}
					},
					{ text : tinymce.translate('menu_hl_other_color'),
						id : 'menu-decoration-highlight-other-color',
						menu : [
						{ text : tinymce.translate('menu_hl_blue'),
							id : 'menu-decoration-highlight-blue',
							onclick : function() {
								ed.execCommand('mceAdd_formatting', 'blue');
							}
						},
						{ text : tinymce.translate('menu_hl_green'),
							id : 'menu-decoration-highlight-green',
							onclick : function() {
								ed.execCommand('mceAdd_formatting', 'green');
							}
						},
						{ text : tinymce.translate('menu_hl_yellow'),
							id : 'menu-decoration-highlight-yellow',
							onclick : function() {
								ed.execCommand('mceAdd_formatting', 'yellow');
							}
						},
						{ text : tinymce.translate('menu_hl_other'),
							id : 'menu-decoration-highlight-other-other',
							onclick : function() {
								ed.execCommand('mceAdd_formatting', 'other');
							}
						}],
						onshow : function(a) {
							var items = a.control.items();
							var b = ed.selection.isCollapsed();
							items[0].disabled(b);
							items[1].disabled(b);
							items[2].disabled(b);
							items[3].disabled(b);
						}
					},
					{ text : tinymce.translate('menu_hl_overline'),
						id : 'menu-decoration-highlight-overline',
						onclick : function() {
							ed.execCommand('mceAdd_formatting', 'overline');
						}
					},
					{ text : tinymce.translate('menu_hl_capitals'),
						id : 'menu-decoration-highlight-capitals',
						menu : [
						{ text : tinymce.translate('menu_add'),
							id : 'menu-decoration-highlight-capitals-add',
							icons : false,
							onclick : function() {
								ed.execCommand('mceAddCapitals');
							}
						},
						{ text : tinymce.translate('menu_edit'),
							id : 'menu-decoration-highlight-capitals-edit',
							onclick : function() {
								ed.execCommand('mceEditCapitals');
							}
						},
						{ text : tinymce.translate('menu_delete'),
							id : 'menu-decoration-highlight-capitals-delete',
							onclick : function() {
								WCEUtils.wceDelNode(ed);
							}
						}],
						onshow : function(a) {
							var items = a.control.items();
							var w = ed.WCE_VAR;
							if (w.type == 'formatting_capitals') {
								items[0].disabled(true);
								items[1].disabled(false);
								items[2].disabled(false);
							} else {
								items[0].disabled(false);
								items[1].disabled(true);
								items[2].disabled(true);
							}
						}
					}],
					onshow : function(a) {
						var items = a.control.items();
						var b = ed.selection.isCollapsed();
						items[0].disabled(b);
						items[1].disabled(b);
						items[2].disabled(b);
					}
				},
				{ text : tinymce.translate('menu_displaced_text'),
					id : 'menu-decoration-displaced',
					menu : [
					{ text : tinymce.translate('menu_dt_above'),
						id : 'menu-decoration-displaced-above',
						onclick : function() {
							ed.execCommand('mceAdd_formatting', 'displaced-above');
						}
					},
					{ text : tinymce.translate('menu_dt_below'),
						id : 'menu-decoration-displaced-below',
						onclick : function() {
							ed.execCommand('mceAdd_formatting', 'displaced-below');
						}
					},
					{ text : tinymce.translate('menu_dt_other'),
						id : 'menu-decoration-displaced-other',
						onclick : function() {
							ed.execCommand('mceAdd_formatting', 'displaced-other');
						}
					}],
					onshow : function(a) {
						var items = a.control.items();
						var b = ed.selection.isCollapsed();
						items[0].disabled(b);
						items[1].disabled(b);
						items[2].disabled(b);
					}
				},

						/*
						 sub = m.addMenu({
						 title : tinymce.translate('menu_special_chars')
						 });
						 sub.onShowMenu.add(function(m) {
						 var items = m.items;
						 var b = !ed.selection.isCollapsed();
						 items['menu-decoration-insert1'].setDisabled(b);
						 items['menu-decoration-insert2'].setDisabled(b);
						 items['menu-decoration-insert3'].setDisabled(b);
						 items['menu-decoration-insert4'].setDisabled(b);
						 items['menu-decoration-insert5'].setDisabled(b);
						 });

						 sub.add({
						 title : '\u203B	(cross with dots)',
						 id : 'menu-decoration-insert1',
						 onclick : function() {
						 ed.execCommand('mceAdd_pc', '\u203B');
						 }
						 });

						 sub.add({
						 title : '\u003E (diple)',
						 id : 'menu-decoration-insert2',
						 onclick : function() {
						 ed.execCommand('mceAdd_pc', '\u003E');
						 }
						 });

						 sub.add({
						 title : '\u2020	(obelus)',
						 id : 'menu-decoration-insert3',
						 onclick : function() {
						 ed.execCommand('mceAdd_pc', '\u2020');
						 }
						 });

						 sub.add({
						 title : '\u00B6	(paragraphus)',
						 id : 'menu-decoration-insert4',
						 onclick : function() {
						 ed.execCommand('mceAdd_pc', '\u00B6');
						 }
						 });

						 sub.add({
						 title : '\u03A1\u0336    (staurogram)',
						 id : 'menu-decoration-insert5',
						 onclick : function() {
						 ed.execCommand('mceAdd_pc', '\u03A1\u0336');
						 }
						 });*/
						
				{ text : tinymce.translate('menu_hl_other'),
					id : 'menu-decoration-other',
					onclick : function() {
						ed.execCommand('mceAdd_ornamentation_other');
					}
				}]
			});




			ed.addButton('abbreviation', {
				title : tinymce.translate('menu_abbreviations'),
				image : url + '/img/button_A.png',
				icons : false,
				type  : 'menubutton',
				onPostRender : function() { ed.WCE_CON.buttons[this.settings.icon] = this; },
				onshow: function(a) {
						var sub;
						var w = ed.WCE_VAR;
				},
				menu : [
				{ text : tinymce.translate('menu_abbreviations') + ' (Ctrl+Alt+A)',
					id : 'menu-abbreviation',
					menu : [
					{ text : tinymce.translate('menu_add'),
						id : 'menu-abbreviation-add',
						onclick : function() {
							ed.execCommand('mceAddAbbr');
						}
					},
					{ text : tinymce.translate('menu_edit'),
						id : 'menu-abbreviation-edit',
						onclick : function() {
							ed.execCommand('mceEditAbbr');
						}
					},
					{ text : tinymce.translate('menu_delete'),
						id : 'menu-abbreviation-delete',
						onclick : function() {
							WCEUtils.wceDelNode(ed);
						}
					}],
					onshow : function(a) {
						var items = a.control.items();
						var w = ed.WCE_VAR;
						if (w.type == 'abbr') {
							items[0].disabled(true);
							items[1].disabled(false);
							items[2].disabled(false);
						} else {
							items[0].disabled(false);
							items[1].disabled(true);
							items[2].disabled(true);
						}
					}
				},
				{ text : tinymce.translate('menu_expansion') + ' (Ctrl+Alt+E)',
					id : 'menu-abbreviation-expansion',
					menu : [
					{ text : tinymce.translate('menu_add'),
						id : 'menu-abbreviation-expansion-add',
						onclick : function() {
							ed.execCommand('mceAddExp');
						}
					},
					{ text : tinymce.translate('menu_edit'),
						id : 'menu-abbreviation-expansion-edit',
						onclick : function() {
							ed.execCommand('mceEditExp');
						}
					},
					{ text : tinymce.translate('menu_delete'),
						id : 'menu-abbreviation-expansion-delete',
						onclick : function() {
							WCEUtils.wceDelNode(ed);
						}
					}],
					onshow : function(a) {
						var items = a.control.items();
						var w = ed.WCE_VAR;
						if (w.type == 'part_abbr') {
							items[0].disabled(true);
							items[1].disabled(false);
							items[2].disabled(false);
						} else {
							items[0].disabled(false);
							items[1].disabled(true);
							items[2].disabled(true);
						}
					}
				}]
			});

			ed.addButton('paratext', {
				title : tinymce.translate('menu_marginalia') + ' (Ctrl+Alt+M)',
				image : url + '/img/button_M.png',
				icons : false,
				type  : 'menubutton',
				onPostRender : function() { ed.WCE_CON.buttons[this.settings.icon] = this; },
				onshow: function(a) {
					var items = a.control.items();
					var w = ed.WCE_VAR;
					if (w.type == 'paratext') {
						items[0].disabled(true);
						items[1].disabled(false);
						items[2].disabled(false);
					} else {
						items[0].disabled(false);
						items[1].disabled(true);
						items[2].disabled(true);
					}
				},
				menu : [
				{ text : tinymce.translate('menu_add'),
					id : 'menu-paratext-add',
					onclick : function() {
						ed.execCommand('mceAddParatext');
					}
				},
				{ text : tinymce.translate('menu_edit'),
					id : 'menu-paratext-edit',
					onclick : function() {
						ed.execCommand('mceEditParatext');
					}
				},
				{ text : tinymce.translate('menu_delete'),
					id : 'menu-paratext-delete',
					onclick : function() {
						WCEUtils.wceDelNode(ed);
					}
				}]
			});

			ed.addButton('note', {
				title : tinymce.translate('menu_note') + ' (Ctrl+Alt+N)',
				image : url + '/img/button_N.png',
				icons : false,
				type  : 'menubutton',
				onPostRender : function() { ed.WCE_CON.buttons[this.settings.icon] = this; },
				onshow: function(a) {
					var items = a.control.items();
					var w = ed.WCE_VAR;
					if (w.type == 'note') {
						items[0].disabled(true);
						items[1].disabled(false);
						items[2].disabled(false);
					} else {
						items[0].disabled(false);
						items[1].disabled(true);
						items[2].disabled(true);
					}
				},
				menu : [
				{ text : tinymce.translate('menu_add'),
					id : 'menu-note-add',
					onclick : function() {
						ed.execCommand('mceAddNote');
					}
				},
				{ text : tinymce.translate('menu_edit'),
					id : 'menu-note-edit',
					onclick : function() {
						ed.execCommand('mceEditNote');
					}
				},
				{ text : tinymce.translate('menu_delete'),
					id : 'menu-note-delete',
					onclick : function() {
						WCEUtils.wceDelNode(ed);
					}
				}]
			});

			ed.addButton('punctuation', {
				title : tinymce.translate('menu_punctuation'),
				image : url + '/img/button_P.png',
				icons : false,
				type  : 'menubutton',
				onPostRender : function() { ed.WCE_CON.buttons[this.settings.icon] = this; },
				menu : [
				{ text : tinymce.translate('menu_punctuation_add'),
					menu : [
					{ text : ': (colon)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', ':');
						}
					},
					{ text : ', (comma)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', ',');
						}
					},
					{ text : '. (full stop)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '.');
						}
					},
					// \u00B7
					{ text : '\u0387 (Greek Ano Teleia)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u0387');
						}
					},
					// \u003B
					{ text : '\u037E (Greek question mark)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u037E');
						}
					},
					{ text : '\u02D9 (high dot)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u02D9');
						}
					},
					{ text : '\u0387 (middle dot)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u0387');
						}
					},
					{ text : '\u02BC (modifier letter apostrophe)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u02BC');
						}
					},
					{ text : '? (question mark)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '?');
						}
					},
					{ text : '; (semicolon)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '&semicolon;');
						}
					},
					{ text : '\u203B	(cross with dots)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u203B');
						}
					},
					{ text : '\u003E (diple)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u003E');
						}
					},
					{ text : '\u2020	(obelus)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u2020');
						}
					},
					{ text : '\u00B6	(paragraphus)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u00B6');
						}
					},
					{ text : '\u03A1\u0336    (staurogram)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u03A1\u0336');
						}
					},
					{ text : '\u030B    (combining double acute accent)',
						onclick : function() {
							ed.execCommand('mceAdd_pc', '\u030B');
						}
					}
					],
				},
				{ text : tinymce.translate('menu_blank_spaces') + ' (Ctrl+Alt+S)',
					id : 'menu-punctuation-blankspaces',
					menu : [
					{ text : tinymce.translate('menu_add'),
						id : 'menu-punctuation-blankspaces-add',
						icons : false,
						onclick : function() {
							ed.execCommand('mceAddSpaces');
						}
					},
					{ text : tinymce.translate('menu_edit'),
						id : 'menu-punctuation-blankspaces-edit',
						onclick : function() {
							ed.execCommand('mceEditSpaces');
						}
					},
					{ text : tinymce.translate('menu_delete'),
						id : 'menu-punctuation-blankspaces-delete',
						onclick : function() {
							WCEUtils.wceDelNode(ed);
						}
					}],
					onshow : function(a) {
						var items = a.control.items();
						var w = ed.WCE_VAR;
						if (w.type == 'spaces') {
							items[0].disabled(true);
							items[1].disabled(false);
							items[2].disabled(false);
						} else {
							items[0].disabled(false);
							items[1].disabled(true);
							items[2].disabled(true);
						}
					}
				}]
			});



			ed.on('init', function() {
				WCEUtils.initWCEConstants(ed);
				WCEUtils.initWCEVariable(ed);
				WCEUtils.setBreakCounterByContent(ed);

				//disable drag/drop
				ed.dom.bind(ed.getBody(), 'dragend dragover draggesture dragdrop drop drag', function(e) {
					e.preventDefault();
					e.stopPropagation();
					return false;
				});

				ed.on('SetContent', function(e) {
					//run it only at first time of ed.setContent(...)
					if (!ed.isCounterInited) {
						ed.isCounterInited = WCEUtils.setBreakCounterByContent(ed, e.content);
					}
				});

				// TODO: there is no onSetContent for a selection in 4.x.  Check if this does what it should
				ed.on('BeforeSetContent', function(e) {
					if (e.selection) {
						var v = ed.WCE_VAR;
						if (v.isc) {
							return;
						}
						//if select an element tinyMCE insertContent replace only innerHTML of the element and tag remain.
						//Fixed: tag muss be remove.
						if (v.isCaretAtFormatStart && !v.isCaretAtFormatEnd) {
							$(v.selectedStartNode).remove();
						} else if (!v.isCaretAtFormatStart && v.isCaretAtFormatEnd) {
							$(v.selectedEndNode).remove();
						}
					}
				});

				//
				ed.teiIndexData = {
					'bookNumber' : '00',
					'witValue' : '0',
					'manuscriptLang' : ''
				};
				var wcevar = ed.WCE_VAR;

				// TODO: check. was undoManager.onAdd.add(function(um, level) {
				ed.on('BeforeAddUndo', function(e) {
					if (ed.WCE_VAR.stopUndo) {
						var i;
						for (var p in ed.undoManager.data) {
							i = p;
						}
						ed.WCE_VAR.stopUndo = false;

						// um.data[i] = null; //because Error in IE
						ed.undoManager.data[i] = ed.undoManager.data[i - 1];
					}
				});

				// Add shortcuts for wce
				ed.addShortcut('ctrl+alt+b', 'Add break', 'mceAddBreak_Shortcut');
				ed.addShortcut('ctrl+alt+c', 'Add correction', 'mceAddCorrection_Shortcut');
				ed.addShortcut('ctrl+alt+u', 'Add unclear text', 'mceAddUnclearText_Shortcut');
				ed.addShortcut('ctrl+alt+g', 'Add gap', 'mceAddGap_Shortcut');
				ed.addShortcut('ctrl+alt+a', 'Add abbreviation', 'mceAddAbbr_Shortcut');
				ed.addShortcut('ctrl+alt+e', 'Add expansion', 'mceAddExp_Shortcut');
				ed.addShortcut('ctrl+alt+m', 'Add marginalia', 'mceAddParatext_Shortcut');
				ed.addShortcut('ctrl+alt+s', 'Add blank spaces', 'mceAddSpaces_Shortcut');
				ed.addShortcut('ctrl+alt+n', 'Add note', 'mceAddNote_Shortcut');
				ed.addShortcut('ctrl+alt+v', 'Modify verses', 'mceVerseModify_Shortcut');
			
//				$(ed.getDoc()).on('hover', function (evt) {
				ed.on('mousemove', function (evt) {
					WCEUtils.showWceInfo(ed, evt)
				});
			});


			// Add breaks
			ed.addCommand('mceAddBreak', function() {
				var wCon = ed.WCE_CON;
				doWithDialog(ed, url, '/break.htm', 520, 320, 1, true, tinymce.translate('break_title'));
			});
			// Edit breaks
			ed.addCommand('mceEditBreak', function() {
				var wCon = ed.WCE_CON;
				doWithDialog(ed, url, '/break.htm', 520, 320, 1, false, tinymce.translate('break_title'));
			});

			ed.addCommand('mceAddBreak_Shortcut', function() {
				var w = ed.WCE_VAR;
				if (w.not_B) {
					return;
				}
				if (w.type == 'brea') {
					ed.execCommand('mceEditBreak');
				} else {
					ed.execCommand('mceAddBreak');
				}
			});

			// Add corrections
			ed.addCommand('mceAddCorrection', function() {

				var _add_new_wce_node = true;
				var sele_node = ed.selection.getNode();
				var wceNode = WCEPlugin.getWceNode(ed);
				var wceAttr;
				if (wceNode) {
					wceAttr = wceNode.getAttribute('wce');
				}

				// wenn Caret in wce_corr
				if (ed.selection.isCollapsed() && !wceNode) {//make sure, that we are not inside an existing correction
					//Test for possible insertion of "blank first hand" correction
					var sel = WCEUtils.getSEL(ed);
					var rng = sel.getRangeAt(0);
					if (!WCEUtils.canInsertCorrection(ed, rng)) {
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
				doWithDialog(ed, url, '/correction.htm', 1024, 768, 1, _add_new_wce_node, tinymce.translate('reading_title'));
				
			});

			// Edit corrections
			ed.addCommand('mceEditCorrection', function() {
				doWithDialog(ed, url, '/correction.htm', 1024, 768, 1, false, tinymce.translate('reading_title'));
			});

			ed.addCommand('mceAddCorrection_Shortcut', function() {
				ed.execCommand('mceAddCorrection');
			});

			// Add gaps/*********/
			ed.addCommand('mceAddGap', function() {
				doWithDialog(ed, url, '/gap.htm', 900, 320, 1, true, tinymce.translate('gap_title'));
			});
			// Edit gaps and spacing
			ed.addCommand('mceEditGap', function() {
				doWithDialog(ed, url, '/gap.htm', 900, 320, 1, false, tinymce.translate('gap_title'));
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
				// doWithoutDialog(ed, 'unclear'); //option
				// without dialogue for reason
				doWithDialog(ed, url, '/unclear_text.htm', 480, 320, 1, true, tinymce.translate('unclear_text_title'));
			});
			// Edit unclear text
			ed.addCommand('mceEditUnclearText', function() {
				doWithDialog(ed, url, '/unclear_text.htm', 480, 320, 1, false, tinymce.translate('unclear_text_title'));
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

			ed.addCommand('mceAddWitnessend', function() {
				doWithoutDialog(ed, 'witnessend');
			});

			// Add note/*********/
			ed.addCommand('mceAddNote', function() {
				doWithDialog(ed, url, '/note.htm', 640, 380, 1, true, tinymce.translate('note_title'));
			});
			// Edit note
			ed.addCommand('mceEditNote', function() {
				doWithDialog(ed, url, '/note.htm', 640, 380, 1, false, tinymce.translate('note_title'));
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
			
			// Add Ornamentation  other /*********/
			ed.addCommand('mceAdd_ornamentation_other', function() {
				doWithDialog(ed, url, '/ornamentation_other.htm', 480, 320, 1, true, tinymce.translate('title_other_ornamentation'));
			});

			// Add abbreviation/*********/
			ed.addCommand('mceAddAbbr', function() {
				doWithDialog(ed, url, '/abbr.htm', 480, 320, 1, true, tinymce.translate('abbr_title'));
			});
			// Edit abbreviation
			ed.addCommand('mceEditAbbr', function() {
				doWithDialog(ed, url, '/abbr.htm', 480, 320, 1, false, tinymce.translate('abbr_title'));
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
			
			// Add expansion/*********/
			ed.addCommand('mceAddExp', function() {
				doWithDialog(ed, url, '/exp.htm', 480, 320, 1, true, tinymce.translate('exp_title'));
			});
			// Edit abbreviation
			ed.addCommand('mceEditExp', function() {
				doWithDialog(ed, url, '/exp.htm', 480, 320, 1, false, tinymce.translate('exp_title'));
			});

			ed.addCommand('mceAddExp_Shortcut', function() {
				var w = ed.WCE_VAR;
				if (w.not_A) {
					return;
				}
				if (w.type == 'part_abbr') {
					ed.execCommand('mceEditExp');
				} else {
					ed.execCommand('mceAddExp');
				}
			});

			// Add Spaces/*********/
			ed.addCommand('mceAddSpaces', function() {
				doWithDialog(ed, url, '/spaces.htm', 480, 320, 1, true, tinymce.translate('spaces_title'));
			});

			// Edit Spaces/*********/
			ed.addCommand('mceEditSpaces', function() {
				doWithDialog(ed, url, '/spaces.htm', 480, 320, 1, false, tinymce.translate('spaces_title'));
			});
			
			ed.addCommand('mceAddSpaces_Shortcut', function() {
				var w = ed.WCE_VAR;
				if (w.not_S) {
					return;
				}

				if (w.type == 'spaces') {
					ed.execCommand('mceEditSpaces');
				} else {
					ed.execCommand('mceAddSpaces');
				}
			});
			
			// Add paratext/*********/
			ed.addCommand('mceAddParatext', function() {
				doWithDialog(ed, url, '/paratext.htm', 950, 480, 1, true, tinymce.translate('paratext_title'));
			});
			// Edit paratext
			ed.addCommand('mceEditParatext', function() {
				doWithDialog(ed, url, '/paratext.htm', 950, 480, 1, false, tinymce.translate('paratext_title'));
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
				doWithoutDialog(ed, 'abbr', c);
			});

			ed.addCommand('mceAdd_brea', function(c, number, _id) {
				var v = ed.WCE_VAR;
				if (number) {
					WCEUtils.updateBreakCounter(ed, c, number);
				}
				ed.insertContent(WCEUtils.getBreakHtml(ed, c));
			});

			ed.addCommand('mceAdd_pc', function(c) {
				doWithoutDialog(ed, 'pc', c);
			});

			ed.addCommand('mceAddCapitals', function() {
				doWithDialog(ed, url, '/capitals.htm', 480, 320, 1, true), tinymce.translate('capitals_title');
			});

			ed.addCommand('mceEditCapitals', function() {
				doWithDialog(ed, url, '/capitals.htm', 480, 320, 1, false, tinymce.translate('capitals_title'));
			});

			ed.addCommand('mceAdd_formatting', function(c) {
				doWithoutDialog(ed, 'formatting_' + c, '');
			});

			// verse modify
			ed.addCommand('mceVerseModify', function() {
				doWithDialog(ed, url, '/verse.htm', 480, 1024, 1, true, tinymce.translate('verses_title'));
			});

			ed.addCommand('mceVerseModify_Shortcut', function() {
				ed.execCommand('mceVerseModify');
			});

			ed.addCommand('printData', function() {// Problem in IE
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

				ed.execCommand('mceInsertContent', false, '<span class="marker">\ufeff</span>');
				// set a marker for the start

				ed.selection.select(ed.getBody(), true);
				// select complete text

				// save oldcontent as it is ...
				oldcontent = ed.selection.getContent();
				// ... and put the unchanged part into the output variable
				newcontent = oldcontent.substring(0, oldcontent.search('<span class="marker">'));
				// get start of overall content to be used unchanged.

				tinymce.activeEditor.selection.collapse(false);
				// collapse to end of selection
				ed.execCommand('mceInsertContent', false, '<span class="marker">\ufeff</span>');
				// set a marker for the end

				var rng = WCEUtils.getRNG(ed);
				var rng2 = rng.cloneRange();

				// set start of range to begin at the marker
				rng2.setStartAfter($(ed.getBody()).find('span.marker').get(0));
				// start selection at marker
				rng2.setEndBefore($(ed.getBody()).find('span.marker').get(1));
				// end selection at the end of the text, TODO: limit to region affected, i.e. till the next higher-level break
				WCEUtils.setRNG(ed, rng2);

				oldcontent = ed.selection.getContent();
				// get content to be modified

				$(ed.getBody()).find('span.marker').remove();
				// delete marker

				WCEUtils.setRNG(ed, rng);

				var pos = oldcontent.search(searchString);

				while (pos > -1) {
					pos += searchString.length// add length of searchString to found pos
					newcontent += oldcontent.substring(0, pos);
					endNumber = oldcontent.indexOf("&", pos + 1);
					// look for next "&" after searchString
					oldnumber = oldcontent.substring(pos, endNumber);
					newcontent += parseInt(oldnumber) + 1;
					oldcontent = oldcontent.substring(endNumber);
					// work on String starting right after number with "&"
					pos = oldcontent.search(searchString);
				}
				newcontent += oldcontent// add the rest
				// TODO: adjust corresponding counter, if no higher-level break follows

				ed.setContent(newcontent);
			});
		},
		// Get selected span node
		getWceNode : function(ed) {
			var sn = ed.WCE_VAR.selectedNode;
			if (!sn || sn.nodeType == 3) {
				return null;
			}
			if ($(sn).hasClass('format_start') || $(sn).hasClass('format_end')) {
				return sn.parentNode;
			}
			if ($(sn).hasClass('commentary') || $(sn).hasClass('ews') || $(sn).hasClass('lectionary-other')) {
				return sn.parentNode;
			}

			var wceAttr = sn.getAttribute('wce');
			if (wceAttr && wceAttr.indexOf('__t') == 0) {
				return sn;
			}
			return null;
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
	}
	//Use WCEPlugin for tinymce
	tinymce.create('tinymce.plugins.wceplugin', WCEPlugin);
	// Register plugin
	tinymce.PluginManager.add('wce', tinymce.plugins.wceplugin);

})();

