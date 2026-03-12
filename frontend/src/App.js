import Layout from "./Layout.js";
import IndexPage from "./pages/IndexPage.js";
import BlogPage from "./pages/BlogPage.js";
import LoginPage from "./pages/LoginPage.js";
import RegisterPage from "./pages/RegisterPage.js";
import PostPage from "./pages/PostPage.js";
import EditPost from "./pages/EditPost.js";
import CreatePost from "./CreatePost.js";
import EntertainmentPage from "./pages/EntertainmentPage.js";
import UploadMusic from "./pages/UploadMusic.js";
import ProfilePage from "./pages/ProfilePage.js";
import RoomPage from "./pages/RoomPage.js";
import EducationPage from "./pages/EducationPage.js";
import CreateEducation from "./pages/CreateEducation.js";
import EducationPostPage from "./pages/EducationPostPage.js";
import { Routes, Route } from "react-router-dom";
import { UserContextProvider } from "./UserContext.js";
import './App.css';

function App() {
  return (
    <UserContextProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Home - mixed feed */}
          <Route index element={<IndexPage />} />

          {/* Blog - only posts */}
          <Route path="/blog" element={<BlogPage />} />

          {/* Entertainment */}
          <Route path="/entertainment" element={<EntertainmentPage />} />
          <Route path="/entertainment/upload" element={<UploadMusic />} />

          {/* Education */}
          <Route path="/education" element={<EducationPage />} />
          <Route path="/education/create" element={<CreateEducation />} />
          <Route path="/education/:id" element={<EducationPostPage />} />

          {/* Community Room */}
          <Route path="/room" element={<RoomPage />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Posts */}
          <Route path="/create" element={<CreatePost />} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/edit/:id" element={<EditPost />} />

          {/* Profile */}
          <Route path="/profile/:id" element={<ProfilePage />} />
        </Route>
      </Routes>
    </UserContextProvider>
  );
}

export default App;
