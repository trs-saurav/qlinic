import React, { Suspense } from "react";
import SearchClient from "./SearchClient";

const SearchPage = () => {
  return (
    <>
      <header className="hero-section">
        <video
          playsInline
          autoPlay
          loop
          muted
          className="bg-video"
        >
          <source src="/robot ai.mp4" type="video/mp4" />
        </video>
        <div className="content">
          <h1>Welcome to Robot AI</h1>
          <button className="aesthetic-btn">Get Started</button>
        </div>
      </header>
      <Suspense
        fallback={
          <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
            Loading...
          </div>
        }
      >
        <SearchClient />
      </Suspense>
    </>
  );
};

export default SearchPage;
