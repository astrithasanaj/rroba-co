export type Gender = "Femra" | "Meshkuj" | "Fëmijë";
export type Subcategory =
  | "Veshje"
  | "Këpucë"
  | "Çanta"
  | "Aksesorë"
  | "Vintage"
  | "Designer"
  | "Vajza"
  | "Djem";

export interface Product {
  id: string;
  title: string;
  brand: string;
  price: number;
  size: string;
  condition: string;
  color: string;
  city: string;
  gender: Gender;
  category: Subcategory;
  image: string;
  images?: string[];
  liked?: boolean;
  description: string;
  seller: {
    name: string;
    avatar: string;
    rating: number;
    listings: number;
    verified?: boolean;
  };
  tag?: "new" | "trending";
}

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

export const products: Product[] = [
  {
    id: "1",
    title: "Blazer i zi Zara",
    brand: "Zara",
    price: 35,
    size: "M",
    condition: "Shumë i mirë",
    color: "E zezë",
    city: "Prishtinë",
    gender: "Femra",
    category: "Veshje",
    image: u("photo-1591047139829-d91aecb6caea"),
    description:
      "Blazer elegant nga Zara, i veshur vetëm një herë. Pa defekte, vjen nga shtëpia pa duhan.",
    seller: {
      name: "Erza M.",
      avatar: u("photo-1494790108377-be9c29b29330"),
      rating: 4.9,
      listings: 23,
      verified: true,
    },
    tag: "new",
  },
  {
    id: "2",
    title: "Nike Air Max 90",
    brand: "Nike",
    price: 55,
    size: "42",
    condition: "I mirë",
    color: "E bardhë",
    city: "Prishtinë",
    gender: "Meshkuj",
    category: "Këpucë",
    image: u("photo-1542291026-7eec264c27ff"),
    description: "Klasiket Air Max 90. Shenja të vogla përdorimi në shollë.",
    seller: {
      name: "Driton K.",
      avatar: u("photo-1500648767791-00dcc994a43e"),
      rating: 4.7,
      listings: 12,
    },
    tag: "trending",
  },
  {
    id: "3",
    title: "Çantë vintage lëkure",
    brand: "Vintage",
    price: 80,
    size: "Mesatare",
    condition: "I mirë",
    color: "Kafe",
    city: "Prizren",
    gender: "Femra",
    category: "Vintage",
    image: u("photo-1548036328-c9fa89d128fa"),
    description: "Çantë origjinale vintage nga vitet '80, lëkurë e vërtetë.",
    seller: {
      name: "Albulena R.",
      avatar: u("photo-1438761681033-6461ffad8d80"),
      rating: 5.0,
      listings: 41,
      verified: true,
    },
    tag: "trending",
  },
  {
    id: "4",
    title: "Vathë ari 14k",
    brand: "—",
    price: 120,
    size: "Universal",
    condition: "Si i ri",
    color: "Ari",
    city: "Tiranë",
    gender: "Femra",
    category: "Aksesorë",
    image: u("photo-1535632787350-4e68ef0ac584"),
    description: "Vathë ari 14k, vetëm provuar.",
    seller: {
      name: "Rina B.",
      avatar: u("photo-1531123897727-8f129e1688ce"),
      rating: 4.8,
      listings: 7,
    },
  },
  {
    id: "5",
    title: "Çantë Gucci Marmont",
    brand: "Gucci",
    price: 850,
    size: "Mesatare",
    condition: "Shumë i mirë",
    color: "E zezë",
    city: "Prishtinë",
    gender: "Femra",
    category: "Designer",
    image: u("photo-1584917865442-de89df76afd3"),
    description: "GG Marmont autentike me kartelë. Pa gërvishtje.",
    seller: {
      name: "Vesa H.",
      avatar: u("photo-1517841905240-472988babdf9"),
      rating: 4.9,
      listings: 18,
      verified: true,
    },
    tag: "new",
  },
  {
    id: "6",
    title: "Xhaketë fëmijësh me kapuç",
    brand: "H&M",
    price: 15,
    size: "5-6 vjeç",
    condition: "I mirë",
    color: "Blu",
    city: "Pejë",
    gender: "Fëmijë",
    category: "Djem",
    image: u("photo-1622290291468-a28f7a7dc480"),
    description: "Xhaketë e ngrohtë për dimër, e veshur një sezon.",
    seller: {
      name: "Fitore S.",
      avatar: u("photo-1487412720507-e7ab37603c6f"),
      rating: 4.6,
      listings: 9,
    },
  },
  {
    id: "7",
    title: "Xhaketë denim Levi's",
    brand: "Levi's",
    price: 40,
    size: "L",
    condition: "I mirë",
    color: "Blu",
    city: "Tiranë",
    gender: "Meshkuj",
    category: "Veshje",
    image: u("photo-1551537482-f2075a1d41f2"),
    description: "Klasik Levi's trucker jacket. Lavanderi pa zbehje.",
    seller: {
      name: "Endrit P.",
      avatar: u("photo-1633332755192-727a05c4013d"),
      rating: 4.5,
      listings: 14,
    },
    tag: "trending",
  },
  {
    id: "8",
    title: "Fund mini i kuq",
    brand: "Mango",
    price: 18,
    size: "S",
    condition: "Si i ri",
    color: "E kuqe",
    city: "Prishtinë",
    gender: "Femra",
    category: "Veshje",
    image: u("photo-1583496661160-fb5886a13d44"),
    description: "Fund mini ideal për mbrëmje.",
    seller: {
      name: "Erza M.",
      avatar: u("photo-1494790108377-be9c29b29330"),
      rating: 4.9,
      listings: 23,
      verified: true,
    },
    tag: "new",
  },
  {
    id: "9",
    title: "Fustan vajze me lule",
    brand: "Zara Kids",
    price: 12,
    size: "4 vjeç",
    condition: "Si i ri",
    color: "Rozë",
    city: "Prishtinë",
    gender: "Fëmijë",
    category: "Vajza",
    image: u("photo-1518831959646-742c3a14ebf7"),
    description: "Fustan me lule, i veshur dy herë.",
    seller: {
      name: "Fitore S.",
      avatar: u("photo-1487412720507-e7ab37603c6f"),
      rating: 4.6,
      listings: 9,
    },
  },
  {
    id: "10",
    title: "Këpucë sandale Birkenstock",
    brand: "Birkenstock",
    price: 45,
    size: "38",
    condition: "I mirë",
    color: "Kafe",
    city: "Prizren",
    gender: "Femra",
    category: "Këpucë",
    image: u("photo-1603487742131-4160ec999306"),
    description: "Arizona origjinale, rehat dhe të shëndetshme.",
    seller: {
      name: "Albulena R.",
      avatar: u("photo-1438761681033-6461ffad8d80"),
      rating: 5.0,
      listings: 41,
      verified: true,
    },
  },
];

export const getProduct = (id: string) => products.find((p) => p.id === id);
