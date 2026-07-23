// Albanian translations (default / fallback).
// Keys are stable identifiers. Add new keys here first, then mirror in en.ts.

export const sq = {
  common: {
    back: "Kthehu",
    save: "Ruaj",
    cancel: "Anulo",
    delete: "Fshij",
    edit: "Ndrysho",
    close: "Mbyll",
    confirm: "Konfirmo",
    ok: "OK",
    yes: "Po",
    no: "Jo",
    loading: "Duke ngarkuar…",
    retry: "Provo përsëri",
    search: "Kërko",
    seeAll: "Shiko të gjitha",
    apply: "Apliko",
    reset: "Rivendos",
    next: "Vazhdo",
    back_home: "Kthehu në ballinë",
  },

  root: {
    notFoundTitle: "Faqja nuk u gjet",
    notFoundBody: "Faqja që po kërkon nuk ekziston ose është zhvendosur.",
    errorTitle: "Kjo faqe nuk u ngarkua",
    errorBody: "Diçka shkoi keq nga ana jonë. Provo ta rifreskosh ose kthehu në ballinë.",
  },

  settings: {
    title: "Cilësimet",
    section_account: "Llogaria",
    section_preferences: "Preferencat",
    section_help: "Ndihmë",
    section_other: "Tjetër",
    edit_profile: "Ndrysho profilin",
    edit_profile_subtitle: "Emri, bio, foto, qyteti",
    notifications: "Njoftimet",
    notifications_subtitle: "Menaxho njoftimet push dhe email",
    membership: "Anëtarësimi",
    membership_active_suffix: "Aktiv",
    membership_view_plans: "Shiko planet dhe përfitimet",
    language: "Gjuha",
    language_sq: "Shqip",
    language_en: "English",
    faq: "Pyetjet e shpeshta",
    contact_support: "Kontakto mbështetjen",
    privacy: "Privatësia",
    privacy_subtitle: "Politikat dhe të dhënat e tua",
    terms: "Kushtet e shërbimit",
    sign_out: "Dilni nga llogaria",
    delete_account: "Fshij llogarinë",
    delete_account_subtitle: "Fshi përgjithmonë të gjitha të dhënat tuaja",
    edit_profile_view: "Ndrysho profilin",
  },

  messages: {
    title: "Mesazhet",
    write_placeholder: "Shkruaj një mesazh…",
    start_conversation: "Filloni bisedën",
    message_seller: "Shkruaj shitësit",
    prefill_greeting: "Përshëndetje! A është ende në dispozicion?",
  },
} as const;

export type TranslationSchema = typeof sq;
