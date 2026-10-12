import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
   description:{
        type: String,
        required: true
    },
    amount:{
        type:Number,
        required:true
    },
    category:{
        type:String,
        required:true 
    },
    date:{
        type:Date,
        required:true
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    }, // for a particular user creating income, we need to know which user is creating it, so we are storing the userId in the income model
    type:{
        type:String,
        default:"expense"
    }, 
},
{

timestamps:true

})

const expenseModel = mongoose.models.expense || mongoose.model("expense", expenseSchema);
export default expenseModel;
