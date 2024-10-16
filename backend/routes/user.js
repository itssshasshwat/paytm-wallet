const express = require("express");

const zod = require("zod");
const { User } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");


const router = express.Router();


// the signup route

const signupBody = zod.object({
    username: zod.string().email(),
    lastName: zod.string(),
    firstName: zod.string(),
    password: zod.string()
})

router.post("/signup",async(req,res) => {
    const body = req.body;
    const {success} = signupBody.safeParse(body)
    if(!success){
        return res.status(411).json({
            message : "email already in use / incorrect inputs"
        })
    }

    const existingUser = await User.findOne({
        username : req.body.usernmame
    })
    if(existingUser){
        return res.status(411).json({
            message : "email already in use / incorrect inputs"
        })
    }

    const user = await User.create({
        username : req.body.username,
        firstName : req.body.firstName,
        lastName : req.body.lastName,
        password : req.body.password,
    })
    const userid = user._id;

    const token = jwt.sign({
        userId
    },JWT_SECRET);

    req.json({
        message : "User created successfully",
        token : token
    })
})


//the signin route

const signinBody = zod.object({
    username : zod.string().email(),
    password : zod.string()
})

router.post("/signin" , async(req,res) => {
    const {success} = signinBody.safeParse(req.body)
    if(!success){
        return res.status(411).json({
            message : "incorrect input"
        })
    }

    const user = await User.findOne({
        username : req.body.username,
        password :  req.body.password
    });

    if(user){
        const token = jwt.sign({
            userId : user._id
    },JWT_SECRET);

   res.json({
    token: token
   });
   return;
    }


    res.status(411).json({
        message : "Error while logging in"
    })
})

module.exports =  router;