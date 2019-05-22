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

});

router.get('/:idx',async(req,res)=>{

});

router.post('/', upload.fields([{name:'thumb'},{name:'imgs'}]) , async(req,res)=>{
    const {title, name, contents} = req.body;
    const {thumb, imgs} = req.files;
    console.log(thumb[0].location);
    for(x in imgs){
        console.log(imgs[x].location);
    }
    for(x in contents){
        console.log(contents[x]);
    }
    let time = moment().format('YYYY-MM-DD HH:mm:ss');

    let insertRegisterQuery = 'INSERT INTO sopt.register (title,name,thumbnail,time) VALUE (?,?,?,?)';
    let insertRegisterResult;
    try{
        var connection = await pool.getConnection();
        await connection.beginTransaction();
        
        insertRegisterResult = await connection.query(insertRegisterQuery,[title,name,thumb[0].location,time]);
        console.log(insertRegisterResult);
        await connection.commit();
        
        const postIdx = insertRegisterResult.insertId;
        console.log(postIdx);
        let insertPostQuery = 'INSERT INTO sopt.post (postIdx, photo,content) VALUE (?,?,?)';
        let insertPostResult;
        for(idx in imgs){
            insertPostResult = await connection.query(insertPostQuery,[postIdx, imgs[idx].location,contents[idx]]);
            console.log(insertPostResult)
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
