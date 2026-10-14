/**
 * SAMPLE reviews — written to show how the reviews section looks before the shop has real ones.
 * They are labelled as samples on the page, never go into search-engine review data,
 * and disappear automatically once the first real review is approved in Admin → Reviews.
 * Switch them off completely with NEXT_PUBLIC_SAMPLE_REVIEWS=off (do this before launch).
 */
export type SampleReview = {
  id: string;
  name: string;
  place: string;
  rating: number;
  title: string;
  body: string;
  scent: string; // product handle
  when: string; // shown as-is
};

export const SAMPLE_REVIEWS_ON = (process.env.NEXT_PUBLIC_SAMPLE_REVIEWS || "on") !== "off";

export const sampleReviews: SampleReview[] = [
  { id: "s1", name: "Amelia R.", place: "Manchester", rating: 5, scent: "baccara-rouge", when: "2 weeks ago", title: "Honestly can't tell the difference", body: "I've owned the original for years and sprayed them side by side. The dry-down is so close my sister couldn't pick which was which. Still on my scarf the next morning." },
  { id: "s2", name: "Daniel K.", place: "Leeds", rating: 5, scent: "eventus", when: "3 weeks ago", title: "My new everyday scent", body: "Fresh pineapple opening, then that smoky birch. Lasted my whole shift and I got two compliments before lunch. For the price it's a no-brainer." },
  { id: "s3", name: "Priya S.", place: "Birmingham", rating: 5, scent: "delina-rose", when: "1 month ago", title: "Smells like a bouquet", body: "Lychee and rose, soft and pretty without being sickly. The gift box it came in is gorgeous — I'm keeping it on my dressing table." },
  { id: "s4", name: "James O.", place: "London", rating: 5, scent: "royal-oud", when: "1 month ago", title: "Rich without being heavy", body: "Proper smoky oud and sandalwood. Two sprays is plenty — the projection is strong. Arrived in two days, beautifully packed." },
  { id: "s5", name: "Sophie T.", place: "Bristol", rating: 4, scent: "lost-berry", when: "5 weeks ago", title: "Sweet cherry heaven", body: "Gorgeous boozy cherry and almond. It's quite sweet so I save it for evenings, but it lasts all night. Would love a travel size." },
  { id: "s6", name: "Mohammed A.", place: "Bradford", rating: 5, scent: "midnight-elixir", when: "6 weeks ago", title: "Date night sorted", body: "Warm, spicy and a bit sweet. My wife keeps stealing my jumper. I've already ordered a second bottle in the bundle." },
  { id: "s7", name: "Chloe W.", place: "Glasgow", rating: 5, scent: "symphonie", when: "2 months ago", title: "Bright and uplifting", body: "Grapefruit and ginger — it's like sunshine in a bottle. Perfect for the office, people actually ask what I'm wearing." },
  { id: "s8", name: "Tom H.", place: "Newcastle", rating: 5, scent: "kings-code", when: "2 months ago", title: "Clean, sharp, lasts", body: "Blood orange and sage, then cedar. Smells expensive. Still there after the gym, which surprised me." },
  { id: "s9", name: "Hannah L.", place: "Cardiff", rating: 5, scent: "angels-pour", when: "2 months ago", title: "Cosy cognac hug", body: "Cinnamon, praline and something boozy underneath. It's my winter signature now. The bundle deal made it silly cheap." },
  { id: "s10", name: "Ravi P.", place: "Leicester", rating: 4, scent: "imagine", when: "3 months ago", title: "Fresh and refined", body: "Citrus and black tea, very clean. Lasts well on clothes, a little less on skin in hot weather. Great office scent." },
  { id: "s11", name: "Grace M.", place: "Edinburgh", rating: 5, scent: "empress-bloom", when: "3 months ago", title: "Fruity, floral and classy", body: "Green apple, peach and rose. Feminine without being too much. Bought it as a gift and ended up keeping it for myself." },
  { id: "s12", name: "Liam B.", place: "Liverpool", rating: 5, scent: "althaire", when: "3 months ago", title: "Vanilla done right", body: "Smooth vanilla with a bit of spice. Not cheap-smelling at all. Projection is great for the first few hours then sits close." },
  { id: "s13", name: "Fatima Z.", place: "Luton", rating: 5, scent: "noir-orchid", when: "3 months ago", title: "Dark and mysterious", body: "Rich, chocolatey, a little smoky. Perfect for evenings out. Lasted from 7pm until I woke up the next day." },
  { id: "s14", name: "Ollie J.", place: "Brighton", rating: 5, scent: "royal-musk", when: "4 months ago", title: "Like fresh air", body: "Green, clean and watery — exactly what I wanted for summer. Light but it doesn't vanish. Lovely packaging too." },
  { id: "s15", name: "Megan D.", place: "Sheffield", rating: 5, scent: "amber-levant", when: "4 months ago", title: "Incense and amber", body: "Warm resin and incense, gets better as it settles. So many compliments at a wedding. Can't believe the price." },
  { id: "s16", name: "Kwame A.", place: "Nottingham", rating: 5, scent: "nomad", when: "4 months ago", title: "Unique and addictive", body: "Raspberry and oud is such an unusual mix but it works. People notice it. Delivery was quick and tracked." },
  { id: "s17", name: "Ellie F.", place: "Southampton", rating: 4, scent: "eventus", when: "4 months ago", title: "Bought for my husband", body: "He loves it and wears it every day. Took a star off only because we wish it came in a bigger bottle!" },
  { id: "s18", name: "Hassan R.", place: "Birmingham", rating: 5, scent: "baccara-rouge", when: "5 months ago", title: "Best value on the market", body: "I've tried a lot of 'inspired by' brands. This one has the strongest projection by far. Third bottle now." },
  { id: "s19", name: "Lucy G.", place: "Oxford", rating: 5, scent: "delina-rose", when: "5 months ago", title: "Gift box is a lovely touch", body: "Ordered three in the bundle for Christmas presents — each looked like a luxury gift. Everyone was impressed." },
  { id: "s20", name: "Zain H.", place: "Manchester", rating: 5, scent: "midnight-elixir", when: "5 months ago", title: "Beast mode", body: "Two sprays and it lasts all day. Spicy, warm, a bit sweet. My go-to for nights out now." },
];
