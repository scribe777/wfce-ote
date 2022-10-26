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
    slowMo: 80,
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


describe('testing marginalia menu', () => {

  test('1 line of commentary text note', async () => {
    await frame.type('body#tinymce', 'some commentary ');
    await page.keyboard.press('Enter');
    await frame.type('body#tinymce', 'in here');
    await page.keyboard.press('ArrowUp');
    for (let i = 0; i < 'mentary'.length; i++) {
      await page.keyboard.press('ArrowRight');
    }

    // open M menu (although stored in a note this is created as marginalia)
    await page.click('button#mceu_15-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    // commentary is default option
    await menuFrame.type('input#covered', '1');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Backspace');

    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('some commentary<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=commentary&amp;fw_type_other=&amp;covered=1&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;marginals_text=&amp;number=&amp;edit_number=on&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span><br />↵[<span class=\"commentary\" wce=\"__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=1\">comm</span>]<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span> in here');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>some</w><w>commentary</w><lb/><note type="commentary">One line of untranscribed commentary text</note>' +
                        '<lb n="PCL-"/><w>in</w><w>here</w>' + xmlTail);
  }, 200000);

  test('commentary in line', async () => {
    await frame.type('body#tinymce', 'in line commentary');

    // open M menu (although stored in a note this is created as marginalia)
    await page.click('button#mceu_15-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    // commentary is default option
    // 0 is default option for lines

    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('in line commentary<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=commentary&amp;fw_type_other=&amp;covered=0&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;marginals_text=&amp;number=&amp;edit_number=on&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span>[<span class=\"commentary\" wce=\"__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=0\">comm</span>]<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>in</w><w>line</w><w>commentary</w><note type="commentary">Untranscribed commentary text within the line</note>' + xmlTail);
  }, 200000);

  test('lectionary in line', async () => {
    await frame.type('body#tinymce', 'in line lectionary');

    // open M menu (although stored in a note this is created as marginalia)
    await page.click('button#mceu_15-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="fw_type"]', 'lectionary-other');

    // 0 is default option for lines
    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('in line lectionary<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=lectionary-other&amp;fw_type_other=&amp;covered=0&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;marginals_text=&amp;number=&amp;edit_number=on&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span>[<span class=\"lectionary-other\" wce=\"__t=paratext&amp;__n=&amp;fw_type=lectionary-other&amp;covered=0\">lect</span>]<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>in</w><w>line</w><w>lectionary</w><note type="lectionary-other">Untranscribed lectionary text within the line</note>' + xmlTail);
  }, 200000);

  test('2 lines of untranscribed lectionary text', async () => {
    await frame.type('body#tinymce', 'lection text next');

    // open M menu (although stored in a note this is created as marginalia)
    await page.click('button#mceu_15-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="fw_type"]', 'lectionary-other');

    await menuFrame.type('input#covered', '2');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Backspace');

    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('lection text next<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=lectionary-other&amp;fw_type_other=&amp;covered=2&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;marginals_text=&amp;number=&amp;edit_number=on&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span><br />↵[<span class=\"lectionary-other\" wce=\"__t=paratext&amp;__n=&amp;fw_type=lectionary-other&amp;covered=2\">lect</span>]<br />↵[<span class=\"lectionary-other\" wce=\"__t=paratext&amp;__n=&amp;fw_type=lectionary-other&amp;covered=2\">lect</span>]<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>lection</w><w>text</w><w>next</w><lb/>' +
                        '<note type="lectionary-other">One line of untranscribed lectionary text</note><lb/>' +
                        '<note type="lectionary-other">One line of untranscribed lectionary text</note>' + xmlTail);
  }, 200000);

  test('ews', async () => {
    await frame.type('body#tinymce', 'abbreviated commentary');

    // open M menu (although stored in a note this is created as marginalia)
    await page.click('button#mceu_15-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="fw_type"]', 'ews');

    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('abbreviated commentary<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=ews&amp;fw_type_other=&amp;covered=0&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;marginals_text=&amp;number=&amp;edit_number=on&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span>[<span class=\"ews\">ews</span>]<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>abbreviated</w><w>commentary</w><note type="editorial" subtype="ews"/><gap unit="verse" extent="rest"/>' + xmlTail);
  }, 200000);

  // FW
  test('running title (fw) in centre top margin (seg)', async () => {

    // open M menu
    await page.click('button#mceu_15-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');


    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="fw_type"]', 'runTitle');

    const menuFrameHandle2 = await menuFrame.$('iframe[id="marginals_text_ifr"]');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    // I can't work out how to get the cursor to move to this window so typing and then deleting does this.
    await menuFrame2.type('body#tinymce', 'running title');
    await menuFrame.select('select[id="paratext_position"]', 'pagetop');
    await menuFrame.select('select[id="paratext_alignment"]', 'center');

    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=runTitle&amp;fw_type_other=&amp;covered=0&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;marginals_text=running%20title&amp;number=&amp;paratext_position=pagetop&amp;paratext_position_other=&amp;paratext_alignment=center\"><span class=\"format_start mceNonEditable\">‹</span>fw<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<seg type="margin" subtype="pagetop" n="@P-"><fw type="runTitle" rend="center">' +
                        '<w>running</w><w>title</w></fw></seg>' + xmlTail);
  }, 200000);

  test('chapter number in left margin', async () => {

    await frame.type('body#tinymce', 'this is a chapter number in the margin');

    // open M menu
    await page.click('button#mceu_15-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');


    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="fw_type"]', 'chapNum');

    const menuFrameHandle2 = await menuFrame.$('iframe[id="marginals_text_ifr"]');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    // I can't work out how to get the cursor to move to this window so typing and then deleting does this.
    await menuFrame2.type('body#tinymce', '12');
    await menuFrame.select('select[id="paratext_position"]', 'colleft');
    // await menuFrame.select('select[id="paratext_alignment"]', 'center');

    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('this is a chapter number in the margin<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=chapNum&amp;fw_type_other=&amp;covered=0&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;marginals_text=12&amp;number=&amp;paratext_position=colleft&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span>fw<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>this</w><w>is</w><w>a</w><w>chapter</w><w>number</w><w>in</w><w>the</w><w>margin</w>' +
                        '<seg type="margin" subtype="colleft" n="@PC-"><num type="chapNum">12</num></seg>' + xmlTail);
  }, 200000);

  test('The correct buttons appear in the submenu for marginalia', async () => {
      let BButton, DButton, OButton, AButton, PButton;

      await frame.type('body#tinymce', 'this is a chapter number in the margin');

      // open M menu
      await page.click('button#mceu_15-open');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');


      const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
      const menuFrame = await menuFrameHandle.contentFrame();
      await menuFrame.select('select[id="fw_type"]', 'runTitle');

      const menuFrameHandle2 = await menuFrame.$('iframe[id="marginals_text_ifr"]');
      const menuFrame2 = await menuFrameHandle2.contentFrame();

      BButton = await menuFrame.$eval('#mceu_5 > button > i', element=> element.getAttribute('style'));
      expect(BButton).toContain('button_B.png');

      DButton = await menuFrame.$eval('#mceu_6 > button > i', element=> element.getAttribute('style'));
      expect(DButton).toContain('button_D.png');

      OButton = await menuFrame.$eval('#mceu_7 > button > i', element=> element.getAttribute('style'));
      expect(OButton).toContain('button_O.png');

      AButton = await menuFrame.$eval('#mceu_8 > button > i', element=> element.getAttribute('style'));
      expect(AButton).toContain('button_A.png');

      NButton = await menuFrame.$eval('#mceu_9 > button > i', element=> element.getAttribute('style'));
      expect(NButton).toContain('button_N.png');

      PButton = await menuFrame.$eval('#mceu_10 > button > i', element=> element.getAttribute('style'));
      expect(PButton).toContain('button_P.png');

    }, 200000);

  test('The note menu can be used in marginalia subeditor (note menu was added in 2022)', async () => {
    await frame.type('body#tinymce', 'this is a title with a note');

    // open M menu
    await page.click('button#mceu_15-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="fw_type"]', 'runTitle');

    const menuFrameHandle2 = await menuFrame.$('iframe[id="marginals_text_ifr"]');
    const menuFrame2 = await menuFrameHandle2.contentFrame(); 

    await menuFrame2.type('body#tinymce', 'Title is here');
  
    // open inner note menu and add a note
    await menuFrame.click('button#mceu_9-open');
    await menuFrame.click('div#menu-note-add');
    const menuFrameHandle3 = await menuFrame.$('div[id="mceu_24"] > div > div > iframe');
    const menuFrame3 = await menuFrameHandle3.contentFrame();
    await menuFrame3.type('textarea#note_text', 'My note');
    await menuFrame3.click('input#insert');

    // add the fw
    await menuFrame.click('input#insert');
    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('this is a title with a note<span class="paratext" wce_orig="" wce="__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=runTitle&amp;fw_type_other=&amp;covered=0&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;marginals_text=Title%20is%20here%3Cspan%20class%3D%22note%22%20wce_orig%3D%22%22%20wce%3D%22__t%3Dnote%26amp%3B__n%3D%26amp%3Bhelp%3DHelp%26amp%3Bnote_type%3Dlocal%26amp%3Bnote_type_other%3D%26amp%3BnewHand%3D%26amp%3Bnote_text%3DMy%2520note%22%3E%3Cspan%20class%3D%22format_start%20mceNonEditable%22%3E%E2%80%B9%3C%2Fspan%3ENote%3Cspan%20class%3D%22format_end%20mceNonEditable%22%3E%E2%80%BA%3C%2Fspan%3E%3C%2Fspan%3E&amp;number=&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment="><span class="format_start mceNonEditable">‹</span>fw<span class="format_end mceNonEditable">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>this</w><w>is</w><w>a</w><w>title</w><w>with</w><w>a</w><w>note</w><fw type="runTitle"><w>Title</w><w>is</w><w>here</w><note type="local" xml:id="..--2">My note</note></fw>' + xmlTail);

  });

});