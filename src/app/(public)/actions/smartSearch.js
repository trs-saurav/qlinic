'use server'

import { groqClient } from "@/lib/groq";
import Hospital from "@/models/hospital";
import connectDB from "@/config/db";
import { SYMPTOM_MAP } from "@/lib/symptomMap";


// CHANGE THIS:
// TO THIS:
// import { geminiModel } from "@/lib/gemini";

// AND CHANGE THE API CALL SECTION:
// Instead of groqClient.chat.completions.create({...})
// You just use: const result = await geminiModel.generateContent(prompt);


const maxDuration = 60; // Allow function to run for up to 60 seconds
const searchCache = new Map();

export async function searchHospitalsWithAI(userQuery, userLat, userLng, userCity) {
  const maxDuration = 60;
  await connectDB();
  
  const cleanQuery = userQuery.trim().toLowerCase();
  
  let analysis = {
    specialties: [], 
    isEmergency: false,
    explicitCity: null
  };

  // --- STEP 1: INSTANT LOCAL MAP ---
  let mapHit = false;
  for (const [keyword, data] of Object.entries(SYMPTOM_MAP)) {
    if (cleanQuery.includes(keyword)) {
      console.log("⚡ Map Hit:", keyword);
      analysis.specialties.push(...data.specialties);
      if (data.isEmergency) analysis.isEmergency = true;
      mapHit = true;
    }
  }

  // --- STEP 2: AI FALLBACK ---
  if (!mapHit) {
    if (searchCache.has(cleanQuery)) {
      console.log("🚀 Cache Hit:", cleanQuery);
      analysis = searchCache.get(cleanQuery);
    } 
    else if (process.env.GROQ_API_KEY) {
      try {
        const completion = await groqClient.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `Analyze medical query. Return JSON: { "specialties": string[], "isEmergency": boolean, "explicitCity": string | null }`
            },
            { role: "user", content: userQuery }
          ],
          model: "llama-3.1-8b-instant", 
          temperature: 0, 
          response_format: { type: "json_object" }
        });

        const jsonContent = completion.choices[0]?.message?.content;
        analysis = JSON.parse(jsonContent);
        searchCache.set(cleanQuery, analysis);
        console.log("🧠 AI Analysis:", analysis);
      } catch (error) {
        console.warn("⚠️ AI Failed, using text fallback");
      }
    }
  }

  // --- STEP 3: CONSTRUCT DATABASE FILTERS ---
  try {
    let searchFilters = { isActive: true };

    // Specialty & Text Logic
    if (analysis.specialties.length > 0) {
      const specialtyRegexes = analysis.specialties.map(s => {
        if (s === 'Cardiology') return /Cardiology|Cardiac|Heart/i;
        if (s === 'Orthopedics') return /Orthopedics|Bone|Joint/i;
        if (s === 'Pediatrics') return /Pediatrics|Child/i;
        return new RegExp(s, 'i');
      });

      searchFilters.$or = [
        { specialties: { $in: analysis.specialties } },
        { specialties: { $in: specialtyRegexes } },
        { name: new RegExp(userQuery, 'i') } 
      ];
    } else {
      const regex = new RegExp(userQuery, 'i');
      searchFilters.$or = [
        { name: regex },
        { 'address.city': regex },
        { specialties: regex },
        { services: regex }
      ];
    }

    // --- STEP 4: EXECUTE TIERED SEARCH ---
    let hospitals = [];
    
    // TIER 1: Explicit City Search (e.g., "Hospital in Delhi")
    // If the user or AI specified a city, we IGNORE the user's GPS radius.
    if (analysis.explicitCity) {
      console.log(`📍 Switching to Explicit City: ${analysis.explicitCity}`);
      let cityFilters = { ...searchFilters };
      // Override the OR to prioritize city match
      cityFilters['address.city'] = new RegExp(analysis.explicitCity, 'i');
      
      hospitals = await Hospital.find(cityFilters)
        .sort({ isVerified: -1, rating: -1 })
        .limit(20);
    }
    
    // TIER 2: Local 50km Search (Priority)
    // If no explicit city, use GPS to find hospitals within 50km.
    else if (userLat && userLng) {
      console.log("📍 Searching within 50km radius...");
      hospitals = await Hospital.find({
        ...searchFilters,
        'location': {
          $near: {
            $geometry: { type: 'Point', coordinates: [userLng, userLat] },
            $maxDistance: 50000 // ✅ STRICT 50km LIMIT
          }
        }
      })
      .select('name address city state logo rating totalReviews specialties location')
      .limit(20);

      // TIER 3: Global Fallback (Auto-Expand)
      // If 50km yielded NO results, we remove the limit and search everywhere.
      if (hospitals.length === 0) {
        console.log("⚠️ No local results. Expanding to Global Search...");
        hospitals = await Hospital.find({
          ...searchFilters,
          'location': {
            $near: {
              $geometry: { type: 'Point', coordinates: [userLng, userLat] },
              // ❌ NO maxDistance here (Global)
            }
          }
        })
        .select('name address city state logo rating totalReviews specialties location')
        .limit(20);
      }
    }

    // Fallback if Location is Off or DB is empty
    if (hospitals.length === 0) {
       hospitals = await Hospital.find(searchFilters)
        .sort({ isVerified: -1, rating: -1 })
        .limit(10);
    }

    return {
      success: true,
      analysis: analysis.specialties.length > 0 ? analysis : null,
      results: JSON.parse(JSON.stringify(hospitals)),
      // We pass a flag so UI can tell user if we expanded search
      isExpandedSearch: !analysis.explicitCity && userLat && hospitals.length > 0
    };

  } catch (dbError) {
    console.error("❌ DB Error:", dbError);
    return { success: false, error: "Search failed" };
  }
}