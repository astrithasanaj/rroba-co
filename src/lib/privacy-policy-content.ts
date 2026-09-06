// Bilingual Privacy Policy content for Rroba.
// Written to match what the app actually collects, shows publicly and shares.

export type PolicySection = { heading: string; body: string[] };
export type PolicyDoc = {
  title: string;
  updated: string;
  intro: string[];
  sections: PolicySection[];
};

const en: PolicyDoc = {
  title: "Privacy Policy",
  updated: "Last updated: 6 September 2026",
  intro: [
    "Rroba respects your privacy and is committed to protecting your personal data.",
    "This Privacy Policy explains what information Rroba collects, how and why it is used, which information may be visible to other users, which service providers may process it, how long information is retained, and the rights available to you.",
    "Rroba processes personal data only for purposes connected to operating, securing and improving the marketplace, complying with legal obligations, and providing the services requested by users.",
  ],
  sections: [
    {
      heading: "1. Who is responsible for your data",
      body: [
        "Rroba is responsible for the processing of personal data described in this Privacy Policy.",
        "For privacy-related requests, including access, correction, deletion, restriction, objection or data portability, contact: hello@rroba.co",
        "Full legal contact details for the data controller are provided in Section 16 below.",
      ],
    },
    {
      heading: "2. Information We Collect",
      body: [
        "Account and profile information",
        "When you create or use a Rroba account, we may process: first and last name, display name, username, email address, telephone number, date of birth, gender, city, biography, profile photo, account preferences, language, account creation date, acceptance of Terms and Privacy Policy, and membership and credit information.",
        "Authentication credentials are handled through our authentication provider. Rroba does not store your password in readable form.",
        "Certain technical information, such as user-agent or device information, may also be processed for security and service operation.",
        "Marketplace content",
        "When you use Rroba, we may process: listings, listing descriptions, prices, categories, brands, sizes and other listing attributes, listing photos, favourites and saved listings, followers and following, ratings and reviews, reports, notifications, and information about whether an item has been marked as sold.",
        "Messages",
        "Messages and conversations between users are stored so that Rroba's messaging functionality can operate.",
        "Messages are not publicly visible and are restricted to the relevant conversation participants, except where access is reasonably necessary for authorised support, security, abuse prevention, dispute handling or compliance with legal obligations.",
        "Promotions, membership and purchase records",
        "Rroba currently does not process or store payment-card information.",
        "Where users purchase promotions, credits or membership-related services, Rroba may process: selected plan or service, price, chosen payment method, user-entered payment reference, confirmation status, and transaction-related administrative records.",
        "Rroba does not store full payment-card details.",
        "Technical and diagnostic data",
        "To operate, secure and troubleshoot the service, limited technical information may be processed, including: browser and device information, request logs, error logs, application errors, and authentication and security events.",
        "Rroba does not currently use advertising tracking SDKs, IDFA-based tracking or behavioural advertising analytics.",
      ],
    },
    {
      heading: "3. Information Visible to Other Users",
      body: [
        "Rroba is a marketplace and some information is intentionally public.",
        "Depending on how you use the service, other users may see: your public profile name, display name, username, profile photo, biography, city, profile rating, account creation information displayed by the service, listings and listing photos, ratings and reviews, and follower and following relationships.",
        "Private account data is not intended to be publicly visible. This includes: email address, telephone number, date of birth, gender, private messages, membership and credit information, and security and device information.",
        "Buyer identity associated with a completed sale is not publicly exposed through the public listings data.",
      ],
    },
    {
      heading: "4. How We Use Personal Data",
      body: [
        "We may use personal data to: create and manage user accounts; authenticate users; display public profiles; publish and manage listings; enable communication between buyers and sellers; provide likes, saves, followers and ratings; operate in-app notifications; manage promotions, credits or membership functionality; provide customer support; investigate reports and disputes; prevent fraud, spam and abuse; secure accounts and the service; diagnose technical problems; improve reliability and functionality; send necessary transactional emails; comply with legal obligations; and establish, exercise or defend legal claims.",
        "Rroba does not sell personal data to advertisers, data brokers or other third parties.",
      ],
    },
    {
      heading: "5. Legal Bases for Processing",
      body: [
        "Where the General Data Protection Regulation (GDPR) or similar data protection legislation applies, Rroba relies on one or more of the following legal bases:",
        "Performance of a contract",
        "We process information necessary to provide the Rroba service requested by you, including account management, marketplace functionality and communication between users.",
        "Legitimate interests",
        "We may process information where necessary for legitimate interests such as: maintaining service security, preventing fraud and misuse, operating and improving the marketplace, investigating reports, and protecting Rroba and its users. We consider the impact on users' privacy rights before relying on legitimate interests.",
        "Legal obligations",
        "We may retain or disclose information where required by applicable law, regulation, court order or lawful request from a competent authority.",
        "Consent",
        "Where consent is legally required, we will request it before the relevant processing takes place. Where processing is based on consent, you may withdraw your consent at any time.",
      ],
    },
    {
      heading: "6. Notifications and Communications",
      body: [
        "Rroba may send communications necessary for operating the service, including: account and security communications, marketplace activity, messages, service notices, administrative notices, and promotion or membership confirmations.",
        "Rroba currently provides in-app notification functionality.",
        "Rroba does not claim to provide device push notifications or marketing notification controls unless such functionality is actually implemented in the app.",
      ],
    },
    {
      heading: "7. Service Providers and Data Sharing",
      body: [
        "Rroba uses third-party service providers where necessary to operate the service. These may include:",
        "Supabase — used for database, authentication, and file and image storage.",
        "Lovable / Cloudflare infrastructure — used for application hosting, request processing, and technical and error logging.",
        "Lovable email services — used for primary transactional email processing.",
        "Resend — used for certain transactional and administrative emails.",
        "Email-related logs may include: recipient email address, email template, delivery status, and error information.",
        "These service providers may process personal data only as necessary to provide their services to Rroba and subject to applicable contractual and legal safeguards.",
        "Rroba may also disclose personal data where reasonably necessary to: comply with applicable law, respond to lawful requests, prevent fraud, investigate abuse, protect users, enforce agreements, and establish or defend legal claims.",
        "Rroba does not sell personal data.",
      ],
    },
    {
      heading: "8. Data Retention",
      body: [
        "Rroba retains personal data only for as long as reasonably necessary for the purposes for which it was collected and for applicable legal, security, fraud-prevention or dispute-resolution requirements.",
        "Generally: account information is retained while your account remains active; listings and account-related content are retained while necessary to provide the service; messages are retained while necessary for marketplace and account functionality; promotion, membership and transaction records may be retained where necessary for accounting, fraud prevention or legal obligations; security, email and technical logs may be retained for a limited period appropriate to their operational purpose.",
        "Certain retention periods may depend on third-party service providers used by Rroba.",
        "Where Rroba is legally required to retain specific records after account deletion, only the necessary information will be retained for the required period.",
      ],
    },
    {
      heading: "9. Account Deletion",
      body: [
        "Rroba allows users to initiate deletion of their account directly from within the app. The deletion functionality is available through the account or profile settings.",
        "When deletion is confirmed, the account and associated personal data are deleted immediately and permanently, subject only to information that Rroba is legally required to retain.",
        "The deletion process may include deletion of: profile information, listings, listing images, profile images, messages and conversations, likes and saved items, followers and following relationships, notifications, reports, ratings associated with the account, relevant account-related records, and the authentication account.",
        "Rroba may retain a limited deletion audit record containing information necessary to demonstrate that the deletion request was processed. Such audit information is not publicly available and is used only for compliance and security purposes.",
        "Account deletion is irreversible once completed.",
      ],
    },
    {
      heading: "10. Your Privacy Rights",
      body: [
        "Depending on the law applicable to you, you may have the right to: request access to your personal data; request correction of inaccurate personal data; request deletion of personal data; request restriction of processing; object to certain processing; receive certain personal data in a portable format; withdraw consent where processing is based on consent; and lodge a complaint with a competent data protection authority.",
        "To exercise your rights, contact: hello@rroba.co",
        "We may need to verify your identity before completing certain requests.",
      ],
    },
    {
      heading: "11. Security",
      body: [
        "Rroba uses reasonable technical and organisational measures designed to protect personal data against: unauthorised access, accidental loss, misuse, alteration, disclosure, and destruction.",
        "These measures may include: authentication controls, database access policies, row-level security, restricted access to private information, private storage for protected files, signed access URLs where appropriate, and access controls for service infrastructure.",
        "No online service can guarantee absolute security.",
      ],
    },
    {
      heading: "12. International Data Transfers",
      body: [
        "Some service providers used by Rroba may process personal data in countries other than the country where you live.",
        "Where required by applicable data protection law, Rroba will rely on appropriate safeguards for international transfers, such as recognised contractual safeguards or other lawful transfer mechanisms.",
      ],
    },
    {
      heading: "13. Cookies and Local Storage",
      body: [
        "Rroba may use local storage or similar technologies where necessary for: authentication, maintaining session state, language preferences, and essential application functionality.",
        "Rroba does not currently use advertising cookies or behavioural tracking technologies.",
        "If optional analytics, advertising or marketing technologies are introduced in the future, this Privacy Policy and any legally required consent mechanisms must be updated before such processing begins.",
      ],
    },
    {
      heading: "14. Children and Age Requirements",
      body: [
        "Rroba is intended for users aged 16 or older, unless a different minimum age is required by applicable law in a particular jurisdiction.",
        "Rroba does not knowingly permit persons below the applicable minimum age to use the service.",
        "If we become aware that personal data has been collected from a person who is not legally permitted to use Rroba, we may take reasonable steps to remove the account and associated information.",
      ],
    },
    {
      heading: "15. Changes to This Privacy Policy",
      body: [
        "Rroba may update this Privacy Policy when: new functionality is introduced, data-processing practices change, service providers change, or legal or regulatory requirements change.",
        "If material changes are made, users may be informed through the app, website, email or another appropriate method.",
        "The date at the top of this Privacy Policy indicates when it was last updated.",
      ],
    },
    {
      heading: "16. Contact and Data Controller",
      body: [
        "For questions regarding privacy, personal data or your rights, contact:",
        "Rroba",
        "",
        "Data Controller:",
        "Astrit Hasanaj",
        "",
        "Email: hello@rroba.co",
        "Website: rroba.co",
      ],
    },
  ],
};

const sq: PolicyDoc = {
  title: "Politika e privatësisë",
  updated: "Përditësuar: 6 shtator 2026",
  intro: [
    "Rroba respekton privatësinë tënde dhe është e përkushtuar të mbrojë të dhënat e tua personale.",
    "Kjo Politikë e privatësisë shpjegon çfarë informacioni mbledh Rroba, si dhe pse përdoret, cili informacion mund të jetë i dukshëm për përdoruesit e tjerë, cilët ofrues shërbimi mund ta përpunojnë, sa gjatë ruhet informacioni dhe cilat janë të drejtat e tua.",
    "Rroba përpunon të dhëna personale vetëm për qëllime të lidhura me operimin, sigurinë dhe përmirësimin e tregut, me përmbushjen e detyrimeve ligjore dhe me ofrimin e shërbimeve të kërkuara nga përdoruesit.",
  ],
  sections: [
    {
      heading: "1. Kush është përgjegjës për të dhënat e tua",
      body: [
        "Rroba është përgjegjëse për përpunimin e të dhënave personale të përshkruara në këtë Politikë të privatësisë.",
        "Për kërkesa që lidhen me privatësinë, përfshirë akses, korrigjim, fshirje, kufizim, kundërshtim ose transferim të të dhënave, kontakto: hello@rroba.co",
        "Të dhënat e plota ligjore të kontaktit të kontrolluesit të të dhënave jepen në Seksionin 16 më poshtë.",
      ],
    },
    {
      heading: "2. Informacioni që mbledhim",
      body: [
        "Informacioni i llogarisë dhe i profilit",
        "Kur krijon ose përdor një llogari Rroba, mund të përpunojmë: emrin dhe mbiemrin, emrin e shfaqur, emrin e përdoruesit, adresën e email-it, numrin e telefonit, datën e lindjes, gjininë, qytetin, biografinë, foton e profilit, preferencat e llogarisë, gjuhën, datën e krijimit të llogarisë, pranimin e Kushteve dhe të Politikës së privatësisë, si edhe informacionin e anëtarësimit dhe të kredive.",
        "Kredencialet e autentikimit trajtohen përmes ofruesit tonë të autentikimit. Rroba nuk e ruan fjalëkalimin tënd në formë të lexueshme.",
        "Informacion i caktuar teknik, si user-agent-i ose informacioni i pajisjes, mund të përpunohet gjithashtu për siguri dhe për operimin e shërbimit.",
        "Përmbajtja e tregut",
        "Kur përdor Rroba, mund të përpunojmë: njoftimet, përshkrimet e njoftimeve, çmimet, kategoritë, markat, madhësitë dhe atributet e tjera të njoftimeve, fotot e njoftimeve, të preferuarat dhe njoftimet e ruajtura, ndjekësit dhe ndjekjet, vlerësimet dhe komentet, raportimet, njoftimet në aplikacion, si edhe informacionin nëse një artikull është shënuar si i shitur.",
        "Mesazhet",
        "Mesazhet dhe bisedat mes përdoruesve ruhen në mënyrë që funksionaliteti i mesazheve i Rroba të funksionojë.",
        "Mesazhet nuk janë publikisht të dukshme dhe janë të kufizuara për pjesëmarrësit përkatës të bisedës, përveç kur aksesi është arsyeshëm i nevojshëm për mbështetje të autorizuar, siguri, parandalim të abuzimit, trajtim të mosmarrëveshjeve ose përmbushje të detyrimeve ligjore.",
        "Promovimet, anëtarësimi dhe regjistrat e blerjeve",
        "Rroba aktualisht nuk përpunon dhe nuk ruan informacion të kartave të pagesës.",
        "Kur përdoruesit blejnë promovime, kredi ose shërbime të lidhura me anëtarësimin, Rroba mund të përpunojë: planin ose shërbimin e zgjedhur, çmimin, metodën e zgjedhur të pagesës, referencën e pagesës të futur nga përdoruesi, statusin e konfirmimit dhe regjistrat administrativë të lidhur me transaksionin.",
        "Rroba nuk ruan detaje të plota të kartave të pagesës.",
        "Të dhënat teknike dhe diagnostike",
        "Për të operuar, siguruar dhe diagnostikuar shërbimin, mund të përpunohet informacion i kufizuar teknik, përfshirë: informacionin e shfletuesit dhe të pajisjes, regjistrat e kërkesave, regjistrat e gabimeve, gabimet e aplikacionit, si edhe ngjarjet e autentikimit dhe të sigurisë.",
        "Rroba aktualisht nuk përdor SDK-të e gjurmimit të reklamave, gjurmim të bazuar në IDFA ose analitikë reklamimi behaviorale.",
      ],
    },
    {
      heading: "3. Informacioni i dukshëm për përdoruesit e tjerë",
      body: [
        "Rroba është një treg dhe disa informacione janë qëllimisht publike.",
        "Në varësi të mënyrës si e përdor shërbimin, përdoruesit e tjerë mund të shohin: emrin publik të profilit, emrin e shfaqur, emrin e përdoruesit, foton e profilit, biografinë, qytetin, vlerësimin e profilit, informacionin e krijimit të llogarisë të shfaqur nga shërbimi, njoftimet dhe fotot e tyre, vlerësimet dhe komentet, si edhe marrëdhëniet e ndjekësve dhe të ndjekjeve.",
        "Të dhënat private të llogarisë nuk synohet të jenë publikisht të dukshme. Këto përfshijnë: adresën e email-it, numrin e telefonit, datën e lindjes, gjininë, mesazhet private, informacionin e anëtarësimit dhe të kredive, si edhe informacionin e sigurisë dhe të pajisjes.",
        "Identiteti i blerësit i lidhur me një shitje të përfunduar nuk ekspozohet publikisht përmes të dhënave publike të njoftimeve.",
      ],
    },
    {
      heading: "4. Si i përdorim të dhënat personale",
      body: [
        "Mund t'i përdorim të dhënat personale për të: krijuar dhe administruar llogaritë e përdoruesve; autentikuar përdoruesit; shfaqur profilet publike; publikuar dhe administruar njoftimet; mundësuar komunikimin mes blerësve dhe shitësve; ofruar pëlqime, ruajtje, ndjekës dhe vlerësime; operuar njoftimet brenda aplikacionit; administruar funksionalitetin e promovimeve, kredive ose anëtarësimit; ofruar mbështetje për klientët; hetuar raportimet dhe mosmarrëveshjet; parandaluar mashtrimin, spam-in dhe abuzimin; siguruar llogaritë dhe shërbimin; diagnostikuar problemet teknike; përmirësuar besueshmërinë dhe funksionalitetin; dërguar email-et e nevojshme transaksionale; përmbushur detyrimet ligjore; si edhe krijuar, ushtruar ose mbrojtur pretendime ligjore.",
        "Rroba nuk u shet të dhëna personale reklamuesve, ndërmjetërëve të të dhënave ose palëve të treta të tjera.",
      ],
    },
    {
      heading: "5. Bazat ligjore për përpunimin",
      body: [
        "Kur zbatohet Rregullorja e Përgjithshme për Mbrojtjen e të Dhënave (GDPR) ose legjislacion i ngjashëm i mbrojtjes së të dhënave, Rroba mbështetet në një ose më shumë nga bazat e mëposhtme ligjore:",
        "Përmbushja e një kontrate",
        "Përpunojmë informacionin e nevojshëm për të ofruar shërbimin e Rroba të kërkuar nga ty, përfshirë administrimin e llogarisë, funksionalitetin e tregut dhe komunikimin mes përdoruesve.",
        "Interesat legjitime",
        "Mund të përpunojmë informacion kur është i nevojshëm për interesa legjitime si: ruajtja e sigurisë së shërbimit, parandalimi i mashtrimit dhe i keqpërdorimit, operimi dhe përmirësimi i tregut, hetimi i raportimeve dhe mbrojtja e Rroba dhe e përdoruesve të saj. Ne e vlerësojmë ndikimin në të drejtat e privatësisë së përdoruesve përpara se të mbështetemi në interesa legjitime.",
        "Detyrimet ligjore",
        "Mund të ruajmë ose të zbulojmë informacion kur kërkohet nga ligji i zbatueshëm, rregullorja, urdhri i gjykatës ose kërkesa ligjore e një autoriteti kompetent.",
        "Pëlqimi",
        "Kur pëlqimi kërkohet ligjërisht, do ta kërkojmë atë përpara se të kryhet përpunimi përkatës. Kur përpunimi bazohet në pëlqim, mund ta tërheqësh pëlqimin tënd në çdo kohë.",
      ],
    },
    {
      heading: "6. Njoftimet dhe komunikimet",
      body: [
        "Rroba mund të dërgojë komunikime të nevojshme për operimin e shërbimit, përfshirë: komunikime të llogarisë dhe të sigurisë, aktivitetin e tregut, mesazhet, njoftimet e shërbimit, njoftimet administrative, si edhe konfirmimet e promovimeve ose të anëtarësimit.",
        "Rroba aktualisht ofron funksionalitet njoftimesh brenda aplikacionit.",
        "Rroba nuk pretendon të ofrojë push-notifikime në pajisje ose kontrolle të njoftimeve marketingu, përveç nëse një funksionalitet i tillë është i implementuar realisht në aplikacion.",
      ],
    },
    {
      heading: "7. Ofruesit e shërbimeve dhe ndarja e të dhënave",
      body: [
        "Rroba përdor ofrues shërbimesh të palëve të treta kur është e nevojshme për të operuar shërbimin. Këta mund të përfshijnë:",
        "Supabase — përdoret për bazën e të dhënave, autentikimin dhe ruajtjen e skedarëve dhe fotove.",
        "Infrastruktura Lovable / Cloudflare — përdoret për hostingun e aplikacionit, përpunimin e kërkesave dhe regjistrimin teknik dhe të gabimeve.",
        "Shërbimet e email-it të Lovable — përdoren për përpunimin kryesor të email-eve transaksionale.",
        "Resend — përdoret për disa email-e transaksionale dhe administrative.",
        "Regjistrat e lidhur me email-et mund të përfshijnë: adresën e email-it të marrësit, shabllonin e email-it, statusin e dërgesës dhe informacionin e gabimit.",
        "Këta ofrues shërbimesh mund të përpunojnë të dhëna personale vetëm për aq sa është e nevojshme për t'i ofruar shërbimet e tyre Rroba-s dhe në përputhje me mbrojtjet e zbatueshme kontraktuale dhe ligjore.",
        "Rroba mund të zbulojë gjithashtu të dhëna personale kur është arsyeshëm e nevojshme për të: përmbushur ligjin e zbatueshëm, u përgjigjur kërkesave ligjore, parandaluar mashtrimin, hetuar abuzimin, mbrojtur përdoruesit, zbatuar marrëveshjet dhe krijuar ose mbrojtur pretendime ligjore.",
        "Rroba nuk shet të dhëna personale.",
      ],
    },
    {
      heading: "8. Ruajtja e të dhënave",
      body: [
        "Rroba i ruan të dhënat personale vetëm për aq kohë sa është arsyeshëm e nevojshme për qëllimet për të cilat janë mbledhur dhe për kërkesat e zbatueshme ligjore, të sigurisë, të parandalimit të mashtrimit ose të zgjidhjes së mosmarrëveshjeve.",
        "Në përgjithësi: informacioni i llogarisë ruhet për sa kohë llogaria mbetet aktive; njoftimet dhe përmbajtja e lidhur me llogarinë ruhen për aq sa është e nevojshme për të ofruar shërbimin; mesazhet ruhen për aq sa është e nevojshme për funksionalitetin e tregut dhe të llogarisë; regjistrat e promovimeve, të anëtarësimit dhe të transaksioneve mund të ruhen kur është e nevojshme për kontabilitet, parandalim mashtrimi ose detyrime ligjore; regjistrat e sigurisë, të email-eve dhe teknikë mund të ruhen për një periudhë të kufizuar të përshtatshme për qëllimin e tyre operativ.",
        "Disa periudha ruajtjeje mund të varen nga ofruesit e shërbimeve të palëve të treta të përdorur nga Rroba.",
        "Kur Rroba-s i kërkohet ligjërisht të ruajë regjistra specifikë pas fshirjes së llogarisë, do të ruhet vetëm informacioni i nevojshëm për periudhën e kërkuar.",
      ],
    },
    {
      heading: "9. Fshirja e llogarisë",
      body: [
        "Rroba u lejon përdoruesve të inicojnë fshirjen e llogarisë së tyre drejtpërdrejt brenda aplikacionit. Funksionaliteti i fshirjes është i disponueshëm përmes cilësimeve të llogarisë ose të profilit.",
        "Kur fshirja konfirmohet, llogaria dhe të dhënat personale të lidhura fshihen menjëherë dhe përgjithmonë, me përjashtim të informacionit që Rroba-s i kërkohet ligjërisht ta ruajë.",
        "Procesi i fshirjes mund të përfshijë fshirjen e: informacionit të profilit, njoftimeve, fotove të njoftimeve, fotove të profilit, mesazheve dhe bisedave, pëlqimeve dhe artikujve të ruajtur, marrëdhënieve të ndjekësve dhe të ndjekjeve, njoftimeve, raportimeve, vlerësimeve të lidhura me llogarinë, regjistrave përkatëse të lidhura me llogarinë, si edhe llogarisë së autentikimit.",
        "Rroba mund të ruajë një regjistër të kufizuar auditimi të fshirjes që përmban informacionin e nevojshëm për të demonstruar se kërkesa për fshirje është përpunuar. Ky informacion auditimi nuk është publikisht i disponueshëm dhe përdoret vetëm për qëllime përputhshmërie dhe sigurie.",
        "Fshirja e llogarisë është e pakthyeshme pasi të përfundojë.",
      ],
    },
    {
      heading: "10. Të drejtat e tua të privatësisë",
      body: [
        "Në varësi të ligjit që të zbatohet, mund të kesh të drejtë të: kërkosh akses në të dhënat e tua personale; kërkosh korrigjim të të dhënave personale të pasakta; kërkosh fshirje të të dhënave personale; kërkosh kufizim të përpunimit; kundërshtosh përpunim të caktuar; marrësh të dhëna të caktuara personale në format të transferueshëm; tërheqësh pëlqimin kur përpunimi bazohet në pëlqim; si edhe të paraqesësh ankesë pranë një autoriteti kompetent të mbrojtjes së të dhënave.",
        "Për t'i ushtruar të drejtat e tua, kontakto: hello@rroba.co",
        "Mund të jetë e nevojshme të verifikojmë identitetin tënd përpara se të plotësojmë disa kërkesa.",
      ],
    },
    {
      heading: "11. Siguria",
      body: [
        "Rroba përdor masa të arsyeshme teknike dhe organizative të krijuara për të mbrojtur të dhënat personale nga: aksesi i paautorizuar, humbja aksidentale, keqpërdorimi, ndryshimi, zbulimi dhe shkatërrimi.",
        "Këto masa mund të përfshijnë: kontrollet e autentikimit, politikat e aksesit në bazën e të dhënave, sigurinë në nivel rreshti, aksesin e kufizuar në informacionin privat, ruajtjen private për skedarët e mbrojtur, URL-të e nënshkruara të aksesit kur është e përshtatshme, si edhe kontrollet e aksesit për infrastrukturën e shërbimit.",
        "Asnjë shërbim online nuk mund të garantojë siguri absolute.",
      ],
    },
    {
      heading: "12. Transferimet ndërkombëtare të të dhënave",
      body: [
        "Disa ofrues shërbimesh të përdorur nga Rroba mund të përpunojnë të dhëna personale në vende të tjera nga vendi ku jeton.",
        "Kur kërkohet nga ligji i zbatueshëm i mbrojtjes së të dhënave, Rroba do të mbështetet në mbrojtje të përshtatshme për transferimet ndërkombëtare, si mbrojtjet e njohura kontraktuale ose mekanizma të tjerë ligjorë transferimi.",
      ],
    },
    {
      heading: "13. Cookies dhe ruajtja lokale",
      body: [
        "Rroba mund të përdorë ruajtje lokale ose teknologji të ngjashme kur është e nevojshme për: autentikimin, ruajtjen e gjendjes së sesionit, preferencat e gjuhës dhe funksionalitetin thelbësor të aplikacionit.",
        "Rroba aktualisht nuk përdor cookies reklamimi ose teknologji gjurmimi behaviorale.",
        "Nëse në të ardhmen futen teknologji opsionale analitike, reklamimi ose marketingu, kjo Politikë e privatësisë dhe çdo mekanizëm pëlqimi i kërkuar ligjërisht duhet të përditësohen përpara se të fillojë një përpunim i tillë.",
      ],
    },
    {
      heading: "14. Fëmijët dhe kërkesat e moshës",
      body: [
        "Rroba është e menduar për përdorues 16 vjeç e lart, përveç nëse një moshë minimale tjetër kërkohet nga ligji i zbatueshëm në një juridiksion të caktuar.",
        "Rroba nuk lejon me dijeni persona nën moshën minimale të zbatueshme të përdorin shërbimin.",
        "Nëse mësojmë se janë mbledhur të dhëna personale nga një person që nuk i lejohet ligjërisht të përdorë Rroba, mund të ndërmarrim hapa të arsyeshëm për të hequr llogarinë dhe informacionin e lidhur.",
      ],
    },
    {
      heading: "15. Ndryshimet në këtë Politikë të privatësisë",
      body: [
        "Rroba mund ta përditësojë këtë Politikë të privatësisë kur: futet funksionalitet i ri, ndryshojnë praktikat e përpunimit të të dhënave, ndryshojnë ofruesit e shërbimeve ose ndryshojnë kërkesat ligjore apo rregullatore.",
        "Nëse bëhen ndryshime thelbësore, përdoruesit mund të informohen përmes aplikacionit, faqes së internetit, email-it ose një metode tjetër të përshtatshme.",
        "Data në krye të kësaj Politike të privatësisë tregon se kur është përditësuar për herë të fundit.",
      ],
    },
    {
      heading: "16. Kontakti dhe kontrolluesi i të dhënave",
      body: [
        "Për pyetje lidhur me privatësinë, të dhënat personale ose të drejtat e tua, kontakto:",
        "Rroba",
        "",
        "Kontrolluesi i të dhënave:",
        "Astrit Hasanaj",
        "",
        "Email: hello@rroba.co",
        "Faqja e internetit: rroba.co",
      ],
    },
  ],
};

export const PRIVACY_POLICY: Record<"sq" | "en", PolicyDoc> = { sq, en };
