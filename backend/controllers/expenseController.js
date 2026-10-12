import expenseModel from "../models/expenseModel.js";
import getDateRange from "../utils/dataFilter.js";
import XLSX from 'xlsx';


// ADD EXPENSE
export async function addExpense(req, res){
     const userId=req.user._id;
     const{description, amount, category,date}=req.body;
 
     try{
         if(!description || !amount || !category || !date){
             return res.status(400).json({
                 success:false,
                 message:"All fields are required."
             })
         }
 
          const newExpense=new expenseModel({
             userId,
             description,
             amount,
             category,
             date
         })
         await newExpense.save();
 
         res.json({
             success:true,
             message:"Expense added successfully."
         })
 
     }
     catch(error){
         console.log(error);
         res.status(500).json({
             success:false,
             message:"Server error."
         })
     } 
}


// GET ALL EXPENSE
export async function getAllExpense(req, res){
    const userId=req.user._id;
    try{
     const expense = await expenseModel
        .find({ userId})
        .sort({date:-1})
     res.json(expense);
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Server error."
        })
    }
}


// TO UPDATE AN EXPENSE
export async function updateExpense(req, res){
    const {id}=req.params; // ye id expense ka h jo update krna h
    const userId=req.user._id; // ye user ka id h jo expense ko update kr rha h
    const {description, amount, category, date}=req.body; // ye expense ka data h jo update krna h
    try{
        const updatedExpense =await expenseModel.findOneAndUpdate({
            _id:id,  
            userId:userId // ye ensure krta h ki sirf wahi user apni expense ko update kr skta h jo usko create kiya h
        },
        {
            description,
            amount,},
            {new:true} // ye ensure krta h ki updated expense ko return krna h
    );
     if(!updatedExpense){
        return res.status(404).json({
            success:false,
            message:"Expense not found or user not authorized."
        })
     }

     res.json({
        success:true,
        message:"Expense updated successfully.",
        data:updatedExpense
     })

    }
    catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Server error."
        })
    }    
}


// TO DELETE  AN EXPENSE
export async function deleteExpense(req,res){
    const {id}=req.params; // ye id expense ka h jo delete krna h
    try{
        const expense =await expenseModel.findByIdAndDelete({_id:id})
        if(!expense){
            return res.status(404).json({
                success:false,
                message:"Expense not found"
            });
        }

        return res.json({
            success:true,
            message:"Expense deleted successfully"
        })
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            success:false, 
            message:"Server error."
        })
    }
}


// DOWNLOAD THE EXCEL FOR EXPENSE

export async function downloadExpenseExcel(req, res) {
    const userId=req.user._id;
    try{
      const expense = await expenseModel.find({userId}).sort({date:-1})
      const plainData = expense.map((exp)=>({
        Description:exp.description,
        Amount:exp.amount,
        Category:exp.category,
        DAte : new Date(exp.date).toLocaleDateString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(plainData);
      const workbook=XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "expenseModel");
      XLSX.writeFile(workbook, "expense_details.xlsx");
      res.download("expense_details.xlsx")

    }
    catch(error){
        console.log(error);
        res.status(500).json({
            success:false, 
            message:"Server error."
        })
    }
}

// OVERVIEW OF EXPENSE


export async function getExpenseOverview(req, res){
     try{
        const userId=req.user._id;
        const{range="monthly"}=req.query;
        const {start, end}=getDateRange(range);

        const expense=await expenseModel.find({
            userId,
            date:{$gte:start,
                $lte:end
            },
        }).sort({date: -1})

       
  
    const totalExpense = expense.reduce((acc, cur) => acc + cur.amount, 0);
    const averageExpense = expense.length > 0 ? totalExpense / expense.length : 0;
    const numberOfTransactions = expense.length;
    const recentTransactions=expense.slice(0,5);

        res.json({
            success:true,
            data:{
                totalExpense,
                averageExpense,
                numberOfTransactions,
                recentTransactions,
                range
            }
        })

     }
      catch(error){
        console.log(error);
        res.status(500).json({
            success:false, 
            message:"Server error."
        })
    }
}