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

  test('check that the correct functions are avilable', async () => {
    expect(await page.waitForSelector('div[aria-label="Undo"]')).toBeTruthy();
    expect(await page.waitForSelector('div[aria-label="Redo"]')).toBeTruthy();
    // expect(await page.waitForSelector('div[aria-label="WCE special character map"]')).toBeTruthy();

    expect(await page.waitForSelector('div[aria-label="Source code"]')).toBeTruthy();

    expect(await page.$eval('#mceu_4 > button > span', element => element.textContent)).toBe('Save');

    expect(await page.waitForSelector('div[aria-label="Print"]')).toBeTruthy();
    expect(await page.waitForSelector('div[aria-label="Cut"]')).toBeTruthy();
    expect(await page.waitForSelector('div[aria-label="Copy"]')).toBeTruthy();
    expect(await page.waitForSelector('div[aria-label="Paste"]')).toBeTruthy();
    expect(await page.waitForSelector('div[aria-label="Fullscreen"]')).toBeTruthy();

    XMLButton = await page.$eval('#mceu_19 > button > i', element => element.getAttribute('style'));
    expect(XMLButton).toContain('button_XML.png');

    XMLButton = await page.$eval('#mceu_20 > button > i', element => element.getAttribute('style'));
    expect(XMLButton).toContain('button_Help.png');

    XMLButton = await page.$eval('#mceu_21 > button > i', element => element.getAttribute('style'));
    expect(XMLButton).toContain('button_Info.png');

    XMLButton = await page.$eval('#mceu_22 > button > i', element => element.getAttribute('style'));
    expect(XMLButton).toContain('xmlinput.jpg');

  });

  test('check the correct font is used for the editor', async () => {
    expect(await frame.$eval('.mce-content-body', el => getComputedStyle(el).font)).toBe('24px / 48px GentiumPlus');
  });

  test('check line number sidebar is visible on loading', async () => {
    expect(await page.$eval('#wce_editor_wce_line_number', el => el.checked)).toBe(true);
    expect(await page.$eval('.wce-linenumber-sidebar', el => getComputedStyle(el).display)).not.toBe('none');
  });

  test('check line number sidebar can be hidden and made visible again', async () => {
    expect(await page.$eval('#wce_editor_wce_line_number', el => el.checked)).toBe(true);
    expect(await page.$eval('.wce-linenumber-sidebar', el => getComputedStyle(el).display)).not.toBe('none');

    // hide the sidebar
    await page.click('input#wce_editor_wce_line_number');
    expect(await page.$eval('#wce_editor_wce_line_number', el => el.checked)).toBe(false);
    expect(await page.$eval('.wce-linenumber-sidebar', el => getComputedStyle(el).display)).toBe('none');

    // show the sidebar
    await page.click('input#wce_editor_wce_line_number');
    expect(await page.$eval('#wce_editor_wce_line_number', el => el.checked)).toBe(true);
    expect(await page.$eval('.wce-linenumber-sidebar', el => getComputedStyle(el).display)).not.toBe('none');
  });


});
