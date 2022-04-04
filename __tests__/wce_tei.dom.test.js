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
  // this seems like overkill in the html doesn't it?
  [ 'nomen sacrum abbreviation with overline in supplied',
    [ '<w><supplied source="na28" reason="illegible">a</supplied></w><w><supplied source="na28" reason="illegible">' +
      '<abbr type="nomSac"><hi rend="overline">ns</hi></abbr></supplied></w>' +
      '<w><supplied source="na28" reason="illegible">abbreviation</supplied></w>',
      '<span class=\"gap\" wce_orig=\"a%20%3Cspan%20class%3D%22abbr_add_overline%22%20wce%3D%22__t%3Dabbr%26amp%3B__n%3D%26amp%3Boriginal_abbr_text%3D%26amp%3Badd_overline%3Doverline%26amp%3Babbr_type_other%3D%26amp%3Babbr_type%3DnomSac%22%20wce_orig%3D%22ns%22%3E%3Cspan%20class%3D%22format_start%20mceNonEditable%22%3E%E2%80%B9%3C%2Fspan%3Ens%3Cspan%20class%3D%22format_end%20mceNonEditable%22%3E%E2%80%BA%3C%2Fspan%3E%3C%2Fspan%3E%20abbreviation\" wce=\"__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;supplied_source_other=&amp;supplied_source=na28&amp;gap_reason=illegible&amp;unit_other=&amp;unit=&amp;mark_as_supplied=supplied\"><span class=\"format_start mceNonEditable\">‹</span>[a <span class=\"abbr_add_overline\" wce=\"__t=abbr&amp;__n=&amp;original_abbr_text=&amp;add_overline=overline&amp;abbr_type_other=&amp;abbr_type=nomSac\" wce_orig=\"ns\"><span class=\"format_start mceNonEditable\">‹</span>ns<span class=\"format_end mceNonEditable\">›</span></span> abbreviation]<span class=\"format_end mceNonEditable\">›</span></span> '
    ]
  ],


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
      'deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=underline&amp;firsthand_partial=&amp;partial=&amp;corrector_text=&amp;blank_correction=on&amp;place_corr="><span class="format_start mceNonEditable">‹</span>consecutive<span class="format_end mceNonEditable">›</span></span> <span class="corr" wce_orig="corrections" wce="__t=corr&amp;__n=corrector&amp;corrector_name_other=&amp;corrector_name=corrector&amp;reading=corr&amp;original_firsthand_reading=corrections&amp;common_firsthand_partial=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=null&amp;firsthand_partial=&amp;partial=&amp;corrector_text=correction%20&amp;place_corr="><span class="format_start mceNonEditable">‹</span>corrections<span class="format_end mceNonEditable">›</span></span>'
    ]
  ],
  // notes
  // another undefined issue
  [ 'a local note',
    [ '<w>a</w><w>note</w><note type="local" xml:id="BKV-undefined-2">my new local note</note>',
      'a note<span class="note" wce="__t=note&amp;__n=&amp;note_text=my%20new%20local%20note&amp;' +
      'note_type=local&amp;newhand="><span class="format_start mceNonEditable">‹</span>Note' +
      '<span class="format_end mceNonEditable">›</span></span>'
    ]
  ],
  // a handshift note - OTE-TODO needs to be changed to handShift
  [ 'a handShift note',
    [ '<w>a</w><w>note</w><note type="editorial" xml:id="BKV-undefined-2"><handshift/></note>',
      'a note<span class="note" wce="__t=note&amp;__n=&amp;note_text=&amp;note_type=changeOfHand&amp;' +
      'note_type_other=&amp;newHand="><span class="format_start mceNonEditable">‹</span>Note' +
      '<span class="format_end mceNonEditable">›</span></span>'
    ]
  ],
  // OTE-TODO spaces added in attribute should be replaced with _?
  [ 'a handShift note with new hand',
    [ '<w>a</w><w>note</w><note type="editorial" xml:id="BKV-undefined-2"><handshift scribe="new hand"/></note>',
      'a note<span class="note" wce="__t=note&amp;__n=&amp;note_text=&amp;note_type=changeOfHand&amp;' +
      'note_type_other=&amp;newHand=new%20hand"><span class="format_start mceNonEditable">‹</span>Note' +
      '<span class="format_end mceNonEditable">›</span></span>'
    ]
  ],
  // commentary
  // OTE-TODO this tests the paratext function but there is also code relating to commentary left in note function
  // which probably needs to be removed as I can't see any way it would be used in the interface.
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
  // pb, cb and lb
  // [ 'page, column and line breaks',
  //   [ '<pb n="1r" type="folio" xml:id="P1r-undefined"/><cb n="P1rC1-undefined"/><lb n="P1rC1L-undefined"/>',
  //     '<span class="mceNonEditable brea" wce="__t=brea&amp;__n=&amp;break_type=pb&amp;number=1&amp;rv=r&amp;' +
  //     'fibre_type=&amp;facs=&amp;lb_alignment=&amp;hasBreak=no" id="pb_3_1649011885292667">' +
  //     '<span class="format_start mceNonEditable">‹</span><br/>PB 1r<span class="format_end mceNonEditable">›</span>' +
  //     '</span><span class="mceNonEditable brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;' +
  //     'lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no" id="cb_3_1649011885292667">' +
  //     '<span class="format_start mceNonEditable">‹</span><br/>CB 1<span class="format_end mceNonEditable">›</span>' +
  //     '</span><span class="mceNonEditable brea" wce="__t=brea&amp;__n=&amp;break_type=lb&amp;number=&amp;' +
  //     'lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no" id="lb_3_1649011885292667">' +
  //     '<span class="format_start mceNonEditable">‹</span><br/>↵ <span class="format_end mceNonEditable">›</span></span>'
  //   ]
  // ],

  // quire break (with everything that comes with it)
  // [ 'quire break',
  //   [ '<w>a</w><w>new</w><w>quire</w><w>starts</w><gb n="1"/>' +
  //     '<pb n="1r" type="folio" xml:id="P1r-undefined"/><cb n="P1rC1-undefined"/><lb n="P1rC1L-undefined"/><w>here</w>',
  //     'a new quire starts <span class="mceNonEditable brea" wce="__t=brea&amp;__n=&amp;break_type=pb&amp;' +
  //     'number=1&amp;rv=r&amp;fibre_type=&amp;facs=&amp;lb_alignment=&amp;hasBreak=no" id="pb_3_1649014573626523">' +
  //     '<span class="format_start mceNonEditable">‹</span><br />PB 1r<span class="format_end mceNonEditable">›</span>' +
  //     '</span><span class="mceNonEditable brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;' +
  //     'lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no" id="cb_3_1649014573626523">' +
  //     '<span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span>' +
  //     '</span><span class="mceNonEditable brea" wce="__t=brea&amp;__n=&amp;break_type=lb&amp;number=&amp;' +
  //     'lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no" id="lb_3_1649014573626523">' +
  //     '<span class="format_start mceNonEditable">‹</span><br />↵ <span class="format_end mceNonEditable">›</span></span> here'
  //   ]
  // ],
  // hi

  [ 'capitals',
    [ '<w><hi rend="cap" height="3">I</hi>nitial</w><w>capital</w>',
      '<span class=\"formatting_capitals\" wce=\"__t=formatting_capitals&amp;__n=&amp;capitals_height=3\" wce_orig=\"I\">' +
      '<span class=\"format_start mceNonEditable\">‹</span>I<span class=\"format_end mceNonEditable\">›</span>' +
      '</span>nitial capital '
    ]
  ],

  // space
  [ 'space',
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

const hiRendToHtmlAndBack = new Map([
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

hiRendToHtmlAndBack.forEach((value, key, map) => {
  let xmlFormat = xmlHead + '<w>test</w><w><hi rend="' + value[0] + '">for</hi></w><w>rendering</w>' + xmlTail;
  let htmlFormat = 'test <span class="' + value[1] + '" wce="__t=' + value[1] +
                   '" wce_orig="for"><span class="format_start mceNonEditable">‹</span>for' +
                   '<span class="format_end mceNonEditable">›</span></span> rendering ';
	test('TEI2HTML: ' + key, () => {
		let testInput, expectedOutput, html;
		testInput = xmlFormat;
		expectedOutput = '<TEMP>' + htmlFormat + '</TEMP>';
		html = wce_tei.getHtmlByTei(testInput);
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
      [ '<w>a</w><w>note</w><note type="editorial" xml:id="BKV-undefined-2"><handshift n="new hand"/></note>',
        'a note<span class="note" wce="__t=note&amp;__n=&amp;note_text=&amp;note_type=changeOfHand&amp;' +
        'note_type_other=&amp;newHand=new%20hand"><span class="format_start mceNonEditable">‹</span>Note' +
        '<span class="format_end mceNonEditable">›</span></span>',
        '<w>a</w><w>note</w><note type="editorial" xml:id="BKV-undefined-2"><handshift scribe="new hand"/></note>'
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
    // not sure the next two are desireable behaviour but it is the current behaviour
    // OTE-TODO: fix this and at least keep the word?
    [ 'hi with no rend attribute removes the word with the hi tag',
      [ '<w>test</w><w><hi>for</hi></w><w>rendering</w>',
        'test  rendering ',
        '<w>test</w><w>rendering</w>'
      ]
    ],
    [ 'hi with empty rend attribute removes the word with the hi tag',
      [ '<w>test</w><w><hi rend="">for</hi></w><w>rendering</w>',
        'test  rendering ',
        '<w>test</w><w>rendering</w>'
      ]
    ]
]);

teiToHtmlAndBackWithChange.forEach((value, key, map) => {
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
