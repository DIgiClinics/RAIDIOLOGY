import React from "react";
import { FaFacebookF, FaGithub, FaLinkedinIn, FaTwitter } from "react-icons/fa";

const Footer = () => {
    return (
        <footer className="bg-[#0A0A23] py-10 px-4 md:px-8 lg:px-16 mt-10">
            <div className="max-w-screen-xl mx-auto text-center lg:text-left">
                <div className="flex flex-col lg:flex-row justify-between items-center space-y-6 lg:space-y-0 lg:space-x-12">

                    {/* Footer Links (empty space for future links) */}
                    <div className="text-gray-400">
                        {/* You can add more links here */}
                    </div>

                    {/* Social Media Icons */}
                    <div className="flex justify-center space-x-6 text-[#60CFFF]">
                        <a
                            href="https://facebook.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition duration-300 hover:text-white"
                        >
                            <FaFacebookF className="text-2xl" />
                        </a>
                        <a
                            href="https://twitter.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition duration-300 hover:text-white"
                        >
                            <FaTwitter className="text-2xl" />
                        </a>
                        <a
                            href="https://linkedin.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition duration-300 hover:text-white"
                        >
                            <FaLinkedinIn className="text-2xl" />
                        </a>
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition duration-300 hover:text-white"
                        >
                            <FaGithub className="text-2xl" />
                        </a>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="mt-8 text-gray-400 text-sm">
                    <p>© 2025 DIGITAL CLINICS v2.0. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
