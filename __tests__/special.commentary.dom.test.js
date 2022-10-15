/**
 * @jest-environment jsdom
 */

 window.$ = require('../wce-ote/jquery');
 const wce_tei = require('../wce-ote/wce_tei');
 const tinymce_settings = require('../wce-ote/wce_editor');
 let clientOptions = {'getBookNameFromBKV': tinymce_settings.getBookNameFromBKV};
 
 
 // store the top and tail of the js so the tests can reuse and only focus on the content of the <body> tag
 const xmlHead = '<?xml  version="1.0" encoding="utf-8"?><!DOCTYPE TEI [<!ENTITY om ""><!ENTITY lac ""><!ENTITY lacorom "">]>' +
                                 '<?xml-model href="TEI-NTMSS.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>' +
                                 '<TEI xmlns="http://www.tei-c.org/ns/1.0">' +
                                 '<teiHeader><fileDesc><titleStmt><title/></titleStmt>' +
                                 '<publicationStmt><publisher/></publicationStmt>' +
                                 '<sourceDesc><msDesc><msIdentifier></msIdentifier></msDesc></sourceDesc>' +
                                 '</fileDesc></teiHeader><text><body>';
 const xmlTail = '</body></text></TEI>';

 const commentary = new Map([
    // commentary
    // This tests the paratext function but there is also code relating to commentary left in note function
    // which probably needs to be removed as I can't see any way it would be used in the interface. [issue #18]
    // [ '1 line of commentary text note',
    //   [ '<w>some</w><w>commentary</w><lb/><note type="commentary">One line of untranscribed commentary text</note>' +
    //     '<lb n="PCL-undefined"/><w>in</w><w>here</w>',
    //     'some commentary <span class="paratext" wce="__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=1&amp;' +
    //     'text=&amp;number=&amp;edit_number=on&amp;paratext_position=pagetop&amp;paratext_position_other=&amp;' +
    //     'paratext_alignment=left"><span class="format_start mceNonEditable">‹</span><br/>↵[' +
    //     '<span class="commentary" wce="__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=1">comm</span>]' +
    //     '<span class="format_end mceNonEditable">›</span></span>' +
    //     '<span class="mceNonEditable brea" wce="__t=brea&amp;__n=&amp;break_type=lb&amp;number=&amp;' +
    //     'lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no">' +
    //     '<span class="format_start mceNonEditable">‹</span><br/>↵ <span class="format_end mceNonEditable">›</span>' +
    //     '</span> in here '
    //   ]
    // ],
    // the next three tests all trigger the code in the TEI2HTML_note function but the HTML2TEI_paratext function
    [ 'commentary in middle of line',
      [ '<lb n="PCL-undefined"/><w>in</w><w>line</w><w>commentary</w><note type="commentary">Untranscribed commentary text within the line</note><w>here</w><lb n="PCL-undefined"/>',
        '<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\"><span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span></span> in line commentary<span class=\"paratext\" wce=\"__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=0&amp;text=&amp;number=&amp;edit_number=on&amp;paratext_position=pagetop&amp;paratext_position_other=&amp;paratext_alignment=left\"><span class=\"format_start mceNonEditable\">‹</span>[<span class=\"commentary\" wce=\"__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=0\">comm</span>]<span class=\"format_end mceNonEditable\">›</span></span> here <span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\"><span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span></span>'
      ]
    ],
    [ 'commentary at end of line',
      [ '<lb n="PCL-undefined"/><w>in</w><w>line</w><w>commentary</w><note type="commentary">Untranscribed commentary text within the line</note><lb n="PCL-undefined"/>',
        '<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\"><span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span></span> in line commentary<span class=\"paratext\" wce=\"__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=0&amp;text=&amp;number=&amp;edit_number=on&amp;paratext_position=pagetop&amp;paratext_position_other=&amp;paratext_alignment=left\"><span class=\"format_start mceNonEditable\">‹</span>[<span class=\"commentary\" wce=\"__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=0\">comm</span>]<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\"><span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span></span>'
      ]
    ],
    [ 'commentary at start of line',
      [ '<lb n="PCL-undefined"/><note type="commentary">Untranscribed commentary text within the line</note><w>in</w><w>line</w><w>commentary</w><lb n="PCL-undefined"/>',
        '<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\"><span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span></span><span class=\"paratext\" wce=\"__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=0&amp;text=&amp;number=&amp;edit_number=on&amp;paratext_position=pagetop&amp;paratext_position_other=&amp;paratext_alignment=left\"><span class=\"format_start mceNonEditable\">‹</span>[<span class=\"commentary\" wce=\"__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=0\">comm</span>]<span class=\"format_end mceNonEditable\">›</span></span> in line commentary <span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\"><span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span></span>'
      ]
    ],
    // [ 'commentary in line',
    //   [ '<w>in</w><w>line</w><w>commentary</w><note type="commentary">Untranscribed commentary text within the line</note>',
    //     'in line commentary<span class="paratext" wce="__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=0&amp;' +
    //     'text=&amp;number=&amp;edit_number=on&amp;paratext_position=pagetop&amp;paratext_position_other=&amp;' +
    //     'paratext_alignment=left"><span class="format_start mceNonEditable">‹</span>[' +
    //     '<span class="commentary" wce="__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=0">comm</span>]' +
    //     '<span class="format_end mceNonEditable">›</span></span>'
    //   ]
    // ]
  ]);
  
  

  
  const testDataMaps = [commentary];
  
  for (let i=0; i<testDataMaps.length; i+=1) {
      testDataMaps[i].forEach((value, key, map) => {
          test('TEI2HTML: ' + key, () => {
              let testInput, expectedOutput, html;
              testInput = xmlHead + value[0] + xmlTail;
              expectedOutput = '<TEMP>' + value[1] + '</TEMP>';
              html = wce_tei.getHtmlByTei(testInput, clientOptions);
              expect(html.htmlString).toBe(expectedOutput);
          });
        test('HTML2TEI: ' + key, () => {
              let testInput, expectedOutput, xml;
              testInput = value[1];
              expectedOutput = xmlHead + value[0] + xmlTail;
              xml = wce_tei.getTeiByHtml(testInput, {});
              expect(xml).toBe(expectedOutput);
          });
      });
  }