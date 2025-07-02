// app/layout.tsx

import './globals.css';
import Footer from '../components/Footer';

export const metadata = {
    title: 'Digi Clinics',
    description: 'Papaya Viewer React App',
    themeColor: '#000000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="description" content="Papaya Viewer React App" />
                <link rel="icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" href="/next.svg" />
                {/* jQuery (needed by Papaya) */}
                <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js" async></script>

                {/* Papaya CSS */}
                <link rel="stylesheet" href="/papaya/papaya.css?build=1455" />


                

                {/* Papaya JS */}
                <script src="/papaya/papaya.js?build=1455" async></script>
            </head>
            <body>
                <div className="flex flex-col min-h-screen pb-16">
                    <main className="flex-grow">{children}</main>
                    <Footer />
                </div>
            </body>
        </html>
    );
}
