import type { AppProps } from 'next/app';
import { AcademicYearProvider } from '../contexts/AcademicYearContext';
import Head from 'next/head';
import '../../app/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="test-tag" content="checking-head" />
      </Head>
      <AcademicYearProvider>
        <Component {...pageProps} />
      </AcademicYearProvider>
    </>
  );
} 