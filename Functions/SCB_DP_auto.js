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

module.exports.dp_scb_auto = (driver, acc_type, agent_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      await main(driver, acc_type, agent_id)
        .then((result) => resolve(result))
        .catch((error) => reject("reject main", error));

      function split_word(word) {
        return new Promise(async (resolve, reject) => {
          try {
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
            let result = {
              channel: channel,
              from_acc: from_acc,
              from_acc_name: from_acc_name,
              from_bank_id: from_bank_id,
            };
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      }

      async function main(driver, acc_type, agent_id) {
        return new Promise(async (resolve, reject) => {
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
            await driver
              .findElement(By.name("LOGIN"))
              .sendKeys(robot_acc_login);
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

            // start function
            async function roundOfDayStatement() {
              //click fromday's Statement
              try {
                console.log("click today statement");
                await driver.findElement(By.id("DataProcess_Link2")).click();
              } catch {
                // await driver.sleep(60000);
                // await driver.close();
                // setTimeout(() => {
                //   i = 0;
                //   working = false;
                //   console.log("------------Timeout Forloop waited 1 min " + new Date() )
                // }, 60000);
                await driver.findElement(By.id("DataProcess_Link3")).click();
                console.log(
                  "-----------Click history tab by catch of function " +
                    new Date()
                );
                // await driver.findElement(By.id("Logout_LinkButton")).click();
                // let thankyou = await driver.wait(
                //     until.elementLocated(By.className("bg-thankyou"))
                // );
                // console.log("Thankyou Screen by normal", thankyou);
              }
              console.log("Finding  data table");
              let countrows = await driver.findElements(
                By.xpath("//table[@id='DataProcess_GridView']/tbody/tr")
              );
              console.log("countrows", countrows.length);
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
                      console.log(i + " " + j + " " + name);
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
                        } else {
                          channel = name;
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
                          console.log("split word", name);
                          if (name.includes("จ่ายบิล") == false) {
                            var2 = await split_word(name);
                          }
                        }
                        word = name;
                      }
                    }
                  }
                  let set_array;
                  amount = amount.replace(/\,/g, "");
                  balance = balance.replace(/\,/g, "");
                  console.log("channel", channel);
                  if (channel != "ATM" && word.includes("จ่ายบิล") == false) {
                    console.log("Not ATM var : ", var2);
                    console.log("Not ATM var channel ", var2.channel);
                    // channel = var2.channel;
                    // let from_acc = var2.from_acc;
                    // let from_acc_name = var2.from_acc_name;
                    // let from_bank_id = var2.from_bank_id;
                    set_array = {
                      slip_type,
                      cr_date,
                      cr_time,
                      amount,
                      channel: var2.channel,
                      from_acc: var2.from_acc,
                      from_acc_name: var2.from_acc_name,
                      from_bank_id: var2.from_bank_id,
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
                  await model.insert_data_dp(
                    set_array,
                    agent_id,
                    robot_bank,
                    acc_id
                  );
                }
              }
              await driver.findElement(By.id("DataProcess_Link3")).click();
              console.log("Click history statement");
            }
            //end funtion

            let iterator = 150;
            for (var i = 1; i <= iterator; i++) {
              await roundOfDayStatement();
              console.log(
                "----------------------------------------------round No." +
                  i +
                  " " +
                  new Date()
              );
              await driver.sleep(10000);
            }

            await driver.sleep(500);
            console.log("logout 1");
            await driver.findElement(By.id("Logout_LinkButton")).click();
            console.log("Thankyou 1");
            let thankyou = await driver.wait(
              until.elementLocated(By.className("bg-thankyou"))
            );
            console.log("Thankyou Screen by normal", thankyou);
            console.log("DateTime", new Date());
            await driver.close();
            resolve(false);
          } catch (err) {
            await driver.sleep(500);
            console.log("logout 2");
            //    let logout  = await driver.wait(until.elementLocated(By.id("Logout_LinkButton")),2000).catch(() => { reject(err)});
            //     console.log('logoput => ',logout)
            await driver.findElement(By.id("Logout_LinkButton")).click();
            console.log("Thankyou 2");
            let thankyou = await driver.wait(
              until.elementLocated(By.className("bg-thankyou"))
            );
            console.log("Thankyou Screen by normal", thankyou);
            console.log("DateTime", new Date());

            await driver.close();
            reject(err);
          }
        });
      }
    } catch (err) {
      console.log("error catch ", err);
      console.log("catch in dp auto scb");
      reject(err);
    }
  });
};
