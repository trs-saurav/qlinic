'use server'

import { groqClient } from "@/lib/groq";
import Hospital from "@/models/hospital";
import connectDB from "@/config/db";
import { SYMPTOM_MAP } from "@/lib/symptomMap";

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

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
    if (analysis.explicitCity) {
      console.log(`📍 Switching to Explicit City: ${analysis.explicitCity}`);
      let cityFilters = { ...searchFilters };
      cityFilters['address.city'] = new RegExp(analysis.explicitCity, 'i');
      
      hospitals = await Hospital.find(cityFilters)
        .sort({ isVerified: -1, rating: -1 })
        .limit(20);
    }
    
    // TIER 2: Local 50km Search (Priority)
    else if (userLat && userLng) {
      console.log("📍 Searching within 50km radius...");
      hospitals = await Hospital.find({
        ...searchFilters,
        'location': {
          $near: {
            $geometry: { type: 'Point', coordinates: [userLng, userLat] },
            $maxDistance: 50000
          }
        }
      })
      .select('name address city state logo rating totalReviews specialties location isVerified isEmergency contactDetails')
      .limit(20);

      // TIER 3: Global Fallback (Auto-Expand)
      if (hospitals.length === 0) {
        console.log("⚠️ No local results. Expanding to Global Search...");
        hospitals = await Hospital.find({
          ...searchFilters,
          'location': {
            $near: {
              $geometry: { type: 'Point', coordinates: [userLng, userLat] },
            }
          }
        })
        .select('name address city state logo rating totalReviews specialties location isVerified isEmergency contactDetails')
        .limit(20);
      }
    }

    // Fallback if Location is Off or DB is empty
    if (hospitals.length === 0) {
       hospitals = await Hospital.find(searchFilters)
        .sort({ isVerified: -1, rating: -1 })
        .limit(10);
    }

    // Convert Mongoose documents to plain objects and calculate distances
    const hospitalsWithDistance = hospitals.map(hospital => {
      // Convert to plain object with comprehensive ObjectId handling
      let hospitalObj;
      if (hospital.toObject) {
        // Use toJSON to get a clean object, then process it
        hospitalObj = JSON.parse(JSON.stringify(hospital));
      } else {
        hospitalObj = { ...hospital };
      }
      
      // Ensure all ObjectId-like fields are converted to strings
      const convertObjectIdFields = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        // Handle direct ObjectId
        if (obj.constructor?.name === 'ObjectId' || (obj.type === 'Buffer' && obj.data)) {
          return obj.toString();
        }
        
        // Recursively process nested objects
        for (const key in obj) {
          if (obj[key] && typeof obj[key] === 'object') {
            if (obj[key].constructor?.name === 'ObjectId' || (obj[key].type === 'Buffer' && obj[key].data)) {
              obj[key] = obj[key].toString();
            } else if (Array.isArray(obj[key])) {
              obj[key] = obj[key].map(item => 
                (item && typeof item === 'object' && (item.constructor?.name === 'ObjectId' || (item.type === 'Buffer' && item.data))) 
                  ? item.toString() 
                  : convertObjectIdFields(item)
              );
            } else {
              obj[key] = convertObjectIdFields(obj[key]);
            }
          }
        }
        return obj;
      };
      
      hospitalObj = convertObjectIdFields(hospitalObj);
      
      // Calculate distance if we have user location and hospital location
      if (userLat && userLng && hospitalObj.location?.coordinates) {
        const [hospitalLng, hospitalLat] = hospitalObj.location.coordinates;
        const distance = calculateDistance(
          parseFloat(userLat), 
          parseFloat(userLng), 
          hospitalLat, 
          hospitalLng
        );
        hospitalObj.distance = Math.round(distance * 100) / 100;
      } else {
        hospitalObj.distance = null;
      }
      
      // Remove problematic fields that might cause serialization issues
      const fieldsToRemove = [
        '__v', 'createdAt', 'updatedAt', 'verificationRequest', 
        'stats', 'password', 'resetPasswordToken', 'resetPasswordExpires'
      ];
      
      fieldsToRemove.forEach(field => delete hospitalObj[field]);
      
      return hospitalObj;
    });

    return {
      success: true,
      analysis: analysis.specialties.length > 0 ? analysis : null,
      results: hospitalsWithDistance,
      isExpandedSearch: !analysis.explicitCity && userLat && hospitals.length > 0
    };

  } catch (dbError) {
    console.error("❌ DB Error:", dbError);
    return { success: false, error: "Search failed" };
  }
}