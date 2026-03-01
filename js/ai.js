/* FlavorVerse v3 · ai.js — Real Chef AI powered by Claude */
'use strict';

const ChefBot = {
  history: [],
  isTyping: false,

  SYSTEM: `You are Chef Claude, the friendly and knowledgeable AI chef assistant for FlavorVerse — a world recipe website. 

Your personality:
- Warm, enthusiastic, and encouraging about cooking
- Expert in cuisines from all over the world (Indian, Italian, Japanese, Mexican, French, Thai, Middle Eastern, Chinese, etc.)
- Give practical, actionable cooking advice
- Use occasional food emojis to stay warm but not overwhelming
- Keep responses concise (2-4 sentences usually) unless a recipe or detailed explanation is needed
- When giving recipes, use a clean format with ingredients and steps
- You know about the recipes on FlavorVerse: Chicken Biryani, Butter Chicken, Tonkotsu Ramen, Margherita Pizza, Tiramisu, Shakshuka, Pad Thai, Tacos al Pastor, Spaghetti Carbonara, and 40+ more

Topics you excel at:
- Recipe suggestions based on ingredients, dietary needs, or cuisine
- Cooking techniques (sautéing, braising, emulsifying, etc.)
- Ingredient substitutions (egg replacements, dairy-free options, etc.)
- Spice pairing and flavor profiles
- Meal planning and prep tips
- Troubleshooting cooking problems
- Nutrition and dietary advice

Always stay on topic (food, cooking, nutrition). If asked about unrelated topics, gently redirect: "I'm best at cooking questions! Ask me about recipes, techniques, or ingredients 🍳"`,

  async send(userMsg) {
    if(!userMsg.trim() || this.isTyping) return;
    this.isTyping = true;

    // Add user message
    this.addMsg('user', userMsg);
    this.history.push({ role: 'user', content: userMsg });

    // Show typing indicator
    const typingId = this.showTyping();

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: this.SYSTEM,
          messages: this.history.map(m => ({ role: m.role, content: m.content }))
        })
      });

      this.removeTyping(typingId);

      if(!response.ok) {
        const err = await response.json().catch(()=>({}));
        throw new Error(err.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();
      const reply = data.content?.find(b=>b.type==='text')?.text || 'Sorry, I could not generate a response.';

      this.history.push({ role: 'assistant', content: reply });
      this.typeMsg(reply);

    } catch(err) {
      this.removeTyping(typingId);
      console.error('Chef AI error:', err);

      // Smart fallback based on keywords
      const fallback = this.fallback(userMsg);
      this.history.push({ role: 'assistant', content: fallback });
      this.typeMsg(fallback);
    }

    this.isTyping = false;
    this.updateChips();
  },

  // Typing animation — reveals text character by character
  typeMsg(text) {
    const msgs = document.getElementById('chatMsgs');
    if(!msgs) return;

    const row = document.createElement('div');
    row.className = 'chat-msg bot';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    row.appendChild(bubble);
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;

    let i = 0;
    const speed = text.length > 200 ? 8 : 18;
    const interval = setInterval(() => {
      bubble.textContent = text.slice(0, i+1);
      i++;
      msgs.scrollTop = msgs.scrollHeight;
      if(i >= text.length) clearInterval(interval);
    }, speed);
  },

  addMsg(role, text) {
    const msgs = document.getElementById('chatMsgs');
    if(!msgs) return;
    const row = document.createElement('div');
    row.className = `chat-msg ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    row.appendChild(bubble);
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
  },

  showTyping() {
    const msgs = document.getElementById('chatMsgs');
    if(!msgs) return null;
    const id = '_ty_' + Date.now();
    const row = document.createElement('div');
    row.className = 'chat-msg bot'; row.id = id;
    row.innerHTML = '<div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div>';
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
    return id;
  },

  removeTyping(id) {
    if(id) document.getElementById(id)?.remove();
  },

  // Local fallback responses when API is unavailable
  fallback(msg) {
    const m = msg.toLowerCase();
    if(m.match(/biryani|dum|rice.*chicken/)) return "Chicken Biryani is all about the dum! 🍛 Marinate chicken in yogurt + spices for 2 hours, parboil basmati to 70%, layer with fried onions and saffron milk, then seal and steam on low for 25 minutes. The dum technique is key — never rush it!";
    if(m.match(/pasta|carbonara|spaghetti|italian/)) return "The secret to perfect pasta: always cook it al dente (1 min less than package says), and NEVER rinse — the starch is your sauce's best friend. Finish your pasta in the sauce with a splash of pasta water for that silky, restaurant texture 🍝";
    if(m.match(/curry|butter chicken|tikka/)) return "Great curry starts with patience 🧅 Brown your onions LOW and SLOW for 15-20 minutes until golden. This is the flavor foundation everything builds on. Rushing this step is the #1 reason curries taste flat!";
    if(m.match(/pizza|dough|neapolitan/)) return "Pizza tip: let your dough come to room temperature before shaping, stretch by hand (never roll — it pops the gas!), and preheat your oven as hot as it goes for 45 minutes. A pizza stone or steel makes all the difference 🍕";
    if(m.match(/ramen|tonkotsu|noodle/)) return "Tonkotsu ramen broth needs 12+ hours of boiling pork bones for that milky richness 🍜 For a quick version: chicken stock + white miso + sesame oil + fresh ginger is surprisingly close. Don't skip the toppings — a soft 6-minute egg takes it to another level!";
    if(m.match(/egg|substitute|vegan|replace/)) return "Great egg substitutes: 1 flax egg (1 tbsp ground flax + 3 tbsp water, rest 5 min) works in most baking. For binding, 3 tbsp aquafaba (chickpea liquid) works beautifully. For omelets? Silken tofu blended smooth is surprisingly good! 🥚";
    if(m.match(/spice|seasoning|flavor|bland/)) return "To fix bland food: acid (lemon juice, vinegar) brightens everything, salt brings out flavor, and a pinch of sugar balances. Always taste at the end and adjust. The most underused trick? Fresh herbs added AFTER cooking — they make flavors pop instantly! 🌿";
    if(m.match(/hello|hi|hey|good|morning|evening/)) return "Hello! I'm Chef Claude, your personal cooking assistant here at FlavorVerse 👨‍🍳 I can help with recipes, cooking techniques, ingredient substitutions, and flavor tips. What would you like to cook today?";
    if(m.match(/help|what|can you|do you/)) return "I can help with: 🍳 Recipe suggestions, cooking techniques, ingredient substitutions, spice pairings, troubleshooting dishes, meal planning, and nutrition advice. Just ask me anything food-related!";
    if(m.match(/thank|thanks/)) return "Happy to help! 🙏 Cooking is a journey — every dish teaches you something new. Feel free to ask anytime you're in the kitchen!";
    return "Great question! I'd love to help with that cooking topic. For best results, ask me about specific recipes, techniques, or ingredient substitutions and I'll give you detailed, practical advice 🍽️ What would you like to cook today?";
  },

  // Dynamic suggestion chips
  updateChips() {
    const suggestions = [
      ['How to make biryani?', 'Fix a bland curry', 'Substitute for eggs', 'Perfect pasta water'],
      ['Best spices for fish', 'Make pizza dough', 'Caramelize onions', 'Quick meal ideas'],
      ['What pairs with lamb?', 'Dairy-free baking', 'Crispy fried chicken', 'Knife skills tips'],
    ];
    const chips = document.getElementById('chatChips');
    if(!chips) return;
    const set = suggestions[Math.floor(Math.random() * suggestions.length)];
    chips.innerHTML = set.map(s=>`<button class="chip" onclick="ChefBot.quickSend('${s}')">${s}</button>`).join('');
  },

  quickSend(text) {
    const inp = document.getElementById('chatInp');
    if(inp) inp.value = text;
    this.send(text);
    if(inp) inp.value = '';
  },

  init() {
    const inp  = document.getElementById('chatInp');
    const send = document.getElementById('chatSendBtn');
    if(!inp || !send) return;

    send.addEventListener('click', ()=>{ this.send(inp.value); inp.value=''; });
    inp.addEventListener('keydown', e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); this.send(inp.value); inp.value=''; } });

    // Chips
    document.getElementById('chatChips')?.querySelectorAll('.chip').forEach(c =>
      c.addEventListener('click', ()=>this.quickSend(c.textContent))
    );

    // Welcome message with slight delay
    setTimeout(()=>{
      this.typeMsg("Hello! I'm Chef Claude 👨‍🍳 I'm powered by AI and ready to help with recipes, cooking techniques, ingredient substitutions, and anything food-related. What would you like to cook today?");
    }, 600);
  }
};

document.addEventListener('DOMContentLoaded', ()=>ChefBot.init());