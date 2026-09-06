// Bilingual Terms of Service content for Rroba.
// Written to match functionality that actually exists in the app today.

export type TermsSection = { heading: string; body: string[] };
export type TermsDoc = {
  title: string;
  updated: string;
  intro: string[];
  sections: TermsSection[];
};

const en: TermsDoc = {
  title: "Terms of Service",
  updated: "Last updated: 6 September 2026",
  intro: [
    "Welcome to Rroba.",
    "These Terms of Service (“Terms”) govern your access to and use of the Rroba marketplace, website and related services (“Rroba” or the “Service”).",
    "By creating an account or using Rroba, you agree to these Terms. If you do not agree, you must not use the Service.",
  ],
  sections: [
    {
      heading: "1. About Rroba",
      body: [
        "Rroba provides an online marketplace where users can discover, list and communicate about second-hand and other permitted items.",
        "Unless expressly stated otherwise, Rroba is not the buyer, seller or owner of items listed by users and is not a party to transactions agreed directly between users.",
        "Users are responsible for their own listings, communications and transactions.",
        "Full operator and contact information is provided in Section 20.",
      ],
    },
    {
      heading: "2. Eligibility",
      body: [
        "You must be at least 16 years old to use Rroba, unless applicable law requires a higher minimum age.",
        "By creating an account, you confirm that: the information you provide is accurate; you are legally permitted to use the Service; and you have the legal capacity required for the activities you perform through Rroba.",
        "You may not create an account using false or misleading information.",
      ],
    },
    {
      heading: "3. User Accounts",
      body: [
        "You are responsible for: keeping your account information accurate; maintaining the confidentiality of your login credentials; activity performed through your account; and notifying Rroba if you believe your account has been compromised.",
        "You must not: impersonate another person; create accounts for fraudulent purposes; sell or transfer your account without permission; or attempt to bypass account restrictions or suspensions.",
        "Rroba may restrict, suspend or terminate accounts that violate these Terms or applicable law.",
      ],
    },
    {
      heading: "4. Listings",
      body: [
        "Users may publish listings for items permitted on Rroba.",
        "When creating a listing, you are responsible for ensuring that: you have the legal right to sell the item; the description is accurate and not misleading; photographs reasonably represent the actual item; the price and relevant characteristics are stated correctly; and the item complies with applicable laws and with these Terms.",
        "You must not deliberately conceal material defects or provide false information about authenticity, condition, origin or ownership.",
      ],
    },
    {
      heading: "5. Prohibited Items",
      body: [
        "You must not list, sell, promote or request items that are illegal or prohibited by Rroba.",
        "This includes, where applicable: stolen goods; counterfeit or replica goods presented as genuine; illegal drugs or controlled substances; weapons or prohibited weapon-related items; dangerous or illegal products; sexually explicit or prohibited adult content; items that infringe intellectual property rights; goods whose sale is prohibited by applicable law; and items that Rroba reasonably determines create a safety, fraud or legal risk.",
        "Rroba may remove prohibited listings without prior notice.",
      ],
    },
    {
      heading: "6. Counterfeit and Stolen Goods",
      body: [
        "Counterfeit and stolen goods are strictly prohibited.",
        "Sellers are responsible for ensuring that they have the right to sell an item and that claims regarding brands and authenticity are accurate.",
        "Rroba may: remove suspected counterfeit or stolen listings; request additional information; restrict the seller’s account; and cooperate with rights holders or authorities where legally required.",
        "Repeated or serious violations may result in permanent account suspension.",
      ],
    },
    {
      heading: "7. User Conduct",
      body: [
        "You must not use Rroba to: commit fraud; threaten, harass or abuse other users; send spam; publish discriminatory, hateful or unlawful content; mislead buyers or sellers; manipulate ratings or reviews; attempt to access another user’s account; interfere with the technical operation of the Service; scrape or systematically collect data without permission; distribute malware or harmful code; or use the Service for unlawful purposes.",
      ],
    },
    {
      heading: "8. Messages and Communication",
      body: [
        "Rroba allows users to communicate through the Service.",
        "Users are responsible for the content of their communications.",
        "Do not send: threats; harassment; spam; fraudulent requests; unlawful content; or sensitive financial credentials.",
        "Rroba may investigate reported conversations where reasonably necessary for moderation, safety, fraud prevention or legal compliance.",
      ],
    },
    {
      heading: "9. Reports and Moderation",
      body: [
        "Rroba provides functionality that allows users to report listings or users.",
        "Rroba may review reported content and take action including: removing listings; removing content; issuing warnings; limiting functionality; temporarily suspending accounts; or permanently terminating accounts.",
        "Rroba is not required to permit content that violates these Terms, even if the content is otherwise lawful.",
        "Rroba may also act where reasonably necessary to protect users, the Service or third parties.",
      ],
    },
    {
      heading: "10. Transactions Between Users",
      body: [
        "Unless Rroba expressly states otherwise for a specific transaction, purchase and sale agreements are made directly between buyer and seller.",
        "The seller is responsible for: ownership of the item; accuracy of the listing; condition and authenticity; agreed delivery or handover; and compliance with applicable law.",
        "The buyer is responsible for: reviewing the listing; asking necessary questions; confirming relevant details before purchasing; and fulfilling agreed payment obligations.",
        "Users should exercise reasonable caution when dealing with other users.",
      ],
    },
    {
      heading: "11. Private Sellers and Professional Sellers",
      body: [
        "Consumer rights may differ depending on whether the seller is acting as a private individual or as a trader/business.",
        "Where required by applicable law, Rroba may identify or require sellers to identify whether they act as a private seller or professional trader.",
        "Purchases from private individuals may not benefit from the same statutory consumer rights that apply when purchasing from a professional trader.",
        "Professional sellers are responsible for complying with all consumer-protection, disclosure, return, warranty, tax and other obligations that apply to them.",
      ],
    },
    {
      heading: "12. Payments, Promotions and Membership",
      body: [
        "Rroba may offer paid features such as: listing promotion; credits; membership features; and other optional services.",
        "The price and relevant conditions will be displayed before purchase.",
        "Rroba currently does not store full payment-card information.",
        "Where payment is arranged manually or through an external payment method, users are responsible for ensuring that the payment details and references they provide are correct.",
        "Paid promotion or membership services do not guarantee that an item will be sold or that a specific level of traffic, views or engagement will be achieved.",
      ],
    },
    {
      heading: "13. Returns, Refunds and Disputes",
      body: [
        "Rroba does not provide integrated shipping, escrow, buyer protection or a platform-managed refund or return system, and does not automatically manage returns or refunds for transactions made directly between users.",
        "Buyers and sellers are primarily responsible for resolving transaction-related disagreements between themselves.",
        "Where applicable consumer law gives a buyer mandatory rights against a professional seller, those rights are not affected by these Terms.",
        "Rroba may provide support or investigate reports, but this does not mean that Rroba becomes a party to the underlying transaction.",
      ],
    },
    {
      heading: "14. Ratings and Reviews",
      body: [
        "Users may be able to leave ratings or reviews following eligible interactions.",
        "Ratings and reviews must: reflect genuine experiences; not contain threats or harassment; not be fraudulent or manipulated; and not be submitted to damage another user’s reputation without legitimate basis.",
        "Rroba may remove ratings or reviews that violate these Terms.",
      ],
    },
    {
      heading: "15. Intellectual Property",
      body: [
        "Users retain ownership of content they create and upload, subject to the rights necessary for Rroba to operate the Service.",
        "By uploading listings, photographs, descriptions or other content, you grant Rroba a non-exclusive, worldwide, royalty-free licence to host, store, reproduce, display and technically process that content as necessary to: operate the Service; display your listings; provide marketplace functionality; moderate content; and promote Rroba and its listings where appropriate.",
        "You must have the necessary rights to any content you upload.",
        "You may not upload content that infringes another person’s intellectual property rights.",
      ],
    },
    {
      heading: "16. Privacy",
      body: [
        "Use of personal data is governed by the Rroba Privacy Policy.",
        "The Privacy Policy is available through the app and at: rroba.co/privacy",
        "By using Rroba, you acknowledge that personal data will be processed as described in the Privacy Policy.",
      ],
    },
    {
      heading: "17. Account Suspension and Termination",
      body: [
        "You may stop using Rroba at any time and may delete your account through the functionality provided in the app.",
        "Rroba may restrict or terminate access where reasonably necessary, including where: these Terms are violated; fraudulent or illegal activity is suspected; another user’s safety is at risk; prohibited goods are listed; an account repeatedly violates marketplace rules; or Rroba is legally required to act.",
        "Where appropriate and legally required, users may be informed of the reason for enforcement action.",
      ],
    },
    {
      heading: "18. Availability and Disclaimer",
      body: [
        "Rroba aims to provide a reliable and secure marketplace, but does not guarantee that the Service will always be uninterrupted, error-free or available.",
        "To the extent permitted by law, Rroba does not guarantee: the quality or authenticity of user-listed goods; that users will complete transactions; that listings will result in sales; the conduct of other users; or that all user-provided information is accurate.",
        "Nothing in these Terms excludes rights or protections that cannot legally be excluded.",
      ],
    },
    {
      heading: "19. Limitation of Liability",
      body: [
        "To the extent permitted by applicable law, Rroba is not responsible for indirect, incidental or consequential losses resulting from: transactions between users; user-generated content; actions of other users; unauthorised use of an account; or temporary service interruptions.",
        "Nothing in these Terms limits liability where limitation is prohibited by law, including liability for fraud, wilful misconduct or other liability that cannot legally be excluded.",
      ],
    },
    {
      heading: "20. Contact and Service Operator",
      body: [
        "For questions about these Terms or Rroba, contact:",
        "Rroba",
        "",
        "Service Operator:",
        "Astrit Hasanaj",
        "Konows gate 8A",
        "0192 Oslo",
        "Norway",
        "",
        "Email: hello@rroba.co",
        "Website: rroba.co",
      ],
    },
    {
      heading: "21. Changes to These Terms",
      body: [
        "Rroba may update these Terms when: the Service changes; new functionality is introduced; legal requirements change; or marketplace or safety rules are updated.",
        "Material changes may be communicated through the app, website, email or another appropriate method.",
        "The latest version will always display the date it was last updated.",
        "Continued use after changes take effect constitutes acceptance where permitted by applicable law.",
      ],
    },
    {
      heading: "22. Governing Law",
      body: [
        "These Terms are governed by applicable Norwegian law, without limiting any mandatory consumer rights that may apply to users under the laws of their country of residence.",
        "Any disputes should first be raised with Rroba at: hello@rroba.co",
        "Nothing in this section removes any mandatory right a consumer may have to bring a claim before a competent court or authority under applicable law.",
      ],
    },
  ],
};

const sq: TermsDoc = {
  title: "Kushtet e shërbimit",
  updated: "Përditësuar së fundmi: 6 shtator 2026",
  intro: [
    "Mirë se erdhe në Rroba.",
    "Këto Kushte të shërbimit (“Kushtet”) rregullojnë qasjen dhe përdorimin tënd të tregut Rroba, faqes së internetit dhe shërbimeve të lidhura (“Rroba” ose “Shërbimi”).",
    "Duke krijuar një llogari ose duke përdorur Rroba, ti pranon këto Kushte. Nëse nuk pajtohesh, nuk duhet ta përdorësh Shërbimin.",
  ],
  sections: [
    {
      heading: "1. Rreth Rroba",
      body: [
        "Rroba ofron një treg online ku përdoruesit mund të zbulojnë, publikojnë dhe komunikojnë për artikuj të përdorur dhe artikuj të tjerë të lejuar.",
        "Përveç nëse thuhet shprehimisht ndryshe, Rroba nuk është blerësi, shitësi ose pronari i artikujve të publikuar nga përdoruesit dhe nuk është palë në transaksionet e rëna dakord drejtpërdrejt mes përdoruesve.",
        "Përdoruesit janë përgjegjës për artikujt, komunikimet dhe transaksionet e tyre.",
        "Informacioni i plotë i operatorit dhe kontaktit jepet në Seksionin 20.",
      ],
    },
    {
      heading: "2. Kushtet e pranueshmërisë",
      body: [
        "Duhet të jesh të paktën 16 vjeç për të përdorur Rroba, përveç nëse ligji i zbatueshëm kërkon një moshë minimale më të lartë.",
        "Duke krijuar një llogari, ti konfirmon se: informacioni që jep është i saktë; të lejohet ligjërisht të përdorësh Shërbimin; dhe ke zotësinë ligjore të nevojshme për veprimtaritë që kryen përmes Rroba.",
        "Nuk lejohet të krijosh llogari me informacion të rremë ose mashtrues.",
      ],
    },
    {
      heading: "3. Llogaritë e përdoruesve",
      body: [
        "Ti je përgjegjës për: mbajtjen e saktë të informacionit të llogarisë; ruajtjen e konfidencialitetit të kredencialeve të hyrjes; veprimtarinë e kryer përmes llogarisë sate; dhe njoftimin e Rroba nëse beson se llogaria jote është komprometuar.",
        "Nuk lejohet të: imitosh një person tjetër; krijosh llogari për qëllime mashtruese; shesësh ose transferosh llogarinë tënde pa leje; ose të tentosh të anashkalosh kufizimet apo pezullimet e llogarisë.",
        "Rroba mund të kufizojë, pezullojë ose mbyllë llogaritë që shkelin këto Kushte ose ligjin e zbatueshëm.",
      ],
    },
    {
      heading: "4. Artikujt e publikuar",
      body: [
        "Përdoruesit mund të publikojnë artikuj që lejohen në Rroba.",
        "Kur krijon një artikull, je përgjegjës të sigurosh që: ke të drejtën ligjore ta shesësh artikullin; përshkrimi është i saktë dhe jo mashtrues; fotografitë e paraqesin në mënyrë të arsyeshme artikullin real; çmimi dhe karakteristikat përkatëse janë të deklaruara saktë; dhe artikulli është në përputhje me ligjet e zbatueshme dhe me këto Kushte.",
        "Nuk lejohet të fshehësh qëllimisht defekte thelbësore ose të japësh informacion të rremë për origjinalitetin, gjendjen, origjinën apo pronësinë.",
      ],
    },
    {
      heading: "5. Artikujt e ndaluar",
      body: [
        "Nuk lejohet të publikosh, shesësh, promovosh ose kërkosh artikuj që janë të paligjshëm ose të ndaluar nga Rroba.",
        "Kjo përfshin, sipas rastit: mallra të vjedhura; mallra të falsifikuara ose replika të paraqitura si origjinale; droga të paligjshme ose substanca të kontrolluara; armë ose artikuj të ndaluar që lidhen me armët; produkte të rrezikshme ose të paligjshme; përmbajtje seksualisht eksplicite ose përmbajtje të ndaluar për të rritur; artikuj që shkelin të drejtat e pronësisë intelektuale; mallra shitja e të cilëve ndalohet nga ligji i zbatueshëm; dhe artikuj për të cilët Rroba vlerëson në mënyrë të arsyeshme se krijojnë rrezik sigurie, mashtrimi ose ligjor.",
        "Rroba mund t’i heqë artikujt e ndaluar pa njoftim paraprak.",
      ],
    },
    {
      heading: "6. Mallrat e falsifikuara dhe të vjedhura",
      body: [
        "Mallrat e falsifikuara dhe të vjedhura janë rreptësisht të ndaluara.",
        "Shitësit janë përgjegjës të sigurojnë se kanë të drejtën të shesin një artikull dhe se pretendimet për markat dhe origjinalitetin janë të sakta.",
        "Rroba mund të: heqë artikujt e dyshuar si të falsifikuar ose të vjedhur; kërkojë informacion shtesë; kufizojë llogarinë e shitësit; dhe të bashkëpunojë me mbajtësit e të drejtave ose autoritetet kur kërkohet ligjërisht.",
        "Shkeljet e përsëritura ose serioze mund të çojnë në pezullim të përhershëm të llogarisë.",
      ],
    },
    {
      heading: "7. Sjellja e përdoruesit",
      body: [
        "Nuk lejohet ta përdorësh Rroba për të: kryer mashtrim; kërcënuar, ngacmuar ose abuzuar përdorues të tjerë; dërguar spam; publikuar përmbajtje diskriminuese, urrejtjeje ose të paligjshme; mashtruar blerës ose shitës; manipuluar vlerësimet ose recensionet; tentuar qasje në llogarinë e një përdoruesi tjetër; ndërhyrë në funksionimin teknik të Shërbimit; nxjerrë ose mbledhur sistematikisht të dhëna pa leje; shpërndarë malware ose kod të dëmshëm; ose për qëllime të paligjshme.",
      ],
    },
    {
      heading: "8. Mesazhet dhe komunikimi",
      body: [
        "Rroba u lejon përdoruesve të komunikojnë përmes Shërbimit.",
        "Përdoruesit janë përgjegjës për përmbajtjen e komunikimeve të tyre.",
        "Mos dërgo: kërcënime; ngacmime; spam; kërkesa mashtruese; përmbajtje të paligjshme; ose kredenciale financiare të ndjeshme.",
        "Rroba mund të hetojë bisedat e raportuara kur është e nevojshme në mënyrë të arsyeshme për moderim, siguri, parandalim mashtrimi ose përmbushje ligjore.",
      ],
    },
    {
      heading: "9. Raportimet dhe moderimi",
      body: [
        "Rroba ofron funksionalitet që u lejon përdoruesve të raportojnë artikuj ose përdorues.",
        "Rroba mund të shqyrtojë përmbajtjen e raportuar dhe të ndërmarrë veprime, përfshirë: heqjen e artikujve; heqjen e përmbajtjes; dhënien e paralajmërimeve; kufizimin e funksionalitetit; pezullimin e përkohshëm të llogarive; ose mbylljen e përhershme të llogarive.",
        "Rroba nuk është e detyruar të lejojë përmbajtje që shkel këto Kushte, edhe nëse përmbajtja është ndryshe e ligjshme.",
        "Rroba mund të veprojë gjithashtu kur është e nevojshme në mënyrë të arsyeshme për të mbrojtur përdoruesit, Shërbimin ose palët e treta.",
      ],
    },
    {
      heading: "10. Transaksionet mes përdoruesve",
      body: [
        "Përveç nëse Rroba deklaron shprehimisht ndryshe për një transaksion të caktuar, marrëveshjet e blerjes dhe shitjes lidhen drejtpërdrejt mes blerësit dhe shitësit.",
        "Shitësi është përgjegjës për: pronësinë e artikullit; saktësinë e artikullit të publikuar; gjendjen dhe origjinalitetin; dorëzimin ose shkëmbimin e rënë dakord; dhe përputhshmërinë me ligjin e zbatueshëm.",
        "Blerësi është përgjegjës për: shqyrtimin e artikullit; bërjen e pyetjeve të nevojshme; konfirmimin e detajeve përkatëse para blerjes; dhe përmbushjen e detyrimeve të rëna dakord të pagesës.",
        "Përdoruesit duhet të tregojnë kujdes të arsyeshëm kur bashkëveprojnë me përdorues të tjerë.",
      ],
    },
    {
      heading: "11. Shitësit privatë dhe shitësit profesionistë",
      body: [
        "Të drejtat e konsumatorit mund të ndryshojnë në varësi të faktit nëse shitësi vepron si individ privat apo si tregtar/biznes.",
        "Kur kërkohet nga ligji i zbatueshëm, Rroba mund të identifikojë ose t’u kërkojë shitësve të identifikojnë nëse veprojnë si shitës privatë apo si tregtarë profesionistë.",
        "Blerjet nga individë privatë mund të mos përfitojnë nga të njëjtat të drejta ligjore të konsumatorit që zbatohen kur blihet nga një tregtar profesionist.",
        "Shitësit profesionistë janë përgjegjës për përmbushjen e të gjitha detyrimeve për mbrojtjen e konsumatorit, informimin, kthimet, garancinë, taksat dhe detyrimeve të tjera që u zbatohen.",
      ],
    },
    {
      heading: "12. Pagesat, promovimet dhe anëtarësimi",
      body: [
        "Rroba mund të ofrojë veçori me pagesë si: promovim i artikujve; kredite; veçori anëtarësimi; dhe shërbime të tjera opsionale.",
        "Çmimi dhe kushtet përkatëse shfaqen para blerjes.",
        "Rroba aktualisht nuk ruan informacionin e plotë të kartës së pagesës.",
        "Kur pagesa organizohet manualisht ose përmes një metode të jashtme pagese, përdoruesit janë përgjegjës të sigurojnë që detajet dhe referencat e pagesës që japin janë të sakta.",
        "Shërbimet me pagesë të promovimit ose anëtarësimit nuk garantojnë se një artikull do të shitet ose se do të arrihet një nivel i caktuar trafiku, shikimesh apo ndërveprimi.",
      ],
    },
    {
      heading: "13. Kthimet, rimbursimet dhe mosmarrëveshjet",
      body: [
        "Rroba nuk ofron transport të integruar, escrow, mbrojtje blerësi ose një sistem rimbursimi apo kthimi të menaxhuar nga platforma, dhe nuk menaxhon automatikisht kthimet ose rimbursimet për transaksionet e bëra drejtpërdrejt mes përdoruesve.",
        "Blerësit dhe shitësit janë kryesisht përgjegjës për zgjidhjen mes tyre të mosmarrëveshjeve që lidhen me transaksionin.",
        "Kur ligji i zbatueshëm i konsumatorit i jep blerësit të drejta të detyrueshme ndaj një shitësi profesionist, këto të drejta nuk preken nga këto Kushte.",
        "Rroba mund të ofrojë mbështetje ose të hetojë raportimet, por kjo nuk do të thotë se Rroba bëhet palë në transaksionin themelor.",
      ],
    },
    {
      heading: "14. Vlerësimet dhe recensionet",
      body: [
        "Përdoruesit mund të kenë mundësi të lënë vlerësime ose recensione pas ndërveprimeve të pranueshme.",
        "Vlerësimet dhe recensionet duhet të: pasqyrojnë përvoja të vërteta; të mos përmbajnë kërcënime ose ngacmime; të mos jenë mashtruese ose të manipuluara; dhe të mos dërgohen për të dëmtuar reputacionin e një përdoruesi tjetër pa bazë legjitime.",
        "Rroba mund të heqë vlerësimet ose recensionet që shkelin këto Kushte.",
      ],
    },
    {
      heading: "15. Pronësia intelektuale",
      body: [
        "Përdoruesit ruajnë pronësinë mbi përmbajtjen që krijojnë dhe ngarkojnë, në varësi të të drejtave të nevojshme që Rroba të operojë Shërbimin.",
        "Duke ngarkuar artikuj, fotografi, përshkrime ose përmbajtje tjetër, ti i jep Rroba një licencë jo-ekskluzive, botërore dhe pa pagesë për të pritur, ruajtur, riprodhuar, shfaqur dhe përpunuar teknikisht atë përmbajtje sa është e nevojshme për të: operuar Shërbimin; shfaqur artikujt e tu; ofruar funksionalitetin e tregut; moderuar përmbajtjen; dhe promovuar Rroba dhe artikujt e saj kur është e përshtatshme.",
        "Duhet të kesh të drejtat e nevojshme për çdo përmbajtje që ngarkon.",
        "Nuk lejohet të ngarkosh përmbajtje që shkel të drejtat e pronësisë intelektuale të një personi tjetër.",
      ],
    },
    {
      heading: "16. Privatësia",
      body: [
        "Përdorimi i të dhënave personale rregullohet nga Politika e privatësisë e Rroba.",
        "Politika e privatësisë është e disponueshme përmes aplikacionit dhe në: rroba.co/privacy",
        "Duke përdorur Rroba, ti pranon se të dhënat personale do të përpunohen siç përshkruhet në Politikën e privatësisë.",
      ],
    },
    {
      heading: "17. Pezullimi dhe mbyllja e llogarisë",
      body: [
        "Mund të ndalosh përdorimin e Rroba në çdo kohë dhe mund ta fshish llogarinë tënde përmes funksionalitetit të ofruar në aplikacion.",
        "Rroba mund të kufizojë ose ndërpresë qasjen kur është e nevojshme në mënyrë të arsyeshme, përfshirë kur: shkelen këto Kushte; dyshohet veprimtari mashtruese ose e paligjshme; rrezikohet siguria e një përdoruesi tjetër; publikohen mallra të ndaluara; një llogari shkel vazhdimisht rregullat e tregut; ose Rroba detyrohet ligjërisht të veprojë.",
        "Kur është e përshtatshme dhe kërkohet ligjërisht, përdoruesit mund të informohen për arsyen e masës së marrë.",
      ],
    },
    {
      heading: "18. Disponueshmëria dhe mohimi i përgjegjësisë",
      body: [
        "Rroba synon të ofrojë një treg të besueshëm dhe të sigurt, por nuk garanton që Shërbimi do të jetë gjithmonë i pandërprerë, pa gabime ose i disponueshëm.",
        "Në masën e lejuar nga ligji, Rroba nuk garanton: cilësinë ose origjinalitetin e mallrave të publikuara nga përdoruesit; që përdoruesit do t’i përfundojnë transaksionet; që artikujt do të rezultojnë në shitje; sjelljen e përdoruesve të tjerë; ose që i gjithë informacioni i dhënë nga përdoruesit është i saktë.",
        "Asgjë në këto Kushte nuk përjashton të drejtat ose mbrojtjet që nuk mund të përjashtohen ligjërisht.",
      ],
    },
    {
      heading: "19. Kufizimi i përgjegjësisë",
      body: [
        "Në masën e lejuar nga ligji i zbatueshëm, Rroba nuk është përgjegjëse për humbje indirekte, rastësore ose pasojë që rrjedhin nga: transaksionet mes përdoruesve; përmbajtja e krijuar nga përdoruesit; veprimet e përdoruesve të tjerë; përdorimi i paautorizuar i një llogarie; ose ndërprerjet e përkohshme të shërbimit.",
        "Asgjë në këto Kushte nuk kufizon përgjegjësinë kur kufizimi ndalohet nga ligji, përfshirë përgjegjësinë për mashtrim, sjellje të qëllimshme të gabuar ose përgjegjësi tjetër që nuk mund të përjashtohet ligjërisht.",
      ],
    },
    {
      heading: "20. Kontakti dhe operatori i shërbimit",
      body: [
        "Për pyetje rreth këtyre Kushteve ose Rroba, kontakto:",
        "Rroba",
        "",
        "Operatori i shërbimit:",
        "Astrit Hasanaj",
        "Konows gate 8A",
        "0192 Oslo",
        "Norvegji",
        "",
        "Email: hello@rroba.co",
        "Faqja e internetit: rroba.co",
      ],
    },
    {
      heading: "21. Ndryshimet në këto Kushte",
      body: [
        "Rroba mund t’i përditësojë këto Kushte kur: ndryshon Shërbimi; futet funksionalitet i ri; ndryshojnë kërkesat ligjore; ose përditësohen rregullat e tregut apo të sigurisë.",
        "Ndryshimet thelbësore mund të komunikohen përmes aplikacionit, faqes së internetit, email-it ose një metode tjetër të përshtatshme.",
        "Versioni më i fundit do të shfaqë gjithmonë datën e përditësimit të fundit.",
        "Vazhdimi i përdorimit pasi ndryshimet hyjnë në fuqi përbën pranim, kur lejohet nga ligji i zbatueshëm.",
      ],
    },
    {
      heading: "22. Ligji i zbatueshëm",
      body: [
        "Këto Kushte rregullohen nga ligji i zbatueshëm norvegjez, pa kufizuar të drejtat e detyrueshme të konsumatorit që mund të zbatohen për përdoruesit sipas ligjeve të vendit të tyre të banimit.",
        "Çdo mosmarrëveshje duhet ngritur së pari me Rroba në: hello@rroba.co",
        "Asgjë në këtë seksion nuk heq asnjë të drejtë të detyrueshme që një konsumator mund të ketë për të paraqitur një pretendim para një gjykate ose autoriteti kompetent sipas ligjit të zbatueshëm.",
      ],
    },
  ],
};

export const TERMS_OF_SERVICE: Record<"sq" | "en", TermsDoc> = { sq, en };
