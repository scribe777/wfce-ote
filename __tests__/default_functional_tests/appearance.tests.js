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
    slowMo: 60,
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

describe('testing editor appearance', () => {


  test('check correct editing buttons appear', async () => {
    let BButton, CButton, DButton, OButton, AButton, MButton, NButton, PButton, VButton;
    BButton = await page.$eval('#mceu_10 > button > i', element => element.getAttribute('style'));
    expect(BButton).toContain('button_B.png');

    CButton = await page.$eval('#mceu_11 > button > i', element => element.getAttribute('style'));
    expect(CButton).toContain('button_C.png');

    DButton = await page.$eval('#mceu_12 > button > i', element => element.getAttribute('style'));
    expect(DButton).toContain('button_D.png');

    OButton = await page.$eval('#mceu_13 > button > i', element => element.getAttribute('style'));
    expect(OButton).toContain('button_O.png');

    AButton = await page.$eval('#mceu_14 > button > i', element => element.getAttribute('style'));
    expect(AButton).toContain('button_A.png');

    MButton = await page.$eval('#mceu_15 > button > i', element => element.getAttribute('style'));
    expect(MButton).toContain('button_M.png');

    NButton = await page.$eval('#mceu_16 > button > i', element => element.getAttribute('style'));
    expect(NButton).toContain('button_N.png');

    PButton = await page.$eval('#mceu_17 > button > i', element => element.getAttribute('style'));
    expect(PButton).toContain('button_P.png');

    VButton = await page.$eval('#mceu_18 > button > i', element => element.getAttribute('style'));
    expect(VButton).toContain('button_V.png');

  });

});