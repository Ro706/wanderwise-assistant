import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const travelModeDescriptions = {
  bus: "Bus travel - focus on bus tickets, bus routes, bus operators, and road travel options. Do NOT suggest flights or train tickets.",
  train: "Train travel - focus on train tickets, railway routes, train classes, and rail travel options. Do NOT suggest flights or bus tickets.",
  plane: "Air travel - focus on flight tickets, airlines, airports, and air travel options. Do NOT suggest trains or bus tickets.",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language, tradeoffPreference, travelMode } = await req.json();

    const modeRestriction = travelMode && travelModeDescriptions[travelMode as keyof typeof travelModeDescriptions]
      ? `\n\nIMPORTANT TRAVEL MODE RESTRICTION: The user has selected ${travelMode.toUpperCase()} as their preferred travel mode. ${travelModeDescriptions[travelMode as keyof typeof travelModeDescriptions]}\n\nALL your travel recommendations MUST be for ${travelMode} only. If the user asks about other travel modes, politely remind them their current mode is set to ${travelMode} and provide ${travelMode} options instead.`
      : '';

    // Helper function to generate booking URLs
    const getBookingUrls = (travelMode: string, from: string, to: string) => {
      const fromEncoded = encodeURIComponent(from || 'Delhi');
      const toEncoded = encodeURIComponent(to || 'Mumbai');
      const today = new Date().toISOString().split('T')[0];
      
      if (travelMode === 'bus') {
        return {
          transport: `https://www.redbus.in/bus-tickets/${fromEncoded.toLowerCase()}-to-${toEncoded.toLowerCase()}`,
          hotel: `https://www.booking.com/searchresults.html?ss=${toEncoded}`,
          restaurant: `https://www.zomato.com/${toEncoded.toLowerCase()}/restaurants`,
        };
      } else if (travelMode === 'train') {
        return {
          transport: `https://www.irctc.co.in/nget/train-search`,
          hotel: `https://www.booking.com/searchresults.html?ss=${toEncoded}`,
          restaurant: `https://www.zomato.com/${toEncoded.toLowerCase()}/restaurants`,
        };
      } else {
        return {
          transport: `https://www.makemytrip.com/flight/search?itinerary=${fromEncoded}-${toEncoded}-${today}&tripType=O&paxType=A-1_C-0_I-0&cabin=E`,
          hotel: `https://www.booking.com/searchresults.html?ss=${toEncoded}`,
          restaurant: `https://www.zomato.com/${toEncoded.toLowerCase()}/restaurants`,
        };
      }
    };

    const transportType = travelMode === 'bus' ? 'Bus' : travelMode === 'train' ? 'Train' : 'Flight';

    const systemPrompt = `You are an AI Travel Copilot assistant for travel agents. You help agents plan travel itineraries for their customers.

Language: Respond in ${language || 'English'}. Adapt your responses to be culturally appropriate.

Current preference setting: ${tradeoffPreference || 50}% (0 = Budget focused, 50 = Balanced, 100 = Comfort focused)
${modeRestriction}

CRITICAL FORMATTING RULES:
1. DO NOT use asterisks (*) or markdown bold/italic formatting
2. DO NOT use bullet points with asterisks
3. Use plain text with clear section headers
4. Use numbers (1, 2, 3) or dashes (-) for lists
5. Keep responses clean and easy to read
6. Include ACTUAL clickable booking URLs in your response

Your capabilities:
1. Understand travel requirements (destinations, dates, number of travelers, special needs)
2. Suggest optimized travel options based on the preference slider
3. Explain WHY you recommend each option (price advantage, comfort score, safety)
4. Flag risks (short layovers, red-eye travel, visa requirements)
5. Remember customer preferences mentioned in the conversation

BOOKING URLS TO USE:
- For Bus: https://www.redbus.in/bus-tickets/[origin]-to-[destination]
- For Train: https://www.irctc.co.in/nget/train-search
- For Flights: https://www.makemytrip.com/flights/
- For Hotels: https://www.booking.com/searchresults.html?ss=[destination]
- For Restaurants: https://www.zomato.com/[destination]/restaurants

RESPONSE FORMAT (FOLLOW THIS EXACTLY):

${transportType} Travel Recommendations: [Origin] to [Destination]

---

OPTION 1: BUDGET FRIENDLY
Confidence Score: [70-85]%

${transportType} Details:
- Operator/Airline: [name]
- Timing: [departure time - arrival time]
- Duration: [Xh Xm]
- Price: ₹[amount] per person

Hotel Suggestion:
- Name: [budget hotel name]
- Rating: [X.X] stars
- Price: ₹[amount] per night

Why This Option Works:
- [Reason 1 - e.g., Best value for money]
- [Reason 2 - e.g., Good timing for day travelers]
- [Reason 3 - e.g., Includes breakfast]

Risks to Consider:
- [Any concerns like red-eye timing, basic amenities, etc.]

Book Now:
${transportType}: ${travelMode === 'bus' ? 'https://www.redbus.in/bus-tickets/' : travelMode === 'train' ? 'https://www.irctc.co.in/nget/train-search' : 'https://www.makemytrip.com/flights/'}
Hotel: https://www.booking.com/
Restaurants: https://www.zomato.com/

---

OPTION 2: BALANCED VALUE
Confidence Score: [75-90]%
[Same format as Option 1]

---

OPTION 3: PREMIUM COMFORT
Confidence Score: [80-95]%
[Same format as Option 1]

---

MY RECOMMENDATION:
Based on your preferences, I recommend [Option X] because [specific reason]. This option provides [key benefit].

---

How would you rate this response? (1-5 stars) Please share any feedback or changes you'd like!`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

    return new Response(JSON.stringify({ message: assistantMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in travel-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
