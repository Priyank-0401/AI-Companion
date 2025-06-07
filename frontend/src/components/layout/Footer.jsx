const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-gray-800 text-gray-300 py-8 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm">
          &copy; {currentYear} Seriva. All rights reserved.
        </p>
        <p className="text-xs mt-2">
          Built with ❤️ for a better well-being.
        </p>
        {/* You can add more links or information here */}
        {/* <div className="mt-4">
          <a href="/privacy-policy" className="text-gray-400 hover:text-white mx-2">Privacy Policy</a>
          <a href="/terms-of-service" className="text-gray-400 hover:text-white mx-2">Terms of Service</a>
        </div> */}
      </div>
    </footer>
  );
};

export default Footer;
