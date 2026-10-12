import {Routes, Route, Navigate, useNavigate, useLocation} from "react-router-dom"
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Login from './components/Login.jsx'
import { children, useEffect, useState } from 'react'
import SignUp from './components/SignUp.jsx'
import axios from 'axios'
import Income from './pages/Income.jsx'
import Expense from "./pages/Expense.jsx"
import Profile from "./pages/Profile.jsx"

const API_URL="http://localhost:4000";

// TO GET TRANSCATION from LOCALSTORAGE
const getTransactionFromStorage = () =>{
  const saved =  localStorage.getItem("transactions");
  return saved ? JSON.parse(saved) : []
}

// TO PROTECT THE ROUTES
const ProtectedRoute = ({user, children}) => {
  const localToken = localStorage.getItem("token");
  const sessionToken = sessionStorage.getItem("token");
  const hasToken = localToken || sessionToken;
  if(!user || !hasToken){
    return <Navigate to="/login" replace/>
  }
  return children;
}

//TO SCROLL TO TOP WHEN GETS RELOAD OR NEW PAGE IS VISITED
const ScrollToTop = ()=>{
  const location = useLocation();
  useEffect(()=>{
    window.scrollTo({top:0, left:0, behavior:"auto"})
  }, [location.pathname])
  return null;
}

function App() {
  const [user,setUser] = useState(null);
  const[token, setToken] = useState(null);
  const[transactions, setTransactions] = useState([]);
  const[isLoading, setIsLoading] = useState(true);
  const navigate=useNavigate();

  // to save the token inside the local storage 
    const persistAuth = (userObj, tokenStr, remember = false) => {
    try {
      if (remember) {
        if (userObj) localStorage.setItem("user", JSON.stringify(userObj));
        if (tokenStr) localStorage.setItem("token", tokenStr);
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
      } else {
        if (userObj) sessionStorage.setItem("user", JSON.stringify(userObj));
        if (tokenStr) sessionStorage.setItem("token", tokenStr);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
      setUser(userObj || null);
      setToken(tokenStr || null);
    } catch (err) {
      console.error("persistAuth error:", err);
    }
  };


  const clearAuth = ()=>{
    try{
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    }
    catch(error){
      console.log("ClearAuth error", error);
      
    }
    setUser(null);
    setToken(null);
  }

  // TO  UPDATE USER DATA BOTH IN STATE AND STORAGE

  const updatedUserData = (updatedUser) =>{
    setUser(updatedUser);

    const localToken = localStorage.getItem("token");
    const sessionToken =sessionStorage.getItem("token");

    if(localToken){
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
    else if(sessionToken){
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
    }
  }

  // Try TO LOAD USER WITH TOKEN WHEN MOUNTED
  useEffect(()=>{
    (async ()=> {
      try{
      const localUserRaw = localStorage.getItem("user");
      const sessionUserRaw = sessionStorage.getItem("user");
      const localToken = localStorage.getItem("token");
      const sessionToken = sessionStorage.getItem("token");

      const storedUser = localUserRaw ? JSON.parse(localUserRaw) : sessionUserRaw ?
         JSON.parse(sessionUserRaw) : null

      const storedToken =localToken || sessionToken || null
      const tokenFromLocal = !!localToken;

      if(storedUser){
        setUser(storedUser)
        setToken(storedToken);
        setIsLoading(false)
        return;
      }

      if(storedToken){
        try{
        const res= await axios.get(`${API_URL}/api/user/me`, {
          headers : {Authorization: `Bearer ${storedToken}`}
        });
        const profile = res.data
        persistAuth(profile, storedToken, tokenFromLocal)
        }
        catch(fetchErr){
          console.warn("Could not fetch profile with the stored token", fetchErr);
          clearAuth();
        }
      }
      }

      catch(err){
          console.error("error bootstrapping auth:", err);
      }
      finally{
        setIsLoading(false)

        try{
          setTransactions(getTransactionFromStorage())
        }catch(txErr){
           console.error("Error loading transactions:", txErr);
        }
      }
    }) ()
  }, [])

  useEffect(()=>{
    try{
    localStorage.setItem("transactions", JSON.stringify(transactions))
    }catch(err){
    console.error("Error saving transaction", err);
    }
  },[transactions])
  
  const handleLogin=(userData, remember=false, tokenFromApi=null)=>{
    persistAuth(userData,tokenFromApi,remember);
    navigate("/");
  }

   const handleSignup = (userData, remember=false, tokenFromApi=null)=>{
    persistAuth(userData,tokenFromApi,remember);
    navigate("/");
  }

  const handleLogout = ()=>{
    clearAuth();
    navigate("/login")
  }
 



 // TRANSACTION helpers
  const addTransaction = (newTransaction) =>
    setTransactions((p) => [newTransaction, ...p]);
  const editTransaction = (id, updatedTransaction) =>
    setTransactions((p) =>
      p.map((t) => (t.id === id ? { ...updatedTransaction, id } : t)),
    );
  const deleteTransaction = (id) =>
    setTransactions((p) => p.filter((t) => t.id !== id));
  const refreshTransactions = () =>
    setTransactions(getTransactionFromStorage());


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  } 



  return (
    <>
    <ScrollToTop/>
     <Routes>
     <Route path="/login" element={<Login onLogin={handleLogin} />} />
     <Route path="/signup" element={<SignUp onSignup={handleSignup} />} />

      <Route element={
       <ProtectedRoute user={user}>
        <Layout user={user}
         onLogout={handleLogout} 
        transactions={transactions}
        editTransaction={editTransaction} 
        addTransaction={addTransaction}
        deleteTransaction={deleteTransaction}
        refreshTransactions={refreshTransactions} />
       </ProtectedRoute>
        }>
      <Route path="/" element={<Dashboard />} 
      transactions={transactions}
      editTransaction={editTransaction} 
      addTransaction={addTransaction}
      deleteTransaction={deleteTransaction}
      refreshTransactions={refreshTransactions} 
      />

       <Route
       path="/income"
       element={
        <Income 
          transactions={transactions}
          editTransaction={editTransaction} 
          addTransaction={addTransaction}
          deleteTransaction={deleteTransaction}
          refreshTransactions={refreshTransactions}
        />
       } />


        <Route
          path="/expense"
          element={
            <Expense 
              transactions={transactions}
              editTransaction={editTransaction} 
              addTransaction={addTransaction}
              deleteTransaction={deleteTransaction}
              refreshTransactions={refreshTransactions}
            />  
       } />

       <Route path="/profile" 
       element={<Profile user={user}
       onUpdateProfile={updatedUserData} 
       onLogout={handleLogout} 
       />
      }
       />
      </Route>

      <Route path="*" 
      element={<Navigate to={user ? "/" : "/login"} replace/> }
        />

     </Routes>
    </>
  )
}

export default App
