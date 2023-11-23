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

describe('test a optional defaults for marginalia menu', () => {

    beforeEach(async () => {
      let frameHandle;
      jest.setTimeout(5000000);
      page = await browser.newPage();
      await page.goto(`file:${path.join(__dirname, '../test_index_page.html')}`);
      await page.evaluate(`setWceEditor('wce_editor', {optionsForMarginaliaMenu: {'type': 'commentary'}})`);
      page.waitForSelector("#wce_editor_ifr");
      frameHandle = null;
      while (frameHandle === null) {
        frameHandle = await page.$("iframe[id='wce_editor_ifr']");
      }
      frame = await frameHandle.contentFrame();

    });

    test('no default selection of fw type', async () => {
      // open M menu to check the default option
      await page.click('button#mceu_15-open');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
      const menuFrame = await menuFrameHandle.contentFrame();

      expect(await menuFrame.$eval('#fw_type', el => el.value)).toBe('commentary');
      await menuFrame.type('input#covered', '1');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Backspace');

      const menuFrameHandle2 = await menuFrame.$('iframe[id="marginals_text_ifr"]');
      const menuFrame2 = await menuFrameHandle2.contentFrame();

      await menuFrame.click('input#insert');
      await page.waitForSelector('div[id="mceu_39"]', { hidden: true });
      const htmlData = await page.evaluate(`getData()`);
      expect(htmlData).toBe('<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=commentary&amp;fw_type_other=&amp;covered=1&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;marginals_text=&amp;number=&amp;edit_number=on&amp;reference=&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span><br />↵[<span class=\"commentary\" wce=\"__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=1\">comm</span>]<span class=\"format_end mceNonEditable\">›</span></span>');
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<lb/><note type=\"commentary\">One line of untranscribed commentary text</note>' + xmlTail);

  }, 200000);

  test('no default selection of fw type can be overwritten', async () => {
      // open M menu to check the default option
      await page.click('button#mceu_15-open');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
      const menuFrame = await menuFrameHandle.contentFrame();

      expect(await menuFrame.$eval('#fw_type', el => el.value)).toBe('commentary');
      await menuFrame.select('select[id="fw_type"]', 'chapNum');

      const menuFrameHandle2 = await menuFrame.$('iframe[id="marginals_text_ifr"]');
      const menuFrame2 = await menuFrameHandle2.contentFrame();
      await menuFrame2.type('body#tinymce', '10');
      // I can't get this to wait until the unless I specifically tell it to - I don't know why
      await page.waitForTimeout(1000);

      // as 10 is not a roman numeral the number field is not complete
      // NB we may want to change this since it is a number!
      // then the number field should be emptied and undisabled and the automatic checkbox unchecked
      expect(await menuFrame.$eval('#number', el => el.disabled)).toBe(false);
      expect(await menuFrame.$eval('#number', el => el.value)).toBe('');
      expect(await menuFrame.$eval('#edit_number', el => el.checked)).toBe(false);
      // check the reference field is still disabled
      expect(await menuFrame.$eval('#reference', el => el.disabled)).toBe(true);

      await menuFrame.click('input#insert');
      await page.waitForSelector('div[id="mceu_39"]', { hidden: true });
      const htmlData = await page.evaluate(`getData()`);
      expect(htmlData).toBe('<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=chapNum&amp;fw_type_other=&amp;covered=0&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;marginals_text=10&amp;number=&amp;reference=&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span>fw<span class=\"format_end mceNonEditable\">›</span></span>');
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<num type="chapNum">10</num>' + xmlTail);

      // test editing
      await page.keyboard.press('ArrowLeft');
      await page.click('button#mceu_15-open');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      const menuFrameHandle3 = await page.$('div[id="mceu_40"] > div > div > iframe');
      const menuFrame3 = await menuFrameHandle3.contentFrame();
      expect(await menuFrame.$eval('#fw_type', el => el.value)).toBe('chapNum');
      await menuFrame3.click('input#insert');
      await page.waitForSelector('div[id="mceu_40"]', { hidden: true });
      const xmlData2 = await page.evaluate(`getTEI()`);
      expect(xmlData2).toBe(xmlHead + '<num type="chapNum">10</num>' + xmlTail);

  }, 200000);
});

describe('testing with showMultilineNotesAsSingleEntry client setting as true', () => {

    beforeEach(async () => {
      let frameHandle;
      jest.setTimeout(5000000);
      page = await browser.newPage();
      await page.goto(`file:${path.join(__dirname, '../test_index_page.html')}`);
      await page.evaluate(`setWceEditor('wce_editor', {showMultilineNotesAsSingleEntry: true})`);
      page.waitForSelector("#wce_editor_ifr");
      frameHandle = null;
      while (frameHandle === null) {
        frameHandle = await page.$("iframe[id='wce_editor_ifr']");
      }
      frame = await frameHandle.contentFrame();
  
    });
  
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
      await menuFrame.select('select[id="fw_type"]', 'commentary');
      await menuFrame.type('input#covered', '1');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Backspace');
  
      await menuFrame.click('input#insert');
  
      const htmlData = await page.evaluate(`getData()`);
      expect(htmlData).toBe('some commentary<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=commentary&amp;fw_type_other=&amp;covered=1&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;marginals_text=&amp;number=&amp;edit_number=on&amp;reference=&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span><br />↵[<span class=\"commentary\" wce=\"__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=1\">comm</span>]<span class=\"format_end mceNonEditable\">›</span></span>​<span class="brea" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span> in here');
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>some</w><w>commentary</w><lb/><note type="commentary">One line of untranscribed commentary text</note>' +
                          '<lb n="PCL-"/><w>in</w><w>here</w>' + xmlTail);

      // test editing
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');

      // open M menu for editing (although stored in a note this is created as marginalia)
      await page.click('button#mceu_15-open');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
      const menuFrame2 = await menuFrameHandle2.contentFrame();

      expect(await menuFrame2.$eval('#fw_type', el => el.value)).toBe('commentary');
      expect(await menuFrame2.$eval('#fw_type_other', el => el.disabled)).toBe(true);
      expect(await menuFrame2.$eval('#fw_type_other', el => el.value)).toBe('');
      expect(await menuFrame2.$eval('#covered', el => el.value)).toBe('1');
      await menuFrame2.click('input#insert');
      const xmlData2 = await page.evaluate(`getTEI()`);
      expect(xmlData2).toBe(xmlHead + '<w>some</w><w>commentary</w><lb/><note type="commentary">One line of untranscribed commentary text</note>' +
                          '<lb n="PCL-"/><w>in</w><w>here</w>' + xmlTail);

      // test deleting
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      // open M menu for deleting (although stored in a note this is created as marginalia)
      await page.click('button#mceu_15-open');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      const xmlData3 = await page.evaluate(`getTEI()`);
      expect(xmlData3).toBe(xmlHead + '<w>some</w><w>commentary</w><lb n="PCL-"/><w>in</w><w>here</w>' + xmlTail);

    }, 200000);
  
    test('3 lines of commentary text note', async () => {
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
      await menuFrame.select('select[id="fw_type"]', 'commentary');
      await menuFrame.type('input#covered', '3');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Backspace');
  
      await menuFrame.click('input#insert');
  
      const htmlData = await page.evaluate(`getData()`);
      expect(htmlData).toBe('some commentary<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=commentary&amp;fw_type_other=&amp;covered=3&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;marginals_text=&amp;number=&amp;edit_number=on&amp;reference=&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span><br />↵[<span class=\"commentary\" wce=\"__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=3\">comm</span>]<span class=\"format_end mceNonEditable\">›</span></span>​<span class="brea" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span> in here');
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>some</w><w>commentary</w><lb/><note type="commentary">One line of untranscribed commentary text</note><lb/><note type="commentary">One line of untranscribed commentary text</note><lb/><note type="commentary">One line of untranscribed commentary text</note>' +
                          '<lb n="PCL-"/><w>in</w><w>here</w>' + xmlTail);

      // test editing
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');

      // open M menu for editing (although stored in a note this is created as marginalia)
      await page.click('button#mceu_15-open');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
      const menuFrame2 = await menuFrameHandle2.contentFrame();

      expect(await menuFrame2.$eval('#fw_type', el => el.value)).toBe('commentary');
      expect(await menuFrame2.$eval('#fw_type_other', el => el.disabled)).toBe(true);
      expect(await menuFrame2.$eval('#fw_type_other', el => el.value)).toBe('');
      expect(await menuFrame2.$eval('#covered', el => el.value)).toBe('3');
      await menuFrame2.click('input#insert');
      const xmlData2 = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>some</w><w>commentary</w><lb/><note type="commentary">One line of untranscribed commentary text</note><lb/><note type="commentary">One line of untranscribed commentary text</note><lb/><note type="commentary">One line of untranscribed commentary text</note>' +
                          '<lb n="PCL-"/><w>in</w><w>here</w>' + xmlTail);

    
      // test deleting
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      // open M menu for deleting (although stored in a note this is created as marginalia)
      await page.click('button#mceu_15-open');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      const xmlData3 = await page.evaluate(`getTEI()`);
      expect(xmlData3).toBe(xmlHead + '<w>some</w><w>commentary</w><lb n="PCL-"/><w>in</w><w>here</w>' + xmlTail);

    }, 200000);
  
  
    test('commentary in line', async () => {
      await frame.type('body#tinymce', 'in line commentary');
  
      // open M menu (although stored in a note this is created as marginalia)
      await page.click('button#mceu_15-open');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
  
      const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
      const menuFrame = await menuFrameHandle.contentFrame();
      await menuFrame.select('select[id="fw_type"]', 'commentary');
      // 0 is default option for lines
  
      await menuFrame.click('input#insert');
  
      const htmlData = await page.evaluate(`getData()`);
      expect(htmlData).toBe('in line commentary<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=commentary&amp;fw_type_other=&amp;covered=0&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;marginals_text=&amp;number=&amp;edit_number=on&amp;reference=&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span>[<span class=\"commentary\" wce=\"__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=0\">comm</span>]<span class=\"format_end mceNonEditable\">›</span></span>');
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>in</w><w>line</w><w>commentary</w><note type="commentary">Untranscribed commentary text within the line</note>' + xmlTail);
    
      // test editing
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');

      // open M menu for editing (although stored in a note this is created as marginalia)
      await page.click('button#mceu_15-open');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
      const menuFrame2 = await menuFrameHandle2.contentFrame();

      expect(await menuFrame2.$eval('#fw_type', el => el.value)).toBe('commentary');
      expect(await menuFrame2.$eval('#fw_type_other', el => el.disabled)).toBe(true);
      expect(await menuFrame2.$eval('#fw_type_other', el => el.value)).toBe('');
      expect(await menuFrame2.$eval('#covered', el => el.value)).toBe('0');
      await menuFrame2.click('input#insert');
      const xmlData2 = await page.evaluate(`getTEI()`);
      expect(xmlData2).toBe(xmlHead + '<w>in</w><w>line</w><w>commentary</w><note type="commentary">Untranscribed commentary text within the line</note>' + xmlTail);

      // test deleting
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      // open M menu for deleting (although stored in a note this is created as marginalia)
      await page.click('button#mceu_15-open');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      const xmlData3 = await page.evaluate(`getTEI()`);
      expect(xmlData3).toBe(xmlHead + '<w>in</w><w>line</w><w>commentary</w>' + xmlTail);

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
      expect(htmlData).toBe('in line lectionary<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=lectionary-other&amp;fw_type_other=&amp;covered=0&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;marginals_text=&amp;number=&amp;edit_number=on&amp;reference=&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span>[<span class=\"lectionary-other\" wce=\"__t=paratext&amp;__n=&amp;fw_type=lectionary-other&amp;covered=0\">lect</span>]<span class=\"format_end mceNonEditable\">›</span></span>');
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
      expect(htmlData).toBe('lection text next<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=lectionary-other&amp;fw_type_other=&amp;covered=2&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;marginals_text=&amp;number=&amp;edit_number=on&amp;reference=&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span><br />↵[<span class=\"lectionary-other\" wce=\"__t=paratext&amp;__n=&amp;fw_type=lectionary-other&amp;covered=2\">lect</span>]<span class=\"format_end mceNonEditable\">›</span></span>');
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>lection</w><w>text</w><w>next</w><lb/>' +
                          '<note type="lectionary-other">One line of untranscribed lectionary text</note><lb/>' +
                          '<note type="lectionary-other">One line of untranscribed lectionary text</note>' + xmlTail);
    }, 200000);

});