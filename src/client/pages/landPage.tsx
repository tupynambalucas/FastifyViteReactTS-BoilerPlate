import type { FC } from 'react';

interface LandProps {}

const LandPage: FC<LandProps> = () => {
  return (
    <>
      <div 
        style={{
          height: '100%',
          width: '100%',
          overflow: 'auto',
          zIndex: '2',
          position: 'absolute'
        }}
      >
        <h1>AAAAAAAAAAAAA</h1>
      </div>
    </>
  );
}

export default LandPage;