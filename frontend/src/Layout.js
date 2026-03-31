import Header from "./Header.js";
import MiniPlayer from "./pages/MiniPlayer";
import {Outlet} from "react-router-dom";

export default function(){
  return(
    <>
    <MiniPlayer />
    <Header />
    <main>
      <Outlet />
    </main>
    </>
    );
}