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



describe('testing with default client settings', () => {


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



  test('test basic words', async () => {
    await frame.type('body#tinymce', 'my words');
    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('my words');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>my</w><w>words</w>' + xmlTail);

  }, 200000);

  test('test expanded text', async () => {
    await frame.type('body#tinymce', 'my words');
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'rds'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');
    // open A menu
    await page.click('button#mceu_14-open');
    // navigate submenu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    // access mnu window and make selection
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});
    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('my wo<span class=\"part_abbr\" wce_orig=\"rds\" wce=\"__t=part_abbr&amp;__n=&amp;' +
                          'help=Help&amp;exp_rend=&amp;exp_rend_other=\"><span class=\"format_start mceNonEditable\">‹' +
                          '</span>(rds)<span class=\"format_end mceNonEditable\">›</span></span>');
  }, 200000);

  test('test expanded whole word with symbol', async () => {
    await frame.type('body#tinymce', 'my words');
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'words'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');
    // open A menu
    await page.click('button#mceu_14-open');
    // navigate submenu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    // access mnu window and make selection
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="exp_rend"]', '÷');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});
    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('my <span class=\"part_abbr\" wce_orig=\"words\" wce=\"__t=part_abbr&amp;__n=&amp;' +
                          'help=Help&amp;exp_rend=%C3%B7&amp;exp_rend_other=\">' +
                          '<span class=\"format_start mceNonEditable\">‹</span>(words)' +
                          '<span class=\"format_end mceNonEditable\">›</span></span>');
  }, 200000);

  test('whole word unclear with no reason', async () => {
    await frame.type('body#tinymce', 'my words');
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'words'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');
    // open D menu
    await page.click('button#mceu_12-open');
    // navigate submenu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    // access mnu window and make selection
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});
    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('my <span class=\"unclear\" wce_orig=\"words\" wce=\"__t=unclear&amp;__n=&amp;' +
                          'help=Help&amp;unclear_text_reason=&amp;unclear_text_reason_other=\">' +
                          '<span class=\"format_start mceNonEditable\">‹</span>ẉọṛḍṣ' +
                          '<span class=\"format_end mceNonEditable\">›</span></span>');
  }, 200000);

  test('part word unclear with reason', async () => {
    await frame.type('body#tinymce', 'my words');
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'rds'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');
    // open D menu
    await page.click('button#mceu_12-open');
    // navigate submenu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    // access menu window and make selection
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="unclear_text_reason"]', 'damage to page');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});
    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('my wo<span class="unclear" wce_orig="rds" wce="__t=unclear&amp;__n=&amp;help=Help' +
                          '&amp;unclear_text_reason=damage%20to%20page&amp;unclear_text_reason_other=">' +
                          '<span class="format_start mceNonEditable">‹</span>ṛḍṣ' +
                          '<span class="format_end mceNonEditable">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>my</w><w>wo<unclear reason="damage to page">rds</unclear></w>' + xmlTail);
  }, 200000);

  // space
  test('space between words', async () => {
    await frame.type('body#tinymce', 'space between  words');
    for (let i = 0; i < ' words'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    // open P menu
    await page.click('button#mceu_17-open');
    // navigate submenu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    // access menu window and make selection
    const menuFrameHandle = await page.$('div[id="mceu_41"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.type('input#sp_extent', '5');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_41"]', {hidden: true});
    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('space between <span class=\"spaces\" wce=\"__t=spaces&amp;__n=&amp;original_spaces_text=&amp;help=Help&amp;sp_unit=char&amp;sp_unit_other=&amp;sp_extent=5\"><span class=\"format_start mceNonEditable\">‹</span>sp<span class=\"format_end mceNonEditable\">›</span></span> words');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>space</w><w>between</w><space unit="char" extent="5"/><w>words</w>' + xmlTail);
  }, 200000);

  // pc typed in
  test('test pc typed', async () => {
    await frame.type('body#tinymce', 'my words.');
    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('my words<span class=\"pc\" wce_orig=\"\" wce=\"__t=pc\">' +
                          '<span class=\"format_start mceNonEditable\">‹</span>.' +
                          '<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>my</w><w>words</w><pc>.</pc>' + xmlTail);
  }, 200000);

  // pc with menu
  test('test pc with menu', async () => {
    await frame.type('body#tinymce', 'my words');
    // open P menu
    await page.click('button#mceu_17-open');
    // navigate to question mark on submenu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('my words<span class=\"pc\" wce_orig=\"\" wce=\"__t=pc\">' +
                          '<span class=\"format_start mceNonEditable\">‹</span>?' +
                          '<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>my</w><w>words</w><pc>?</pc>' + xmlTail);
  }, 200000);


  // check other punctuation option [issue #25]
  // pc with menu
  test('test pc with menu', async () => {
    await frame.type('body#tinymce', 'my words');
    // open P menu
    await page.click('button#mceu_17-open');
    // navigate to the Other option on submenu (quicker to go up!)
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_58"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.type('input#pc_char', '-');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_58"]', {hidden: true});

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('my words<span class=\"pc\" wce=\"__t=pc\">' +
                          '<span class=\"format_start mceNonEditable\">‹</span>-' +
                          '<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>my</w><w>words</w><pc>-</pc>' + xmlTail);
  }, 200000);

  // pc with menu
  test('test pc with menu (semicolon as I changed the code for that)', async () => {
    await frame.type('body#tinymce', 'my words');
    // open P menu
    await page.click('button#mceu_17-open');
    // navigate to question mark on submenu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('my words<span class=\"pc\" wce_orig=\"\" wce=\"__t=pc\">' +
                          '<span class=\"format_start mceNonEditable\">‹</span>;' +
                          '<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>my</w><w>words</w><pc>;</pc>' + xmlTail);
  }, 200000);

  //abbr
  // nomsac without overline
  test('test abbr', async () => {
    await frame.type('body#tinymce', 'a ns abbreviation');

    for (let i = 0; i < ' abbreviation'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'ns'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');
    // open A menu
    await page.click('button#mceu_14-open');
    // open abbreviation menu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    // use defaults
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a <span class=\"abbr\" wce_orig=\"ns\" wce=\"__t=abbr&amp;__n=&amp;original_abbr_text=&amp;help=Help&amp;abbr_type=nomSac&amp;abbr_type_other=\"><span class=\"format_start mceNonEditable\">‹</span>ns<span class=\"format_end mceNonEditable\">›</span></span> abbreviation');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="nomSac">ns</abbr></w><w>abbreviation</w>' + xmlTail);
  }, 200000);

  // nomsac with overline
  test('test abbr', async () => {
    await frame.type('body#tinymce', 'a ns abbreviation');

    for (let i = 0; i < ' abbreviation'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'ns'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');
    // open A menu
    await page.click('button#mceu_14-open');
    // open abbreviation menu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    // use defaults
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('#add_overline');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a <span class="abbr_add_overline" wce_orig="ns" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;help=Help&amp;abbr_type=nomSac&amp;abbr_type_other=&amp;add_overline=overline"><span class="format_start mceNonEditable">‹</span>ns<span class="format_end mceNonEditable">›</span></span> abbreviation');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="nomSac"><hi rend="overline">ns</hi></abbr></w><w>abbreviation</w>' + xmlTail);
  }, 200000);

  // TODO: add more tests on different abbr structures here?

  // capitals
  test('capitals', async () => {
    await frame.type('body#tinymce', 'Initial capital');

    for (let i = 0; i < 'nitial capital'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'I'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');
    // open O menu
    await page.click('button#mceu_13-open');
    // open capitals menu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    // use defaults
    const menuFrameHandle = await page.$('div[id="mceu_41"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.type('input#capitals_height', '3');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_41"]', {hidden: true});

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class="formatting_capitals" wce_orig="I" wce="__t=formatting_capitals&amp;__n=&amp;capitals_height=3"><span class="format_start mceNonEditable">‹</span>I<span class="format_end mceNonEditable">›</span></span>nitial capital');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w><hi rend="cap" height="3">I</hi>nitial</w><w>capital</w>' + xmlTail);
  }, 200000);

  // other ornamentation
  test('other ornamentation', async () => {
    await frame.type('body#tinymce', 'test for rendering');

    for (let i = 0; i < ' rendering'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'for'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');
    // open O menu
    await page.click('button#mceu_13-open');
    // open other menu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    // use defaults
    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.type('input#formatting_ornamentation_other', 'underlined');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', {hidden: true});

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('test <span class=\"formatting_ornamentation_other\" wce_orig=\"for\" wce=\"__t=formatting_ornamentation_other&amp;__n=&amp;formatting_ornamentation_other=underlined\"><span class=\"format_start mceNonEditable\">‹</span>for<span class=\"format_end mceNonEditable\">›</span></span> rendering');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>test</w><w><hi rend="underlined">for</hi></w><w>rendering</w>' + xmlTail);
  }, 200000);

  // example for the colour options
  test('colour ornamentation', async () => {
    await frame.type('body#tinymce', 'test for rendering');

    for (let i = 0; i < ' rendering'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'for'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');
    // open O menu
    await page.click('button#mceu_13-open');
    // navigate submenu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('test <span class=\"formatting_yellow\" wce_orig=\"for\" wce=\"__t=formatting_yellow\"><span class=\"format_start mceNonEditable\">‹</span>for<span class=\"format_end mceNonEditable\">›</span></span> rendering');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>test</w><w><hi rend="yellow">for</hi></w><w>rendering</w>' + xmlTail);
  }, 200000);

  // STRUCTURE DIVS

  // book
  test('book div', async () => {
    // open V menu
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#insertBookRadio');
    await menuFrame.type('input#insertBookNumber', 'John');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', {hidden: true});
    await frame.type('body#tinymce', 'The content of my book');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> John</span>The content of my book');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="book" n="John"><w>The</w><w>content</w><w>of</w><w>my</w><w>book</w></div>' + xmlTail);
  }, 200000);

  // chapter
  test('chapter div', async () => {
    // open V menu
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#insertChapterRadio');
    await menuFrame.type('input#insertChapterNumber', '1');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', {hidden: true});
    await frame.type('body#tinymce', 'The content of my chapter');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"chap1\"> 1</span>The content of my chapter');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="chapter" n=".1"><w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div>' + xmlTail);
  }, 200000);

  // book and chapter
  test('book and chapter div', async () => {
    // open V menu
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#insertBookRadio');
    await menuFrame.type('input#insertBookNumber', 'John');
    await menuFrame.click('input#insert');
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.click('input#insertChapterRadio');
    await menuFrame2.type('input#insertChapterNumber', '1');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});
    await frame.type('body#tinymce', 'The content of my chapter');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> John</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"chap2\"> 1</span> The content of my chapter');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="book" n="John"><div type="chapter" n="John.1"><w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div></div>' + xmlTail);
  }, 200000);

  // book, chapter and verse
  test('book, chapter and verse', async () => {
    // open V menu
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#insertBookRadio');
    await menuFrame.type('input#insertBookNumber', 'John');
    await menuFrame.click('input#insert');

    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.click('input#insertChapterRadio');
    await menuFrame2.type('input#insertChapterNumber', '1');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});

    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle3 = await page.$('div[id="mceu_41"] > div > div > iframe');
    const menuFrame3 = await menuFrameHandle3.contentFrame();
    await menuFrame3.click('input#insertVerseRadio');
    await menuFrame3.type('input#insertVerseNumber', '2');
    await menuFrame3.click('input#insert');
    await page.waitForSelector('div[id="mceu_41"]', {hidden: true});
    await frame.type('body#tinymce', 'The content of my verse');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> John</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"chap2\"> 1</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\"> 2</span> The content of my verse');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="book" n="John"><div type="chapter" n="John.1"><ab n="John.1.2"><w>The</w><w>content</w><w>of</w>' +
                        '<w>my</w><w>verse</w></ab></div></div>' + xmlTail);
  }, 200000);

  // Partial too hard to do just now with functional test as needs right click and mouse accessed menu

  // lection
  test('lection', async () => {
    // open V menu
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#insertLectionRadio');
    await menuFrame.type('input#insertLectionNumber', 'R12');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', {hidden: true});
    await frame.type('body#tinymce', 'The content of my lection');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"lection_number mceNonEditable\" wce=\"__t=lection_number&amp;__n=&amp;number=R12\"> Lec</span>The content of my lection');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="lection" n="R12"><w>The</w><w>content</w><w>of</w><w>my</w><w>lection</w></div>' + xmlTail);
    }, 200000);


  // lection, book and chapter
  test('lection, book and chapter', async () => {
    // open V menu
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#insertLectionRadio');
    await menuFrame.type('input#insertLectionNumber', 'R12');
    await menuFrame.click('input#insert');

    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.click('input#insertBookRadio');
    await menuFrame2.type('input#insertBookNumber', 'John');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});

    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle3 = await page.$('div[id="mceu_41"] > div > div > iframe');
    const menuFrame3 = await menuFrameHandle3.contentFrame();
    await menuFrame3.click('input#insertChapterRadio');
    await menuFrame3.type('input#insertChapterNumber', '1');
    await menuFrame3.click('input#insert');
    await page.waitForSelector('div[id="mceu_41"]', {hidden: true});

    await frame.type('body#tinymce', 'The content of my chapter');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"lection_number mceNonEditable\" wce=\"__t=lection_number&amp;__n=&amp;number=R12\"> Lec</span> <span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> John</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"chap2\"> 1</span> The content of my chapter');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="lection" n="R12"><div type="book" n="John"><div type="chapter" n="John.1">' +
                        '<w>The</w><w>content</w><w>of</w><w>my</w><w>chapter</w></div></div></div>' + xmlTail);
  }, 200000);


  // book and inscriptio
  test('book and inscriptio divs', async () => {
    // open V menu
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#insertBookRadio');
    await menuFrame.type('input#insertBookNumber', 'John');
    await menuFrame.click('input#insert');
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.click('input#insertInscriptioRadio');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'PLACE THE INSCRIPTIO HERE! '.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    await page.keyboard.press('Backspace');
    await frame.type('body#tinymce', 'inscriptio text');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> John</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\">Inscriptio</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\"></span>inscriptio text');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="book" n="John"><div type="inscriptio"><ab n="John.inscriptio"><w>inscriptio</w><w>text</w></ab></div></div>' + xmlTail);
  }, 200000);

  // book and subscriptio
  test('book and subscriptio divs', async () => {
    // open V menu
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#insertBookRadio');
    await menuFrame.type('input#insertBookNumber', 'John');
    await menuFrame.click('input#insert');
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle2 = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame2 = await menuFrameHandle2.contentFrame();
    await menuFrame2.click('input#insertSubscriptioRadio');
    await menuFrame2.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'PLACE THE SUBSCRIPTIO HERE! '.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    await page.keyboard.press('Backspace');
    await frame.type('body#tinymce', 'subscriptio text');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> John</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\">Subscriptio</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\"></span>subscriptio text');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="book" n="John"><div type="subscriptio"><ab n="John.subscriptio"><w>subscriptio</w><w>text</w></ab></div></div>' + xmlTail);
  }, 200000);

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
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});

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
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});

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
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});

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
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});

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
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});
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
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});
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
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});
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

  // CORRECTIONS

  test('a simple correction with visible firsthand', async () => {
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
    expect(htmlData).toBe('a <span class=\"corr\" wce_orig=\"smple\" wce=\"__t=corr&amp;__n=corrector&amp;help=Help&amp;original_firsthand_reading=smple&amp;common_firsthand_partial=&amp;reading=corr&amp;corrector_name=corrector&amp;corrector_name_other=&amp;place_corr=&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=simple\"><span class=\"format_start mceNonEditable\">‹</span>smple<span class=\"format_end mceNonEditable\">›</span></span> correction');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><app><rdg type="orig" hand="firsthand"><w>smple</w></rdg><rdg type="corr" hand="corrector">' +
                        '<w>simple</w></rdg></app><w>correction</w>' + xmlTail);
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
    expect(htmlData).toBe('a <span class=\"corr\" wce_orig=\"smple\" wce=\"__t=corr&amp;__n=corrector1&amp;help=Help&amp;original_firsthand_reading=smple&amp;common_firsthand_partial=&amp;reading=corr&amp;corrector_name=corrector1&amp;corrector_name_other=&amp;place_corr=pageleft&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=1&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=deletion_hooks&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=simple\"><span class=\"format_start mceNonEditable\">‹</span>smple<span class=\"format_end mceNonEditable\">›</span></span> correction');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><app><rdg type="orig" hand="firsthand"><w>smple</w></rdg>' +
                        '<rdg type="corr" hand="corrector1" rend="deletion_hooks"><seg type="margin" subtype="pageleft" n="@P-">' +
                        '<w>simple</w></seg></rdg></app><w>correction</w>' + xmlTail);
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
    expect(htmlData).toBe('a <span class=\"corr\" wce_orig=\"smple\" wce=\"__t=corr&amp;__n=corrector1&amp;help=Help&amp;original_firsthand_reading=smple&amp;common_firsthand_partial=&amp;reading=corr&amp;corrector_name=corrector1&amp;corrector_name_other=&amp;place_corr=above&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=1&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=deletion_hooks&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=simple\"><span class=\"format_start mceNonEditable\">‹</span>smple<span class=\"format_end mceNonEditable\">›</span></span> correction');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><app><rdg type="orig" hand="firsthand"><w>smple</w></rdg>' +
                        '<rdg type="corr" hand="corrector1" rend="deletion_hooks"><seg type="line" subtype="above" n="@PCL-">' +
                        '<w>simple</w></seg></rdg></app><w>correction</w>' + xmlTail);
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
    expect(htmlData).toBe('a <span class=\"corr\" wce_orig=\"smple\" wce=\"__t=corr&amp;__n=corrector1&amp;help=Help&amp;original_firsthand_reading=smple&amp;common_firsthand_partial=&amp;reading=corr&amp;corrector_name=corrector1&amp;corrector_name_other=&amp;place_corr=other&amp;place_corr_other=inline&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=1&amp;deletion_other=0&amp;deletion=transposition_marks&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=simple\"><span class=\"format_start mceNonEditable\">‹</span>smple<span class=\"format_end mceNonEditable\">›</span></span> correction');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><app><rdg type="orig" hand="firsthand"><w>smple</w></rdg>' +
                        '<rdg type="corr" hand="corrector1" rend="transposition_marks">' +
                        '<seg type="other" subtype="inline" n="@PCL-"><w>simple</w></seg></rdg></app><w>correction</w>' + xmlTail);
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
    expect(htmlData).toBe('a <span class=\"corr\" wce_orig=\"deletion\" wce=\"__t=corr&amp;__n=corrector&amp;help=Help&amp;original_firsthand_reading=deletion&amp;common_firsthand_partial=&amp;reading=corr&amp;corrector_name=corrector&amp;corrector_name_other=&amp;blank_correction=on&amp;place_corr=&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=1&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=strikethrough&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=deletion\"><span class=\"format_start mceNonEditable\">‹</span>deletion<span class=\"format_end mceNonEditable\">›</span></span> correction');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><app><rdg type="orig" hand="firsthand"><w>deletion</w></rdg>' +
                        '<rdg type="corr" hand="corrector" rend="strikethrough"></rdg></app><w>correction</w>' + xmlTail);
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
    expect(htmlData).toBe('an <span class=\"corr_blank_firsthand\" wce_orig=\"\" wce=\"__t=corr&amp;__n=corrector&amp;help=Help&amp;original_firsthand_reading=&amp;common_firsthand_partial=&amp;reading=corr&amp;blank_firsthand=on&amp;corrector_name=corrector&amp;corrector_name_other=&amp;place_corr=&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=addition\"><span class=\"format_start mceNonEditable\">‹</span>T<span class=\"format_end mceNonEditable\">›</span></span> correction');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>an</w><app><rdg type="orig" hand="firsthand"></rdg><rdg type="corr" hand="corrector">' +
      '<w>addition</w></rdg></app><w>correction</w>' + xmlTail);
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
    expect(htmlData).toBe('<span class=\"corr\" wce_orig=\"consecutive\" wce=\"__t=corr&amp;__n=corrector&amp;help=Help&amp;original_firsthand_reading=consecutive&amp;common_firsthand_partial=&amp;reading=corr&amp;corrector_name=corrector&amp;corrector_name_other=&amp;blank_correction=on&amp;place_corr=&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=1&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=underline&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=consecutive\"><span class=\"format_start mceNonEditable\">‹</span>consecutive<span class=\"format_end mceNonEditable\">›</span></span> <span class=\"corr\" wce_orig=\"corrections\" wce=\"__t=corr&amp;__n=corrector&amp;help=Help&amp;original_firsthand_reading=corrections&amp;common_firsthand_partial=&amp;reading=corr&amp;corrector_name=corrector&amp;corrector_name_other=&amp;place_corr=&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=correction\"><span class=\"format_start mceNonEditable\">‹</span>corrections<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<app><rdg type="orig" hand="firsthand"><w>consecutive</w></rdg>' +
                        '<rdg type="corr" hand="corrector" rend="underline"></rdg></app><app>' +
                        '<rdg type="orig" hand="firsthand"><w>corrections</w></rdg>' +
                        '<rdg type="corr" hand="corrector"><w>correction</w></rdg></app>' + xmlTail);
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
    expect(htmlData).toBe('a <span class=\"corr\" wce_orig=\"smple\" wce=\"__t=corr&amp;__n=corrector&amp;help=Help&amp;original_firsthand_reading=smple&amp;common_firsthand_partial=&amp;reading=corr&amp;ut_videtur_firsthand=on&amp;corrector_name=corrector&amp;corrector_name_other=&amp;place_corr=&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=simple\"><span class=\"format_start mceNonEditable\">‹</span>smple<span class=\"format_end mceNonEditable\">›</span></span> correction');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><app><rdg type="orig" hand="firsthandV"><w>smple</w></rdg>' +
                        '<rdg type="corr" hand="corrector"><w>simple</w></rdg></app><w>correction</w>' + xmlTail);
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
    expect(htmlData).toBe('a <span class=\"corr\" wce_orig=\"smple\" wce=\"__t=corr&amp;__n=corrector&amp;help=Help&amp;original_firsthand_reading=smple&amp;common_firsthand_partial=&amp;reading=corr&amp;corrector_name=corrector&amp;corrector_name_other=&amp;ut_videtur_corr=on&amp;place_corr=&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=0&amp;deletion=&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=simple\"><span class=\"format_start mceNonEditable\">‹</span>smple<span class=\"format_end mceNonEditable\">›</span></span> correction');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><app><rdg type="orig" hand="firsthand"><w>smple</w></rdg><rdg type="corr" hand="correctorV">' +
                        '<w>simple</w></rdg></app><w>correction</w>' + xmlTail);
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
    expect(htmlData).toBe('a <span class=\"corr\" wce_orig=\"simple\" wce=\"__t=corr&amp;__n=corrector&amp;help=Help&amp;original_firsthand_reading=simple&amp;common_firsthand_partial=&amp;reading=alt&amp;corrector_name=corrector&amp;corrector_name_other=&amp;place_corr=&amp;place_corr_other=&amp;deletion_erased=0&amp;deletion_underline=0&amp;deletion_underdot=0&amp;deletion_strikethrough=0&amp;deletion_vertical_line=0&amp;deletion_deletion_hooks=0&amp;deletion_transposition_marks=0&amp;deletion_other=1&amp;deletion=other&amp;firsthand_partial=&amp;partial=&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;mceu_10-open=&amp;corrector_text=basic\"><span class=\"format_start mceNonEditable\">‹</span>simple<span class=\"format_end mceNonEditable\">›</span></span> correction');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><app><rdg type="orig" hand="firsthand"><w>simple</w></rdg>' +
                        '<rdg type="alt" hand="corrector" rend="other"><w>basic</w></rdg></app><w>correction</w>' + xmlTail);
  }, 200000);

  // NOTES

  test('a local note', async () => {
    await frame.type('body#tinymce', 'a note');

    // open N menu
    await page.click('button#mceu_16-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();

    await menuFrame.type('textarea#note_text', 'my new local note');

    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a note<span class=\"note\" wce_orig=\"\" wce=\"__t=note&amp;__n=&amp;help=Help&amp;note_type=local&amp;note_type_other=&amp;newHand=&amp;note_text=my%20new%20local%20note\"><span class=\"format_start mceNonEditable\">‹</span>Note<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><w>note</w><note type="local" xml:id="..--2">my new local note</note>' + xmlTail);
  }, 200000);

  test('a handShift note', async () => {
    await frame.type('body#tinymce', 'a note');

    // open N menu
    await page.click('button#mceu_16-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="note_type"]', 'changeOfHand');

    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a note<span class=\"note\" wce_orig=\"\" wce=\"__t=note&amp;__n=&amp;help=Help&amp;note_type=changeOfHand&amp;note_type_other=&amp;newHand=&amp;note_text=\"><span class=\"format_start mceNonEditable\">‹</span>Note<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><w>note</w><note type="editorial" xml:id="..--2"><handShift/></note>' + xmlTail);
  }, 200000);

  test('a handShift note with new hand', async () => {
    await frame.type('body#tinymce', 'a note');

    // open N menu
    await page.click('button#mceu_16-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.select('select[id="note_type"]', 'changeOfHand');
    await menuFrame.type('input#newHand', 'new hand');

    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a note<span class=\"note\" wce_orig=\"\" wce=\"__t=note&amp;__n=&amp;help=Help&amp;note_type=changeOfHand&amp;note_type_other=&amp;newHand=new%20hand&amp;note_text=\"><span class=\"format_start mceNonEditable\">‹</span>Note<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><w>note</w><note type="editorial" xml:id="..--2"><handShift scribe="new hand"/></note>' + xmlTail);
  }, 200000);

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
    expect(htmlData).toBe('lection text next<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=lectionary-other&amp;fw_type_other=&amp;covered=2&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;marginals_text=&amp;number=&amp;edit_number=on&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span><br />↵[<span class=\"lectionary-other\" wce=\"__t=paratext&amp;__n=&amp;fw_type=lectionary-other&amp;covered=2\">lect</span>]<br />↵[<span class=\"lectionary-other\" wce=\"__t=paratext&amp;__n=&amp;fw_type=lectionary-other&amp;covered=2\">lect</span>]<span class=\"format_end mceNonEditable\">›</span></span>');
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
    expect(htmlData).toBe('abbreviated commentary<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=ews&amp;fw_type_other=&amp;covered=0&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;marginals_text=&amp;number=&amp;edit_number=on&amp;paratext_position=&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span>[<span class=\"ews\">ews</span>]<span class=\"format_end mceNonEditable\">›</span></span>');
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
    expect(htmlData).toBe('<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=runTitle&amp;fw_type_other=&amp;covered=0&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;marginals_text=running%20title&amp;number=&amp;paratext_position=pagetop&amp;paratext_position_other=&amp;paratext_alignment=center\"><span class=\"format_start mceNonEditable\">‹</span>fw<span class=\"format_end mceNonEditable\">›</span></span>');
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
    expect(htmlData).toBe('this is a chapter number in the margin<span class=\"paratext\" wce_orig=\"\" wce=\"__t=paratext&amp;__n=&amp;help=Help&amp;fw_type=chapNum&amp;fw_type_other=&amp;covered=0&amp;mceu_5-open=&amp;mceu_6-open=&amp;mceu_7-open=&amp;mceu_8-open=&amp;mceu_9-open=&amp;marginals_text=12&amp;number=&amp;paratext_position=colleft&amp;paratext_position_other=&amp;paratext_alignment=\"><span class=\"format_start mceNonEditable\">‹</span>fw<span class=\"format_end mceNonEditable\">›</span></span>');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>this</w><w>is</w><w>a</w><w>chapter</w><w>number</w><w>in</w><w>the</w><w>margin</w>' +
                        '<seg type="margin" subtype="colleft" n="@PC-"><num type="chapNum">12</num></seg>' + xmlTail);
  }, 200000);

  // BREAKS

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

  // tests for deletion structure (need to start with data to delete)
  test('delete verse 1', async () => {
    // load data
    const data = xmlHead + '<div type="book" n="John"><div type="chapter" n="John.1">' +
                '<ab n="John.1.1"><w>first</w><w>verse</w></ab><ab n="John.1.2"><w>second</w><w>verse</w></ab>' +
                '<ab n="John.1.3"><w>third</w><w>verse</w></ab></div>' +
                '<div type="chapter" n="John.2"><ab n="John.2.1"><w>first</w><w>verse</w></ab>' +
                '<ab n="John.2.2"><w>second</w><w>verse</w></ab><ab n="John.2.3"><w>third</w><w>verse</w></ab></div>' +
                '<div type="chapter" n="John.3"><ab n="John.3.1"><w>first</w><w>verse</w></ab>' +
                '<ab n="John.3.2"><w>second</w><w>verse</w></ab><ab n="John.3.3"><w>third</w><w>verse</w></ab>' +
                '<ab n="John.3.4"><w>fourth</w><w>verse</w></ab></div></div>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input[value="John.1.1"]');
    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"1\">John</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"2\">1</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">2</span> second verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">3</span> third verse <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"3\">2</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> first verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">2</span> second verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">3</span> third verse <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"4\">3</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> first verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">2</span> second verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">3</span> third verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">4</span> fourth verse');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="book" n="John"><div type="chapter" n="John.1">' +
                        '<ab n="John.1.2"><w>second</w><w>verse</w></ab><ab n="John.1.3"><w>third</w><w>verse</w></ab></div>' +
                        '<div type="chapter" n="John.2"><ab n="John.2.1"><w>first</w><w>verse</w></ab>' +
                        '<ab n="John.2.2"><w>second</w><w>verse</w></ab><ab n="John.2.3"><w>third</w><w>verse</w></ab></div>' +
                        '<div type="chapter" n="John.3"><ab n="John.3.1"><w>first</w><w>verse</w></ab>' +
                        '<ab n="John.3.2"><w>second</w><w>verse</w></ab><ab n="John.3.3"><w>third</w><w>verse</w></ab>' +
                        '<ab n="John.3.4"><w>fourth</w><w>verse</w></ab></div></div>' + xmlTail);

  }, 200000);

  test('delete verse 2', async () => {
    // load data
    const data = xmlHead + '<div type="book" n="John"><div type="chapter" n="John.1">' +
                '<ab n="John.1.1"><w>first</w><w>verse</w></ab><ab n="John.1.2"><w>second</w><w>verse</w></ab>' +
                '<ab n="John.1.3"><w>third</w><w>verse</w></ab></div>' +
                '<div type="chapter" n="John.2"><ab n="John.2.1"><w>first</w><w>verse</w></ab>' +
                '<ab n="John.2.2"><w>second</w><w>verse</w></ab><ab n="John.2.3"><w>third</w><w>verse</w></ab></div>' +
                '<div type="chapter" n="John.3"><ab n="John.3.1"><w>first</w><w>verse</w></ab>' +
                '<ab n="John.3.2"><w>second</w><w>verse</w></ab><ab n="John.3.3"><w>third</w><w>verse</w></ab>' +
                '<ab n="John.3.4"><w>fourth</w><w>verse</w></ab></div></div>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input[value="John.1.2"]');
    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"1\">John</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"2\">1</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> first verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">3</span> third verse <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"3\">2</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> first verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">2</span> second verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">3</span> third verse <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"4\">3</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> first verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">2</span> second verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">3</span> third verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">4</span> fourth verse');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="book" n="John"><div type="chapter" n="John.1">' +
                        '<ab n="John.1.1"><w>first</w><w>verse</w></ab><ab n="John.1.3"><w>third</w><w>verse</w></ab></div>' +
                        '<div type="chapter" n="John.2"><ab n="John.2.1"><w>first</w><w>verse</w></ab>' +
                        '<ab n="John.2.2"><w>second</w><w>verse</w></ab><ab n="John.2.3"><w>third</w><w>verse</w></ab></div>' +
                        '<div type="chapter" n="John.3"><ab n="John.3.1"><w>first</w><w>verse</w></ab>' +
                        '<ab n="John.3.2"><w>second</w><w>verse</w></ab><ab n="John.3.3"><w>third</w><w>verse</w></ab>' +
                        '<ab n="John.3.4"><w>fourth</w><w>verse</w></ab></div></div>' + xmlTail);

  }, 200000);

  test('delete verse 3', async () => {
    // load data
    const data = xmlHead + '<div type="book" n="John"><div type="chapter" n="John.1">' +
                '<ab n="John.1.1"><w>first</w><w>verse</w></ab><ab n="John.1.2"><w>second</w><w>verse</w></ab>' +
                '<ab n="John.1.3"><w>third</w><w>verse</w></ab></div>' +
                '<div type="chapter" n="John.2"><ab n="John.2.1"><w>first</w><w>verse</w></ab>' +
                '<ab n="John.2.2"><w>second</w><w>verse</w></ab><ab n="John.2.3"><w>third</w><w>verse</w></ab></div>' +
                '<div type="chapter" n="John.3"><ab n="John.3.1"><w>first</w><w>verse</w></ab>' +
                '<ab n="John.3.2"><w>second</w><w>verse</w></ab><ab n="John.3.3"><w>third</w><w>verse</w></ab>' +
                '<ab n="John.3.4"><w>fourth</w><w>verse</w></ab></div></div>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input[value="John.1.3"]');
    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"1\">John</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"2\">1</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> first verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">2</span> second verse <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"3\">2</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> first verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">2</span> second verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">3</span> third verse <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"4\">3</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> first verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">2</span> second verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">3</span> third verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">4</span> fourth verse');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="book" n="John"><div type="chapter" n="John.1">' +
                        '<ab n="John.1.1"><w>first</w><w>verse</w></ab><ab n="John.1.2"><w>second</w><w>verse</w></ab></div>' +
                        '<div type="chapter" n="John.2"><ab n="John.2.1"><w>first</w><w>verse</w></ab>' +
                        '<ab n="John.2.2"><w>second</w><w>verse</w></ab><ab n="John.2.3"><w>third</w><w>verse</w></ab></div>' +
                        '<div type="chapter" n="John.3"><ab n="John.3.1"><w>first</w><w>verse</w></ab>' +
                        '<ab n="John.3.2"><w>second</w><w>verse</w></ab><ab n="John.3.3"><w>third</w><w>verse</w></ab>' +
                        '<ab n="John.3.4"><w>fourth</w><w>verse</w></ab></div></div>' + xmlTail);

  }, 200000);

  // NB chapter reference only is deleted not the verses in it
  test('delete chapter 2', async () => {
    // load data
    const data = xmlHead + '<div type="book" n="John"><div type="chapter" n="John.1">' +
                '<ab n="John.1.1"><w>first</w><w>verse</w></ab><ab n="John.1.2"><w>second</w><w>verse</w></ab>' +
                '<ab n="John.1.3"><w>third</w><w>verse</w></ab></div>' +
                '<div type="chapter" n="John.2"><ab n="John.2.1"><w>first</w><w>verse</w></ab>' +
                '<ab n="John.2.2"><w>second</w><w>verse</w></ab><ab n="John.2.3"><w>third</w><w>verse</w></ab></div>' +
                '<div type="chapter" n="John.3"><ab n="John.3.1"><w>first</w><w>verse</w></ab>' +
                '<ab n="John.3.2"><w>second</w><w>verse</w></ab><ab n="John.3.3"><w>third</w><w>verse</w></ab>' +
                '<ab n="John.3.4"><w>fourth</w><w>verse</w></ab></div></div>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#deleteChapterRadio');
    await menuFrame.click('input[value="John.2"]');
    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"1\">John</span> <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"2\">1</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> first verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">2</span> second verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">3</span> third verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> first verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">2</span> second verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">3</span> third verse <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"4\">3</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> first verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">2</span> second verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">3</span> third verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">4</span> fourth verse');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="book" n="John"><div type="chapter" n="John.1">' +
                        '<ab n="John.1.1"><w>first</w><w>verse</w></ab><ab n="John.1.2"><w>second</w><w>verse</w></ab>' +
                        '<ab n="John.1.3"><w>third</w><w>verse</w></ab>' +
                        '<ab n="John.1.1"><w>first</w><w>verse</w></ab><ab n="John.1.2"><w>second</w><w>verse</w></ab>' +
                        '<ab n="John.1.3"><w>third</w><w>verse</w></ab></div>' +
                        '<div type="chapter" n="John.3"><ab n="John.3.1"><w>first</w><w>verse</w></ab>' +
                        '<ab n="John.3.2"><w>second</w><w>verse</w></ab><ab n="John.3.3"><w>third</w><w>verse</w></ab>' +
                        '<ab n="John.3.4"><w>fourth</w><w>verse</w></ab></div></div>' + xmlTail);

  }, 200000);

  // NB deleting the book just deletes the reference and leaves all the content such as chapters and verses
  test('delete book', async () => {
    // load data
    const data = xmlHead + '<div type="book" n="John"><div type="chapter" n="John.1">' +
                '<ab n="John.1.1"><w>first</w><w>verse</w></ab><ab n="John.1.2"><w>second</w><w>verse</w></ab>' +
                '<ab n="John.1.3"><w>third</w><w>verse</w></ab></div>' +
                '<div type="chapter" n="John.2"><ab n="John.2.1"><w>first</w><w>verse</w></ab>' +
                '<ab n="John.2.2"><w>second</w><w>verse</w></ab><ab n="John.2.3"><w>third</w><w>verse</w></ab></div>' +
                '<div type="chapter" n="John.3"><ab n="John.3.1"><w>first</w><w>verse</w></ab>' +
                '<ab n="John.3.2"><w>second</w><w>verse</w></ab><ab n="John.3.3"><w>third</w><w>verse</w></ab>' +
                '<ab n="John.3.4"><w>fourth</w><w>verse</w></ab></div></div>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#deleteBookRadio');
    await menuFrame.click('input[value="John"]');
    await menuFrame.click('input#insert');

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"2\">1</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> first verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">2</span> second verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">3</span> third verse <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"3\">2</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> first verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">2</span> second verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">3</span> third verse <span class=\"chapter_number mceNonEditable\" wce=\"__t=chapter_number\" id=\"4\">3</span> <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">1</span> first verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">2</span> second verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">3</span> third verse <span class=\"verse_number mceNonEditable\" wce=\"__t=verse_number\">4</span> fourth verse');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type=\"chapter\" n=\".1\"><ab n=\".1.1\"><w>first</w><w>verse</w></ab><ab n=\".1.2\"><w>second</w><w>verse</w></ab><ab n=\".1.3\"><w>third</w><w>verse</w></ab></div><div type=\"chapter\" n=\".2\"><ab n=\".2.1\"><w>first</w><w>verse</w></ab><ab n=\".2.2\"><w>second</w><w>verse</w></ab><ab n=\".2.3\"><w>third</w><w>verse</w></ab></div><div type=\"chapter\" n=\".3\"><ab n=\".3.1\"><w>first</w><w>verse</w></ab><ab n=\".3.2\"><w>second</w><w>verse</w></ab><ab n=\".3.3\"><w>third</w><w>verse</w></ab><ab n=\".3.4\"><w>fourth</w><w>verse</w></ab></div>' + xmlTail);

  }, 200000);

});

describe('testing with different client settings', () => {

  beforeEach(async () => {
    let frameHandle;
    jest.setTimeout(5000000);
    page = await browser.newPage();
    await page.goto(`file:${path.join(__dirname, 'test_index_page.html')}`);
    await page.evaluate(`setWceEditor('wce_editor', {bookNames: ['John', 'Gal']})`);
    page.waitForSelector("#wce_editor_ifr");
    frameHandle = null;
    while (frameHandle === null) {
      frameHandle = await page.$("iframe[id='wce_editor_ifr']");
    }
    frame = await frameHandle.contentFrame();

  });

  // Starting here the functional tests to test the new option to provide a list of books a select in the V menu

  // book
  test('book div', async () => {
    // open V menu
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#insertBookRadio');
    await menuFrame.waitForSelector('select#insertBookNumber');
    // check there are 2 options
    const optionCount = await menuFrame.$$eval('select#insertBookNumber > option' , element => element.length);
    expect(optionCount).toBe(2);
    // select Galatians
    await menuFrame.select('select#insertBookNumber', 'Gal');
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_39"]', {hidden: true});
    await frame.type('body#tinymce', 'The content of my book');
    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('<span class=\"book_number mceNonEditable\" wce=\"__t=book_number\" id=\"book1\"> Gal</span>The content of my book');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<div type="book" n="Gal"><w>The</w><w>content</w><w>of</w><w>my</w><w>book</w></div>' + xmlTail);
  }, 200000);



  // Ending here the functional tests to test the new option to provide a list of books a select in the V menu

});


// tests using the checkOverlineForAbbr setting

describe('testing with checkOverlineForAbbr client settings', () => {

  beforeEach(async () => {
    let frameHandle;
    jest.setTimeout(5000000);
    page = await browser.newPage();
    await page.goto(`file:${path.join(__dirname, 'test_index_page.html')}`);
    await page.evaluate(`setWceEditor('wce_editor', {checkOverlineForAbbr: true})`);
    page.waitForSelector("#wce_editor_ifr");
    frameHandle = null;
    while (frameHandle === null) {
      frameHandle = await page.$("iframe[id='wce_editor_ifr']");
    }
    frame = await frameHandle.contentFrame();

  });

  // nomsac with overline checked by default
  test('test abbr', async () => {
    await frame.type('body#tinymce', 'a ns abbreviation');

    for (let i = 0; i < ' abbreviation'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.down('Shift');
    for (let i = 0; i < 'ns'.length; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    await page.keyboard.up('Shift');
    // open A menu
    await page.click('button#mceu_14-open');
    // open abbreviation menu
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    // use defaults
    const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    const addOverlineCheckbox = await menuFrame.$('#add_overline');
    expect(await (await addOverlineCheckbox.getProperty('checked')).jsonValue()).toBeTruthy();
    await menuFrame.click('input#insert');
    await page.waitForSelector('div[id="mceu_40"]', {hidden: true});

    const htmlData = await page.evaluate(`getData()`);
    expect(htmlData).toBe('a <span class="abbr_add_overline" wce_orig="ns" wce="__t=abbr&amp;__n=&amp;original_abbr_text=&amp;help=Help&amp;abbr_type=nomSac&amp;abbr_type_other=&amp;add_overline=overline"><span class="format_start mceNonEditable">‹</span>ns<span class="format_end mceNonEditable">›</span></span> abbreviation');
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<w>a</w><w><abbr type="nomSac"><hi rend="overline">ns</hi></abbr></w><w>abbreviation</w>' + xmlTail);
  }, 200000);

 
});
