// components/Footer.tsx

import React from "react";

const Footer = () => {
    return (
        <footer className="bg-[#0A0A23] text-gray-400 text-center text-sm py-4 fixed bottom-0 left-0 w-full border-t border-gray-700">
            <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 md:px-8 lg:px-16">
                {/* Email link */}
                <div>
                    Contact us:{" "}
                    <a
                        href="mailto:support@digitalclinics.com"
                        className="text-[#60CFFF] hover:underline"
                    >
                        support@digitalclinics.com
                    </a>
                </div>

                {/* Copyright */}
                <div className="mt-2 md:mt-0">
                    © 2025 DIGITAL CLINICS v2.0. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
