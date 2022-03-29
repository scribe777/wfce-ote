const puppeteer = require('puppeteer');
const path = require('path');

test('test index page', async () => {
  const browser = await puppeteer.launch({
    headless: true,
    // slowMo: 80,
    // args: ['--window-size=1920,1080']
  });
  const page = await browser.newPage();
  await page.goto(`file:${path.join(__dirname, '..', 'wce-ote', 'index.html')}`);


  const frameHandle = await page.$("iframe[id='wce_editor_ifr']");
  const frame = await frameHandle.contentFrame();
  await frame.type('body#tinymce', 'my words');
  const htmlData = await page.evaluate(`getData()`);
  expect(htmlData).toBe('my words');
  await browser.close();
}, 10000);
