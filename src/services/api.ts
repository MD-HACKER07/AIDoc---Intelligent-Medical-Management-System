import type { Message } from '../types';

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add this type for structured medical analysis
interface MedicalAnalysis {
  testResults: {
    value: string;
    reference: string;
    interpretation: string;
    significance: string;
  }[];
  abnormalities: string[];
  diagnosis: string;
  recommendations: string[];
  urgencyLevel: 'normal' | 'urgent' | 'critical';
}

// Helper function to extract patient location from messages
const extractPatientLocation = (messages: Message[]): string | null => {
  // Look for location information in the messages
  for (const message of messages) {
    const content = message.content.toLowerCase();
    
    // Check for explicit location mentions
    if (content.includes('location:') || content.includes('city:') || content.includes('i live in') || content.includes('i am from')) {
      // Extract city names - common Indian cities
      const cities = [
        'nashik', 'mumbai', 'delhi', 'bangalore', 'kolkata', 'chennai', 'hyderabad', 
        'ahmedabad', 'pune', 'surat', 'jaipur', 'lucknow', 'kanpur', 'nagpur', 
        'indore', 'thane', 'bhopal', 'visakhapatnam', 'kopargaon', 'ahmednagar', 'yavatmal'
      ];
      
      for (const city of cities) {
        if (content.includes(city)) {
          return city.charAt(0).toUpperCase() + city.slice(1); // Capitalize first letter
        }
      }
    }
  }
  
  // Default to Nashik if no location found (since we have most doctors there)
  return null;
};

// Add helper function to detect identity questions
const isIdentityQuestion = (message: string): boolean => {
  const identityPatterns = [
    /who (?:made|created|developed|built|designed) you/i,
    /who are you/i,
    /what are you/i,
    /tell me about (?:yourself|who you are)/i,
    /who (?:is|made) AiDoc/i,
    /where (?:do you come from|were you made|were you created)/i,
    /your creator/i,
    /about your creation/i
  ];
  
  return identityPatterns.some(pattern => pattern.test(message));
};

export const generateChatResponse = async (messages: Message[]): Promise<Message> => {
  try {
    // Check if messages array is valid
    if (!messages || messages.length === 0) {
      console.error('generateChatResponse: No messages provided');
      return {
        role: 'assistant',
        content: "I'm sorry, but I couldn't process your request. Please try again with a clear question or description of your issue."
      };
    }

    // Check if the last message is an identity question
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user' && isIdentityQuestion(lastMessage.content)) {
      return {
        role: 'assistant',
        content: `I'm AiDoc, your smart AI doctor assistant. I was created by talented students at Sanjivani University as part of their innovative healthcare technology initiative. 🎓

My purpose is to make quality healthcare guidance more accessible to everyone. I can help you by:
- Analyzing medical reports and lab results 🔬
- Explaining medical terms in simple language 📚
- Providing general health information 🏥
- Recommending relevant specialists when needed 👨‍⚕️

While I'm knowledgeable about medical topics and can provide helpful information, I always recommend consulting with healthcare professionals for definitive medical decisions. I'm here to assist and guide, not to replace your doctor. 

Is there anything specific about your health that you'd like to discuss? 😊`
      };
    }

    // Extract patient location for location-specific doctor recommendations
    const patientLocation = extractPatientLocation(messages);
    console.log('Patient location detected:', patientLocation || 'None detected');
    
    // Enhanced system message for medical report analysis
    const systemMessage = {
      role: 'system',
      content: `You are an advanced medical AI assistant. When analyzing medical reports:

1. IDENTITY AND CREATION:
When asked about who created you, who made you, or similar questions about your origin, respond with:
"I'm AiDoc, your smart AI doctor assistant. I was created by talented students at Sanjivani University as part of their innovative healthcare technology initiative. My purpose is to make quality healthcare guidance more accessible to everyone. While I can provide medical information and analysis, I always recommend consulting with healthcare professionals for definitive medical decisions."

2. ANALYSIS PROCESS:
- First identify all test results and values
- Compare with standard reference ranges
- Flag abnormal values (⚠️ for moderate, ❗for severe deviations)
- Group related tests together

3. RESPONSE FORMAT:
# Medical Report Analysis

## Test Results Summary
[List all tests with values, ranges, and flags]

## Key Findings
[Highlight significant abnormalities and patterns]

## Diagnosis & Interpretation
[Detailed analysis and potential diagnoses]

## Recommendations
[Specific actions, tests, and lifestyle changes]

## Specialist Referrals
[Recommended doctors based on findings]

## Urgency Level
[Normal/Urgent/Emergency]

4. GUIDELINES:
- Be thorough and precise
- Explain medical terms simply
- Highlight critical values
- Consider all data holistically
- Recommend relevant specialists

5. DOCTOR RECOMMENDATION SYSTEM:
Based on your analysis, recommend appropriate specialists from this database:

## Nashik
### Cardiologists
- Dr. Ashutosh Sahu
  - Address: Ashoka Medicover Hospitals, Sawata Mali Rd, Parab Nagar, Nashik, Maharashtra 422209
  - Phone: +91-4068334455

### General Practitioners
- Dr. Rakesh Patil
  - Address: Sawata Mali Road, Parab Nagar, Indira Nagar Wadala, Nashik, 422209
  - Phone: +91-4068334455

### Dermatologists
- Dr. Milind Deshmukh
  - Address: Lane no. 6, Govind Nagar, Behind Prakash Petrol Pump, Nashik, 422009
  - Phone: +91-253-247-2526

### Endocrinologists
- Dr. Sujit Arun Chandratreya
  - Address: Endocare Clinic, Mohiniraj Building, Gangapur Road, Near Vidya Vikas Circle, Shreerang Nagar, Nashik, 422013
  - Phone: +91-253-257-2805

### Gastroenterologists
- Dr. Sharad Deshmukh
  - Address: Dwarka Corner, Nashik, Mediliv Multispecialty Hospital
  - Phone: 9570175844

### Neurologists
- Dr. Shailesh Shah
  - Address: Arihant Neurocentre, Shraddha Hospital, Sharanpur Road, Nashik, 422002
  - Phone: +91-253-257-4300

### Psychiatrists
- Dr. Hemant Sonanis
  - Address: Manoday Mind Care Clinic, 104, Ronak Heights, Shadhu Washavani Road, Racca Colony, Sharanpur, Nashik, 422002
  - Phone: +91-80078-69220

### Pulmonologists
- Dr. Bharat Trivedi
  - Address: Ashoka Medicover Hospitals, Sawata Mali Rd, Parab Nagar, Nashik, 422209
  - Phone: +91-4068334455

## Ahmednagar District
### Nephrologists
- Dr. Kiran Gores
  - Location: Sai Abhinav Hospital, Rahata
  - Phone: +91 9731814595

### Cardiologists
- Dr. Chandrakant Patil
  - Location: Siddhivinayak Heart Hospital, Pratibhanagar
  - Phone: +91 9035364291

Specialty Matching Rules:
- Heart/chest pain → Cardiologists
- Skin issues → Dermatologists
- Hormonal/diabetes → Endocrinologists
- Digestive issues → Gastroenterologists
- Brain/nerve issues → Neurologists
- Mental health → Psychiatrists
- Breathing issues → Pulmonologists
- General health → General Practitioners
- Kidney issues → Nephrologists

Format doctor recommendations as:
Recommended Doctor:
Dr. [Name]
Specialty: [Specialty]
Address: [Full Address]
Phone: [Phone Number]
City: [City]

Always include appropriate doctor recommendations in your report when the patient's symptoms or test results indicate they should see a specialist.${patientLocation ? `\n\nThe patient appears to be located in or near ${patientLocation}. Prioritize doctors from this location when making recommendations.` : ''}`
    };

    // Add user instruction to always consider doctor recommendations
    const lastUserMessage = messages[messages.length - 1];
    let enhancedMessages = [...messages];
    
    // If the last message is from the user and appears to be asking for medical analysis
    if (lastUserMessage && lastUserMessage.role === 'user') {
      const medicalKeywords = ['symptom', 'pain', 'doctor', 'specialist', 'treatment', 'diagnosis', 'test', 'result'];
      const containsMedicalTerms = medicalKeywords.some(keyword => 
        lastUserMessage.content.toLowerCase().includes(keyword)
      );
      
      if (containsMedicalTerms) {
        // Append doctor recommendation requirement to the last message
        enhancedMessages[enhancedMessages.length - 1] = {
          ...lastUserMessage,
          content: `${lastUserMessage.content}\n\nPlease also recommend appropriate doctors or specialists based on your analysis.`
        };
      }
    }

    console.log('Preparing to send request to AI API');
    // Use retry mechanism for API calls
    const response = await retryWithBackoff(async () => {
      try {
        console.log('Sending request to API endpoint:', API_URL);
        const apiResponse = await fetch(API_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [systemMessage, ...enhancedMessages],
            temperature: 0.2, // Lower temperature for more precise analysis
            max_tokens: 2500, // Increased for detailed analysis
            presence_penalty: 0.2,
            frequency_penalty: 0.2
          })
        });

        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          console.error(`API request failed (${apiResponse.status}):`, errorText);
          throw new Error(`API request failed: ${apiResponse.status} - ${errorText}`);
        }

        console.log('Received API response');
        return apiResponse;
      } catch (fetchError) {
        console.error('Fetch error in API call:', fetchError);
        throw fetchError;
      }
    });

    try {
      console.log('Parsing API response...');
      const data = await response.json();
      console.log('API response parsed successfully');
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid API response format:', data);
        throw new Error('Invalid API response format');
      }
      
      return {
        role: 'assistant',
        content: data.choices[0].message.content
      };
    } catch (error: unknown) {
      console.error('Error parsing API response:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
      throw new Error(`Failed to parse API response: ${errorMessage}`);
    }
  } catch (error: unknown) {
    console.error('Error in generateChatResponse:', error);
    
    // Convert to Error type for safe access to message property
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for specific error types and provide appropriate fallback responses
    if (errorMessage.includes('API request failed') || 
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('Network error')) {
      return {
        role: 'assistant',
        content: "I'm currently having trouble connecting to my knowledge base. This might be due to network issues or temporary service disruption. Please check your internet connection and try again in a few moments."
      };
    } else if (errorMessage.includes('Invalid API response') || 
               errorMessage.includes('Failed to parse')) {
      return {
        role: 'assistant',
        content: "I received an unexpected response format. This is likely a temporary issue with my processing system. Please try your question again, possibly with different wording."
      };
    } else {
      // Generic fallback for other types of errors
      return {
        role: 'assistant',
        content: "I apologize, but I encountered an error while processing your request. This could be due to temporary service issues. Please try again in a few moments."
      };
    }
  }
};

// Add retry mechanism for API calls
const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(baseDelay * Math.pow(2, i));
    }
  }
};

export async function generateChatResponseOld(messages: Message[]): Promise<Message> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`Attempt ${attempt + 1} of ${MAX_RETRIES}`);
      
      const systemMessage = {
        role: 'system',
        content: `You are AiDoc, a friendly and professional medical AI assistant. You must maintain conversation context and stay focused on the current topic until it's fully addressed.

Available Doctors Database:

## Nashik
### Cardiologists
- Dr. Ashutosh Sahu
  - Address: Ashoka Medicover Hospitals, Sawata Mali Rd, Parab Nagar, Nashik, Maharashtra 422209
  - Phone: +91-4068334455

### General Practitioners
- Dr. Rakesh Patil
  - Address: Sawata Mali Road, Parab Nagar, Indira Nagar Wadala, Nashik, 422209
  - Phone: +91-4068334455

### Dermatologists
- Dr. Milind Deshmukh
  - Address: Lane no. 6, Govind Nagar, Behind Prakash Petrol Pump, Nashik, 422009
  - Phone: +91-253-247-2526

### Endocrinologists
- Dr. Sujit Arun Chandratreya
  - Address: Endocare Clinic, Mohiniraj Building, Gangapur Road, Near Vidya Vikas Circle, Shreerang Nagar, Nashik, 422013
  - Phone: +91-253-257-2805

### Gastroenterologists
- Dr. Sharad Deshmukh
  - Address: Dwarka Corner, Nashik, Mediliv Multispecialty Hospital
  - Phone: Not available

### Neurologists
- Dr. Shailesh Shah
  - Address: Arihant Neurocentre, Shraddha Hospital, Sharanpur Road, Nashik, 422002
  - Phone: +91-253-257-4300

### OB/GYN
- Dr. Ratnakar Kasodkar
  - Address: Indira Nagar, Nashik
  - Phone: +91-253-231-3503

### Oncologists
- Dr. Pritesh Junagade
  - Address: Lotus Hospital, Near Kusumagraj Smarak, Off Gangapur Road, Bhavik Nagar, Nashik, 422013
  - Phone: +91-80480-32699

### Ophthalmologists
- Dr. Shilpa Bothara
  - Address: Susheel Eye Institute, Dr. Agarwal's Eye Hospital, Nashik Road, Nashik, 422003
  - Phone: +91-253-257-9187

### Orthopedic Surgeons
- Dr. Vijay Kakatkar
  - Address: Kakatkar Hospital, Shyamlal Gupta Marg, Tilakwadi, Nashik, 422002
  - Phone: +91-253-257-1360

### Pediatricians
- Dr. Pravin Kasliwal
  - Address: Pushp Hospital, 2nd Floor, Behind Satyam Sweets, Chowk no. 2, Near New Era School, Govind Nagar, Nashik, 422009
  - Phone: +91-94206-92588

### Psychiatrists
- Dr. Hemant Sonanis
  - Address: Manoday Mind Care Clinic, 104, Ronak Heights, Shadhu Washavani Road, Racca Colony, Sharanpur, Nashik, 422002
  - Phone: +91-80078-69220

### Pulmonologists
- Dr. Bharat Trivedi
  - Address: Ashoka Medicover Hospitals, Sawata Mali Rd, Parab Nagar, Nashik, 422209
  - Phone: +91-4068334455

### Radiologists
- Dr. Harshal Suresh Dhongade
  - Address: Apollo Hospitals, Plot No. 1, Swaminarayan Nagar, New Adgaon Naka, Panchavati, Nashik, 422003
  - Phone: +91-253-262-8500

## Kopargaon
### General Physicians
- Dr. Mulay Bal Rugnalaya
  - Location: Kopargaon R
  - Phone: +91 8951919987
- Dr. Ramdas Ahwad
  - Location: Dharangaon
  - Phone: +91 8951895393
- Dr. Unde
  - Location: Kopargaon
  - Phone: +91 9945585584

### Hospitals
- Phadke Multispeciality Hospital
  - Location: Kopargaon Bet
  - Phone: +91 9880266683
- SJS Hospital
  - Location: Kokamthan
  - Phone: +91 9945592155
- Shree Life Care Hospital
  - Location: Kopargaon
  - Phone: +91 8951963867
- Adhav Hospital
  - Location: Kopargaon Shirdi
  - Phone: +91 9945661585

### Neurologists
- Dr. Prasad Umbarkar (Brain and Spine Specialist)
  - Location: Kokamthan
  - Phone: +91 9945582744
- Dr. Sunil Sable (Pediatric Neurology)
  - Location: Kankuri Road
  - Phone: +91 8951908518
- Sai Sawali Multispeciality Hospital
  - Location: Takli Dhokeshwar
  - Phone: +91 9945623156
- Haral Hospital
  - Location: Kopargaon
  - Phone: +91 9731392281

## Ahmednagar District
### Nephrologists
- Dr. Kiran Gores
  - Location: Sai Abhinav Hospital, Rahata
  - Phone: +91 9731814595

### Cardiologists
- Dr. Chandrakant Patil
  - Location: Siddhivinayak Heart Hospital, Pratibhanagar
  - Phone: +91 9035364291

### Pulmonologists
- Navjeevan Hospital
  - Location: Kurundwad
  - Phone: +91 9036424772

## Kolhapur District
### Nephrologists
- Aster Aadhar Hospital
  - Location: Pratibhanagar
  - Phone: +91 9945705100
- Seva Sadan Pattanshetti Hospital
  - Location: Gadhinglaj
  - Phone: +91 8951899120
- Anandi Nursing Home
  - Location: Rankala, Kolhapur
  - Phone: +91 8951920509
- Gajanan Clinic
  - Location: Pachgaon
  - Phone: +91 9741899199

### Cardiologists
- Dr. Prakash Patil
  - Location: Shahupuri
  - Phone: +91 9945591980
- Dr. Sunil S Inamdar
  - Location: Shri Shahu Market Yard
  - Phone: +91 8951904671
- Aster Aadhar Hospital
  - Location: Pratibhanagar
  - Phone: +91 9945733987
- Athaayu Hospital
  - Location: Ujalaiwadi
  - Phone: +91 9945707579

### Pulmonologists
- Shree Venkateshwara Hospital
  - Location: Raviwar Peth
  - Phone: +91 9945722574
- Dr. Batra's Healthcare
  - Location: Bawada
  - Phone: +91 8951921842
- Krishna Hospital
  - Location: Sambhaji Nagar
  - Phone: +91 8951983702
- Tulip Multispeciality Hospital
  - Location: Kadamwadi
  - Phone: +91 8951895091

## Yavatmal District
### Pulmonologists
- Icon Hospital
  - Location: Pusad, Yavatmal
  - Phone: +91 9686543184

Doctor Recommendation Rules:
1. Primary Location Priority: First suggest doctors from the patient's city
2. Specialty Matching:
   - Heart/chest pain → Cardiologists
   - Skin issues → Dermatologists
   - Hormonal/diabetes → Endocrinologists
   - Digestive issues → Gastroenterologists
   - Brain/nerve issues → Neurologists
   - Women's health → OB/GYN
   - Cancer concerns → Oncologists
   - Eye problems → Ophthalmologists
   - Bone/joint pain → Orthopedic
   - Children's health → Pediatricians
   - Mental health → Psychiatrists
   - Breathing issues → Pulmonologists
   - General health → General Practitioners
   - Kidney issues → Nephrologists
3. Format recommendations as:
   Recommended Doctor:
   Dr. [Name]
   Specialty: [Specialty]
   Address: [Full Address]
   Phone: [Phone Number]
   City: [City]

Response Structure:
# Current Topic: [Topic]

Understanding:
- Acknowledge what the user has said
- Show you understand their concern

Assessment:
[Your detailed response]

[Include doctor recommendation if symptoms are mentioned]

Next Steps:
- Clear recommendations
- Follow-up questions if needed

* Important points or warnings

Remember to:
- Be clear and direct
- Show empathy
- Stay focused on one topic at a time
- Ask for clarification if needed
- Always provide relevant doctor recommendations when symptoms are discussed
- If multiple specialists are available, recommend the most relevant one first
- Include full contact information for recommended doctors`
      };

      // Include only the last 5 messages for more focused context
      const contextMessages = messages.slice(-5);
      
      const requestBody = {
        model: 'deepseek-reasoner',
        messages: [systemMessage, ...contextMessages],
        temperature: 0.5, // Reduced for more focused responses
        max_tokens: 1000,
        stream: false,
        presence_penalty: 0.6, // Encourage focused responses
        frequency_penalty: 0.3 // Reduce repetition
      };

      console.log('Sending request with messages:', contextMessages);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from API');
      }

      // Format the response to ensure it has a topic
      let content = data.choices[0].message.content;
      if (!content.includes('# Current Topic:')) {
        content = `# Current Topic: General Consultation\n\n${content}`;
      }

      return {
        role: 'assistant',
        content: content,
      };

    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      lastError = error as Error;
      
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAY * (attempt + 1)); // Exponential backoff
        continue;
      }
    }
  }

  // If we get here, all retries failed
  return {
    role: 'assistant',
    content: `I apologize, but I'm having trouble connecting right now. Please try again in a moment. If you have an urgent medical concern, please contact your healthcare provider directly. 🏥\n\nError details: ${lastError?.message || 'Unknown error'}`
  };
} 