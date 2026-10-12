import User from '../models/userModel.js'
import validator from 'validator'
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken";

const JWT_SECRET=process.env.JWT_SECRET; // ye secret key
// console.log("JWT_SECRET:", JWT_SECRET); 
const TOKEN_EXPIRY="24h"; // ye token ki expiry time

const createToken=(userId)=>
    jwt.sign({id:userId},JWT_SECRET,{expiresIn:TOKEN_EXPIRY}) // ye function token create krne k liye


//REGISTER USER
export async function registerUser(req,res){
 const {name,email, password}=req.body;
 if(!name || !email || !password){
    return res.status(400).json({
        success:false,
        message:"All fields are required."
    })
 }
 if(!validator.isEmail(email)){ // agr valid email nhi h to ye error dega
    return res.status(400).json({
        success:false,
        message:"Please enter a valid email."
    })
 }
 if(password.length<8){ // agr password 8 se chota h to ye error dega
    return res.status(400).json({
        success:false,
        message:"Password must be atleast 8 characters long."
    })
 }
 try{
   if(await User.findOne({email})){ // agr email already exist krta h to ye error dega
    return res.status(409).json({
        success:false,
        message:"User already exists."
    })
   }

   const hashed= await bcrypt.hash(password,10); // password ko hash krne k liye
   const user=await User.create({name,email,password:hashed}); // user ko create krne k liye
   const token=createToken(user._id); // token create krne k liye
   res.status(201).json({
    success:true,
    message:"User registered successfully.",
    token,
    user:{
        id:user._id,
        name:user.name,
        email:user.email
    } // ye user ki details return krta h
   })
 }
catch(err){
   console.error(err);
  res.status(500).json({
    success:false,
    message:"Server error."
  }) 
 }

}

// TO LOGIN USER
export async function loginUser(req,res){
    const{email,password}=req.body;
    if(!email || !password){
        return res.status(400).json({
            success:false,
            message:"All fields are required."
        })
    }

    try{
       const user=await User.findOne({email});
       if(!user){
        return res.status(401).json({
            success:false,
            message:"Invalid email or password"
        })
       } 
       const match= await bcrypt.compare(password, user.password);
       if(!match){
        return res.status(401).json({
            success:false,
            message:"Invalid email or password"
        })
       }
       const token= createToken(user._id); // token create krne k liye
        res.json({
            success:true,
            message:"User logged in successfully.",
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email
            }
        }) 
    }
   catch(err){
   console.error(err);
  res.status(500).json({
    success:false,
    message:"Server error."
  }) 
 }
}

 // TO GET USER DETAILS
 export async function getCurrentUser(req, res){
    try{
     const user=await User.findById(req.user.id).select("name email"); // it selects name and email of the user and returns it
      
     if(!user){
       return res.status(404).json({
            success:false,
            message:"User not found."
        });
     }


     res.json({
        success:true,
        user, // ye user ki details return krta h
     })
    }
    catch(err){
   console.error(err);
  res.status(500).json({
    success:false,
    message:"Server error."
  }) 
 }
 }

// TO UPDATE USER PROFILE
export async function updateProfile(req,res){
    const {name,email}=req.body;
    if(!name || !email ||!validator.isEmail(email)){
       return res.status(404).json({
        success:false,
        message:"Valid email and name are required."
       })
    }
    try{
    const exist= await User.findOne({email, _id:{$ne:req.user.id}}); // Kya koi doosra user isi email ko already use kar raha hai?
      if(exist){
        return res.status(409).json({
            success:false,
            message:"Email already in use."
        })
      }

      const user= await User.findByIdAndUpdate( // ye Currently logged-in user ko find karke, uska name/email update kr, validation lagao, aur updated user ka sirf name aur email return karta hai
        req.user.id,
        {name,email},
        {new:true, runValidators:true, select:"name email"}
      );

      res.json({
        success:true,
        user,
      });

    }
   catch(err){
     console.error(err);
     res.status(500).json({
      success:false,
      message:"Server error."
    }) 
  }
}

//TO CHANGE USER PASSWORD
export async function updatePassword(req,res){
    const {currentPassword, newPassword}=req.body;
    if(!currentPassword || !newPassword ||newPassword.length<8){
        return res.status(400).json({
            success:false,
            message:"Current and new password are required. New password must be atleast 8 characters long."
        })
    }

    try{
        const user=await User.findById(req.user.id).select("password"); // ye currently logged-in user ko find krta h aur uska password select krta h
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found."
            })
        }
        const match=await bcrypt.compare(currentPassword, user.password); // ye current password aur database mein stored password ko compare krta h
        if(!match){
            return res.status(401).json({
                success:false,
                message:"Current password is incorrect."
            })
        }

        user.password=await bcrypt.hash(newPassword,10); // ye new password ko hash krta h
        await user.save(); // ye user ko save krta h
        res.json({
            success:true,
            message:"Password updated successfully."
        })


    }
    catch(err){
     console.error(err);
     res.status(500).json({
      success:false,
      message:"Server error."
    }) 
  }

}

