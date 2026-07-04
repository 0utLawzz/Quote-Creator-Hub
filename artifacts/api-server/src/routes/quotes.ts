import { Router } from "express";

const router = Router();

const QUOTE_BANK: Record<string, Array<{ quote: string; author: string }>> = {
  motivation: [
    { quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { quote: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { quote: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
    { quote: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
    { quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { quote: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { quote: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  ],
  success: [
    { quote: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau" },
    { quote: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
    { quote: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
    { quote: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { quote: "If you really look closely, most overnight successes took a long time.", author: "Steve Jobs" },
    { quote: "The road to success and the road to failure are almost exactly the same.", author: "Colin R. Davis" },
    { quote: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
    { quote: "There are no limits to what you can accomplish, except the limits you place on your own thinking.", author: "Brian Tracy" },
  ],
  love: [
    { quote: "The best thing to hold onto in life is each other.", author: "Audrey Hepburn" },
    { quote: "Love is composed of a single soul inhabiting two bodies.", author: "Aristotle" },
    { quote: "We loved with a love that was more than love.", author: "Edgar Allan Poe" },
    { quote: "Being deeply loved by someone gives you strength, while loving someone deeply gives you courage.", author: "Lao Tzu" },
    { quote: "You know you're in love when you can't fall asleep because reality is finally better than your dreams.", author: "Dr. Seuss" },
    { quote: "Love is not about how many days, months, or years you have been together. It's all about how much you love each other every single day.", author: "Unknown" },
    { quote: "The giving of love is an education in itself.", author: "Eleanor Roosevelt" },
  ],
  wisdom: [
    { quote: "The unexamined life is not worth living.", author: "Socrates" },
    { quote: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
    { quote: "It is not the strongest of the species that survive, but the most adaptable.", author: "Charles Darwin" },
    { quote: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.", author: "Rumi" },
    { quote: "The measure of intelligence is the ability to change.", author: "Albert Einstein" },
    { quote: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
    { quote: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
    { quote: "Wisdom is not a product of schooling but of the lifelong attempt to acquire it.", author: "Albert Einstein" },
  ],
  friendship: [
    { quote: "A real friend is one who walks in when the rest of the world walks out.", author: "Walter Winchell" },
    { quote: "Friendship is born at the moment when one person says to another, 'What! You too? I thought I was the only one.'", author: "C.S. Lewis" },
    { quote: "A friend is someone who knows all about you and still loves you.", author: "Elbert Hubbard" },
    { quote: "Good friends help you to find important things when you have lost them.", author: "Richelle E. Goodrich" },
    { quote: "The only way to have a friend is to be one.", author: "Ralph Waldo Emerson" },
    { quote: "Friends are the family we choose for ourselves.", author: "Edna Buchanan" },
  ],
  courage: [
    { quote: "Courage is not the absence of fear, but the triumph over it.", author: "Nelson Mandela" },
    { quote: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
    { quote: "Bravery is not the absence of fear but the forging ahead despite being afraid.", author: "Robert Liparulo" },
    { quote: "Life shrinks or expands in proportion to one's courage.", author: "Anais Nin" },
    { quote: "Courage is the most important of all the virtues because without courage, you can't practice any other virtue consistently.", author: "Maya Angelou" },
    { quote: "Be courageous. It's one of the only places left uncrowded.", author: "Anita Roddick" },
  ],
  life: [
    { quote: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
    { quote: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
    { quote: "In the end, it's not the years in your life that count. It's the life in your years.", author: "Abraham Lincoln" },
    { quote: "Life is either a daring adventure or nothing at all.", author: "Helen Keller" },
    { quote: "You only live once, but if you do it right, once is enough.", author: "Mae West" },
    { quote: "Many of life's failures are people who did not realize how close they were to success when they gave up.", author: "Thomas A. Edison" },
    { quote: "The good life is one inspired by love and guided by knowledge.", author: "Bertrand Russell" },
  ],
  mindfulness: [
    { quote: "The present moment is the only moment available to us, and it is the door to all moments.", author: "Thich Nhat Hanh" },
    { quote: "Peace comes from within. Do not seek it without.", author: "Buddha" },
    { quote: "You can't stop the waves, but you can learn to surf.", author: "Jon Kabat-Zinn" },
    { quote: "Wherever you are, be all there.", author: "Jim Elliot" },
    { quote: "In today's rush, we all think too much, seek too much, want too much and forget about the joy of just being.", author: "Eckhart Tolle" },
    { quote: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha" },
    { quote: "The quieter you become, the more you can hear.", author: "Ram Dass" },
  ],
};

const HASHTAGS: Record<string, string> = {
  motivation: "#motivation #hustle #grind #mindset #success #inspired #goals #levelup #workhard",
  success: "#success #entrepreneur #winning #ambition #goals #growth #leadership #achieve",
  love: "#love #relationships #heart #soulmate #romance #connection #partnership",
  wisdom: "#wisdom #knowledge #truth #philosophy #growth #learning #insight #perspective",
  friendship: "#friendship #friends #bonds #loyalty #squad #bff #community #tribe",
  courage: "#courage #brave #fearless #strength #warrior #resilient #bold #confidence",
  life: "#life #living #journey #purpose #meaning #authentic #experience #gratitude",
  mindfulness: "#mindfulness #meditation #peace #present #zen #calm #breathe #awareness",
};

router.post("/quotes/generate", (req, res) => {
  const { category, mood, customPrompt } = req.body as { category: string; mood?: string; customPrompt?: string };
  
  const normalizedCategory = (category || "motivation").toLowerCase();
  const bank = QUOTE_BANK[normalizedCategory] || QUOTE_BANK.motivation;
  const picked = bank[Math.floor(Math.random() * bank.length)];
  const hashtags = HASHTAGS[normalizedCategory] || HASHTAGS.motivation;

  res.json({
    quote: picked.quote,
    author: picked.author,
    category: normalizedCategory,
    suggestedHashtags: hashtags,
  });
});

export default router;
