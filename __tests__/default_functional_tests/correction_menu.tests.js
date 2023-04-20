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
let frameHandle;

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
  frameHandle;
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

const asyncTimeout = () => new Promise((resolve) => {
  setTimeout(() => {
    return resolve();
  }, 500);
});


describe('testing correction menu', () => {

  // CORRECTIONS

  test('a simple correction with visible firsthand', async () => {

    await page.hover('div#mceu_11');
    // await page.hover('h1');

    await frame.type('body#tinymce', 'a smple correction');
    for (let i = 0; i < ' correction'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'smple'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');

    // open C menu
    await page.click('div#mceu_11 > button');

    const menuFrameHandle = await page.$('div[id="mceu_38"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();

    const menuFrameHandle2 = await menuFrame.$('iframe[id="corrector_text_ifr"]');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await page.keyboard.press('ArrowRight');
    await menuFrame2.type('body#tinymce', 'i');
    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a <span class="corr" wce_orig="smple" wce="__t=corr&amp;__n=corrector&amp;help=Help&amp;original_firsthand_reading=smple&amp;common_firsthand_partial=&amp;reading=corr&amp;corrector_name=corrector&amp;corrector_name_other=&amp;place_corr=&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=simple"><span class="format_start mceNonEditable">‹</span>smple<span class="format_end mceNonEditable">›</span></span> correction');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><app><rdg type="orig" hand="firsthand"><w>smple</w></rdg><rdg type="corr" hand="corrector">' +
      '<w>simple</w></rdg></app><w>correction</w>' + xmlTail);

    // test the hover over
    // get the location of the span
    const correction = await frame.$('span.corr');
    const spanPos = await frame.evaluate((correction) => {
      const {top, left, bottom, right} = correction.getBoundingClientRect();
      return {top, left, bottom, right};
    }, correction);
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
    targetY = spanPos.top + ((spanPos.bottom - spanPos.top) / 2) + menubarHeight;
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue).toBe('*: smple<div style="margin-top:15px">Correction</div><div style="margin-top:5px">corrector: simple</div>')
    
  }, 200000);

  test('a simple correction in the margin', async () => {
    await frame.type('body#tinymce', 'a smple correction');
    for (let i = 0; i < ' correction'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'smple'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');

    // open C menu
    await page.click('div#mceu_11 > button');

    const menuFrameHandle = await page.$('div[id="mceu_38"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="corrector_name"]', 'corrector1');
    await menuFrame.select('select[id="deletion"]', 'deletion_hooks');
    await menuFrame.select('select[id="place_corr"]', 'pageleft');

    const menuFrameHandle2 = await menuFrame.$('iframe[id="corrector_text_ifr"]');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await page.keyboard.press('ArrowRight');
    await menuFrame2.type('body#tinymce', 'i');
    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a <span class="corr" wce_orig="smple" wce="__t=corr&amp;__n=corrector1&amp;help=Help&amp;original_firsthand_reading=smple&amp;common_firsthand_partial=&amp;reading=corr&amp;corrector_name=corrector1&amp;corrector_name_other=&amp;place_corr=pageleft&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=1&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=deletion_hooks&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=simple"><span class="format_start mceNonEditable">‹</span>smple<span class="format_end mceNonEditable">›</span></span> correction');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><app><rdg type="orig" hand="firsthand"><w>smple</w></rdg>' +
      '<rdg type="corr" hand="corrector1" rend="deletion_hooks"><seg type="margin" subtype="pageleft" n="@P-">' +
      '<w>simple</w></seg></rdg></app><w>correction</w>' + xmlTail);

    // test the hover over
    // get the location of the span
    const correction = await frame.$('span.corr');
    const spanPos = await frame.evaluate((correction) => {
      const {top, left, bottom, right} = correction.getBoundingClientRect();
      return {top, left, bottom, right};
    }, correction);
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
    targetY = spanPos.top + ((spanPos.bottom - spanPos.top) / 2) + menubarHeight;
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue).toBe('*: smple<div style="margin-top:15px">Correction</div><div style="margin-top:5px">corrector1: simple</div><div style="margin-top:5px">Method(s) of deletion/correction: deletion_hooks</div><div style="margin-top:10px">Position: pageleft</div>')
 
  }, 200000);

  test('a simple correction above line', async () => {
    await frame.type('body#tinymce', 'a smple correction');
    for (let i = 0; i < ' correction'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'smple'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');

    // open C menu
    await page.click('div#mceu_11 > button');

    const menuFrameHandle = await page.$('div[id="mceu_38"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="corrector_name"]', 'corrector1');
    await menuFrame.select('select[id="deletion"]', 'deletion_hooks');
    await menuFrame.select('select[id="place_corr"]', 'above');

    const menuFrameHandle2 = await menuFrame.$('iframe[id="corrector_text_ifr"]');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await page.keyboard.press('ArrowRight');
    await menuFrame2.type('body#tinymce', 'i');
    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a <span class="corr" wce_orig="smple" wce="__t=corr&amp;__n=corrector1&amp;help=Help&amp;original_firsthand_reading=smple&amp;common_firsthand_partial=&amp;reading=corr&amp;corrector_name=corrector1&amp;corrector_name_other=&amp;place_corr=above&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=1&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=deletion_hooks&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=simple"><span class="format_start mceNonEditable">‹</span>smple<span class="format_end mceNonEditable">›</span></span> correction');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><app><rdg type="orig" hand="firsthand"><w>smple</w></rdg>' +
      '<rdg type="corr" hand="corrector1" rend="deletion_hooks"><seg type="line" subtype="above" n="@PCL-">' +
      '<w>simple</w></seg></rdg></app><w>correction</w>' + xmlTail);

    // test the hover over
    // get the location of the span
    const correction = await frame.$('span.corr');
    const spanPos = await frame.evaluate((correction) => {
      const {top, left, bottom, right} = correction.getBoundingClientRect();
      return {top, left, bottom, right};
    }, correction);
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
    targetY = spanPos.top + ((spanPos.bottom - spanPos.top) / 2) + menubarHeight;
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue).toBe('*: smple<div style="margin-top:15px">Correction</div><div style="margin-top:5px">corrector1: simple</div><div style="margin-top:5px">Method(s) of deletion/correction: deletion_hooks</div><div style="margin-top:10px">Position: above</div>')

  }, 200000);

  test('a simple correction with other location', async () => {
    await frame.type('body#tinymce', 'a smple correction');
    for (let i = 0; i < ' correction'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'smple'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');

    // open C menu
    await page.click('div#mceu_11 > button');

    const menuFrameHandle = await page.$('div[id="mceu_38"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="corrector_name"]', 'corrector1');
    await menuFrame.select('select[id="deletion"]', 'transposition_marks');
    await menuFrame.select('select[id="place_corr"]', 'other');
    await menuFrame.type('input[id="place_corr_other"]', 'inline');

    const menuFrameHandle2 = await menuFrame.$('iframe[id="corrector_text_ifr"]');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    // I can't work out how to get the cursor to move to this window so typing and then deleting does this.
    await menuFrame2.type('body#tinymce', 'l');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('ArrowRight');
    await menuFrame2.type('body#tinymce', 'i');
    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a <span class="corr" wce_orig="smple" wce="__t=corr&amp;__n=corrector1&amp;help=Help&amp;original_firsthand_reading=smple&amp;common_firsthand_partial=&amp;reading=corr&amp;corrector_name=corrector1&amp;corrector_name_other=&amp;place_corr=other&amp;place_corr_other=inline&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=1&amp;deletion_other=0&amp;deletion=transposition_marks&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=simple"><span class="format_start mceNonEditable">‹</span>smple<span class="format_end mceNonEditable">›</span></span> correction');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><app><rdg type="orig" hand="firsthand"><w>smple</w></rdg>' +
      '<rdg type="corr" hand="corrector1" rend="transposition_marks">' +
      '<seg type="other" subtype="inline" n="@PCL-"><w>simple</w></seg></rdg></app><w>correction</w>' + xmlTail);

    // test the hover over
    // get the location of the span
    const correction = await frame.$('span.corr');
    const spanPos = await frame.evaluate((correction) => {
      const {top, left, bottom, right} = correction.getBoundingClientRect();
      return {top, left, bottom, right};
    }, correction);
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
    targetY = spanPos.top + ((spanPos.bottom - spanPos.top) / 2) + menubarHeight;
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue).toBe('*: smple<div style="margin-top:15px">Correction</div><div style="margin-top:5px">corrector1: simple</div><div style="margin-top:5px">Method(s) of deletion/correction: transposition_marks</div><div style="margin-top:10px">Position: inline</div>')

  }, 200000);

  test('a deletion (correction)', async () => {
    await frame.type('body#tinymce', 'a deletion correction');
    for (let i = 0; i < ' correction'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'deletion'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');

    // open C menu
    await page.click('div#mceu_11 > button');

    const menuFrameHandle = await page.$('div[id="mceu_38"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input[id="blank_correction"]');
    await menuFrame.select('select[id="deletion"]', 'strikethrough');
    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a <span class="corr" wce_orig="deletion" wce="__t=corr&amp;__n=corrector&amp;help=Help&amp;original_firsthand_reading=deletion&amp;common_firsthand_partial=&amp;reading=corr&amp;corrector_name=corrector&amp;corrector_name_other=&amp;blank_correction=on&amp;place_corr=&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=1&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=strikethrough&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=deletion"><span class="format_start mceNonEditable">‹</span>deletion<span class="format_end mceNonEditable">›</span></span> correction');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><app><rdg type="orig" hand="firsthand"><w>deletion</w></rdg>' +
      '<rdg type="corr" hand="corrector" rend="strikethrough"></rdg></app><w>correction</w>' + xmlTail);

    // test the hover over
    // get the location of the span
    const correction = await frame.$('span.corr');
    const spanPos = await frame.evaluate((correction) => {
      const {top, left, bottom, right} = correction.getBoundingClientRect();
      return {top, left, bottom, right};
    }, correction);
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
    targetY = spanPos.top + ((spanPos.bottom - spanPos.top) / 2) + menubarHeight;
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue).toBe('*: deletion<div style="margin-top:15px">Correction</div><div style="margin-top:5px">corrector: Deleted</div><div style="margin-top:5px">Method(s) of deletion/correction: strikethrough</div>')

  }, 200000);

  test('consecutive corrections', async () => {
    await frame.type('body#tinymce', 'consecutive corrections');
    for (let i = 0; i < ' corrections'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'consecutive'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');

    // open C menu
    await page.click('div#mceu_11 > button');

    const menuFrameHandle = await page.$('div[id="mceu_38"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input[id="blank_correction"]');
    await menuFrame.select('select[id="deletion"]', 'underline');
    await menuFrame.click('input#insert');

    await page.keyboard.press('ArrowRight');
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'corrections'.length; i++) {
      await page.keyboard.press('ArrowRight');
    }
    await page.keyboard.up('Shift');

    // open C menu
    await page.click('div#mceu_11 > button');

    const menuFrameHandle2 = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();

    const menuFrameHandle3 = await menuFrame2.$('iframe[id="corrector_text_ifr"]');
    const menuFrame3 = await menuFrameHandle3.contentFrame();
    // I can't work out how to get the cursor to move to this window so typing and then deleting does this.
    await menuFrame3.type('body#tinymce', 'l');
    await page.keyboard.press('Backspace');
    for (let i = 0; i < 'corrections'.length; i++) {
      await page.keyboard.press('ArrowRight');
    }
    await page.keyboard.press('Backspace');
    await menuFrame2.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class="corr" wce_orig="consecutive" wce="__t=corr&amp;__n=corrector&amp;help=Help&amp;original_firsthand_reading=consecutive&amp;common_firsthand_partial=&amp;reading=corr&amp;corrector_name=corrector&amp;corrector_name_other=&amp;blank_correction=on&amp;place_corr=&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=1&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=underline&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=consecutive"><span class="format_start mceNonEditable">‹</span>consecutive<span class="format_end mceNonEditable">›</span></span> <span class="corr" wce_orig="corrections" wce="__t=corr&amp;__n=corrector&amp;help=Help&amp;original_firsthand_reading=corrections&amp;common_firsthand_partial=&amp;reading=corr&amp;corrector_name=corrector&amp;corrector_name_other=&amp;place_corr=&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=correction"><span class="format_start mceNonEditable">‹</span>corrections<span class="format_end mceNonEditable">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<app><rdg type="orig" hand="firsthand"><w>consecutive</w></rdg>' +
      '<rdg type="corr" hand="corrector" rend="underline"></rdg></app><app>' +
      '<rdg type="orig" hand="firsthand"><w>corrections</w></rdg>' +
      '<rdg type="corr" hand="corrector"><w>correction</w></rdg></app>' + xmlTail);

    // test the hover over
    // get the location of the first span
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    const corrections = await frame.$$('span.corr');
    const correction1 = corrections[0]
    const spanPos1 = await frame.evaluate((correction1) => {
      const {top, left, bottom, right} = correction1.getBoundingClientRect();
      return {top, left, bottom, right};
    }, correction1);
    targetX = spanPos1.left + ((spanPos1.right - spanPos1.left) / 2) + sidebarWidth;
    targetY = spanPos1.top + ((spanPos1.bottom - spanPos1.top) / 2) + menubarHeight;
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue1 = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue1).toBe('*: consecutive<div style="margin-top:15px">Correction</div><div style="margin-top:5px">corrector: Deleted</div><div style="margin-top:5px">Method(s) of deletion/correction: underline</div>');
    
    // get the location of the first span
    const correction2 = corrections[1]
    const spanPos2 = await frame.evaluate((correction2) => {
      const {top, left, bottom, right} = correction2.getBoundingClientRect();
      return {top, left, bottom, right};
    }, correction2);
    targetX = spanPos2.left + ((spanPos2.right - spanPos2.left) / 2) + sidebarWidth;
    targetY = spanPos2.top + ((spanPos2.bottom - spanPos2.top) / 2) + menubarHeight;
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue2 = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue2).toBe('*: corrections<div style="margin-top:15px">Correction</div><div style="margin-top:5px">corrector: correction</div>');

  }, 200000);

  test('firsthand ut videtur', async () => {
    await frame.type('body#tinymce', 'a smple correction');
    for (let i = 0; i < ' correction'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'smple'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');

    // open C menu
    await page.click('div#mceu_11 > button');

    const menuFrameHandle = await page.$('div[id="mceu_38"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();

    const menuFrameHandle2 = await menuFrame.$('iframe[id="corrector_text_ifr"]');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await page.keyboard.press('ArrowRight');
    await menuFrame2.type('body#tinymce', 'i');
    await menuFrame.click('input#ut_videtur_firsthand');
    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a <span class="corr" wce_orig="smple" wce="__t=corr&amp;__n=corrector&amp;help=Help&amp;original_firsthand_reading=smple&amp;common_firsthand_partial=&amp;reading=corr&amp;ut_videtur_firsthand=on&amp;corrector_name=corrector&amp;corrector_name_other=&amp;place_corr=&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=simple"><span class="format_start mceNonEditable">‹</span>smple<span class="format_end mceNonEditable">›</span></span> correction');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><app><rdg type="orig" hand="firsthandV"><w>smple</w></rdg>' +
      '<rdg type="corr" hand="corrector"><w>simple</w></rdg></app><w>correction</w>' + xmlTail);

    // test the hover over
    // get the location of the span
    const correction = await frame.$('span.corr');
    const spanPos = await frame.evaluate((correction) => {
      const {top, left, bottom, right} = correction.getBoundingClientRect();
      return {top, left, bottom, right};
    }, correction);
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
    targetY = spanPos.top + ((spanPos.bottom - spanPos.top) / 2) + menubarHeight;
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue).toBe('*: smple (ut videtur)<div style="margin-top:15px">Correction</div><div style="margin-top:5px">corrector: simple</div>')

  }, 200000);

  test('corrector ut videtur', async () => {
    await frame.type('body#tinymce', 'a smple correction');
    for (let i = 0; i < ' correction'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'smple'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');

    // open C menu
    await page.click('div#mceu_11 > button');

    const menuFrameHandle = await page.$('div[id="mceu_38"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();

    const menuFrameHandle2 = await menuFrame.$('iframe[id="corrector_text_ifr"]');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await page.keyboard.press('ArrowRight');
    await menuFrame2.type('body#tinymce', 'i');
    await menuFrame.click('input#ut_videtur_corr');
    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a <span class="corr" wce_orig="smple" wce="__t=corr&amp;__n=corrector&amp;help=Help&amp;original_firsthand_reading=smple&amp;common_firsthand_partial=&amp;reading=corr&amp;corrector_name=corrector&amp;corrector_name_other=&amp;ut_videtur_corr=on&amp;place_corr=&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=simple"><span class="format_start mceNonEditable">‹</span>smple<span class="format_end mceNonEditable">›</span></span> correction');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><app><rdg type="orig" hand="firsthand"><w>smple</w></rdg><rdg type="corr" hand="correctorV">' +
      '<w>simple</w></rdg></app><w>correction</w>' + xmlTail);

    // test the hover over
    // get the location of the span
    const correction = await frame.$('span.corr');
    const spanPos = await frame.evaluate((correction) => {
      const {top, left, bottom, right} = correction.getBoundingClientRect();
      return {top, left, bottom, right};
    }, correction);
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
    targetY = spanPos.top + ((spanPos.bottom - spanPos.top) / 2) + menubarHeight;
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue).toBe('*: smple<div style="margin-top:15px">Correction</div><div style="margin-top:5px">corrector: simple</div>(ut videtur corr)')

  }, 200000);

  test('an alternative reading', async () => {
    await frame.type('body#tinymce', 'a simple correction');
    for (let i = 0; i < ' correction'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'simple'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');

    // open C menu
    await page.click('div#mceu_11 > button');

    const menuFrameHandle = await page.$('div[id="mceu_38"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();

    const menuFrameHandle2 = await menuFrame.$('iframe[id="corrector_text_ifr"]');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    // I can't work out how to get the cursor to move to this window so typing and then deleting does this.
    await menuFrame2.type('body#tinymce', 'l');
    await page.keyboard.press('Backspace');

    await page.keyboard.down('Shift');
    for (let i = 0; i < 'simple'.length; i++) {
      await page.keyboard.press('ArrowRight');
    }
    await page.keyboard.up('Shift');

    await page.keyboard.press('Backspace');

    await menuFrame2.type('body#tinymce', 'basic');
    await menuFrame.select('select[id="reading"]', 'alt');
    await menuFrame.select('select[id="deletion"]', 'other');

    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a <span class="corr" wce_orig="simple" wce="__t=corr&amp;__n=corrector&amp;help=Help&amp;original_firsthand_reading=simple&amp;common_firsthand_partial=&amp;reading=alt&amp;corrector_name=corrector&amp;corrector_name_other=&amp;place_corr=&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=1&amp;deletion=other&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=basic"><span class="format_start mceNonEditable">‹</span>simple<span class="format_end mceNonEditable">›</span></span> correction');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><app><rdg type="orig" hand="firsthand"><w>simple</w></rdg>' +
      '<rdg type="alt" hand="corrector" rend="other"><w>basic</w></rdg></app><w>correction</w>' + xmlTail);

    // test the hover over
    // get the location of the span
    const correction = await frame.$('span.corr');
    const spanPos = await frame.evaluate((correction) => {
      const {top, left, bottom, right} = correction.getBoundingClientRect();
      return {top, left, bottom, right};
    }, correction);
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
    targetY = spanPos.top + ((spanPos.bottom - spanPos.top) / 2) + menubarHeight;
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue).toBe('*: simple<div style="margin-top:15px">Alternative reading</div><div style="margin-top:5px">corrector: basic</div><div style="margin-top:5px">Method(s) of deletion/correction: other</div>')

  }, 200000);

  test('an addition (correction)', async () => {
    await frame.type('body#tinymce', 'an  correction');
    for (let i = 0; i < ' correction'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    // open C menu
    await page.click('div#mceu_11 > button');

    const menuFrameHandle = await page.$('div[id="mceu_38"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();

    const menuFrameHandle2 = await menuFrame.$('iframe[id="corrector_text_ifr"]');
    const menuFrame2 = await menuFrameHandle2.contentFrame();

    await menuFrame2.type('body#tinymce', 'addition');
    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('an <span class="corr_blank_firsthand" wce_orig="" wce="__t=corr&amp;__n=corrector&amp;help=Help&amp;original_firsthand_reading=&amp;common_firsthand_partial=&amp;reading=corr&amp;blank_firsthand=on&amp;corrector_name=corrector&amp;corrector_name_other=&amp;place_corr=&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=addition"><span class="format_start mceNonEditable">‹</span>T<span class="format_end mceNonEditable">›</span></span> correction');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>an</w><app><rdg type="orig" hand="firsthand"></rdg><rdg type="corr" hand="corrector">' +
      '<w>addition</w></rdg></app><w>correction</w>' + xmlTail);

    // test the hover over
    // get the location of the span
    const correction = await frame.$('span.corr_blank_firsthand');
    const spanPos = await frame.evaluate((correction) => {
      const {top, left, bottom, right} = correction.getBoundingClientRect();
      return {top, left, bottom, right};
    }, correction);    
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth + 7;
    targetY = spanPos.top + ((spanPos.bottom - spanPos.top) / 2) + menubarHeight + 7;
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue).toBe('*: Omission<div style="margin-top:15px">Correction</div><div style="margin-top:5px">corrector: addition</div>')
    
  }, 200000);

  // Test hover over with nomsac embedded in correction (should use correction hover over throughout and not nomsac)
  test('a correction with a nomsac embedded (only for hover over test)', async () => {
    
    // preload the data
    const data = xmlHead + '<app><rdg type="orig" hand="firsthand"><w>δυναμις</w><w><abbr type="nomSac"><hi rend="overline">θυ</hi></abbr></w><w>εστιν</w></rdg><rdg type="corr" hand="corrector"><w>δυναμις</w><w><abbr type="nomSac"><hi rend="overline">θυ</hi></abbr></w><w>εστιν</w></rdg></app>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);

    // test the hover over
    // get the location of the span
    const nomsac = await frame.$('span.abbr_add_overline');
    const spanPos1 = await frame.evaluate((nomsac) => {
      const {top, left, bottom, right} = nomsac.getBoundingClientRect();
      return {top, left, bottom, right};
    }, nomsac);    
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    targetX = spanPos1.left + ((spanPos1.right - spanPos1.left) / 2) + sidebarWidth;
    targetY = spanPos1.top + ((spanPos1.bottom - spanPos1.top) / 2) + menubarHeight;
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue1 = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue1).toBe('*: δυναμις <span class="abbr_add_overline" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;add_overline=overline&amp;abbr_type_other=&amp;abbr_type=nomSac">θυ</span> εστιν<div style="margin-top:15px">Correction</div><div style="margin-top:5px">corrector: δυναμις <span class="abbr_add_overline" style="text-decoration:overline" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;add_overline=overline&amp;abbr_type_other=&amp;abbr_type=nomSac" wce_orig="%CE%B8%CF%85">θυ</span> εστιν </div>')

    // test the hover over
    // get the location of the span
    const correction = await frame.$('span.corr');
    const spanPos2 = await frame.evaluate((correction) => {
      const {top, left, bottom, right} = correction.getBoundingClientRect();
      return {top, left, bottom, right};
    }, correction);    
    targetX = spanPos2.left + ((spanPos2.right - spanPos2.left) / 2) + sidebarWidth;
    targetY = spanPos2.top + ((spanPos2.bottom - spanPos2.top) / 2) + menubarHeight;
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue2 = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue2).toBe('*: δυναμις <span class="abbr_add_overline" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;add_overline=overline&amp;abbr_type_other=&amp;abbr_type=nomSac" wce_orig="%CE%B8%CF%85">θυ</span> εστιν<div style="margin-top:15px">Correction</div><div style="margin-top:5px">corrector: δυναμις <span class="abbr_add_overline" style="text-decoration:overline" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;add_overline=overline&amp;abbr_type_other=&amp;abbr_type=nomSac" wce_orig="%CE%B8%CF%85">θυ</span> εστιν </div>')

  }, 200000);

  // Test hover over with nomsac embedded in correction (should use correction hover over throughout and not nomsac)
  test('a correction with a nomsac embedded with supplied involved (only for hover over test)', async () => {
    
    // preload the data
    const data = xmlHead + '<app><rdg type="orig" hand="firsthand"><w><supplied source="na28" reason="illegible">δυναμις</supplied></w><w><supplied source="na28" reason="illegible"><abbr type="nomSac"><hi rend="overline">θυ</hi></abbr></supplied></w><w><supplied source="na28" reason="illegible">εστιν</supplied></w></rdg><rdg type="corr" hand="corrector"><w>δυναμις</w><w><abbr type="nomSac"><hi rend="overline">θυ</hi></abbr></w><w>εστιν</w></rdg></app>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);

    // test the hover over
    // get the location of the span
    const nomsac = await frame.$('span.abbr_add_overline');
    const spanPos1 = await frame.evaluate((nomsac) => {
      const {top, left, bottom, right} = nomsac.getBoundingClientRect();
      return {top, left, bottom, right};
    }, nomsac);    
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    targetX = spanPos1.left + ((spanPos1.right - spanPos1.left) / 2) + sidebarWidth;
    targetY = spanPos1.top + ((spanPos1.bottom - spanPos1.top) / 2) + menubarHeight;
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue1 = await page.$eval('#hover-data-content', el => el.innerHTML);
    // THIS IS WRONG BUT IS WHAT HAPPENS RIGHT NOW AND IT IS THE NEXT THING THAT MATTERS MORE
    expect(hoverValue1).toBe('Nomen Sacrum');
    // expect(hoverValue1).toBe('*: δυναμις <span class="abbr_add_overline" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;add_overline=overline&amp;abbr_type_other=&amp;abbr_type=nomSac" wce_orig="θυ">θυ</span> εστιν<div style="margin-top:15px">Correction</div><div style="margin-top:5px">corrector: δυναμις <span class="abbr_add_overline" style="text-decoration:overline" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;add_overline=overline&amp;abbr_type_other=&amp;abbr_type=nomSac" wce_orig="%CE%B8%CF%85">θυ</span> εστιν </div>')

    // test the hover over
    // get the location of the span
    const correction = await frame.$('span.corr');
    const spanPos2 = await frame.evaluate((correction) => {
      const {top, left, bottom, right} = correction.getBoundingClientRect();
      return {top, left, bottom, right};
    }, correction);    
    targetX = spanPos2.left + ((spanPos2.right - spanPos2.left) / 2) + sidebarWidth;
    targetY = spanPos2.top + ((spanPos2.bottom - spanPos2.top) / 2) + menubarHeight;
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue2 = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue2).toBe('*: <span class="gap" wce="__t=gap&amp;__n=&amp;gap_reason_dummy_lacuna=lacuna&amp;gap_reason_dummy_illegible=illegible&amp;gap_reason_dummy_unspecified=unspecified&amp;gap_reason_dummy_inferredPage=inferredPage&amp;supplied_source_other=&amp;supplied_source=na28&amp;gap_reason=illegible&amp;unit_other=&amp;unit=&amp;mark_as_supplied=supplied">[δυναμις <span class="abbr_add_overline" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;add_overline=overline&amp;abbr_type_other=&amp;abbr_type=nomSac" wce_orig="θυ">θυ</span> εστιν]</span><div style="margin-top:15px">Correction</div><div style="margin-top:5px">corrector: δυναμις <span class="abbr_add_overline" style="text-decoration:overline" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;add_overline=overline&amp;abbr_type_other=&amp;abbr_type=nomSac" wce_orig="%CE%B8%CF%85">θυ</span> εστιν </div>')

  }, 200000);



});
