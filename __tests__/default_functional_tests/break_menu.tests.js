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
  await page.goto(`file:${path.join(__dirname, 'test_index_page.html')}`);
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
    await page.waitForSelector('div[id="mceu_39"]', {hidden: true});
    await frame.type('body#tinymce', 'my first page');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=r&amp;fibre_type=&amp;lb_alignment=&amp;facs=\" id=\"pb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />PB 1r<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"cb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />CB 1<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"lb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span> my first page');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/>' +
                        '<lb n="P1rC1L-"/><w>my</w><w>first</w><w>page</w>' + xmlTail);
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
    await page.waitForSelector('div[id="mceu_39"]', {hidden: true});
    await frame.type('body#tinymce', 'my first page');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=r&amp;fibre_type=&amp;lb_alignment=&amp;facs=http%3A%2F%2Fthelibrary%2Fimage7.jpg\" id=\"pb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />PB 1r<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"cb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />CB 1<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"lb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span> my first page');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="1r" type="folio" facs="http://thelibrary/image7.jpg" xml:id="P1r-"/><cb n="P1rC1-"/>' +
                        '<lb n="P1rC1L-"/><w>my</w><w>first</w><w>page</w>' + xmlTail);
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
    await page.waitForSelector('div[id="mceu_39"]', {hidden: true});
    await frame.type('body#tinymce', 'my second page');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('end of page<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=&amp;fibre_type=&amp;lb_alignment=&amp;facs=\" id=\"pb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />PB 1<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"cb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />CB 1<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"lb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span> my second page');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>end</w><w>of</w><w>page</w><pb n="1" type="page" xml:id="P1-"/><cb n="P1C1-"/>' +
                        '<lb n="P1C1L-"/><w>my</w><w>second</w><w>page</w>' + xmlTail);
  }, 200000);

  test('mid-word page, for papyri (type=page and y)', async () => {

    await frame.type('body#tinymce', 'half of word on second page');
    for (let i=0; i<'rd on second page'.length; i++) {
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
    await page.waitForSelector('div[id="mceu_39"]', {hidden: true});
    // it always adds a space after the line break which breaks the word wrapping so fix that
    await page.keyboard.press('Backspace');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('half of wo<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=yes&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=&amp;fibre_type=y&amp;lb_alignment=&amp;facs=\" id=\"pb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span>‐<br />PB 1y<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"cb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />CB 1<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"lb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span>rd on second page');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>half</w><w>of</w><w>wo<pb n="1↓" type="page" xml:id="P1y-" break="no"/><cb n="P1yC1-"/>' +
                        '<lb n="P1yC1L-"/>rd</w><w>on</w><w>second</w><w>page</w>' + xmlTail);
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
    await page.waitForSelector('div[id="mceu_39"]', {hidden: true});

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
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});

    await frame.type('body#tinymce', 'my second column');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=v&amp;fibre_type=&amp;lb_alignment=&amp;facs=\" id=\"pb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />PB 1v<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"cb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />CB 1<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"lb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span> my first column<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=cb&amp;number=2&amp;rv=v&amp;fibre_type=&amp;lb_alignment=&amp;facs=\" id=\"cb_2_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />CB 2<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"lb_2_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span> my second column');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="1v" type="folio" xml:id="P1v-"/><cb n="P1vC1-"/><lb n="P1vC1L-"/>' +
                        '<w>my</w><w>first</w><w>column</w><cb n="P1vC2-"/><lb n="P1vC2L-"/>' +
                        '<w>my</w><w>second</w><w>column</w>' + xmlTail);
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
    await page.waitForSelector('div[id="mceu_39"]', {hidden: true});

    await frame.type('body#tinymce', 'my first column');
    for (let i=0; i<'mn'.length; i++) {
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
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});

    // it always adds a space after the line break which breaks the word wrapping so fix that
    await page.keyboard.press('Backspace');
    for (let i=0; i<'mn'.length; i++) {
      await page.keyboard.press('ArrowRight');
    }

    await frame.type('body#tinymce', ' my second column');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=v&amp;fibre_type=&amp;lb_alignment=&amp;facs=\" id=\"pb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />PB 1v<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"cb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />CB 1<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"lb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span> my first colu<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=yes&amp;help=Help&amp;break_type=cb&amp;number=2&amp;rv=v&amp;fibre_type=&amp;lb_alignment=&amp;facs=\" id=\"cb_2_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span>‐<br />CB 2<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"lb_2_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span>mn my second column');
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
    await page.waitForSelector('div[id="mceu_39"]', {hidden: true});

    await frame.type('body#tinymce', 'my first line');

    // open B menu again
    await page.click('button#mceu_10-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.select('select[id="break_type"]', 'lb');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});

    await frame.type('body#tinymce', 'my second line');


    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=&amp;fibre_type=&amp;lb_alignment=&amp;facs=\" id=\"pb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />PB 1<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"cb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />CB 1<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"lb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span> my first line<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;lb_alignment=&amp;facs=\"><span class=\"format_start mceNonEditable\">‹</span><br />↵ <span class=\"format_end mceNonEditable\">›</span></span> my second line');
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
    await page.waitForSelector('div[id="mceu_39"]', {hidden: true});

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
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});

    await frame.type('body#tinymce', 'my second line');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=&amp;fibre_type=&amp;lb_alignment=&amp;facs=\" id=\"pb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />PB 1<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"cb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />CB 1<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"lb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span> my first line<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;lb_alignment=hang&amp;facs=\"><span class=\"format_start mceNonEditable\">‹</span><br />↵← <span class=\"format_end mceNonEditable\">›</span></span> my second line');
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
    await page.waitForSelector('div[id="mceu_39"]', {hidden: true});

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
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});

    await frame.type('body#tinymce', 'my second line');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=&amp;fibre_type=&amp;lb_alignment=&amp;facs=\" id=\"pb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />PB 1<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"cb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />CB 1<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"lb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span> my first line<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;lb_alignment=indent&amp;facs=\"><span class=\"format_start mceNonEditable\">‹</span><br />↵→ <span class=\"format_end mceNonEditable\">›</span></span> my second line');
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
    await page.waitForSelector('div[id="mceu_39"]', {hidden: true});

    await frame.type('body#tinymce', 'my first line');

    for (let i=0; i<'ne'.length; i++) {
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
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});

    for (let i=0; i<'ne'.length; i++) {
      await page.keyboard.press('ArrowRight');
    }

    await frame.type('body#tinymce', ' my second line');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=v&amp;fibre_type=&amp;lb_alignment=&amp;facs=\" id=\"pb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />PB 1v<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"cb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />CB 1<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"lb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span> my first li<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=yes&amp;help=Help&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;lb_alignment=&amp;facs=\"><span class=\"format_start mceNonEditable\">‹</span>‐<br />↵ <span class=\"format_end mceNonEditable\">›</span></span>ne my second line');
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
    await page.waitForSelector('div[id="mceu_39"]', {hidden: true});

    await frame.type('body#tinymce', 'my first line');

    for (let i=0; i<'ne'.length; i++) {
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
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});

    for (let i=0; i<'ne'.length; i++) {
      await page.keyboard.press('ArrowRight');
    }

    await frame.type('body#tinymce', ' my second line');

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=pb&amp;number=1&amp;rv=v&amp;fibre_type=&amp;lb_alignment=&amp;facs=\" id=\"pb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />PB 1v<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"cb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />CB 1<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"lb_3_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span> my first li<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=yes&amp;help=Help&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;lb_alignment=hang&amp;facs=\"><span class=\"format_start mceNonEditable\">‹</span>‐<br />↵← <span class=\"format_end mceNonEditable\">›</span></span>ne my second line');
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
    await page.waitForSelector('div[id="mceu_39"]', {hidden: true});

    const idRegex = /id="(.)b_(\d)_\d+"/g;
    const htmlData = await page.evaluate(`getData()`);
    const modifiedHtml = htmlData.replace(idRegex, 'id="$1b_$2_MATH.RAND"');
    expect(modifiedHtml).toBe('<span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;help=Help&amp;break_type=gb&amp;number=3&amp;rv=&amp;fibre_type=&amp;lb_alignment=&amp;facs=\" id=\"qb_4_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />QB<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=pb&amp;number=1&amp;rv=r&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"pb_4_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />PB 1r<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;break_type=cb&amp;number=1&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"cb_4_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />CB 1<span class=\"format_end mceNonEditable\">›</span></span><span class=\"mceNonEditable brea\" wce=\"__t=brea&amp;__n=&amp;hasBreak=no&amp;break_type=lb&amp;number=&amp;rv=&amp;fibre_type=&amp;page_number=&amp;running_title=&amp;facs=&amp;lb_alignment=\" id=\"lb_4_MATH.RAND\"><span class=\"format_start mceNonEditable\">‹</span><br />↵<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<gb n="3"/><pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/>' + xmlTail);
  }, 200000);

});