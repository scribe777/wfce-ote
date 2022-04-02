/**
 * @jest-environment jsdom
 */

window.$ = require('../wce-ote/jquery');
const wce_tei = require('../wce-ote/wce_tei');


// store the top and tail of the js so the tests can reuse and only focus on the content of the <body> tag
const xmlHead = '<?xml  version="1.0" encoding="utf-8"?><!DOCTYPE TEI [<!ENTITY om ""><!ENTITY lac ""><!ENTITY lacorom "">]>' +
								'<?xml-model href="TEI-NTMSS.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>' +
								'<TEI xmlns="http://www.tei-c.org/ns/1.0">' +
								'<teiHeader><fileDesc><titleStmt><title/></titleStmt>' +
								'<publicationStmt><publisher/></publicationStmt>' +
								'<sourceDesc><msDesc><msIdentifier></msIdentifier></msDesc></sourceDesc>' +
								'</fileDesc></teiHeader><text><body>';
const xmlTail = '</body></text></TEI>';

// TEI to HTML tests and the reverse
const teiToHtmlAndBack = new Map([
  // w
	[ '<w> tag',
	  [ '<w>word</w>',
	 		'word ' //space at end is important
 		],
	],
  // ex
  [ 'part word <ex> tag',
	  [ '<w>wo<ex>rd</ex></w>',
	 		'wo<span class="part_abbr" wce="__t=part_abbr&amp;__n=&amp;exp_rend=&amp;exp_rend_other=">' +
      '<span class="format_start mceNonEditable">‹</span>(rd)<span class="format_end mceNonEditable">›</span>' +
      '</span> ' //space at end is important
 		],
	],
  [ 'whole word <ex> tag',
	  [ '<w><ex rend="÷">word</ex></w>',
	 		'<span class="part_abbr" wce="__t=part_abbr&amp;__n=&amp;exp_rend_other=&amp;exp_rend=%C3%B7">' +
      '<span class="format_start mceNonEditable">‹</span>(word)<span class="format_end mceNonEditable">›</span>' +
      '</span> ' //space at end is important
 		],
	],
  // OTE-TODO: Add here a test for whole word <ex> and see if you can make that work correctly in input

  // unclear
  [ 'part word <unclear> tag with no reason',
	  [ '<w>wor<unclear>d</unclear></w>',
	 		'wor<span class="unclear" wce_orig="d" wce="__t=unclear&amp;__n=&amp;unclear_text_reason=&amp;unclear_text_reason_other=">' +
      '<span class="format_start mceNonEditable">‹</span>ḍ<span class="format_end mceNonEditable">›</span></span> ' //space at end is important
 		],
	],
  // OTE-TODO: faded ink should have an underscore rather than a space, same for all other reason attributes
  [ 'whole word <unclear> tag with reason',
	  [ '<w><unclear reason="faded ink">word</unclear></w>',
	 		'<span class="unclear" wce_orig="word" wce="__t=unclear&amp;__n=&amp;unclear_text_reason_other=&amp;unclear_text_reason=faded ink">' +
      '<span class="format_start mceNonEditable">‹</span>ẉọṛḍ<span class="format_end mceNonEditable">›</span></span> ' //space at end is important
 		],
	],
  // divs
  // OTE-TODO: these will need to change when references change
  [ 'book div',
	  [ '<div type="book" n="B04"><w>The</w><w>content</w><w>of</w><w>my</w><w>book</w></div>',
	 		' <span class="book_number mceNonEditable" wce="__t=book_number" id="1">4</span> The content of my book ' //spaces at beg and end are important
 		],
	],
  [ 'chapter div', // note that book value is empty until we combine them
	  [ '<div type="chapter" n="BK1"><w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div>',
	 		' <span class="chapter_number mceNonEditable" wce="__t=chapter_number" id="1">1</span> The content of my chapter ' //spaces at beg and end are important
 		],
	],
  [ 'book and chapter div',
	  [ '<div type="book" n="B04"><div type="chapter" n="B04K1"><w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div></div>',
	 		' <span class="book_number mceNonEditable" wce="__t=book_number" id="1">4</span>  ' +
      '<span class="chapter_number mceNonEditable" wce="__t=chapter_number" id="2">1</span> The content of my chapter ' //spaces at beg and end are important
 		],
	],
  [ 'lection div',
	  [ '<div type="lection" n="R12"><w>The</w><w>content</w><w>of</w><w>my</w><w>lection</w></div>',
	 		' <span class="lection_number mceNonEditable" wce="__t=lection_number&amp;number=R12" id="1">Lec</span> The content of my lection ' //spaces at beg and end are important
 		],
	],
  [ 'lection, book and chapter div',
    [ '<div type="lection" n="R12"><div type="book" n="B04"><div type="chapter" n="B04K1">' +
      '<w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div></div></div>',
      ' <span class="lection_number mceNonEditable" wce="__t=lection_number&amp;number=R12" id="1">Lec</span>  ' +
      '<span class="book_number mceNonEditable" wce="__t=book_number" id="2">4</span>  '+
      '<span class="chapter_number mceNonEditable" wce="__t=chapter_number" id="3">1</span> The content of my chapter ' //spaces at beg and end are important
    ],
  ],
  [ 'book and inscriptio divs',
    [ '<div type="book" n="B04"><div type="incipit" n="B04incipit"><ab><w>inscriptio</w><w>text</w></ab></div></div>',
      ' <span class="book_number mceNonEditable" wce="__t=book_number" id="1">4</span>  ' +
      '<span class="chapter_number mceNonEditable" wce="__t=chapter_number">Inscriptio</span> ' +
      '<span class="verse_number mceNonEditable" wce="__t=verse_number"/> inscriptio text '
    ]
  ],
  [ 'book and subscriptio div',
    [ '<div type="book" n="B04"><div type="explicit" n="B04explicit"><ab><w>subscriptio</w><w>text</w></ab></div></div>',
      ' <span class="book_number mceNonEditable" wce="__t=book_number" id="1">4</span>  ' +
      '<span class="chapter_number mceNonEditable" wce="__t=chapter_number">Subscriptio</span> ' +
      '<span class="verse_number mceNonEditable" wce="__t=verse_number"/> subscriptio text '
    ]
  ],
  // gaps
  // TODO: add witness end test here
  [ 'gap between words',
    [ '<w>this</w><gap reason="illegible" unit="char" extent="10"/><w>continues</w>',
      'this <span class="gap" wce="__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;' +
      'gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;' +
      'gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit_other=&amp;' +
      'unit=char&amp;extent=10"><span class="format_start mceNonEditable">‹</span>[10]' +
      '<span class="format_end mceNonEditable">›</span></span> continues '
    ]
  ],
  [ 'gap between words no details given',
    [ '<w>this</w><gap/><w>continues</w>',
      'this <span class=\"gap\" wce=\"__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;' +
      'gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;' +
      'gap_reason_dummy_inferredPage=inferredPage&amp;unit_other=&amp;unit=\">' +
      '<span class=\"format_start mceNonEditable\">‹</span>[...]<span class=\"format_end mceNonEditable\">›</span>' +
      '</span> continues '
    ]
  ],
  [ 'gap within word',
    [ '<w>wo<gap reason="illegible" unit="char" extent="2"/></w>',
      'wo<span class="gap" wce="__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=' +
      'illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;' +
      'gap_reason=illegible&amp;unit_other=&amp;unit=char&amp;extent=2">' +
      '<span class="format_start mceNonEditable">‹</span>[2]<span class="format_end mceNonEditable">›</span></span> '
    ]
  ],
  [ 'gap within word no unit given',
    [ '<w>wo<gap reason="illegible"/></w>',
      'wo<span class=\"gap\" wce=\"__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;' +
      'gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;' +
      'gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit_other=&amp;unit=\">' +
      '<span class=\"format_start mceNonEditable\">‹</span>[...]<span class=\"format_end mceNonEditable\">›</span></span> '
    ]
  ],
  [ 'missing quire',
    [ '<w>missing</w><gap reason="lacuna" unit="quire" extent="1"/><w>quire</w>',
      'missing <span class="gap" wce="__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;' +
      'gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;' +
      'gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=lacuna&amp;unit_other=&amp;unit=quire&amp;extent=1">' +
      '<span class="format_start mceNonEditable">‹</span>QB<br/>[...]<span class="format_end mceNonEditable">›</span>' +
      '</span> quire '
    ]
  ],
  [ 'missing pages',
    [ '<w>missing</w><gap reason="lacuna" unit="page" extent="2"/><w>pages</w>',
      'missing <span class="gap" wce="__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;' +
      'gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;' +
      'gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=lacuna&amp;unit_other=&amp;unit=page&amp;' +
      'extent=2"><span class="format_start mceNonEditable">‹</span><br/>PB<br/>[...]<br/>PB<br/>[...]' +
      '<span class="format_end mceNonEditable">›</span></span> pages '
    ]
  ],
  // TODO: try to lose undefined in XMl here by predefining some of the editor variables like sigla
  [ 'missing line with unspecified reason',
    [ '<w>missing</w><gap reason="unspecified" unit="line" extent="1"/><lb n="PCL-undefined"/><w>line</w>',
      'missing <span class="gap" wce="__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;' +
      'gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;' +
      'gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=unspecified&amp;unit_other=&amp;unit=line&amp;' +
      'extent=1"><span class="format_start mceNonEditable">‹</span><br/>↵[...]' +
      '<span class="format_end mceNonEditable">›</span></span> '+
      '<span class="mceNonEditable brea" wce="__t=brea&amp;__n=&amp;break_type=lb&amp;number=&amp;' +
      'lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no">' +
      '<span class="format_start mceNonEditable">‹</span><br/>↵ ' +
      '<span class="format_end mceNonEditable">›</span></span> line '
    ]
  ],
  //supplied
  [ 'single word supplied with source given',
    [ '<w>a</w><w><supplied source="na28" reason="illegible">supplied</supplied></w><w>word</w>',
      'a <span class="gap" wce_orig="supplied" wce="__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;' +
      'gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;' +
      'gap_reason_dummy_inferredPage=inferredPage&amp;supplied_source_other=&amp;supplied_source=na28&amp;' +
      'gap_reason=illegible&amp;unit_other=&amp;unit=&amp;mark_as_supplied=supplied">' +
      '<span class="format_start mceNonEditable">‹</span>[supplied]<span class="format_end mceNonEditable">›</span>' +
      '</span> word '
    ]
  ],
  [ 'multi-word/part-word supplied with no source given',
    [ '<w>a</w><w><supplied reason="illegible">supplied</supplied></w><w><supplied reason="illegible">wo</supplied>rd</w>',
      'a <span class="gap" wce_orig="supplied%20wo" wce="__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;' +
      'gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;' +
      'gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit_other=&amp;' +
      'unit=&amp;mark_as_supplied=supplied&amp;supplied_source_other=&amp;supplied_source=none">' +
      '<span class="format_start mceNonEditable">‹</span>[supplied wo]' +
      '<span class="format_end mceNonEditable">›</span></span>rd '
    ]
  ],
  // abbr
  [ 'nomen sacrum abbreviation with overline',
    [ '<w>a</w><w><abbr type="nomSac"><hi rend="overline">ns</hi></abbr></w><w>abbreviation</w>',
      'a <span class=\"abbr_add_overline\" wce=\"__t=abbr&amp;__n=&amp;original_abbr_text=&amp;' +
      'add_overline=overline&amp;abbr_type_other=&amp;abbr_type=nomSac\" wce_orig=\"ns\">' +
      '<span class=\"format_start mceNonEditable\">‹</span>ns<span class=\"format_end mceNonEditable\">›</span>' +
      '</span> abbreviation '
    ]
  ],
  [ 'nomen sacrum abbreviation with overline in supplied',
    [ '<w><supplied source="na28" reason="illegible">a</supplied></w><w><supplied source="na28" reason="illegible">' +
      '<abbr type="nomSac"><hi rend="overline">ns</hi></abbr></supplied></w>' +
      '<w><supplied source="na28" reason="illegible">abbreviation</supplied></w>',
      '<span class=\"gap\" wce_orig=\"a%20%3Cspan%20class%3D%22abbr_add_overline%22%20wce%3D%22__t%3Dabbr%26amp%3B__n%3D%26amp%3Boriginal_abbr_text%3D%26amp%3Badd_overline%3Doverline%26amp%3Babbr_type_other%3D%26amp%3Babbr_type%3DnomSac%22%20wce_orig%3D%22ns%22%3E%3Cspan%20class%3D%22format_start%20mceNonEditable%22%3E%E2%80%B9%3C%2Fspan%3Ens%3Cspan%20class%3D%22format_end%20mceNonEditable%22%3E%E2%80%BA%3C%2Fspan%3E%3C%2Fspan%3E%20abbreviation\" wce=\"__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;supplied_source_other=&amp;supplied_source=na28&amp;gap_reason=illegible&amp;unit_other=&amp;unit=&amp;mark_as_supplied=supplied\"><span class=\"format_start mceNonEditable\">‹</span>[a <span class=\"abbr_add_overline\" wce=\"__t=abbr&amp;__n=&amp;original_abbr_text=&amp;add_overline=overline&amp;abbr_type_other=&amp;abbr_type=nomSac\" wce_orig=\"ns\"><span class=\"format_start mceNonEditable\">‹</span>ns<span class=\"format_end mceNonEditable\">›</span></span> abbreviation]<span class=\"format_end mceNonEditable\">›</span></span> '
    ]
  ],





  // pc
  [ 'simple <pc> tag',
	  [ '<pc>.</pc>',
	 		'<span class="pc" wce="__t=pc"><span class="format_start mceNonEditable">‹</span>.' +
      '<span class="format_end mceNonEditable">›</span></span> ' //space at end is important
 		],
	]
]);


teiToHtmlAndBack.forEach((value, key, map) => {
	test('TEI2HTML: ' + key, () => {
		let testInput, expectedOutput, html;
		testInput = xmlHead + value[0] + xmlTail;
		expectedOutput = '<TEMP>' + value[1] + '</TEMP>';
		html = wce_tei.getHtmlByTei(testInput);
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


// OTE-TODO: error handling shouldn't have undefined args printed out in the alert
// Might need to mock window.alert of the error function for this
test('Invalid XML gives error', () => {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  html = wce_tei.getHtmlByTei('<w>broken<w>');
  expect(window.alert).toBeCalledWith('Error:\n XML parser 1:12: unclosed tag: w\nundefined\nundefined');
});
