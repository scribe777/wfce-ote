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

describe('testing with showMultilineNotesAsSingleEntry client setting as true', () => {

    beforeEach(async () => {
      let frameHandle;
      jest.setTimeout(5000000);
      page = await browser.newPage();
      await page.goto(`file:${path.join(__dirname, 'test_index_page.html')}`);
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
      // commentary is default option
      await menuFrame.type('input#covered', '1');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Backspace');
  
      await menuFrame.click('input#insert');
  
      const htmlData = await page.evaluate(`getData()`);
      expect(htmlData).toBe('some commentary<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=commentary&amp;fw_type_other=&amp;covered=1&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;marginals_text=&amp;number=&amp;edit_number=on&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span><br />↵[<span class=\"commentary\" wce=\"__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=1\">comm</span>]<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span> in here');
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>some</w><w>commentary</w><lb/><note type="commentary">One line of untranscribed commentary text</note>' +
                          '<lb n="PCL-"/><w>in</w><w>here</w>' + xmlTail);
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
      // commentary is default option
      await menuFrame.type('input#covered', '3');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Backspace');
  
      await menuFrame.click('input#insert');
  
      const htmlData = await page.evaluate(`getData()`);
      expect(htmlData).toBe('some commentary<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=commentary&amp;fw_type_other=&amp;covered=3&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;marginals_text=&amp;number=&amp;edit_number=on&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span><br />↵[<span class=\"commentary\" wce=\"__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=3\">comm</span>]<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span> in here');
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>some</w><w>commentary</w><lb/><note type="commentary">One line of untranscribed commentary text</note><lb/><note type="commentary">One line of untranscribed commentary text</note><lb/><note type="commentary">One line of untranscribed commentary text</note>' +
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
      expect(htmlData).toBe('in line commentary<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=commentary&amp;fw_type_other=&amp;covered=0&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;marginals_text=&amp;number=&amp;edit_number=on&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span>[<span class=\"commentary\" wce=\"__t=paratext&amp;__n=&amp;fw_type=commentary&amp;covered=0\">comm</span>]<span class=\"format_end mceNonEditable\">›</span></span>');
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
      expect(htmlData).toBe('in line lectionary<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=lectionary-other&amp;fw_type_other=&amp;covered=0&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;marginals_text=&amp;number=&amp;edit_number=on&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span>[<span class=\"lectionary-other\" wce=\"__t=paratext&amp;__n=&amp;fw_type=lectionary-other&amp;covered=0\">lect</span>]<span class=\"format_end mceNonEditable\">›</span></span>');
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
      expect(htmlData).toBe('lection text next<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=lectionary-other&amp;fw_type_other=&amp;covered=2&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;marginals_text=&amp;number=&amp;edit_number=on&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span><br />↵[<span class=\"lectionary-other\" wce=\"__t=paratext&amp;__n=&amp;fw_type=lectionary-other&amp;covered=2\">lect</span>]<span class=\"format_end mceNonEditable\">›</span></span>');
      const xmlData = await page.evaluate(`getTEI()`);
      expect(xmlData).toBe(xmlHead + '<w>lection</w><w>text</w><w>next</w><lb/>' +
                          '<note type="lectionary-other">One line of untranscribed lectionary text</note><lb/>' +
                          '<note type="lectionary-other">One line of untranscribed lectionary text</note>' + xmlTail);
    }, 200000);

});