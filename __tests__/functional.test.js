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


beforeAll(async () => {
  jest.setTimeout(200000);
  browser = await puppeteer.launch({
    // for local testing
    headless: true,
    slowMo: 80,
    args: ['--window-size=1920,1080', '--disable-web-security']

    // for online testing (only ever commit these)
     // headless: true,
     // args: ['--disable-web-security']
   });
});

beforeEach(async () => {
  page = await browser.newPage();
  await page.goto(`file:${path.join(__dirname, '..', 'wce-ote', 'index.html')}`);
  let frameHandle = await page.$("iframe[id='wce_editor_ifr']");
  frame = await frameHandle.contentFrame();
});

afterAll(async () => {
  await browser.close();
});

test('test basic words', async () => {
  await frame.type('body#tinymce', 'my words');
  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('my words');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>my</w><w>words</w>' + xmlTail);

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
  // access mnu window and make selection
  const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.select('select[id="unclear_text_reason"]', 'damage to page');
  await menuFrame.click('input#insert');
  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('my wo<span class="unclear" wce_orig="rds" wce="__t=unclear&amp;__n=&amp;help=Help' +
                        '&amp;unclear_text_reason=damage%20to%20page&amp;unclear_text_reason_other=">' +
                        '<span class="format_start mceNonEditable">‹</span>ṛḍṣ' +
                        '<span class="format_end mceNonEditable">›</span></span>');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>my</w><w>wo<unclear reason="damage to page">rds</unclear></w>' + xmlTail);
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
  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('my <span class=\"unclear\" wce_orig=\"words\" wce=\"__t=unclear&amp;__n=&amp;' +
                        'help=Help&amp;unclear_text_reason=&amp;unclear_text_reason_other=\">' +
                        '<span class=\"format_start mceNonEditable\">‹</span>ẉọṛḍṣ' +
                        '<span class=\"format_end mceNonEditable\">›</span></span>');
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
  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('my <span class=\"part_abbr\" wce_orig=\"words\" wce=\"__t=part_abbr&amp;__n=&amp;' +
                        'help=Help&amp;exp_rend=%C3%B7&amp;exp_rend_other=\">' +
                        '<span class=\"format_start mceNonEditable\">‹</span>(words)' +
                        '<span class=\"format_end mceNonEditable\">›</span></span>');
}, 200000);

// pc
test('test index page', async () => {
  await frame.type('body#tinymce', 'my words.');
  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('my words<span class=\"pc\" wce_orig=\"\" wce=\"__t=pc\">' +
                        '<span class=\"format_start mceNonEditable\">‹</span>.' +
                        '<span class=\"format_end mceNonEditable\">›</span></span>');
  const xmlData = await page.evaluate(`getTEI()`);
  expect(xmlData).toBe(xmlHead + '<w>my</w><w>words</w><pc>.</pc>' + xmlTail);
}, 200000);
