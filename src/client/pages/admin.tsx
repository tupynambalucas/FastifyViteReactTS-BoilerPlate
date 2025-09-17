import type { FC } from 'react';

interface AdminProps {}

const Admin: FC<AdminProps> = () => {
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

export default Admin;