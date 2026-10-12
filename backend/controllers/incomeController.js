import incomeModel from "../models/incomeModel.js";
import XLSX from 'xlsx';
import getDateRange from "../utils/dataFilter.js";


//add income
export async function addIncome(req,res){
    const userId=req.user._id;
    const{description, amount, category,date}=req.body;

    try{
        if(!description || !amount || !category || !date){
            return res.status(400).json({
                success:false,
                message:"All fields are required."
            })
        }

        const newIncome=new incomeModel({
            userId,
            description,
            amount,
            category,
            date
        })
        await newIncome.save();

        res.json({
            success:true,
            message:"Income added successfully."
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

//TO GET ALL INCOME
export async function getAllIncome(req,res){
    const userId=req.user._id;
    try{
     const income = await incomeModel
        .find({ userId})
        .sort({date:-1})
     res.json(income);
    }
    catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Server error."
        })
    }
}

// UPDATE AN INCOME
export async function updateIncome(req, res){
    const {id}=req.params; // ye id income ka h jo update krna h
    const userId=req.user._id; // ye user ka id h jo income ko update kr rha h
    const {description, amount, category, date}=req.body; // ye income ka data h jo update krna h
    try{
        const updatedIncome=await incomeModel.findOneAndUpdate({
            _id:id,  
            userId:userId // ye ensure krta h ki sirf wahi user apni income ko update kr skta h jo usko create kiya h
        },
        {
            description,
            amount,},
            {new:true} // ye ensure krta h ki updated income ko return krna h
    );
     if(!updatedIncome){
        return res.status(404).json({
            success:false,
            message:"Income not found or user not authorized."
        })
     }

     res.json({
        success:true,
        message:"Income updated successfully.",
        data:updatedIncome
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


//TO DELETE AN INCOME
export async function deleteIncome(req,res){
    const {id}=req.params; // ye id income ka h jo delete krna h
    try{
        const income =await incomeModel.findByIdAndDelete({_id:id})
        if(!income){
            return res.status(404).json({
                success:false,
                message:"Income not found"
            });
        }

        return res.json({
            success:true,
            message:"Income deleted successfully"
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

  //TO DOWNLOAD THE EXCEL SHEET 
export async function downloadIncomeExcel(req, res) {
    const userId=req.user._id;
    try{
      const income = await incomeModel.find({userId}).sort({date:-1})
      const plainData = income.map((inc)=>({
        Description:inc.description,
        Amount:inc.amount,
        Category:inc.category,
        DAte : new Date(inc.date).toLocaleDateString(),
      }));

      const worksheet = XLSX.utils.json_to_sheet(plainData);
      const workbook=XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "incomeModel");
      XLSX.writeFile(workbook, "income_details.xlsx");
      res.download("income_details.xlsx")

    }
    catch(error){
        console.log(error);
        res.status(500).json({
            success:false, 
            message:"Server error."
        })
    }
}


// TO GET INCOME OVERVIEW

export async function getIncomeOverview(req, res){
     try{
        const userId=req.user._id;
        const{range="monthly"}=req.query;
        const {start, end}=getDateRange(range);

        const incomes=await incomeModel.find({
            userId,
            date:{$gte:start,
                $lte:end
            },
        }).sort({date: -1})

        const totalIncome = incomes.reduce((acc, cur) => acc + cur.amount, 0);
        const averageIncome = incomes.length > 0 ? totalIncome / incomes.length : 0;
        const numberOfTransactions = incomes.length;

        const recentTransactions = incomes.slice(0, 9);

        res.json({
            success:true,
            data:{
                totalIncome,
                averageIncome,
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





