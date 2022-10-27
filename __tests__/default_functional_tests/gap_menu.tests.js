const puppeteer = require('puppeteer');
const path = require('path');

let browser, page, frame;

// store the top and tail of the js so the tests can reuse and only focus on the content of the <body> tag
const xmlHead = '<?xml  version="1.0" encoding="utf-8"?><!DOCTYPE TEI [<!ENTITY om ""><!ENTITY lac ""><!ENTITY lacorom "">]>' +
  '<?xml-model href="TEI-NTMSS.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>' +
  '<TEI xmlns="http://www.tei-c.org/ns/1.0">' +
  '<teiHeader><fileDesc><titleStmt><title/></titleStmt>' +
  '<publicationStmt><publisher/></publicationStmt>' +
  '<sourceDesc><msDesc><msIdentifier></msIdentifier></msDesc></sourceDesc>' +
  '</fileDesc></teiHeader><text><body>';
const xmlTail = '</body></text></TEI>';

jest.setTimeout(5000000);

beforeAll(async () => {
  browser = await puppeteer.launch({
    // for local testing
    // headless: false,
    // slowMo: 80,
    // args: ['--window-size=1920,1080', '--disable-web-security']

    // for online testing (only ever commit these)
    headless: true,
    slowMo: 60,
    args: ['--disable-web-security']
  });
});

afterAll(async () => {
  await browser.close();
});

beforeEach(async () => {
  let frameHandle;
  jest.setTimeout(5000000);
  page = await browser.newPage();
  // await page.goto(`file:${path.join(__dirname, '..', 'wce-ote', 'index.html')}`);
  await page.goto(`file:${path.join(__dirname, '../test_index_page.html')}`);
  await page.evaluate(`setWceEditor('wce_editor', {})`);
  page.waitForSelector("#wce_editor_ifr");
  frameHandle = null;
  while (frameHandle === null) {
    frameHandle = await page.$("iframe[id='wce_editor_ifr']");
  }
  frame = await frameHandle.contentFrame();

});


describe('testing gap menu', () => {

  // gaps
  test('gap between words', async () => {
    await frame.type('body#tinymce', 'this  continues');
    for (let i = 0; i < ' continues'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="unit"]', 'char');
    await menuFrame.type('input#extent', '10');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('this <span class=\"gap\" wce_orig=\"\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=char&amp;unit_other=&amp;extent=10&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=\"><span class=\"format_start mceNonEditable\">‹</span>[10]<span class=\"format_end mceNonEditable\">›</span></span> continues');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>this</w><gap reason="illegible" unit="char" extent="10"/><w>continues</w>' + xmlTail);
  }, 200000);

  test('gap between words no details given', async () => {
    await frame.type('body#tinymce', 'this  continues');
    for (let i = 0; i < ' continues'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#gap_reason_dummy_unspecified');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('this <span class=\"gap\" wce_orig=\"\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=unspecified&amp;unit=&amp;unit_other=&amp;extent=&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=\"><span class=\"format_start mceNonEditable\">‹</span>[...]<span class=\"format_end mceNonEditable\">›</span></span> continues');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>this</w><gap reason="unspecified"/><w>continues</w>' + xmlTail);
  }, 200000);

  test('gap within word', async () => {
    await frame.type('body#tinymce', 'wo');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="unit"]', 'char');
    await menuFrame.type('input#extent', '2');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('wo<span class=\"gap\" wce_orig=\"\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=char&amp;unit_other=&amp;extent=2&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=\"><span class=\"format_start mceNonEditable\">‹</span>[2]<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>wo<gap reason="illegible" unit="char" extent="2"/></w>' + xmlTail);
  }, 200000);

  test('gap within word no unit given', async () => {
    await frame.type('body#tinymce', 'wo');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('wo<span class=\"gap\" wce_orig=\"\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=&amp;unit_other=&amp;extent=&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=\"><span class=\"format_start mceNonEditable\">‹</span>[...]<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>wo<gap reason="illegible"/></w>' + xmlTail);
  }, 200000);

  // it is not possible to keep extent empty when entering in the console

  test('gap with unit line and extent part', async () => {
    await frame.type('body#tinymce', 'missing line');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="unit"]', 'line');
    await menuFrame.click('input#extent_part');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });
    const idRegex = /id="gap_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="gap_$1_MATH.RAND"');
    expect(modifiedHtml).toBe('missing line<span class=\"gap\" wce_orig=\"\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=line&amp;unit_other=&amp;extent=part&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=\" id=\"gap_2_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span>[...]<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>missing</w><w>line<gap reason="illegible" unit="line" extent="part"/></w>' + xmlTail);
  }, 200000);

  test('gap with unit line and unspecified extent', async () => {
    await frame.type('body#tinymce', 'missing line');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="unit"]', 'line');
    await menuFrame.click('input#extent_unspecified');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });
    const idRegex = /id="gap_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="gap_$1_MATH.RAND"');
    expect(modifiedHtml).toBe('missing line<span class=\"gap\" wce_orig=\"\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=line&amp;unit_other=&amp;extent=unspecified&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=\" id=\"gap_2_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span>[...]<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>missing</w><w>line<gap reason="illegible" unit="line" extent="unspecified"/></w>' + xmlTail);
  }, 200000);


  test('missing quire', async () => {
    await frame.type('body#tinymce', 'missing  quire');
    for (let i = 0; i < ' quire'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="unit"]', 'quire');
    await menuFrame.click('input#gap_reason_dummy_lacuna');
    await menuFrame.type('input#extent', '1');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });
    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('missing <span class=\"gap\" wce_orig=\"\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=lacuna&amp;unit=quire&amp;unit_other=&amp;extent=1&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=\"><span class=\"format_start mceNonEditable\">‹</span><br />QB<br />[...]<span class=\"format_end mceNonEditable\">›</span></span> quire');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>missing</w><gap reason="lacuna" unit="quire" extent="1"/><w>quire</w>' + xmlTail);
  }, 200000);

  test('missing pages', async () => {
    await frame.type('body#tinymce', 'missing  pages');
    for (let i = 0; i < ' pages'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="unit"]', 'page');
    await menuFrame.click('input#gap_reason_dummy_lacuna');
    await menuFrame.type('input#extent', '2');
    await menuFrame.click('input#insert');
    const idRegex = /id="(\D+)_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('missing <span class=\"gap\" wce_orig=\"\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=lacuna&amp;unit=page&amp;unit_other=&amp;extent=2&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;supplied_source=na28&amp;supplied_source_other=\" id=\"gap_4_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />PB<br />[...]<br />PB<br />[...]<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=pb&amp;number=1&amp;rv=r&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"pb_4_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />PB 1r<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"cb_4_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />CB 1<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"lb_4_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span>  pages');
    const xmlData = await page.evaluate(`getTEI()`);
    // NB when created in the editor the XML is different compared to this test starting from XML input (page, col and line breaks added here for last page)
    expect(xmlData).toBe(xmlHead + '<w>missing</w><gap reason="lacuna" unit="page" extent="2"/><pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/><w>pages</w>' + xmlTail);
  }, 200000);

  test('gap witness end', async () => {
    await frame.type('body#tinymce', 'the end of the witness ');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('the end of the witness <span class=\"witnessend\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;gap_reason=witnessEnd&amp;unit=&amp;unit_other=&amp;extent=&amp;supplied_source=na28&amp;supplied_source_other=&amp;insert=Insert&amp;cancel=Cancel\"><span class=\"format_start mceNonEditable\">‹</span>Witness End<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>the</w><w>end</w><w>of</w><w>the</w><w>witness</w><gap reason="witnessEnd"/>' + xmlTail);
  }, 200000);

  test('supplied word', async () => {
    await frame.type('body#tinymce', 'a supplied word');
    for (let i = 0; i < ' word'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'supplied'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    // NB: when test is selected makr as supplied is automatically checked
    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a <span class=\"gap\" wce_orig=\"supplied\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=&amp;unit_other=&amp;extent=&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;mark_as_supplied=supplied&amp;supplied_source=na28&amp;supplied_source_other=\"><span class=\"format_start mceNonEditable\">‹</span>[supplied]<span class=\"format_end mceNonEditable\">›</span></span> word');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><w><supplied source="na28" reason="illegible">supplied</supplied></w><w>word</w>' + xmlTail);
  }, 200000);

  test('multi-word/part-word supplied with no source given', async () => {
    await frame.type('body#tinymce', 'a supplied word');
    for (let i = 0; i < 'rd'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'supplied wo'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');

    // open D menu
    await page.click('button#mceu_12-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    // NB: when test is selected makr as supplied is automatically checked
    await menuFrame.select('select[id="supplied_source"]', 'none');
    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a <span class=\"gap\" wce_orig=\"supplied%20wo\" wce=\"__t=gap&amp;__n=&amp;original_gap_text=&amp;help=Help&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;gap_reason=illegible&amp;unit=&amp;unit_other=&amp;extent=&amp;extent_unspecified=Extent%3DUnspecified&amp;extent_part=Extent%3DPart&amp;mark_as_supplied=supplied&amp;supplied_source=none&amp;supplied_source_other=\"><span class=\"format_start mceNonEditable\">‹</span>[supplied wo]<span class=\"format_end mceNonEditable\">›</span></span>rd');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><w><supplied reason="illegible">supplied</supplied></w><w><supplied reason="illegible">wo</supplied>rd</w>' + xmlTail);
  }, 200000);

});