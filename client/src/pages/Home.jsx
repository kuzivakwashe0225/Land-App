import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import SwiperCore from "swiper";
import "swiper/css/bundle";
import LandVerificationCard from "../components/LandVerificationCard";
import { getLandListings } from "../services/landService";

SwiperCore.use([Navigation]);

function Home() {
  const [recentLands, setRecentLands] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentLands = async () => {
      try {
        // Use the public endpoint — no auth required, only shows isPublic=true verified listings
        const response = await fetch('/api/land/public?limit=4');
        if (response.ok) {
          const data = await response.json();
          setRecentLands(data.data || []);
        }
      } catch (error) {
        console.log("Error fetching recent lands:", error);
      }
    };
    fetchRecentLands();
  }, []);

  const handleFlagLand = (landId, flagData) => {
    console.log("Flagging land:", landId, flagData);
  };

  const handleViewDetails = (land) => {
    navigate(`/lands/${land._id}`);
  };

  return (
    <div>
      <div className="flex flex-col gap-6 p-28 px-3 max-w-6xl mx-auto">
        <h1 className=" text-slate-700 font-bold text-3xl lg:text-6xl">
          Find your next <span className="text-slate-500">verified</span> <br />{" "}
          stand with <span className="text-blue-600">LandSolutions</span>
        </h1>
        <div className="text-gray-400 text-xs sm:text-sm">
          LandSolutions is the premier platform for secure and verified land transactions.
          <br />
          We collaborate with municipal and national land authorities to ensure every stand is legitimate.
        </div>
        <Link
          to={"/lands"}
          className="text-xs sm:text-sm text-blue-700 font-bold hover:underline"
        >
          Browse Verified Stands
        </Link>
      </div>

      <div className="max-w-6xl mx-auto p-3 flex flex-col gap-8 my-10">
        {recentLands && recentLands.length > 0 && (
          <div className="">
            <div className="my-3">
              <h2 className="text-2xl font-semibold text-slate-600">
                Recent Verified Stands
              </h2>
              <Link
                className="text-sm text-blue-800 hover:underline"
                to={"/lands"}
              >
                Show more verified stands
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentLands.map((land) => (
                <LandVerificationCard
                  key={land._id}
                  land={land}
                  onViewDetails={handleViewDetails}
                  onFlag={handleFlagLand}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;
