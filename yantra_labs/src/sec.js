// async function startSessionAndRedirect() {
//     // 1. Define your API and redirect URLs
//     const apiEndpoint = 'https://dicomviewer.digitalclinics.ai/api/session/start';
//     const redirectBaseUrl = 'https://dicomviewer.digitalclinics.ai/dcm'; // The base URL for redirection

//     // 2. Prepare the data to send to the API
//     // This should be the actual patient data for the session
//     const sessionPayload = {
//         "mrn": "123456",
//         "patientName": "Abu Backer",
//         "age": 32,
//         "gender": "Male",
//         "consultingDoctor": "Madubala M",
//         "symptoms": "ache",
//         "admissionDate": "2025-06-24T00:00:00.000Z",
//         "files": [
//           {
//             "RecordNo": "5625001672",
//             "testName": "CT ABDOMEN",
//             "testCode": "TST001",
//             "date": "2025-07-08T00:00:00.000Z",
//             "subTests": [
//               {
//                 "name": "CT ABDOMEN SCOUT",
//                 "files": [
//                   "link"
//                 ]
//               }
//             ]
//           }
//         ]
//       }

//     try {
//       // 3. Make the API call using fetch
//       const response = await fetch(apiEndpoint, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(sessionPayload)
//       });
  
//       // Check if the request was successful
//       if (!response.ok) {
//         // Throw an error to be caught by the catch block
//         throw new Error(`API call failed with status: ${response.status}`);
//       }
  
//       // 4. Parse the JSON response to get the data
//       const data = await response.json();
  
//       // 5. Get the sessionId from the data
//       const sessionId = data.sessionId;
  
//       if (sessionId) {
//         // 6. Construct the final URL and redirect the user
//         const redirectUrl = `${redirectBaseUrl}/${sessionId}`;
//         console.log(`Redirecting to: ${redirectUrl}`);
//         window.location.href = redirectUrl; // This performs the redirect
//       } else {
//         // Handle cases where sessionId is not in the response
//         console.error("Error: sessionId not found in API response.");
//         alert("Could not start a new session. Please try again.");
//       }
  
//     } catch (error) {
//       // 7. Handle any errors from the API call
//       console.error("Failed to start session:", error);
//       alert("An error occurred while trying to start the session.");
//     }
// } 