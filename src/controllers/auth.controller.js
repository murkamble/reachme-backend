const Users = require('../models/user.model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const sendMail = require('../utils/sendEmail')

const { CLIENT_URL, ICON_IMAGE } = process.env

const authController = {
    register: async (req, res) => {
        try {
            const { fullname, username, dob, email, password, gender } = req.body
            if (!validateEmail(email)) return res.status(400).json({ msg: "Invalid emails." })
            let newUserName = username.toLowerCase().replace(/ /g, '')
            const user_name = await Users.findOne({ username: newUserName })
            if(user_name) return res.status(400).json({msg: "This user name already exists."})
            const user_email = await Users.findOne({ email })
            if(user_email) return res.status(400).json({ msg: "This email already exists." })
            if(password.length < 6) return res.status(400).json({ msg: "Password must be at least 6 characters." })
            const passwordHash = await bcrypt.hash(password, 12)
            // const newUser = new Users({ fullname, username: newUserName, dob, email, password: passwordHash, gender })

            const newUser = { fullname, username: newUserName, dob, email, password: passwordHash, gender }
            const activation_token = createActivationToken(newUser)
            const url = `${CLIENT_URL}/user/activate/${activation_token}`
            const txt = 'Confirm verification your email address'
            const emaillMessageButtonName = 'Verify your email'
            const message = `
                <div style=" color: #323232; " >
                    <div style=" max-width: 600px; margin:auto; font-size: 110%; background: #eaeaea87; padding: 10px; ">
                        <div style=" text-align: center; ">
                            <img style=" width: 64px; height: 64px; margin: 10px 0 20px 0; " src=${ICON_IMAGE} />
                        </div>
                        <div style=" padding: 40px; background: #fff; border-radius: 10px; ">
                            <h2 style="text-align: center; ">Welcome to ReachMe.</h2>
                            <p>Congratulations! You're almost set to start using ReachMe Application.
                                Just click the button below to validate your email address.
                            </p>
                            <div style=" text-align: center; ">
                                <a href=${url} style="background: #2196f3; border-radius: 4px; text-decoration: none; color: rgb(255, 255, 255); padding: 10px 30px; display: inline-block;">${emaillMessageButtonName}</a>
                            </div>
                            <p>If the button doesn't work for any reason, you can also click on the link below:</p>
                            <div>${url}</div>
                            <p>Note: You must perform this validation within the next 24 hours to keep your new account enabled.</p>
                        </div>
                        <div style=" color: rgb(165, 164, 164); text-align: left; margin: 20px auto; " >
                            <p style=" font-size: 12px; margin: 10px 20px; " >ReachMe is the social media platform for rapid scaling of multi-platform applications.</p>
                            <p style=" font-size: 12px; margin: 10px 20px; " >If you encounter any problem, please contact us at cse.mkamble@gmail.com .</p>
                        </div>
                    </div>
                </div>
            `
            sendMail({ to: email, subject: txt, text: message })
            res.json({ msg: "Register Success! Please activate your email to start." })
            
            // const access_token = createAccessToken({id: newUser._id})
            // const refresh_token = createRefreshToken({id: newUser._id})

            // res.cookie('refreshtoken', refresh_token, {
            //     httpOnly: true,
            //     path: '/api/auth/refresh_token',
            //     maxAge: 30*24*60*60*1000 // 30days
            // })

            // await newUser.save()

            // res.json({
            //     msg: 'Register Success!',
            //     access_token,
            //     user: {
            //         ...newUser._doc,
            //         password: ''
            //     }
            // })
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    activateEmail: async (req, res) => {
        try {
            const { activation_token } = req.body
            const user = jwt.verify(activation_token, process.env.ACTIVATION_TOKEN_SECRET)
            const { fullname, username, dob, email, password, gender } = user
            const newUser = new Users({ fullname, username, dob, email, password, gender })
            await newUser.save()
            const url = `${CLIENT_URL}/`
            const txt = 'Verified email'
            const emaillMessageButtonName = 'CONTINUE'
            const message = `
                <div style=" color: #323232; " >
                    <div style=" max-width: 600px; margin:auto; font-size: 110%; text-align: center; background: #eaeaea87; padding: 10px; ">
                        <div style=" text-align: center; ">
                            <img style=" width: 64px; height: 64px; margin: 10px 0 20px 0; " src=${ICON_IMAGE} />
                        </div>
                        <div style=" text-align: center; padding: 40px; background: #fff; border-radius: 10px; ">
                            <img style=" width: 100px; height: 100px; margin: auto; " src="https://res.cloudinary.com/mayurkamble/image/upload/v1625314150/icon/green_check_mark_icon_flat_yzusy1.png" />
                            <h2 style=" margin: 0; ">Thank you</h2>
                            <p style=" color: rgb(165, 164, 164); margin: 5px; " >You have verified your email</p>
                            <a href=${url} style="background: #2196f3; border-radius: 4px; text-decoration: none; color: rgb(255, 255, 255); padding: 10px 30px; display: inline-block;">${emaillMessageButtonName}</a>
                        </div>
                    </div>
                </div>
            `
            sendMail({ to: email, subject: txt, text: message })
            res.json({ msg: "Account has been activated!" })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    login: async (req, res) => {
        try {
            const { email, password } = req.body
            const user = await Users.findOne({ email })
            .populate("followers following", "avatar username fullname followers following")
            if(!user) return res.status(400).json({ msg: "This email does not exist." })
            const isMatch = await bcrypt.compare(password, user.password)
            if(!isMatch) return res.status(400).json({ msg: "Password is incorrect." })

            const access_token = createAccessToken({ id: user._id })
            const refresh_token = createRefreshToken({ id: user._id })

            res.cookie('refreshtoken', refresh_token, {
                httpOnly: true,
                path: '/api/auth/refresh_token',
                maxAge: 30*24*60*60*1000 // 30days
            })

            res.json({
                msg: 'Login Success!',
                access_token,
                user: {
                    ...user._doc,
                    password: ''
                }
            })
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    getUserInfor: async (req, res) => {
        try {
            const user = await Users.findById(req.user.id).select('-password')
            res.json(user)
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body
            const user = await Users.findOne({ email })
            if (!user) return res.status(400).json({ msg: "This email does not exist." })
            const access_token = createAccessToken({ id: user._id, email })
            const url = `${CLIENT_URL}/user/reset/${access_token}`
            // sendMail(email, url, "Reset your password")
            const txt = 'Reset your password'
            const emaillMessageButtonName = 'Reset your password'
            const message = `
                <div style=" color: #323232; " >
                    <div style=" max-width: 600px; margin:auto; font-size: 110%; background: #eaeaea87; padding: 10px; ">
                        <div style=" text-align: center; ">
                            <img style=" width: 64px; height: 64px; margin: 10px 0 20px 0; " src=${ICON_IMAGE} />
                        </div>
                        <div style=" padding: 40px; background: #fff; border-radius: 10px; ">
                            <h2 style="text-align: center; ">Reset your password</h2>
                            <p>Someone (hopefully you) has requested a password reset for your ReachMe account.
                                Just click the button below to set a new password:
                            </p>
                            <div style=" text-align: center; ">
                                <a href=${url} style="background: #2196f3; border-radius: 4px; text-decoration: none; color: rgb(255, 255, 255); padding: 10px 30px; display: inline-block;">${emaillMessageButtonName}</a>
                            </div>
                            <p>If the button doesn't work for any reason, you can also click on the link below:</p>
                            <div>${url}</div>
                            <p>If you don't wish to reset your password, disregard this email and no action will be taken.</p>
                            <p style=" margin: 30px auto 4px auto; " >The ReachMe Team</p>
                            <div>${CLIENT_URL}</div>
                        </div>
                        <div style=" color: rgb(165, 164, 164); text-align: left; margin: 20px auto; " >
                            <p style=" font-size: 12px; margin: 10px 20px; " >ReachMe is the social media platform for rapid scaling of multi-platform applications.</p>
                            <p style=" font-size: 12px; margin: 10px 20px; " >If you encounter any problem, please contact us at cse.mkamble@gmail.com .</p>
                        </div>
                    </div>
                </div>
            `
            sendMail({ to: email, subject: txt, text: message })
            res.json({ msg: "Re-send the password, please check your email." })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    resetPassword: async (req, res) => {
        try {
            const { password } = req.body
            // console.log(req.user)
            const passwordHash = await bcrypt.hash(password, 12)

            await Users.findOneAndUpdate({ _id: req.user.id }, {
                password: passwordHash
            })
            
            const url = `${CLIENT_URL}/`
            const txt = 'Password successfully changed'
            const emaillMessageButtonName = 'CONTINUE'
            const message = `
                <div style=" color: #323232; " >
                    <div style=" max-width: 600px; margin:auto; font-size: 110%; text-align: center; background: #eaeaea87; padding: 10px; ">
                        <div style=" text-align: center; ">
                            <img style=" width: 64px; height: 64px; margin: 10px 0 20px 0; " src=${ICON_IMAGE} />
                        </div>
                        <div style=" text-align: center; padding: 40px; background: #fff; border-radius: 10px; ">
                            <img style=" width: 100px; height: 100px; margin: auto; " src="https://res.cloudinary.com/mayurkamble/image/upload/v1625314150/icon/green_check_mark_icon_flat_yzusy1.png" />
                            <h2 style=" margin: 0; ">Password Successfully Changed</h2>
                            <p style=" color: rgb(165, 164, 164); margin: 5px; " >You have successfully changed your password</p>
                            <a href=${url} style="background: #2196f3; border-radius: 4px; text-decoration: none; color: rgb(255, 255, 255); padding: 10px 30px; display: inline-block;">${emaillMessageButtonName}</a>
                        </div>
                    </div>
                </div>
            `
            sendMail({ to: req.user.email, subject: txt, text: message })

            res.json({ msg: "Password successfully changed!" })
        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    },
    logout: async (req, res) => {
        try {
            res.clearCookie('refreshtoken', {path: '/api/auth/refresh_token'})
            return res.json({msg: "Logged out!"})
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    },
    generateAccessToken: async (req, res) => {
        try {
            const rf_token = req.cookies.refreshtoken
            if(!rf_token) return res.status(400).json({msg: "Please login now."})

            jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, async(err, result) => {
                if(err) return res.status(400).json({msg: "Please login now."})

                const user = await Users.findById(result.id).select("-password")
                .populate('followers following', 'avatar username fullname followers following')

                if(!user) return res.status(400).json({msg: "This does not exist."})

                const access_token = createAccessToken({id: result.id})

                res.json({
                    access_token
                })
            })
            
        } catch (err) {
            return res.status(500).json({msg: err.message})
        }
    }
}

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

const createActivationToken = (payload) => {
    return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, { expiresIn: '5m' })
}

const createAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
}

const createRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' })
}

module.exports = authController