import Header from "./Header.js";
import {Outlet} from "react-router-dom";

export default function(){
  return(
    <>
    <Header />
    <main>
      <Outlet />
    </main>
    </>
    );
}