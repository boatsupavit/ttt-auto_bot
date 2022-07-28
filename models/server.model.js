const { ObjectId, Double } = require("mongodb");
// const { MongoDB } = require("../config/mongodb");
const { MongoDB } = require("../build/mongodb");
const moment = require("moment");

module.exports.callOTP = (ref) => {
  return new Promise(async (resolve, reject) => {
    await MongoDB.collection("msg_pushbullet")
      .aggregate([
        {
          $match: {
            $and: [{ type: "OTP" }, { ref: ref }],
          },
        },
        {
          $project: {
            id: 1,
            value: "$value",
            ref: "$ref",
          },
        },
      ])
      .toArray()
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
};

module.exports.removeOTP = (_id) => {
  return new Promise(async (resolve, reject) => {
    await MongoDB.collection("msg_pushbullet")
      .deleteOne({ _id: ObjectId(_id) })
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
};

module.exports.getagentid = (ip) => {
  return new Promise(async (resolve, reject) => {
    await MongoDB.collection("agent")
      .aggregate([
        {
          $project: {
            _id: 1,
            robot: "$robot",
          },
        },
        {
          $unwind: { path: "$robot" },
        },
        {
          $match: {
            $and: [{ "robot.robot_ip": ip }],
          },
        },
      ])
      .toArray()
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
};

module.exports.getcof_acct = (account_type, agent_id) => {
  return new Promise(async (resolve, reject) => {
    await MongoDB.collection("agent_bank_account")
      .aggregate([
        {
          $match: {
            $and: [
              { status: "active" },
              { bank_auto_status: "active" },
              { sub_type: account_type },
              { agent_id: ObjectId(agent_id) },
            ],
          },
        },
        {
          $project: {
            _id: 1,
            agent_id: "$agent_id",
            account_number: "$account_number",
            username: "$bank_auto_config.username",
            password: "$bank_auto_config.password",
            bank_id: "$bank_id",
          },
        },
      ])
      .toArray()
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
};

module.exports.get_data_wd = (_id, agent_id) => {
  return new Promise(async (resolve, reject) => {
    await MongoDB.collection("")
      .aggregate([
        {
          $match: {
            $and: [{ status: "approve" }, { agent_id: ObjectId(agent_id) }],
          },
        },
        {
          $project: {
            _id: 1,
            agent_id: "$agent_id",
          },
        },
      ])
      .toArray()
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
};

module.exports.insert_data_dp = (data, agent_id, bank_id, account_id) => {
  console.log("insert DB --- Date", data.cr_date, "Time", data.cr_time);
  console.log("------------------------------------*********************");
  console.log("data", data);
  console.log("collectioning ------------------------------------");
  return new Promise(async (resolve, reject) => {
    await MongoDB.collection("bank_transaction")
      .insertOne({
        agent_id: ObjectId(agent_id),
        bank_id: ObjectId(bank_id),
        account_id: ObjectId(account_id),
        date: data.cr_date,
        time: data.cr_time,
        msg: data.word,
        amount: Number(data.amount),
        channel: data.channel,
        type: data.slip_type,
        from_account_number: data.from_acc,
        from_account_name: data.from_acc_name,
        from_bank_id: data.from_bank_id,
        to_account_number: data.to_acc,
        to_account_name: data.to_acc_name,
        to_bank_id: data.to_bank_id,
        status: "pending",
        cr_by: "robot",
        cr_date: new Date(moment().format()),
        cr_prog: "47100 API Robot",
        upd_by: null,
        upd_date: null,
        upd_prog: null,
      },{ordered:false})
      .then((result) => resolve(result))
      .catch(error=>{
        if(error.code === 11000){
        console.log('dup transaction')
        resolve(error)
        }else{
        reject(error)
        }
        });
  });
};

module.exports.update_data_wd = (_id) => {
  return new Promise(async (resolve, reject) => {
    await MongoDB.collection("")
      .updateOne({ _id: ObjectId(_id) }, { $set: {} }, { upsert: true })
      .then((result) => resolve(result))
      .catch((err) => reject(err));
  });
};

module.exports.updatebalance = (_id, balance) => {
  return new Promise(async (resolve, reject) => {
    await MongoDB.collection("agent_bank_account")
      .updateOne(
        { _id: ObjectId(_id) },
        {
          $set: {
            balance: Double(balance),
            upd_by: "robot",
            upd_date: new Date(moment().format),
            upd_prod: "robot",
          },
        },
        { upsert: true }
      )
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
};

module.exports.update_member_name = (_id, new_account_name, description) => {
  return new Promise(async (resolve, reject) => {
    await MongoDB.collection("memb_bank_account")
      .updateOne(
        { _id: ObjectId(_id) },
        {
          $set: {
            account_name: new_account_name,
            description: description,
            upd_by: "robot",
            upd_date: new Date(moment().format()),
            upd_prog: "robot",
          },
        },
        { upsert: true }
      )
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
};

module.exports.get_member_name = (agent_id, memb_id) => {
  return new Promise(async (resolve, reject) => {
    await MongoDB.collection("memb_bank_account")
      .aggregate([
        {
          $match: {
            $and: [
              { agent_id: ObjectId(agent_id) },
              { memb_id: ObjectId(memb_id) },
            ],
          },
        },
        {
          $project: {
            id: 1,
            account_name: "$account_name",
            description: "$description",
          },
        },
      ])
      .toArray()
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
};

module.exports.update_status_wd = (_id, status, description) => {
  return new Promise(async (resolve, reject) => {
    await MongoDB.collection("withdraw")
      .updateOne(
        { _id: ObjectId(_id) },
        {
          $set: {
            status: status,
            description: description,
            upd_by: "robot",
            upd_date: new Date(moment().format()),
            upd_prog: "robot",
          },
        },
        // { upsert: true }
      )
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
};

module.exports.update_err_msg_wd = (_id, err_msg, err_img) => {
  return new Promise(async (resolve, reject) => {
    await MongoDB.collection("withdraw")
      .updateOne(
        { _id: ObjectId(_id) },
        {
          $set: {
            // status: status,
            // description: description,
            err_msg: err_msg,
            err_img: err_img,
            upd_by: "robot",
            upd_date: new Date(moment().format()),
            upd_prog: "robot",
          },
        },
        { upsert: true }
      )
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
};

module.exports.update_doc_wd = (_id, silp_date, silp_image) => {
  return new Promise(async (resolve, reject) => {
    await MongoDB.collection("withdraw")
      .updateOne(
        { _id: ObjectId(_id) },
        {
          $set: {
            status: "success",
            silp_date: new Date(moment(silp_date).format()),
            silp_image: silp_image,
            upd_by: "robot",
            upd_date: new Date(moment().format()),
            upd_prog: "robot",
          },
        },
        { upsert: true }
      )
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
};

module.exports.get_job_doc_wd = (agent_id, robot_accountid) => {
  return new Promise(async (resolve, reject) => {
    await MongoDB.collection("withdraw")
      .aggregate([
        {
          $match: {
            $and: [
              { status: "approve" },
              { agent_id: ObjectId(agent_id) },
              { from_account_id: ObjectId(robot_accountid) },
              
            ],
          },
        },
        {
          $project: {
              _id: 1,
              agent_id: "$agent_id",
              description: "$description",
              from_bank_id: "$from_bank_id",
              from_account_id: "$from_account_id",
              memb_id: "$memb_id",
              memb_bank_id: "$to_bank_id",
              memb_bank_account_id: "$to_account_id",
              amount: "$amount",
          },
      },
      {
          $lookup: {
              from: "bank",
              localField: "memb_bank_id",
              foreignField: "_id",
              as: "bank_memb",
          },
      },
      {
          $unwind: { path: "$bank_memb" },
      },
      {
          $project: {
              _id: 1,
              agent_id: "$agent_id",
              description: "$description",
              from_bank_id: "$from_bank_id",
              from_account_id: "$from_account_id",
              memb_id: "$memb_id",
              memb_bank_id: "$memb_bank_id",
              memb_bank_nameen: "$bank_memb.nameen",
              memb_bank_account_id: "$memb_bank_account_id",
              amount: "$amount",
          },
      },
      {
          $lookup: {
              from: "memb_bank_account",
              localField: "memb_bank_account_id",
              foreignField: "_id",
              as: "memb_account",
          },
      },
      {
          $unwind: { path: "$memb_account" },
      },
      {
          $project: {
              _id: 1,
              agent_id: "$agent_id",
              description: "$description",
              from_bank_id: "$from_bank_id",
              from_account_id: "$from_account_id",
              memb_id: "$memb_id",
              memb_bank_id: "$memb_bank_id",
              memb_bank_nameen: "$memb_bank_nameen",
              memb_bank_account_id: "$memb_bank_account_id",
              memb_bank_account_number: "$memb_account.account_number",
              memb_bank_account_name: "$memb_account.account_name",
              amount: "$amount",
          },
      },
      ])
      .toArray()
      .then((result) => resolve(result))
      .catch((error) => reject(error));
  });
};
