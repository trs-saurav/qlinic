
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";



export default function RootLayout({ children }) {
  return (
      <>
        <Navbar />
        {children}
        <Footer />

      </>
                

  );
}
