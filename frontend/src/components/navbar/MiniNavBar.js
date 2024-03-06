const MiniNavBar = ({ navigate }) => {

    return (
        <>

    <div class="flex justify-end mt-auto p-9 mr-10">
        <a class="bg-gray-700 mr-2 text-xl text-white font-semibold rounded-lg py-2 px-4 hover:bg-purple-600 focus:shadow-outline-purple-900" href="/welcome">OPPO GAMES</a>
        <a class="bg-purple-900 mr-2 text-xl text-white font-semibold rounded-lg py-2 px-4 hover:bg-purple-600 focus:shadow-outline-purple-900" href="/login">Log in</a>
        <a class="bg-purple-900 text-xl text-white font-semibold rounded-lg py-2 px-4 hover:bg-purple-600 focus:shadow-outline-purple-900" href="/signup">Sign Up</a>
    </div>
    
    </>
    );
};

export default MiniNavBar;





