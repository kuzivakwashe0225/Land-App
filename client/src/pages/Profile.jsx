import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRef } from "react";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../firebase";
import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  signoutUserStart,
  signoutUserFailure,
  signoutUserSuccess,
} from "../redux/user/userSlice";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle, Flag, ShieldAlert } from "lucide-react";

function Profile() {
  const { currentUser, loading, error } = useSelector((state) => state.user);
  const fileReference = useRef(null);
  const [file, setFile] = useState(undefined);
  const [filePercentage, setFilePercentage] = useState(0);
  const [fileUploadError, setFileUploadError] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showListingError, setShowListingError] = useState(false);
  const [usersListings, setUsersListings] = useState([]);
  const dispatch = useDispatch();

  // console.log("File is inside (Profile.jsx) : ", file);
  // console.log("File Percentage uploaded is : ", filePercentage);
  console.log("FormData is (inside Profile.jsx) : ", formData);
  console.log("currentUser is (inside Profile.jsx) : ", currentUser);
  console.log("UserListings are : ", usersListings);

  useEffect(() => {
    if (file) {
      uploadFileHandler(file);
    }
  }, [file]);

  async function showListingsHandler() {
    console.log("showListingsHandler function call hua hain");
    console.log("Current USER HAIn  : ", currentUser.rest);
    try {
      setShowListingError(false);
      const response = await fetch(
        `/api/user/listings/${currentUser.rest._id}`,
        {
          method: "GET",
        }
      );
      const responseData = await response.json();
      console.log("showListingsHandler mei responseData hain : ", responseData);
      if (responseData.success === false) {
        setShowListingError(true);
        return;
      }
      setUsersListings(responseData.listings);
      console.log("UsersLISTINGS : ", usersListings);
    } catch (error) {
      setShowListingError(true);
    }
  }

  function uploadFileHandler(file) {
    const storage = getStorage(app);
    console.log("File Details inside uploadFileHandler function : ", file);
    const fileName = new Date().getTime() + file.name; //Create Unique Name
    const storageReference = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageReference, file); //Gives the percentage of file uploaded

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is ", progress, " % done");
        setFilePercentage(Math.round(progress));
      },
      (error) => {
        setFileUploadError(true);
      },

      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setFormData({ ...formData, profilePicture: downloadURL });
        });
      }
    );
  }

  function changeHandler(event) {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    console.log("FormData inside changeHandler : ", formData);
  }

  async function submitHandler(event) {
    event.preventDefault();
    try {
      dispatch(updateUserStart());
      console.log("SubmitHandler inside Profile.jsx : ", currentUser);
      const response = await fetch(`/api/user/update/${currentUser.rest._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      const responseData = await response.json();
      if (responseData.success === false) {
        dispatch(updateUserFailure(responseData.message));
        return;
      }
      dispatch(updateUserSuccess(responseData));
      setUpdateSuccess(true);
    } catch (error) {
      dispatch(updateUserFailure(error.message));
    }
  }

  async function deleteUserHandler() {
    try {
      dispatch(deleteUserStart());
      const response = await fetch(`/api/user/delete/${currentUser.rest._id}`, {
        method: "DELETE",
      });
      const responseData = await response.json();
      if (responseData.success === false) {
        dispatch(deleteUserFailure(responseData.message));
        return;
      }
      dispatch(deleteUserSuccess(responseData));
    } catch (error) {
      dispatch(deleteUserFailure(error.message));
    }
  }

  async function signOutHandler() {
    try {
      dispatch(signoutUserStart());
      const response = await fetch("/api/auth/signout", {
        method: "GET",
      });
      const responseData = await response.json();
      if (responseData === false) {
        dispatch(signoutUserFailure(responseData.message));
        return;
      }
      dispatch(signoutUserSuccess(responseData));
    } catch (error) {
      dispatch(signoutUserFailure(error.message));
    }
  }

  async function deleteListingHandler(listingId) {
    try {
      const response = await fetch(`/api/land/${listingId}`, {
        method: "DELETE",
      });
      const responseData = await response.json();
      if (responseData.success === false) {
        console.log(responseData.message);
        return;
      }
      setUsersListings((prev) =>
        prev.filter((listing) => listing._id !== listingId)
      );
    } catch (error) { }
  }

  return (
    <div className="mx-auto p-3 max-w-lg">
      <h1 className="text-3xl text-center font-semibold my-7">Account Settings</h1>

      <div className="mb-6 flex justify-center">
        <Link
          to="/dashboard"
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md"
        >
          Go to Dashboard
        </Link>
      </div>

      <form className="flex flex-col gap-4" onSubmit={submitHandler}>
        <input
          type="file"
          ref={fileReference}
          hidden
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <img
          src={formData.profilePicture || currentUser?.rest?.profile?.profilePicture || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
          alt="User Profile Picture"
          className="rounded-full h-24 w-24 cursor-pointer object-cover self-center mt-2 border-4 border-slate-200"
          onClick={() => fileReference.current.click()}
        />
        <p className="text-sm self-center">
          {fileUploadError ? (
            <span className="text-red-700">Error Image Upload (Image must be less than 10 MB)</span>
          ) : filePercentage > 0 && filePercentage < 100 ? (
            <span className="text-slate-700">{`Uploading ${filePercentage}%`}</span>
          ) : filePercentage === 100 ? (
            <span className="text-green-700">Image successfully uploaded!</span>
          ) : null}
        </p>

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="First Name"
            className="border p-3 rounded-lg font-semibold w-full"
            id="firstName"
            name="firstName"
            defaultValue={currentUser?.rest?.firstName}
            onChange={changeHandler}
          />
          <input
            type="text"
            placeholder="Last Name"
            className="border p-3 rounded-lg font-semibold w-full"
            id="lastName"
            name="lastName"
            defaultValue={currentUser?.rest?.lastName}
            onChange={changeHandler}
          />
        </div>

        <input
          type="email"
          placeholder="Email"
          className="border p-3 rounded-lg font-semibold"
          id="email"
          name="email"
          defaultValue={currentUser?.rest?.email}
          onChange={changeHandler}
        />

        <div className="flex gap-4">
          <input
            type="tel"
            placeholder="Phone Number"
            className="border p-3 rounded-lg font-semibold w-full"
            id="phoneNumber"
            name="phoneNumber"
            defaultValue={currentUser?.rest?.phoneNumber}
            onChange={changeHandler}
          />
          <input
            type="text"
            placeholder="National ID"
            className="border p-3 rounded-lg font-semibold w-full"
            id="nationalId"
            name="nationalId"
            defaultValue={currentUser?.rest?.nationalId}
            onChange={changeHandler}
          />
        </div>

        <input
          type="password"
          placeholder="Password"
          className="border p-3 rounded-lg"
          id="password"
          name="password"
          onChange={changeHandler}
        />

        <button
          disabled={loading}
          className="bg-slate-800 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80 font-bold tracking-widest"
        >
          {loading ? "Updating..." : "Update Account"}
        </button>
      </form>

      {/* Flag Abuse Status Section - for BUYER/SELLER roles */}
      {(currentUser?.rest?.role === 'BUYER' || currentUser?.rest?.role === 'SELLER') && currentUser?.rest?.flagging && (
        <div className="mt-8 border-t pt-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Flag className="h-6 w-6 text-amber-600" />
            Report History
          </h2>

          {/* Permanent Ban Alert */}
          {currentUser?.rest?.flagging?.permanentBan && (
            <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Account Suspended</p>
                <p className="text-sm text-red-800 mt-1">Your flagging privileges have been permanently revoked due to repeated submission of false reports.</p>
              </div>
            </div>
          )}

          {/* Temporary Ban Alert */}
          {currentUser?.rest?.flagging?.bannedUntil && new Date(currentUser.rest.flagging.bannedUntil) > new Date() && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900">Flagging Suspended</p>
                <p className="text-sm text-yellow-800 mt-1">
                  Your flagging privileges are suspended until {new Date(currentUser.rest.flagging.bannedUntil).toLocaleDateString()} due to false reports.
                </p>
              </div>
            </div>
          )}

          {/* Flag Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Submitted</p>
              <p className="text-2xl font-bold text-blue-600">{currentUser?.rest?.flagging?.totalSubmitted || 0}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <p className="text-sm text-gray-600">Strikes</p>
              <p className="text-2xl font-bold text-amber-600">{currentUser?.rest?.flagging?.strikeCount || 0}/3</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-gray-600">False Flags</p>
              <p className="text-2xl font-bold text-red-600">{currentUser?.rest?.flagging?.falseFlagCount || 0}</p>
            </div>
          </div>

          {/* Strike Explanation */}
          {(currentUser?.rest?.flagging?.strikeCount || 0) > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
              <p className="font-semibold mb-2">Strike System:</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>3 false flags</strong> = 1 strike</li>
                <li>• <strong>Strike 1:</strong> 7-day ban from flagging</li>
                <li>• <strong>Strike 2:</strong> 30-day ban from flagging</li>
                <li>• <strong>Strike 3+:</strong> Permanent suspension of flagging privileges</li>
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between mt-8">
        <span
          className="text-red-700 font-semibold cursor-pointer hover:underline"
          onClick={deleteUserHandler}
        >
          Delete Account
        </span>
        <span
          className="text-red-700 font-semibold cursor-pointer hover:underline"
          onClick={signOutHandler}
        >
          Sign Out
        </span>
      </div>

      <p className="text-red-700 font-semibold mt-5 text-center">
        {error ? error.message : ""}
      </p>
      <p className="text-green-700 font-semibold mt-5 text-center">
        {updateSuccess ? "Account information updated successfully." : ""}
      </p>
    </div>
  );
}

export default Profile;
