import {Link} from "react-router-dom";
import {useContext, useEffect} from "react";
import {UserContext} from "./UserContext";

export default function Header(){
  const {setUserInfo, userInfo} = useContext(UserContext);

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
    fetch("http://localhost:4000/api/logout", {
      credentials: "include",
      method: "POST",
    });
    setUserInfo(null);
  };

  const username = userInfo?.username;
  const id = userInfo?.id; // ← get the logged in user's ID

  return(
    <header>
      <Link to="/" className="logo">MyBlog</Link>
      <nav>
        {username && (
          <>
            <Link to="/create">Create Post</Link>
            {/* Profile link — takes user to their own profile page */}
            <Link to={`/profile/${id}`}>👤 {username}</Link>
            <a onClick={logout}>Logout</a>
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