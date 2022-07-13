const { Builder, By, Key, until, WebElement } = require("selenium-webdriver");
require("chromedriver");
const moment = require("moment");
const chrome = require("selenium-webdriver/chrome");
const model = require("./models/server.model.js");

async function findOTP(opt) {
  return new Promise((resolve, reject) => {
    model.callOTP(opt, function (res) {
      console.log(res);
    });
  });
}

async function Login() {
  let setChromeOptions = new chrome.Options();
  //setChromeOptions.addArguments('--headless');
  setChromeOptions.addArguments("--no-sandbox");
  setChromeOptions.addArguments("--hide-scrollbars");
  setChromeOptions.addArguments("window-size=1024,768");
  setChromeOptions.addArguments("--disable-gpu");
  let driver = await new Builder()
    .setChromeOptions(setChromeOptions)
    .forBrowser("chrome")
    .build();
  // Open web ttb
  await driver.get("https://www.ttbdirect.com/ttb/kdw1.39.1#_frmIBPreLogin");
  await driver.sleep(2000);
  // click eng
  await driver
    .wait(until.elementLocated(By.id("hbxIBPreLogin_btnEng")), 3000)
    .click();
  await driver.sleep(2000);
  // input username & password & click login
  await driver
    .findElement(By.id("frmIBPreLogin_txtUserId"))
    .sendKeys("natkingsize2");
  await driver
    .findElement(By.id("frmIBPreLogin_txtPassword"))
    .sendKeys("natl@2iriY");
  await driver.findElement(By.id("frmIBPreLogin_btnLogIn")).click();
  await driver.sleep(5000);
  // click aboutme & favorites menu
  await driver
    .findElement(By.id("frmIBPostLoginDashboard_btnMenuAboutMe"))
    .click();
  await driver.sleep(1000);
  await driver
    .findElement(
      By.xpath('//*[@id="frmIBPostLoginDashboard_segMenuOptions"]/ul/li[3]')
    )
    .click();
  await driver.sleep(2000);
  //   delete first favorites contact
  await driver
    .findElement(
      By.xpath(
        "/html/body/div/div[1]/form/div/div[2]/div/div/div/div/div[1]/div/div[6]/div/div/div/div/div/div/div/div/div/ul/li/div/div/div[5]"
      )
    )
    .click();
  await driver.sleep(500);
  await driver
    .findElement(
      By.xpath(
        "/html/body/div/div[4]/form/div/div/div/div/div/div[3]/div/div/div[2]"
      )
    )
    .click();
  await driver.sleep(1000);
  //   add favorites contact
  await driver
    .findElement(By.id("frmIBMyReceipentsHome_btnAddFavorites"))
    .click();
  await driver.sleep(500);
  // input name favorites
  await driver
    .findElement(By.id("frmIBMyReceipentsAddBankAccnt_tbxAddAccntNickName"))
    .sendKeys("Natkingsizenaja");
  // select bank
  await driver.sleep(1000);
  let lengthElems = await driver.executeScript(
    `return document.getElementById("frmIBMyReceipentsAddBankAccnt_comboBankName").length`
  );
  for (let i = 1; i <= lengthElems - 1; i++) {
    let textBookBank = await driver
      .wait(
        until.elementLocated(
          By.xpath(
            '//*[@id="frmIBMyReceipentsAddBankAccnt_comboBankName"]/option[' +
              i +
              "]"
          )
        ),
        1000
      )
      .getText();
    console.log(textBookBank);
    if (textBookBank.match(/Kasikorn Bank/g)) {
      await driver
        .wait(
          until.elementLocated(
            By.xpath(
              '//*[@id="frmIBMyReceipentsAddBankAccnt_comboBankName"]/option[' +
                i +
                "]"
            )
          ),
          3000
        )
        .click();
      break;
    }
  }
  // add account number
  await driver
    .findElement(By.id("frmIBMyReceipentsAddBankAccnt_tbxAddAccntNumber"))
    .sendKeys("0822809707");
  await driver
    .findElement(By.id("frmIBMyReceipentsAddBankAccnt_btnAddAccntNext"))
    .click();
  await driver.sleep(1000);
  await driver
    .findElement(By.id("frmIBMyReceipentsAddContactManually_btnAddAccntNext"))
    .click();
  await driver.sleep(4000);
  let ref = await driver
    .wait(
      until.elementLocated(
        By.id("frmIBMyReceipentsAddContactManually_lblrefvalue")
      ),
      1000
    )
    .getText();
  let mob = await driver
    .wait(
      until.elementLocated(
        By.id("frmIBMyReceipentsAddContactManually_lblotpmob")
      ),
      1000
    )
    .getText();
  console.log("ref", ref);
  console.log("mob", mob);
  // ***OTP***
  // click transfer
  //   await driver
  //     .findElement(
  //       By.xpath(
  //         "/html/body/div/div/form/div/div[2]/div/div/div/div/div[2]/div/div/div/div/div/div/div[11]/div/div/div/div/div/div/div/div/div/ul/li/div/div/div/div/div[4]/div/div/div/div"
  //       )
  //     )
  //     .click();
  //   await driver.sleep(500);
}
// Login();
findOTP();
