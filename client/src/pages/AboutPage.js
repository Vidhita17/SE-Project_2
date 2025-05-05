import React from 'react';

function AboutPage() {
  return (
    <div className="flex-1">
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-5xl font-bold mb-10 text-center text-indigo-800">About Us</h1>
          
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-semibold mb-6 text-indigo-700">Empowering Academic Collaboration</h2>
            <p className="text-gray-700 leading-relaxed text-lg max-w-4xl mx-auto">
              Our platform bridges the gap between final-year students and faculty members, fostering a collaborative environment where innovative ideas thrive. We aim to streamline the process of project discovery, application, and management, ensuring a seamless experience for all users.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div className="bg-white p-8 rounded-lg shadow-md transform transition-transform hover:scale-105">
              <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Our Mission</h2>
              <p className="text-gray-700 leading-relaxed">
                To facilitate meaningful connections between students and faculty, enabling the pursuit of impactful academic projects that contribute to personal growth and institutional excellence.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md transform transition-transform hover:scale-105">
              <h2 className="text-2xl font-semibold mb-4 text-indigo-700">Our Vision</h2>
              <p className="text-gray-700 leading-relaxed">
                To become the leading platform that supports academic collaboration, driving innovation and research within educational institutions.
              </p>
            </div>
          </div>
          
          <div className="mb-16 bg-indigo-50 p-10 rounded-xl">
            <h2 className="text-3xl font-semibold mb-6 text-center text-indigo-700">What We Offer</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3 text-indigo-600">For Students</h3>
                <p className="text-gray-700">
                  A curated list of faculty-led projects across various domains, easy application processes, and real-time updates on application statuses.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3 text-indigo-600">For Faculty</h3>
                <p className="text-gray-700">
                  Tools to post project opportunities, manage student applications, and select candidates who align with project goals.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center bg-indigo-700 text-white p-10 rounded-xl">
            <h2 className="text-2xl font-semibold mb-4">Join Us</h2>
            <p className="leading-relaxed text-lg max-w-3xl mx-auto">
              Whether you're a student seeking to apply your knowledge or a faculty member looking to mentor the next generation, our platform is here to support your academic journey.
            </p>
            <button className="mt-6 bg-white text-indigo-700 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
