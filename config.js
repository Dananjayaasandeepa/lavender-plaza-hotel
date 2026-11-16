/* Lavender Plaza Hotel - booking settings.
   Edit this file in cPanel > File Manager (no rebuild needed), then refresh the site.
   bookingEmail: your reservations email  -> adds a "Send by email" button on the booking page
   loginUrl:     link to your member login / booking-engine page -> Login and the Facebook / Google / email buttons open it
   googleClientId: (optional) easier: put it in api/config.php instead
   facebookAppId:  (optional) easier: put it in api/config.php instead
   whatsapp:     number with country code, digits only (example 971501234567) -> adds "Send on WhatsApp" */
window.LPH_CONFIG = {
  bookingEmail: "lavenderplazahotel@gmail.com",
  whatsapp: "",
  loginUrl: "",
  googleClientId: "",
  facebookAppId: ""
};
