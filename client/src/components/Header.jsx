import React, { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

function Header() {
  const currentUser = useSelector((state) => state.user);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  function submitHandler(event) {
    event.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    console.log("urlParams is : ", urlParams);
    urlParams.set("searchTerm", searchTerm);
    const searchQuery = urlParams.toString();
    console.log("Search Query is : ", searchQuery);
    navigate(`/lands?${searchQuery}`);
  }

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!currentUser.currentUser) return;
      try {
        const res = await fetch('/api/message/conversations', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const total = data.data?.reduce((acc, curr) => acc + curr.unreadCount, 0) || 0;
          setUnreadCount(total);
        }
      } catch (err) {
        console.warn('Header: Failed to fetch unread count', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [currentUser.currentUser]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchTermFromUrl = urlParams.get("searchTerm");
    if (searchTermFromUrl) {
      setSearchTerm(searchTermFromUrl);
    }
  }, [location.search]);

  //console.log("Header mei currUser hain : ", currUser.currentUser.rest);
  return (
    <header className="bg-slate-300">
      <div className=" flex flex-row justify-between items-center max-w-6xl mx-auto p-3">
        <Link to="/">
          <h1 className="font-bold text-sm sm:text-xl flex flex-wrap">
            <span className="text-slate-500"> Land </span>
            <span className="text-slate-700"> Solutions </span>
          </h1>
        </Link>
        <form
          className="bg-slate-100 p-3 rounded-lg flex flex-row items-center"
          onSubmit={submitHandler}
        >
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent focus:outline-none w-24 sm:w-64"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button>
            <FaSearch className="text-slate-700" />
          </button>
        </form>
        <ul className="flex gap-4 items-center">
          <Link to="/">
            <li className="hidden sm:inline text-slate-700 hover:underline">
              Home
            </li>
          </Link>
          <Link to="/about">
            <li className="hidden sm:inline text-slate-700 hover:underline">
              About
            </li>
          </Link>
          {currentUser.currentUser ? (
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="hidden sm:inline text-slate-700 font-bold hover:underline">
                Dashboard
              </Link>
              <Link to="/messages" className="relative">
                <li className="hidden sm:inline text-slate-700 hover:underline">
                  Messages
                </li>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
              {(['VERIFICATION_OFFICER', 'MUNICIPAL_OFFICER', 'SYSTEM_ADMIN'].includes(currentUser.currentUser?.rest?.role || currentUser.currentUser?.role)) && (
                <Link to="/verify-land" className="hidden sm:inline text-blue-700 font-bold hover:underline">
                  Verify
                </Link>
              )}
              {(['SYSTEM_ADMIN'].includes(currentUser.currentUser?.rest?.role || currentUser.currentUser?.role)) && (
                <Link to="/admin" className="hidden sm:inline text-red-700 font-bold hover:underline">
                  Admin
                </Link>
              )}
              <Link to="/profile">
                {currentUser.currentUser?.rest?.profile?.profilePicture ? (
                  <img
                    className="rounded-full h-8 w-8 object-cover border-2 border-slate-400"
                    src={currentUser.currentUser.rest.profile.profilePicture}
                    alt="profile"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-slate-400 flex items-center justify-center text-white font-bold">
                    {currentUser.currentUser?.rest?.firstName?.[0] || currentUser.currentUser?.firstName?.[0] || 'U'}
                  </div>
                )}
              </Link>
            </div>
          ) : (
            <Link to="/sign-in">
              <li className="text-slate-700 hover:underline">Sign In</li>
            </Link>
          )}
        </ul>
      </div>
    </header>
  );
}

export default Header;
