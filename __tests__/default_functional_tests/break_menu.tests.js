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
    headless: "new",
    slowMo: 60,
    args: ['--disable-web-security', '--no-sandbox']
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


describe('testing B menu - breaks', () => {


  test('initial page, using type=folio', async () => {

    // open B menu
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="break_type"]', 'pb');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', { hidden: true });
    await frame.type('body#tinymce', 'my first page');

    // test the hover over
    // get the location of the span
    const breaks = await frame.$$('span.brea');
    const pb = breaks[0];
    const spanPos = await frame.evaluate((pb) => {
      const {top, left, bottom, right} = pb.getBoundingClientRect();
      return {top, left, bottom, right};
    }, pb);
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
    targetY = spanPos.bottom + menubarHeight - 10;  // page breaks spans two lines so stick close to the bottom
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue).toBe('<div>Page number (in sequence): 1r</div>');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=r&amp;fibre_type=&amp;lb_alignment=&amp;facs=" id="pb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB 1r<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="cb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​my first page');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/>' +
      '<lb n="P1rC1L-"/><w>my</w><w>first</w><w>page</w>' + xmlTail);

    // test that the page number can be properly edited
    const pageBreakEnds = await frame.$$('span.format_end');
    const pageBreakEnd = pageBreakEnds[0];
    await pageBreakEnd.click();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    expect(await menuFrame2.$eval('#break_type', el => el.value)).toBe('pb');
    expect(await menuFrame2.$eval('#number', el => el.value)).toBe('1');
    expect(await menuFrame2.$eval('#rv', el => el.value)).toBe('r');

    // change the number and side
    await menuFrame2.type('input#number', '2');
    // delete the 1
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Backspace');

    await menuFrame2.select('select[id="rv"]', 'v');
    await menuFrame2.click('input#insert');
    const htmlData2 = await page.evaluate(`getData()`);
    const modifiedHtml2 = htmlData2.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml2).toBe('​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=2&amp;rv=v&amp;fibre_type=&amp;lb_alignment=&amp;facs=" id="pb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB 2v<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="cb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​my first page');
    const xmlData2 = await page.evaluate(`getTEI()`);
    expect(xmlData2).toBe(xmlHead + '<pb n="2v" type="folio" xml:id="P2v-"/><cb n="P2vC1-"/>' +
      '<lb n="P2vC1L-"/><w>my</w><w>first</w><w>page</w>' + xmlTail);

    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue2 = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue2).toBe('<div>Page number (in sequence): 2v</div>');

  }, 200000);

  test('check simple line break hover over and editing if set with setTEI', async () => {
    const data = xmlHead + '<pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/>' +
                           '<lb n="P1rC1L-"/><w>my</w><w>first</w><w>page</w>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);

    // test the hover over
    // get the location of the span
    const breaks = await frame.$$('span.brea');
    const pb = breaks[0];
    const spanPos = await frame.evaluate((pb) => {
      const {top, left, bottom, right} = pb.getBoundingClientRect();
      return {top, left, bottom, right};
    }, pb);
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
    targetY = spanPos.bottom + menubarHeight - 10;  // page breaks spans two lines so stick close to the bottom
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue).toBe('<div>Page number (in sequence): 1r</div>');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=pb&amp;number=1&amp;rv=r&amp;fibre_type=&amp;facs=&amp;lb_alignment=&amp;hasBreak=no" id="pb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB 1r<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no" id="cb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no" id="lb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵ <span class="format_end mceNonEditable">›</span></span> my first page');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/>' +
      '<lb n="P1rC1L-"/><w>my</w><w>first</w><w>page</w>' + xmlTail);

    // test that the page number can be properly edited
    const pageBreakEnds = await frame.$$('span.format_end');
    const pageBreakEnd = pageBreakEnds[0];
    await pageBreakEnd.click();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    expect(await menuFrame.$eval('#break_type', el => el.value)).toBe('pb');
    expect(await menuFrame.$eval('#number', el => el.value)).toBe('1');
    expect(await menuFrame.$eval('#rv', el => el.value)).toBe('r');

    // change the number and side
    await menuFrame.type('input#number', '2');
    // delete the 1
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Backspace');

    await menuFrame.select('select[id="rv"]', 'v');
    await menuFrame.click('input#insert');
    const htmlData2 = await page.evaluate(`getData()`);
    const modifiedHtml2 = htmlData2.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml2).toBe('​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=2&amp;rv=v&amp;fibre_type=&amp;lb_alignment=&amp;facs=" id="pb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB 2v<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no" id="cb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=lb&amp;number=&amp;lb_alignment=&amp;rv=&amp;fibre_type=&amp;facs=&amp;hasBreak=no" id="lb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵ <span class="format_end mceNonEditable">›</span></span> my first page');
    const xmlData2 = await page.evaluate(`getTEI()`);
    expect(xmlData2).toBe(xmlHead + '<pb n="2v" type="folio" xml:id="P2v-"/><cb n="P2vC1-"/>' +
      '<lb n="P2vC1L-"/><w>my</w><w>first</w><w>page</w>' + xmlTail);

    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue2 = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue2).toBe('<div>Page number (in sequence): 2v</div>');
  }, 200000);

  test('initial page, using type=folio, with facsimile', async () => {

    // open B menu
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="break_type"]', 'pb');
    await menuFrame.type('input#facs', 'http://thelibrary/image7.jpg');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', { hidden: true });
    await frame.type('body#tinymce', 'my first page');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=r&amp;fibre_type=&amp;lb_alignment=&amp;facs=http%3A%2F%2Fthelibrary%2Fimage7.jpg" id="pb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB 1r<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="cb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​my first page');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="1r" type="folio" facs="http://thelibrary/image7.jpg" xml:id="P1r-"/><cb n="P1rC1-"/>' +
      '<lb n="P1rC1L-"/><w>my</w><w>first</w><w>page</w>' + xmlTail);

    // test the hover over
    // get the location of the span
    const breaks = await frame.$$('span.brea');
    const pb = breaks[0];
    const spanPos = await frame.evaluate((pb) => {
      const {top, left, bottom, right} = pb.getBoundingClientRect();
      return {top, left, bottom, right};
    }, pb);
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
    targetY = spanPos.bottom + menubarHeight - 10;  // page breaks spans two lines so stick close to the bottom
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue).toBe('<div>Page number (in sequence): 1r</div><div>URL to digital image: http://thelibrary/image7.jpg</div>');

    // test that the page number can be properly edited
    const pageBreakEnds = await frame.$$('span.format_end');
    const pageBreakEnd = pageBreakEnds[0];
    await pageBreakEnd.click();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    expect(await menuFrame2.$eval('#break_type', el => el.value)).toBe('pb');
    expect(await menuFrame2.$eval('#number', el => el.value)).toBe('1');
    expect(await menuFrame2.$eval('#rv', el => el.value)).toBe('r');
    expect(await menuFrame2.$eval('input#facs', el => el.value)).toBe('http://thelibrary/image7.jpg');

    // change the data
    await menuFrame2.type('input#facs', '9.jpg');
    for (let i = 0; i < '9.jpg'.length; i += 1) {
      await page.keyboard.press('ArrowLeft');
    }
    for (let i = 0; i < '7.jpg'.length; i += 1) {
      await page.keyboard.press('Backspace');
    }
    await menuFrame2.click('input#insert');

    const htmlData2 = await page.evaluate(`getData()`);
    const modifiedHtml2 = htmlData2.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml2).toBe('​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=r&amp;fibre_type=&amp;lb_alignment=&amp;facs=http%3A%2F%2Fthelibrary%2Fimage9.jpg" id="pb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB 1r<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="cb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​my first page');
    const xmlData2 = await page.evaluate(`getTEI()`);
    expect(xmlData2).toBe(xmlHead + '<pb n="1r" type="folio" facs="http://thelibrary/image9.jpg" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/><w>my</w><w>first</w><w>page</w>' + xmlTail);

    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue2 = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue2).toBe('<div>Page number (in sequence): 1r</div><div>URL to digital image: http://thelibrary/image9.jpg</div>');

  }, 200000);

  test('mid-text page, using type=page', async () => {

    await frame.type('body#tinymce', 'end of page');
    // open B menu
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="break_type"]', 'pb');
    await menuFrame.select('select[id="rv"]', '');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', { hidden: true });
    await frame.type('body#tinymce', 'my second page');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('end of page​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=&amp;fibre_type=&amp;lb_alignment=&amp;facs=" id="pb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="cb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​my second page');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>end</w><w>of</w><w>page</w><pb n="1" type="page" xml:id="P1-"/><cb n="P1C1-"/>' +
      '<lb n="P1C1L-"/><w>my</w><w>second</w><w>page</w>' + xmlTail);
  }, 200000);

  test('mid-word page, for papyri (type=page and y)', async () => {

    await frame.type('body#tinymce', 'half of word on second page');
    for (let i = 0; i < 'rd on second page'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }

    // open B menu
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="break_type"]', 'pb');
    await menuFrame.select('select[id="rv"]', '');
    await menuFrame.select('select[id="fibre_type"]', 'y');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', { hidden: true });

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('half of wo​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=yes&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=&amp;fibre_type=y&amp;lb_alignment=&amp;facs=" id="pb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span>‐<br />PB 1y<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="cb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​rd on second page');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>half</w><w>of</w><w>wo<pb n="1↓" type="page" xml:id="P1y-" break="no"/><cb n="P1yC1-"/>' +
      '<lb n="P1yC1L-"/>rd</w><w>on</w><w>second</w><w>page</w>' + xmlTail);

    // test the hover over
    // get the location of the span
    const breaks = await frame.$$('span.brea');
    const pb = breaks[0];
    const spanPos = await frame.evaluate((pb) => {
      const {top, left, bottom, right} = pb.getBoundingClientRect();
      return {top, left, bottom, right};
    }, pb);
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
    targetY = spanPos.bottom + menubarHeight - 10;  // page breaks spans two lines so stick close to the bottom
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue).toBe('<div>Page number (in sequence): 1↓</div>');

    // test that the page number can be properly edited
    const pageBreakEnds = await frame.$$('span.format_end');
    const pageBreakEnd = pageBreakEnds[0];
    await pageBreakEnd.click();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    expect(await menuFrame2.$eval('#break_type', el => el.value)).toBe('pb');
    expect(await menuFrame2.$eval('#number', el => el.value)).toBe('1');
    expect(await menuFrame2.$eval('#rv', el => el.value)).toBe('');
    expect(await menuFrame2.$eval('#fibre_type', el => el.value)).toBe('y');

    // change the data
    await menuFrame2.select('select[id="fibre_type"]', 'x');
    await menuFrame2.click('input#insert');

    const htmlData2 = await page.evaluate(`getData()`);
    const modifiedHtml2 = htmlData2.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml2).toBe('half of wo​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=yes&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=&amp;fibre_type=x&amp;lb_alignment=&amp;facs=" id="pb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span>‐<br />PB 1x<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="cb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​rd on second page');
    const xmlData2 = await page.evaluate(`getTEI()`);
    expect(xmlData2).toBe(xmlHead + '<w>half</w><w>of</w><w>wo<pb n="1→" type="page" xml:id="P1x-" break="no"/><cb n="P1xC1-"/><lb n="P1xC1L-"/>rd</w><w>on</w><w>second</w><w>page</w>' + xmlTail);

    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue2 = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue2).toBe('<div>Page number (in sequence): 1→</div>');

  }, 200000);

  test('between-word column', async () => {

    // open B menu
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="break_type"]', 'pb');
    await menuFrame.select('select[id="rv"]', 'v');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', { hidden: true });

    await frame.type('body#tinymce', 'my first column');

    // open B menu again
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.select('select[id="break_type"]', 'cb');
    await menuFrame2.select('select[id="rv"]', 'v');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    await frame.type('body#tinymce', 'my second column');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=v&amp;fibre_type=&amp;lb_alignment=&amp;facs=" id="pb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB 1v<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="cb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​my first column​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=cb&amp;number=2&amp;rv=v&amp;fibre_type=&amp;lb_alignment=&amp;facs=" id="cb_2_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 2<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_2_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​my second column');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="1v" type="folio" xml:id="P1v-"/><cb n="P1vC1-"/><lb n="P1vC1L-"/>' +
      '<w>my</w><w>first</w><w>column</w><cb n="P1vC2-"/><lb n="P1vC2L-"/>' +
      '<w>my</w><w>second</w><w>column</w>' + xmlTail);

    // test the hover over
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    // get the location of the first cb span
    const breaks = await frame.$$('span.brea');
    const cb1 = breaks[1];
    const spanPos1 = await frame.evaluate((cb1) => {
      const {top, left, bottom, right} = cb1.getBoundingClientRect();
      return {top, left, bottom, right};
    }, cb1);
    
    // columns breaks span two lines and can be right at the end of a line so mouse over calculation is different
    targetX = spanPos1.left + sidebarWidth + 10;
    targetY = spanPos1.bottom + menubarHeight - 10;

    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue).toBe('<div>Number: 1</div>');

    // get the location of the first cb span
    const cb2 = breaks[3];
    const spanPos2 = await frame.evaluate((cb2) => {
      const {top, left, bottom, right} = cb2.getBoundingClientRect();
      return {top, left, bottom, right};
    }, cb2);
    
    targetX = spanPos2.left + sidebarWidth + 10;
    targetY = spanPos2.bottom + menubarHeight - 10;
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue2 = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue2).toBe('<div>Number: 2</div>');

    // test that the column number can be properly edited (change column 2 to column 3)
    const pageBreakEnds = await frame.$$('span.format_end');
    const pageBreakEnd = pageBreakEnds[3];
    await pageBreakEnd.click();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle3 = await page.$('div[id="mceu_41"] > div > div > iframe');
    const menuFrame3 = await menuFrameHandle3.contentFrame();
    expect(await menuFrame3.$eval('#break_type', el => el.value)).toBe('cb');
    expect(await menuFrame3.$eval('#number', el => el.value)).toBe('2');
    expect(await menuFrame3.$eval('#rv', el => el.disabled)).toBe(true);
    expect(await menuFrame3.$eval('#fibre_type', el => el.disabled)).toBe(true);

    // change the data
    await menuFrame3.type('input#number', '3');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Backspace');
    await menuFrame3.click('input#insert');

    const htmlData2 = await page.evaluate(`getData()`);
    const modifiedHtml2 = htmlData2.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml2).toBe('​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=v&amp;fibre_type=&amp;lb_alignment=&amp;facs=" id="pb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB 1v<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="cb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​my first column​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=cb&amp;number=3&amp;rv=v&amp;fibre_type=&amp;lb_alignment=&amp;facs=" id="cb_2_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 3<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_2_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​my second column');
    const xmlData2 = await page.evaluate(`getTEI()`);
    expect(xmlData2).toBe(xmlHead + '<pb n="1v" type="folio" xml:id="P1v-"/><cb n="P1vC1-"/><lb n="P1vC1L-"/>' +
      '<w>my</w><w>first</w><w>column</w><cb n="P1vC3-"/><lb n="P1vC3L-"/>' +
      '<w>my</w><w>second</w><w>column</w>' + xmlTail);

    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue3 = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue3).toBe('<div>Number: 3</div>');

  }, 200000);

  test('mid-word column', async () => {

    // open B menu
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="break_type"]', 'pb');
    await menuFrame.select('select[id="rv"]', 'v');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', { hidden: true });

    await frame.type('body#tinymce', 'my first column');
    for (let i = 0; i < 'mn'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }

    // open B menu again
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.select('select[id="break_type"]', 'cb');
    await menuFrame2.select('select[id="rv"]', 'v');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    for (let i = 0; i < 'mn'.length; i++) {
      await page.keyboard.press('ArrowRight');
    }

    await frame.type('body#tinymce', ' my second column');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=v&amp;fibre_type=&amp;lb_alignment=&amp;facs=" id="pb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB 1v<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="cb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​my first colu​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=yes&amp;help=Help&amp;break_type=cb&amp;number=2&amp;rv=v&amp;fibre_type=&amp;lb_alignment=&amp;facs=" id="cb_2_MATH.RAND"><span class="format_start mceNonEditable">‹</span>‐<br />CB 2<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_2_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​mn my second column');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="1v" type="folio" xml:id="P1v-"/><cb n="P1vC1-"/><lb n="P1vC1L-"/>' +
      '<w>my</w><w>first</w><w>colu<cb n="P1vC2-" break="no"/><lb n="P1vC2L-"/>mn</w>' +
      '<w>my</w><w>second</w><w>column</w>' + xmlTail);
  }, 200000);

  test('between-word linebreak', async () => {

    // open B menu
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="break_type"]', 'pb');
    await menuFrame.select('select[id="rv"]', '');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', { hidden: true });

    await frame.type('body#tinymce', 'my first line');

    // open B menu again
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.select('select[id="break_type"]', 'lb');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    await frame.type('body#tinymce', 'my second line');


    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=&amp;fibre_type=&amp;lb_alignment=&amp;facs=" id="pb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="cb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​my first line​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;lb_alignment=&amp;facs="><span class="format_start mceNonEditable">‹</span><br />↵ <span class="format_end mceNonEditable">›</span></span>​my second line');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="1" type="page" xml:id="P1-"/><cb n="P1C1-"/><lb n="P1C1L-"/>' +
      '<w>my</w><w>first</w><w>line</w><lb n="P1C1L-"/><w>my</w><w>second</w><w>line</w>' + xmlTail);
  }, 200000);

  test('between-word linebreak, hanging line', async () => {

    // open B menu
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="break_type"]', 'pb');
    await menuFrame.select('select[id="rv"]', '');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', { hidden: true });

    await frame.type('body#tinymce', 'my first line');

    // open B menu again
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.select('select[id="break_type"]', 'lb');
    await menuFrame2.select('select[id="lb_alignment"]', 'hang');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    await frame.type('body#tinymce', 'my second line');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=&amp;fibre_type=&amp;lb_alignment=&amp;facs=" id="pb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="cb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​my first line​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;lb_alignment=hang&amp;facs="><span class="format_start mceNonEditable">‹</span><br />↵← <span class="format_end mceNonEditable">›</span></span>​my second line');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="1" type="page" xml:id="P1-"/><cb n="P1C1-"/><lb n="P1C1L-"/>' +
      '<w>my</w><w>first</w><w>line</w><lb n="P1C1L-" rend="hang"/><w>my</w><w>second</w><w>line</w>' + xmlTail);
  }, 200000);


  test('between-word linebreak, indented line', async () => {

    // open B menu
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="break_type"]', 'pb');
    await menuFrame.select('select[id="rv"]', '');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', { hidden: true });

    await frame.type('body#tinymce', 'my first line');

    // open B menu again
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.select('select[id="break_type"]', 'lb');
    await menuFrame2.select('select[id="lb_alignment"]', 'indent');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    await frame.type('body#tinymce', 'my second line');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=&amp;fibre_type=&amp;lb_alignment=&amp;facs=" id="pb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="cb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​my first line​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;lb_alignment=indent&amp;facs="><span class="format_start mceNonEditable">‹</span><br />↵→ <span class="format_end mceNonEditable">›</span></span>​my second line');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="1" type="page" xml:id="P1-"/><cb n="P1C1-"/><lb n="P1C1L-"/>' +
      '<w>my</w><w>first</w><w>line</w><lb n="P1C1L-" rend="indent"/><w>my</w><w>second</w><w>line</w>' + xmlTail);
  }, 200000);

  test('mid-word linebreak', async () => {

    // open B menu
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="break_type"]', 'pb');
    await menuFrame.select('select[id="rv"]', 'v');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', { hidden: true });

    await frame.type('body#tinymce', 'my first line');

    for (let i = 0; i < 'ne'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }

    // open B menu again
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.select('select[id="break_type"]', 'lb');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    for (let i = 0; i < 'ne'.length; i++) {
      await page.keyboard.press('ArrowRight');
    }

    await frame.type('body#tinymce', ' my second line');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=v&amp;fibre_type=&amp;lb_alignment=&amp;facs=" id="pb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB 1v<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="cb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​my first li​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=yes&amp;help=Help&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;lb_alignment=&amp;facs="><span class="format_start mceNonEditable">‹</span>‐<br />↵ <span class="format_end mceNonEditable">›</span></span>ne my second line');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="1v" type="folio" xml:id="P1v-"/><cb n="P1vC1-"/><lb n="P1vC1L-"/><w>my</w><w>first</w><w>li' +
      '<lb n="P1vC1L-" break="no"/>ne</w><w>my</w><w>second</w><w>line</w>' + xmlTail);
  }, 200000);

  test('mid-word linebreak with rend attribute', async () => {

    // open B menu
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="break_type"]', 'pb');
    await menuFrame.select('select[id="rv"]', 'v');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', { hidden: true });

    await frame.type('body#tinymce', 'my first line');

    for (let i = 0; i < 'ne'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }

    // open B menu again
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.select('select[id="break_type"]', 'lb');
    await menuFrame2.select('select[id="lb_alignment"]', 'hang');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', { hidden: true });

    for (let i = 0; i < 'ne'.length; i++) {
      await page.keyboard.press('ArrowRight');
    }

    await frame.type('body#tinymce', ' my second line');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=v&amp;fibre_type=&amp;lb_alignment=&amp;facs=" id="pb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB 1v<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="cb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_3_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​my first li​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=yes&amp;help=Help&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;lb_alignment=hang&amp;facs="><span class="format_start mceNonEditable">‹</span>‐<br />↵← <span class="format_end mceNonEditable">›</span></span>ne my second line');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="1v" type="folio" xml:id="P1v-"/><cb n="P1vC1-"/><lb n="P1vC1L-"/><w>my</w><w>first</w><w>li' +
      '<lb n="P1vC1L-" rend="hang" break="no"/>ne</w><w>my</w><w>second</w><w>line</w>' + xmlTail);
  }, 200000);

  test('quire break', async () => {

    // open B menu
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="break_type"]', 'gb');
    await menuFrame.type('input#number', '3');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Backspace');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', { hidden: true });

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=gb&amp;number=3&amp;rv=&amp;fibre_type=&amp;lb_alignment=&amp;facs=" id="qb_4_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />QB<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=pb&amp;number=1&amp;rv=r&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="pb_4_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB 1r<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="cb_4_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_4_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<gb n="3"/><pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/>' + xmlTail);

    // test the hover over
    // get the location of the span
    const breaks = await frame.$$('span.brea');
    const gb = breaks[0];
    const spanPos = await frame.evaluate((gb) => {
      const {top, left, bottom, right} = gb.getBoundingClientRect();
      return {top, left, bottom, right};
    }, gb);
    const sidebarWidth = await page.$eval('.wce-linenumber-sidebar', el => el.offsetWidth);
    const menubarHeight = await page.$eval('#mceu_25-body', el => el.offsetHeight);
    targetX = spanPos.left + ((spanPos.right - spanPos.left) / 2) + sidebarWidth;
    targetY = spanPos.bottom + menubarHeight - 10;  // page breaks spans two lines so stick close to the bottom
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue).toBe('<div>Number: 3</div>');

    // test that the page number can be properly edited
    const pageBreakEnds = await frame.$$('span.format_end');
    const pageBreakEnd = pageBreakEnds[0];
    await pageBreakEnd.click();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    expect(await menuFrame2.$eval('#break_type', el => el.value)).toBe('gb');
    expect(await menuFrame2.$eval('#number', el => el.value)).toBe('3');
    expect(await menuFrame2.$eval('#rv', el => el.disabled)).toBe(true);
    expect(await menuFrame2.$eval('#fibre_type', el => el.disabled)).toBe(true);

    // change the data
    await menuFrame2.type('input#number', '4');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Backspace');
    await menuFrame2.click('input#insert');

    const htmlData2 = await page.evaluate(`getData()`);
    const modifiedHtml2 = htmlData2.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml2).toBe('​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=gb&amp;number=4&amp;rv=&amp;fibre_type=&amp;lb_alignment=&amp;facs=" id="qb_4_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />QB<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=pb&amp;number=1&amp;rv=r&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="pb_4_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />PB 1r<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="cb_4_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />CB 1<span class="format_end mceNonEditable">›</span></span>​<span class="brea" wce="__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=" id="lb_4_MATH.RAND"><span class="format_start mceNonEditable">‹</span><br />↵<span class="format_end mceNonEditable">›</span></span>​');
    const xmlData2 = await page.evaluate(`getTEI()`);
    expect(xmlData2).toBe(xmlHead + '<gb n="4"/><pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/>' + xmlTail);
    await page.mouse.move(targetX, targetY);
    // check the content of the hover over
    const hoverValue2 = await page.$eval('#hover-data-content', el => el.innerHTML);
    expect(hoverValue2).toBe('<div>Number: 4</div>');

  }, 200000);

  test('the marginalia menu is activated after a page break if the break was added with setTei', async () => {
    const data = xmlHead + '<pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    const disabled1 = await page.$eval('#mceu_15', element => element.getAttribute('aria-disabled'));
    expect(disabled1).toBe('true');

    await page.keyboard.press('ArrowRight');
    const disabled2 = await page.$eval('#mceu_15', element => element.getAttribute('aria-disabled'));
    expect(disabled2).toBe('false');

  }, 200000);

});
