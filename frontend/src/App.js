import Post from "./Post.js";
import Header from "./Header.js";
import Layout from "./Layout.js";
//import UserContext from "./UserContext.js";
import IndexPage from "./pages/IndexPage.js";
import LoginPage from "./pages/LoginPage.js";
import RegisterPage from "./pages/RegisterPage.js";
import CreatePost from "./CreatePost.js";
import {Routes, Route} from "react-router-dom";
import {UserContextProvider} from "./UserContext.js"
import './App.css';

function App() {
  return (
    <UserContextProvider>
      <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<IndexPage /> } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/create" element={<CreatePost />} />
      </Route>
    </Routes>
    </UserContextProvider>
    
  );
}

export default App;
