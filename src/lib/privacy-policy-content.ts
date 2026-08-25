// Bilingual Privacy Policy content for Rroba.
// Written to match what the app actually collects, shows publicly and shares.

export type PolicySection = { heading: string; body: string[] };
export type PolicyDoc = {
  title: string;
  updated: string;
  intro: string[];
  sections: PolicySection[];
};

const sq: PolicyDoc = {
  title: "Politika e privatësisë",
  updated: "Përditësuar: 25 gusht 2026",
  intro: [
    "Rroba është një treg online për blerjen dhe shitjen e veshjeve dhe artikujve të dorës së dytë. Kjo politikë shpjegon çfarë të dhëna personale mbledhim, pse i përdorim, çfarë është publike, me kë i ndajmë dhe si mund t'i kontrollosh.",
    "Kontrollues i të dhënave: Rroba. Kontakt: support@rroba.app",
  ],
  sections: [
    {
      heading: "1. Të dhënat që mbledhim",
      body: [
        "Të dhënat e llogarisë: emri dhe mbiemri, emri i shfaqur, emri i përdoruesit, email-i, fjalëkalimi (i ruajtur vetëm i hash-uar nga ofruesi i autentikimit), numri i telefonit, data e lindjes, gjinia, qyteti, biografia dhe fotoja e profilit.",
        "Përmbajtja që publikon: titulli, përshkrimi, kategoria, madhësia, ngjyra, gjendja, marka, çmimi, qyteti, opsionet e dorëzimit dhe fotot e artikujve.",
        "Aktiviteti: mesazhet me përdoruesit e tjerë, ndjekjet (followers/following), pëlqimet, artikujt e ruajtur, vlerësimet dhe komentet, raportimet, njoftimet dhe statusi i shitjes (përfshirë blerësin që zgjedh kur shënon një artikull si të shitur).",
        "Të dhëna teknike: user-agent i pajisjes në momentin e regjistrimit, adresa IP e përpunuar nga infrastruktura tona për sigurinë dhe parandalimin e abuzimit, koha e pranimit të kushteve, dhe regjistrat e gabimeve nga aplikacioni.",
        "Të dhëna të promovimeve dhe anëtarësimit: paketa e zgjedhur, çmimi, metoda e pagesës që deklaron (PayPal ose transfertë bankare) dhe referenca e pagesës që shkruan vetë.",
        "Nuk mbledhim adresë postare, nuk ruajmë numra kartash dhe nuk kemi sistem të integruar pagesash ose transporti brenda aplikacionit.",
      ],
    },
    {
      heading: "2. Pse i përdorim",
      body: [
        "Për të krijuar dhe administruar llogarinë tënde dhe për të bërë të mundur autentikimin.",
        "Për të publikuar artikujt e tu, për të bërë të mundur kërkimin, filtrimin dhe personalizimin bazë të faqes kryesore sipas preferencave të tua.",
        "Për të lejuar komunikimin mes blerësit dhe shitësit dhe për të dërguar njoftime brenda aplikacionit.",
        "Për të verifikuar promovimet dhe anëtarësimet e paguara manualisht.",
        "Për sigurinë, moderimin, trajtimin e raportimeve dhe bllokimin e llogarive që shkelin kushtet.",
      ],
    },
    {
      heading: "3. Çfarë është publike",
      body: [
        "Publikisht të dukshme janë: emri i shfaqur, emri i përdoruesit, fotoja e profilit, biografia, qyteti, data e krijimit të llogarisë, vlerësimi mesatar dhe numri i vlerësimeve, artikujt aktivë me fotot dhe përshkrimet, ndjekësit dhe personat që ndjek, si edhe vlerësimet dhe komentet që shkruan për të tjerët.",
        "Nuk shfaqen publikisht: email-i, numri i telefonit, data e lindjes, gjinia, mesazhet, artikujt e ruajtur, pëlqimet, njoftimet, raportimet, të dhënat e pagesës dhe të dhënat teknike.",
        "Profilet publike shërbehen përmes një pamje të kufizuar të bazës së të dhënave që përmban vetëm fushat publike të listuara më lart.",
      ],
    },
    {
      heading: "4. Mesazhet dhe komunikimi privat",
      body: [
        "Mesazhet mund t'i lexojnë vetëm blerësi dhe shitësi në atë bisedë; rregullat e sigurisë së bazës së të dhënave nuk lejojnë akses për përdorues të tretë.",
        "Personeli i Rroba nuk lexon mesazhet në rutinë. Akses i kufizuar administrativ mund të përdoret vetëm kur është i nevojshëm për të hetuar një raportim, abuzim, mashtrim, ose kur kërkohet me ligj.",
        "Mesazhet nuk janë të enkriptuara nga fundi në fund; ato ruhen të enkriptuara në transit dhe në ruajtje nga ofruesi i infrastrukturës.",
      ],
    },
    {
      heading: "5. Pagesat, promovimet dhe dorëzimi",
      body: [
        "Blerja e artikujve ndodh drejtpërdrejt mes blerësit dhe shitësit, jashtë aplikacionit. Rroba nuk përpunon pagesa për artikujt dhe nuk ofron transport.",
        "Për promovime dhe anëtarësim, pagesa bëhet me PayPal ose transfertë bankare dhe ne ruajmë vetëm metodën, çmimin, referencën që shkruan dhe statusin e konfirmimit. Detajet e kartës ose të llogarisë bankare nuk kalojnë përmes Rroba.",
      ],
    },
    {
      heading: "6. Baza ligjore (GDPR)",
      body: [
        "Kontrata (neni 6(1)(b)): krijimi i llogarisë, publikimi i artikujve, mesazhet, vlerësimet, promovimet dhe anëtarësimi.",
        "Interesi legjitim (neni 6(1)(f)): siguria, parandalimi i mashtrimit dhe abuzimit, moderimi, regjistrimi i gabimeve dhe mirëmbajtja e shërbimit.",
        "Detyrimi ligjor (neni 6(1)(c)): përgjigje ndaj kërkesave ligjore dhe ruajtja e regjistrimeve të kërkuara.",
        "Pëlqimi (neni 6(1)(a)): kur zgjedh preferenca opsionale, si personalizimi i faqes sipas gjinisë ose email-e informuese, ku ofrohen.",
      ],
    },
    {
      heading: "7. Ndarja me ofrues shërbimi",
      body: [
        "Infrastruktura e bazës së të dhënave, autentikimi dhe ruajtja e fotove: Supabase.",
        "Hosting dhe shpërndarje e aplikacionit: Lovable / Cloudflare.",
        "Email transaksionale: pjesa më e madhe e email-eve (konfirmim llogarie, rivendosje fjalëkalimi, njoftime të llogarisë) dërgohet përmes shërbimit të email-it të Lovable, ndërsa disa email-e specifike — si njoftimet për promovime/administrim dhe email-i i konfirmimit të fshirjes së llogarisë — dërgohen përmes Resend.",
        "Për çdo email të dërguar ruajmë një regjistër (email_send_log) me adresën e marrësit, emrin e shabllonit, statusin e dërgimit dhe, në rast dështimi, mesazhin e gabimit.",

        "Raportim i gabimeve teknike të aplikacionit: platforma e hostimit të Rroba.",
        "Ne nuk shesim të dhënat personale dhe nuk i ndajmë me rrjete reklamash. Të dhënat mund t'i zbulohen autoriteteve vetëm kur kërkohet me ligj.",
      ],
    },
    {
      heading: "8. Ruajtja dhe fshirja",
      body: [
        "Të dhënat e llogarisë ruhen për sa kohë llogaria është aktive.",
        "Artikujt kanë një datë skadence dhe kalojnë automatikisht në joaktiv kur skadojnë; ata mbeten të lidhur me llogarinë tënde derisa t'i fshish ose të fshish llogarinë.",
        "Mesazhet dhe bisedat ruhen derisa fshihet një nga llogaritë pjesëmarrëse.",
        "Regjistrat e dërgimit të email-eve dhe regjistrat e sigurisë ruhen për një periudhë të kufizuar për zbulim abuzimi dhe diagnostikim.",
      ],
    },
    {
      heading: "9. Fshirja e llogarisë",
      body: [
        "Mund të fshish llogarinë vetë nga Profili → Cilësimet → Fshi llogarinë. Kërkohet fjalëkalimi për të konfirmuar identitetin.",
        "Fshirja është e menjëhershme dhe e pakthyeshme. Fshihen: profili, artikujt dhe fotot e tyre, fotoja e profilit, bisedat dhe mesazhet e tua, ofertat, ndjekjet, pëlqimet, artikujt e ruajtur, njoftimet, raportimet e dërguara, vlerësimet që kanë dhënë dhe marrë, si edhe llogaria e autentikimit.",
        "Ruajmë vetëm një regjistrim minimal auditimi të kërkesës për fshirje (identifikuesi i llogarisë, data dhe statusi), i nevojshëm për të dokumentuar përmbushjen e detyrimit GDPR. Ky regjistrim nuk është i lexueshëm nga përdoruesit.",
        "Nëse mesazhet e tua janë pjesë e një hetimi aktiv për abuzim ose kërkese ligjore, kopjet e nevojshme mund të ruhen deri në përfundimin e tij.",
      ],
    },
    {
      heading: "10. Të drejtat e tua",
      body: [
        "Ke të drejtë të kërkosh akses, korrigjim, fshirje, kufizim ose kundërshtim të përpunimit, si edhe transferim të të dhënave.",
        "Shumicën e të dhënave mund t'i ndryshosh direkt në aplikacion (profil, artikuj, email). Për kërkesa të tjera shkruaj në support@rroba.app.",
        "Ke të drejtë të paraqesësh ankesë pranë autoritetit kompetent të mbrojtjes së të dhënave.",
      ],
    },
    {
      heading: "11. Siguria",
      body: [
        "Aksesi në të dhëna kontrollohet me rregulla sigurie në nivel rreshti (RLS) në bazën e të dhënave, kështu që secili përdorues arrin vetëm të dhënat e tij dhe përmbajtjen publike.",
        "Fotot ruhen në një depo private dhe shërbehen përmes lidhjeve të përkohshme të nënshkruara.",
        "Komunikimi me serverin bëhet përmes HTTPS. Fjalëkalimet ruhen vetëm si hash nga ofruesi i autentikimit.",
      ],
    },
    {
      heading: "12. Transferimet ndërkombëtare",
      body: [
        "Ofruesit tanë të infrastrukturës mund të përpunojnë të dhëna jashtë Kosovës dhe BE-së, përfshirë SHBA-në. Në këto raste transferimi bazohet në klauzola standarde kontraktuale ose mekanizma të tjerë të lejuar nga GDPR.",
      ],
    },
    {
      heading: "13. Njoftimet dhe marketingu",
      body: [
        "Njoftimet për mesazhe, pëlqime, ndjekje, oferta dhe shitje shfaqen brenda aplikacionit.",
        "Email-et që dërgojmë aktualisht janë transaksionale (konfirmim, rivendosje fjalëkalimi, informacion për llogarinë). Nuk dërgojmë email-e reklamuese pa pëlqimin tënd dhe mund të tërheqësh pëlqimin në çdo kohë.",
        "Aplikacioni aktualmente nuk dërgon push-notifikime në pajisje.",
      ],
    },
    {
      heading: "14. Cookies dhe analitika",
      body: [
        "Përdorim vetëm ruajtje lokale dhe cookies të nevojshme për sesionin e hyrjes dhe preferencat si gjuha.",
        "Nuk përdorim cookies reklamuese dhe nuk kemi integruar mjete analitike të palëve të treta për ndjekjen e sjelljes së përdoruesve. Ruhen vetëm regjistrime teknike gabimesh dhe kërkesash nga platforma e hostimit.",
      ],
    },
    {
      heading: "15. Mosha minimale",
      body: [
        "Rroba kërkon të paktën 16 vjeç. Data e lindjes verifikohet gjatë regjistrimit dhe llogaritë nën 16 vjeç nuk lejohen.",
        "Nëse mësojmë se një llogari i përket një personi nën 16 vjeç, ajo fshihet.",
      ],
    },
    {
      heading: "16. Ndryshimet",
      body: [
        "Nëse e përditësojmë këtë politikë, do të ndryshojmë datën në krye dhe, për ndryshime të rëndësishme, do të informojmë brenda aplikacionit.",
      ],
    },
    {
      heading: "17. Kontakt",
      body: ["Për çdo pyetje ose kërkesë privatësie: support@rroba.app"],
    },
  ],
};

const en: PolicyDoc = {
  title: "Privacy Policy",
  updated: "Last updated: 25 August 2026",
  intro: [
    "Rroba is an online marketplace for buying and selling clothing and second-hand items. This policy explains what personal data we collect, why we use it, what is public, who we share it with and how you can control it.",
    "Data controller: Rroba. Contact: support@rroba.app",
  ],
  sections: [
    {
      heading: "1. Data we collect",
      body: [
        "Account data: first and last name, display name, username, email address, password (stored only as a hash by our authentication provider), phone number, date of birth, gender, city, bio and profile photo.",
        "Content you publish: listing title, description, category, size, colour, condition, brand, price, city, delivery options and item photos.",
        "Activity: messages with other users, followers and accounts you follow, likes, saved listings, ratings and reviews, reports, notifications and sale status (including the buyer you select when marking an item as sold).",
        "Technical data: your device user-agent at sign-up, IP addresses processed by our infrastructure for security and abuse prevention, the time you accepted the terms, and application error logs.",
        "Promotion and membership data: the plan you choose, its price, the payment method you declare (PayPal or bank transfer) and the payment reference you enter yourself.",
        "We do not collect a postal address, we never store card numbers, and the app has no built-in payment or shipping system.",
      ],
    },
    {
      heading: "2. Why we use it",
      body: [
        "To create and operate your account and to enable sign-in.",
        "To publish your listings and to power search, filtering and basic personalisation of the home feed based on your preferences.",
        "To allow buyers and sellers to message each other and to deliver in-app notifications.",
        "To verify manually paid promotions and memberships.",
        "For security, moderation, handling reports and blocking accounts that break our terms.",
      ],
    },
    {
      heading: "3. What is public",
      body: [
        "Publicly visible: display name, username, profile photo, bio, city, account creation date, average rating and rating count, active listings with their photos and descriptions, your followers and who you follow, and the ratings and reviews you write about others.",
        "Not public: your email address, phone number, date of birth, gender, messages, saved listings, likes, notifications, reports, payment data and technical data.",
        "Public profiles are served through a restricted database view that exposes only the public fields listed above.",
      ],
    },
    {
      heading: "4. Messages and private communication",
      body: [
        "Only the buyer and the seller in a conversation can read its messages; database security rules block access for any other user.",
        "Rroba staff do not read messages as a matter of routine. Limited administrative access may be used only where necessary to investigate a report, abuse or fraud, or where required by law.",
        "Messages are not end-to-end encrypted; they are encrypted in transit and at rest by our infrastructure provider.",
      ],
    },
    {
      heading: "5. Payments, promotions and delivery",
      body: [
        "Purchases happen directly between buyer and seller, outside the app. Rroba does not process payments for items and does not provide shipping.",
        "For promotions and memberships, payment is made via PayPal or bank transfer and we store only the method, the price, the reference you enter and the confirmation status. Card or bank credentials never pass through Rroba.",
      ],
    },
    {
      heading: "6. Legal bases (GDPR)",
      body: [
        "Contract (Art. 6(1)(b)): account creation, publishing listings, messaging, ratings, promotions and memberships.",
        "Legitimate interests (Art. 6(1)(f)): security, fraud and abuse prevention, moderation, error logging and keeping the service running.",
        "Legal obligation (Art. 6(1)(c)): responding to lawful requests and keeping required records.",
        "Consent (Art. 6(1)(a)): optional preferences such as gender-based feed personalisation, and informational emails where offered.",
      ],
    },
    {
      heading: "7. Sharing with service providers",
      body: [
        "Database, authentication and photo storage infrastructure: Supabase.",
        "Application hosting and delivery: Lovable / Cloudflare.",
        "Transactional email (account confirmation, password reset, administrative notices): Resend.",
        "Technical error reporting: Rroba's hosting platform.",
        "We do not sell personal data and do not share it with advertising networks. Data may be disclosed to authorities only where legally required.",
      ],
    },
    {
      heading: "8. Retention and deletion",
      body: [
        "Account data is kept for as long as your account is active.",
        "Listings have an expiry date and automatically become inactive when they expire; they stay linked to your account until you delete them or delete your account.",
        "Messages and conversations are kept until one of the participating accounts is deleted.",
        "Email delivery logs and security logs are kept for a limited period for abuse detection and diagnostics.",
      ],
    },
    {
      heading: "9. Account deletion",
      body: [
        "You can delete your account yourself from Profile → Settings → Delete account. Your password is required to confirm your identity.",
        "Deletion is immediate and irreversible. We delete: your profile, your listings and their photos, your profile photo, your conversations and messages, offers, follows, likes, saved listings, notifications, reports you filed, ratings you gave and received, and your authentication account.",
        "We keep only a minimal audit record of the deletion request (account identifier, date and status), needed to document compliance with GDPR. This record is not readable by users.",
        "If your messages form part of an active abuse investigation or legal request, necessary copies may be retained until it concludes.",
      ],
    },
    {
      heading: "10. Your rights",
      body: [
        "You have the right to request access, correction, deletion, restriction or objection to processing, and data portability.",
        "Most data can be changed directly in the app (profile, listings, email). For other requests, write to support@rroba.app.",
        "You also have the right to lodge a complaint with your competent data protection authority.",
      ],
    },
    {
      heading: "11. Security",
      body: [
        "Data access is enforced with row-level security rules in the database, so each user can only reach their own data plus public content.",
        "Photos are kept in a private storage bucket and served through short-lived signed links.",
        "Traffic to our servers uses HTTPS. Passwords are stored only as hashes by our authentication provider.",
      ],
    },
    {
      heading: "12. International transfers",
      body: [
        "Our infrastructure providers may process data outside Kosovo and the EU, including in the United States. Where that happens, transfers rely on standard contractual clauses or another mechanism permitted by the GDPR.",
      ],
    },
    {
      heading: "13. Notifications and marketing",
      body: [
        "Notifications about messages, likes, follows, offers and sales are shown inside the app.",
        "The emails we currently send are transactional (confirmation, password reset, account information). We do not send marketing emails without your consent, and you can withdraw consent at any time.",
        "The app currently does not send device push notifications.",
      ],
    },
    {
      heading: "14. Cookies and analytics",
      body: [
        "We use only local storage and cookies necessary for your sign-in session and preferences such as language.",
        "We use no advertising cookies and have not integrated third-party behavioural analytics. Only technical error and request logs from our hosting platform are recorded.",
      ],
    },
    {
      heading: "15. Minimum age",
      body: [
        "Rroba requires you to be at least 16 years old. Date of birth is checked at sign-up and accounts under 16 are not allowed.",
        "If we learn that an account belongs to someone under 16, we delete it.",
      ],
    },
    {
      heading: "16. Changes to this policy",
      body: [
        "If we update this policy we will change the date at the top and, for significant changes, notify you inside the app.",
      ],
    },
    {
      heading: "17. Contact",
      body: ["For any privacy question or request: support@rroba.app"],
    },
  ],
};

export const PRIVACY_POLICY: Record<"sq" | "en", PolicyDoc> = { sq, en };
