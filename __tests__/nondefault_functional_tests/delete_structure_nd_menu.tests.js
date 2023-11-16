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


describe('testing with non-default deletion settings', () => {

  beforeEach(async () => {
    let frameHandle;
    jest.setTimeout(5000000);
    page = await browser.newPage();
    await page.goto(`file:${path.join(__dirname, '../test_index_page.html')}`);
    await page.evaluate(`setWceEditor('wce_editor', {includePageNumbersInDeleteMenu: true})`);
    page.waitForSelector("#wce_editor_ifr");
    frameHandle = null;
    while (frameHandle === null) {
      frameHandle = await page.$("iframe[id='wce_editor_ifr']");
    }
    frame = await frameHandle.contentFrame();

  });

  // tests for deletion structure (need to start with data to delete) The first few are repeats so we can test that
  // the setting is over ridden if there is no pb to use
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
  test('delete book doesn\'use page number if no pb is found', async () => {
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

  // test delete book with two books but no lection because the if a lection doesn't have a book the export quietly breaks
  test('If a book is deleted but the lection remains then the export breaks', async () => {
    // load data
    const data = xmlHead + '<pb n="62v" type="folio" xml:id="P62v-"/><cb n="P62vC2-"/><lb n="P62vC2L-"/><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><lb n="P62vC2L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twentyone</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P62vC2L-"/></ab><ab n="Gal.2.2"><w>verse</w><lb n="P62vC2L-"/><w>two</w><pb n="63r" type="folio" xml:id="P63r-"/><cb n="P63rC1-"/><lb n="P63rC1L-"/><w>continues</w></ab></div></div><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><w>a<lb n="P63rC1L-" break="no"/>gain</w><lb n="P63rC1L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twenty-one</w><w>again</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P63rC1L-"/><w>again</w></ab><ab n="Gal.2.2"><w>verse</w><w>two</w><lb n="P63rC1L-"/><pb n="63v" type="folio" xml:id="P63v-"/><cb n="P63vC1-"/><lb n="P63vC1L-"/><w>again</w></ab></div></div>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#deleteBookRadio');

    await menuFrame.click('input[value="Gal|63r"]');
    await menuFrame.click('input#insert');
    // NB no test for internal structure because it is already tested with the other settings and the break tags require MATHRAND to be used
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="62v" type="folio" xml:id="P62v-"/><cb n="P62vC2-"/><lb n="P62vC2L-"/><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><lb n="P62vC2L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twentyone</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P62vC2L-"/></ab><ab n="Gal.2.2"><w>verse</w><lb n="P62vC2L-"/><w>two</w><pb n="63r" type="folio" xml:id="P63r-"/><cb n="P63rC1-"/><lb n="P63rC1L-"/><w>continues</w></ab></div><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><w>a<lb n="P63rC1L-" break="no"/>gain</w><lb n="P63rC1L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twenty-one</w><w>again</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P63rC1L-"/><w>again</w></ab><ab n="Gal.2.2"><w>verse</w><w>two</w><lb n="P63rC1L-"/><pb n="63v" type="folio" xml:id="P63v-"/><cb n="P63vC1-"/><lb n="P63vC1L-"/><w>again</w></ab></div></div>' + xmlTail);

  }, 200000);


  // TESTING EXISTING BUT NOT NECESSARILY DESIRED BEHAVIOUR (CAT OCT 2022)
  test('If a book is deleted but the lection remains then the export breaks', async () => {
    // load data
    const data = xmlHead + '<pb n="62v" type="folio" xml:id="P62v-"/><cb n="P62vC2-"/><lb n="P62vC2L-"/><div type="lection" n="S2W14D4"><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><lb n="P62vC2L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twentyone</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P62vC2L-"/></ab><ab n="Gal.2.2"><w>verse</w><lb n="P62vC2L-"/><w>two</w><pb n="63r" type="folio" xml:id="P63r-"/><cb n="P63rC1-"/><lb n="P63rC1L-"/><w>continues</w></ab></div></div></div><div type="lection" n="S2W14D5"><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><w>a<lb n="P63rC1L-" break="no"/>gain</w><lb n="P63rC1L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twenty-one</w><w>again</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P63rC1L-"/><w>again</w></ab><ab n="Gal.2.2"><w>verse</w><w>two</w><lb n="P63rC1L-"/><pb n="63v" type="folio" xml:id="P63v-"/><cb n="P63vC1-"/><lb n="P63vC1L-"/><w>again</w></ab></div></div></div>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#deleteBookRadio');

    await menuFrame.click('input[value="Gal|63r"]');
    await menuFrame.click('input#insert');
    // NB no test for internal structure because it is already tested with the other settings and the break tags require MATHRAND to be used
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="62v" type="folio" xml:id="P62v-"/><cb n="P62vC2-"/><lb n="P62vC2L-"/><div type="lection" n="S2W14D4"><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><lb n="P62vC2L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twentyone</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P62vC2L-"/></ab><ab n="Gal.2.2"><w>verse</w><lb n="P62vC2L-"/><w>two</w><pb n="63r" type="folio" xml:id="P63r-"/><cb n="P63rC1-"/><lb n="P63rC1L-"/><w>continues</w></ab></div><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><w>a<lb n="P63rC1L-" break="no"/>gain</w><lb n="P63rC1L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twenty-one</w><w>again</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P63rC1L-"/><w>again</w></ab><ab n="Gal.2.2"><w>verse</w><w>two</w><lb n="P63rC1L-"/><pb n="63v" type="folio" xml:id="P63v-"/><cb n="P63vC1-"/><lb n="P63vC1L-"/><w>again</w></ab></div></div></div><div type="lection" n="S2W14D5"/>' + xmlTail);

  }, 200000);

  // test delete chapter 2 on first page
  test('Delete a chapter on the first page', async () => {
    // load data
    const data = xmlHead + '<pb n="62v" type="folio" xml:id="P62v-"/><cb n="P62vC2-"/><lb n="P62vC2L-"/><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><lb n="P62vC2L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twentyone</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P62vC2L-"/></ab><ab n="Gal.2.2"><w>verse</w><lb n="P62vC2L-"/><w>two</w><pb n="63r" type="folio" xml:id="P63r-"/><cb n="P63rC1-"/><lb n="P63rC1L-"/><w>continues</w></ab></div></div><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><w>a<lb n="P63rC1L-" break="no"/>gain</w><lb n="P63rC1L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twenty-one</w><w>again</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P63rC1L-"/><w>again</w></ab><ab n="Gal.2.2"><w>verse</w><w>two</w><lb n="P63rC1L-"/><pb n="63v" type="folio" xml:id="P63v-"/><cb n="P63vC1-"/><lb n="P63vC1L-"/><w>again</w></ab></div></div>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#deleteChapterRadio');

    await menuFrame.click('input[value="Gal.2|62v"]');
    await menuFrame.click('input#insert');
    // NB no test for internal structure because it is already tested with the other settings and the break tags require MATHRAND to be used
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="62v" type="folio" xml:id="P62v-"/><cb n="P62vC2-"/><lb n="P62vC2L-"/><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><lb n="P62vC2L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twentyone</w></ab><ab n="Gal.1.1"><w>verse</w><w>one</w><lb n="P62vC2L-"/></ab><ab n="Gal.1.2"><w>verse</w><lb n="P62vC2L-"/><w>two</w><pb n="63r" type="folio" xml:id="P63r-"/><cb n="P63rC1-"/><lb n="P63rC1L-"/><w>continues</w></ab></div></div><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><w>a<lb n="P63rC1L-" break="no"/>gain</w><lb n="P63rC1L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twenty-one</w><w>again</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P63rC1L-"/><w>again</w></ab><ab n="Gal.2.2"><w>verse</w><w>two</w><lb n="P63rC1L-"/><pb n="63v" type="folio" xml:id="P63v-"/><cb n="P63vC1-"/><lb n="P63vC1L-"/><w>again</w></ab></div></div>' + xmlTail);

  }, 200000);

  // test delete chapter 2 on second page
  test('Delete a chapter on the second page', async () => {
    // load data
    const data = xmlHead + '<pb n="62v" type="folio" xml:id="P62v-"/><cb n="P62vC2-"/><lb n="P62vC2L-"/><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><lb n="P62vC2L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twentyone</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P62vC2L-"/></ab><ab n="Gal.2.2"><w>verse</w><lb n="P62vC2L-"/><w>two</w><pb n="63r" type="folio" xml:id="P63r-"/><cb n="P63rC1-"/><lb n="P63rC1L-"/><w>continues</w></ab></div><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><w>a<lb n="P63rC1L-" break="no"/>gain</w><lb n="P63rC1L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twenty-one</w><w>again</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P63rC1L-"/><w>again</w></ab><ab n="Gal.2.2"><w>verse</w><w>two</w><lb n="P63rC1L-"/><pb n="63v" type="folio" xml:id="P63v-"/><cb n="P63vC1-"/><lb n="P63vC1L-"/><w>again</w></ab></div></div>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#deleteChapterRadio');

    await menuFrame.click('input[value="Gal.2|63r"]');
    await menuFrame.click('input#insert');
    // NB no test for internal structure because it is already tested with the other settings and the break tags require MATHRAND to be used
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="62v" type="folio" xml:id="P62v-"/><cb n="P62vC2-"/><lb n="P62vC2L-"/><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><lb n="P62vC2L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twentyone</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P62vC2L-"/></ab><ab n="Gal.2.2"><w>verse</w><lb n="P62vC2L-"/><w>two</w><pb n="63r" type="folio" xml:id="P63r-"/><cb n="P63rC1-"/><lb n="P63rC1L-"/><w>continues</w></ab></div><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><w>a<lb n="P63rC1L-" break="no"/>gain</w><lb n="P63rC1L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twenty-one</w><w>again</w></ab><ab n="Gal.1.1"><w>verse</w><w>one</w><lb n="P63rC1L-"/><w>again</w></ab><ab n="Gal.1.2"><w>verse</w><w>two</w><lb n="P63rC1L-"/><pb n="63v" type="folio" xml:id="P63v-"/><cb n="P63vC1-"/><lb n="P63vC1L-"/><w>again</w></ab></div></div>' + xmlTail);

  }, 200000);

  // test delete the first chapter 2 verse 2 on the first page
  test('Delete the first chapter 2 verse 2 on the first page', async () => {
    // load data
    const data = xmlHead + '<pb n="62v" type="folio" xml:id="P62v-"/><cb n="P62vC2-"/><lb n="P62vC2L-"/><div type="lection" n="S2W14D4"><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><lb n="P62vC2L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twentyone</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P62vC2L-"/></ab><ab n="Gal.2.2"><w>verse</w><lb n="P62vC2L-"/><w>two</w></ab><ab n="Gal.2.2"><w>another</w><w>verse</w><w>two</w><pb n="63r" type="folio" xml:id="P63r-"/><cb n="P63rC1-"/><lb n="P63rC1L-"/><w>continues</w></ab></div></div></div><div type="lection" n="S2W14D5"><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><w>a<lb n="P63rC1L-" break="no"/>gain</w><lb n="P63rC1L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twenty-one</w><w>again</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P63rC1L-"/><w>again</w></ab><ab n="Gal.2.2"><w>verse</w><w>two</w><lb n="P63rC1L-"/><pb n="63v" type="folio" xml:id="P63v-"/><cb n="P63vC1-"/><lb n="P63vC1L-"/><w>again</w></ab></div></div></div>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#deleteVerseRadio');

    await menuFrame.click('input[value="Gal.2.2|62v"]');
    await menuFrame.click('input#insert');
    // NB no test for internal structure because it is already tested with the other settings and the break tags require MATHRAND to be used
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="62v" type="folio" xml:id="P62v-"/><cb n="P62vC2-"/><lb n="P62vC2L-"/><div type="lection" n="S2W14D4"><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><lb n="P62vC2L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twentyone</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P62vC2L-"/></ab><ab n="Gal.2.2"><w>another</w><w>verse</w><w>two</w><pb n="63r" type="folio" xml:id="P63r-"/><cb n="P63rC1-"/><lb n="P63rC1L-"/><w>continues</w></ab></div></div></div><div type="lection" n="S2W14D5"><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><w>a<lb n="P63rC1L-" break="no"/>gain</w><lb n="P63rC1L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twenty-one</w><w>again</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P63rC1L-"/><w>again</w></ab><ab n="Gal.2.2"><w>verse</w><w>two</w><lb n="P63rC1L-"/><pb n="63v" type="folio" xml:id="P63v-"/><cb n="P63vC1-"/><lb n="P63vC1L-"/><w>again</w></ab></div></div></div>' + xmlTail);

  }, 200000);

  // test delete the second chapter 2 verse 2 on the first page
  test('Delete a the second chapter 2 verse 2 on the first page', async () => {
    // load data
    const data = xmlHead + '<pb n="62v" type="folio" xml:id="P62v-"/><cb n="P62vC2-"/><lb n="P62vC2L-"/><div type="lection" n="S2W14D4"><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><lb n="P62vC2L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twentyone</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P62vC2L-"/></ab><ab n="Gal.2.2"><w>verse</w><lb n="P62vC2L-"/><w>two</w></ab><ab n="Gal.2.2"><w>another</w><w>verse</w><w>two</w><pb n="63r" type="folio" xml:id="P63r-"/><cb n="P63rC1-"/><lb n="P63rC1L-"/><w>continues</w></ab></div></div></div><div type="lection" n="S2W14D5"><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><w>a<lb n="P63rC1L-" break="no"/>gain</w><lb n="P63rC1L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twenty-one</w><w>again</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P63rC1L-"/><w>again</w></ab><ab n="Gal.2.2"><w>verse</w><w>two</w><lb n="P63rC1L-"/><pb n="63v" type="folio" xml:id="P63v-"/><cb n="P63vC1-"/><lb n="P63vC1L-"/><w>again</w></ab></div></div></div>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#deleteVerseRadio');

    await menuFrame.click('input[value="Gal.2.2-a|62v"]');
    await menuFrame.click('input#insert');
    // NB no test for internal structure because it is already tested with the other settings and the break tags require MATHRAND to be used
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="62v" type="folio" xml:id="P62v-"/><cb n="P62vC2-"/><lb n="P62vC2L-"/><div type="lection" n="S2W14D4"><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><lb n="P62vC2L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twentyone</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P62vC2L-"/></ab><ab n="Gal.2.2"><w>verse</w><lb n="P62vC2L-"/><w>two</w></ab></div></div></div><div type="lection" n="S2W14D5"><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><w>a<lb n="P62vC2L-" break="no"/>gain</w><lb n="P62vC2L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twenty-one</w><w>again</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P62vC2L-"/><w>again</w></ab><ab n="Gal.2.2"><w>verse</w><w>two</w><lb n="P62vC2L-"/><pb n="63v" type="folio" xml:id="P63v-"/><cb n="P63vC1-"/><lb n="P63vC1L-"/><w>again</w></ab></div></div></div>' + xmlTail);

  }, 200000);

  // test delete inscriptio with page reference (only one as unlikely to be multiple)
  test('Delete inscriptio with page reference', async () => {
    // load data
    const data = xmlHead + '<pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/><div type="book" n="Gal"><div type="inscriptio"><ab n="Gal.inscriptio"><w>PLACE</w><w>THE</w><w>INSCRIPTIO</w><w>HERE!</w></ab></div><div type="chapter" n="Gal.1"><ab n="Gal.1.1"><w>this</w><w>is</w><w>my</w><w>first</w><lb n="P1rC1L-"/><w>verse</w></ab><ab n="Gal.1.2"><w>This</w><w>is</w><w>my</w><w>second</w><w>verse</w><lb n="P1rC1L-"/></ab></div><div type="subscriptio"><ab n="Gal.subscriptio"><w>PLACE</w><w>THE</w><w>SUBSCRIPTIO</w><w>HERE!</w></ab></div></div>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#deleteVerseRadio');

    await menuFrame.click('input[value="Inscriptio|1r"]');
    await menuFrame.click('input#insert');
    // NB no test for internal structure because it is already tested with the other settings and the break tags require MATHRAND to be used
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.1"><w>this</w><w>is</w><w>my</w><w>first</w><lb n="P1rC1L-"/><w>verse</w></ab><ab n="Gal.1.2"><w>This</w><w>is</w><w>my</w><w>second</w><w>verse</w><lb n="P1rC1L-"/></ab></div><div type="subscriptio"><ab n="Gal.subscriptio"><w>PLACE</w><w>THE</w><w>SUBSCRIPTIO</w><w>HERE!</w></ab></div></div>' + xmlTail);

  }, 200000);

  // test delete subscriptio with page reference (only one as unlikely to be multiple)
  test('Delete subscriptio with page reference', async () => {
    // load data
    const data = xmlHead + '<pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/><div type="book" n="Gal"><div type="inscriptio"><ab n="Gal.inscriptio"><w>PLACE</w><w>THE</w><w>INSCRIPTIO</w><w>HERE!</w></ab></div><div type="chapter" n="Gal.1"><ab n="Gal.1.1"><w>this</w><w>is</w><w>my</w><w>first</w><lb n="P1rC1L-"/><w>verse</w></ab><ab n="Gal.1.2"><w>This</w><w>is</w><w>my</w><w>second</w><w>verse</w><lb n="P1rC1L-"/></ab></div><div type="subscriptio"><ab n="Gal.subscriptio"><w>PLACE</w><w>THE</w><w>SUBSCRIPTIO</w><w>HERE!</w></ab></div></div>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#deleteVerseRadio');

    await menuFrame.click('input[value="Subscriptio|1r"]');
    await menuFrame.click('input#insert');
    // NB no test for internal structure because it is already tested with the other settings and the break tags require MATHRAND to be used
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="1r" type="folio" xml:id="P1r-"/><cb n="P1rC1-"/><lb n="P1rC1L-"/><div type="book" n="Gal"><div type="inscriptio"><ab n="Gal.inscriptio"><w>PLACE</w><w>THE</w><w>INSCRIPTIO</w><w>HERE!</w></ab></div><div type="chapter" n="Gal.1"><ab n="Gal.1.1"><w>this</w><w>is</w><w>my</w><w>first</w><lb n="P1rC1L-"/><w>verse</w></ab><ab n="Gal.1.2"><w>This</w><w>is</w><w>my</w><w>second</w><w>verse</w><lb n="P1rC1L-"/></ab></div></div>' + xmlTail);

  }, 200000);

  // test delete Lection with page reference
  test('Delete Lection with page reference', async () => {
    // load data
    const data = xmlHead + '<pb n="62v" type="folio" xml:id="P62v-"/><cb n="P62vC2-"/><lb n="P62vC2L-"/><div type="lection" n="S2W14D4"><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><lb n="P62vC2L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twentyone</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P62vC2L-"/></ab><ab n="Gal.2.2"><w>verse</w><lb n="P62vC2L-"/><w>two</w><pb n="63r" type="folio" xml:id="P63r-"/><cb n="P63rC1-"/><lb n="P63rC1L-"/><w>continues</w></ab></div></div></div><div type="lection" n="S2W14D5"><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><w>a<lb n="P63rC1L-" break="no"/>gain</w><lb n="P63rC1L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twenty-one</w><w>again</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P63rC1L-"/><w>again</w></ab><ab n="Gal.2.2"><w>verse</w><w>two</w><lb n="P63rC1L-"/><pb n="63v" type="folio" xml:id="P63v-"/><cb n="P63vC1-"/><lb n="P63vC1L-"/><w>again</w></ab></div></div></div>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();
    await menuFrame.click('input#deleteLectionRadio');

    await menuFrame.click('input[value="S2W14D5|63r"]');
    await menuFrame.click('input#insert');
    // NB no test for internal structure because it is already tested with the other settings and the break tags require MATHRAND to be used
    const xmlData = await page.evaluate(`getTEI()`);
    expect(xmlData).toBe(xmlHead + '<pb n="62v" type="folio" xml:id="P62v-"/><cb n="P62vC2-"/><lb n="P62vC2L-"/><div type="lection" n="S2W14D4"><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><lb n="P62vC2L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twentyone</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P62vC2L-"/></ab><ab n="Gal.2.2"><w>verse</w><lb n="P62vC2L-"/><w>two</w><pb n="63r" type="folio" xml:id="P63r-"/><cb n="P63rC1-"/><lb n="P63rC1L-"/><w>continues</w></ab></div></div><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><w>a<lb n="P63rC1L-" break="no"/>gain</w><lb n="P63rC1L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twenty-one</w><w>again</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P63rC1L-"/><w>again</w></ab><ab n="Gal.2.2"><w>verse</w><w>two</w><lb n="P63rC1L-"/><pb n="63v" type="folio" xml:id="P63v-"/><cb n="P63vC1-"/><lb n="P63vC1L-"/><w>again</w></ab></div></div></div>' + xmlTail);

  }, 200000);

  // test drop down page select
  test('Page filter function', async () => {
    // load data
    const data = xmlHead + '<pb n="62v" type="folio" xml:id="P62v-"/><cb n="P62vC2-"/><lb n="P62vC2L-"/><div type="lection" n="S2W14D4"><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><lb n="P62vC2L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twentyone</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P62vC2L-"/></ab><ab n="Gal.2.2"><w>verse</w><lb n="P62vC2L-"/><w>two</w><pb n="63r" type="folio" xml:id="P63r-"/><cb n="P63rC1-"/><lb n="P63rC1L-"/><w>continues</w></ab></div></div></div><div type="lection" n="S2W14D5"><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><w>a<lb n="P63rC1L-" break="no"/>gain</w><lb n="P63rC1L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twenty-one</w><w>again</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P63rC1L-"/><w>again</w></ab><ab n="Gal.2.2"><w>verse</w><w>two</w><lb n="P63rC1L-"/><pb n="63v" type="folio" xml:id="P63v-"/><cb n="P63vC1-"/><lb n="P63vC1L-"/><w>again</w></ab></div></div></div>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();

    // test the content of the drop down menu - should be 3 pages (62v, 63r, 63v and all)
    expect(await menuFrame.$eval('#pageSelect', el => el.options.length)).toBe(4);
    expect(await menuFrame.$eval('#pageSelect', el => el.options[0].value)).toBe('all');
    expect(await menuFrame.$eval('#pageSelect', el => el.options[1].value)).toBe('62v');
    expect(await menuFrame.$eval('#pageSelect', el => el.options[2].value)).toBe('63r');
    expect(await menuFrame.$eval('#pageSelect', el => el.options[3].value)).toBe('63v');

    await menuFrame.select('select[id="pageSelect"]', '63r');
    expect(await menuFrame.$('input[value="S2W14D4|62v"]')).toBeNull();
    expect(await menuFrame.$('input[value="S2W14D5|63r"]')).not.toBeNull();
    expect(await menuFrame.$('input[value="Gal|62v"]')).toBeNull();
    expect(await menuFrame.$('input[value="Gal|63r"]')).not.toBeNull();
    expect(await menuFrame.$('input[value="Gal.1|62v"]')).toBeNull();
    expect(await menuFrame.$('input[value="Gal.1|63r"]')).not.toBeNull();
    expect(await menuFrame.$('input[value="Gal.1.20|62v"]')).toBeNull();
    expect(await menuFrame.$('input[value="Gal.1.20-a|63r"]')).not.toBeNull();

    await menuFrame.select('select[id="pageSelect"]', '62v');
    expect(await menuFrame.$('input[value="S2W14D4|62v"]')).not.toBeNull();
    expect(await menuFrame.$('input[value="S2W14D5|63r"]')).toBeNull();
    expect(await menuFrame.$('input[value="Gal|62v"]')).not.toBeNull();
    expect(await menuFrame.$('input[value="Gal|63r"]')).toBeNull();
    expect(await menuFrame.$('input[value="Gal.1|62v"]')).not.toBeNull();
    expect(await menuFrame.$('input[value="Gal.1|63r"]')).toBeNull();
    expect(await menuFrame.$('input[value="Gal.1.20|62v"]')).not.toBeNull();
    expect(await menuFrame.$('input[value="Gal.1.20-a|63r"]')).toBeNull();

    await menuFrame.select('select[id="pageSelect"]', 'all');
    expect(await menuFrame.$('input[value="S2W14D4|62v"]')).not.toBeNull();
    expect(await menuFrame.$('input[value="S2W14D5|63r"]')).not.toBeNull();
    expect(await menuFrame.$('input[value="Gal|62v"]')).not.toBeNull();
    expect(await menuFrame.$('input[value="Gal|63r"]')).not.toBeNull();
    expect(await menuFrame.$('input[value="Gal.1|62v"]')).not.toBeNull();
    expect(await menuFrame.$('input[value="Gal.1|63r"]')).not.toBeNull();
    expect(await menuFrame.$('input[value="Gal.1.20|62v"]')).not.toBeNull();
    expect(await menuFrame.$('input[value="Gal.1.20-a|63r"]')).not.toBeNull();

  }, 200000);

  // test drop down page select if a page break happens within a word
  // because we extract the page from the html initially the hyphen for the word continuation was appearing in the
  // menu attached to the beginning of the page number. This just checks it isn't there anymore.
  test('Page filter function', async () => {
    // load data
    const data = xmlHead + '<pb n="62v" type="folio" xml:id="P62v-"/><cb n="P62vC2-"/><lb n="P62vC2L-"/><div type="lection" n="S2W14D4"><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><lb n="P62vC2L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twentyone</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P62vC2L-"/></ab><ab n="Gal.2.2"><w>verse</w><lb n="P62vC2L-"/><w>tw<pb n="63r" type="folio" xml:id="P63r-" break="no"/><cb n="P63rC1-"/><lb n="P63rC1L-"/>o</w><w>continues</w></ab></div></div></div><div type="lection" n="S2W14D5"><div type="book" n="Gal"><div type="chapter" n="Gal.1"><ab n="Gal.1.20"><w>verse</w><w>twenty</w><w>a<lb n="P63rC1L-" break="no"/>gain</w><lb n="P63rC1L-"/></ab><ab n="Gal.1.21"><w>verse</w><w>twenty-one</w><w>again</w></ab></div><div type="chapter" n="Gal.2"><ab n="Gal.2.1"><w>verse</w><w>one</w><lb n="P63rC1L-"/><w>again</w></ab><ab n="Gal.2.2"><w>verse</w><w>two</w><lb n="P63rC1L-"/><pb n="63v" type="folio" xml:id="P63v-"/><cb n="P63vC1-"/><lb n="P63vC1L-"/><w>again</w></ab></div></div></div>' + xmlTail;
    await page.evaluate(`setTEI('${data}');`);
    await page.click('button#mceu_18-open');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const menuFrameHandle = await page.$('div[id="mceu_39"] > div > div > iframe');
    const menuFrame = await menuFrameHandle.contentFrame();

    // test the content of the drop down menu - should be 3 pages (62v, 63r, 63v and all)
    expect(await menuFrame.$eval('#pageSelect', el => el.options.length)).toBe(4);
    expect(await menuFrame.$eval('#pageSelect', el => el.options[0].value)).toBe('all');
    expect(await menuFrame.$eval('#pageSelect', el => el.options[1].value)).toBe('62v');
    expect(await menuFrame.$eval('#pageSelect', el => el.options[2].value)).toBe('63r');
    expect(await menuFrame.$eval('#pageSelect', el => el.options[3].value)).toBe('63v');

  }, 200000);

});

