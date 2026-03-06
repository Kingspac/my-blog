import Post from "../Post.js";
import {useEffect} from "react";

export default function IndexPage(){
  useEffect(()=>{
    fetch("http://localhost:4000/api/post").then(response =>{
      response.json().then(posts =>{
        console.log(posts);
      });
    });
  }, [])
  return(
    <>
      <Post />
      <Post />
      <Post />
    </>
    );
}