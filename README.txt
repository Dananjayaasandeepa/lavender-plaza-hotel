LAVENDER PLAZA HOTEL - HOSTGATOR UPLOAD GUIDE
==============================================

WHAT IS IN THIS FOLDER
  index.html        the page browsers open
  styles.css        all styling (already compiled, nothing to install)
  app.js            the website code (already compiled)
  images.js         list of photo files
  images/           all photos (.webp) and the logo
  favicon.png, apple-touch-icon.png
  .htaccess         HostGator/Apache speed + security settings
  robots.txt

UPLOAD (cPanel File Manager)
  1. Log in to HostGator > cPanel > File Manager.
  2. Open the folder  public_html  (or the folder of your add-on domain).
  3. Click Upload, choose lavender-plaza-hotel-site.zip, then right-click the zip > Extract.
     Make sure index.html sits directly inside public_html (not in a sub-folder),
     and that the hidden file .htaccess is there (Settings > Show Hidden Files).
  4. Open your domain in a browser and refresh once (Ctrl+Shift+R).

UPLOAD (FTP)
  Upload everything inside this folder (including the hidden .htaccess) to public_html.

HTTPS
  In cPanel turn on the free SSL certificate (AutoSSL / Let's Encrypt), then open .htaccess
  and remove the # in front of the last 4 lines to force https.

BOOKING REQUESTS (booking page)
  Open config.js in cPanel > File Manager > Edit, and fill in:
    bookingEmail  your reservations email   -> guests get a "Send by email" button
    whatsapp      number with country code  -> guests get a "Send on WhatsApp" button
    loginUrl      link to your member login page -> the Login and Facebook / Google / email buttons open it
  Save, then refresh the site. If both are empty, guests can still copy their request.
  Note: there is no booking engine behind the page yet. It collects the request and the guest
  sends it to you. Member Login is a quick sign-in that saves the guest's name and email on their own device (it fills the booking form faster). The Facebook / Google buttons show "Soon" until you add their keys in config.js (see below).

MEMBER ACCOUNTS - "Continue with Gmail" (guests create an account with their Gmail)
  How it works: the guest taps "Continue with Gmail", Google confirms who they are, and the
  site saves them as a member (name, email, photo). Next time they are already signed in, and
  their details fill the booking form. The member list is stored on your HostGator in api/data.

  1) Get a Google Client ID (free, about 10 minutes)
     - console.cloud.google.com > create a project.
     - APIs & Services > OAuth consent screen > External > fill app name + your email > Save,
       then click "Publish app" (otherwise only test users can sign in).
     - APIs & Services > Credentials > Create credentials > OAuth client ID > Web application.
       Under "Authorized JavaScript origins" add  https://yourdomain.com  and  https://www.yourdomain.com
     - Copy the Client ID (it ends with .apps.googleusercontent.com).
  2) In cPanel > File Manager open  api/config.php  and paste it into GOOGLE_CLIENT_ID.
     Also change ADMIN_KEY to a long secret text.
  3) See your members any time at:  https://yourdomain.com/api/members.php?key=YOUR_ADMIN_KEY
     (add &csv=1 at the end to download a spreadsheet).
  Facebook (optional): developers.facebook.com > Create App > Facebook Login > add your domain and a
     privacy-policy link > switch the app to Live > paste the App ID into FACEBOOK_APP_ID in api/config.php.
  Needs: https on your domain and PHP (HostGator has it). If sign-in fails, check that the website
  address in Google's "Authorized JavaScript origins" matches your site exactly, and that the folder
  api/data is writable (permission 755).
  Without a Client ID the Gmail / Facebook buttons show "Soon".

GOOD TO KNOW
  - The page loads React and the animation library (framer-motion) from public CDNs
    (cdnjs / jsDelivr / unpkg), with automatic fallbacks. Visitors need internet access,
    which they have anyway.
  - After you change styles.css or app.js, raise the ?v=1 number in index.html
    so visitors' browsers fetch the new file.
  - Placeholders to replace: add the real phone number / email (footer + menu) and the
    full website address in the <meta property="og:..."> tags if you want rich link previews.
  - Works on current Chrome, Edge, Safari (iOS 15.4+), Firefox and Samsung Internet.
