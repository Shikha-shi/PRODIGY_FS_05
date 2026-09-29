import { BrowserRouter, Route, Routes } from "react-router-dom";

import "./App.css";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Explore from "./pages/Explore";
import CreatePost from "./pages/CreatePost";
import PostDetail from "./pages/PostDetail";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import FollowList from "./pages/FollowList";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import Hashtag from "./pages/Hashtag";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/create" element={<CreatePost />} />
        <Route path="/post/:postId" element={<PostDetail />} />
        <Route path="/hashtag/:name" element={<Hashtag />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route
          path="/profile/:username/followers"
          element={<FollowList type="followers" />}
        />
        <Route
          path="/profile/:username/following"
          element={<FollowList type="following" />}
        />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:username" element={<Messages />} />
      </Route>

      <Route
        path="*"
        element={
          <div className="page-loading">
            <h1>Page not found</h1>
          </div>
        }
      />
    </Routes>
  </BrowserRouter>
);

export default App;
