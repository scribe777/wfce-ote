/**
 * editor_plugin_src.js
 *
 * Copyright 2009, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 * Contributing: http://tinymce.moxiecode.com/contributing
 */

(function() {
	// Load plugin specific language pack
	tinymce.PluginManager.requireLangPack('wce'); 
	tinymce.create('tinymce.plugins.wcePlugin', {  
		
		htmlTagsFilter: function(str){
				str=str.replace(/</,'&lt;');
				str=str.replace(/>/,'&gt;');
				str=str.replace(/"/,'&quot;'); 
				return str;
			},
		
		propertyDisplay: function (elem,title){
			title=typeof(title)=='undefined'?'':title;
				
			var s='';
			for(var p in elem){
				s+='<span style="color:red">'+p+'</span>:'+elem[p]+'<br />';
			}
			$('#prop_info').remove();
			
			$(document.body).append('<div style="overflow:auto; width:500px; height:300px; background-color:#fff;margin-top:10px; position:absolute; top:10px; right:10px" id="prop_info">'+title+':<br />'+s+'</div>'); 
		}, 
		
		wceAdd: function(ed,url,htm,w,h,inline,is_add) {
			ed.windowManager.open({
				file : url + htm,
                width : w + ed.getLang('example.delta_width', 0),
                height : h + ed.getLang('example.delta_height', 0),
                inline : inline
                }, {
                   plugin_url : url, // Plugin absolute URL
                   span_id : span_id, // param
				   span_arr: span_arr,  // param 
				   is_add: is_add
			})
		 },
		 
		getCommParent: function(endNode){ 
			var parentNode;
			while(endNode.nodeName.match(/text/i)){
				endNode=endNode.parentNode;
			} 
			
			if(endNode.nodeName.match(/body/i))
				parentNode= endNode;
			else	
				parentNode=endNode.parentNode;
		
			
			var nodeList=parentNode.childNodes;
			var preChildren;
			for(var i=0; i<nodeList.length; i++){
				if(nodeList[i]==endNode) break;
				preChildren=nodeList[i];
			}
			return preChildren;			
		},
		
		/**
		 * Initializes the plugin, 
		 *
		 * @param {tinymce.Editor} ed Editor instance that the plugin is initialized in.
		 * @param {string} url Absolute URL to where the plugin is located.
		 */
		 init : function(ed, url) {  
		 
			var htmlTagsFilter=this.htmlTagsFilter;	
			var propertyDisplay=this.propertyDisplay;
			var spaceBeforeNextSibling=this.spaceBeforeNextSibling;
			var wceAdd=this.wceAdd;
			var getCommParent=this.getCommParent;
		
			// * button for removeFormat
			ed.addCommand('wce_test', function() { 
				
				 if(ed.execCommand('wceContentHasVerse')!=1) 
					ed.execCommand("removeFormat");   
				 else
					alert("Error: select hat verse number");
			}); 			
			ed.addButton('wce_test', {
				title : 'test',
				cmd : 'wce_test',
				image : url + '/img/stern.gif' 

			}); 
			
			// Ueberpruefen, ob ausgewaehlter Text verse nummer hat
			ed.addCommand("wceContentHasVerse", function(){ 
				 var _se = ed.selection;
				 
				//Auswahl hat verse
				if(_se.getContent().match(/<span\s*class=\"verse_number"\s*>/))
					return 1; 
				 
				 //Auswahl in verse
				if($(_se.getNode()).attr('class')=='verse_number' ) 
					return 1;
				
				return 0;
				 
			}); 
 			
			 
			// ausgewaehlter Text automatisch filtern,
			// ergibt nur ein gueltiger Auswahlbereich		    
			ed.addCommand('wceSelectFilter', function(){ 
				
				if(!$('#automatic_select').attr('checked')) return;
				
				var rng=ed.selection.getRng(true); //Forces a compatible W3C range on IE.   				 

				var startNode=rng.startContainer;
				var startText=startNode.data?startNode.data:startNode.innerText; //wegen bug bei IE
				
				var endNode=rng.endContainer;
				var endText=endNode.data?endNode.data:endNode.innerText;  
			
				
				//Leerzeichen &nbsp;
				var nbsp='\xa0';
				
				var newStartOffset=rng.startOffset;
				var newEndOffset=rng.endOffset;	 
				
				var ch;		
					
				//Anfangspunkt der Auswahl
				for(var i=newStartOffset; i<startText.length;i++){	
					ch=startText.charAt(i);
					
					//wenn keine leerzeichen
					if(ch!=' ' && ch!=nbsp){						
						if(i>0 && (startText.charAt(i-1)==' ' || startText.charAt(i-1)==nbsp))
							break;
						else if(i==0){
							break;
						}
						
					}					
					newStartOffset++;
				}		
				 
			  //Endespunkt der Auswahl
			 	for(var i=newEndOffset; i>-1;i--){
					//ende des Textes
					if(i==endText.length && i>0 && endText.charAt(i-1)!=' ' && endText.charAt(i-1)!=nbsp)
						break;
						
					ch=endText.charAt(i);
					
					if(ch==' ' || ch==nbsp){						
						if(i>0 && (endText.charAt(i-1)!=' ' && endText.charAt(i-1)!=nbsp))
							break;
					}
					newEndOffset--; 
				}
			
		 	 		 
				//wenn Auswahl in der Mitte einer Wort
				if(startNode==endNode && newStartOffset>newEndOffset){			
					newStartOffset=newEndOffset=rng.startOffset;
				}				
				
				ed.selection.setRng(rng); 
				
				if(startNode.nodeName.match(/body/i)){
					startNode=rng.startContainer.childNodes[rng.startOffset];
					newStartOffset=1;
					newEndOffset=newEndOffset<0?0:newEndOffset			
				 
					/* endNode=startNode; 
					 newStartOffset=rng.startOffset; newEndOffset=newStartOffset;*/
				}
				
				/*
				if(newEndOffset<=0){
					endNode=getCommParent(endNode);
					
					var _endText=endNode.data?endNode.data:endNode.innerText;   
					if(typeof(_endText)!='undefined' && _endText!='')
						endText=_endText;
					
					newEndOffset=endText.length;
				}
				*/
				
				//Auswahl neu definieren
				rng.setStart(startNode,newStartOffset);
				rng.setEnd(endNode,newEndOffset); 				 
				ed.selection.setRng(rng); 
				
			});
			
			
			//
			ed.onInit.add(function() {  
				tinymce.dom.Event.add(ed.getDoc(), 'dblclick', function(e) {  
						ed.execCommand('wceSelectFilter',false);
				}); 
			 
				tinymce.dom.Event.add(ed.getDoc(), 'mouseup',function(e){ 
					
						var elem=$('#wce_editor_removeformat'); 
						
						 if(ed.execCommand('wceContentHasVerse')==1 || ed.selection.isCollapsed()) {
							elem.addClass('mceButtonDisabled');
							elem.removeClass('mceButtonEnabled'); 
						}else{
							elem.addClass('mceButtonEnabled');
							elem.removeClass('mceButtonDisabled'); 
						}  /**/
						
						if(!ed.selection.isCollapsed())
							ed.execCommand('wceSelectFilter',false);
				});
				
				tinymce.dom.Event.add(ed.getDoc(), 'keyup', function(e){ 
					if($('#tool_span').html()=='') return;
					
					var elem=$('#wce_editor_save');
					elem.addClass('mceButtonEnabled');
					elem.removeClass('mceButtonDisabled');
					wceIsDirty=true;				
				});
				 
				//mousemove event 
				tinymce.dom.Event.add(ed.getDoc(), 'mousemove', function(e) {  
					var sele_node=e.target;
					var wceClassName=sele_node.className;  
					
					// Information-box
					var info_box_id='info_box'; 
					var info_box = document.getElementById(info_box_id);
						
					//nur fuer note und corrector
					if(wceClassName!='' && (wceClassName.match(/wce_note.*/g) || wceClassName.match(/wce_corr.*/g) )){
						//info text
						//var spid=$(e.target).attr('id').replace(/\D*/,'');
						var spid=wceClassName.replace(/\D*/gi,''); 
						var info_text='';
						var arr=span_arr[spid];
						
						for(var p in arr){
							info_text+=p+': '+arr[p]+'<br />';
						}	
						
						var typeName=wceClassName.replace(/_\d*$/gi,'');
						switch(typeName){
							case 'wce_note': info_text=arr['note_text'];
							break;
							/*
							case 'wce_brea':
							break;
							
							case 'wce_numb':
							break;
							
							case 'wce_gap':
							break;
							*/
							
							case 'wce_corr': 
							info_text='*: '+$(sele_node).html();
							
							if(arr['corrector_text']!='')
								info_text+='<div style="margin-top:10px">'+arr['corrector_name'].toLowerCase()+': '+arr['corrector_text']+'</div>';
							if(arr['editorial_note']!='')
								info_text+='<div style="margin-top:10px">note: '+arr['editorial_note']+'</div>';
							break;
						
						 }
						
					 
						 if(info_box==null){
							info_box=document.createElement("div");
							info_box.id=info_box_id;  
							document.body.appendChild(info_box); 
							$(info_box).css({
								'height':'auto',
								'font-size':'12px',
								'white-space':'normal',
								'background-color':'#eeeeee',
								'padding':'10px',						
								'width':'auto',
								'position':'absolute',
								'z-index':'10',
								'border':'1px solid #ff0000'
							});
							  
						}
						 
						info_box.innerHTML=info_text; 
						$(info_box).css({'top':e.clientY+80,'left':e.clientX+80}); 
						$(info_box).show();  
						 
					}
					else{  
						$('#'+info_box_id).hide(); 
					} 
				
				}); 
			});

			
			//Get selected span node
			ed.addCommand('getWceSpan',function (){
			
				var sele_node=ed.selection.getNode();				
				if($(sele_node).attr('class').match(/wce_.*/)){
					return sele_node; 
				}
				return null;
			});
			
			//Create new span id for span_arr
			ed.addCommand('createNewSpanId',function(){
				span_id++;
			});
			 			
			//Insert-button bestaetigen
			ed.addCommand('mceAddInfoToLemma', function() {
			
				// array for insert
				var arr = [];

				// form tag of tinyMCEPopup
				var f = arguments[1];
				var itemName;
				var curr_span_id;
				
				$(f).find(':input').each(function(i, p) {
					if ($(this).attr('type') == 'button')
						return;
						
					itemName = $(this).attr('name');

					if (itemName == 'curr_span_id')
						curr_span_id = $(this).val();
					else {
						if($(this).attr('type')=='radio'){
							if($(this).attr('checked')==true)
								arr[itemName] = $(this).val();
						}
						else
							arr[itemName] = $(this).val();
					}					
				});
				
				span_arr[curr_span_id] = arr;
				
				//wce is dirty
				wceIsDirty=true;
				var elem=$('#wce_editor_save');
				elem.addClass('mceButtonEnabled');
				elem.removeClass('mceButtonDisabled');
			});
			 
			
			//Add breaks
			ed.addCommand('mceAddBreak',function(){
				wceAdd(ed,url,'/break.htm',480,320,1,true);
			}); 
			
			//Add corrections
			ed.addCommand('mceAddCorrection', function() {
				wceAdd(ed,url,'/correction.htm',480,320,1,true);
            });	

			//Add gaps and spacing
			ed.addCommand('mceAddGap', function() {
				wceAdd(ed,url,'/gap.htm',480,320,1,true);
            });		
			
			//Add note
			ed.addCommand('mceAddNote', function() {
				wceAdd(ed,url,'/note.htm',480,380,1,true);
            });	

			//Add number
			ed.addCommand('mceAddNumber', function() {
				wceAdd(ed,url,'/number.htm',480,320,1,true);               
            });	
			
			//Edit breaks
			ed.addCommand('mceEditBreak',function(){
				wceAdd(ed,url,'/break.htm',480,320,1,false);
			});			
			
			//Edit corrections
			ed.addCommand('mceEditCorrection', function() {
				wceAdd(ed,url,'/correction.htm',480,320,1,false);
            });
					
			//Edit gaps and spacing
			ed.addCommand('mceEditGap', function() {
				wceAdd(ed,url,'/gap.htm',480,320,1,false);
            });

			//Edit note
			ed.addCommand('mceEditNote', function() {
				wceAdd(ed,url,'/note.htm',480,380,1,false);
            });
			
			//Edit number
			ed.addCommand('mceEditNumber', function() {
				wceAdd(ed,url,'/number.htm',480,320,1,false);               
            });
		}, 
		 
		/**
		 * Returns information about the plugin as a name/value array.
		 * The current keys are longname, author, authorurl, infourl and version.
		 *
		 * @return {Object} Name/value array containing information about the plugin.
		 */
		getInfo : function() {
			return {
				longname : 'WCE plugin',
				author : 'WCE',
				authorurl : 'http://wce',
				infourl : 'http://wce',
				version : "1.0"
			};
		}
	});

	// Register plugin
	tinymce.PluginManager.add('wce', tinymce.plugins.wcePlugin);
})();