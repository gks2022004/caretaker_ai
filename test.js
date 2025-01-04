async function query(data) {
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/myshell-ai/MeloTTS-English",
        {
          headers: {
            Authorization: "Bearer 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",
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify(data),
        }
      );
  
      if (!response.ok) {
        // Try to read the error message from the response
        const errText = await response.text();
        throw new Error(
          `HTTP error! Status: ${response.status} - ${errText || "No additional info"}`
        );
      }
  
      const result = await response.blob();
      return result;
    } catch (error) {
      console.error("Error fetching TTS audio:", error);
      throw error;
    }
  }
  