const model = require("../models/server.model.js");
const fn = require("../Functions/commond.function");
const ObjectDriver = new Map();
const express = require("express");
const { Builder, By, Key, until, WebElement } = require("selenium-webdriver");
require("chromedriver");
const moment = require("moment");
const chrome = require("selenium-webdriver/chrome");
const { request } = require("express");
const imageToBase64 = require("image-to-base64");
const { CronJob } = require("cron");
const { job } = require("cron");
var working = false;

//--------------TTB--------------//
// const credential = {
//   username_ttb: "natkingsize2",
//   password_ttb: "natl@2iriY",
// };
// const data_wd = {
//   bank_contact: "scb",
//   name_contact: "NatkingsizeNaja",
//   acc_contact: "0602977904",
//   amount_wd: "0.25",
// };

module.exports = async () => {
  new CronJob(
    "*/20 * * * * *",
    async () => {
      try {
        console.log("start conjob robot" + new Date());
        if (working !== true) {
          working = true;
          console.log("working", working);

          //----------get ip-----------//
          // let ip = await fn.get_ip();
          // let ip = "192.168.1.78"; //----deposit
          let ip = "192.168.1.89"; //----withdraw
          //--------------------------//

          console.log("ip =>", ip);
          let web_id = await model.getagentid(ip);
          let acc_type = web_id[0].robot.account_type;
          let bank_id = web_id[0].robot.bank_id;
          let agent_id = web_id[0]._id;
          console.log("acc_type =>", acc_type);
          console.log("bank_id =>", bank_id);
          console.log("agent_id =>", agent_id);
          if (acc_type == "deposit") {
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

            await dp_scb_auto(driver, acc_type, agent_id, bank_id);
          } else {
            let account_id = await model.getcof_acct(acc_type, agent_id);
            let robot = account_id[0];
            let agnet_bankacc_id = robot._id;
            console.log("agnet_bankacc_id =>", agnet_bankacc_id);

            let all_job = await model.get_job_doc_wd(
              agent_id,
              agnet_bankacc_id
            );
            console.log("all_job =>", all_job);

            if (Object.keys(all_job).length !== 0) {
              const setChromeOptions = new chrome.Options();
              setChromeOptions.addArguments("--no-sandbox");
              // setChromeOptions.addArguments('--headless');
              setChromeOptions.addArguments("--hide-scrollbars");
              setChromeOptions.addArguments("window-size=1280,1024");
              setChromeOptions.addArguments("--disable-gpu");

              const driver = await new Builder()
                .setChromeOptions(setChromeOptions)
                .forBrowser("chrome")
                .build();

              let job = all_job[0];
              console.log("job =>", job);

              await wd_ttb_auto(driver, acc_type, agent_id, job);
              console.log(
                "---------------------END-AUTO-WITHDRAW--------------------"
              );
            }
          }
          setTimeout(() => {
            i = 0;
            working = false;
          }, 10000);
          console.log("end working", working + new Date());
        }
      } catch (err) {
        console.log(err);
        working = false;
        console.log("catch end working", working);
      }
    },
    null,
    true
  );
};

async function wd_ttb_auto(driver, acc_type, agent_id, job) {
  try {
    console.log("---------------------START-WITHDRAW--------------------");
    //-----------prepare data_wd------------//
    let account_id = await model.getcof_acct(acc_type, agent_id);
    let robot = account_id[0];
    let agnet_bankacc_id = robot._id;
    let agnet_bankacc_no = robot.account_number;
    let agent_bankacc_username = robot.username;
    let agent_bankacc_password = robot.password;
    let agent_bank_id = robot.bank_id;

    //------------------update processing---------------//
    let { _id, description } = job;
    await model.update_status_wd(_id, "processing", description);

    //-------Open web ttb-----------//
    await driver.get("https://www.ttbdirect.com/ttb/kdw1.39.1#_frmIBPreLogin");
    await driver.sleep(2000);

    console.log("start Login...");
    await step_Login(driver, agent_bankacc_username, agent_bankacc_password);

    console.log("start click abount me...");
    await step_clickabountme(driver);

    console.log("start delete contact...");
    await step_del_firstcontact(driver);

    console.log("start add contact...");
    await step_add_contact(driver, job);

    console.log("start tranfer...");
    await step_insert_tranfer_acc(driver, job);

    console.log("start Logout...");
    await step_logout(driver);
  } catch (err) {
    console.log("catch logout start...");
    //-----------update status cancel-----------//
    let { _id, description } = job;
    description = description.concat({
      username: "system",
      note: err,
      note_date: new Date(moment().format()),
    });
    console.log("description =>", description);
    await model.update_status_wd(_id, "cancel", description);
    try {
      await step_logout(driver);
    } catch (err) {
      await driver.close();
      console.log(err);
    }
  }

  async function step_Login(
    
    driver,
    agent_bankacc_username,
    agent_bankacc_password
  ) {
    try {
      //--------click eng----------//
      console.log("   ...click eng");
      await driver
        .wait(until.elementLocated(By.id("hbxIBPreLogin_btnEng")), 3000)
        .click();
      await driver.sleep(1000);
      //---------input username & password & click login-------------//
      console.log("   ...input username");
      await driver
        .findElement(By.id("frmIBPreLogin_txtUserId"))
        .sendKeys(agent_bankacc_username);
      console.log("   ...input password");
      await driver
        .findElement(By.id("frmIBPreLogin_txtPassword"))
        .sendKeys(agent_bankacc_password);
      await driver.findElement(By.id("frmIBPreLogin_btnLogIn")).click();
      await driver.sleep(4000);
      console.log("   ...click login");
    } catch (err) {
      console.log("****   ...step_Login", err);
      throw err;
    }
  }

  async function step_clickabountme(driver) {
    try {
      //----------click aboutme & favorites menu------------//
      console.log("   ...click aboutme");
      await driver
        .findElement(By.id("frmIBPostLoginDashboard_btnMenuAboutMe"))
        .click();
      await driver.sleep(1000);
      console.log("   ...click favorites menu");
      await driver
        .findElement(
          By.xpath('//*[@id="frmIBPostLoginDashboard_segMenuOptions"]/ul/li[3]')
        )
        .click();
      await driver.sleep(1000);
    } catch (err) {
      console.log("****   ...catch step_clickabountme", err);
      throw err;
    }
  }

  async function step_del_firstcontact(driver) {
    try {
      //-----------delete first favorites contact----------------//
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
      await driver.sleep(500);
    } catch {}
  }

  async function step_add_contact(driver, job) {
    try {
      //----------prepare data_wd----------//
      console.log("   ...Prepare data_wd");
      let {
        memb_bank_account_name,
        memb_bank_nameen,
        memb_bank_account_number,
      } = job;
      console.log("memb_bank_account_name =>", memb_bank_account_name);
      console.log("memb_bank_nameen =>", memb_bank_nameen);
      //-------add favorites contact-------//
      console.log("   ...click add contact");
      await driver
        .findElement(By.id("frmIBMyReceipentsHome_btnAddFavorites"))
        .click();
      await driver.sleep(500);
      //--------input name favorites----------//
      console.log("   ...input name contact");
      await driver
        .findElement(By.id("frmIBMyReceipentsAddBankAccnt_tbxAddAccntNickName"))
        .sendKeys(memb_bank_account_name);
      //----------select bank------------//
      console.log("   ...select bank");
      await driver.sleep(500);
      let lengthElems = await driver.executeScript(
        `return document.getElementById("frmIBMyReceipentsAddBankAccnt_comboBankName").length`
      );
      if (memb_bank_nameen !== "") {
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
          if (textBookBank.match(memb_bank_nameen)) {
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
      } else {
        console.log("No Data Bank Contact");
        throw err;
      }
      //-----------add account number------------//
      console.log("   ...input acc number");
      await driver
        .findElement(By.id("frmIBMyReceipentsAddBankAccnt_tbxAddAccntNumber"))
        .sendKeys(memb_bank_account_number);
      await driver
        .findElement(By.id("frmIBMyReceipentsAddBankAccnt_btnAddAccntNext"))
        .click();
      await driver.sleep(2000);
      console.log("check alert.....");
      let textalert = await fn.checkalertweb(driver);
      if (textalert != "" || textalert != null) {
        console.log("alert =>", textalert);
        // await driver
        //   .switchTo()
        //   .alert()
        //   .then(async function () {
        //     let checktext = await driver.switchTo().alert().getText();
        //     console.log("check text alert : ", checktext);
        let account = textalert.includes("account");
        console.log("boo_account", account);
        let incorrect = textalert.includes("incorrect");
        console.log("boo_incorrect", incorrect);
        let INACTIVE = textalert.includes("INACTIVE");
        console.log("boo_INACTIVE", INACTIVE);
        if (account === true || incorrect === true || INACTIVE === true) {
          try {
            let a = await driver
              .switchTo()
              .alert()
              .accept()
              .catch(() => {
                throw err;
              });
          } catch {
            console.log("No alert accept");
          }
          throw (
            "เลขบัญชี " +
            memb_bank_account_number +
            " ไม่ถูกต้อง ไม่สามารถทำรายการถอนได้"
          );
        }
      } else {
        console.log("No Alert");
      }
      await driver
        .findElement(
          By.id("frmIBMyReceipentsAddContactManually_btnAddAccntNext")
        )
        .click();
      await driver.sleep(3000);
      //-------------OTP-------------//
      console.log("   ...call OTP");
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
      console.log("ref =>", ref);
      console.log("mob =>", mob);
      await driver.sleep(5000);
      let OTP;
      try {
        OTP = await model.callOTP(ref);
      } catch {
        OTP = await model.callOTP(ref);
        if (OTP.length == 0) {
          throw "ไม่พบเลขข้อมูล OTP ในระบบ";
        }
      }
      console.log("OTP =>", OTP[0].value);
      await driver.sleep(500);
      await model.removeOTP(OTP[0]._id);
      //---------------Confirm OTP-------------//
      console.log("   ...input OTP");
      await driver
        .findElement(By.id("frmIBMyReceipentsAddContactManually_txtotp"))
        .sendKeys(OTP[0].value);
      await driver.sleep(500);
      await driver
        .findElement(
          By.id("frmIBMyReceipentsAddContactManually_btnAddAccntNext")
        )
        .click();
      await driver.sleep(1000);
      console.log("click transfer");
      await driver
        .findElement(
          // By.xpath(
          //   "/html/body/div/div/form/div/div[2]/div/div/div/div/div[2]/div/div/div/div/div/div/div[11]/div/div/div/div/div/div/div/div/div/ul/li/div/div/div/div/div[4]/div/div/div/div"
          // )
          By.id("hbox1010001831107419_btnTransfer")
        )
        .click();
      await driver.sleep(1000);
    } catch (err) {
      console.log("****   ...catch step_add_contact", err);
      throw err;
    }
  }

  async function step_insert_tranfer_acc(driver, job) {
    try {
      //----------prepare data_wd----------//
      console.log("   ...Prepare data_wd");
      console.log("job =>", job);
      let { _id, amount, agent_id, memb_id, description, from_bank_id } = job;

      //------click bank item0-------//
      console.log("   ...click bank web");
      button = await driver.wait(
        until.elementLocated(By.xpath('//*[@id="item-0"]/table/tbody')),
        30000
      );
      await button.click();
      await driver.sleep(1000);
      //-------click show contact----------//
      console.log("   ...click show contact");
      newButton = await driver.wait(
        until.elementLocated(By.id("frmIBTranferLP_btnXferShowContact")),
        30000
      );
      await newButton.click();
      //------click account-------------//
      console.log("   ...click account contact ");
      await driver.sleep(1000);
      button = await driver.wait(
        until.elementLocated(
          By.xpath(
            "/html/body/div/div[1]/form/div/div[2]/div/div/div/div/div[2]/div/div[3]/div/div/div/div/div/div/div[2]/div/div/ul/li[2]/div"
          )
        ),
        30000
      );
      //   button = await driver.wait(
      //     until.elementLocated(By.id("hbxXferSegmentInitial_hbxXferSegmentInitial")),
      //     30000
      //   );
      //   await button.click();
      await driver.sleep(1000);
      await driver
        .findElement(By.id("frmIBTranferLP_txbXferAmountRcvd"))
        .sendKeys(amount);
      await driver.sleep(500);
      button = await driver.wait(
        until.elementLocated(By.id("frmIBTranferLP_txtArMn")),
        30000
      );
      await button.click();
      console.log("   ...click Next");
      await driver.sleep(1000);
      button = await driver.wait(
        until.elementLocated(By.id("frmIBTranferLP_btnXferNext")),
        30000
      );
      await button.click();
      await driver.sleep(1000);
      button = await driver.wait(
        until.elementLocated(By.id("frmIBTransferNowConfirmation_btnXferNext")),
        3000
      );
      await button.click();
      await driver.sleep(3000);
      //----------OTP----------//
      console.log("   ...call OTP");
      let ref = await driver
        .wait(
          until.elementLocated(
            By.id("frmIBTransferNowConfirmation_lblBankRefVal")
          ),
          1000
        )
        .getText();
      console.log("ref =>", ref);
      await driver.sleep(5000);
      let OTP;
      try {
        OTP = await model.callOTP(ref);
      } catch {
        OTP = await model.callOTP(ref);
        if (OTP.length == 0) {
          throw "ไม่พบเลขข้อมูล OTP ในระบบ";
        }
      }
      console.log("OTP =>", OTP[0]);
      await model.removeOTP(OTP[0]._id);
      //---------------Confirm OTP-------------//
      console.log("   ...comfirm OTP");
      await driver
        .findElement(By.id("frmIBTransferNowConfirmation_txtBxOTP"))
        .sendKeys(OTP[0].value);
      await driver.sleep(500);
      await driver
        .findElement(By.id("frmIBTransferNowConfirmation_brnConfirm"))
        .click();
      await driver.sleep(1000);
      //---------------get data-------------//
      console.log("   ...get data");
      let silp_date, silp_image;
      let balance = await driver
        .wait(
          until.elementLocated(By.id("frmIBTransferNowCompletion_lblBal")),
          1000
        )
        .getText();
      balance = balance.replace(/\฿/g, "");
      console.log("balance =>", balance);
      let acc = await driver
        .wait(
          until.elementLocated(
            By.id("frmIBTransferNowCompletion_lblAccountNo")
          ),
          1000
        )
        .getText();
      console.log("acc =>", acc);
      let nameonbank = await driver
        .wait(
          until.elementLocated(
            By.id("frmIBTransferNowCompletion_lblXferToAccTyp")
          ),
          1000
        )
        .getText();
      console.log("nameonbank =>", nameonbank);
      let timetransfer = await driver
        .wait(
          until.elementLocated(
            By.id("frmIBTransferNowCompletion_lblTransferVal")
          ),
          1000
        )
        .getText();
      console.log("timetransfer =>", timetransfer);
      //---------------Task Screen-------------//
      console.log("   ...task screen");
      // let base64 = await driver
      //   .wait(
      //     until.elementsLocated(By.id("frmIBTransferNowCompletion_vbxTransaction")),
      //     5000
      //   )
      //   .takeScreenshot();
      //   console.log(base64)
      let pathpic = `./img/${new Date().getTime()}.png`;
      console.log("pathpic", pathpic);
      await driver.takeScreenshot().then(function (img, err) {
        require("fs").writeFile(pathpic, img, "base64", function (err) {
          console.log("err", err);
        });
      });
      await driver.sleep(1000);
      //------------convert to base64------------//
      console.log("   ...convert to base64");
      await imageToBase64(pathpic) // Path to the image
        .then((response) => {
          let img = "data:image/jpeg;base64," + response;
          // console.log("imgtobase64 => ", img); // "cGF0aC90by9maWxlLmpwZw=="
          silp_image = img;
        })
        .catch((error) => {
          console.log("err => ", error); // Logs an error if there was one
        });
      //--------------update data_wd------------//
      console.log("   ...update data_wd");
      console.log("agent_id =>", agent_id);
      console.log("mem_id =>", memb_id);
      let boo = false;
      let arr_memname = await model.get_member_name(agent_id, memb_id);
      console.log("arr membername =>", arr_memname[0]);
      memname = arr_memname[0].account_name;
      console.log("memname =>", memname);
      desmem = arr_memname.description;
      console.log("member description =>", arr_memname.description);
      if (desmem != null) {
        desmem = desmem.concat({
          username: "system",
          note:
            "มีการเปลี่ยนชื่อบัญชีจาก (" +
            memname +
            ") เป็นชื่อ (" +
            nameonbank +
            ")",
          note_date: new Date(moment().format()),
        });
      } else {
        desmem = {
          username: "system",
          note:
            "มีการเปลี่ยนชื่อบัญชีจาก (" +
            memname +
            ") เป็นชื่อ (" +
            nameonbank +
            ")",
          note_date: new Date(moment().format()),
        };
      }
      console.log("member description =>", desmem);
      if (memname != nameonbank) {
        await model.update_member_name(arr_memname[0]._id, nameonbank, desmem);
        boo = true;
      }
      await model.updatebalance(from_bank_id, balance);
      silp_date = timetransfer;
      description = description.concat({
        username: "system",
        note: "ทำรายการถอนสำเร็จ",
        note_date: new Date(moment().format()),
      });
      if (boo == true) {
        description = description.concat({
          username: "system",
          note:
            "มีการเปลี่ยนชื่อบัญชีจาก (" +
            memname +
            ") เป็นชื่อ (" +
            nameonbank +
            ")",
          note_date: new Date(moment().format()),
        });
      }
      console.log("description =>", description);
      await model.update_status_wd(_id, "processing", description);
      //-------------------update doc------------------//
      // console.log("silp_image =>", silp_image);
      console.log("silp_date =>", silp_date);
      await model.update_doc_wd(_id, silp_date, silp_image);
      await driver.sleep(500);
    } catch (err) {
      console.log("****   ...catch step_insert_tranfer_acc", err);
      throw err;
    }
  }

  async function step_logout(driver) {
    try {
      //-----------Logout----------------//
      await driver.sleep(1000);
      await driver.findElement(By.id("hbxIBPostLogin_lnkLogOut")).click();
      await driver.sleep(1000);
      await driver.close();
    } catch (err) {
      console.log("****   ...catch step_logout", err);
      throw err;
    }
  }
}

async function dp_scb_auto(driver, acc_type, agent_id) {
  try {
    function split_word(word) {
      let var_array, channel, from_acc, from_acc_name, from_bank_id;
      let boo = word.toUpperCase().includes("PROMPTPAY");
      if (boo == true) {
        //promptpay transaction
        var_array = word.split(" ");
        channel = var_array[0];
        from_acc = var_array[1];
        from_acc_name = var_array[2] + " " + var_array[3];
        from_bank_id = null;
      } else {
        boo = word.includes("SCB");
        if (boo == true) {
          //SCB transaction
          var_array = word.split(" ");
          channel = "Bank_transfer by scb";
          from_acc = var_array[2];
          from_acc_name = var_array[4] + " " + var_array[5];
          from_bank_id = "SCB";
        } else {
          var_array = word.split(" ");
          from_bank_id = var_array[1];
          from_bank_id = from_bank_id.replace(/\(/g, "");
          from_bank_id = from_bank_id.replace(/\)/g, "");
          from_bank_id = from_bank_id.trim().toLowerCase();
          channel = "Bank_transfer by " + from_bank_id;
          from_acc = var_array[2];
          from_acc_name = null;
        }
      }
      from_bank_id = from_bank_id.replace(/\(/g, "");
      from_bank_id = from_bank_id.replace(/\)/g, "");
      from_bank_id = from_bank_id.trim().toLowerCase();
      let from_acc_arr = from_acc.match(/(\d+)(((.|,)\d+)+)?/g);
      from_acc = from_acc_arr[0];
      return { channel, from_acc, from_acc_name, from_bank_id };
    }

    async function main(driver, acc_type, agent_id) {
      try {
        let account_id_ = await model.getcof_acct(acc_type, agent_id);
        console.log("account_id", account_id_);
        let robot = account_id_[0];
        let acc_id = robot._id;
        let robot_acc_no = robot.account_number;
        let robot_bank = robot.bank_id;
        let robot_acc_login = robot.username;
        let robot_acc_pwd = robot.password;

        await driver.get(
          "https://www.scbeasy.com/v1.4/site/presignon/index.asp"
        );
        await driver.findElement(By.name("LOGIN")).sendKeys(robot_acc_login);
        await driver.findElement(By.name("PASSWD")).sendKeys(robot_acc_pwd);
        await driver.findElement(By.id("lgin")).click();
        //click select account menu
        await driver.findElement(By.id("Image3")).click();
        //click account no.1
        let balance = await driver
          .findElement(
            By.xpath(
              "//*[@id='DataProcess_SaCaGridView']/tbody/tr[2]/td/table/tbody/tr/td[4]"
            )
          )
          .getAttribute("innerText");
        console.log(balance);
        let update = await model.updatebalance(acc_id, balance);
        console.log(update);
        await driver
          .findElement(By.id("DataProcess_SaCaGridView_SaCa_LinkButton_0"))
          .click();
        //click fromday's Statement
        await driver.findElement(By.id("DataProcess_Link2")).click();
        let countrows = await driver.findElements(
          By.xpath("//table[@id='DataProcess_GridView']/tbody/tr")
        );
        for (var i = 1; i <= countrows.length; i++) {
          if (i != 1 && i != countrows.length) {
            let cr_time;
            let cr_date;
            let channel;
            let amount;
            let slip_type;
            let word;
            let to_acc = robot_acc_no;
            let to_acc_name = null;
            let to_bank_id = robot_bank;
            let var2;
            for (var j = 1; j < 8; j++) {
              if (j != 3) {
                let name = await driver
                  .findElement(
                    By.xpath(
                      "//table[@id='DataProcess_GridView']/tbody/tr[" +
                        i +
                        "]/td[" +
                        j +
                        "]"
                    )
                  )
                  .getAttribute("innerText");
                name = name.trim();
                if (j == 1) {
                  cr_date = name;
                }
                if (j == 2) {
                  cr_time = name;
                }
                if (j == 4) {
                  console.log("channel", name);
                  if (name == "ATM") {
                    channel = "ATM";
                  }
                }
                if (j == 5 && name != "") {
                  amount = name;
                  slip_type = "withdraw";
                }
                if (j == 6 && name != "") {
                  amount = name;
                  slip_type = "deposit";
                }
                if (j == 7) {
                  if (channel !== "ATM") {
                    var2 = split_word(name);
                  }
                  word = name;
                }
              }
            }
            let set_array;
            amount = amount.replace(/\,/g, "");
            balance = balance.replace(/\,/g, "");
            if (channel != "ATM") {
              channel = var2.channel;
              let from_acc = var2.from_acc;
              let from_acc_name = var2.from_acc_name;
              let from_bank_id = var2.from_bank_id;
              set_array = {
                slip_type,
                cr_date,
                cr_time,
                amount,
                channel,
                from_acc,
                from_acc_name,
                from_bank_id,
                to_acc,
                to_acc_name,
                to_bank_id,
                word,
                balance,
              };
              console.log(set_array);
            } else {
              let from_acc = null;
              let from_acc_name = null;
              let from_bank_id = null;
              set_array = {
                slip_type,
                cr_date,
                cr_time,
                amount,
                channel,
                from_acc,
                from_acc_name,
                from_bank_id,
                to_acc,
                to_acc_name,
                to_bank_id,
                word,
                balance,
              };
              console.log(set_array);
            }
            // -------------- get bankid
            await model.insert_data_dp(set_array, agent_id, robot_bank, acc_id);
          }
        }
        await driver.sleep(500);
        await driver.close();
      } catch (err) {
        await driver.sleep(500);
        await driver.close();
        throw err;
      }
    }
    main(driver, acc_type, agent_id);
  } catch (err) {
    console.log(err);
    response.send({ status: "400", message: "error", err }).end();
  }
}
