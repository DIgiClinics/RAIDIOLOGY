import React from 'react';

const Contact = () => {
  return (
    <div className='contact'>
    <section className="bg-[#0A0A23] py-16 px-4 md:px-8 lg:px-16 text-center">
      <h2 className="text-[#60CFFF] text-5xl font-extrabold mb-8">Contact Us</h2>
      <p className="text-gray-400 text-lg mb-8 max-w-3xl mx-auto">
        Have any questions or need assistance? Fill out the form below, and we will get back to you shortly.
      </p>

      <form className="w-full max-w-lg mx-auto space-y-6">
        <div>
          <input
            type="text"
            placeholder="Your Name"
            className="w-full p-4 bg-[#1B1B3A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#60CFFF]"
          />
        </div>
        <div>
          <input
            type="email"
            placeholder="Your Email"
            className="w-full p-4 bg-[#1B1B3A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#60CFFF]"
          />
        </div>
        <div>
          <textarea
            placeholder="Your Message"
            rows="6"
            className="w-full p-4 bg-[#1B1B3A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#60CFFF]"
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full py-4 bg-[#60CFFF] text-white font-bold rounded-lg hover:bg-[#51b6e0] transition duration-300"
        >
          Send Message
        </button>
      </form>
    </section>
    </div>
  );
};

export default Contact;
