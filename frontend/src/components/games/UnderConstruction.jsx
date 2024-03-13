import React from 'react'

export default function UnderConstruction() {
  const frostedGlass = ` bg-gradient-to-r from-gray-300/30 via-purple-100/20 to-purple-900/20 backdrop-blur-sm
  shadow-lg shadow-[#363b54] border-[3px] border-white/10 `
  
  // =================================== JSX FOR UI ==============================================================
  return (
    <div className={frostedGlass + 'flex flex-col justify-center items-center text-center w-[50rem] h-[45rem] rounded-[8rem]'}>
      <h3 className='text-6xl text-white font-extrabold'>
        UNDER CONSTRUCTION
      </h3>

      <img
        class="w-[34rem] h-[30rem] opacity-95 rounded-[4rem] mt-4"
        src="/UNDERCONSTRUCTION.png"
        alt="UNDER CONSTRUCTION"
      />
    </div>
  )
}
