import {Link} from "react-router-dom";
import {useContext,useEffect, useState} from "react";
import {UserContext} from "./UserContext";

export default function Header(){
  const {setUserInfo,userInfo} = useContext(UserContext);
 // const [username,setUsername] = useState("");
  useEffect(()=>{
    fetch("http://localhost:4000/api/profile", {
      credentials: "include",
    }).then(response =>{
      response.json().then(userInfo =>{
        setUserInfo(userInfo);
      });
    });
  }, []);

  function logout(){
     /*fetch("http://localhost:4000/api/profile", {
      credentials: "include",*/
    fetch("http://localhost:4000/api/logout", {
      credentials:"include",
      method:"POST",
    });
    setUserInfo(null);
  };
  
  const username = userInfo?.username;
  return(
      <header>
        <Link to="/" className="logo">MyBlog</Link>
          <nav>
          {username &&(
          <>
          <Link to="/create"> create New Post </Link>
          <a onClick={logout}>logout</a>
          </>
          )}
          {!username && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
          )}
          </nav>
      </header>
    );
}