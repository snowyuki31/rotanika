type Props = {
  children: React.ReactNode;
};

const Layout: React.FC<Props> = ({ children }) => {
  return (
    <>
      <div className="w-full min-h-screen flex justify-center p-4 md:px-32">
        <div className="container mx-auto">{children}</div>
      </div>
    </>
  );
};

export default Layout;
