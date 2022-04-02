const puppeteer = require('puppeteer');
const path = require('path');

let browser, page, frame;

beforeAll(async () => {
  jest.setTimeout(50000);
  browser = await puppeteer.launch({
     headless: true,
     // slowMo: 80,
     // args: ['--window-size=1920,1080', '--disable-web-security']
     args: ['--disable-web-security']
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

test('test index page', async () => {
  await frame.type('body#tinymce', 'my words');
  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('my words');
});

test('test highlight text', async () => {
  await frame.type('body#tinymce', 'my words');
  await page.keyboard.down('Shift');
  for (let i = 0; i < 'rds'.length; i++) {
    await page.keyboard.press('ArrowLeft');
  };
  await page.keyboard.up('Shift');
  await page.click('button#mceu_12-open');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  const menuFrameHandle = await page.$('div[id="mceu_40"] > div > div > iframe');
  const menuFrame = await menuFrameHandle.contentFrame();
  await menuFrame.select('select[id="unclear_text_reason"]', 'damage to page');
  await menuFrame.click('input#insert');
  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('my wo<span class="unclear" wce_orig="rds" wce="__t=unclear&amp;__n=&amp;help=Help' +
                        '&amp;unclear_text_reason=damage%20to%20page&amp;unclear_text_reason_other=">' +
                        '<span class="format_start mceNonEditable">‹</span>ṛḍṣ' +
                        '<span class="format_end mceNonEditable">›</span></span>');
});
