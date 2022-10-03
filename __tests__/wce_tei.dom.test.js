/**
 * @jest-environment jsdom
 */

window.$ = require('../wce-ote/jquery');
const wce_tei = require('../wce-ote/wce_tei');
const tinymce_settings = require('../wce-ote/wce_editor');
console.log(tinymce_settings)
console.log(tinymce_settings.getBookNameFromBKV('B04K1'))
const clientOptions = {'getBookNameFromBKV': tinymce_settings.getBookNameFromBKV};


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
const basicAnnotation = new Map([
  // w
	[ '<w> tag',
	  [ '<w>word</w>',
	 		'word ' //space at end is important
 		]
	],
  // ex
  [ 'part word <ex> tag',
	  [ '<w>wo<ex>rd</ex></w>',
	 		'wo<span class="part_abbr" wce="__t=part_abbr&amp;__n=&amp;exp_rend=&amp;exp_rend_other=">' +
      '<span class="format_start mceNonEditable">‹</span>(rd)<span class="format_end mceNonEditable">›</span>' +
      '</span> ' //space at end is important
 		]
	],
  [ 'whole word <ex> tag',
	  [ '<w><ex rend="÷">word</ex></w>',
	 		'<span class="part_abbr" wce="__t=part_abbr&amp;__n=&amp;exp_rend_other=&amp;exp_rend=%C3%B7">' +
      '<span class="format_start mceNonEditable">‹</span>(word)<span class="format_end mceNonEditable">›</span>' +
      '</span> ' //space at end is important
 		]
	],

  // Add here a test for whole word <ex> and see if you can make that work correctly in input [issue #16]

  // unclear
  [ 'part word <unclear> tag with no reason',
	  [ '<w>wor<unclear>d</unclear></w>',
	 		'wor<span class="unclear" wce_orig="d" wce="__t=unclear&amp;__n=&amp;unclear_text_reason=&amp;unclear_text_reason_other=">' +
      '<span class="format_start mceNonEditable">‹</span>ḍ<span class="format_end mceNonEditable">›</span></span> ' //space at end is important
 		]
	],
  // faded ink should have an underscore rather than a space, same for all other reason attributes [issue #13]
  [ 'whole word <unclear> tag with reason',
	  [ '<w><unclear reason="faded ink">word</unclear></w>',
	 		'<span class="unclear" wce_orig="word" wce="__t=unclear&amp;__n=&amp;unclear_text_reason_other=&amp;unclear_text_reason=faded ink">' +
      '<span class="format_start mceNonEditable">‹</span>ẉọṛḍ<span class="format_end mceNonEditable">›</span></span> ' //space at end is important
 		]
	],
	// space
  [ 'character space',
    [ '<w>space</w><w>between</w><space unit="char" extent="5"/><w>words</w>',
      'space between <span class="spaces" wce="__t=spaces&amp;__n=&amp;sp_unit_other=&amp;sp_unit=char&amp;' +
      'sp_extent=5"><span class="format_start mceNonEditable">‹</span>sp' +
      '<span class="format_end mceNonEditable">›</span></span>words '
    ]
  ],
  // pc
  [ 'simple <pc> tag',
	  [ '<pc>.</pc>',
	 		'<span class="pc" wce="__t=pc"><span class="format_start mceNonEditable">‹</span>.' +
      '<span class="format_end mceNonEditable">›</span></span> ' //space at end is important
 		],
	],
	[ 'a semicolon simple <pc> tag',
	  [ '<pc>;</pc>',
	 		'<span class="pc" wce="__t=pc"><span class="format_start mceNonEditable">‹</span>;' +
      '<span class="format_end mceNonEditable">›</span></span> ' //space at end is important
 		],
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
	// // supplied in abbr - this isn't hitting what I expected
	// [ 'supplied text in nomsac',
	//   [ '<w>supplied</w><w>text</w><w>in</w><w><abbr type="nomSac"><hi rend="overline">nom<supplied source="transcriber" reason="illegible">sac</supplied></hi></abbr></w>',
	//     'supplied text in <span class=\"abbr_add_overline\" wce=\"__t=abbr&amp;__n=&amp;original_abbr_text=&amp;add_overline=overline&amp;abbr_type_other=&amp;abbr_type=nomSac\" wce_orig=\"nom%3Cspan%20class%3D%22gap%22%20wce_orig%3D%22sac%22%20wce%3D%22__t%3Dgap%26amp%3B__n%3D%26amp%3Bgap_reason_dummy_lacuna%3Dlacuna%26amp%3Bgap_reason_dummy_illegible%3Dillegible%26amp%3Bgap_reason_dummy_unspecified%3Dunspecified%26amp%3Bgap_reason_dummy_inferredPage%3DinferredPage%26amp%3Bsupplied_source_other%3D%26amp%3Bsupplied_source%3Dtranscriber%26amp%3Bgap_reason%3Dillegible%26amp%3Bunit_other%3D%26amp%3Bunit%3D%26amp%3Bmark_as_supplied%3Dsupplied%22%3E%3Cspan%20class%3D%22format_start%20mceNonEditable%22%3E%E2%80%B9%3C%2Fspan%3E%5Bsac%5D%3Cspan%20class%3D%22format_end%20mceNonEditable%22%3E%E2%80%BA%3C%2Fspan%3E%3C%2Fspan%3E\"><span class=\"format_start mceNonEditable\">‹</span>nom<span class=\"gap\" wce_orig=\"sac\" wce=\"__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;supplied_source_other=&amp;supplied_source=transcriber&amp;gap_reason=illegible&amp;unit_other=&amp;unit=&amp;mark_as_supplied=supplied\"><span class=\"format_start mceNonEditable\">‹</span>[sac]<span class=\"format_end mceNonEditable\">›</span></span><span class=\"format_end mceNonEditable\">›</span></span> '
	//   ]
	// ],
	// this seems like overkill in the html doesn't it?
	[ 'nomen sacrum abbreviation with overline in supplied',
		[ '<w><supplied source="na28" reason="illegible">a</supplied></w><w><supplied source="na28" reason="illegible">' +
			'<abbr type="nomSac"><hi rend="overline">ns</hi></abbr></supplied></w>' +
			'<w><supplied source="na28" reason="illegible">abbreviation</supplied></w>',
			'<span class=\"gap\" wce_orig=\"a%20%3Cspan%20class%3D%22abbr_add_overline%22%20wce%3D%22__t%3Dabbr%26amp%' +
			'3B__n%3D%26amp%3Boriginal_abbr_text%3D%26amp%3Badd_overline%3Doverline%26amp%3Babbr_type_other%3D%26amp%3B' +
			'abbr_type%3DnomSac%22%20wce_orig%3D%22ns%22%3E%3Cspan%20class%3D%22format_start%20mceNonEditable' +
			'%22%3E%E2%80%B9%3C%2Fspan%3Ens%3Cspan%20class%3D%22format_end%20mceNonEditable%22%3E%E2%80%BA%3C%2Fspan' +
			'%3E%3C%2Fspan%3E%20abbreviation\" wce=\"__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;' +
			'gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;' +
			'gap_reason_dummy_inferredPage=inferredPage&amp;supplied_source_other=&amp;supplied_source=na28&amp;' +
			'gap_reason=illegible&amp;unit_other=&amp;unit=&amp;mark_as_supplied=supplied\">' +
			'<span class=\"format_start mceNonEditable\">‹</span>[a <span class=\"abbr_add_overline\" wce=\"__t=abbr&amp;' +
			'__n=&amp;original_abbr_text=&amp;add_overline=overline&amp;abbr_type_other=&amp;' +
			'abbr_type=nomSac\" wce_orig=\"ns\"><span class=\"format_start mceNonEditable\">‹</span>ns' +
			'<span class=\"format_end mceNonEditable\">›</span></span> abbreviation]<span class=\"format_end mceNonEditable\">›</span></span> '
		]
	],
	// special his with extra details not covered in separate simpler tests below
  [ 'capitals',
    [ '<w><hi rend="cap" height="3">I</hi>nitial</w><w>capital</w>',
      '<span class=\"formatting_capitals\" wce=\"__t=formatting_capitals&amp;__n=&amp;capitals_height=3\" wce_orig=\"I\">' +
      '<span class=\"format_start mceNonEditable\">‹</span>I<span class=\"format_end mceNonEditable\">›</span>' +
      '</span>nitial capital '
    ]
  ],
  [ 'other ornamentation',
    [ '<w>test</w><w><hi rend="underlined">for</hi></w><w>rendering</w>',
      'test <span class="formatting_ornamentation_other" wce="__t=formatting_ornamentation_other&amp;' +
      '__n=&amp;formatting_ornamentation_other=underlined" wce_orig="for">' +
      '<span class="format_start mceNonEditable">‹</span>for' +
      '<span class="format_end mceNonEditable">›</span></span> rendering '
    ]
  ],
]);



const textStructureDivs = new Map([
  // divs
  // these will need to change when references change [issue #15]
  [ 'book div',
	  [ '<div type="book" n="John"><w>The</w><w>content</w><w>of</w><w>my</w><w>book</w></div>',
	 		' <span class="book_number mceNonEditable" wce="__t=book_number" id="1">John</span> The content of my book ' //spaces at beg and end are important
 		],
	],
  [ 'chapter div', // note that book value is empty until we combine them
	  [ '<div type="chapter" n=".1"><w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div>',
	 		' <span class="chapter_number mceNonEditable" wce="__t=chapter_number" id="1">1</span> The content of my chapter ' //spaces at beg and end are important
 		],
	],
  [ 'book and chapter div',
	  [ '<div type="book" n="John"><div type="chapter" n="John.1"><w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div></div>',
	 		' <span class="book_number mceNonEditable" wce="__t=book_number" id="1">John</span>  ' +
      '<span class="chapter_number mceNonEditable" wce="__t=chapter_number" id="2">1</span> The content of my chapter ' //spaces at beg and end are important
 		],
	],
  [ 'book, chapter and verse',
	  [ '<div type="book" n="John"><div type="chapter" n="John.1"><ab n="John.1.2"><w>The</w><w>content</w><w>of</w>' +
      '<w>my</w><w>verse</w></ab></div></div>',
	 		' <span class="book_number mceNonEditable" wce="__t=book_number" id="1">John</span>  ' +
      '<span class="chapter_number mceNonEditable" wce="__t=chapter_number" id="2">1</span> ' +
      '<span class="verse_number mceNonEditable" wce="__t=verse_number">2</span> The content of my verse ' //spaces at beg and end are important
 		],
	],
  [ 'book, chapter and verse (verse continues from previous page, part="F")',
	  [ '<div type="book" n="John"><div type="chapter" n="John.1"><ab n="John.1.2" part="F"><w>continuation</w>' +
      '<w>of</w><w>my</w><w>verse</w></ab></div></div>',
	 		' <span class="book_number mceNonEditable" wce="__t=book_number" id="1">John</span>  ' +
      '<span class="chapter_number mceNonEditable" wce="__t=chapter_number" id="2">1</span> ' +
      '<span class="verse_number mceNonEditable" wce="__t=verse_number&amp;partial=F">2 Cont.</span> continuation of my verse ' //spaces at beg and end are important
 		],
	],
  [ 'lection div',
	  [ '<div type="lection" n="R12"><w>The</w><w>content</w><w>of</w><w>my</w><w>lection</w></div>',
	 		' <span class="lection_number mceNonEditable" wce="__t=lection_number&amp;number=R12" id="1">Lec</span> The content of my lection ' //spaces at beg and end are important
 		],
	],
  [ 'lection, book and chapter div',
    [ '<div type="lection" n="R12"><div type="book" n="John"><div type="chapter" n="John.1">' +
      '<w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div></div></div>',
      ' <span class="lection_number mceNonEditable" wce="__t=lection_number&amp;number=R12" id="1">Lec</span>  ' +
      '<span class="book_number mceNonEditable" wce="__t=book_number" id="2">John</span>  '+
      '<span class="chapter_number mceNonEditable" wce="__t=chapter_number" id="3">1</span> The content of my chapter ' //spaces at beg and end are important
    ],
  ],
  [ 'book and inscriptio divs',
    [ '<div type="book" n="John"><div type="inscriptio"><ab n="John.inscriptio"><w>inscriptio</w><w>text</w></ab></div></div>',
      ' <span class="book_number mceNonEditable" wce="__t=book_number" id="1">John</span>  ' +
      '<span class="chapter_number mceNonEditable" wce="__t=chapter_number">Inscriptio</span> ' +
      '<span class="verse_number mceNonEditable" wce="__t=verse_number"/> inscriptio text '
    ]
  ],
  [ 'book and subscriptio div',
    [ '<div type="book" n="John"><div type="subscriptio"><ab n="John.subscriptio"><w>subscriptio</w><w>text</w></ab></div></div>',
      ' <span class="book_number mceNonEditable" wce="__t=book_number" id="1">John</span>  ' +
      '<span class="chapter_number mceNonEditable" wce="__t=chapter_number">Subscriptio</span> ' +
      '<span class="verse_number mceNonEditable" wce="__t=verse_number"/> subscriptio text '
    ]
  ]
]);



const gapAndSupplied = new Map([
  // gaps
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
  [ 'gap with unit char and no extent given',
    [ '<w>wo<gap reason="illegible" unit="char"/></w>',
      'wo<span class=\"gap\" wce=\"__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;' +
			'gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;' +
			'gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit_other=&amp;unit=char\">' +
			'<span class=\"format_start mceNonEditable\">‹</span>[...]<span class=\"format_end mceNonEditable\">›</span></span> '
    ]
  ],
  [ 'gap with unit line and no extent given',
    [ '<w>missing</w><w>line</w><gap reason="illegible" unit="line"/>',
      'missing line <span class=\"gap\" wce=\"__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;' +
			'gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;' +
			'gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit_other=&amp;unit=line\"/>'
    ]
  ],
  [ 'gap with unit line and extent part',
    [ '<w>missing</w><w>line</w><gap reason="illegible" unit="line" extent="part"/>',
      'missing line <span class=\"gap\" wce=\"__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;' +
			'gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;' +
			'gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit_other=&amp;unit=line&amp;' +
			'extent=part\"><span class=\"format_start mceNonEditable\">‹</span>[...]' +
			'<span class=\"format_end mceNonEditable\">›</span></span>'
    ]
  ],
  [ 'gap with unit line and extent unspecified',
    [ '<w>missing</w><w>line</w><gap reason="illegible" unit="line" extent="unspecified"/>',
      'missing line <span class=\"gap\" wce=\"__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;' +
			'gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;' +
			'gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit_other=&amp;unit=line&amp;' +
			'extent=unspecified\"><span class=\"format_start mceNonEditable\">‹</span>[...]' +
			'<span class=\"format_end mceNonEditable\">›</span></span>'
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
  [ 'gap witness end',
    [ '<w>the</w><w>end</w><w>of</w><w>the</w><w>witness</w><gap reason="witnessEnd"/>',
      'the end of the witness  <span class="witnessend" wce="__t=gap&amp;__n=&amp;original_gap_text=&amp;' +
      'gap_reason=witnessEnd&amp;unit=&amp;unit_other=&amp;extent=&amp;supplied_source=na28&amp;' +
      'supplied_source_other=&amp;insert=Insert&amp;cancel=Cancel"><span class="format_start mceNonEditable">‹</span>' +
      'Witness End<span class="format_end mceNonEditable">›</span></span>'
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
  ]
]);


const corrections = new Map([
  // corrections
  [ 'a simple correction with visible firsthand',
    [ '<w>a</w><app><rdg type="orig" hand="firsthand"><w>smple</w></rdg><rdg type="corr" hand="corrector">' +
      '<w>simple</w></rdg></app><w>correction</w>',
      'a <span class="corr" wce_orig="smple" wce="__t=corr&amp;__n=corrector&amp;corrector_name_other=&amp;' +
      'corrector_name=corrector&amp;reading=corr&amp;original_firsthand_reading=smple&amp;' +
      'common_firsthand_partial=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;' +
      'deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;' +
      'deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=null&amp;firsthand_partial=&amp;' +
      'partial=&amp;corrector_text=simple%20&amp;place_corr="><span class="format_start mceNonEditable">‹</span>' +
      'smple<span class="format_end mceNonEditable">›</span></span> correction '
    ]
  ],
  // another undefined for sigla in this one which could be better
  [ 'a simple correction in the margin',
    [ '<w>a</w><app><rdg type="orig" hand="firsthand"><w>smple</w></rdg>' +
      '<rdg type="corr" hand="corrector1" rend="deletion_hooks"><seg type="margin" subtype="pageleft" n="@P-undefined">' +
      '<w>simple</w></seg></rdg></app><w>correction</w>',
      'a <span class="corr" wce_orig="smple" wce="__t=corr&amp;__n=corrector1&amp;corrector_name_other=&amp;' +
      'corrector_name=corrector1&amp;reading=corr&amp;original_firsthand_reading=smple&amp;' +
      'common_firsthand_partial=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;' +
      'deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=1&amp;' +
      'deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=deletion_hooks&amp;firsthand_partial=&amp;' +
      'partial=&amp;corrector_text=simple%20&amp;place_corr=pageleft">' +
      '<span class="format_start mceNonEditable">‹</span>smple<span class="format_end mceNonEditable">›</span>' +
      '</span> correction '
    ]
  ],
  [ 'a simple correction above line',
    [ '<w>a</w><app><rdg type="orig" hand="firsthand"><w>smple</w></rdg>' +
      '<rdg type="corr" hand="corrector1" rend="deletion_hooks"><seg type="line" subtype="above" n="@PCL-undefined">' +
      '<w>simple</w></seg></rdg></app><w>correction</w>',
      'a <span class="corr" wce_orig="smple" wce="__t=corr&amp;__n=corrector1&amp;corrector_name_other=&amp;' +
      'corrector_name=corrector1&amp;reading=corr&amp;original_firsthand_reading=smple&amp;' +
      'common_firsthand_partial=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;' +
      'deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=1&amp;' +
      'deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=deletion_hooks&amp;firsthand_partial=&amp;' +
      'partial=&amp;corrector_text=simple%20&amp;place_corr=above">' +
      '<span class="format_start mceNonEditable">‹</span>smple<span class="format_end mceNonEditable">›</span>' +
      '</span> correction '
    ]
  ],
  [ 'a simple correction with other location',
    [ '<w>a</w><app><rdg type="orig" hand="firsthand"><w>smple</w></rdg>' +
      '<rdg type="corr" hand="corrector1" rend="transposition_marks">' +
      '<seg type="other" subtype="inline" n="@PCL-undefined"><w>simple</w></seg></rdg></app><w>correction</w>',
      'a <span class="corr" wce_orig="smple" wce="__t=corr&amp;__n=corrector1&amp;corrector_name_other=&amp;' +
      'corrector_name=corrector1&amp;reading=corr&amp;original_firsthand_reading=smple&amp;' +
      'common_firsthand_partial=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;' +
      'deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;' +
      'deletion_transposition_marks=1&amp;deletion_other=0&amp;deletion=transposition_marks&amp;' +
      'firsthand_partial=&amp;partial=&amp;corrector_text=simple%20&amp;place_corr=other&amp;' +
      'place_corr_other=inline"><span class="format_start mceNonEditable">‹</span>smple' +
      '<span class="format_end mceNonEditable">›</span></span> correction '
    ]
  ],
  [ 'a deletion (correction)',
    [ '<w>a</w><app><rdg type="orig" hand="firsthand"><w>deletion</w></rdg>' +
      '<rdg type="corr" hand="corrector" rend="strikethrough"></rdg></app><w>correction</w>',
      'a <span class="corr" wce_orig="deletion" wce="__t=corr&amp;__n=corrector&amp;corrector_name_other=&amp;' +
      'corrector_name=corrector&amp;reading=corr&amp;original_firsthand_reading=deletion&amp;' +
      'common_firsthand_partial=&amp;deletion_erased=0&amp;deletion_underline=0&amp;' +
      'deletion_underdot=0&amp;deletion_strikethrough=1&amp;deletion_vertical_line=0&amp;' +
      'deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;' +
      'deletion=strikethrough&amp;firsthand_partial=&amp;partial=&amp;corrector_text=&amp;blank_correction=on&amp;' +
      'place_corr="><span class="format_start mceNonEditable">‹</span>deletion' +
      '<span class="format_end mceNonEditable">›</span></span> correction '
    ]
  ],
  [ 'an addition (correction)',
    [ '<w>an</w><app><rdg type="orig" hand="firsthand"></rdg><rdg type="corr" hand="corrector">' +
      '<w>addition</w></rdg></app><w>correction</w>',
      'an <span class="corr_blank_firsthand" wce="__t=corr&amp;__n=corrector&amp;corrector_name_other=&amp;' +
      'corrector_name=corrector&amp;reading=corr&amp;original_firsthand_reading=&amp;blank_firsthand=on&amp;' +
      'common_firsthand_partial=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;' +
      'deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;' +
      'deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=null&amp;firsthand_partial=&amp;' +
      'partial=&amp;corrector_text=addition%20&amp;place_corr="><span class="format_start mceNonEditable">‹</span>T' +
      '<span class="format_end mceNonEditable">›</span></span> correction '
    ]
  ],
  [ 'consecutive corrections',
    [ '<app><rdg type="orig" hand="firsthand"><w>consecutive</w></rdg>' +
      '<rdg type="corr" hand="corrector" rend="underline"></rdg></app><app>' +
      '<rdg type="orig" hand="firsthand"><w>corrections</w></rdg>' +
      '<rdg type="corr" hand="corrector"><w>correction</w></rdg></app>',
      '<span class="corr" wce_orig="consecutive" wce="__t=corr&amp;__n=corrector&amp;corrector_name_other=&amp;' +
      'corrector_name=corrector&amp;reading=corr&amp;original_firsthand_reading=consecutive&amp;' +
      'common_firsthand_partial=&amp;deletion_erased=0&amp;deletion_underline=1&amp;deletion_underdot=0&amp;' +
      'deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;' +
      'deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=underline&amp;firsthand_partial=&amp;' +
      'partial=&amp;corrector_text=&amp;blank_correction=on&amp;place_corr=">' +
      '<span class="format_start mceNonEditable">‹</span>consecutive<span class="format_end mceNonEditable">›</span>' +
      '</span> <span class="corr" wce_orig="corrections" wce="__t=corr&amp;__n=corrector&amp;corrector_name_other=&amp;' +
      'corrector_name=corrector&amp;reading=corr&amp;original_firsthand_reading=corrections&amp;' +
      'common_firsthand_partial=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;' +
      'deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;' +
      'deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=null&amp;firsthand_partial=&amp;' +
      'partial=&amp;corrector_text=correction%20&amp;place_corr="><span class="format_start mceNonEditable">‹</span>' +
      'corrections<span class="format_end mceNonEditable">›</span></span>'
    ]
  ],
  [ 'firsthand ut videtur',
    [ '<w>a</w><app><rdg type="orig" hand="firsthandV"><w>smple</w></rdg>' +
      '<rdg type="corr" hand="corrector"><w>simple</w></rdg></app><w>correction</w>',
      'a <span class="corr" wce_orig="smple" wce="__t=corr&amp;__n=corrector&amp;ut_videtur_firsthand=on&amp;' +
      'corrector_name_other=&amp;corrector_name=corrector&amp;reading=corr&amp;original_firsthand_reading=smple&amp;' +
      'common_firsthand_partial=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;' +
      'deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;' +
      'deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=null&amp;firsthand_partial=&amp;' +
      'partial=&amp;corrector_text=simple%20&amp;place_corr="><span class="format_start mceNonEditable">‹</span>' +
      'smple<span class="format_end mceNonEditable">›</span></span> correction '
    ]
  ],
  [ 'corrector ut videtur',
    [ '<w>a</w><app><rdg type="orig" hand="firsthand"><w>smple</w></rdg><rdg type="corr" hand="correctorV">' +
      '<w>simple</w></rdg></app><w>correction</w>',
      'a <span class="corr" wce_orig="smple" wce="__t=corr&amp;__n=corrector&amp;corrector_name_other=&amp;' +
      'corrector_name=corrector&amp;ut_videtur_corr=on&amp;reading=corr&amp;original_firsthand_reading=smple&amp;' +
      'common_firsthand_partial=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;' +
      'deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;' +
      'deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=null&amp;firsthand_partial=&amp;' +
      'partial=&amp;corrector_text=simple%20&amp;place_corr="><span class="format_start mceNonEditable">‹</span>' +
      'smple<span class="format_end mceNonEditable">›</span></span> correction '
    ]
  ],
  [ 'an alternative reading',
    [ '<w>a</w><app><rdg type="orig" hand="firsthand"><w>simple</w></rdg>' +
      '<rdg type="alt" hand="corrector" rend="other"><w>basic</w></rdg></app><w>correction</w>',
      'a <span class="corr" wce_orig="simple" wce="__t=corr&amp;__n=corrector&amp;corrector_name_other=&amp;' +
      'corrector_name=corrector&amp;reading=alt&amp;original_firsthand_reading=simple&amp;' +
      'common_firsthand_partial=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;' +
      'deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;' +
      'deletion_transposition_marks=0&amp;deletion_other=1&amp;deletion=other&amp;firsthand_partial=&amp;' +
      'partial=&amp;corrector_text=basic%20&amp;place_corr="><span class="format_start mceNonEditable">‹</span>' +
      'simple<span class="format_end mceNonEditable">›</span></span> correction '
    ]
  ]
]);


const notes = new Map([
  // notes
  // another undefined issue
  [ 'a local note',
    [ '<w>a</w><w>note</w><note type="local" xml:id="..-undefined-2">my new local note</note>',
      'a note<span class="note" wce="__t=note&amp;__n=&amp;note_text=my%20new%20local%20note&amp;' +
      'note_type=local&amp;newhand="><span class="format_start mceNonEditable">‹</span>Note' +
      '<span class="format_end mceNonEditable">›</span></span>'
    ]
  ],
  // a handshift note - needs to be changed to handShift [issue #12]
  [ 'a handShift note',
    [ '<w>a</w><w>note</w><note type="editorial" xml:id="..-undefined-2"><handShift/></note>',
      'a note<span class="note" wce="__t=note&amp;__n=&amp;note_text=&amp;note_type=changeOfHand&amp;' +
      'note_type_other=&amp;newHand="><span class="format_start mceNonEditable">‹</span>Note' +
      '<span class="format_end mceNonEditable">›</span></span>'
    ]
  ],
  // spaces added in attribute should be replaced with _ [issue #13]
  [ 'a handShift note with new hand',
    [ '<w>a</w><w>note</w><note type="editorial" xml:id="..-undefined-2"><handShift scribe="new hand"/></note>',
      'a note<span class="note" wce="__t=note&amp;__n=&amp;note_text=&amp;note_type=changeOfHand&amp;' +
      'note_type_other=&amp;newHand=new%20hand"><span class="format_start mceNonEditable">‹</span>Note' +
      '<span class="format_end mceNonEditable">›</span></span>'
    ]
  ],
  // commentary
  // This tests the paratext function but there is also code relating to commentary left in note function
  // which probably needs to be removed as I can't see any way it would be used in the interface. [issue #18]
  [ '1 line of commentary text note',
    [ '<w>some</w><w>commentary</w><lb/><note type="commentary">One line of untranscribed commentary text</note>' +
      '<lb n="PCL-undefined"/><w>in</w><w>here</w>',
      'some commentary <span class="paratext" wce="__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=1&amp;' +
      'text=&amp;number=&amp;edit_number=on&amp;paratext_position=pagetop&amp;paratext_position_other=&amp;' +
      'paratext_alignment=left"><span class="format_start mceNonEditable">‹</span><br/>↵[' +
      '<span class="commentary" wce="__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=1">comm</span>]' +
      '<span class="format_end mceNonEditable">›</span></span>' +
      '<span class="mceNonEditable brea" wce="__t=brea&amp;__n=&amp;break_type=lb&amp;number=&amp;' +
      'lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no">' +
      '<span class="format_start mceNonEditable">‹</span><br/>↵ <span class="format_end mceNonEditable">›</span>' +
      '</span> in here '
    ]
  ],
  [ 'commentary in line',
    [ '<w>in</w><w>line</w><w>commentary</w><note type="commentary">Untranscribed commentary text within the line</note>',
      'in line commentary<span class="paratext" wce="__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=0&amp;' +
      'text=&amp;number=&amp;edit_number=on&amp;paratext_position=pagetop&amp;paratext_position_other=&amp;' +
      'paratext_alignment=left"><span class="format_start mceNonEditable">‹</span>[' +
      '<span class="commentary" wce="__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=0">comm</span>]' +
      '<span class="format_end mceNonEditable">›</span></span>'
    ]
  ],
  // lectionary
  // again there is code for this in the note function but this seems to use the paratext one (notes stuff claims to be legacy)
  [ 'lectionary in line',
    [ '<w>in</w><w>line</w><w>lectionary</w><note type="lectionary-other">Untranscribed lectionary text within the line</note>',
      'in line lectionary<span class=\"paratext\" wce=\"__t=paratext&amp;__n=&amp;fw_type=lectionary-other&amp;' +
			'covered=0&amp;text=&amp;number=&amp;edit_number=on&amp;paratext_position=pagetop&amp;' +
			'paratext_position_other=&amp;paratext_alignment=left\"><span class=\"format_start mceNonEditable\">‹</span>' +
			'[<span class=\"lectionary-other\" wce=\"__t=paratext&amp;__n=&amp;fw_type=lectionary-other&amp;' +
			'covered=0\">lect</span>]<span class=\"format_end mceNonEditable\">›</span></span>'
    ]
  ],
  [ '2 lines of untranscribed lectionary text',
    [ '<w>lection</w><w>text</w><w>next</w><lb/>' +
      '<note type="lectionary-other">One line of untranscribed lectionary text</note><lb/>' +
      '<note type="lectionary-other">One line of untranscribed lectionary text</note>',
      'lection text next <span class="paratext" wce="__t=paratext&amp;__n=&amp;fw_type=lectionary-other&amp;' +
      'covered=2&amp;text=&amp;number=&amp;edit_number=on&amp;paratext_position=pagetop&amp;' +
      'paratext_position_other=&amp;paratext_alignment=left"><span class="format_start mceNonEditable">‹</span>' +
      '<br/>↵[<span class="lectionary-other" wce="__t=paratext&amp;__n=&amp;fw_type=lectionary-other&amp;' +
      'covered=2">lect</span>]<br/>↵[<span class="lectionary-other" wce="__t=paratext&amp;__n=&amp;' +
      'fw_type=lectionary-other&amp;covered=2">lect</span>]<span class="format_end mceNonEditable">›</span></span>'
    ]
  ],
  // ews
  // this one is definitely handled in the note function
  // TODO: add more of these to deal with multi-verse ews (see transcription guidelines)
  [ 'ews ',
    [ '<w>abbreviated</w><w>commentary</w><note type="editorial" subtype="ews"/><gap unit="verse" extent="rest"/>',
      'abbreviated commentary<span class="paratext" wce="__t=paratext&amp;__n=&amp;marginals_text=&amp;' +
      'fw_type=ews&amp;covered=&amp;text=&amp;number=&amp;edit_number=on&amp;paratext_position=pagetop&amp;' +
      'paratext_position_other=&amp;paratext_alignment=left"><span class="format_start mceNonEditable">‹</span>' +
      '[<span class="ews">ews</span>]<span class="format_end mceNonEditable">›</span></span>'
    ]
  ]
]);



const fw = new Map([
  // running title in centre of top margin
  [ 'running title (fw) in centre top margin (seg)',
    [ '<seg type="margin" subtype="pagetop" n="@P-undefined"><fw type="runTitle" rend="center">' +
      '<w>running</w><w>title</w></fw></seg>',
      '<span class="paratext" wce="__t=paratext&amp;__n=&amp;marginals_text=running%20title%20&amp;' +
      'fw_type=runTitle&amp;paratext_alignment=center&amp;paratext_position=pagetop&amp;paratext_position_other=">' +
      '<span class="format_start mceNonEditable">‹</span>fw<span class="format_end mceNonEditable">›</span></span>'
    ]
  ],
  // chapter number in the margin
  [ 'chapter number in left margin',
    [ '<w>this</w><w>is</w><w>a</w><w>chapter</w><w>number</w><w>in</w><w>the</w><w>margin</w>' +
      '<seg type="margin" subtype="colleft" n="@PC-undefined"><num type="chapNum">12</num></seg>',
      'this is a chapter number in the margin <span class="paratext" wce="__t=paratext&amp;__n=&amp;' +
			'marginals_text=12&amp;fw_type=chapNum&amp;paratext_position=colleft&amp;paratext_position_other=">' +
			'<span class="format_start mceNonEditable">‹</span>fw<span class="format_end mceNonEditable">›</span></span>'
    ]
  ]
]);


const testDataMaps = [basicAnnotation, textStructureDivs, gapAndSupplied, corrections, notes, fw];

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


// special test for all branches of of the hi switch statement
const hiRendOptions = new Map([
  // rubric
	[ 'rubric',
	  [ 'rubric',
	 		'formatting_rubrication'
 		],
	],
  [ 'gold',
	  [ 'gold',
	 		'formatting_gold'
 		],
	],
  [ 'blue',
	  [ 'blue',
	 		'formatting_blue'
 		],
	],
  [ 'green',
	  [ 'green',
	 		'formatting_green'
 		],
	],
  [ 'yellow',
	  [ 'yellow',
	 		'formatting_yellow'
 		],
	],
  [ 'overline',
	  [ 'overline',
	 		'formatting_overline'
 		],
	],
  [ 'other',
	  [ 'other',
	 		'formatting_other'
 		],
	],
  [ 'displaced-above',
	  [ 'displaced-above',
	 		'formatting_displaced-above'
 		],
	],
  [ 'displaced-below',
	  [ 'displaced-below',
	 		'formatting_displaced-below'
 		],
	],
  [ 'displaced-other',
	  [ 'displaced-other',
	 		'formatting_displaced-other'
 		],
	]
]);

hiRendOptions.forEach((value, key, map) => {
  let xmlFormat = xmlHead + '<w>test</w><w><hi rend="' + value[0] + '">for</hi></w><w>rendering</w>' + xmlTail;
  let htmlFormat = 'test <span class="' + value[1] + '" wce="__t=' + value[1] +
                   '" wce_orig="for"><span class="format_start mceNonEditable">‹</span>for' +
                   '<span class="format_end mceNonEditable">›</span></span> rendering ';
	test('TEI2HTML: ' + key, () => {
		let testInput, expectedOutput, html;
		testInput = xmlFormat;
		expectedOutput = '<TEMP>' + htmlFormat + '</TEMP>';
		html = wce_tei.getHtmlByTei(testInput, clientOptions);
		expect(html.htmlString).toBe(expectedOutput);
	});
  test('HTML2TEI: ' + key, () => {
		let testInput, expectedOutput, xml;
		testInput = htmlFormat;
		expectedOutput = xmlFormat;
		xml = wce_tei.getTeiByHtml(testInput, {});
		expect(xml).toBe(expectedOutput);
	});
});


// breaks added at the same time as each other use math.random as an identifier so they need special tests that use regex
const manuscriptPageStructure = new Map([

  [ 'initial page, using type=folio',
    [ '<pb n="1r" type="folio" xml:id="P1r-undefined"/><cb n="P1rC1-undefined"/>' +
      '<lb n="P1rC1L-undefined"/><w>my</w><w>first</w><w>page</w>',
      '<span class=\"mceNonEditable brea\" id=\"pb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;break_type=pb&amp;' +
      'number=1&amp;rv=r&amp;fibre_type=&amp;facs=&amp;lb_alignment=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>PB 1r<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"cb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=cb&amp;number=1&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>CB 1<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"lb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
      '</span> my first page '
    ]
  ],
  [ 'initial page, using type=folio, with facsimile',
    [ '<pb n="1r" type="folio" facs="http://thelibrary/image7.jpg" xml:id="P1r-undefined"/><cb n="P1rC1-undefined"/>' +
      '<lb n="P1rC1L-undefined"/><w>my</w><w>first</w><w>page</w>',
      '<span class=\"mceNonEditable brea\" id=\"pb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;break_type=pb&amp;' +
      'number=1&amp;rv=r&amp;fibre_type=&amp;facs=http://thelibrary/image7.jpg&amp;lb_alignment=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>PB 1r<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"cb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=cb&amp;number=1&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>CB 1<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"lb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
      '</span> my first page '
    ]
  ],
  [ 'mid-text page, using type=page',
    [ '<w>end</w><w>of</w><w>page</w><pb n="1" type="page" xml:id="P1-undefined"/><cb n="P1C1-undefined"/>' +
      '<lb n="P1C1L-undefined"/><w>my</w><w>second</w><w>page</w>',
      'end of page <span class=\"mceNonEditable brea\" id=\"pb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=pb&amp;number=1&amp;rv=&amp;fibre_type=&amp;facs=&amp;lb_alignment=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>PB 1<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"cb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=cb&amp;number=1&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>CB 1<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"lb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
      '</span> my second page '
    ]
  ],
  [ 'mid-word page, for papyri (type=page and y)',
    [ '<w>half</w><w>of</w><w>wo<pb n="1↓" type="page" xml:id="P1y-undefined" break="no"/><cb n="P1yC1-undefined"/>' +
      '<lb n="P1yC1L-undefined"/>rd</w><w>on</w><w>second</w><w>page</w>',
      'half of wo<span class=\"mceNonEditable brea\" id=\"pb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=pb&amp;number=1&amp;rv=&amp;fibre_type=y&amp;facs=&amp;lb_alignment=&amp;hasBreak=yes\">' +
      '<span class=\"format_start mceNonEditable\">‹</span>-<br/>PB 1y<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"cb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=cb&amp;number=1&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>CB 1<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"lb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
      '</span>rd on second page '
    ]
  ],
  [ 'between-word column',
    [ '<pb n="1v" type="folio" xml:id="P1v-undefined"/><cb n="P1vC1-undefined"/><lb n="P1vC1L-undefined"/>' +
      '<w>my</w><w>first</w><w>column</w><cb n="P1vC2-undefined"/><lb n="P1vC2L-undefined"/>' +
      '<w>my</w><w>second</w><w>column</w>',
      '<span class=\"mceNonEditable brea\" id=\"pb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;break_type=pb&amp;' +
      'number=1&amp;rv=v&amp;fibre_type=&amp;facs=&amp;lb_alignment=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>PB 1v<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"cb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=cb&amp;number=1&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>CB 1<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"lb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
      '</span> my first column <span class=\"mceNonEditable brea\" id=\"cb_2_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=cb&amp;number=2&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>CB 2<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"lb_2_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
      '</span> my second column '
    ]
  ],
  [ 'mid-word column',
    [ '<pb n="1v" type="folio" xml:id="P1v-undefined"/><cb n="P1vC1-undefined"/><lb n="P1vC1L-undefined"/>' +
      '<w>my</w><w>first</w><w>colu<cb n="P1vC2-undefined" break="no"/><lb n="P1vC2L-undefined"/>mn</w>' +
      '<w>my</w><w>second</w><w>column</w>',
      '<span class=\"mceNonEditable brea\" id=\"pb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;break_type=pb&amp;' +
      'number=1&amp;rv=v&amp;fibre_type=&amp;facs=&amp;lb_alignment=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>PB 1v<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"cb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=cb&amp;number=1&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>CB 1<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"lb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
      '</span> my first colu<span class=\"mceNonEditable brea\" id=\"cb_2_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=cb&amp;number=2&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=yes\">' +
      '<span class=\"format_start mceNonEditable\">‹</span>-<br/>CB 2<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"lb_2_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
      '</span>mn my second column '
    ]
  ],
  [ 'between-word linebreak',
    [ '<pb n="1" type="page" xml:id="P1-undefined"/><cb n="P1C1-undefined"/><lb n="P1C1L-undefined"/>' +
      '<w>my</w><w>first</w><w>line</w><lb n="P1C1L-undefined"/><w>my</w><w>second</w><w>line</w>',
      '<span class=\"mceNonEditable brea\" id=\"pb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;break_type=pb&amp;' +
      'number=1&amp;rv=&amp;fibre_type=&amp;facs=&amp;lb_alignment=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>PB 1<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"cb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=cb&amp;number=1&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>CB 1<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"lb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
      '</span> my first line <span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
      '</span> my second line '
    ]
  ],
  [ 'between-word linebreak, hanging line',
    [ '<pb n="1" type="page" xml:id="P1-undefined"/><cb n="P1C1-undefined"/><lb n="P1C1L-undefined"/>' +
      '<w>my</w><w>first</w><w>line</w><lb n="P1C1L-undefined" rend="hang"/><w>my</w><w>second</w><w>line</w>',
      '<span class=\"mceNonEditable brea\" id=\"pb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;break_type=pb&amp;' +
      'number=1&amp;rv=&amp;fibre_type=&amp;facs=&amp;lb_alignment=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>PB 1<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"cb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=cb&amp;number=1&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>CB 1<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"lb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
      '</span> my first line <span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=lb&amp;' +
      'number=&amp;lb_alignment=hang&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>↵← <span class=\"format_end mceNonEditable\">›</span>' +
      '</span> my second line '
    ]
  ],
  [ 'between-word linebreak, indented line',
    [ '<pb n="1" type="page" xml:id="P1-undefined"/><cb n="P1C1-undefined"/><lb n="P1C1L-undefined"/>' +
      '<w>my</w><w>first</w><w>line</w><lb n="P1C1L-undefined" rend="indent"/><w>my</w><w>second</w><w>line</w>',
      '<span class=\"mceNonEditable brea\" id=\"pb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;break_type=pb&amp;' +
      'number=1&amp;rv=&amp;fibre_type=&amp;facs=&amp;lb_alignment=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>PB 1<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"cb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=cb&amp;number=1&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>CB 1<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"lb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
      '</span> my first line <span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=lb&amp;' +
      'number=&amp;lb_alignment=indent&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>↵→ <span class=\"format_end mceNonEditable\">›</span>' +
      '</span> my second line '
    ]
  ],
  [ 'mid-word linebreak',
    [ '<pb n="1v" type="folio" xml:id="P1v-undefined"/><cb n="P1vC1-undefined"/><lb n="P1vC1L-undefined"/><w>my</w><w>first</w><w>li' +
      '<lb n="P1vC1L-undefined" break="no"/>ne</w><w>my</w><w>second</w><w>line</w>',
      '<span class=\"mceNonEditable brea\" id=\"pb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;break_type=pb&amp;' +
      'number=1&amp;rv=v&amp;fibre_type=&amp;facs=&amp;lb_alignment=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>PB 1v<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"cb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=cb&amp;number=1&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>CB 1<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"lb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
      '</span> my first li<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=lb&amp;' +
      'number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=yes\">' +
      '<span class=\"format_start mceNonEditable\">‹</span>-<br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
      '</span>ne my second line '
    ]
  ],
  [ 'mid-word linebreak with rend attribute',
    [ '<pb n="1v" type="folio" xml:id="P1v-undefined"/><cb n="P1vC1-undefined"/><lb n="P1vC1L-undefined"/><w>my</w><w>first</w><w>li' +
      '<lb n="P1vC1L-undefined" rend="hang" break="no"/>ne</w><w>my</w><w>second</w><w>line</w>',
      '<span class=\"mceNonEditable brea\" id=\"pb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;break_type=pb&amp;' +
      'number=1&amp;rv=v&amp;fibre_type=&amp;facs=&amp;lb_alignment=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>PB 1v<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"cb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=cb&amp;number=1&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>CB 1<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"lb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
      '</span> my first li<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=lb&amp;' +
      'number=&amp;lb_alignment=hang&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=yes\">' +
      '<span class=\"format_start mceNonEditable\">‹</span>-<br/>↵← <span class=\"format_end mceNonEditable\">›</span>' +
      '</span>ne my second line '
    ],
  ],
  [ 'quire break',
    [ '<gb n="3"/><pb n="1r" type="folio" xml:id="P1r-undefined"/><cb n="P1rC1-undefined"/><lb n="P1rC1L-undefined"/>',
      '<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=gb&amp;number=3&amp;' +
			'lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
			'<span class=\"format_start mceNonEditable\">‹</span><br/>QB<span class=\"format_end mceNonEditable\">›</span>' +
			'</span><span class=\"mceNonEditable brea\" id=\"pb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
			'break_type=pb&amp;number=1&amp;rv=r&amp;fibre_type=&amp;facs=&amp;lb_alignment=&amp;hasBreak=no\">' +
			'<span class=\"format_start mceNonEditable\">‹</span><br/>PB 1r<span class=\"format_end mceNonEditable\">›</span>' +
			'</span><span class=\"mceNonEditable brea\" id=\"cb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
			'break_type=cb&amp;number=1&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
			'<span class=\"format_start mceNonEditable\">‹</span><br/>CB 1<span class=\"format_end mceNonEditable\">›</span>' +
			'</span><span class=\"mceNonEditable brea\" id=\"lb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
			'break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
			'<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span></span>'
    ]
  ]
]);

manuscriptPageStructure.forEach((value, key, map) => {
	test('TEI2HTML: ' + key, () => {
		let testInput, expectedOutput, html, modifiedHtml, idRegex;
    idRegex = /id="(.)b_(\d)_\d+"/g;
		testInput = xmlHead + value[0] + xmlTail;
		expectedOutput = '<TEMP>' + value[1] + '</TEMP>';
		html = wce_tei.getHtmlByTei(testInput, clientOptions);
    modifiedHtml = html.htmlString.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
		expect(modifiedHtml).toBe(expectedOutput);
	});
  test('HTML2TEI: ' + key, () => {
		let testInput, expectedOutput, xml;
		testInput = value[1];
		expectedOutput = xmlHead + value[0] + xmlTail;
		xml = wce_tei.getTeiByHtml(testInput, {});
		expect(xml).toBe(expectedOutput);
	});
});

const teiToHtmlAndBackWithChange = new Map([
    [ 'a deletion with legacy corrector OMISSION',
      [ '<w>a</w><app><rdg type="orig" hand="firsthand"><w>deletion</w></rdg>' +
        '<rdg type="corr" hand="corrector" rend="underdot">OMISSION</rdg></app><w>correction</w>',
        'a <span class="corr" wce_orig="deletion" wce="__t=corr&amp;__n=corrector&amp;corrector_name_other=&amp;' +
        'corrector_name=corrector&amp;reading=corr&amp;original_firsthand_reading=deletion&amp;' +
        'common_firsthand_partial=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=1&amp;' +
        'deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;' +
        'deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=underdot&amp;firsthand_partial=&amp;' +
        'partial=&amp;corrector_text=&amp;blank_correction=on&amp;place_corr=">' +
        '<span class="format_start mceNonEditable">‹</span>deletion<span class="format_end mceNonEditable">›</span>' +
        '</span> correction ',
        '<w>a</w><app><rdg type="orig" hand="firsthand"><w>deletion</w></rdg>' +
        '<rdg type="corr" hand="corrector" rend="underdot"></rdg></app><w>correction</w>'
      ]
    ],
    [ 'an addition (correction) with legacy firsthand OMISSION',
      [ '<w>an</w><app><rdg type="orig" hand="firsthand">OMISSION</rdg><rdg type="corr" hand="corrector">' +
        '<w>addition</w></rdg></app><w>correction</w>',
        'an <span class="corr_blank_firsthand" wce="__t=corr&amp;__n=corrector&amp;corrector_name_other=&amp;' +
        'corrector_name=corrector&amp;reading=corr&amp;original_firsthand_reading=&amp;blank_firsthand=on&amp;' +
        'common_firsthand_partial=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;' +
        'deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;' +
        'deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=null&amp;firsthand_partial=&amp;' +
        'partial=&amp;corrector_text=addition%20&amp;place_corr="><span class="format_start mceNonEditable">‹</span>T' +
        '<span class="format_end mceNonEditable">›</span></span> correction ',
        '<w>an</w><app><rdg type="orig" hand="firsthand"></rdg><rdg type="corr" hand="corrector">' +
        '<w>addition</w></rdg></app><w>correction</w>'
      ]
    ],
    [ 'a handShift note with new hand, legacy for when new hand was in n attribute',
      [ '<w>a</w><w>note</w><note type="editorial" xml:id="..-undefined-2"><handshift n="new hand"/></note>',
        'a note<span class="note" wce="__t=note&amp;__n=&amp;note_text=&amp;note_type=changeOfHand&amp;' +
        'note_type_other=&amp;newHand=new%20hand"><span class="format_start mceNonEditable">‹</span>Note' +
        '<span class="format_end mceNonEditable">›</span></span>',
        '<w>a</w><w>note</w><note type="editorial" xml:id="..-undefined-2"><handShift scribe="new hand"/></note>'
      ]
    ],
		// legacy support
	  [ 'a handShift note',
	    [ '<w>a</w><w>note</w><note type="editorial" xml:id="BKV-undefined-2"><handshift/></note>',
	      'a note<span class="note" wce="__t=note&amp;__n=&amp;note_text=&amp;note_type=changeOfHand&amp;' +
	      'note_type_other=&amp;newHand="><span class="format_start mceNonEditable">‹</span>Note' +
	      '<span class="format_end mceNonEditable">›</span></span>',
				'<w>a</w><w>note</w><note type="editorial" xml:id="..-undefined-2"><handShift/></note>'
	    ]
	  ],
	  // spaces added in attribute should be replaced with _ [issue #13]
	  [ 'a handShift note with new hand',
	    [ '<w>a</w><w>note</w><note type="editorial" xml:id="BKV-undefined-2"><handshift scribe="new hand"/></note>',
	      'a note<span class="note" wce="__t=note&amp;__n=&amp;note_text=&amp;note_type=changeOfHand&amp;' +
	      'note_type_other=&amp;newHand=new%20hand"><span class="format_start mceNonEditable">‹</span>Note' +
	      '<span class="format_end mceNonEditable">›</span></span>',
				'<w>a</w><w>note</w><note type="editorial" xml:id="..-undefined-2"><handShift scribe="new hand"/></note>',
	    ]
	  ],
    [ 'hi rend ol as legacy support for overline',
      [ '<w>test</w><w><hi rend="ol">for</hi></w><w>rendering</w>',
        'test <span class="formatting_overline" wce="__t=formatting_overline" wce_orig="for">' +
        '<span class="format_start mceNonEditable">‹</span>for' +
        '<span class="format_end mceNonEditable">›</span></span> rendering ',
        '<w>test</w><w><hi rend="overline">for</hi></w><w>rendering</w>'
      ]
    ],
    [ 'book and chapter div if chapter has no type then it is removed',
  	  [ '<div type="book" n="John"><div n="John.1"><w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div></div>',
  	 		' <span class="book_number mceNonEditable" wce="__t=book_number" id="1">John</span> The content of my chapter ',
        '<div type="book" n="John"><w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div>'
   		],
  	],
		// next two tests test fix for issue #16
		[ 'whole word <ex> tag (no w wrapper and only one word in total)',
		  [ '<ex rend="÷">word</ex>',
				'<span class="part_abbr" wce="__t=part_abbr&amp;__n=&amp;exp_rend_other=&amp;exp_rend=%C3%B7">' +
	      '<span class="format_start mceNonEditable">‹</span>(word)<span class="format_end mceNonEditable">›</span>' +
	      '</span> ',
				'<w><ex rend="÷">word</ex></w>'
	 		]
		],
		[ 'whole word <ex> tag (no w wrapper and words either side)',
			[ '<w>first</w><ex rend="÷">word</ex><w>last</w>',
				'first <span class="part_abbr" wce="__t=part_abbr&amp;__n=&amp;exp_rend_other=&amp;exp_rend=%C3%B7">' +
				'<span class="format_start mceNonEditable">‹</span>(word)<span class="format_end mceNonEditable">›</span>' +
				'</span> last ',
				'<w>first</w><w><ex rend="÷">word</ex></w><w>last</w>'
			]
		],
    // not sure the next two are desireable behaviour but it is the current behaviour
    // fix this and at least keep the word [issue #14]
    [ 'hi with no rend attribute removes the word with the hi tag',
      [ '<w>test</w><w><hi>for</hi></w><w>rendering</w>',
        'test for rendering ',
        '<w>test</w><w>for</w><w>rendering</w>'
      ]
    ],
    [ 'hi with empty rend attribute removes the word with the hi tag',
      [ '<w>test</w><w><hi rend="">for</hi></w><w>rendering</w>',
        'test for rendering ',
        '<w>test</w><w>for</w><w>rendering</w>'
      ]
    ],
    // legacy commentary notes (rend attribute - for number of lines covered - now converted to line breaks)
    [ 'commentary in line with rend attribute',
      [ '<w>in</w><w>line</w><w>commentary</w><note type="commentary" rend="3">Untranscribed commentary text within the line</note>',
        'in line commentary<span class="paratext" wce="__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=3&amp;text=&amp;number=&amp;edit_number=on&amp;paratext_position=pagetop&amp;paratext_position_other=&amp;paratext_alignment=left"><span class="format_start mceNonEditable">‹</span><br/>↵[<span class="commentary" wce="__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=3">comm</span>]<br/>↵[<span class="commentary" wce="__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=3">comm</span>]<br/>↵[<span class="commentary" wce="__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=3">comm</span>]<span class="format_end mceNonEditable">›</span></span>',
        '<w>in</w><w>line</w><w>commentary</w><lb/><note type="commentary">One line of untranscribed commentary text</note><lb/><note type="commentary">One line of untranscribed commentary text</note><lb/><note type="commentary">One line of untranscribed commentary text</note>'
      ]
    ],
    [ 'lectionary in line with rend attribute',
      [ '<w>in</w><w>line</w><w>lectionary</w><note type="lectionary-other" rend="3">Lectionary text within the line</note>',
        'in line lectionary<span class=\"paratext\" wce=\"__t=paratext&amp;__n=&amp;fw_type=lectionary-other&amp;covered=3&amp;text=&amp;number=&amp;edit_number=on&amp;paratext_position=pagetop&amp;paratext_position_other=&amp;paratext_alignment=left\"><span class=\"format_start mceNonEditable\">‹</span><br/>↵[<span class=\"lectionary-other\" wce=\"__t=paratext&amp;__n=&amp;fw_type=lectionary-other&amp;covered=3\">lect</span>]<br/>↵[<span class=\"lectionary-other\" wce=\"__t=paratext&amp;__n=&amp;fw_type=lectionary-other&amp;covered=3\">lect</span>]<br/>↵[<span class=\"lectionary-other\" wce=\"__t=paratext&amp;__n=&amp;fw_type=lectionary-other&amp;covered=3\">lect</span>]<span class=\"format_end mceNonEditable\">›</span></span>',
        '<w>in</w><w>line</w><w>lectionary</w><lb/><note type=\"lectionary-other\">One line of untranscribed lectionary text</note><lb/><note type=\"lectionary-other\">One line of untranscribed lectionary text</note><lb/><note type=\"lectionary-other\">One line of untranscribed lectionary text</note>'
      ]
    ],
		// legacy support for referencing system
		[ 'book, chapter and verse (legacy)',
	    [ '<div type="book" n="B04"><div type="chapter" n="B04K1"><ab n="B04K1V1"><w>first</w><w>verse</w></ab></div></div>',
	      ' <span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"1\">John</span>  <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"2\">1</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> first verse ',
				'<div type="book" n="John"><div type="chapter" n="John.1"><ab n="John.1.1"><w>first</w><w>verse</w></ab></div></div>'
	    ]
	  ],
		// legacy support for incipit and explicit (already having updated book which will need to be handled separately)
		[ 'book and incipit divs',
	    [ '<div type="book" n="B04"><div type="incipit" n="B04incipit"><ab><w>inscriptio</w><w>text</w></ab></div></div>',
	      ' <span class="book_number mceNonEditable" wce="__t=book_number" id="1">John</span>  ' +
	      '<span class="chapter_number mceNonEditable" wce="__t=chapter_number">Inscriptio</span> ' +
	      '<span class="verse_number mceNonEditable" wce="__t=verse_number"/> inscriptio text ',
				'<div type="book" n="John"><div type="inscriptio"><ab n="John.inscriptio"><w>inscriptio</w><w>text</w></ab></div></div>'
	    ]
	  ],
	  [ 'book and explicit div',
	    [ '<div type="book" n="B04"><div type="explicit" n="B04explicit"><ab><w>subscriptio</w><w>text</w></ab></div></div>',
	      ' <span class="book_number mceNonEditable" wce="__t=book_number" id="1">John</span>  ' +
	      '<span class="chapter_number mceNonEditable" wce="__t=chapter_number">Subscriptio</span> ' +
	      '<span class="verse_number mceNonEditable" wce="__t=verse_number"/> subscriptio text ',
				'<div type="book" n="John"><div type="subscriptio"><ab n="John.subscriptio"><w>subscriptio</w><w>text</w></ab></div></div>'
	    ]
	  ]
]);

teiToHtmlAndBackWithChange.forEach((value, key, map) => {
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
		expectedOutput = xmlHead + value[2] + xmlTail;
		xml = wce_tei.getTeiByHtml(testInput, {});
		expect(xml).toBe(expectedOutput);
	});
});

// test layout of export (word spaces)
const exportSpaces = new Map([
  [ 'test spaces are added to export w and pc',
    ['<w>test</w><w>word</w>spaces<w></w><pc>.</pc><w>with</w><w>punctuation</w><pc>.</pc>',
     'test word spaces <span class=\"pc\" wce=\"__t=pc\"><span class=\"format_start mceNonEditable\">‹</span>.' +
     '<span class=\"format_end mceNonEditable\">›</span></span> with punctuation <span class=\"pc\" wce=\"__t=pc\">' +
     '<span class=\"format_start mceNonEditable\">‹</span>.<span class=\"format_end mceNonEditable\">›</span></span> ',
     '<w>test</w> <w>word</w> <w>spaces</w><pc>.</pc> <w>with</w> <w>punctuation</w><pc>.</pc>'
    ]
  ],
  [ 'test spaces can be uploaded and exported without problems w and pc',
    ['<w>test</w> <w>word</w> <w>spaces</w><pc>.</pc> <w>with</w> <w>punctuation</w><pc>.</pc>',
     'test word spaces <span class=\"pc\" wce=\"__t=pc\"><span class=\"format_start mceNonEditable\">‹</span>.' +
     '<span class=\"format_end mceNonEditable\">›</span></span> with punctuation <span class=\"pc\" wce=\"__t=pc\">' +
     '<span class=\"format_start mceNonEditable\">‹</span>.<span class=\"format_end mceNonEditable\">›</span></span> ',
     '<w>test</w> <w>word</w> <w>spaces</w><pc>.</pc> <w>with</w> <w>punctuation</w><pc>.</pc>'
    ]
  ],
  [ 'test spaces are added to export seg and w',
    ['<w>test</w><w>a</w><w>seg</w><seg type="margin" subtype="pageright"><w>seg</w><w>content</w></seg><w>with</w>' +
     '<w>spaces</w>',
     'test a seg <span class=\"paratext\" wce=\"__t=paratext&amp;__n=&amp;marginals_text=seg%20content%20' +
     '&amp;fw_type=isolated&amp;fw_type_other=&amp;paratext_position=pageright&amp;paratext_position_other=\">' +
     '<span class=\"format_start mceNonEditable\">‹</span>fw<span class=\"format_end mceNonEditable\">›</span>' +
     '</span>with spaces ',
     '<w>test</w> <w>a</w> <w>seg</w><seg type="margin" subtype="pageright"><w>seg</w> <w>content</w></seg> ' +
     '<w>with</w> <w>spaces</w>'
    ]
  ],
  [ 'test spaces are added to export app and w combinations',
    ['<w>test</w><w>spaces</w><app><rdg type="orig" hand="firsthand"><w>arround</w></rdg>' +
    '<rdg type="corr" hand="corrector"><w>around</w></rdg></app><w>corrections</w>',
     'test spaces <span class=\"corr\" wce_orig=\"arround\" wce=\"__t=corr&amp;__n=corrector' +
     '&amp;corrector_name_other=&amp;corrector_name=corrector&amp;reading=corr&amp;' +
     'original_firsthand_reading=arround&amp;common_firsthand_partial=&amp;deletion_erased=0&amp;' +
     'deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0' +
     '&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=null' +
     '&amp;firsthand_partial=&amp;partial=&amp;corrector_text=around%20&amp;place_corr=\">' +
     '<span class=\"format_start mceNonEditable\">‹</span>arround<span class=\"format_end mceNonEditable\">›</span>' +
     '</span> corrections ',
     '<w>test</w> <w>spaces</w> <app><rdg type="orig" hand="firsthand"><w>arround</w></rdg>' +
     '<rdg type="corr" hand="corrector"><w>around</w></rdg></app> <w>corrections</w>'
    ]
  ],
  [ 'test spaces are added to export app and pc combination',
    ['<w>test</w><w>spaces</w><pc>.</pc><app><rdg type="orig" hand="firsthand"><w>arround</w></rdg>' +
     '<rdg type="corr" hand="corrector"><w>around</w></rdg></app><w>corrections</w>',
     'test spaces <span class=\"pc\" wce=\"__t=pc\"><span class=\"format_start mceNonEditable\">‹</span>.' +
     '<span class=\"format_end mceNonEditable\">›</span></span> <span class=\"corr\" wce_orig=\"arround\" ' +
     'wce=\"__t=corr&amp;__n=corrector&amp;corrector_name_other=&amp;corrector_name=corrector&amp;reading=corr' +
     '&amp;original_firsthand_reading=arround&amp;common_firsthand_partial=&amp;deletion_erased=0&amp;' +
     'deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0' +
     '&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=null' +
     '&amp;firsthand_partial=&amp;partial=&amp;corrector_text=around%20&amp;place_corr=\">' +
     '<span class=\"format_start mceNonEditable\">‹</span>arround<span class=\"format_end mceNonEditable\">›</span>' +
     '</span> corrections ',
     '<w>test</w> <w>spaces</w><pc>.</pc> <app><rdg type="orig" hand="firsthand"><w>arround</w></rdg>' +
     '<rdg type="corr" hand="corrector"><w>around</w></rdg></app> <w>corrections</w>'
    ]
  ],
  [ 'test spaces are added after notes between words',
    ['<w>test</w><w>note</w><note type="local" xml:id="BKV--2">my test note</note><w>between</w><w>words</w>',
     'test note<span class=\"note\" wce=\"__t=note&amp;__n=&amp;note_text=my%20test%20note&amp;' +
     'note_type=local&amp;newhand=\"><span class=\"format_start mceNonEditable\">‹</span>Note' +
     '<span class=\"format_end mceNonEditable\">›</span></span> between words ',
     '<w>test</w> <w>note</w><note type="local" xml:id="BKV-undefined-2">my test note</note> <w>between</w> <w>words</w>'
    ]
  ],
  [ 'test spaces are added after notes before app',
    ['<w>test</w><w>note</w><note type="local" xml:id="BKV--2">my test note</note><app>' +
     '<rdg type="orig" hand="firsthand"><w>before</w><w>app</w></rdg><rdg type="corr" hand="corrector"></rdg></app>',
     'test note<span class=\"note\" wce=\"__t=note&amp;__n=&amp;note_text=my%20test%20note&amp;note_type=local&amp;' +
     'newhand=\"><span class=\"format_start mceNonEditable\">‹</span>Note<span class=\"format_end mceNonEditable\">›' +
     '</span></span> <span class=\"corr\" wce_orig=\"before%20app\" wce=\"__t=corr&amp;__n=corrector&amp;' +
     'corrector_name_other=&amp;corrector_name=corrector&amp;reading=corr&amp;original_firsthand_reading=' +
     'before%20app&amp;common_firsthand_partial=&amp;deletion_erased=0&amp;deletion_underline=0&amp;' +
     'deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0' +
     '&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=null&amp;firsthand_partial=&amp;partial=' +
     '&amp;corrector_text=&amp;blank_correction=on&amp;place_corr=\"><span class=\"format_start mceNonEditable\">‹' +
     '</span>before app<span class=\"format_end mceNonEditable\">›</span></span>',
     '<w>test</w> <w>note</w><note type="local" xml:id="BKV-undefined-2">my test note</note> <app>' +
     '<rdg type="orig" hand="firsthand"><w>before</w> <w>app</w></rdg><rdg type="corr" hand="corrector"></rdg></app>'
    ]
  ],
  [ 'test spaces are added between verses',
    ['<div type="book" n="B01"><div type="chapter" n="B01K1"><ab n="B01K1V1"><w>test</w><w>spaces</w></ab>' +
     '<ab n="B01K1V2"><w>between</w><w>verses</w></ab></div></div>',
     ' <span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"1\">1</span>  ' +
     '<span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"2\">1</span> ' +
     '<span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> test spaces ' +
     '<span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">2</span> between verses ',
     '<div type="book" n="B01"><div type="chapter" n="B01K1"><ab n="B01K1V1"><w>test</w> <w>spaces</w></ab> ' +
     '<ab n="B01K1V2"><w>between</w> <w>verses</w></ab></div> </div>'
    ]
  ],
  [ 'test spaces are added between word and space',
    ['<w>word</w><w>then</w><w>space</w><space unit="char" extent="5"/><w>and</w><w>more</w><w>words</w>',
     'word then space <span class=\"spaces\" wce=\"__t=spaces&amp;__n=&amp;sp_unit_other=&amp;sp_unit=char&amp;' +
     'sp_extent=5\"><span class=\"format_start mceNonEditable\">‹</span>sp' +
     '<span class=\"format_end mceNonEditable\">›</span></span>and more words ',
     '<w>word</w> <w>then</w> <w>space</w> <space unit="char" extent="5"/><w>and</w> <w>more</w> <w>words</w>'
    ]
  ],
  [ 'test spaces are added between word and gap and word',
    ['<w>word</w><w>then</w><w>gap</w><gap reason="illegible" unit="char" extent="5"/><w>and</w><w>more</w><w>words</w>',
     'word then gap <span class=\"gap\" wce=\"__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;' +
     'gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;' +
     'gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit_other=&amp;' +
     'unit=char&amp;extent=5\"><span class=\"format_start mceNonEditable\">‹</span>[5]' +
     '<span class=\"format_end mceNonEditable\">›</span></span> and more words ',
     '<w>word</w> <w>then</w> <w>gap</w> <gap reason="illegible" unit="char" extent="5"/> <w>and</w> <w>more</w> <w>words</w>'
    ]
  ],
  [ 'test space is added after chapter when ending with w',
    ['<div type="book" n="B01"><div type="chapter" n="B01K1"><ab n="B01K1V1"><w>space</w><w>after</w><w>chapter</w>' +
     '</ab></div><div type="chapter" n="B01K2"><ab n="B01K2V1"><w>next</w><w>chapter</w></ab></div></div>',
     ' <span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"1\">1</span>  <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"2\">1</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> space after chapter  <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"3\">2</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> next chapter ',
     '<div type="book" n="B01"><div type="chapter" n="B01K1"><ab n="B01K1V1"><w>space</w> <w>after</w> <w>chapter</w>' +
     '</ab></div> <div type="chapter" n="B01K2"><ab n="B01K2V1"><w>next</w> <w>chapter</w></ab></div> </div>'
    ]
  ],
  [ 'test space is added after chapter when ending with pc',
    ['<div type="book" n="B01"><div type="chapter" n="B01K1"><ab n="B01K1V1"><w>space</w><w>after</w><w>chapter</w>' +
     '<w>with</w><w>pc</w><pc>.</pc></ab></div><div type="chapter" n="B01K2"><ab n="B01K2V1"><w>next</w>' +
     '<w>chapter</w></ab></div></div>',
     ' <span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"1\">1</span>  <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"2\">1</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> space after chapter with pc <span class=\"pc\" wce=\"__t=pc\"><span class=\"format_start mceNonEditable\">‹</span>.<span class=\"format_end mceNonEditable\">›</span></span>  <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"3\">2</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> next chapter ',
     '<div type="book" n="B01"><div type="chapter" n="B01K1"><ab n="B01K1V1"><w>space</w> <w>after</w> ' +
     '<w>chapter</w> <w>with</w> <w>pc</w><pc>.</pc></ab></div> <div type="chapter" n="B01K2"><ab n="B01K2V1">' +
     '<w>next</w> <w>chapter</w></ab></div> </div>'
    ]
  ],

]);

exportSpaces.forEach((value, key, map) => {
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
		expectedOutput = xmlHead + value[2] + xmlTail;
		xml = wce_tei.getTeiByHtml(testInput, {'addSpaces': true});
		expect(xml).toBe(expectedOutput);
	});
});


// test layout of export (linebreaks)
const exportLayout = new Map([
  [ 'test input without linebreaks in XML get them added on export',
    ['<pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/><w>test</w><w>that</w><w>line</w>' +
     '<w>breaks</w><lb n="P1rC1L-"/><w>are</w><w>added</w><w>in</w><w>XML</w>',
     '<span class=\"mceNonEditable brea\" id=\"pb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
     'break_type=pb&amp;number=1&amp;rv=r&amp;fibre_type=&amp;facs=&amp;lb_alignment=&amp;hasBreak=no\">' +
     '<span class=\"format_start mceNonEditable\">‹</span><br/>PB 1r<span class=\"format_end mceNonEditable\">›</span>' +
     '</span><span class=\"mceNonEditable brea\" id=\"cb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
     'break_type=cb&amp;number=1&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
     '<span class=\"format_start mceNonEditable\">‹</span><br/>CB 1<span class=\"format_end mceNonEditable\">›</span>' +
     '</span><span class=\"mceNonEditable brea\" id=\"lb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;break_type=lb&amp;' +
     'number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
     '<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
     '</span> test that line breaks <span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;' +
     'break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
     '<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
     '</span> are added in XML ',
     '\n<pb n="1r" type="folio" xml:id="P1r-undefined"/>\n<cb n="P1rC1-undefined"/>\n<lb n="P1rC1L-undefined"/><w>test</w><w>that</w><w>line</w>' +
     '<w>breaks</w>\n<lb n="P1rC1L-undefined"/><w>are</w><w>added</w><w>in</w><w>XML</w>'
    ]
  ],
  [ 'test input with linebreaks in XML still has them on export',
    ['\n<pb n="1r" type="folio" xml:id="P1r-"/>\n<cb n="P1rC1-"/>\n<lb n="P1rC1L-"/><w>test</w><w>that</w><w>line</w>' +
      '<w>breaks</w>\n<lb n="P1rC1L-"/><w>are</w><w>added</w><w>in</w><w>XML</w>',
      '<span class=\"mceNonEditable brea\" id=\"pb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=pb&amp;number=1&amp;rv=r&amp;fibre_type=&amp;facs=&amp;lb_alignment=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>PB 1r<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"cb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=cb&amp;number=1&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>CB 1<span class=\"format_end mceNonEditable\">›</span>' +
      '</span><span class=\"mceNonEditable brea\" id=\"lb_3_MATH.RAND\" wce=\"__t=brea&amp;__n=&amp;break_type=lb&amp;' +
      'number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
      '</span> test that line breaks <span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;' +
      'break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no\">' +
      '<span class=\"format_start mceNonEditable\">‹</span><br/>↵ <span class=\"format_end mceNonEditable\">›</span>' +
      '</span> are added in XML ',
      '\n<pb n="1r" type="folio" xml:id="P1r-undefined"/>\n<cb n="P1rC1-undefined"/>\n<lb n="P1rC1L-undefined"/><w>test</w><w>that</w><w>line</w>' +
      '<w>breaks</w>\n<lb n="P1rC1L-undefined"/><w>are</w><w>added</w><w>in</w><w>XML</w>'
    ]
  ]
]);

exportLayout.forEach((value, key, map) => {
	test('TEI2HTML: ' + key, () => {
		let testInput, expectedOutput, html, idRegex;
		testInput = xmlHead + value[0] + xmlTail;
    idRegex = /id="(.)b_(\d)_\d+"/g;
		expectedOutput = '<TEMP>' + value[1] + '</TEMP>';
		html = wce_tei.getHtmlByTei(testInput, clientOptions);
    modifiedHtml = html.htmlString.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
		expect(modifiedHtml).toBe(expectedOutput);
	});
  test('HTML2TEI: ' + key, () => {
		let testInput, expectedOutput, xml;
		testInput = value[1];
		expectedOutput = xmlHead + value[2] + xmlTail;
		xml = wce_tei.getTeiByHtml(testInput, {'addLineBreaks': true});
		expect(xml).toBe(expectedOutput);
	});
});


// this does not test what I was hoping it would
test ('test export of abbr where supplied and overline need flipping', () => {
  let testInput, expectedOutput, xml;
  testInput = 'supplied abbreviation <span class="abbr" wce_orig="%3Cspan%20class%3D%22formatting_overline%22%20wce%3D%22__t%3Dformatting_overline%22%20wce_orig%3D%22i%22%3E%3Cspan%20class%3D%22format_start%20mceNonEditable%22%3E%E2%80%B9%3C%2Fspan%3Ei%3Cspan%20class%3D%22format_end%20mceNonEditable%22%3E%E2%80%BA%3C%2Fspan%3E%3C%2Fspan%3E%3Cspan%20class%3D%22gap%22%20wce_orig%3D%22%253Cspan%2520class%253D%2522formatting_overline%2522%2520wce%253D%2522__t%253Dformatting_overline%2522%2520wce_orig%253D%2522h%2522%253E%253Cspan%2520class%253D%2522format_start%2520mceNonEditable%2522%253E%25E2%2580%25B9%253C%252Fspan%253Eh%253Cspan%2520class%253D%2522format_end%2520mceNonEditable%2522%253E%25E2%2580%25BA%253C%252Fspan%253E%253C%252Fspan%253E%22%20wce%3D%22__t%3Dgap%26amp%3B__n%3D%26amp%3Bgap_reason_dummy_lacuna%3Dlacuna%26amp%3Bgap_reason_dummy_illegible%3Dillegible%26amp%3Bgap_reason_dummy_unspecified%3Dunspecified%26amp%3Bgap_reason_dummy_inferredPage%3DinferredPage%26amp%3Bsupplied_source_other%3D%26amp%3Bsupplied_source%3Dna28%26amp%3Bgap_reason%3Dillegible%26amp%3Bunit_other%3D%26amp%3Bunit%3D%26amp%3Bmark_as_supplied%3Dsupplied%22%3E%3Cspan%20class%3D%22format_start%20mceNonEditable%22%3E%E2%80%B9%3C%2Fspan%3E%5B%3Cspan%20class%3D%22formatting_overline%22%20wce%3D%22__t%3Dformatting_overline%22%20wce_orig%3D%22h%22%3E%3Cspan%20class%3D%22format_start%20mceNonEditable%22%3E%E2%80%B9%3C%2Fspan%3Eh%3Cspan%20class%3D%22format_end%20mceNonEditable%22%3E%E2%80%BA%3C%2Fspan%3E%3C%2Fspan%3E%5D%3Cspan%20class%3D%22format_end%20mceNonEditable%22%3E%E2%80%BA%3C%2Fspan%3E%3C%2Fspan%3E" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;abbr_type_other=&amp;abbr_type=nomSac"><span class="format_start mceNonEditable">‹</span><span class="formatting_overline" wce_orig="i" wce="__t=formatting_overline"><span class="format_start mceNonEditable">‹</span>i<span class="format_end mceNonEditable">›</span></span><span class="gap" wce_orig="%3Cspan%20class%3D%22formatting_overline%22%20wce%3D%22__t%3Dformatting_overline%22%20wce_orig%3D%22h%22%3E%3Cspan%20class%3D%22format_start%20mceNonEditable%22%3E%E2%80%B9%3C%2Fspan%3Eh%3Cspan%20class%3D%22format_end%20mceNonEditable%22%3E%E2%80%BA%3C%2Fspan%3E%3C%2Fspan%3E" wce="__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;supplied_source_other=&amp;supplied_source=na28&amp;gap_reason=illegible&amp;unit_other=&amp;unit=&amp;mark_as_supplied=supplied"><span class="format_start mceNonEditable">‹</span>[<span class="formatting_overline" wce_orig="h" wce="__t=formatting_overline"><span class="format_start mceNonEditable">‹</span>h<span class="format_end mceNonEditable">›</span></span>]<span class="format_end mceNonEditable">›</span></span><span class="format_end mceNonEditable">›</span></span>';
  expectedOutput = xmlHead + '<w>supplied</w><w>abbreviation</w><w><abbr type="nomSac"><hi rend="overline">i</hi><supplied source="na28" reason="illegible"><hi rend="overline">h</hi></supplied></abbr></w>' + xmlTail;
  xml = wce_tei.getTeiByHtml(testInput, {});
  expect(xml).toBe(expectedOutput);
});

// other unit test which need dom

// Error handling shouldn't have undefined args printed out in the alert
// Might need to mock window.alert of the error function for this [issue #19]
test('Invalid XML gives error', () => {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  html = wce_tei.getHtmlByTei('<w>broken<w>', clientOptions);
  expect(window.alert).toBeCalledWith('Error:\n XML parser 1:12: unclosed tag: w');
});


test ('node comparison', () => {
  const dom = wce_tei.loadXMLString('<body><w>word</w><w>test</w><w n="2">test</w><w n="3"></w><w n="3">text</w>textNode<notW>check</notW></body>');
  const root = dom.documentElement;
  const childList = root.childNodes;
  expect(wce_tei.compareNodes(childList[0], childList[1])).toBe(true);
  expect(wce_tei.compareNodes(childList[1], childList[2])).toBe(false);
  expect(wce_tei.compareNodes(childList[2], childList[3])).toBe(false);
  expect(wce_tei.compareNodes(childList[3], childList[4])).toBe(true);
  expect(wce_tei.compareNodes(childList[4], childList[5])).toBe(false);
  expect(wce_tei.compareNodes(childList[0], childList[6])).toBe(false);
});

test ('hasWAncestor', () => {
  const dom = wce_tei.loadXMLString('<text><body><w>word</w><ex>expansion</ex><w>pa<ex>rt</ex></w><w><unclear>unclear</unclear></w></body></text>');
  const root = dom.documentElement;
  const body = root.childNodes[0];
	const childList = body.childNodes;
  expect(wce_tei.hasWAncestor(childList[0])).toBe(true);
	expect(wce_tei.hasWAncestor(childList[1])).toBe(false);
	expect(wce_tei.hasWAncestor(childList[2])).toBe(true);
	expect(wce_tei.hasWAncestor(childList[2])).toBe(true);
	expect(wce_tei.hasWAncestor(body)).toBe(false);
});
