const puppeteer = require('puppeteer');
const path = require('path');
const toml = require('toml');
const fs = require('fs/promises');
const cuid = require('cuid');
const argv = require('minimist')(process.argv.slice(2));

const config = () => fs.readFile(path.resolve('./config.toml')).then(toml.parse);

(async () => {
  const data = await config();
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://invoice.remessaonline.com.br/', {waitUntil: 'networkidle2'});
  await page.click('.tab-link-tab-2');
  await page.waitForSelector('.form-block-2 [name="value-usd-2"]');
  await page.type('.form-block-2 [name="value-usd-2"]', 'Text', { delay: 100 });
  await page.evaluate(({ data, argv }) => {
    const tab = document.querySelector('[data-w-tab="Tab 2"].tab-pane-tab-2')
    tab.querySelector('[name="value-usd-2"]').value = data.receiver.name;
    tab.querySelector('#email2').value = data.receiver.email;
    tab.querySelector('#CEP-en').value = data.receiver.zipcode;
    tab.querySelector('#Creation-date-3').value = data.receiver.city;
    tab.querySelector('#Creation-date-4').value = data.receiver.address1;
    tab.querySelector('#Full-name-of-receiver-3').value = data.receiver.address2;

    tab.querySelector('#Company-who-s-paying-4').value = data.payer.name;
    tab.querySelector('#Company-who-s-paying-3').value = data.payer.address;

    tab.querySelector('#Company-who-s-paying-4.align-left').value = argv.number.toString().padStart(4, 0);

    const date = new Date();
    tab.querySelector('#emission-date-en').value = `${date.getDate().toString().padStart(2, 0)}/${String(date.getMonth() + 1).padStart(2, 0)}/${date.getFullYear()}`;
    tab.querySelector('#due-date-en').closest('div').remove();
    tab.querySelector('#field-2').value = data.description;
    tab.querySelector('.select-currency-en').innerHTML = '<option selected value=""></option>';
    tab.querySelector('[name="Estado-2"]').value = `${argv.currency || 'USD'} ${argv.value}`;
    tab.querySelector('.submit-button-2').remove();
  }, { data, argv });

  const result = path.resolve(`./__generated__/invoice-${argv.number.toString().padStart(4, 0)}-${cuid()}.pdf`);
  await page.pdf({ path: result });

  await browser.close();

  console.log(result);
})();
