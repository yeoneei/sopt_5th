var express = require('express');
var router = express.Router();
var pool = require('../../config/dbConfig');
const crypto = require('crypto-promise');
const statusCode = require('../../modules/statusCode');
const resMessage = require('../../modules/responseMessage');
const util = require('../../modules/utils');
const upload = require('../../config/multer');
const moment = require('moment');
/* GET home page. */

router.get('/',async(req,res)=>{
    let getAllRegisterQuery = 'SELECT * FROM 4th.register';
    let getAllRegisterResult;
    try{
        var connection = await pool.getConnection();
        getAllRegisterResult = await connection.query(getAllRegisterQuery);
    }catch(err){
        console.log(err);
        connection.rollback(()=>{});
        res.status(200).send(util.successFalse(statusCode.DB_ERROR,resMessage.POST_READ_FAILE));
    }finally{
        let resData = new Array();
        for(let i= getAllRegisterResult.length-1; i>=0;i--){
            resData.push(getAllRegisterResult[i]);
        }
        pool.releaseConnection(connection);
        res.status(200).send(util.successTrue(statusCode.OK,resMessage.POST_READ_SUCCESS,resData));
    }
});

router.get('/:idx',async(req,res)=>{
    let {idx} = req.params;
    let getRegisterResult;
    try{
        var connection = await pool.getConnection();
        await connection.beginTransaction();

        let getRegisterQuery = 'SELECT * FROM 4th.register WHERE idx= ?';
        let getRegisterResult = await connection.query(getRegisterQuery,[idx]);
        let time = getRegisterResult[0].time;
        let title = getRegisterResult[0].title;
        console.log(time)
        await connection.commit();

        let getPostQeury = 'SELECT * FROM 4th.post WHERE postIdx=?';
        getRegisterResult = await connection.query(getPostQeury,[idx]);
        console.log(getRegisterResult);
        await connection.commit();
        var resData = {
            title: title,
            time : time,
            content : getRegisterResult,
        }
        
    }catch(err){
        console.log(err);
        connection.rollback(()=>{});
        res.status(200).send(util.successFalse(statusCode.DB_ERROR,resMessage.POST_READ_FAILE));
    }finally{
        pool.releaseConnection(connection);
        res.status(200).send(util.successTrue(statusCode.OK,resMessage.POST_READ_SUCCESS,resData));
    }

});

router.post('/', upload.fields([{name:'thumb'},{name:'imgs'}]) , async(req,res)=>{
    const {title, name, contents} = req.body;
    const {thumb, imgs} = req.files;

    let time = moment().format('YYYY-MM-DD HH:mm:ss');

    let insertRegisterQuery = 'INSERT INTO 4th.register (title,name,thumbnail,time) VALUE (?,?,?,?)';
    let insertRegisterResult;
    
    try{
        var connection = await pool.getConnection();
        await connection.beginTransaction();
        
        insertRegisterResult = await connection.query(insertRegisterQuery,[title,name,thumb[0].location,time]);
        await connection.commit();
        
        const postIdx = insertRegisterResult.insertId;
        let insertPostQuery = 'INSERT INTO 4th.post (postIdx, photo,content) VALUE (?,?,?)';
        let insertPostResult;
        for(idx in imgs){
            insertPostResult = await connection.query(insertPostQuery,[postIdx, imgs[idx].location,contents[idx]]);
            await connection.commit();
        }
    }catch(err){
        console.log(err);
        connection.rollback(()=>{});
        res.status(200).send(util.successFalse(statusCode.DB_ERROR,resMessage.POST_SAVE_FAILE));
    }finally{
        pool.releaseConnection(connection);
        res.status(200).send(util.successTrue(statusCode.OK,resMessage.POST_CONTENTS_SAVE_SUCCESS));
    }

});




module.exports = router;
