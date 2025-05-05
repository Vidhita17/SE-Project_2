import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-900 via-blue-900 to-blue-800 text-white h-[90vh] flex items-center justify-center text-center px-5">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Welcome to University Portal</h1>
          <p className="text-xl mb-8">Your gateway to academic excellence and innovation</p>
          <Link to="/login" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-md transition-all transform hover:scale-105 inline-block">
            Get Started
          </Link>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-gray-50 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold mb-12">Why Choose Us</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 transition-transform hover:-translate-y-2">
              <h3 className="text-xl font-semibold mb-4">Academic Excellence</h3>
              <p className="text-gray-600">Our institution is committed to providing high-quality education with world-class faculty and innovative teaching methods.</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 transition-transform hover:-translate-y-2">
              <h3 className="text-xl font-semibold mb-4">Research Opportunities</h3>
              <p className="text-gray-600">Students and faculty engage in cutting-edge research across disciplines, creating solutions for today's complex challenges.</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 transition-transform hover:-translate-y-2">
              <h3 className="text-xl font-semibold mb-4">Global Network</h3>
              <p className="text-gray-600">Join a diverse community of scholars and professionals from around the world, building connections that last a lifetime.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-8">Ready to Join Our Community?</h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            Whether you're a prospective student, faculty member, or researcher, we invite you to become part of our innovative and supportive academic environment.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/about" className="border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-medium py-2 px-6 rounded-md transition-all inline-block">
              Learn More
            </Link>
            <Link to="/login" className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded-md transition-all inline-block">
              Sign Up Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
