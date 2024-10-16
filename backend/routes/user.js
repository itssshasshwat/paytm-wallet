const express = require("express");

const zod = require("zod");
const { User } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const  { authMiddleware } = require("../middleware");


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


//route to update user information

const updateBody = zod.object({
	password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
})

router.put("/", authMiddleware, async (req, res) => {
    const { success } = updateBody.safeParse(req.body)
    if (!success) {
        res.status(411).json({
            message: "Error while updating information"
        })
    }

		await User.updateOne({ _id: req.userId }, req.body);
	
    res.json({
        message: "Updated successfully"
    })
})


//route to get users from backend according to firstName and lastName

router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})

module.exports =  router;