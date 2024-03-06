import React, { useEffect, useState } from 'react';
import {useParams} from "react-router-dom";
import getSessionUserID from "../../utility/getSessionUserID";
import APIProfilePicture from '../../utility/profilePictureFromAPI'; // placeholder unique profile picture for each userID
import profileBg from "../../assets/Welcome.jpeg"


const ProfilePage = ({ navigate }) => {

    // =========== STATE VARIABLES ==========================

    //TODO change the profile route to 'users/:username' instead of 'users/:id' later on...
    
    // --------- Session User ID & ID of Profile Page Owner ----------
    const [token, setToken] = useState(window.localStorage.getItem("token"));
    const sessionUserID = getSessionUserID(token);
    const { id } = useParams(); // IMPORTANT: DO NOT RENAME 'id' This refers to gameID but changing it would cause issues in routes etc.
    const targetUserID = id;

    // ---------- Profile states --------------
    const [user, setUser] = useState(null); // stores the user object retrieve from the DB
    const ownProfile = sessionUserID === targetUserID; // conditional render of information/buttons based on if this the user's profile or not

    // ============ LOADING THE PROFILE =============
    // Function to fetch userdata from the database for this specific user
    const fetchUser = () => {
        fetch(`/users/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then((res) => res.json())
        .then((data) => {
            window.localStorage.setItem("token", data.token)
            setToken(window.localStorage.getItem("token"))
            setUser(data.user)
        })
    }

    useEffect(() => {
        if(token) {
            fetchUser()
        }
    }, []);

    // ============ BACKGROUND IMAGE  =============

    const profileBgImage = {
        backgroundImage: `url(${profileBg})`,
     //color and opacity???
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
    };

    const h1Style = "text-5xl text-white font-bold text-center pb-8"
    const h2Style = "text-2xl text-white font-bold text-center"

    // ============ JSX FOR THE UI =============
    // NOTE: this takes the profile picture from a random user profile picture API.
    return (
        <>
        {/* background div */}
        <div
            className="bg-auto min-h-screen"
            style={profileBgImage}>
            {ownProfile ? 
                <>

            {/* <h2>{user ? `${user.username}'s profile`: "Loading"}</h2> */}

            <div className="flex items-center justify-center">
            <img src={`https://api.dicebear.com/7.x/rings/svg?seed=${sessionUserID}`}  alt="Your Image" width="200px" className="max-w-full max-h-full my-11 border-[0.4rem] rounded-full" />
            </div>

            <p className="text-2xl text-white font-bold text-center">Welcome back {user ? `@${user.username}`: "Loading"}</p>
            <h4 className="mb-9 text-white font-bold text-center">Points: {user ? `${user.points}`: "Loading"}</h4>
                </>
                :
                <>
                    <h2>{user ? `${user.username}'s profile`: "Loading"}</h2>
                    <p>Challenger</p>
                    <h3>Profile:</h3>
                        <APIProfilePicture id={id}/>
                    <h4 >Points: {user ? `${user.points}`: "Loading"}</h4>
                    <h4>Active Games:</h4>
                    <h4>Open Games:</h4>
                    <h4>Past Games:</h4>

                    
                </>
        
            }



<h2 className={h1Style}>Scoreboard</h2>
<div className="mx-36 items-center justify-center">
{/* TIC TAC TOE GAME SCOREBOARD - START */}
<div class="mt-20 min-h-20 w-full place-items-left overflow-x-scroll rounded-lg p-6 lg:overflow-visible relative">
    <figure class="w-full relative transition-opacity">
        <a aria-label="Link to Register" href="/tictactoe"> 
            <figcaption class="absolute bottom-8 left-2/4 transform -translate-x-2/4 flex w-[calc(100%-4rem)] -translate-x-2/4 justify-between rounded-xl border border-white py-4 px-6 shadow-lg shadow-black/5 saturate-200 backdrop-blur-sm">
                <div class="transition-opacity hover:opacity-0">
                    <h2 className={h2Style}>
                        TIC TAC TOE
                    </h2>
                </div>
                    <h5 class="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                    WINS: 5 | LOSES: 3 | DRAWS: 3
                    </h5>
            </figcaption>
        </a>
    </figure>
</div>
{/* TIC TAC TOE GAME SCOREBOARD - END */}


{/* ROCK PAPER SCISSORS GAME SCOREBOARD - START */}
<div class="min-h-20 w-full place-items-left overflow-x-scroll rounded-lg p-6 lg:overflow-visible relative">
    <figure class="w-full relative transition-opacity">
        <a aria-label="Link to Register" href="/tictactoe"> 
            <figcaption class="absolute bottom-8 left-2/4 transform -translate-x-2/4 flex w-[calc(100%-4rem)] -translate-x-2/4 justify-between rounded-xl border border-white py-4 px-6 shadow-lg shadow-black/5 saturate-200 backdrop-blur-sm">
                <div class="transition-opacity hover:opacity-0">
                    <h2 className={h2Style}>
                        ROCK PAPER SCISSORS
                    </h2>
                </div>
                    <h5 class="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                    WINS: 11 | LOSES: 5 | DRAWS: 1
                    </h5>
            </figcaption>
        </a>
    </figure>
</div>
{/* ROCK PAPER SCISSORS GAME SCOREBOARD - END */}


{/* BATTLESHIPS GAME SCOREBOARD - START */}
<div class="min-h-20 w-full place-items-left overflow-x-scroll rounded-lg p-6 lg:overflow-visible relative">
    <figure class="w-full relative transition-opacity">
        <a aria-label="Link to Register" href="/tictactoe"> 
            <figcaption class="absolute bottom-8 left-2/4 transform -translate-x-2/4 flex w-[calc(100%-4rem)] -translate-x-2/4 justify-between rounded-xl border border-white py-4 px-6 shadow-lg shadow-black/5 saturate-200 backdrop-blur-sm">
                <div class="transition-opacity hover:opacity-0">
                    <h2 className={h2Style}>
                        BATTLESHIPS
                    </h2>
                </div>
                    <h5 class="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal text-blue-gray-900">
                    WINS: 7 | LOSES: 0 | DRAWS: 2
                    </h5>
            </figcaption>
        </a>
    </figure>
{/* background div */}
</div>
</div> 
{/* BATTLESHIPS GAME SCOREBOARD - END */}

</div>
        </>

    );
};

export default ProfilePage;