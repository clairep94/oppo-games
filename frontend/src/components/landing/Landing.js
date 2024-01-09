import landingBg from "../../assets/bg-gaming-console-duo-animations.png"

const Landing = ({ navigate }) => {

    const basicFont = "pt-3 text-white text-lg font-extralight tracking-widest text-wrap"
    const bgGradient = "bg-gradient-to-br from-customPurple via-customIndigo to-customPink "
    const bgGradientLight = "bg-gradient-to-br from-customPink via-customIndigo to-customBlack "
    const h1Style = "pt-3 text-8xl text-white font-extrabold"
    const buttonStyle = "w-2/5 bg-customPink text-xl text-white font-semibold rounded-lg py-2 px-4 hover:bg-pink-600 focus:outline-none focus:shadow-outline-pink active:bg-pink-700"

    return (
        <>
     {/* comment  */}

    <div className={bgGradient}>
    <div class="container mx-auto">
        <div class="flex justify-end">
        <div class="text-left w-3/5 pr-4">
            
        <div className="flex flex-col h-dvh justify-center pr-40">
        <h3 className="text-xl text-white font-semibold tracking-wider">ONLINE MULTIPLAYER GAMING</h3>
        <h1 className={h1Style}>OPPO GAMES</h1>
        <h2 className={basicFont}>Welcome to Oppo Games. An online platform to participate in retro, multiplayer games in live time. Join a game, chat with your opponent and have fun!</h2>
        
        <div className="pt-6">

        <a aria-label="Link to Register" href="/login">
        <button className={buttonStyle}>
        START PLAYING 
        </button>
        </a>

        </div>

            </div>
        </div>

        <div class="w-2/5 min-h-screen flex flex-col justify-center">
            <img 
                src={landingBg} 
                alt="3d-game-console-in-purple" 
                width="700px"
                className="transition duration-700 ease-in-out transition-transform hover:scale-110"
                ></img>
        </div>
        </div>
    </div>
    </div>

    </>
    );
};

export default Landing;



